import Stack from './Stack';
import HashTable from './HashTable';
import Hashable from './Hashable';

export default class LruCache {
    // constructor
    readonly capacity: number;
    readonly hashtable: HashTable;
    readonly history: Stack;
    available: number;

    constructor(size: number) {
        this.capacity = size;
        this.available = size;
        this.hashtable = new HashTable(1024);
        this.history = new Stack();
    }

    get(key: bigint): Hashable | null {
        const node: Hashable | null = this.hashtable.get(key) as Hashable | null;
        if (node) {
            this.history.push(node);
        }
        return node;
    }

    put(key: bigint, value: Hashable): void {
        if (this.available === 0) {
            const node: Hashable | null = this.history.pop();
            node?.unlink();
            node?.uncache();
        } else {
            this.available--;
        }
        this.hashtable.put(key, value);
        this.history.push(value);
    }

    clear(): void {
        const node: Hashable | null = this.history.pop();
        if (!node) {
            this.available = this.capacity;
            return;
        }
        node.unlink();
        node.uncache();
    }
}
