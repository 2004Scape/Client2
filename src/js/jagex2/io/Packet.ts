import {bigIntModPow, bigIntToBytes, bytesToBigInt} from '../util/JsUtil';
import Isaac from './Isaac';
import LinkList from '../datastruct/LinkList';
import Hashable from '../datastruct/Hashable';

export default class Packet extends Hashable {
    private static readonly CRC32_POLYNOMIAL: number = 0xedb88320;

    private static readonly crctable: Int32Array = new Int32Array(256);
    private static readonly bitmask: Uint32Array = new Uint32Array(33);

    private static readonly cacheMin: LinkList = new LinkList();
    private static readonly cacheMid: LinkList = new LinkList();
    private static readonly cacheMax: LinkList = new LinkList();

    private static cacheMinCount: number = 0;
    private static cacheMidCount: number = 0;
    private static cacheMaxCount: number = 0;

    static {
        for (let i: number = 0; i < 32; i++) {
            Packet.bitmask[i] = (1 << i) - 1;
        }
        Packet.bitmask[32] = 0xffffffff;

        for (let i: number = 0; i < 256; i++) {
            let remainder: number = i;

            for (let bit: number = 0; bit < 8; bit++) {
                if ((remainder & 1) === 1) {
                    remainder = (remainder >>> 1) ^ Packet.CRC32_POLYNOMIAL;
                } else {
                    remainder >>>= 1;
                }
            }

            Packet.crctable[i] = remainder;
        }
    }

    static crc32 = (src: Int8Array): number => {
        let crc: number = 0xffffffff;
        for (let i: number = 0; i < src.length; i++) {
            crc = (crc >>> 8) ^ Packet.crctable[(crc ^ src[i]) & 0xff];
        }
        return ~crc;
    };

    // constructor
    private readonly view: DataView;
    readonly data: Uint8Array;

    // runtime
    pos: number = 0;
    bitPos: number = 0;
    random: Isaac | null = null;

    constructor(src: Uint8Array | Int8Array | null) {
        if (!src) {
            throw new Error('Input src packet array was null!');
        }
        super();
        if (src instanceof Int8Array) {
            this.data = new Uint8Array(src);
        } else {
            this.data = src;
        }
        this.view = new DataView(this.data.buffer);
    }

    get length(): number {
        return this.view.byteLength;
    }

    get available(): number {
        return this.length - this.pos;
    }

    static alloc = (type: number): Packet => {
        let cached: Packet | null = null;
        if (type === 0 && Packet.cacheMinCount > 0) {
            Packet.cacheMinCount--;
            cached = Packet.cacheMin.removeHead() as Packet | null;
        } else if (type === 1 && Packet.cacheMidCount > 0) {
            Packet.cacheMidCount--;
            cached = Packet.cacheMid.removeHead() as Packet | null;
        } else if (type === 2 && Packet.cacheMaxCount > 0) {
            Packet.cacheMaxCount--;
            cached = Packet.cacheMax.removeHead() as Packet | null;
        }

        if (cached) {
            cached.pos = 0;
            return cached;
        }

        if (type === 0) {
            return new Packet(new Uint8Array(100));
        } else if (type === 1) {
            return new Packet(new Uint8Array(5000));
        }
        return new Packet(new Uint8Array(30000));
    };

    release(): void {
        this.pos = 0;
        if (this.view.byteLength === 100 && Packet.cacheMinCount < 1000) {
            Packet.cacheMin.addTail(this);
            Packet.cacheMinCount++;
        } else if (this.view.byteLength === 5000 && Packet.cacheMidCount < 250) {
            Packet.cacheMid.addTail(this);
            Packet.cacheMidCount++;
        } else if (this.view.byteLength === 30000 && Packet.cacheMaxCount < 50) {
            Packet.cacheMax.addTail(this);
            Packet.cacheMaxCount++;
        }
    }

    get g1(): number {
        return this.view.getUint8(this.pos++);
    }

    // signed
    get g1b(): number {
        return this.view.getInt8(this.pos++);
    }

    get g2(): number {
        const result: number = this.view.getUint16(this.pos);
        this.pos += 2;
        return result;
    }

    // signed
    get g2b(): number {
        const result: number = this.view.getInt16(this.pos);
        this.pos += 2;
        return result;
    }

