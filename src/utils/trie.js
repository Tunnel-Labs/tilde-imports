const TrieMap = require('./trie-map.js');

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
class Trie extends TrieMap {
	static SENTINEL = String.fromCharCode(0);

	constructor(token) {
		super(token);
	}

	/**
		Static @.from function taking an arbitrary iterable & converting it into
		a trie.

		@param  {Iterable} iterable   - Target iterable.
		@returns {Trie}
	*/
	static from(array) {
		const trie = new Trie();
		for (const value of array) {
			trie.add(value);
		}
		return trie;
	}

	/**
		Method used to add the given prefix to the trie.

		@param {string | Array} prefix - Prefix to follow.
		@returns {Trie}
	*/
	add(prefix) {
		let node = this.root;
		let token;

		for (var i = 0, l = prefix.length; i < l; i++) {
			token = prefix[i];

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
	getPrefixes(value) {
		const prefixes = [];
		let node = this.root;
		let token;

		for (let i = 0; i < value.length; i++) {
			token = value[i];
			node = node[token];

			if (typeof node === 'undefined') return prefixes;

			if (node[Trie.SENTINEL]) prefixes.push(value.slice(0, i + 1));
		}

		return prefixes;
	}

	/**
		Method used to retrieve every item in the trie with the given prefix.

		@param  {string | Array} prefix - Prefix to query.
		@returns {Array}
	*/
	find(prefix) {
		const isString = typeof prefix === 'string';

		let node = this.root;
		const matches = [];
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i];
			node = node[token];

			if (typeof node === 'undefined') return matches;
		}

		// Performing DFS from prefix
		const nodeStack = [node];
		const prefixStack = [prefix];
		let k;

		while (nodeStack.length) {
			prefix = prefixStack.pop();
			node = nodeStack.pop();

			for (k in node) {
				if (k === Trie.SENTINEL) {
					matches.push(prefix);
					continue;
				}

				nodeStack.push(node[k]);
				prefixStack.push(isString ? prefix + k : prefix.concat(k));
			}
		}

		return matches;
	}

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
	set = undefined;
	get = undefined;
	values = undefined;
	entries = undefined;

	[Symbol.iterator] = this.keys.bind(this);
	[Symbol.for('nodejs.util.inspect.custom')] = this.inspect.bind(this);
}

module.exports = Trie;
