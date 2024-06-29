export default class GLFloatBuffer {
    private buffer: Float32Array;
    private position: number = 0;

    constructor(allocation: number = 65536) {
        this.buffer = new Float32Array(allocation);
    }

    put(x: number, y: number, z: number): GLFloatBuffer {
        this.buffer[this.position++] = x;
        this.buffer[this.position++] = y;
        this.buffer[this.position++] = z;
        return this;
    }

    putC(x: number, y: number, z: number, c: number): GLFloatBuffer {
        this.buffer[this.position++] = x;
        this.buffer[this.position++] = y;
        this.buffer[this.position++] = z;
        this.buffer[this.position++] = c;
        return this;
    }

    flip(): void {
        this.buffer = this.buffer.slice(0, this.position);
    }

    clear(): void {
        this.buffer = new Float32Array(65536);
        this.position = 0;
    }

    ensureCapacity(size: number): void {
        const capacity: number = this.buffer.length;
        const position: number = this.buffer.length;
        if (capacity - position < size) {
            let newCapacity: number = capacity;
            while (newCapacity - position < size) {
                newCapacity *= 2;
            }

            const newBuffer: Float32Array = new Float32Array(newCapacity);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    remaining(): number {
        return this.buffer.length - this.position;
    }

    getBuffer(): Float32Array {
        return this.buffer;
    }

    getSize(): number {
        return this.buffer.length;
    }
}
