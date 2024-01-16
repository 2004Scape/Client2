import Draw2D from './Draw2D';

import {decodeJpeg} from '../util/JsUtil';
import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import Hashable from '../datastruct/Hashable';

export default class Pix24 extends Hashable {
    // constructor
    readonly pixels: Int32Array;
    readonly width: number;
    readonly height: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;

    constructor(width: number, height: number) {
        super();
        this.pixels = new Int32Array(width * height);
        this.width = this.cropW = width;
        this.height = this.cropH = height;
        this.cropX = this.cropY = 0;
    }

    static fromJpeg = async (archive: Jagfile, name: string): Promise<Pix24> => {
        const dat: Uint8Array | null = archive.read(name + '.dat');
        const jpeg: ImageData = await decodeJpeg(dat);
        const image: Pix24 = new Pix24(jpeg.width, jpeg.height);

        // copy pixels (uint32) to imageData (uint8)
        const pixels: Int32Array = image.pixels;
        const data: Uint8ClampedArray = jpeg.data;
        for (let i: number = 0; i < pixels.length; i++) {
            const index: number = i * 4;
            pixels[i] = (data[index + 3] << 24) | (data[index] << 16) | (data[index + 1] << 8) | (data[index + 2] << 0);
        }

        return image;
    };

    static fromArchive = (archive: Jagfile, name: string, sprite: number = 0): Pix24 => {
        const dat: Packet = new Packet(archive.read(name + '.dat'));
        const index: Packet = new Packet(archive.read('index.dat'));

        // cropW/cropH are shared across all sprites in a single image
        index.pos = dat.g2;
        const cropW: number = index.g2;
        const cropH: number = index.g2;

        // palette is shared across all images in a single archive
        const paletteCount: number = index.g1;
        const palette: number[] = [];
        const length: number = paletteCount - 1;
        for (let i: number = 0; i < length; i++) {
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

        const image: Pix24 = new Pix24(width, height);
        image.cropX = cropX;
        image.cropY = cropY;
        image.cropW = cropW;
        image.cropH = cropH;

        const pixelOrder: number = index.g1;
        if (pixelOrder === 0) {
            const length: number = image.width * image.height;
            for (let i: number = 0; i < length; i++) {
                image.pixels[i] = palette[dat.g1];
            }
        } else if (pixelOrder === 1) {
            const width: number = image.width;
            for (let x: number = 0; x < width; x++) {
                const height: number = image.height;
                for (let y: number = 0; y < height; y++) {
                    image.pixels[x + y * width] = palette[dat.g1];
                }
            }
        }

        return image;
    };

    draw = (x: number, y: number): void => {
        x = x | 0;
        y = y | 0;

        x += this.cropX;
        y += this.cropY;

        let dstOff: number = x + y * Draw2D.width;
        let srcOff: number = 0;

        let h: number = this.height;
        let w: number = this.width;

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
            this.copyImageDraw(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
        }
    };

    drawAlpha = (alpha: number, x: number, y: number): void => {
        x = x | 0;
        y = y | 0;

        x += this.cropX;
        y += this.cropY;

        let dstStep: number = x + y * Draw2D.width;
        let srcStep: number = 0;
        let h: number = this.height;
        let w: number = this.width;
        let dstOff: number = Draw2D.width - w;
        let srcOff: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcStep += cutoff * w;
            dstStep += cutoff * Draw2D.width;
        }

        if (y + h > Draw2D.bottom) {
            h -= y + h - Draw2D.bottom;
        }

        if (x < Draw2D.left) {
            const cutoff: number = Draw2D.left - x;
            w -= cutoff;
            x = Draw2D.left;
            srcStep += cutoff;
            dstStep += cutoff;
            srcOff += cutoff;
            dstOff += cutoff;
        }

        if (x + w > Draw2D.right) {
            const cutoff: number = x + w - Draw2D.right;
            w -= cutoff;
            srcOff += cutoff;
            dstOff += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyPixelsAlpha(w, h, this.pixels, srcStep, srcOff, Draw2D.pixels, dstStep, dstOff, alpha);
        }
    };

    blitOpaque = (x: number, y: number): void => {
        x = x | 0;
        y = y | 0;

        x += this.cropX;
        y += this.cropY;

        let dstOff: number = x + y * Draw2D.width;
        let srcOff: number = 0;

        let h: number = this.height;
        let w: number = this.width;

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
            this.copyImageBlitOpaque(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
        }
    };

    flipHorizontally = (): void => {
        const pixels: Int32Array = this.pixels;
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
        const pixels: Int32Array = this.pixels;
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
        for (let i: number = 0; i < this.pixels.length; i++) {
            const rgb: number = this.pixels[i];

            if (rgb !== 0) {
                let red: number = (rgb >> 16) & 0xff;
                red += r;
                if (red < 1) {
                    red = 1;
                } else if (red > 255) {
                    red = 255;
                }

                let green: number = (rgb >> 8) & 0xff;
                green += g;
                if (green < 1) {
                    green = 1;
                } else if (green > 255) {
                    green = 255;
                }

                let blue: number = rgb & 0xff;
                blue += b;
                if (blue < 1) {
                    blue = 1;
                } else if (blue > 255) {
                    blue = 255;
                }

                this.pixels[i] = (red << 16) + (green << 8) + blue;
            }
        }
    };

