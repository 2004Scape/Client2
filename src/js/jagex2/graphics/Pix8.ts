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
    palette: number[] = [];

    constructor(width: number, height: number) {
        this.pixels = new Uint8Array(width * height);
        this.width = this.cropW = width;
        this.height = this.cropH = height;
        this.cropX = this.cropY = 0;
    }

    static fromArchive = (archive: Jagfile, name: string, sprite: number = 0): Pix8 => {
        const dat: Packet = new Packet(archive.read(name + '.dat'));
        const index: Packet = new Packet(archive.read('index.dat'));

        // cropW/cropH are shared across all sprites in a single image
        index.pos = dat.g2;
        const cropW: number = index.g2;
        const cropH: number = index.g2;

        // palette is shared across all images in a single archive
        const paletteCount: number = index.g1;
        const palette: number[] = [];
        for (let i: number = 0; i < paletteCount - 1; i++) {
            // the first color (0) is reserved for transparency
            palette[i + 1] = index.g3;

            // black (0) will become transparent, make it black (1) so it's visible
            if (palette[i + 1] === 0) {
                palette[i + 1] = 1;
            }
        }

        // advance to sprite
        for (let i: number = 0; i < sprite; i++) {
            index.pos += 2;
            dat.pos += index.g2 * index.g2;
            index.pos += 1;
        }

        // read sprite
        const cropX: number = index.g1;
        const cropY: number = index.g1;
        const width: number = index.g2;
        const height: number = index.g2;

        const image: Pix8 = new Pix8(width, height);
        image.cropX = cropX;
        image.cropY = cropY;
        image.cropW = cropW;
        image.cropH = cropH;
        image.palette = palette;

        const pixelOrder: number = index.g1;
        if (pixelOrder === 0) {
            const length: number = image.width * image.height;
            for (let i: number = 0; i < length; i++) {
                image.pixels[i] = dat.g1;
            }
        } else if (pixelOrder === 1) {
            const width: number = image.width;
            for (let x: number = 0; x < width; x++) {
                const height: number = image.height;
                for (let y: number = 0; y < height; y++) {
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

        let dstOff: number = x + y * Draw2D.width;
        let srcOff: number = 0;

        let h: number = this.height;
        let w: number = this.width;

        if (newW !== -1) {
            w = newW;
        }

        if (newH !== -1) {
            h = newH;
        }

        let dstStep: number = Draw2D.width - w;
        let srcStep: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width;
        }

        if (y + h > Draw2D.bottom) {
            h -= y + h - Draw2D.bottom;
        }

        if (x < Draw2D.left) {
            const cutoff: number = Draw2D.left - x;
            w -= cutoff;
            x = Draw2D.left;
            srcOff += cutoff;
            dstOff += cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (x + w > Draw2D.right) {
            const cutoff: number = x + w - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImage(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
        }
    };

    flipHorizontally = (): void => {
        const pixels: Uint8Array = this.pixels;
        const width: number = this.width;
        const height: number = this.height;

        for (let y: number = 0; y < height; y++) {
            const div: number = width / 2;
            for (let x: number = 0; x < div; x++) {
                const off1: number = x + y * width;
                const off2: number = width - x - 1 + y * width;

                const tmp: number = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    };

    flipVertically = (): void => {
        const pixels: Uint8Array = this.pixels;
        const width: number = this.width;
        const height: number = this.height;

        for (let y: number = 0; y < height / 2; y++) {
            for (let x: number = 0; x < width; x++) {
                const off1: number = x + y * width;
                const off2: number = x + (height - y - 1) * width;

                const tmp: number = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    };

    translate = (r: number, g: number, b: number): void => {
        for (let i: number = 0; i < this.palette.length; i++) {
            let red: number = (this.palette[i] >> 16) & 0xff;
            red += r;
            if (red < 0) {
                red = 0;
            } else if (red > 255) {
                red = 255;
            }

            let green: number = (this.palette[i] >> 8) & 0xff;
            green += g;
            if (green < 0) {
                green = 0;
            } else if (green > 255) {
                green = 255;
            }

            let blue: number = this.palette[i] & 0xff;
            blue += b;
            if (blue < 0) {
                blue = 0;
            } else if (blue > 255) {
                blue = 255;
            }

            this.palette[i] = (red << 16) + (green << 8) + blue;
        }
    };

    private copyImage = (w: number, h: number, src: Uint8Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number): void => {
        for (let y: number = 0; y < h; y++) {
            for (let x: number = 0; x < w; x++) {
                const off: number = x + y * w;

                const p: number = src[srcOff + off];
                if (p != 0) {
                    dst[dstOff + off] = this.palette[p];
                }
            }

            srcOff += srcStep;
            dstOff += dstStep;
        }
    };
}
