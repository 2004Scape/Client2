import Linkable from './Linkable';

export default class HashTable {
    // constructor
    readonly size: number;
    readonly nodes: Linkable[];

    constructor(size: number) {
        this.size = size;
        this.nodes = [];
        for (let i: number = 0; i < size; i++) {
            this.nodes[i] = new Linkable();
        }
    }

    get = (key: number): Linkable | null => {
        const start: Linkable = this.nodes[Number(key & (this.size - 1))];
        const prev: Linkable | null = start.prev;
        if (!prev) {
            return null;
        }

        for (let node: Linkable | null = start.prev; node !== start; node = node.prev) {
            if (!node) {
                continue;
            }
            if (node.id === key) {
                return node;
            }
        }

        return null;
    };

    put = (key: number, value: Linkable): void => {
        if (value.next) {
            value.unlink();
        }

        const node: Linkable = this.nodes[Number(key & (this.size - 1))];
        value.next = node.next;
        value.prev = node;
        if (value.next) {
            value.next.prev = value;
        }
        value.prev.next = value;
        value.id = key;
    };
}
