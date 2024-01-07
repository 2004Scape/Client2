import Draw2D from './Draw2D';

import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';

// identical to Pix24 except the image is indexed by a palette
export default class Pix8 {
    // constructor
    readonly pixels: Uint8Array;
    readonly width: number;
    readonly height: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;

    // runtime
    palette: Uint32Array | null = null;

    constructor(width: number, height: number) {
        this.pixels = new Uint8Array(width * height);
        this.width = this.cropW = width;
        this.height = this.cropH = height;
        this.cropX = this.cropY = 0;
    }

    static fromArchive = (archive: Jagfile, name: string, sprite: number = 0): Pix8 => {
        const dat = new Packet(archive?.read(name + '.dat'));
        const index = new Packet(archive?.read('index.dat'));

        // cropW/cropH are shared across all sprites in a single image
        index.pos = dat.g2;
        const cropW = index.g2;
        const cropH = index.g2;

        // palette is shared across all images in a single archive
        const paletteCount = index.g1;
        const palette = new Uint32Array(paletteCount);
        for (let i = 0; i < paletteCount - 1; i++) {
            // the first color (0) is reserved for transparency
            palette[i + 1] = index.g3;

            // black (0) will become transparent, make it black (1) so it's visible
            if (palette[i + 1] === 0) {
                palette[i + 1] = 1;
            }
        }

        // advance to sprite
        for (let i = 0; i < sprite; i++) {
            index.pos += 2;
            dat.pos += index.g2 * index.g2;
            index.pos += 1;
        }

        // read sprite
        const cropX = index.g1;
        const cropY = index.g1;
        const width = index.g2;
        const height = index.g2;

        const image = new Pix8(width, height);
        image.cropX = cropX;
        image.cropY = cropY;
        image.cropW = cropW;
        image.cropH = cropH;
        image.palette = palette;

        const pixelOrder = index.g1;
        if (pixelOrder === 0) {
            const length = image.width * image.height;
            for (let i = 0; i < length; i++) {
                image.pixels[i] = dat.g1;
            }
        } else if (pixelOrder === 1) {
            const width = image.width;
            for (let x = 0; x < width; x++) {
                const height = image.height;
                for (let y = 0; y < height; y++) {
                    image.pixels[x + y * width] = dat.g1;
                }
            }
        }

        return image;
    };

    draw = (x: number, y: number, newW: number = -1, newH: number = -1): void => {
        x = x | 0;
        y = y | 0;

        x += this.cropX;
        y += this.cropY;

        let dstOff = x + y * Draw2D.width;
        let srcOff = 0;

        let h = this.height;
        let w = this.width;

        if (newW !== -1) {
            w = newW;
        }

        if (newH !== -1) {
            h = newH;
        }

        let dstStep = Draw2D.width - w;
        let srcStep = 0;

        if (y < Draw2D.top) {
            const cutoff = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width;
        }

        if (y + h > Draw2D.bottom) {
            h -= y + h - Draw2D.bottom;
        }

        if (x < Draw2D.left) {
            const cutoff = Draw2D.left - x;
            w -= cutoff;
            x = Draw2D.left;
            srcOff += cutoff;
            dstOff += cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (x + w > Draw2D.right) {
            const cutoff = x + w - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImage(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
        }
    };

    copyImage = (w: number, h: number, src: Uint8Array | null, srcOff: number, srcStep: number, dst: Uint32Array | null, dstOff: number, dstStep: number): void => {
        if (src === null || dst === null || this.palette === null) {
            return;
        }

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const off = x + y * w;

                const p = src[srcOff + off];
                if (p != 0) {
                    dst[dstOff + off] = this.palette[p];
                }
            }

            srcOff += srcStep;
            dstOff += dstStep;
        }
    };
}
