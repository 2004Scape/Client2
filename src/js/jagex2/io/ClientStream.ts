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

    write = (src: Uint8Array, len: number): void => {
        this.wsout.write(src, len);
    };

    read = async (): Promise<number> => {
        return this.closed ? 0 : await this.wsin.read();
    };

    readBytes = async (dst: Uint8Array, off: number, len: number): Promise<void> => {
        if (this.closed) {
            return;
        }
        while (len > 0) {
            const read: Uint8Array = await this.wsin.readBytes(dst, off, len);
            if (read.length <= 0) {
                throw new Error('EOF');
            }
            off += read.length;
            len -= read.length;
        }
    };

    close = (): void => {
        this.closed = true;
        this.socket.close();
        this.wsin.close();
        this.wsout.close();
        console.log('connection close!');
        if (this.ioerror) {
            console.log('connection error!');
        }
    };

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

    write = (src: Uint8Array, len: number): void => {
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
    };

    close = (): void => {
        this.closed = true;
    };
}

class WebSocketReader {
    // constructor
    private readonly limit: number;

    // runtime
    private buffer: number[] = [];
    private callback: ((data: number[]) => void) | null = null;
    private closed: boolean = false;

    constructor(socket: WebSocket, limit: number) {
        this.limit = limit;
        socket.binaryType = 'arraybuffer';
        socket.addEventListener('message', this.on.bind(this));
    }

    private on = (event: MessageEvent): void => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        const read: Uint8Array = new Uint8Array(event.data);
        this.buffer.push(...read);
        if (!this.callback) {
            return;
        }
        this.callback(this.buffer);
        this.callback = null;
        // check for the overflow after the callback
        if (this.buffer.length > this.limit) {
            throw new Error('buffer overflow');
        }
    };

    readBytes = async (dst: Uint8Array, off: number, length: number): Promise<Uint8Array> => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        while (this.buffer.length < length) {
            await new Promise((resolve): ((value: PromiseLike<((data: number[]) => void) | null>) => void) => (this.callback = resolve));
        }
        while (length--) dst[off++] = this.buffer.shift()!;
        return dst;
    };

    read = async (): Promise<number> => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        while (this.buffer.length < 1) {
            await new Promise((resolve): ((value: PromiseLike<((data: number[]) => void) | null>) => void) => (this.callback = resolve));
        }
        return this.buffer.shift()!;
    };

    get available(): number {
        return this.buffer.length;
    }

    close = (): void => {
        this.callback = null;
        this.buffer = [];
        this.closed = true;
    };
}
