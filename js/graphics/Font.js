import Draw2D from './Draw2D.js';

import Buffer from '../io/Buffer.js';

export default class Font {
    static CHARSET = [];

    static {
        let s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"£$%^&*()-_=+[{]};:'@#~,<.>/?\\| ";

        for (let i = 0; i < 256; i++) {
            let c = s.indexOf(String.fromCharCode(i));

            if (c == -1) {
                c = 74; // space
            }

            Font.CHARSET[i] = c;
        }
    }

    pixels = [];
    charWidth = [];
    charHeight = [];
    clipX = [];
    clipY = [];
    charSpace = [];
    drawWidth = [];
    fontHeight = -1;

    static fromArchive(archive, name) {
        let dat = new Buffer(archive.read(name + '.dat'));
        let index = new Buffer(archive.read('index.dat'));

        index.pos = dat.g2() + 4; // skip cropW and cropH

        let paletteCount = index.g1();
        if (paletteCount > 0) {
            // skip palette
            index.pos += (paletteCount - 1) * 3;
        }

        let font = new Font();

        for (let c = 0; c < 94; c++) {
            font.clipX[c] = index.g1();
            font.clipY[c] = index.g1();

            let width = font.charWidth[c] = index.g2();
            let height = font.charHeight[c] = index.g2();

            let size = width * height;
            font.pixels[c] = new Uint8Array(size);

            let pixelOrder = index.g1();
            if (pixelOrder === 0) {
                for (let i = 0; i < width * height; i++) {
                    font.pixels[c][i] = dat.g1();
                }
            } else if (pixelOrder === 1) {
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y++) {
                        font.pixels[c][x + (y * width)] = dat.g1();
                    }
                }
            }

            if (height > font.fontHeight) {
                font.fontHeight = height;
            }

            font.clipX[c] = 1;
            font.charSpace[c] = width + 2;

            {
                let i = 0;
                for (let y = height / 7; y < height; y++) {
                    i += font.pixels[c][width + (y * width)];
                }

                if (i <= height / 7) {
                    font.charSpace[c]--;
                    font.clipX[c] = 0;
                }
            }

            {
                let i = 0;
                for (let y = height / 7; y < height; y++) {
                    i += font.pixels[c][width + (y * width) - 1];
                }

                if (i <= height / 7) {
                    font.charSpace[c]--;
                }
            }
        }

        font.charSpace[94] = font.charSpace[8];
        for (let i = 0; i < 256; i++) {
            font.drawWidth[i] = font.charSpace[Font.CHARSET[i]];
        }

        return font;
    }

    draw(x, y, str, color) {
        if (!str) {
            return;
        }

        x = Math.trunc(x);
        y = Math.trunc(y);

        y -= this.fontHeight;
        for (let i = 0; i < str.length; i++) {
            let c = Font.CHARSET[str.charCodeAt(i)];

            if (c != 94) {
                this.copyCharacter(x + this.clipX[c], y + this.clipY[c], this.charWidth[c], this.charHeight[c], this.pixels[c], color);
            }

            x += this.charSpace[c];
        }

    }

    getTextWidth(str) {
        if (!str) {
            return 0;
        }

        let w = 0;
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) === '@' && i + 4 < str.length && str.charAt(i + 4) === '@') {
                i += 4;
            } else {
                w += this.drawWidth[str.charCodeAt(i)];
            }
        }

        return w;
    }

    drawCentered(x, y, str, color, shadowed = true) {
        if (shadowed) {
            this.draw(x - (this.getTextWidth(str) / 2) + 1, y +1, str, 0);
        }

        this.draw(x - (this.getTextWidth(str) / 2), y, str, color);
    }

    copyCharacter(x, y, w, h, pixels, color) {
        x = Math.trunc(x);
        y = Math.trunc(y);
        w = Math.trunc(w);
        h = Math.trunc(h);

        let dstOff = x + (y * Draw2D.width);
        let srcOff = 0;

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
            h -= y + h + 1 - Draw2D.bottom;
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
            let cutoff = x + w + 1 - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImageMasked(w, h, pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep, color);
        }
    }

    copyImageMasked(w, h, src, srcOff, srcStep, dst, dstOff, dstStep, color) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (src[srcOff++] != 0) {
                    dst[dstOff++] = color;
                } else {
                    dstOff++;
                }
            }

            srcOff += srcStep;
            dstOff += dstStep;
        }
    }
}
