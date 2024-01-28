import Draw2D from './Draw2D';

import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import Hashable from '../datastruct/Hashable';
import JavaRandom from '../util/JavaRandom';
import Colors from './Colors';

export default class PixFont extends Hashable {
    static CHARSET: number[] = [];

    static {
        const s: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

        for (let i: number = 0; i < 256; i++) {
            let c: number = s.indexOf(String.fromCharCode(i));

            if (c === -1) {
                c = 74; // space
            }

            PixFont.CHARSET[i] = c;
        }
    }

    pixels: Int8Array[] = [];
    charWidth: number[] = [];
    charHeight: number[] = [];
    clipX: number[] = [];
    clipY: number[] = [];
    charSpace: number[] = [];
    drawWidth: number[] = [];
    fontHeight: number = -1;
    random: JavaRandom = new JavaRandom(BigInt(Date.now()));

    static fromArchive = (archive: Jagfile, name: string): PixFont => {
        const dat: Packet = new Packet(archive.read(name + '.dat'));
        const index: Packet = new Packet(archive.read('index.dat'));

        index.pos = dat.g2 + 4; // skip cropW and cropH

        const paletteCount: number = index.g1;
        if (paletteCount > 0) {
            // skip palette
            index.pos += (paletteCount - 1) * 3;
        }

        const font: PixFont = new PixFont();

        for (let c: number = 0; c < 94; c++) {
            font.clipX[c] = index.g1;
            font.clipY[c] = index.g1;

            const width: number = (font.charWidth[c] = index.g2);
            const height: number = (font.charHeight[c] = index.g2);

            const size: number = width * height;
            font.pixels[c] = new Int8Array(size);

            const pixelOrder: number = index.g1;
            if (pixelOrder === 0) {
                for (let i: number = 0; i < width * height; i++) {
                    font.pixels[c][i] = dat.g1;
                }
            } else if (pixelOrder === 1) {
                for (let x: number = 0; x < width; x++) {
                    for (let y: number = 0; y < height; y++) {
                        font.pixels[c][x + y * width] = dat.g1;
                    }
                }
            }

            if (height > font.fontHeight) {
                font.fontHeight = height;
            }

            font.clipX[c] = 1;
            font.charSpace[c] = width + 2;

            {
                let i: number = 0;
                for (let y: number = Math.trunc(height / 7); y < height; y++) {
                    i += font.pixels[c][width + y * width];
                }

                if (i <= Math.trunc(height / 7)) {
                    font.charSpace[c]--;
                    font.clipX[c] = 0;
                }
            }

            {
                let i: number = 0;
                for (let y: number = Math.trunc(height / 7); y < height; y++) {
                    i += font.pixels[c][width + y * width - 1];
                }

                if (i <= Math.trunc(height / 7)) {
                    font.charSpace[c]--;
                }
            }
        }

        font.charSpace[94] = font.charSpace[8];
        for (let i: number = 0; i < 256; i++) {
            font.drawWidth[i] = font.charSpace[PixFont.CHARSET[i]];
        }

        return font;
    };

    draw = (x: number, y: number, str: string, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        const length: number = str.length;
        y -= this.fontHeight;
        for (let i: number = 0; i < length; i++) {
            const c: number = PixFont.CHARSET[str.charCodeAt(i)];

            if (c !== 94) {
                this.copyCharacter(x + this.clipX[c], y + this.clipY[c], this.charWidth[c], this.charHeight[c], this.pixels[c], color);
            }

            x += this.charSpace[c];
        }
    };

