import path from 'pathe';
import fs from 'node:fs';
import yaml from 'yaml';
import glob from 'fast-glob';
import Trie from './trie.js';

export const createTildeImportExpander = ({
	monorepoDirpath
}: {
	monorepoDirpath: string;
}) => {
	let packageDirpathGlobs: string[];
	const partCaseMap: Record<number, Map<string, string>> = {};

	const packageJsonFilepath = path.join(monorepoDirpath, 'package.json');

	if (!fs.existsSync(packageJsonFilepath)) {
		throw new Error(
			`Could not find package.json file at "${packageJsonFilepath}"`
		);
	}

	const packageJsonWorkspaces = JSON.parse(
		fs.readFileSync(packageJsonFilepath, 'utf8')
	).workspaces;

	if (packageJsonWorkspaces !== undefined) {
		packageDirpathGlobs = packageJsonWorkspaces;
	} else {
		const pnpmWorkspaceFilepath = path.join(
			monorepoDirpath,
			'pnpm-workspace.yaml'
		);

		if (!fs.existsSync(pnpmWorkspaceFilepath)) {
			throw new Error(
				`Monorepo package.json does not include "workspaces" property and could not find pnpm-workspace.yaml file at "${pnpmWorkspaceFilepath}"`
			);
		}

		const pnpmWorkspacePackages = yaml.parse(
			fs.readFileSync(pnpmWorkspaceFilepath, 'utf8')
		)?.packages;

		if (pnpmWorkspacePackages === undefined) {
			throw new Error(
				`Monorepo package.json does not include "workspaces" property and could not find "packages" property in pnpm-workspace.yaml file at "${pnpmWorkspaceFilepath}"`
			);
		}

		packageDirpathGlobs = pnpmWorkspacePackages;
	}

	const packageJsonFilepathsArray = glob.sync(
		packageDirpathGlobs.map((packageDirpathGlob: string) =>
			path.join(monorepoDirpath, packageDirpathGlob, 'package.json')
		),
		{ absolute: true }
	);

	const packageDirpathsTrie = new Trie(Array);
	for (const packageJsonFilepath of packageJsonFilepathsArray) {
		let normalizedPackageJsonFilepath = path.normalize(packageJsonFilepath);

		if (normalizedPackageJsonFilepath.startsWith('/')) {
			normalizedPackageJsonFilepath = normalizedPackageJsonFilepath.slice(1);
		}

		const normalizedPackageDirpath = path.dirname(
			normalizedPackageJsonFilepath
		);

		const normalizedParts = normalizedPackageDirpath.toLowerCase().split('/');
		const casedParts = normalizedPackageDirpath.split('/');

		for (const [partIndex, part] of normalizedParts.entries()) {
			(partCaseMap[partIndex] ??= new Map()).set(part, casedParts[partIndex]!);
		}

		packageDirpathsTrie.add(normalizedParts);
	}

	return function expandTildeImport({
		importSpecifier,
		importerFilepath
	}: {
		importSpecifier: string;
		importerFilepath: string;
	}): string {
		if (!importSpecifier.startsWith('~')) {
			return importSpecifier;
		}

		let normalizedImporterFilepath = path
			.normalize(importerFilepath)
			.toLowerCase();

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

		importerPackageDirpathPartArray = importerPackageDirpathPartArrays[0];

		// If the module starts with `~/`, it is relative to the `src/` folder of the package.
		if (importSpecifier.startsWith('~/')) {
			return path.join(
				'/',
				...importerPackageDirpathPartArray.map((part: string, index: number) =>
					(partCaseMap[index] ??= new Map()).has(part)
						? partCaseMap[index]!.get(part)
						: part
				),
				importSpecifier.replace('~/', 'src/')
			);
		} else {
			return path.join(
				'/',
				...importerPackageDirpathPartArray.map((part: string, index: number) =>
					(partCaseMap[index] ??= new Map()).has(part)
						? partCaseMap[index]!.get(part)
						: part
				),
				importSpecifier.replace('~', '')
			);
		}
	};
};
