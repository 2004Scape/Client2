import Buffer from './Buffer.js';
import Draw2D from './Draw2D.js';
import { decodeJpeg } from './Util.js';

export default class Image24 {
    pixels = null;

    width = -1;
    height = -1;
    cropX = -1;
    cropY = -1;
    cropW = -1;
    cropH = -1;

    constructor(width, height) {
        this.pixels = new Uint32Array(width * height);
        this.width = this.cropW = width;
        this.height = this.cropH = height;
        this.cropX = this.cropY = 0;
    }

    static async fromJpeg(archive, name) {
        let dat = archive.read(name + '.dat');
        let jpeg = await decodeJpeg(dat);
        let image = new Image24(jpeg.width, jpeg.height);

        // copy pixels (uint32) to imageData (uint8)
        let pixels = image.pixels;
        let data = jpeg.data;
        for (let i = 0; i < pixels.length; i++) {
            let index = i * 4;
            pixels[i] = (data[index + 3] << 24) | (data[index + 0] << 16) | (data[index + 1] << 8) | (data[index + 2] << 0);
        }

        return image;
    }

    static fromArchive(archive, name, sprite = 0) {
        let dat = new Buffer(archive.read(name + '.dat'));
        let index = new Buffer(archive.read('index.dat'));

        // cropW/cropH are shared across all sprites in a single image
        index.pos = dat.g2();
        let cropW = index.g2();
        let cropH = index.g2();

        // palette is shared across all images in a single archive
        let paletteCount = index.g1();
        let palette = new Uint32Array(paletteCount);
        for (let i = 0; i < paletteCount - 1; i++) {
            // the first color (0) is reserved for transparency
            palette[i + 1] = index.g3();

            // black (0) will become transparent, make it black (1) so it's visible
            if (palette[i + 1] === 0) {
                palette[i + 1] = 1;
            }

            // add alpha channel
            if (palette[i + 1] > 0) {
                palette[i + 1] |= 0xFF000000;
            }
        }

        // advance to sprite
        for (let i = 0; i < sprite; i++) {
            index.pos += 2;
            dat.pos += index.g2() * index.g2();
            index.pos += 1;
        }

        // read sprite
        let cropX = index.g1();
        let cropY = index.g1();
        let width = index.g2();
        let height = index.g2();

        let image = new Image24(width, height);
        image.cropX = cropX;
        image.cropY = cropY;
        image.cropW = cropW;
        image.cropH = cropH;

        let pixelOrder = index.g1();
        if (pixelOrder === 0) {
            for (let i = 0; i < image.width * image.height; i++) {
                image.pixels[i] = palette[dat.g1()];
            }
        } else if (pixelOrder === 1) {
            for (let x = 0; x < image.width; x++) {
                for (let y = 0; y < image.height; y++) {
                    image.pixels[x + (y * image.width)] = palette[dat.g1()];
                }
            }
        }

        return image;
    }

    draw(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        x += this.cropX;
        y += this.cropY;

        let dstOff = x + (y * Draw2D.width);
        let srcOff = 0;

        let h = this.height;
        let w = this.width;

        let dstStep = Draw2D.width - w;
        let srcStep = 0;

        if (y < Draw2D.top) {
            let cutoff = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width;
        }

        if (y + h > Draw2D.bottom) {
            h -= (y + h) - Draw2D.bottom;
        }

        if (x < Draw2D.left) {
            let cutoff = Draw2D.left - x;
            w -= cutoff;
            x = Draw2D.left;
            srcOff += cutoff;
            dstOff += cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (x + w > Draw2D.right) {
            let cutoff = (x + w) - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImage(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
        }
    }

    copyImage(w, h, src, srcOff, srcStep, dst, dstOff, dstStep) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let off = x + (y * w);
                let rgb = src[srcOff + off];

                if (rgb !== 0) {
                    dst[dstOff + off] = src[srcOff + off];
                }
            }

            srcOff += srcStep;
            dstOff += dstStep;
        }
    }

    flipHorizontally() {
        let pixels = this.pixels;
        let width = this.width;
        let height = this.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                let off1 = x + (y * width);
                let off2 = width - x - 1 + (y * width);

                let tmp = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    }

    flipVertically() {
        let pixels = this.pixels;
        let width = this.width;
        let height = this.height;

        for (let y = 0; y < height / 2; y++) {
            for (let x = 0; x < width; x++) {
                let off1 = x + (y * width);
                let off2 = x + ((height - y - 1) * width);

                let tmp = pixels[off1];
                pixels[off1] = pixels[off2];
                pixels[off2] = tmp;
            }
        }
    }
}
