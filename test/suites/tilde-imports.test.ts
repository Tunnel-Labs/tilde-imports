import { createTildeImportExpander } from '~/index.js';
import { test, expect, describe } from 'vitest';
import { join } from 'desm';
import path from 'pathe';

const fixturesDirpath = join(import.meta.url, '../fixtures');

describe('expands tilde imports correctly', () => {
	test('expands tilde imports from fixtures/basic-project', () => {
		const basicProjectDirpath = path.join(fixturesDirpath, 'basic-project');
		const expandTildeImport = createTildeImportExpander({
			monorepoDirpath: basicProjectDirpath
		});

		expect(
			expandTildeImport({
				importerFilePath: path.join(basicProjectDirpath, 'src/index.js'),
				importSpecifier: '~/other.js'
			})
		).toBe(path.join(basicProjectDirpath, 'src/other.js'));
	});

	test('expands tilde imports from fixtures/packages-project', () => {
		const packagesProjectDirpath = path.join(
			fixturesDirpath,
			'packages-project'
		);
		const expandTildeImport = createTildeImportExpander({
			monorepoDirpath: packagesProjectDirpath
		});

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					packagesProjectDirpath,
					'packages/package-a/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(packagesProjectDirpath, 'packages/package-a/src/other.js')
		);

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					packagesProjectDirpath,
					'packages/package-b/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(packagesProjectDirpath, 'packages/package-b/src/other.js')
		);
	});

	test('expands tilde imports from fixtures/categorized-packages-project', () => {
		const categorizedPackagesProjectDirpath = path.join(
			fixturesDirpath,
			'categorized-packages-project'
		);
		const expandTildeImport = createTildeImportExpander({
			monorepoDirpath: categorizedPackagesProjectDirpath
		});

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					categorizedPackagesProjectDirpath,
					'category-a/package-a/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(
				categorizedPackagesProjectDirpath,
				'category-a/package-a/src/other.js'
			)
		);

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					categorizedPackagesProjectDirpath,
					'category-a/package-b/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(
				categorizedPackagesProjectDirpath,
				'category-a/package-b/src/other.js'
			)
		);

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					categorizedPackagesProjectDirpath,
					'category-b/package-a/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(
				categorizedPackagesProjectDirpath,
				'category-b/package-a/src/other.js'
			)
		);

		expect(
			expandTildeImport({
				importerFilePath: path.join(
					categorizedPackagesProjectDirpath,
					'category-b/package-b/src/index.js'
				),
				importSpecifier: '~/other.js'
			})
		).toBe(
			path.join(
				categorizedPackagesProjectDirpath,
				'category-b/package-b/src/other.js'
			)
		);
	});
});
