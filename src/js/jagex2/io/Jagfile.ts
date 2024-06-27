import Packet from './Packet';
import Bzip from '../../vendor/bzip';

export default class Jagfile {
    static genHash = (name: string): number => {
        let hash: number = 0;
        name = name.toUpperCase();
        for (let i: number = 0; i < name.length; i++) {
            hash = (hash * 61 + name.charCodeAt(i) - 32) | 0; // wtf?
        }
        return hash;
    };

    // constructor
    buffer: Int8Array;
    compressedWhole: boolean;
    fileCount: number;
    fileHash: number[];
    fileUnpackedSize: number[];
    filePackedSize: number[];
    fileOffset: number[];
    fileUnpacked: Uint8Array[] = [];

    constructor(src: Int8Array | Uint8Array) {
        if (src instanceof Uint8Array) {
            src = new Int8Array(src);
        }

        let data: Packet = new Packet(new Uint8Array(src));
        const unpackedSize: number = data.g3;
        const packedSize: number = data.g3;

        if (unpackedSize === packedSize) {
            this.buffer = src;
            this.compressedWhole = false;
        } else {
            this.buffer = Bzip.read(unpackedSize, src, packedSize, 6);
            data = new Packet(new Uint8Array(this.buffer));
            this.compressedWhole = true;
        }

        this.fileCount = data.g2;
        this.fileHash = [];
        this.fileUnpackedSize = [];
        this.filePackedSize = [];
        this.fileOffset = [];

        let offset: number = data.pos + this.fileCount * 10;
        for (let i: number = 0; i < this.fileCount; i++) {
            this.fileHash.push(data.g4);
            this.fileUnpackedSize.push(data.g3);
            this.filePackedSize.push(data.g3);
            this.fileOffset.push(offset);
            offset += this.filePackedSize[i];
        }
    }

    read(name: string): Uint8Array | null {
        const hash: number = Jagfile.genHash(name);
        const index: number = this.fileHash.indexOf(hash);
        if (index === -1) {
            return null;
        }
        return this.readIndex(index);
    }

    readIndex(index: number): Uint8Array | null {
        if (index < 0 || index >= this.fileCount) {
            return null;
        }

        if (this.fileUnpacked[index]) {
            return this.fileUnpacked[index];
        }

        const offset: number = this.fileOffset[index];
        const length: number = offset + this.filePackedSize[index];
        if (this.compressedWhole) {
            const data: Uint8Array = Uint8Array.from(this.buffer.subarray(offset, offset + length));
            this.fileUnpacked[index] = data;
            return data;
        } else {
            const data: Uint8Array = Uint8Array.from(Bzip.read(this.fileUnpackedSize[index], this.buffer, this.filePackedSize[index], this.fileOffset[index]));
            this.fileUnpacked[index] = data;
            return data;
        }
    }
}
