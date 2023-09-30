import type { Node } from '../types/node.js';

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
export default class TrieMap<K extends keyof any, V> {
	static SENTINEL = String.fromCharCode(0) as '\0';
	mode: 'array' | 'string';
	root: Node;
	size: number;

	/**
		Static @.from function taking an arbitrary iterable & converting it into
		a trie.

		@param iterable - Target iterable.
	*/
	static from<K extends keyof any, V>(object: Record<K, V>): TrieMap<K, V> {
		const trie = new TrieMap<K, V>();
		for (const [key, value] of Object.entries(object)) {
			trie.set(key, value);
		}
		return trie;
	}

	constructor(token?: ArrayConstructor) {
		this.mode = token === Array ? 'array' : 'string';
		this.clear();
	}

	/**
		Method used to clear the trie.
	*/
	clear() {
		this.root = {};
		this.size = 0;
	}

	/**
		Method used to set the value of the given prefix in the trie.
		@param prefix - Prefix to follow.
		@param value - Value for the prefix.
	*/
	set(prefix: string | Array<K>, value: any): this {
		let node: Node = this.root;
		let token: keyof any;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
			node = node[token] || (node[token] = {});
		}

		// Do we need to increase size?
		if (!(TrieMap.SENTINEL in node)) this.size++;

		node[TrieMap.SENTINEL] = value;

		return this;
	}

	/**
		Method used to update the value of the given prefix in the trie.
		@param  prefix - Prefix to follow.
		@param updateFunction - Update value visitor callback.
	*/
	update(
		prefix: string | Array<K>,
		updateFunction: (oldValue: any | undefined) => any
	): this {
		let node = this.root;
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
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
		@param prefix - Prefix to follow.
	*/
	get(prefix: string | Array<K>): K | undefined {
		let node = this.root;
		let token: keyof any;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
			node = node[token]!;

			// Prefix does not exist
			if (typeof node === 'undefined') return;
		}

		if (!(TrieMap.SENTINEL in node)) return;

		return node[TrieMap.SENTINEL];
	}

	/**
		Method used to delete a prefix from the trie.
		@param prefix - Prefix to delete.
	*/
	delete(prefix: string | Array<K>): boolean {
		let node = this.root;
		let toPrune = null;
		let tokenToPrune: keyof any | null = null;
		let parent;
		let token: keyof any;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
			parent = node;
			node = node[token]!;

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

		if (toPrune) delete toPrune[tokenToPrune!];
		else delete node[TrieMap.SENTINEL];

		return true;
	}

	/**
		Method used to assert whether the given prefix exists in the TrieMap.
		@param prefix - Prefix to check.
	*/
	has(prefix: string | Array<K>): boolean {
		let node = this.root;
		let token;

		for (let i = 0; i < prefix.length; i++) {
			token = prefix[i]!;
			node = node[token]!;

			if (typeof node === 'undefined') return false;
		}

		return TrieMap.SENTINEL in node;
	}

	/**
		Method used to retrieve every item in the trie with the given prefix.
		@param prefix - Prefix to query.
	*/
	find(prefix: string | Array<K>): Array<[K, V]> {
		const isString = typeof prefix === 'string';

		let node = this.root;
		const matches: Array<[any, V]> = [];
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
				if (k === TrieMap.SENTINEL) {
					matches.push([prefix, node[TrieMap.SENTINEL]]);
					continue;
				}

				nodeStack.push(node[k]!);
				prefixStack.push(isString ? prefix + k : prefix.concat(k as any));
			}
		}

		return matches;
	}

	/**
		Method returning an iterator over the trie's values.

		@param [prefix] - Optional starting prefix.
	*/
	*values(prefix?: string | Array<K>) {
		let node = this.root;
		const nodeStack = [];
		let token;

		// Resolving initial prefix
		if (prefix) {
			for (let i = 0; i < prefix.length; i++) {
				token = prefix[i]!;
				node = node[token]!;

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		}

		nodeStack.push(node);

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

				nodeStack.push(currentNode![k]);
			}

			if (hasValue) {
				yield currentNode![TrieMap.SENTINEL];
			}
		}
	}

	/**
		Method returning an iterator over the trie's prefixes.
		@param  [prefix] - Optional starting prefix.
	*/
	*prefixes(prefix?: string | Array<K>) {
		let node = this.root;
		const nodeStack: Node[] = [];
		const prefixStack = [];
		let token;

		const isString = this.mode === 'string';

		// Resolving initial prefix
		if (prefix) {
			for (let i = 0; i < prefix.length; i++) {
				token = prefix[i]!;
				node = node[token]!;

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		} else {
			prefix = isString ? '' : [];
		}

		nodeStack.push(node);
		prefixStack.push(prefix);

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

				nodeStack.push(currentNode![k]!);
				prefixStack.push(
					isString ? currentPrefix + k : currentPrefix!.concat(k as any)
				);
			}

			if (hasValue) {
				yield currentPrefix;
			}
		}
	}

	/**
		Method returning an iterator over the trie's entries.

		@param [prefix] - Optional starting prefix.
	*/
	*entries(prefix?: string | Array<K>) {
		let node = this.root;
		const nodeStack = [];
		const prefixStack = [];
		let token: keyof any;

		const isString = this.mode === 'string';

		// Resolving initial prefix
		if (prefix) {
			for (let i = 0; i < prefix.length; i++) {
				token = prefix[i]!;
				node = node[token]!;

				// If the prefix does not exist, we return an empty iterator
				if (typeof node === 'undefined') return [][Symbol.iterator]();
			}
		} else {
			prefix = isString ? '' : [];
		}

		nodeStack.push(node);
		prefixStack.push(prefix);

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

				nodeStack.push(currentNode![k]);
				prefixStack.push(
					isString ? currentPrefix + k : currentPrefix!.concat(k as any)
				);
			}

			if (hasValue) {
				yield [currentPrefix, currentNode![TrieMap.SENTINEL]];
			}
		}
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

	// @ts-expect-error: wtf
	[Symbol.for('nodejs.util.inspect.custom')] = this.inspect.bind(this);

	toJSON() {
		return this.root;
	}
}
