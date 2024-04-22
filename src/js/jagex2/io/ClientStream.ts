import LinkList from '../datastruct/LinkList';
import Linkable from '../datastruct/Linkable';

export type Socket = {
    host: string;
    port: number;
};

export default class ClientStream {
    // constructor
    private readonly socket: WebSocket;
    private readonly wsin: WebSocketReader;
    private readonly wsout: WebSocketWriter;

    // runtime
    private closed: boolean = false;
    private ioerror: boolean = false;

    static openSocket = async (socket: Socket): Promise<WebSocket> => {
        return await new Promise<WebSocket>((resolve, reject): void => {
            const secured: boolean = socket.host.startsWith('https');
            const protocol: string = secured ? 'wss' : 'ws';
            const host: string = socket.host.substring(socket.host.indexOf('//') + 2);
            const port: number = secured ? socket.port + 2 : socket.port + 1;
            const ws: WebSocket = new WebSocket(`${protocol}://${host}:${port}`, 'binary');

            ws.addEventListener('open', (): void => {
                console.log('connection open!');
                resolve(ws);
            });

            ws.addEventListener('error', (): void => {
                console.log('connection error!');
                reject(ws);
            });
        });
    };

    constructor(socket: WebSocket) {
        socket.onclose = this.onclose;
        socket.onerror = this.onerror;
        this.wsin = new WebSocketReader(socket, 5000);
        this.wsout = new WebSocketWriter(socket, 5000);
        this.socket = socket;
    }

    get host(): string {
        return this.socket.url.split('/')[2];
    }

    get port(): number {
        return parseInt(this.socket.url.split(':')[2], 10);
    }

    get available(): number {
        return this.closed ? 0 : this.wsin.available;
    }

    write(src: Uint8Array, len: number): void {
        this.wsout.write(src, len);
    }

    async read(): Promise<number> {
        return this.closed ? 0 : this.wsin.fastByte() ?? (await this.wsin.slowByte());
    }

    async readBytes(dst: Uint8Array, off: number, len: number): Promise<void> {
        if (this.closed) {
            return;
        }
        while (len > 0) {
            const read: Uint8Array = this.wsin.fastBytes(dst, off, len) ?? (await this.wsin.slowBytes(dst, off, len));
            if (read.length <= 0) {
                throw new Error('EOF');
            }
            off += read.length;
            len -= read.length;
        }
    }

    close(): void {
        this.closed = true;
        this.socket.close();
        this.wsin.close();
        this.wsout.close();
        console.log('connection close!');
        if (this.ioerror) {
            console.log('connection error!');
        }
    }

    private onclose = (event: CloseEvent): void => {
        if (this.closed) {
            return;
        }
        this.close();
    };

    private onerror = (event: Event): void => {
        if (this.closed) {
            return;
        }
        this.ioerror = true;
        this.close();
    };
}

class WebSocketWriter {
    // constructor
    private readonly socket: WebSocket;
    private readonly limit: number;

    private closed: boolean = false;
    private ioerror: boolean = false;

    constructor(socket: WebSocket, limit: number) {
        this.socket = socket;
        this.limit = limit;
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
            this.socket.send(src.subarray(0, len));
        } catch (e) {
            this.ioerror = true;
        }
    }

    close(): void {
        this.closed = true;
    }
}

class WebSocketEvent extends Linkable {
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

class WebSocketReader {
    // constructor
    private readonly limit: number;

    // runtime
    private queue: LinkList = new LinkList();
    private event: WebSocketEvent | null = null;
    private callback: ((data: WebSocketEvent | null) => void) | null = null;
    private total: number = 0;
    private closed: boolean = false;

    constructor(socket: WebSocket, limit: number) {
        this.limit = limit;
        socket.binaryType = 'arraybuffer';
        socket.onmessage = this.onmessage;
    }

    get available(): number {
        return this.total;
    }

    private onmessage = (e: MessageEvent): void => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        const event: WebSocketEvent = new WebSocketEvent(new Uint8Array(e.data));
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
        this.event = this.queue.removeHead() as WebSocketEvent | null;
        while (this.total < len) {
            await new Promise((resolve): ((value: PromiseLike<((data: WebSocketEvent | null) => void) | null>) => void) => (this.callback = resolve));
        }
        return this.event ? this.event.read : this.readSlowByte(len);
    }

    fastBytes(dst: Uint8Array, off: number, len: number): Uint8Array | null {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
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
            throw new Error('WebSocketReader is closed!');
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
            throw new Error('WebSocketReader is closed!');
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
            throw new Error('WebSocketReader is closed!');
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