    crop = (x: number, y: number, w: number, h: number): void => {
        x = x | 0;
        y = y | 0;
        w = w | 0;
        h = h | 0;

        try {
            const currentW: number = this.width;
            // const currentH: number = this.height; // dead code

            let offW: number = 0;
            let offH: number = 0;
            // let scaleWidth: number = (currentW << 16) / w; // dead code
            // let scaleHeight: number = (currentH << 16) / h; // dead code

            const cw: number = this.cropW;
            const ch: number = this.cropH;
            const scaleCropWidth: number = (cw << 16) / w;
            const scaleCropHeight: number = (ch << 16) / h;

            x += (this.cropX * w + cw - 1) / cw;
            y += (this.cropY * h + ch - 1) / ch;

            if ((this.cropX * w) % cw != 0) {
                offW = ((cw - ((this.cropX * w) % cw)) << 16) / w;
            }

            if ((this.cropY * h) % ch != 0) {
                offH = ((ch - ((this.cropY * h) % ch)) << 16) / h;
            }

            w = (w * (this.width - (offW >> 16))) / cw;
            h = (h * (this.height - (offH >> 16))) / ch;

            let dstStep: number = x + y * Draw2D.width;
            let dstOff: number = Draw2D.width - w;

            if (y < Draw2D.top) {
                const cutoff: number = Draw2D.top - y;
                h -= cutoff;
                y = 0;
                dstStep += cutoff * Draw2D.width;
                offH += scaleCropHeight * cutoff;
            }

            if (y + h > Draw2D.bottom) {
                h -= y + h - Draw2D.bottom;
            }

            if (x < Draw2D.left) {
                const cutoff: number = Draw2D.left - x;
                w -= cutoff;
                x = 0;
                dstStep += cutoff;
                offW += scaleCropWidth * cutoff;
                dstOff += cutoff;
            }

            if (x + w > Draw2D.right) {
                const cutoff: number = x + w - Draw2D.right;
                w -= cutoff;
                dstOff += cutoff;
            }

            this.scale(w, h, this.pixels, offW, offH, Draw2D.pixels, dstOff, dstStep, currentW, scaleCropWidth, scaleCropHeight);
        } catch (e) {
            console.error('error in sprite clipping routine');
        }
    };

    private scale = (w: number, h: number, src: Int32Array, offW: number, offH: number, dst: Int32Array, dstStep: number, dstOff: number, currentW: number, scaleCropWidth: number, scaleCropHeight: number): void => {
        try {
            const lastOffW: number = offW;
            for (let y: number = -h; y < 0; y++) {
                const offY: number = (offH >> 16) * currentW;
                for (let x: number = -w; x < 0; x++) {
                    const rgb: number = src[(offW >> 16) + offY];
                    if (rgb == 0) {
                        dstOff++;
                    } else {
                        dst[dstOff++] = rgb;
                    }
                    offW += scaleCropWidth;
                }
                offH += scaleCropHeight;
                offW = lastOffW;
                dstOff += dstStep;
            }
        } catch (e) {
            console.error('error in plot_scale');
        }
    };

    private copyImageBlitOpaque = (w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number): void => {
        const qw: number = -(w >> 2);
        w = -(w & 0x3);

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = qw; x < 0; x++) {
                dst[dstOff++] = src[srcOff++];
                dst[dstOff++] = src[srcOff++];
                dst[dstOff++] = src[srcOff++];
                dst[dstOff++] = src[srcOff++];
            }

            for (let x: number = w; x < 0; x++) {
                dst[dstOff++] = src[srcOff++];
            }

            dstOff += dstStep;
            srcOff += srcStep;
        }
    };

    private copyPixelsAlpha = (w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number, alpha: number): void => {
        const invAlpha: number = 256 - alpha;

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = -w; x < 0; x++) {
                const rgb: number = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    const dstRgb: number = dst[dstOff];
                    dst[dstOff++] = ((((rgb & 0xff00ff) * alpha + (dstRgb & 0xff00ff) * invAlpha) & 0xff00ff00) + (((rgb & 0xff00) * alpha + (dstRgb & 0xff00) * invAlpha) & 0xff0000)) >> 8;
                }
            }

            dstOff += dstStep;
            srcOff += srcStep;
        }
    };

    private copyImageDraw = (w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number): void => {
        const qw: number = -(w >> 2);
        w = -(w & 0x3);

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = qw; x < 0; x++) {
                let rgb: number = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                rgb = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                rgb = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                rgb = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }
            }

            for (let x: number = w; x < 0; x++) {
                const rgb: number = src[srcOff++];
                if (rgb === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }
            }

            dstOff += dstStep;
            srcOff += srcStep;
        }
    };
}
