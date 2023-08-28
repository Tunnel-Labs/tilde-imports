// @ts-check

// eslint-disable-next-line unicorn/prefer-node-protocol -- Parcel doesn't support protocol imports
const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const glob = require('fast-glob');
const Trie = /** @type {typeof import('mnemonist/trie').default} */ (
	/** @type {unknown} */ (require('mnemonist/trie'))
);

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
			path.join(packageDirpathGlob, 'package.json')
		)
	);

	const packageDirpaths = Trie.from(
		packageJsonFilepathsArray.map((packageJsonFilepath) =>
			path.dirname(packageJsonFilepath)
		)
	);

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

		const importerPackageDirpaths = packageDirpaths.find(importerFilePath);

		/** @type {string} */
		let importerPackageDirpath;
		if (importerPackageDirpaths.length === 0) {
			throw new Error(
				`Could not find package root for importer file "${importerFilePath}"`
			);
		} else if (importerPackageDirpaths.length > 1) {
			console.warn(
				'Found multiple package.json files for importer file "%s": %s',
				importerFilePath,
				importerPackageDirpaths.join(', '),
				'Using the first one.'
			);
		}

		importerPackageDirpath = /** @type {string} */ (importerPackageDirpaths[0]);

		// If the module starts with `~/`, it is relative to the `src/` folder of the package.
		if (importSpecifier.startsWith('~/')) {
			return path.join(
				importerPackageDirpath,
				importSpecifier.replace('~/', 'src/')
			);
		} else {
			return path.join(
				importerPackageDirpath,
				importSpecifier.replace('~', '')
			);
		}
	};
};
