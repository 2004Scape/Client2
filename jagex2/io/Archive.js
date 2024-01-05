import Buffer from './Buffer.js';
import { decompressBz2, downloadUrl } from '../util/JsUtil.js';
export default class Archive {
    static async loadUrl(url) {
        let data = await downloadUrl(url);
        return new Archive(data);
    }
    static genHash(name) {
        let hash = 0;
        name = name.toUpperCase();
        for (let i = 0; i < name.length; i++) {
            hash = (hash * 61 + name.charCodeAt(i) - 32) >>> 0;
        }
        return hash;
    }
    buffer = null;
    compressedWhole = false;
    fileCount = 0;
    fileHash = [];
    fileSizeInflated = [];
    fileSizeDeflated = [];
    fileOffset = [];
    constructor(data) {
        this.load(data);
    }
    load(data) {
        let compressedSize = data.g3();
        let uncompressedSize = data.g3();
        if (compressedSize == uncompressedSize) {
            this.buffer = data;
            this.compressedWhole = false;
        }
        else {
            let compressed = data.gdata(data.pos, compressedSize);
            this.buffer = new Buffer(decompressBz2(compressed));
            this.compressedWhole = true;
        }
        this.fileCount = this.buffer.g2();
        this.fileHash = [];
        this.fileSizeInflated = [];
        this.fileSizeDeflated = [];
        this.fileOffset = [];
        let offset = this.buffer.pos + (this.fileCount * 10);
        for (let i = 0; i < this.fileCount; i++) {
            this.fileHash.push(this.buffer.g4());
            this.fileSizeInflated.push(this.buffer.g3());
            this.fileSizeDeflated.push(this.buffer.g3());
            this.fileOffset.push(offset);
            offset += this.fileSizeDeflated[i];
        }
    }
    read(name) {
        let hash = Archive.genHash(name);
        let index = this.fileHash.indexOf(hash);
        if (index == -1) {
            return null;
        }
        return this.readIndex(index);
    }
    readIndex(index) {
        if (index < 0 || index >= this.fileCount) {
            return null;
        }
        if (this.compressedWhole) {
            return this.buffer.gdata(this.fileOffset[index], this.fileOffset[index] + this.fileSizeDeflated[index]);
        }
        else {
            let data = this.buffer.gdata(this.fileOffset[index], this.fileOffset[index] + this.fileSizeDeflated[index]);
            return decompressBz2(data);
        }
    }
}
//# sourceMappingURL=Archive.js.map