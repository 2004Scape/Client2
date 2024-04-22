import Draw2D from './Draw2D';

import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';

import Hashable from '../datastruct/Hashable';

import {decodeJpeg} from './Jpeg';
import Pix8 from './Pix8';

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
        if (!dat) {
            throw new Error(`${name} jpeg not found!`);
        }
        const jpeg: ImageData = await decodeJpeg(dat);
        const image: Pix24 = new Pix24(jpeg.width, jpeg.height);

        const data: Uint32Array = new Uint32Array(jpeg.data.buffer);
        const pixels: Int32Array = image.pixels;
        for (let i: number = 0; i < pixels.length; i++) {
            const pixel: number = data[i];
            pixels[i] = (((pixel >> 24) & 0xff) << 24) | ((pixel & 0xff) << 16) | (((pixel >> 8) & 0xff) << 8) | ((pixel >> 16) & 0xff);
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

        if (dat.pos > dat.length || index.pos > index.length) {
            throw new Error();
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

    bind(): void {
        Draw2D.bind(this.pixels, this.width, this.height);
    }

    draw(x: number, y: number): void {
        x |= 0;
        y |= 0;

        x += this.cropX;
        y += this.cropY;

        let dstOff: number = x + y * Draw2D.width2d;
        let srcOff: number = 0;

        let h: number = this.height;
        let w: number = this.width;

        let dstStep: number = Draw2D.width2d - w;
        let srcStep: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width2d;
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
    }

    drawAlpha(alpha: number, x: number, y: number): void {
        x |= 0;
        y |= 0;

        x += this.cropX;
        y += this.cropY;

        let dstStep: number = x + y * Draw2D.width2d;
        let srcStep: number = 0;
        let h: number = this.height;
        let w: number = this.width;
        let dstOff: number = Draw2D.width2d - w;
        let srcOff: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcStep += cutoff * w;
            dstStep += cutoff * Draw2D.width2d;
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
    }

    blitOpaque(x: number, y: number): void {
        x |= 0;
        y |= 0;

        x += this.cropX;
        y += this.cropY;

        let dstOff: number = x + y * Draw2D.width2d;
        let srcOff: number = 0;

        let h: number = this.height;
        let w: number = this.width;

        let dstStep: number = Draw2D.width2d - w;
        let srcStep: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width2d;
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
    }

    flipHorizontally(): void {
        const pixels: Int32Array = this.pixels;
        const width: number = this.width;
        const height: number = this.height;

        for (let y: number = 0; y < height; y++) {
            const div: number = (width / 2) | 0;
            for (let x: number = 0; x < div; x++) {
                const off1: number = x + y * width;
                const off2: number = width - x - 1 + y * width;

                const tmp: number = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    }

    flipVertically(): void {
        const pixels: Int32Array = this.pixels;
        const width: number = this.width;
        const height: number = this.height;

        for (let y: number = 0; y < ((height / 2) | 0); y++) {
            for (let x: number = 0; x < width; x++) {
                const off1: number = x + y * width;
                const off2: number = x + (height - y - 1) * width;

                const tmp: number = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    }

    translate(r: number, g: number, b: number): void {
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
    }

    crop(x: number, y: number, w: number, h: number): void {
        x |= 0;
        y |= 0;
        w |= 0;
        h |= 0;

        try {
            const currentW: number = this.width;
            // const currentH: number = this.height; // dead code

            let offW: number = 0;
            let offH: number = 0;
            // let scaleWidth: number = (currentW << 16) / w; // dead code
            // let scaleHeight: number = (currentH << 16) / h; // dead code

            const cw: number = this.cropW;
            const ch: number = this.cropH;
            const scaleCropWidth: number = ((cw << 16) / w) | 0;
            const scaleCropHeight: number = ((ch << 16) / h) | 0;

            x += ((this.cropX * w + cw - 1) / cw) | 0;
            y += ((this.cropY * h + ch - 1) / ch) | 0;

            if ((this.cropX * w) % cw !== 0) {
                offW = (((cw - ((this.cropX * w) % cw)) << 16) / w) | 0;
            }

            if ((this.cropY * h) % ch !== 0) {
                offH = (((ch - ((this.cropY * h) % ch)) << 16) / h) | 0;
            }

            w = ((w * (this.width - (offW >> 16))) / cw) | 0;
            h = ((h * (this.height - (offH >> 16))) / ch) | 0;

            let dstStep: number = x + y * Draw2D.width2d;
            let dstOff: number = Draw2D.width2d - w;

            if (y < Draw2D.top) {
                const cutoff: number = Draw2D.top - y;
                h -= cutoff;
                y = 0;
                dstStep += cutoff * Draw2D.width2d;
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
    }

    drawRotatedMasked(x: number, y: number, w: number, h: number, lineStart: Int32Array, lineWidth: Int32Array, anchorX: number, anchorY: number, theta: number, zoom: number): void {
        x |= 0;
        y |= 0;
        w |= 0;
        h |= 0;

        try {
            const centerX: number = (-w / 2) | 0;
            const centerY: number = (-h / 2) | 0;

            const sin: number = (Math.sin(theta / 326.11) * 65536.0) | 0;
            const cos: number = (Math.cos(theta / 326.11) * 65536.0) | 0;
            const sinZoom: number = (sin * zoom) >> 8;
            const cosZoom: number = (cos * zoom) >> 8;

            let leftX: number = (anchorX << 16) + centerY * sinZoom + centerX * cosZoom;
            let leftY: number = (anchorY << 16) + (centerY * cosZoom - centerX * sinZoom);
            let leftOff: number = x + y * Draw2D.width2d;

            for (let i: number = 0; i < h; i++) {
                const dstOff: number = lineStart[i];
                let dstX: number = leftOff + dstOff;

                let srcX: number = leftX + cosZoom * dstOff;
                let srcY: number = leftY - sinZoom * dstOff;
                for (let j: number = -lineWidth[i]; j < 0; j++) {
                    Draw2D.pixels[dstX++] = this.pixels[(srcX >> 16) + (srcY >> 16) * this.width];
                    srcX += cosZoom;
                    srcY -= sinZoom;
                }

                leftX += sinZoom;
                leftY += cosZoom;
                leftOff += Draw2D.width2d;
            }
        } catch (e) {
            /* empty */
        }
    }

    drawMasked(x: number, y: number, mask: Pix8): void {
        x |= 0;
        y |= 0;

        x += this.cropX;
        y += this.cropY;

        let dstStep: number = x + y * Draw2D.width2d;
        let srcStep: number = 0;
        let h: number = this.height;
        let w: number = this.width;
        let dstOff: number = Draw2D.width2d - w;
        let srcOff: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcStep += cutoff * w;
            dstStep += cutoff * Draw2D.width2d;
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
            this.copyPixelsMasked(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstStep, dstOff, mask.pixels);
        }
    }

    private scale(w: number, h: number, src: Int32Array, offW: number, offH: number, dst: Int32Array, dstStep: number, dstOff: number, currentW: number, scaleCropWidth: number, scaleCropHeight: number): void {
        try {
            const lastOffW: number = offW;
            for (let y: number = -h; y < 0; y++) {
                const offY: number = (offH >> 16) * currentW;
                for (let x: number = -w; x < 0; x++) {
                    const rgb: number = src[(offW >> 16) + offY];
                    if (rgb === 0) {
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
    }

    private copyImageBlitOpaque(w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number): void {
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
    }

    private copyPixelsAlpha(w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number, alpha: number): void {
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
    }

    private copyImageDraw(w: number, h: number, src: Int32Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number): void {
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
    }

    private copyPixelsMasked(w: number, h: number, src: Int32Array, srcStep: number, srcOff: number, dst: Int32Array, dstOff: number, dstStep: number, mask: Int8Array): void {
        const qw: number = -(w >> 2);
        w = -(w & 0x3);

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = qw; x < 0; x++) {
                let rgb: number = src[srcOff++];
                if (rgb !== 0 && mask[dstOff] === 0) {
                    dst[dstOff++] = rgb;
                } else {
                    dstOff++;
                }

                rgb = src[srcOff++];
                if (rgb !== 0 && mask[dstOff] === 0) {
                    dst[dstOff++] = rgb;
                } else {
                    dstOff++;
                }

                rgb = src[srcOff++];
                if (rgb !== 0 && mask[dstOff] === 0) {
                    dst[dstOff++] = rgb;
                } else {
                    dstOff++;
                }

                rgb = src[srcOff++];
                if (rgb !== 0 && mask[dstOff] === 0) {
                    dst[dstOff++] = rgb;
                } else {
                    dstOff++;
                }
            }

            for (let x: number = w; x < 0; x++) {
                const rgb: number = src[srcOff++];
                if (rgb !== 0 && mask[dstOff] === 0) {
                    dst[dstOff++] = rgb;
                } else {
                    dstOff++;
                }
            }

            dstOff += dstStep;
            srcOff += srcStep;
        }
    }
}
