import Draw2D from './Draw2D';

import Archive from '../io/Archive';
import Packet from '../io/Packet';

export default class Font {
    static CHARSET: number[] = [];

    static {
        const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

        for (let i = 0; i < 256; i++) {
            let c = s.indexOf(String.fromCharCode(i));

            if (c === -1) {
                c = 74; // space
            }

            Font.CHARSET[i] = c;
        }
    }

    pixels: Uint8Array[] = []
    charWidth: number[] = [];
    charHeight: number[] = [];
    clipX: number[] = [];
    clipY: number[] = [];
    charSpace: number[] = [];
    drawWidth: number[] = [];
    fontHeight: number = -1;

    static fromArchive = (archive: Archive, name: string): Font => {
        const dat = new Packet(archive.read(name + '.dat'));
        const index = new Packet(archive.read('index.dat'));

        index.pos = dat.g2 + 4; // skip cropW and cropH

        const paletteCount = index.g1;
        if (paletteCount > 0) {
            // skip palette
            index.pos += (paletteCount - 1) * 3;
        }

        const font: Font = new Font();

        for (let c = 0; c < 94; c++) {
            font.clipX[c] = index.g1;
            font.clipY[c] = index.g1;

            const width = font.charWidth[c] = index.g2;
            const height = font.charHeight[c] = index.g2;

            const size = width * height;
            font.pixels[c] = new Uint8Array(size);

            const pixelOrder = index.g1;
            if (pixelOrder === 0) {
                for (let i = 0; i < width * height; i++) {
                    font.pixels[c][i] = dat.g1;
                }
            } else if (pixelOrder === 1) {
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y++) {
                        font.pixels[c][x + (y * width)] = dat.g1;
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
    };

    draw = (x: number, y: number, str: string, color: number): void => {
        x = Math.trunc(x);
        y = Math.trunc(y);

        const length = str.length;
        y -= this.fontHeight;
        for (let i = 0; i < length; i++) {
            const c = Font.CHARSET[str.charCodeAt(i)];

            if (c !== 94) {
                this.copyCharacter(x + this.clipX[c], y + this.clipY[c], this.charWidth[c], this.charHeight[c], this.pixels[c], color);
            }

            x += this.charSpace[c];
        }

    };

    drawStringTaggable = (x: number, y: number, str: string, color: number, shadowed: boolean): void => {
        x = x | 0;
        y = y | 0;

        const length = str.length;
        y -= this.fontHeight;
        for (let i = 0; i < length; i++) {
            if (str.charAt(i) === '@' && i + 4 < length && str.charAt(i + 4) === '@') {
                color = this.evaluateTag(str.substring(i + 1, i + 4));
                i += 4;
            } else {
                const c = Font.CHARSET[str.charCodeAt(i)];

                if (c !== 94) {
                    if (shadowed) {
                        this.copyCharacter(x + this.clipX[c] + 1, y + this.clipY[c] + 1, this.charWidth[c], this.charHeight[c], this.pixels[c], 0);
                    }
                    this.copyCharacter(x + this.clipX[c], y + this.clipY[c], this.charWidth[c], this.charHeight[c], this.pixels[c], color);
                }

                x += this.charSpace[c];
            }
        }

    };

    getTextWidth = (str: string): number => {
        const length = str.length;
        let w = 0;
        for (let i = 0; i < length; i++) {
            if (str.charAt(i) === '@' && i + 4 < length && str.charAt(i + 4) === '@') {
                i += 4;
            } else {
                w += this.drawWidth[str.charCodeAt(i)];
            }
        }

        return w;
    };

    drawStringTaggableCenter = (x: number, y: number, str: string, color: number, shadowed: boolean): void => {
        this.drawStringTaggable(x - (this.getTextWidth(str) / 2), y, str, color, shadowed);
    };

    drawStringCenter = (x: number, y: number, str: string, color: number) => {
        this.draw(x - (this.getTextWidth(str) / 2), y, str, color);
    };

    drawRight = (x: number, y: number, str: string, color: number, shadowed = true): void => {
        if (shadowed) {
            this.draw(x - this.getTextWidth(str) + 1, y + 1, str, 0);
        }

        this.draw(x - this.getTextWidth(str), y, str, color);
    };

    copyCharacter = (x: number, y: number, w: number, h: number, pixels: Uint8Array, color: number): void => {
        x = x | 0;
        y = y | 0;
        w = w | 0;
        h = h | 0;

        let dstOff = x + (y * Draw2D.width);
        let srcOff = 0;

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
            h -= y + h + 1 - Draw2D.bottom;
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
            const cutoff = x + w + 1 - Draw2D.right;
            w -= cutoff;
            srcStep += cutoff;
            dstStep += cutoff;
        }

        if (w > 0 && h > 0) {
            this.copyImageMasked(w, h, pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep, color);
        }
    };

    copyImageMasked = (w: number, h: number, src: Uint8Array, srcOff: number, srcStep: number, dst: Uint32Array, dstOff: number, dstStep: number, color: number): void => {
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
    };

    evaluateTag = (tag: string): number => {
        switch (tag) {
            case 'red':
                return 0xff0000;
            case 'gre':
                return 0xff00;
            case 'blu':
                return 0xff;
            case 'yel':
                return 0xffff00;
            case 'cya':
                return 0xffff;
            case 'mag':
                return 0xff00ff;
            case 'whi':
                return 0xffffff;
            case 'bla':
                return 0;
            case 'lre':
                return 0xff9040;
            case 'dre':
                return 0x800000;
            case 'dbl':
                return 0x80;
            case 'or1':
                return 0xffb000;
            case 'or2':
                return 0xff7000;
            case 'or3':
                return 0xff3000;
            case 'gr1':
                return 0xc0ff00;
            case 'gr2':
                return 0x80ff00;
            case 'gr3':
                return 0x40ff00;
            default:
                return 0;
        }
    };
}
