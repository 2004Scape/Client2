export default class Packet {
    data;
    pos;
    constructor(src) {
        this.data = new Uint8Array(src);
        this.pos = 0;
    }
    static alloc(size) {
        return new Packet(new Uint8Array(size));
    }
    get length() {
        return this.data.length;
    }
    get available() {
        return this.length - this.pos;
    }
    g1() {
        return this.data[this.pos++];
    }
    // signed
    g1b() {
        return this.data[this.pos++] << 24 >> 24;
    }
    g2() {
        return (this.data[this.pos++] << 8 | this.data[this.pos++]) >>> 0;
    }
    g3() {
        return (this.data[this.pos++] << 16 | this.data[this.pos++] << 8 | this.data[this.pos++]) >>> 0;
    }
    g4() {
        return (this.data[this.pos++] << 24 | this.data[this.pos++] << 16 | this.data[this.pos++] << 8 | this.data[this.pos++]) >>> 0;
    }
    // signed
    g4s() {
        return this.data[this.pos++] << 24 | this.data[this.pos++] << 16 | this.data[this.pos++] << 8 | this.data[this.pos++];
    }
    gdata(offset, length) {
        return this.data.subarray(offset, offset + length);
    }
    gsmart() {
        let value = this.data[this.pos];
        return (value < 0x80) ? this.g1() : (this.g2() - 0x8000);
    }
    // signed
    gsmarts() {
        let value = this.data[this.pos];
        return (value < 0x80) ? (this.g1() - 0x40) : (this.g2() - 0xC000);
    }
    gjstr() {
        let start = this.pos;
        while (this.data[this.pos++] !== '\n'.charCodeAt(0)) {
        }
        // TODO: switch to use TextDecoder
        let raw = this.data.slice(start, this.pos - 1);
        let str = '';
        for (let i = 0; i < raw.length; i++) {
            str += String.fromCharCode(raw[i]);
        }
        return str;
    }
}
