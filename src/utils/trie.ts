import TrieMap from './trie-map.js';

/**
	Mnemonist Trie
	===============

	JavaScript Trie implementation based upon plain objects. As such this
	structure is more a convenience building upon the trie's advantages than
	a real performant alternative to already existing structures.

	Note that the Trie is based upon the TrieMap since the underlying machine
	is the very same. The Trie just does not let you set values and only
	considers the existence of the given prefixes.
*/
export default class Trie<K extends keyof any> extends TrieMap<K, true> {
	static SENTINEL = String.fromCharCode(0) as '\0';

	constructor(token?: ArrayConstructor) {
		super(token);
	}

	/**
		Static @.from function taking an arbitrary iterable & converting it into
		a trie.

		@param  {Iterable} iterable   - Target iterable.
		@returns {Trie}
	*/
	static from<K extends keyof any>(array: Iterable<K>): Trie<K> {
		const trie = new Trie<K>();
		for (const value of array) {
			trie.add(value as any);
		}
		return trie;
	}

	/**
		Method used to add the given prefix to the trie.
		@param prefix - Prefix to follow.
	*/
	add(prefix: string | Array<K>): this {
		let node = this.root;
		let token;

		for (var i = 0, l = prefix.length; i < l; i++) {
			token = prefix[i]!;
			node = node[token] || (node[token] = {});
		}

		// Do we need to increase size?
		if (!(Trie.SENTINEL in node)) this.size++;

		node[Trie.SENTINEL] = true;

		return this;
	}

	/**
		Get all the items in the trie that are prefixes of the given value.
	*/
	getPrefixes(value: string | Array<K>) {
		const prefixes: any[] = [];
		let node = this.root;
		let token;

		for (let i = 0; i < value.length; i++) {
			token = value[i]!;
			node = node[token]!;

			if (typeof node === 'undefined') return prefixes;

			if (node[Trie.SENTINEL]) prefixes.push(value.slice(0, i + 1));
		}

		return prefixes;
	}

	/**
		Method used to retrieve every item in the trie with the given prefix.
		@returns {Array}
	*/
	find(prefix: string | Array<K>) {
		const isString = typeof prefix === 'string';

		let node = this.root;
		const matches: any[] = [];
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
			node = node[token]!;

			if (typeof node === 'undefined') return matches;
		}

		// Performing DFS from prefix
		const nodeStack = [node];
		const prefixStack = [prefix];
		let k;

		while (nodeStack.length) {
			prefix = prefixStack.pop()!;
			node = nodeStack.pop()!;

			for (k in node) {
				if (k === Trie.SENTINEL) {
					matches.push(prefix);
					continue;
				}

				nodeStack.push(node[k]!);
				prefixStack.push(isString ? prefix + k : prefix.concat(k as any));
			}
		}

		return matches;
	}

	// @ts-expect-error: any
	inspect() {
		const proxy = new Set();
		const iterator = this.keys();
		let step;

		while (((step = iterator.next()), !step.done)) proxy.add(step.value);

		// Trick so that node displays the name of the constructor
		Object.defineProperty(proxy, 'constructor', {
			value: Trie,
			enumerable: false
		});

		return proxy;
	}

	toJSON() {
		return this.root;
	}

	// Dropping irrelevant methods
	set = undefined as any;
	get = undefined as any;
	values = undefined as any;
	entries = undefined as any;

	[Symbol.iterator] = this.keys.bind(this) as any;
	// @ts-expect-error: wtf
	[Symbol.for('nodejs.util.inspect.custom')] = this.inspect.bind(this);
}
