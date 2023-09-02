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
		packageDirpathsTrie.add(
			path.dirname(packageJsonFilepath).slice(1).split('/')
		);
	}

	/**
		@param {object} args
		@param {string} args.importSpecifier
		@param {string} args.importerFilePath
		@returns {string}
	*/
	return function expandTildeImport({ importSpecifier, importerFilePath }) {
		if (!importSpecifier.startsWith('~')) {
			return importSpecifier;
		}

		let normalizedImporterFilePath = path.normalize(importerFilePath);
		if (normalizedImporterFilePath.startsWith('/')) {
			normalizedImporterFilePath = normalizedImporterFilePath.slice(1);
		}

		const importerPackageDirpathPartArrays = packageDirpathsTrie.getPrefixes(
			normalizedImporterFilePath.split('/')
		);

		/** @type {string} */
		let importerPackageDirpathPartArray;
		if (importerPackageDirpathPartArrays.length === 0) {
			throw new Error(
				`Could not find package root for importer file "${importerFilePath}"`
			);
		} else if (importerPackageDirpathPartArrays.length > 1) {
			console.warn(
				'Found multiple package.json files for importer file "%s": %s',
				importerFilePath,
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
