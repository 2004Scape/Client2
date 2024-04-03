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
        this.wsin = new WebSocketReader(socket);
        this.wsout = new WebSocketWriter(socket);
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
            const read: Uint8Array = await this.wsin.readBytes(len);
            if (read.length <= 0) {
                throw new Error('EOF');
            }
            for (let index: number = 0; index < len; index++) {
                dst[off + index] = read[index];
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

    private closed: boolean = false;
    private ioerror: boolean = false;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    write = (src: Uint8Array, len: number): void => {
        if (this.closed) {
            return;
        }
        if (this.ioerror) {
            this.ioerror = false;
            throw new Error('Error in writer thread');
        }
        if (len > 5000) {
            throw new Error('buffer overflow');
        }
        try {
            this.socket.send(src.slice(0, len));
        } catch (e) {
            this.ioerror = true;
        }
    };

    close = (): void => {
        this.closed = true;
    };
}

class WebSocketReader {
    private buf: Uint8Array | null = null;
    private pos: number = 0;
    private remaining: number = 0;
    private callback: ((data: Uint8Array) => void) | null = null;
    private closed: boolean = false;

    constructor(socket: WebSocket) {
        socket.binaryType = 'arraybuffer';
        socket.addEventListener('message', this.on.bind(this));
    }

    private on = (event: MessageEvent): void => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        const read: Uint8Array = new Uint8Array(event.data);
        if (this.buf === null) {
            this.buf = read;
            this.pos = 0;
            this.remaining = read.length;
        } else {
            const data: Uint8Array = new Uint8Array(this.remaining + read.length);
            data.set(this.buf.subarray(this.pos), 0);
            data.set(read, this.remaining);
            this.buf = data;
            this.pos = 0;
            this.remaining += read.length;
        }
        if (this.callback) {
            this.callback(this.buf.subarray(this.pos));
        }
    };

    readBytes = async (length: number): Promise<Uint8Array> => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        return new Promise<Uint8Array>((resolve): void => {
            if (this.remaining >= length) {
                if (!this.buf) {
                    throw new Error('WebSocketReader buf was null!');
                }
                const result: Uint8Array = this.buf.subarray(this.pos, this.pos + length);
                this.pos += length;
                this.remaining -= length;
                resolve(result);
                return;
            }
            this.callback = (data: Uint8Array): void => {
                if (data.length >= length) {
                    const result: Uint8Array = data.subarray(0, length);
                    this.pos += length;
                    this.remaining -= length;
                    resolve(result);
                    this.callback = null;
                }
            };
        });
    };

    read = async (): Promise<number> => {
        if (this.closed) {
            throw new Error('WebSocketReader is closed!');
        }
        return new Promise<number>((resolve): void => {
            if (this.remaining >= 1) {
                if (!this.buf) {
                    throw new Error('WebSocketReader buf was null!');
                }
                const result: number = this.buf[this.pos];
                this.pos++;
                this.remaining--;
                resolve(result);
                return;
            }
            this.callback = (data: Uint8Array): void => {
                if (data.length >= 1) {
                    const result: number = data[0];
                    this.pos++;
                    this.remaining--;
                    resolve(result);
                    this.callback = null;
                }
            };
        });
    };

    get available(): number {
        return this.remaining;
    }

    close = (): void => {
        this.callback = null;
        this.remaining = 0;
        this.buf = null;
        this.pos = 0;
        this.closed = true;
    };
}
