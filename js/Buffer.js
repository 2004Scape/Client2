export default class Buffer {
    constructor(src) {
        this.data = new Uint8Array(src);
        this.pos = 0;
    }

    static alloc(size) {
        return new Buffer(new Uint8Array(size));
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
}
