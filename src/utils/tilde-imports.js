// @ts-check

// eslint-disable-next-line unicorn/prefer-node-protocol -- Parcel doesn't support protocol imports
const path = require('path');
const { getMonorepoDirpath } = require('@tunnel/get-monorepo');

const monorepoDirpath = getMonorepoDirpath(__dirname);
if (monorepoDirpath === undefined) {
	throw new Error('Could not get monorepo directory')
}

/**
	@param {object} args
	@param {string} args.importSpecifier
	@param {string} args.importerFilePath
	@returns {string}
*/
exports.expandTildeImport = ({ importSpecifier, importerFilePath }) => {
	if (!importSpecifier.startsWith('~')) {
		return importSpecifier;
	}

	const packagePathslug = path
		.relative(monorepoDirpath, importerFilePath)
		// Get the first `<package>/<path>` segment.
		.split('/')
		.slice(0, 2)
		.join('/');

	// If the module starts with `~/`, it is relative to the `src/` folder of the package.
	if (importSpecifier.startsWith('~/')) {
		return path.join(
			monorepoDirpath,
			packagePathslug,
			importSpecifier.replace('~/', 'src/')
		);
	} else {
		return path.join(
			monorepoDirpath,
			packagePathslug,
			importSpecifier.replace('~', '')
		);
	}
};
