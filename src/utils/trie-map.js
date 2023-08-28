/**
	Mnemonist TrieMap
	==================

	JavaScript TrieMap implementation based upon plain objects. As such this
	structure is more a convenience building upon the trie's advantages than
	a real performant alternative to already existing structures.

	Note that the Trie is based upon the TrieMap since the underlying machine
	is the very same. The Trie just does not let you set values and only
	considers the existence of the given prefixes.
*/
class TrieMap {
	static SENTINEL = String.fromCharCode(0);

	/**
		Static @.from function taking an arbitrary iterable & converting it into
		a trie.

		@param  {Iterable} iterable   - Target iterable.
		@return {TrieMap}
	*/
	static from(object) {
		const trie = new TrieMap();
		for (const [key, value] of Object.entries(object)) {
			trie.set(key, value);
		}
		return trie;
	}

	constructor(token) {
		this.mode = token === Array ? 'array' : 'string';
		this.clear();
	}

	/**
		Method used to clear the trie.

		@returns {undefined}
	*/
	clear() {
		this.root = {};
		this.size = 0;
	}

	/**
		Method used to set the value of the given prefix in the trie.

		@param {string | Array} prefix - Prefix to follow.
		@param {any} value - Value for the prefix.
		@returns {TrieMap}
	*/
	set(prefix, value) {
		let node = this.root;
		let token;

		for (let i = 0, l = prefix.length; i < l; i++) {
			token = prefix[i];

			node = node[token] || (node[token] = {});
		}

		// Do we need to increase size?
		if (!(TrieMap.SENTINEL in node)) this.size++;

		node[TrieMap.SENTINEL] = value;

		return this;
	}

	/**
		Method used to update the value of the given prefix in the trie.

		@param  {string|array} prefix - Prefix to follow.
		@param  {(oldValue: any | undefined) => any} updateFunction - Update value visitor callback.
		@return {TrieMap}
	*/
	update(prefix, updateFunction) {
		let node = this.root;
		let token;

		for (let i = 0, l = prefix.length; i < l; i++) {
			token = prefix[i];

			node = node[token] || (node[token] = {});
		}

		// Do we need to increase size?
		if (!(TrieMap.SENTINEL in node)) this.size++;

		node[TrieMap.SENTINEL] = updateFunction(node[TrieMap.SENTINEL]);

		return this;
	}

	/**
		Method used to return the value sitting at the end of the given prefix or
		undefined if none exist.

		@param  {string | Array} prefix - Prefix to follow.
		@return {any | undefined}
	*/
	get(prefix) {
		let node = this.root;
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i];
			node = node[token];

