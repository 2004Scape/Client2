import {decompressBz2} from '../util/JsUtil';

import Packet from './Packet';

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
    buffer: Packet;
    compressedWhole: boolean;
    fileCount: number;
    fileHash: number[];
    fileSizeInflated: number[];
    fileSizeDeflated: number[];
    fileOffset: number[];

    constructor(src: Uint8Array) {
        const data: Packet = new Packet(src);
        const compressedSize: number = data.g3;
        const uncompressedSize: number = data.g3;

        let buffer: Packet;
        if (compressedSize === uncompressedSize) {
            buffer = data;
            this.compressedWhole = false;
        } else {
            const compressed: Uint8Array = data.gdata(data.pos, compressedSize);
            buffer = new Packet(new Uint8Array(decompressBz2(compressed)));
            this.compressedWhole = true;
        }

        this.buffer = buffer;
        this.fileCount = buffer.g2;
        this.fileHash = [];
        this.fileSizeInflated = [];
        this.fileSizeDeflated = [];
        this.fileOffset = [];

        let offset: number = buffer.pos + this.fileCount * 10;
        for (let i: number = 0; i < this.fileCount; i++) {
            this.fileHash.push(buffer.g4);
            this.fileSizeInflated.push(buffer.g3);
            this.fileSizeDeflated.push(buffer.g3);
            this.fileOffset.push(offset);
            offset += this.fileSizeDeflated[i];
        }
    }

    read = (name: string): Uint8Array | null => {
        const hash: number = Jagfile.genHash(name);
        const index: number = this.fileHash.indexOf(hash);
        if (index === -1) {
            return null;
        }
        return this.readIndex(index);
    };

    readIndex = (index: number): Uint8Array | null => {
        if (index < 0 || index >= this.fileCount) {
            return null;
        }

        if (this.compressedWhole) {
            return this.buffer.gdata(this.fileOffset[index], this.fileOffset[index] + this.fileSizeDeflated[index]);
        } else {
            const data: Uint8Array = this.buffer.gdata(this.fileOffset[index], this.fileOffset[index] + this.fileSizeDeflated[index]);
            return decompressBz2(data);
        }
    };
}