    get g3(): number {
        const result: number = (this.view.getUint8(this.pos++) << 16) | this.view.getUint16(this.pos);
        this.pos += 2;
        return result;
    }

    get g4(): number {
        const result: number = this.view.getInt32(this.pos);
        this.pos += 4;
        return result;
    }

    get g8(): bigint {
        const result: bigint = this.view.getBigInt64(this.pos);
        this.pos += 8;
        return result;
    }

    get gsmart(): number {
        return this.view.getUint8(this.pos) < 0x80 ? this.g1 - 0x40 : this.g2 - 0xc000;
    }

    // signed
    get gsmarts(): number {
        return this.view.getUint8(this.pos) < 0x80 ? this.g1 : this.g2 - 0x8000;
    }

    get gjstr(): string {
        const view: DataView = this.view;
        const length: number = view.byteLength;
        let str: string = '';
        let b: number;
        while ((b = view.getUint8(this.pos++)) !== 10 && this.pos < length) {
            str += String.fromCharCode(b);
        }
        return str;
    }

    gdata(length: number, offset: number, dest: Uint8Array | Int8Array): void {
        const view: DataView = this.view;
        const total: number = offset + length;
        for (let i: number = offset; i < total; i++) {
            dest[i] = view.getUint8(this.pos++);
        }
    }

    p1isaac(opcode: number): void {
        this.view.setUint8(this.pos++, (opcode + (this.random?.nextInt ?? 0)) & 0xff);
    }

    p1(value: number): void {
        this.view.setUint8(this.pos++, value);
    }

    p2(value: number): void {
        this.view.setUint16(this.pos, value);
        this.pos += 2;
    }

    ip2(value: number): void {
        this.view.setUint16(this.pos, value, true);
        this.pos += 2;
    }

    p3(value: number): void {
        this.view.setUint8(this.pos++, value >> 16);
        this.view.setUint16(this.pos, value);
        this.pos += 2;
    }

    p4(value: number): void {
        this.view.setInt32(this.pos, value);
        this.pos += 4;
    }

    ip4(value: number): void {
        this.view.setInt32(this.pos, value, true);
        this.pos += 4;
    }

    p8(value: bigint): void {
        this.view.setBigInt64(this.pos, value);
        this.pos += 8;
    }

    pjstr(str: string): void {
        const view: DataView = this.view;
        const length: number = str.length;
        for (let i: number = 0; i < length; i++) {
            view.setUint8(this.pos++, str.charCodeAt(i));
        }
        view.setUint8(this.pos++, 10);
    }

    pdata(src: Uint8Array, length: number, offset: number): void {
        const view: DataView = this.view;
        const total: number = offset + length;
        for (let i: number = offset; i < total; i++) {
            view.setUint8(this.pos++, src[i]);
        }
    }

    psize1(size: number): void {
        this.view.setUint8(this.pos - size - 1, size);
    }

    bits(): void {
        this.bitPos = this.pos * 8;
    }

    bytes(): void {
        this.pos = ((this.bitPos + 7) / 8) | 0;
    }

    gBit(n: number): number {
        let bytePos: number = this.bitPos >>> 3;
        let remaining: number = 8 - (this.bitPos & 7);
        let value: number = 0;
        this.bitPos += n;

        for (; n > remaining; remaining = 8) {
            value += (this.view.getUint8(bytePos++) & Packet.bitmask[remaining]) << (n - remaining);
            n -= remaining;
        }

        if (n === remaining) {
            value += this.view.getUint8(bytePos) & Packet.bitmask[remaining];
        } else {
            value += (this.view.getUint8(bytePos) >>> (remaining - n)) & Packet.bitmask[n];
        }

        return value;
    }

    rsaenc(mod: bigint, exp: bigint): void {
        const length: number = this.pos;
        this.pos = 0;

        const temp: Uint8Array = new Uint8Array(length);
        this.gdata(length, 0, temp);

        const bigRaw: bigint = bytesToBigInt(temp);
        const bigEnc: bigint = bigIntModPow(bigRaw, exp, mod);
        const rawEnc: Uint8Array = bigIntToBytes(bigEnc);

        this.pos = 0;
        this.p1(rawEnc.length);
        this.pdata(rawEnc, rawEnc.length, 0);
    }
}