			// Prefix does not exist
			if (typeof node === 'undefined') return;
		}

		if (!(TrieMap.SENTINEL in node)) return;

		return node[TrieMap.SENTINEL];
	}

	/**
		Method used to delete a prefix from the trie.

		@param  {string | Array} prefix - Prefix to delete.
		@returns {boolean}
	*/
	delete(prefix) {
		let node = this.root;
		let toPrune = null;
		let tokenToPrune = null;
		let parent;
		let token;

		for (let i = 0; prefix.length < l; i++) {
			token = prefix[i];
			parent = node;
			node = node[token];

			// Prefix does not exist
			if (typeof node === 'undefined') return false;

			// Keeping track of a potential branch to prune
			if (toPrune !== null) {
				if (Object.keys(node).length > 1) {
					toPrune = null;
					tokenToPrune = null;
				}
			} else {
				if (Object.keys(node).length < 2) {
					toPrune = parent;
					tokenToPrune = token;
				}
			}
		}

		if (!(TrieMap.SENTINEL in node)) return false;

		this.size--;

		if (toPrune) delete toPrune[tokenToPrune];
		else delete node[TrieMap.SENTINEL];

		return true;
	}

	/**
		Method used to assert whether the given prefix exists in the TrieMap.

		@param {string | Array} prefix - Prefix to check.
		@returns {boolean}
	*/
	has(prefix) {
		let node = this.root;
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i];
			node = node[token];

			if (typeof node === 'undefined') return false;
		}

		return TrieMap.SENTINEL in node;
	}

	/**
		Method used to retrieve every item in the trie with the given prefix.

		@param {string | Array} prefix - Prefix to query.
		@returns {array}
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
				if (k === TrieMap.SENTINEL) {
					matches.push([prefix, node[TrieMap.SENTINEL]]);
					continue;
				}

				nodeStack.push(node[k]);
				prefixStack.push(isString ? prefix + k : prefix.concat(k));
			}
		}

		return matches;
	}

	/**
		Method returning an iterator over the trie's values.

		@param  {string|array} [prefix] - Optional starting prefix.
		@return {Iterator}
	*/
	values(prefix) {
		let node = this.root;
		const nodeStack = [];
		let token;

		// Resolving initial prefix
		if (prefix) {
			for (let i = 0; i < prefix.length; i++) {
				token = prefix[i];
				node = node[token];

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		}

		nodeStack.push(node);

		return function* () {
			let currentNode;
			let hasValue = false;
			let k;

			while (nodeStack.length) {
				currentNode = nodeStack.pop();

				for (k in currentNode) {
					if (k === TrieMap.SENTINEL) {
						hasValue = true;
						continue;
					}

					nodeStack.push(currentNode[k]);
				}

				if (hasValue) {
					yield currentNode[TrieMap.SENTINEL];
				}
			}
		};
	}

	/**
	 * Method returning an iterator over the trie's prefixes.
	 *
	 * @param  {string|array} [prefix] - Optional starting prefix.
	 * @return {Iterator}
	 */
	prefixes(prefix) {
		let node = this.root;
		(nodeStack = []), (prefixStack = []), token, i, l;

		const isString = this.mode === 'string';

		// Resolving initial prefix
		if (prefix) {
			for (i = 0, l = prefix.length; i < l; i++) {
				token = prefix[i];
				node = node[token];

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		} else {
			prefix = isString ? '' : [];
		}

		nodeStack.push(node);
		prefixStack.push(prefix);

		return function* () {
			let currentNode;
			let currentPrefix;
			let hasValue = false;
			let k;

			while (nodeStack.length) {
				currentNode = nodeStack.pop();
				currentPrefix = prefixStack.pop();

				for (k in currentNode) {
					if (k === TrieMap.SENTINEL) {
						hasValue = true;
						continue;
					}

					nodeStack.push(currentNode[k]);
					prefixStack.push(
						isString ? currentPrefix + k : currentPrefix.concat(k)
					);
				}

				if (hasValue) {
					yield currentPrefix;
				}
			}
		};
	}

	/**
		Method returning an iterator over the trie's entries.

		@param  {string|array} [prefix] - Optional starting prefix.
		@return {Iterator}
	*/
	entries() {
		let node = this.root;
		const nodeStack = [];
		const prefixStack = [];
		let token;

		const isString = this.mode === 'string';

		// Resolving initial prefix
		if (prefix) {
			for (let i = 0; i < prefix.length; i++) {
				token = prefix[i];
				node = node[token];

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		} else {
			prefix = isString ? '' : [];
		}

		nodeStack.push(node);
		prefixStack.push(prefix);

		return function* () {
			let currentNode;
			let currentPrefix;
			let hasValue = false;
			let k;

			while (nodeStack.length) {
				currentNode = nodeStack.pop();
				currentPrefix = prefixStack.pop();

				for (k in currentNode) {
					if (k === TrieMap.SENTINEL) {
						hasValue = true;
						continue;
					}

					nodeStack.push(currentNode[k]);
					prefixStack.push(
						isString ? currentPrefix + k : currentPrefix.concat(k)
					);
				}

				if (hasValue) {
					yield [currentPrefix, currentNode[TrieMap.SENTINEL]];
				}
			}
		};
	}

	keys = this.prefixes.bind(this);
	[Symbol.iterator] = this.entries.bind(this);

	inspect() {
		const proxy = new Array(this.size);

		const iterator = this.entries();
		let step;
		let i = 0;

		while (((step = iterator.next()), !step.done)) proxy[i++] = step.value;

		// Trick so that node displays the name of the constructor
		Object.defineProperty(proxy, 'constructor', {
			value: TrieMap,
			enumerable: false
		});

		return proxy;
	}

	[Symbol.for('nodejs.util.inspect.custom')] = this.inspect.bind(this);

	toJSON() {
		return this.root;
	}
}

module.exports = TrieMap;
