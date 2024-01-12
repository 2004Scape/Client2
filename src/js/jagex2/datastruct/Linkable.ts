export default class Linkable {
    id: number;
    prev: Linkable | null;
    next: Linkable | null;

    constructor() {
        this.id = 0;
        this.prev = this;
        this.next = this;
    }

    unlink = (): void => {
        if (!this.next || !this.prev) {
            return;
        }
        this.next.prev = this.prev;
        this.prev.next = this.next;
        this.prev = null;
        this.next = null;
    };
}
