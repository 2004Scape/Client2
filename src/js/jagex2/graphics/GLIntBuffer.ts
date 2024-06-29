export default class GLIntBuffer {
    private buffer: Int32Array;
    private position: number = 0;

    constructor(allocation: number = 65536) {
        this.buffer = new Int32Array(allocation);
    }

    put(x: number, y: number, z: number): GLIntBuffer {
        this.buffer[this.position++] = x;
        this.buffer[this.position++] = y;
        this.buffer[this.position++] = z;
        return this;
    }

    putC(x: number, y: number, z: number, c: number): GLIntBuffer {
        this.buffer[this.position++] = x;
        this.buffer[this.position++] = y;
        this.buffer[this.position++] = z;
        this.buffer[this.position++] = c;
        return this;
    }

    putArray(array: Int32Array): GLIntBuffer {
        for (let i: number = 0; i < array.length; i++) {
            this.buffer[this.position++] = array[i];
        }
        return this;
    }

    putVal(value: number): GLIntBuffer {
        this.buffer[this.position++] = value;
        return this;
    }

    flip(): void {
        this.buffer = this.buffer.slice(0, this.position);
    }

    clear(): void {
        this.buffer = new Int32Array(65536);
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
            const newBuffer: Int32Array = new Int32Array(newCapacity);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    // return the remaining space in the buffer
    remaining(): number {
        return this.buffer.length - this.position;
    }

    getBuffer(): Int32Array {
        return this.buffer;
    }

    getSize(): number {
        return this.buffer.length;
    }
}
