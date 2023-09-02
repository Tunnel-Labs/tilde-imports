// @ts-check

const path = require('pathe');
const fs = require('fs');
const yaml = require('yaml');
const glob = require('fast-glob');
const Trie = require('./trie.js');

/**
	@param {object} args
	@param {string} args.monorepoDirpath
	@returns
*/
module.exports.createTildeImportExpander = ({ monorepoDirpath }) => {
	const pnpmWorkspaceFilepath = path.join(
		monorepoDirpath,
		'pnpm-workspace.yaml'
	);
	if (!fs.existsSync(pnpmWorkspaceFilepath)) {
		throw new Error(
			`Could not find pnpm-workspace.yaml file at "${pnpmWorkspaceFilepath}"`
		);
	}

	const packageDirpathGlobs = yaml.parse(
		fs.readFileSync(pnpmWorkspaceFilepath, 'utf8')
	)?.packages;

	if (!packageDirpathGlobs) {
		throw new Error(
			`Could not find "packages" property in pnpm-workspace.yaml file at "${pnpmWorkspaceFilepath}"`
		);
	}

	const packageJsonFilepathsArray = glob.sync(
		packageDirpathGlobs.map((/** @type {string} */ packageDirpathGlob) =>
			path.join(monorepoDirpath, packageDirpathGlob, 'package.json')
		),
		{ absolute: true }
	);

	const packageDirpathsTrie = new Trie(Array);
	for (const packageJsonFilepath of packageJsonFilepathsArray) {
		let normalizedPackageJsonFilepath = path.normalize(packageJsonFilepath);

		if (packageJsonFilepath.startsWith('/')) {
			normalizedPackageJsonFilepath = normalizedPackageJsonFilepath.slice(1);
		}

		packageDirpathsTrie.add(
			path.dirname(packageJsonFilepath).split('/')
		);
	}

	/**
		@param {object} args
		@param {string} args.importSpecifier
		@param {string} args.importerFilepath
		@returns {string}
	*/
	return function expandTildeImport({ importSpecifier, importerFilepath }) {
		if (!importSpecifier.startsWith('~')) {
			return importSpecifier;
		}

		let normalizedImporterFilepath = path.normalize(importerFilepath);
		if (normalizedImporterFilepath.startsWith('/')) {
			normalizedImporterFilepath = normalizedImporterFilepath.slice(1);
		}

		const importerPackageDirpathPartArrays = packageDirpathsTrie.getPrefixes(
			normalizedImporterFilepath.split('/')
		);

		/** @type {string} */
		let importerPackageDirpathPartArray;
		if (importerPackageDirpathPartArrays.length === 0) {
			throw new Error(
				`Could not find package root for importer file "${importerFilepath}"`
			);
		} else if (importerPackageDirpathPartArrays.length > 1) {
			console.warn(
				'Found multiple package.json files for importer file "%s": %s',
				importerFilepath,
				importerPackageDirpathPartArrays
					.map((importerPackageDirpathPartArray) =>
						importerPackageDirpathPartArray.join('/')
					)
					.join(', '),
				'Using the first one.'
			);
		}

		importerPackageDirpathPartArray = /** @type {string} */ (
			importerPackageDirpathPartArrays[0]
		);

		// If the module starts with `~/`, it is relative to the `src/` folder of the package.
		if (importSpecifier.startsWith('~/')) {
			return path.join(
				'/',
				...importerPackageDirpathPartArray,
				importSpecifier.replace('~/', 'src/')
			);
		} else {
			return path.join(
				'/',
				...importerPackageDirpathPartArray,
				importSpecifier.replace('~', '')
			);
		}
	};
};
