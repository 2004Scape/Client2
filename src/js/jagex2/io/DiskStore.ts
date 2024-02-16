import Packet from './Packet';

import {decompress} from '../../vendor/gzip';
import Jagfile from './Jagfile';

export default class DiskStore {
    static buf: Uint8Array = new Uint8Array(520);

    dat: Packet;
    idx: Packet;
    store: number;

    constructor(dat: Uint8Array | Int8Array, idx: Uint8Array | Int8Array, store: number) {
        this.dat = new Packet(dat);
        this.idx = new Packet(idx);
        this.store = store + 1;
    }

    get fileCount(): number {
        return this.idx.length / 6;
    }

    read(file: number, raw: boolean = false): Uint8Array | Jagfile | null {
        this.idx.pos = 6 * file;

        const size: number = this.idx.g3;
        let sector: number = this.idx.g3;

        if (sector <= 0 || sector > this.dat.length / 520) {
            return null;
        }

        const data: Uint8Array = new Uint8Array(size);
        let position: number = 0;

        for (let part: number = 0; position < size; part++) {
            if (sector === 0) {
                return null;
            }

            this.dat.pos = sector * 520;

            let available: number = size - position;
            if (available > 512) {
                available = 512;
            }

            this.dat.gdata(available + 8, 0, DiskStore.buf);

            const sectorFile: number = ((DiskStore.buf[0] & 0xff) << 8) | (DiskStore.buf[1] & 0xff);
            const sectorPart: number = ((DiskStore.buf[2] & 0xff) << 8) | (DiskStore.buf[3] & 0xff);
            const nextSector: number = ((DiskStore.buf[4] & 0xff) << 16) | ((DiskStore.buf[5] & 0xff) << 8) | (DiskStore.buf[6] & 0xff);
            const sectorStore: number = DiskStore.buf[7] & 0xff;

            if (sectorFile !== file || sectorPart !== part || sectorStore !== this.store) {
                return null;
            }

            if (nextSector < 0 || nextSector > this.dat.length / 520) {
                return null;
            }

            for (let i: number = 0; i < available; i++) {
                data[position++] = DiskStore.buf[i + 8];
            }

            sector = nextSector;
        }

        if (raw) {
            return data;
        }

        if (this.store === 1) {
            return new Jagfile(data);
        }

        return decompress(data);
    }
}
