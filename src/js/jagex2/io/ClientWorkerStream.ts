import LinkList from '../datastruct/LinkList';
import Linkable from '../datastruct/Linkable';
import {sleep} from '../util/JsUtil';

export default class ClientWorkerStream {
    // constructor
    private readonly worker: Worker;
    public wwin: WorkerReader;
    private readonly wwout: WorkerWriter;

    // runtime
    private closed: boolean = false;
    private ioerror: boolean = false;

    constructor(worker: Worker, uniqueId: string) {
        this.worker = worker;
        this.worker.onerror = this.onerror;
        this.worker.onmessageerror = this.onmessageerror;
        this.wwin = new WorkerReader(5000);
        this.wwout = new WorkerWriter(this.worker, 5000, uniqueId);
        this.worker.postMessage({type: 'connection', id: uniqueId});
    }

    get available(): number {
        return this.closed ? 0 : this.wwin.available;
    }

    write(src: Uint8Array, len: number): void {
        this.wwout.write(src, len);
    }

    async read(): Promise<number> {
        return this.closed ? 0 : this.wwin.fastByte() ?? (await this.wwin.slowByte());
    }

    async readBytes(dst: Uint8Array, off: number, len: number): Promise<void> {
        if (this.closed) {
            return;
        }
        while (len > 0) {
            const read: Uint8Array = this.wwin.fastBytes(dst, off, len) ?? (await this.wwin.slowBytes(dst, off, len));
            if (read.length <= 0) {
                throw new Error('EOF');
            }
            off += read.length;
            len -= read.length;
        }
    }

    close(): void {
        this.closed = true;
        this.wwin.close();
        this.wwout.close();
        console.log('connection close!');
        if (this.ioerror) {
            console.log('connection error!');
        }
    }

    private onerror = (event: Event): void => {
        if (this.closed) {
            return;
        }
        this.ioerror = true;
        this.close();
    };

    private onmessageerror = (event: MessageEvent): void => {
        if (this.closed) {
            return;
        }
        this.ioerror = true;
        this.close();
    };
}

class WorkerWriter {
    // constructor
    private readonly worker: Worker;
    private readonly limit: number;
    private readonly uniqueId: string;

    private closed: boolean = false;
    private ioerror: boolean = false;

    constructor(socket: Worker, limit: number, uniqueId: string) {
        this.worker = socket;
        this.limit = limit;
        this.uniqueId = uniqueId;
    }

    write(src: Uint8Array, len: number): void {
        if (this.closed) {
            return;
        }
        if (this.ioerror) {
            this.ioerror = false;
            throw new Error('Error in writer thread');
        }
        if (len > this.limit || src.length > this.limit) {
            throw new Error('buffer overflow');
        }
        try {
            this.worker.postMessage({type: 'data', data: src.subarray(0, len), id: this.uniqueId});
        } catch (e) {
            this.ioerror = true;
        }
    }

    close(): void {
        this.closed = true;
    }
}

class WorkerEvent extends Linkable {
    private readonly bytes: Uint8Array;
    private position: number;

    constructor(bytes: Uint8Array) {
        super();
        this.bytes = bytes;
        this.position = 0;
    }

    get available(): number {
        return this.bytes.length - this.position;
    }

    get read(): number {
        return this.bytes[this.position++];
    }

    get len(): number {
        return this.bytes.length;
    }
}

class WorkerReader {
    // constructor
    private readonly limit: number;

    // runtime
    private queue: LinkList = new LinkList();
    private event: WorkerEvent | null = null;
    private callback: ((data: WorkerEvent | null) => void) | null = null;
    private total: number = 0;
    private closed: boolean = false;

    constructor(limit: number) {
        this.limit = limit;
    }

    get available(): number {
        return this.total;
    }

    public onmessage = (e: MessageEvent): void => {
        const msg: {type: string; data: Uint8Array | Array<number>; id: string} = typeof e.data === 'string' ? JSON.parse(e.data) : e;
        if (msg.type !== 'data') {
            console.error('Unexpected message type: ', msg.type);
            return;
        }

        if (this.closed) {
            throw new Error('WorkerReader is closed!');
        }
        const event: WorkerEvent = new WorkerEvent(new Uint8Array(msg.data));
        if (this.event) {
            this.queue.addTail(event);
        } else {
            this.event = event;
        }
        this.total += event.len;
        if (!this.callback) {
            return;
        }
        this.callback(this.event);
        this.callback = null;
        // check for the overflow after the callback
        if (this.total > this.limit) {
            throw new Error('buffer overflow');
        }
    };

    private readFastByte(): number | null {
        if (this.event && this.event.available > 0) {
            return this.event.read;
        }
        return null;
    }

    private async readSlowByte(len: number): Promise<number> {
        this.event = this.queue.removeHead() as WorkerEvent | null;
        while (this.total < len) {
            await Promise.race([
                new Promise((resolve): ((value: PromiseLike<((data: WorkerEvent | null) => void) | null>) => void) => (this.callback = resolve)),
                sleep(2000).then((): void => {
                    if (this.closed) {
                        throw new Error('WorkerReader closed while reading.');
                    }
                })
            ]);
        }
        return this.event ? this.event.read : this.readSlowByte(len);
    }

    fastBytes(dst: Uint8Array, off: number, len: number): Uint8Array | null {
        if (this.closed) {
            throw new Error('WorkerReader is closed!');
        }
        if (!(this.event && this.event.available >= len)) {
            return null;
        }
        while (len > 0) {
            const fast: number | null = this.readFastByte();
            if (fast === null) {
                throw new Error('EOF - tried to read a fast byte when there was not enough immediate bytes.');
            }
            dst[off++] = fast;
            this.total--;
            len--;
        }
        return dst;
    }

    async slowBytes(dst: Uint8Array, off: number, len: number): Promise<Uint8Array> {
        if (this.closed) {
            throw new Error('WorkerReader is closed!');
        }
        while (len > 0) {
            dst[off++] = this.readFastByte() ?? (await this.readSlowByte(len));
            this.total--;
            len--;
        }
        return dst;
    }

    fastByte(): number | null {
        if (this.closed) {
            throw new Error('WorkerReader is closed!');
        }
        const fast: number | null = this.readFastByte();
        if (fast === null) {
            return null;
        }
        this.total--;
        return fast;
    }

    async slowByte(): Promise<number> {
        if (this.closed) {
            throw new Error('WorkerReader is closed!');
        }
        const slow: number = await this.readSlowByte(1);
        this.total--;
        return slow;
    }

    close(): void {
        this.closed = true;
        this.callback = null;
        this.total = 0;
        this.event = null;
        this.queue.clear();
    }
}
