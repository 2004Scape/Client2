import Linkable from './Linkable';

export default class LinkList {
    // constructor
    private readonly head: Linkable;

    // runtime
    private peeked: Linkable | null = null;

    constructor() {
        const head: Linkable = new Linkable();
        head.prev = head;
        head.next = head;
        this.head = head;
    }

    pushBack = (node: Linkable): void => {
        if (node.next) {
            node.unlink();
        }
        node.next = this.head.next;
        node.prev = this.head;
        if (node.next) {
            node.next.prev = node;
        }
        node.prev.next = node;
    };

    pushFront = (node: Linkable): void => {
        if (node.next) {
            node.unlink();
        }
        node.next = this.head;
        node.prev = this.head.prev;
        node.next.prev = node;
        if (node.prev) {
            node.prev.next = node;
        }
    };

    pollFront = (): Linkable | null => {
        const node: Linkable | null = this.head.prev;
        if (node === this.head) {
            return null;
        }
        node?.unlink();
        return node;
    };

    peekFront = (): Linkable | null => {
        const node: Linkable | null = this.head.prev;
        if (node === this.head) {
            this.peeked = null;
            return null;
        }
        this.peeked = node?.prev || null;
        return node;
    };

    peekBack = (): Linkable | null => {
        const node: Linkable | null = this.head.next;
        if (node === this.head) {
            this.peeked = null;
            return null;
        }
        this.peeked = node?.next || null;
        return node;
    };

    prev = (): Linkable | null => {
        const node: Linkable | null = this.peeked;
        if (node === this.head) {
            this.peeked = null;
            return null;
        }
        this.peeked = node?.prev || null;
        return node;
    };

    next = (): Linkable | null => {
        const node: Linkable | null = this.peeked;
        if (node === this.head) {
            this.peeked = null;
            return null;
        }
        this.peeked = node?.next || null;
        return node;
    };

    clear = (): void => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const node: Linkable | null = this.head.prev;
            if (node === this.head) {
                return;
            }
            node?.unlink();
        }
    };
}
