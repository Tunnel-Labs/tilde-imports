import { describe, it, assert } from 'vitest';
import Trie from '../../src/utils/trie.js';

const SENTINEL = Trie.SENTINEL;
const inspect = require('util').inspect;
if (inspect.defaultOptions) inspect.defaultOptions.depth = null;

describe('Trie', function () {
	it('should be possible to add items to a Trie.', function () {
		const trie = new Trie();

		trie.add('rat');
		trie.add('rate');
		trie.add('tar');

		assert.strictEqual(trie.size, 3);
		assert.strictEqual(trie.has('rat'), true);
		assert.strictEqual(trie.has('rate'), true);
		assert.strictEqual(trie.has('tar'), true);
		assert.strictEqual(trie.has('show'), false);
		assert.strictEqual(trie.has('ra'), false);
		assert.strictEqual(trie.has('ratings'), false);

		assert.deepStrictEqual(trie.root, {
			r: {
				a: {
					t: {
						e: {
							[SENTINEL]: true
						},
						[SENTINEL]: true
					}
				}
			},
			t: {
				a: {
					r: {
						[SENTINEL]: true
					}
				}
			}
		});
	});

	it('adding the same item several times should not increase size.', function () {
		const trie = new Trie();

		trie.add('rat');
		trie.add('rate');
		trie.add('rat');

		assert.strictEqual(trie.size, 2);
		assert.strictEqual(trie.has('rat'), true);
	});

	it('should be possible to set the null sequence.', function () {
		let trie = new Trie();

		trie.add('');
		assert.strictEqual(trie.size, 1);
		assert.strictEqual(trie.has(''), true);

		trie = new Trie(Array);

		trie.add([]);
		assert.strictEqual(trie.size, 1);
		assert.strictEqual(trie.has([]), true);
	});

	it('should be possible to delete items.', function () {
		const trie = new Trie();

		trie.add('rat');
		trie.add('rate');
		trie.add('tar');

		assert.strictEqual(trie.delete(''), false);
		assert.strictEqual(trie.delete('hello'), false);

		assert.strictEqual(trie.delete('rat'), true);
		assert.strictEqual(trie.has('rat'), false);
		assert.strictEqual(trie.has('rate'), true);

		assert.strictEqual(trie.size, 2);

		assert.deepStrictEqual(trie.root, {
			r: {
				a: {
					t: {
						e: {
							[SENTINEL]: true
						}
					}
				}
			},
			t: {
				a: {
					r: {
						[SENTINEL]: true
					}
				}
			}
		});

		assert.strictEqual(trie.delete('rate'), true);

		assert.strictEqual(trie.size, 1);

		assert.deepStrictEqual(trie.root, {
			t: {
				a: {
					r: {
						[SENTINEL]: true
					}
				}
			}
		});

		assert.strictEqual(trie.delete('tar'), true);

		assert.strictEqual(trie.size, 0);

		assert.deepStrictEqual(trie.root, {});
	});

	it('should be possible to check the existence of a sequence in the Trie.', function () {
		const trie = new Trie();

		trie.add('romanesque');

		assert.strictEqual(trie.has('romanesque'), true);
		assert.strictEqual(trie.has('roman'), false);
		assert.strictEqual(trie.has(''), false);
	});

	it('should be possible to retrieve items matching the given prefix.', function () {
		const trie = new Trie();

		trie.add('roman');
		trie.add('romanesque');
		trie.add('romanesques');
		trie.add('greek');

		assert.deepStrictEqual(trie.find('roman'), [
			'roman',
			'romanesque',
			'romanesques'
		]);
		assert.deepStrictEqual(trie.find('rom'), [
			'roman',
			'romanesque',
			'romanesques'
		]);
		assert.deepStrictEqual(trie.find('romanesque'), [
			'romanesque',
			'romanesques'
		]);
		assert.deepStrictEqual(trie.find('gr'), ['greek']);
		assert.deepStrictEqual(trie.find('hello'), []);
		assert.deepStrictEqual(trie.find(''), [
			'greek',
			'roman',
			'romanesque',
			'romanesques'
		]);
	});

	it('should work with custom tokens.', function () {
		const trie = new Trie(Array);

		trie.add(['the', 'cat', 'eats', 'the', 'mouse']);
		trie.add(['the', 'mouse', 'eats', 'cheese']);
		trie.add(['hello', 'world']);

		assert.strictEqual(trie.size, 3);
		assert.deepStrictEqual(trie.root, {
			the: {
				cat: {
					eats: {
						the: {
							mouse: {
								[SENTINEL]: true
							}
						}
					}
				},
				mouse: {
					eats: {
						cheese: {
							[SENTINEL]: true
						}
					}
				}
			},
			hello: {
				world: {
					[SENTINEL]: true
				}
			}
		});

		assert.strictEqual(trie.has(['the', 'mouse', 'eats', 'cheese']), true);
		assert.strictEqual(trie.has(['the', 'mouse', 'eats']), false);

		assert.strictEqual(trie.delete(['hello']), false);
		assert.strictEqual(trie.delete(['hello', 'world']), true);

		assert.strictEqual(trie.size, 2);

		assert.deepStrictEqual(trie.find(['the']), [
			['the', 'mouse', 'eats', 'cheese'],
			['the', 'cat', 'eats', 'the', 'mouse']
		]);
	});

	it("should be possible to iterate over the trie's prefixes.", function () {
		const trie = new Trie();

		trie.add('rat');
		trie.add('rate');

		let prefixes = [...trie.prefixes()]

		assert.deepStrictEqual(prefixes, ['rat', 'rate']);

		trie.add('rater');
		trie.add('rates');

		prefixes = [...trie.keys('rate')]

		assert.deepStrictEqual(prefixes, ['rate', 'rates', 'rater']);
	});

	it("should be possible to iterate over the trie's prefixes using for...of.", function () {
		const trie = new Trie();

		trie.add('rat');
		trie.add('rate');

		const tests = ['rat', 'rate'];

		let i = 0;

		for (const prefix of trie) assert.deepStrictEqual(prefix, tests[i++]);
	});

	it('should be possible to create a trie from an arbitrary iterable.', function () {
		const words = ['roman', 'romanesque'];
		const trie = Trie.from(words);

		assert.strictEqual(trie.size, 2);
		assert.deepStrictEqual(trie.has('roman'), true);
	});
});
