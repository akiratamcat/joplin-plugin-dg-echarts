// SPDX-License-Identifier: MIT
// Cache of rendered charts (design 7.2): least-recently-used, fixed size.
// It lives in the content script module, so it is shared by all notes in the
// renderer process.
import { hashString } from '../shared/hash';

export class LruCache<V> {
	private readonly map = new Map<string, V>();

	constructor(private limit: number) {
		if (!Number.isInteger(limit) || limit < 1) throw new Error('cache limit must be a positive integer');
	}

	get size(): number {
		return this.map.size;
	}

	get(key: string): V | undefined {
		const value = this.map.get(key);
		if (value === undefined) return undefined;
		// Move to the most recently used position.
		this.map.delete(key);
		this.map.set(key, value);
		return value;
	}

	set(key: string, value: V): void {
		if (this.map.has(key)) this.map.delete(key);
		this.map.set(key, value);
		this.trim();
	}

	setLimit(limit: number): void {
		if (!Number.isInteger(limit) || limit < 1) throw new Error('cache limit must be a positive integer');
		this.limit = limit;
		this.trim();
	}

	clear(): void {
		this.map.clear();
	}

	private trim(): void {
		while (this.map.size > this.limit) this.map.delete(this.map.keys().next().value as string);
	}
}

/**
 * Cache key of a chart (design 7.2): the source and every value that changes
 * the output.
 */
export function cacheKey(source: string, parts: Record<string, string | number | boolean | null>): string {
	const keys = Object.keys(parts).sort();
	return hashString([...keys.map((k) => `${k}=${String(parts[k])}`), source].join('\u0000'));
}