    drawStringTaggable = (x: number, y: number, str: string, color: number, shadowed: boolean): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        const length: number = str.length;
        y -= this.fontHeight;
        for (let i: number = 0; i < length; i++) {
            if (str.charAt(i) === '@' && i + 4 < length && str.charAt(i + 4) === '@') {
                color = this.evaluateTag(str.substring(i + 1, i + 4));
                i += 4;
            } else {
                const c: number = PixFont.CHARSET[str.charCodeAt(i)];

                if (c !== 94) {
                    if (shadowed) {
                        this.copyCharacter(x + this.clipX[c] + 1, y + this.clipY[c] + 1, this.charWidth[c], this.charHeight[c], this.pixels[c], Colors.BLACK);
                    }
                    this.copyCharacter(x + this.clipX[c], y + this.clipY[c], this.charWidth[c], this.charHeight[c], this.pixels[c], color);
                }

                x += this.charSpace[c];
            }
        }
    };

    stringWidth = (str: string): number => {
        const length: number = str.length;
        let w: number = 0;
        for (let i: number = 0; i < length; i++) {
            if (str.charAt(i) === '@' && i + 4 < length && str.charAt(i + 4) === '@') {
                i += 4;
            } else {
                w += this.drawWidth[str.charCodeAt(i)];
            }
        }

        return w;
    };

    drawString = (x: number, y: number, str: string, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        const offY: number = y - this.fontHeight;

        for (let i: number = 0; i < str.length; i++) {
            const c: number = PixFont.CHARSET[str.charCodeAt(i)];
            if (c !== 94) {
                this.drawChar(this.pixels[c], x + this.clipX[c], offY + this.clipY[c], this.charWidth[c], this.charHeight[c], color);
            }

            x += this.charSpace[c];
        }
    };

    drawStringTaggableCenter = (x: number, y: number, str: string, color: number, shadowed: boolean): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        this.drawStringTaggable(x - this.stringWidth(str) / 2, y, str, color, shadowed);
    };

    drawStringCenter = (x: number, y: number, str: string, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        this.draw(x - this.stringWidth(str) / 2, y, str, color);
    };

    drawStringTooltip = (x: number, y: number, str: string, color: number, shadowed: boolean, seed: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        this.random.setSeed(BigInt(seed));

        const rand: number = (this.random.nextInt() & 0x1f) + 192;
        const offY: number = y - this.fontHeight;
        for (let i: number = 0; i < str.length; i++) {
            if (str.charAt(i) === '@' && i + 4 < str.length && str.charAt(i + 4) === '@') {
                color = this.evaluateTag(str.substring(i + 1, i + 4));
                i += 4;
            } else {
                const c: number = PixFont.CHARSET[str.charCodeAt(i)];
                if (c !== 94) {
                    if (shadowed) {
                        this.drawCharAlpha(x + this.clipX[c] + 1, offY + this.clipY[c] + 1, this.charWidth[c], this.charHeight[c], Colors.BLACK, 192, this.pixels[c]);
                    }

                    this.drawCharAlpha(x + this.clipX[c], offY + this.clipY[c], this.charWidth[c], this.charHeight[c], color, rand, this.pixels[c]);
                }

                x += this.charSpace[c];
                if ((this.random.nextInt() & 0x3) === 0) {
                    x++;
                }
            }
        }
    };

    drawRight = (x: number, y: number, str: string, color: number, shadowed: boolean = true): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        if (shadowed) {
            this.draw(x - this.stringWidth(str) + 1, y + 1, str, Colors.BLACK);
        }
        this.draw(x - this.stringWidth(str), y, str, color);
    };

    drawChar = (data: Int8Array, x: number, y: number, w: number, h: number, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);
        w = Math.trunc(w);
        h = Math.trunc(h);

        let dstOff: number = x + y * Draw2D.width;
        let dstStep: number = Draw2D.width - w;

        let srcStep: number = 0;
        let srcOff: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width;
        }

        if (y + h >= Draw2D.bottom) {
            h -= y + h + 1 - Draw2D.bottom;
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

        if (x + w >= Draw2D.right) {
            const cutoff: number = x + w + 1 - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.drawMask(w, h, data, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep, color);
        }
    };

    drawCharAlpha = (x: number, y: number, w: number, h: number, color: number, alpha: number, mask: Int8Array): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);
        w = Math.trunc(w);
        h = Math.trunc(h);

        let dstOff: number = x + y * Draw2D.width;
        let dstStep: number = Draw2D.width - w;

        let srcStep: number = 0;
        let srcOff: number = 0;

        if (y < Draw2D.top) {
            const cutoff: number = Draw2D.top - y;
            h -= cutoff;
            y = Draw2D.top;
            srcOff += cutoff * w;
            dstOff += cutoff * Draw2D.width;
        }

        if (y + h >= Draw2D.bottom) {
            h -= y + h + 1 - Draw2D.bottom;
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

        if (x + w >= Draw2D.right) {
            const cutoff: number = x + w + 1 - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.drawMaskAlpha(w, h, Draw2D.pixels, dstOff, dstStep, mask, srcOff, srcStep, color, alpha);
        }
    };

    private drawMask = (w: number, h: number, src: Int8Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number, rgb: number): void => {
        w = Math.trunc(w);
        h = Math.trunc(h);

        const hw: number = -(w >> 2);
        w = -(w & 0x3);

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = hw; x < 0; x++) {
                if (src[srcOff++] === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                if (src[srcOff++] === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                if (src[srcOff++] === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }

                if (src[srcOff++] === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }
            }

            for (let x: number = w; x < 0; x++) {
                if (src[srcOff++] === 0) {
                    dstOff++;
                } else {
                    dst[dstOff++] = rgb;
                }
            }

            dstOff += dstStep;
            srcOff += srcStep;
        }
    };

    private drawMaskAlpha = (w: number, h: number, dst: Int32Array, dstOff: number, dstStep: number, mask: Int8Array, maskOff: number, maskStep: number, color: number, alpha: number): void => {
        w = Math.trunc(w);
        h = Math.trunc(h);

        const rgb: number = ((((color & 0xff00ff) * alpha) & 0xff00ff00) + (((color & 0xff00) * alpha) & 0xff0000)) >> 8;
        const invAlpha: number = 256 - alpha;

        for (let y: number = -h; y < 0; y++) {
            for (let x: number = -w; x < 0; x++) {
                if (mask[maskOff++] === 0) {
                    dstOff++;
                } else {
                    const dstRgb: number = dst[dstOff];
                    dst[dstOff++] = (((((dstRgb & 0xff00ff) * invAlpha) & 0xff00ff00) + (((dstRgb & 0xff00) * invAlpha) & 0xff0000)) >> 8) + rgb;
                }
            }

            dstOff += dstStep;
            maskOff += maskStep;
        }
    };

    private copyCharacter = (x: number, y: number, w: number, h: number, pixels: Int8Array, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);
        w = Math.trunc(w);
        h = Math.trunc(h);

        let dstOff: number = x + y * Draw2D.width;
        let srcOff: number = 0;

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
            h -= y + h + 1 - Draw2D.bottom;
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
            const cutoff: number = x + w + 1 - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImageMasked(w, h, pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep, color);
        }
    };

    copyImageMasked = (w: number, h: number, src: Int8Array, srcOff: number, srcStep: number, dst: Int32Array, dstOff: number, dstStep: number, color: number): void => {
        for (let y: number = 0; y < h; y++) {
            for (let x: number = 0; x < w; x++) {
                if (src[srcOff++] !== 0) {
                    dst[dstOff++] = color;
                } else {
                    dstOff++;
                }
            }

            srcOff += srcStep;
            dstOff += dstStep;
        }
    };

    evaluateTag = (tag: string): number => {
        if (tag === 'red') {
            return Colors.RED;
        } else if (tag === 'gre') {
            return Colors.GREEN;
        } else if (tag === 'blu') {
            return Colors.BLUE;
        } else if (tag === 'yel') {
            return Colors.YELLOW;
        } else if (tag === 'cya') {
            return Colors.CYAN;
        } else if (tag === 'mag') {
            return Colors.MAGENTA;
        } else if (tag === 'whi') {
            return Colors.WHITE;
        } else if (tag === 'bla') {
            return Colors.BLACK;
        } else if (tag === 'lre') {
            return Colors.LIGHTRED;
        } else if (tag === 'dre') {
            return Colors.DARKRED;
        } else if (tag === 'dbl') {
            return Colors.DARKBLUE;
        } else if (tag === 'or1') {
            return Colors.ORANGE1;
        } else if (tag === 'or2') {
            return Colors.ORANGE2;
        } else if (tag === 'or3') {
            return Colors.ORANGE3;
        } else if (tag === 'gr1') {
            return Colors.GREEN1;
        } else if (tag === 'gr2') {
            return Colors.GREEN2;
        } else if (tag === 'gr3') {
            return Colors.GREEN3;
        } else {
            return Colors.BLACK;
        }
    };

    //

    split(str: string, maxWidth: number): string[] {
        if (str.length === 0) {
            // special case for empty string
            return [str];
        }

        const lines: string[] = [];
        while (str.length > 0) {
            // check if the string even needs to be broken up
            const width: number = this.stringWidth(str);
            if (width <= maxWidth && str.indexOf('|') === -1) {
                lines.push(str);
                break;
            }

            // we need to split on the next word boundary
            let splitIndex: number = str.length;

            // check the width at every space to see where we can cut the line
            for (let i: number = 0; i < str.length; i++) {
                if (str[i] === ' ') {
                    const w: number = this.stringWidth(str.substring(0, i));
                    if (w > maxWidth) {
                        break;
                    }

                    splitIndex = i;
                } else if (str[i] === '|') {
                    splitIndex = i;
                    break;
                }
            }

            lines.push(str.substring(0, splitIndex));
            str = str.substring(splitIndex + 1);
        }

        return lines;
    }
}
