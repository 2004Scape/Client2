import Draw2D from './Draw2D';
import Pix8 from './Pix8';
import Jagfile from '../io/Jagfile';

export default class Draw3D {
    static lowMemory: boolean = false; // TODO

    static reciprocal15: Int32Array = new Int32Array(512);
    static reciprocal16: Int32Array = new Int32Array(2048);
    static sin: Int32Array = new Int32Array(2048);
    static cos: Int32Array = new Int32Array(2048);
    static palette: Uint32Array = new Uint32Array(65536);

    static textures: Pix8[] = new Array(50);
    static textureCount: number = 0;

    static lineOffset: Int32Array = new Int32Array();
    static centerX: number = 0;
    static centerY: number = 0;

    static jagged: boolean = true;
    static clipX: boolean = false;
    static alpha: number = 0;

    static texelPool: (Int32Array | null)[] | null = null;
    static activeTexels: (Int32Array | null)[] = new Array(50);
    static poolSize: number = 0;
    static cycle: number = 0;
    static textureCycle: Int32Array = new Int32Array(50);
    static texturePalette: (Int32Array | null)[] = new Array(50);

    private static opaque: boolean = false;
    private static textureTranslucent: boolean[] = new Array(50);

    static {
        for (let i: number = 1; i < 512; i++) {
            this.reciprocal15[i] = Math.trunc(32768 / i);
        }

        for (let i: number = 1; i < 2048; i++) {
            this.reciprocal16[i] = Math.trunc(65536 / i);
        }

        for (let i: number = 0; i < 2048; i++) {
            // angular frequency: 2 * pi / 2048 = 0.0030679615757712823
            // * 65536 = maximum amplitude
            this.sin[i] = Math.trunc(Math.sin(i * 0.0030679615757712823) * 65536);
            this.cos[i] = Math.trunc(Math.cos(i * 0.0030679615757712823) * 65536);
        }
    }

    static unload = (): void => {
        // this.reciprocal15 = null;
        // this.reciprocal15 = null;
        // this.sin = null;
        // this.cos = null;
        // this.lineOffset = null;
        // this.textures = null;
        // this.textureTranslucent = null;
        // this.averageTextureRGB = null;
        // this.texelPool = null;
        // this.activeTexels = null;
        // this.textureCycle = null;
        // this.palette = null;
        // this.texturePalette = null;
    };

    static init2D = (): void => {
        this.lineOffset = new Int32Array(Draw2D.height);
        for (let y: number = 0; y < Draw2D.height; y++) {
            this.lineOffset[y] = Draw2D.width * y;
        }
        this.centerX = Math.trunc(Draw2D.width / 2);
        this.centerY = Math.trunc(Draw2D.height / 2);
    };

    static init3D = (width: number, height: number): void => {
        this.lineOffset = new Int32Array(height);
        for (let y: number = 0; y < height; y++) {
            this.lineOffset[y] = width * y;
        }
        this.centerX = Math.trunc(width / 2);
        this.centerY = Math.trunc(height / 2);
    };

    static clearTexels = (): void => {
        this.texelPool = null;
        for (let i: number = 0; i < 50; i++) {
            this.activeTexels[i] = null;
        }
    };

    static unpackTextures = (textures: Jagfile): void => {
        this.textureCount = 0;

        for (let i: number = 0; i < 50; i++) {
            try {
                this.textures[i] = Pix8.fromArchive(textures, i.toString());
                if (this.lowMemory && this.textures[i].cropW === 128) {
                    this.textures[i].shrink();
                } else {
                    this.textures[i].crop();
                }
                this.textureCount++;
            } catch (err) {
                /* empty */
            }
        }
    };

    static setBrightness = (brightness: number): void => {
        const randomBrightness: number = brightness + Math.random() * 0.03 - 0.015;
        let offset: number = 0;
        for (let y: number = 0; y < 512; y++) {
            const hue: number = Math.trunc(y / 8) / 64.0 + 0.0078125;
            const saturation: number = (y & 0x7) / 8.0 + 0.0625;
            for (let x: number = 0; x < 128; x++) {
                const lightness: number = x / 128.0;
                let r: number = lightness;
                let g: number = lightness;
                let b: number = lightness;
                if (saturation !== 0.0) {
                    let q: number;
                    if (lightness < 0.5) {
                        q = lightness * (saturation + 1.0);
                    } else {
                        q = lightness + saturation - lightness * saturation;
                    }
                    const p: number = lightness * 2.0 - q;
                    let t: number = hue + 0.3333333333333333;
                    if (t > 1.0) {
                        t--;
                    }
                    let d11: number = hue - 0.3333333333333333;
                    if (d11 < 0.0) {
                        d11++;
                    }
                    if (t * 6.0 < 1.0) {
                        r = p + (q - p) * 6.0 * t;
                    } else if (t * 2.0 < 1.0) {
                        r = q;
                    } else if (t * 3.0 < 2.0) {
                        r = p + (q - p) * (0.6666666666666666 - t) * 6.0;
                    } else {
                        r = p;
                    }
                    if (hue * 6.0 < 1.0) {
                        g = p + (q - p) * 6.0 * hue;
                    } else if (hue * 2.0 < 1.0) {
                        g = q;
                    } else if (hue * 3.0 < 2.0) {
                        g = p + (q - p) * (0.6666666666666666 - hue) * 6.0;
                    } else {
                        g = p;
                    }
                    if (d11 * 6.0 < 1.0) {
                        b = p + (q - p) * 6.0 * d11;
                    } else if (d11 * 2.0 < 1.0) {
                        b = q;
                    } else if (d11 * 3.0 < 2.0) {
                        b = p + (q - p) * (0.6666666666666666 - d11) * 6.0;
                    } else {
                        b = p;
                    }
                }
                const intR: number = Math.trunc(r * 256.0);
                const intG: number = Math.trunc(g * 256.0);
                const intB: number = Math.trunc(b * 256.0);
                const rgb: number = (intR << 16) + (intG << 8) + intB;
                this.palette[offset++] = this.setGamma(rgb, randomBrightness);
            }
        }
        for (let id: number = 0; id < 50; id++) {
            if (this.textures[id]) {
                const palette: Int32Array = this.textures[id].palette;
                this.texturePalette[id] = new Int32Array(palette.length);
                for (let i: number = 0; i < palette.length; i++) {
                    const tId: Int32Array | null = this.texturePalette[id];
                    if (tId) {
                        tId[i] = this.setGamma(palette[i], randomBrightness);
                    }
                }
            }
        }

        for (let id: number = 0; id < 50; id++) {
            this.pushTexture(id);
        }
    };

    private static setGamma = (rgb: number, gamma: number): number => {
        const r: number = (rgb >> 16) / 256.0;
        const g: number = ((rgb >> 8) & 0xff) / 256.0;
        const b: number = (rgb & 0xff) / 256.0;
        const powR: number = Math.pow(r, gamma);
        const powG: number = Math.pow(g, gamma);
        const powB: number = Math.pow(b, gamma);
        const intR: number = Math.trunc(powR * 256.0);
        const intG: number = Math.trunc(powG * 256.0);
        const intB: number = Math.trunc(powB * 256.0);
        return (intR << 16) + (intG << 8) + intB;
    };

    static initPool = (size: number): void => {
        if (this.texelPool) {
            return;
        }
        this.poolSize = size;
        if (this.lowMemory) {
            this.texelPool = new Array(this.poolSize).fill(null).map((): Int32Array => new Int32Array(16384));
        } else {
            this.texelPool = new Array(this.poolSize).fill(null).map((): Int32Array => new Int32Array(65536));
        }
        for (let i: number = 0; i < 50; i++) {
            this.activeTexels[i] = null;
        }
    };

    static fillGouraudTriangle = (xA: number, xB: number, xC: number, yA: number, yB: number, yC: number, colorA: number, colorB: number, colorC: number): void => {
        let xStepAB: number = 0;
        let xStepBC: number = 0;
        let xStepAC: number = 0;

        let colorStepAB: number = 0;
        let colorStepBC: number = 0;
        let colorStepAC: number = 0;

        if (yB !== yA) {
            xStepAB = Math.trunc(((xB - xA) << 16) / (yB - yA));
            colorStepAB = Math.trunc(((colorB - colorA) << 15) / (yB - yA));
        }

        if (yC !== yB) {
            xStepBC = Math.trunc(((xC - xB) << 16) / (yC - yB));
            colorStepBC = Math.trunc(((colorC - colorB) << 15) / (yC - yB));
        }

        if (yC !== yA) {
            xStepAC = Math.trunc(((xA - xC) << 16) / (yA - yC));
            colorStepAC = Math.trunc(((colorA - colorC) << 15) / (yA - yC));
        }

        if (yA <= yB && yA <= yC) {
            if (yA >= Draw2D.bottom) {
                return;
            }
            if (yB > Draw2D.bottom) {
                yB = Draw2D.bottom;
            }
            if (yC > Draw2D.bottom) {
                yC = Draw2D.bottom;
            }
            if (yB < yC) {
                xC = xA <<= 16;
                colorC = colorA <<= 15;
                if (yA < 0) {
                    xC -= xStepAC * yA;
                    xA -= xStepAB * yA;
                    colorC -= colorStepAC * yA;
                    colorA -= colorStepAB * yA;
                    yA = 0;
                }
                xB <<= 16;
                colorB <<= 15;
                if (yB < 0) {
                    xB -= xStepBC * yB;
                    colorB -= colorStepBC * yB;
                    yB = 0;
                }
                if ((yA !== yB && xStepAC < xStepAB) || (yA === yB && xStepAC > xStepBC)) {
                    yC -= yB;
                    yB -= yA;
                    for (yA = this.lineOffset[yA]; --yB >= 0; yA += Draw2D.width) {
                        this.drawGouraudScanline(Draw2D.pixels, yA, xC >> 16, xA >> 16, colorC >> 7, colorA >> 7);
                        xC += xStepAC;
                        xA += xStepAB;
                        colorC += colorStepAC;
                        colorA += colorStepAB;
                    }
                    while (--yC >= 0) {
                        this.drawGouraudScanline(Draw2D.pixels, yA, xC >> 16, xB >> 16, colorC >> 7, colorB >> 7);
                        xC += xStepAC;
                        xB += xStepBC;
                        colorC += colorStepAC;
                        colorB += colorStepBC;
                        yA += Draw2D.width;
                    }
                    return;
                }
                yC -= yB;
                yB -= yA;
                for (yA = this.lineOffset[yA]; --yB >= 0; yA += Draw2D.width) {
                    this.drawGouraudScanline(Draw2D.pixels, yA, xA >> 16, xC >> 16, colorA >> 7, colorC >> 7);
                    xC += xStepAC;
                    xA += xStepAB;
                    colorC += colorStepAC;
                    colorA += colorStepAB;
                }
                while (--yC >= 0) {
                    this.drawGouraudScanline(Draw2D.pixels, yA, xB >> 16, xC >> 16, colorB >> 7, colorC >> 7);
                    xC += xStepAC;
                    xB += xStepBC;
                    colorC += colorStepAC;
                    colorB += colorStepBC;
                    yA += Draw2D.width;
                }
                return;
            }
            xB = xA <<= 16;
            colorB = colorA <<= 15;
            if (yA < 0) {
                xB -= xStepAC * yA;
                xA -= xStepAB * yA;
                colorB -= colorStepAC * yA;
                colorA -= colorStepAB * yA;
                yA = 0;
            }
            xC <<= 16;
            colorC <<= 15;
            if (yC < 0) {
                xC -= xStepBC * yC;
                colorC -= colorStepBC * yC;
                yC = 0;
            }
            if ((yA !== yC && xStepAC < xStepAB) || (yA === yC && xStepBC > xStepAB)) {
                yB -= yC;
                yC -= yA;
                for (yA = this.lineOffset[yA]; --yC >= 0; yA += Draw2D.width) {
                    this.drawGouraudScanline(Draw2D.pixels, yA, xB >> 16, xA >> 16, colorB >> 7, colorA >> 7);
                    xB += xStepAC;
                    xA += xStepAB;
                    colorB += colorStepAC;
                    colorA += colorStepAB;
                }
                while (--yB >= 0) {
                    this.drawGouraudScanline(Draw2D.pixels, yA, xC >> 16, xA >> 16, colorC >> 7, colorA >> 7);
                    xC += xStepBC;
                    xA += xStepAB;
                    colorC += colorStepBC;
                    colorA += colorStepAB;
                    yA += Draw2D.width;
                }
                return;
            }
            yB -= yC;
            yC -= yA;
            for (yA = this.lineOffset[yA]; --yC >= 0; yA += Draw2D.width) {
                this.drawGouraudScanline(Draw2D.pixels, yA, xA >> 16, xB >> 16, colorA >> 7, colorB >> 7);
                xB += xStepAC;
                xA += xStepAB;
                colorB += colorStepAC;
                colorA += colorStepAB;
            }
            while (--yB >= 0) {
                this.drawGouraudScanline(Draw2D.pixels, yA, xA >> 16, xC >> 16, colorA >> 7, colorC >> 7);
                xC += xStepBC;
                xA += xStepAB;
                colorC += colorStepBC;
                colorA += colorStepAB;
                yA += Draw2D.width;
            }
            return;
        }
        if (yB <= yC) {
            if (yB >= Draw2D.bottom) {
                return;
            }
            if (yC > Draw2D.bottom) {
                yC = Draw2D.bottom;
            }
            if (yA > Draw2D.bottom) {
                yA = Draw2D.bottom;
            }
            if (yC < yA) {
                xA = xB <<= 16;
                colorA = colorB <<= 15;
                if (yB < 0) {
                    xA -= xStepAB * yB;
                    xB -= xStepBC * yB;
                    colorA -= colorStepAB * yB;
                    colorB -= colorStepBC * yB;
                    yB = 0;
                }
                xC <<= 16;
                colorC <<= 15;
                if (yC < 0) {
                    xC -= xStepAC * yC;
                    colorC -= colorStepAC * yC;
                    yC = 0;
                }
                if ((yB !== yC && xStepAB < xStepBC) || (yB === yC && xStepAB > xStepAC)) {
                    yA -= yC;
                    yC -= yB;
                    for (yB = this.lineOffset[yB]; --yC >= 0; yB += Draw2D.width) {
                        this.drawGouraudScanline(Draw2D.pixels, yB, xA >> 16, xB >> 16, colorA >> 7, colorB >> 7);
                        xA += xStepAB;
                        xB += xStepBC;
                        colorA += colorStepAB;
                        colorB += colorStepBC;
                    }
                    while (--yA >= 0) {
                        this.drawGouraudScanline(Draw2D.pixels, yB, xA >> 16, xC >> 16, colorA >> 7, colorC >> 7);
                        xA += xStepAB;
                        xC += xStepAC;
                        colorA += colorStepAB;
                        colorC += colorStepAC;
                        yB += Draw2D.width;
                    }
                    return;
                }
                yA -= yC;
                yC -= yB;
                for (yB = this.lineOffset[yB]; --yC >= 0; yB += Draw2D.width) {
                    this.drawGouraudScanline(Draw2D.pixels, yB, xB >> 16, xA >> 16, colorB >> 7, colorA >> 7);
                    xA += xStepAB;
                    xB += xStepBC;
                    colorA += colorStepAB;
                    colorB += colorStepBC;
                }
                while (--yA >= 0) {
                    this.drawGouraudScanline(Draw2D.pixels, yB, xC >> 16, xA >> 16, colorC >> 7, colorA >> 7);
                    xA += xStepAB;
                    xC += xStepAC;
                    colorA += colorStepAB;
                    colorC += colorStepAC;
                    yB += Draw2D.width;
                }
                return;
            }
            xC = xB <<= 16;
            colorC = colorB <<= 15;
            if (yB < 0) {
                xC -= xStepAB * yB;
                xB -= xStepBC * yB;
                colorC -= colorStepAB * yB;
                colorB -= colorStepBC * yB;
                yB = 0;
            }
            xA <<= 16;
            colorA <<= 15;
            if (yA < 0) {
                xA -= xStepAC * yA;
                colorA -= colorStepAC * yA;
                yA = 0;
            }
            if (xStepAB < xStepBC) {
                yC -= yA;
                yA -= yB;
                for (yB = this.lineOffset[yB]; --yA >= 0; yB += Draw2D.width) {
                    this.drawGouraudScanline(Draw2D.pixels, yB, xC >> 16, xB >> 16, colorC >> 7, colorB >> 7);
                    xC += xStepAB;
                    xB += xStepBC;
                    colorC += colorStepAB;
                    colorB += colorStepBC;
                }
                while (--yC >= 0) {
                    this.drawGouraudScanline(Draw2D.pixels, yB, xA >> 16, xB >> 16, colorA >> 7, colorB >> 7);
                    xA += xStepAC;
                    xB += xStepBC;
                    colorA += colorStepAC;
                    colorB += colorStepBC;
                    yB += Draw2D.width;
                }
                return;
            }
            yC -= yA;
            yA -= yB;
            for (yB = this.lineOffset[yB]; --yA >= 0; yB += Draw2D.width) {
                this.drawGouraudScanline(Draw2D.pixels, yB, xB >> 16, xC >> 16, colorB >> 7, colorC >> 7);
                xC += xStepAB;
                xB += xStepBC;
                colorC += colorStepAB;
                colorB += colorStepBC;
            }
            while (--yC >= 0) {
                this.drawGouraudScanline(Draw2D.pixels, yB, xB >> 16, xA >> 16, colorB >> 7, colorA >> 7);
                xA += xStepAC;
                xB += xStepBC;
                colorA += colorStepAC;
                colorB += colorStepBC;
                yB += Draw2D.width;
            }
            return;
        }
        if (yC >= Draw2D.bottom) {
            return;
        }
        if (yA > Draw2D.bottom) {
            yA = Draw2D.bottom;
        }
        if (yB > Draw2D.bottom) {
            yB = Draw2D.bottom;
        }
        if (yA < yB) {
            xB = xC <<= 16;
            colorB = colorC <<= 15;
            if (yC < 0) {
                xB -= xStepBC * yC;
                xC -= xStepAC * yC;
                colorB -= colorStepBC * yC;
                colorC -= colorStepAC * yC;
                yC = 0;
            }
            xA <<= 16;
            colorA <<= 15;
            if (yA < 0) {
                xA -= xStepAB * yA;
                colorA -= colorStepAB * yA;
                yA = 0;
            }
            if (xStepBC < xStepAC) {
                yB -= yA;
                yA -= yC;
                for (yC = this.lineOffset[yC]; --yA >= 0; yC += Draw2D.width) {
                    this.drawGouraudScanline(Draw2D.pixels, yC, xB >> 16, xC >> 16, colorB >> 7, colorC >> 7);
                    xB += xStepBC;
                    xC += xStepAC;
                    colorB += colorStepBC;
                    colorC += colorStepAC;
                }
                while (--yB >= 0) {
                    this.drawGouraudScanline(Draw2D.pixels, yC, xB >> 16, xA >> 16, colorB >> 7, colorA >> 7);
                    xB += xStepBC;
                    xA += xStepAB;
                    colorB += colorStepBC;
                    colorA += colorStepAB;
                    yC += Draw2D.width;
                }
                return;
            }
            yB -= yA;
            yA -= yC;
            for (yC = this.lineOffset[yC]; --yA >= 0; yC += Draw2D.width) {
                this.drawGouraudScanline(Draw2D.pixels, yC, xC >> 16, xB >> 16, colorC >> 7, colorB >> 7);
                xB += xStepBC;
                xC += xStepAC;
                colorB += colorStepBC;
                colorC += colorStepAC;
            }
            while (--yB >= 0) {
                this.drawGouraudScanline(Draw2D.pixels, yC, xA >> 16, xB >> 16, colorA >> 7, colorB >> 7);
                xB += xStepBC;
                xA += xStepAB;
                colorB += colorStepBC;
                colorA += colorStepAB;
                yC += Draw2D.width;
            }
            return;
        }
        xA = xC <<= 16;
        colorA = colorC <<= 15;
        if (yC < 0) {
            xA -= xStepBC * yC;
            xC -= xStepAC * yC;
            colorA -= colorStepBC * yC;
            colorC -= colorStepAC * yC;
            yC = 0;
        }
        xB <<= 16;
        colorB <<= 15;
        if (yB < 0) {
            xB -= xStepAB * yB;
            colorB -= colorStepAB * yB;
            yB = 0;
        }
        if (xStepBC < xStepAC) {
            yA -= yB;
            yB -= yC;
            for (yC = this.lineOffset[yC]; --yB >= 0; yC += Draw2D.width) {
                this.drawGouraudScanline(Draw2D.pixels, yC, xA >> 16, xC >> 16, colorA >> 7, colorC >> 7);
                xA += xStepBC;
                xC += xStepAC;
                colorA += colorStepBC;
                colorC += colorStepAC;
            }
            while (--yA >= 0) {
                this.drawGouraudScanline(Draw2D.pixels, yC, xB >> 16, xC >> 16, colorB >> 7, colorC >> 7);
                xB += xStepAB;
                xC += xStepAC;
                colorB += colorStepAB;
                colorC += colorStepAC;
                yC += Draw2D.width;
            }
            return;
        }
        yA -= yB;
        yB -= yC;
        for (yC = this.lineOffset[yC]; --yB >= 0; yC += Draw2D.width) {
            this.drawGouraudScanline(Draw2D.pixels, yC, xC >> 16, xA >> 16, colorC >> 7, colorA >> 7);
            xA += xStepBC;
            xC += xStepAC;
            colorA += colorStepBC;
            colorC += colorStepAC;
        }
        while (--yA >= 0) {
            this.drawGouraudScanline(Draw2D.pixels, yC, xC >> 16, xB >> 16, colorC >> 7, colorB >> 7);
            xB += xStepAB;
            xC += xStepAC;
            colorB += colorStepAB;
            colorC += colorStepAC;
            yC += Draw2D.width;
        }
    };

    private static drawGouraudScanline = (dst: Int32Array, offset: number, x0: number, x1: number, color0: number, color1: number): void => {
        let rgb: number = 0;
        let length: number = 0;

        if (this.jagged) {
            let colorStep: number = 0;

            if (this.clipX) {
                if (x1 - x0 > 3) {
                    colorStep = Math.trunc((color1 - color0) / (x1 - x0));
                } else {
                    colorStep = 0;
                }

                if (x1 > Draw2D.right) {
                    x1 = Draw2D.right;
                }

                if (x0 < 0) {
                    color0 -= x0 * colorStep;
                    x0 = 0;
                }

                if (x0 >= x1) {
                    return;
                }

                offset += x0;
                length = (x1 - x0) >> 2;
                colorStep <<= 2;
            } else {
                if (x0 >= x1) {
                    return;
                }

                offset += x0;
                length = (x1 - x0) >> 2;

                if (length > 0) {
                    colorStep = ((color1 - color0) * this.reciprocal15[length]) >> 15;
                } else {
                    colorStep = 0;
                }
            }

            if (this.alpha === 0) {
                while (--length >= 0) {
                    rgb = this.palette[color0 >> 8];
                    color0 += colorStep;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                }

                length = (x1 - x0) & 3;

                if (length > 0) {
                    rgb = this.palette[color0 >> 8];
                    do {
                        dst[offset++] = rgb;
                    } while (--length > 0);
                    return;
                }
            } else {
                const alpha: number = this.alpha;
                const invAlpha: number = 256 - this.alpha;

                while (--length >= 0) {
                    rgb = this.palette[color0 >> 8];
                    color0 += colorStep;
                    rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                }

                length = (x1 - x0) & 3;

                if (length > 0) {
                    rgb = this.palette[color0 >> 8];
                    rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);
                    do {
                        dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    } while (--length > 0);
                }
            }
            return;
        }

        if (x0 >= x1) {
            return;
        }

        const colorStep: number = Math.trunc((color1 - color0) / (x1 - x0));

        if (this.clipX) {
            if (x1 > Draw2D.right) {
                x1 = Draw2D.right;
            }
            if (x0 < 0) {
                color0 -= x0 * colorStep;
                x0 = 0;
            }
            if (x0 >= x1) {
                return;
            }
        }

        offset += x0;
        length = x1 - x0;

        if (this.alpha === 0) {
            do {
                dst[offset++] = this.palette[color0 >> 8];
                color0 += colorStep;
            } while (--length > 0);
            return;
        }

        const alpha: number = this.alpha;
        const invAlpha: number = 256 - this.alpha;

        do {
            rgb = this.palette[color0 >> 8];
            color0 += colorStep;
            rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);
            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
        } while (--length > 0);
    };

    static fillTriangle = (x0: number, x1: number, x2: number, y0: number, y1: number, y2: number, color: number): void => {
        let xStepAB: number = 0;
        if (y1 !== y0) {
            xStepAB = Math.trunc(((x1 - x0) << 16) / (y1 - y0));
        }
        let xStepBC: number = 0;
        if (y2 !== y1) {
            xStepBC = Math.trunc(((x2 - x1) << 16) / (y2 - y1));
        }
        let xStepAC: number = 0;
        if (y2 !== y0) {
            xStepAC = Math.trunc(((x0 - x2) << 16) / (y0 - y2));
        }
        if (y0 <= y1 && y0 <= y2) {
            if (y0 < Draw2D.bottom) {
                if (y1 > Draw2D.bottom) {
                    y1 = Draw2D.bottom;
                }
                if (y2 > Draw2D.bottom) {
                    y2 = Draw2D.bottom;
                }
                if (y1 < y2) {
                    x2 = x0 <<= 0x10;
                    if (y0 < 0) {
                        x2 -= xStepAC * y0;
                        x0 -= xStepAB * y0;
                        y0 = 0;
                    }
                    x1 <<= 0x10;
                    if (y1 < 0) {
                        x1 -= xStepBC * y1;
                        y1 = 0;
                    }
                    if ((y0 !== y1 && xStepAC < xStepAB) || (y0 === y1 && xStepAC > xStepBC)) {
                        y2 -= y1;
                        y1 -= y0;
                        y0 = this.lineOffset[y0];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y1--;
                            if (y1 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y2--;
                                    if (y2 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x2 >> 16, x1 >> 16, Draw2D.pixels, y0, color);
                                    x2 += xStepAC;
                                    x1 += xStepBC;
                                    y0 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x2 >> 16, x0 >> 16, Draw2D.pixels, y0, color);
                            x2 += xStepAC;
                            x0 += xStepAB;
                            y0 += Draw2D.width;
                        }
                    } else {
                        y2 -= y1;
                        y1 -= y0;
                        y0 = this.lineOffset[y0];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y1--;
                            if (y1 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y2--;
                                    if (y2 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x1 >> 16, x2 >> 16, Draw2D.pixels, y0, color);
                                    x2 += xStepAC;
                                    x1 += xStepBC;
                                    y0 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x0 >> 16, x2 >> 16, Draw2D.pixels, y0, color);
                            x2 += xStepAC;
                            x0 += xStepAB;
                            y0 += Draw2D.width;
                        }
                    }
                } else {
                    x1 = x0 <<= 0x10;
                    if (y0 < 0) {
                        x1 -= xStepAC * y0;
                        x0 -= xStepAB * y0;
                        y0 = 0;
                    }
                    x2 <<= 0x10;
                    if (y2 < 0) {
                        x2 -= xStepBC * y2;
                        y2 = 0;
                    }
                    if ((y0 !== y2 && xStepAC < xStepAB) || (y0 === y2 && xStepBC > xStepAB)) {
                        y1 -= y2;
                        y2 -= y0;
                        y0 = this.lineOffset[y0];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y2--;
                            if (y2 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y1--;
                                    if (y1 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x2 >> 16, x0 >> 16, Draw2D.pixels, y0, color);
                                    x2 += xStepBC;
                                    x0 += xStepAB;
                                    y0 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x1 >> 16, x0 >> 16, Draw2D.pixels, y0, color);
                            x1 += xStepAC;
                            x0 += xStepAB;
                            y0 += Draw2D.width;
                        }
                    } else {
                        y1 -= y2;
                        y2 -= y0;
                        y0 = this.lineOffset[y0];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y2--;
                            if (y2 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y1--;
                                    if (y1 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x0 >> 16, x2 >> 16, Draw2D.pixels, y0, color);
                                    x2 += xStepBC;
                                    x0 += xStepAB;
                                    y0 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x0 >> 16, x1 >> 16, Draw2D.pixels, y0, color);
                            x1 += xStepAC;
                            x0 += xStepAB;
                            y0 += Draw2D.width;
                        }
                    }
                }
            }
        } else if (y1 <= y2) {
            if (y1 < Draw2D.bottom) {
                if (y2 > Draw2D.bottom) {
                    y2 = Draw2D.bottom;
                }
                if (y0 > Draw2D.bottom) {
                    y0 = Draw2D.bottom;
                }
                if (y2 < y0) {
                    x0 = x1 <<= 0x10;
                    if (y1 < 0) {
                        x0 -= xStepAB * y1;
                        x1 -= xStepBC * y1;
                        y1 = 0;
                    }
                    x2 <<= 0x10;
                    if (y2 < 0) {
                        x2 -= xStepAC * y2;
                        y2 = 0;
                    }
                    if ((y1 !== y2 && xStepAB < xStepBC) || (y1 === y2 && xStepAB > xStepAC)) {
                        y0 -= y2;
                        y2 -= y1;
                        y1 = this.lineOffset[y1];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y2--;
                            if (y2 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y0--;
                                    if (y0 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x0 >> 16, x2 >> 16, Draw2D.pixels, y1, color);
                                    x0 += xStepAB;
                                    x2 += xStepAC;
                                    y1 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x0 >> 16, x1 >> 16, Draw2D.pixels, y1, color);
                            x0 += xStepAB;
                            x1 += xStepBC;
                            y1 += Draw2D.width;
                        }
                    } else {
                        y0 -= y2;
                        y2 -= y1;
                        y1 = this.lineOffset[y1];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y2--;
                            if (y2 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y0--;
                                    if (y0 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x2 >> 16, x0 >> 16, Draw2D.pixels, y1, color);
                                    x0 += xStepAB;
                                    x2 += xStepAC;
                                    y1 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x1 >> 16, x0 >> 16, Draw2D.pixels, y1, color);
                            x0 += xStepAB;
                            x1 += xStepBC;
                            y1 += Draw2D.width;
                        }
                    }
                } else {
                    x2 = x1 <<= 0x10;
                    if (y1 < 0) {
                        x2 -= xStepAB * y1;
                        x1 -= xStepBC * y1;
                        y1 = 0;
                    }
                    x0 <<= 0x10;
                    if (y0 < 0) {
                        x0 -= xStepAC * y0;
                        y0 = 0;
                    }
                    if (xStepAB < xStepBC) {
                        y2 -= y0;
                        y0 -= y1;
                        y1 = this.lineOffset[y1];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y0--;
                            if (y0 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y2--;
                                    if (y2 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x0 >> 16, x1 >> 16, Draw2D.pixels, y1, color);
                                    x0 += xStepAC;
                                    x1 += xStepBC;
                                    y1 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x2 >> 16, x1 >> 16, Draw2D.pixels, y1, color);
                            x2 += xStepAB;
                            x1 += xStepBC;
                            y1 += Draw2D.width;
                        }
                    } else {
                        y2 -= y0;
                        y0 -= y1;
                        y1 = this.lineOffset[y1];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            y0--;
                            if (y0 < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    y2--;
                                    if (y2 < 0) {
                                        return;
                                    }
                                    this.drawScanline(x1 >> 16, x0 >> 16, Draw2D.pixels, y1, color);
                                    x0 += xStepAC;
                                    x1 += xStepBC;
                                    y1 += Draw2D.width;
                                }
                            }
                            this.drawScanline(x1 >> 16, x2 >> 16, Draw2D.pixels, y1, color);
                            x2 += xStepAB;
                            x1 += xStepBC;
                            y1 += Draw2D.width;
                        }
                    }
                }
            }
        } else if (y2 < Draw2D.bottom) {
            if (y0 > Draw2D.bottom) {
                y0 = Draw2D.bottom;
            }
            if (y1 > Draw2D.bottom) {
                y1 = Draw2D.bottom;
            }
            if (y0 < y1) {
                x1 = x2 <<= 0x10;
                if (y2 < 0) {
                    x1 -= xStepBC * y2;
                    x2 -= xStepAC * y2;
                    y2 = 0;
                }
                x0 <<= 0x10;
                if (y0 < 0) {
                    x0 -= xStepAB * y0;
                    y0 = 0;
                }
                if (xStepBC < xStepAC) {
                    y1 -= y0;
                    y0 -= y2;
                    y2 = this.lineOffset[y2];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        y0--;
                        if (y0 < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                y1--;
                                if (y1 < 0) {
                                    return;
                                }
                                this.drawScanline(x1 >> 16, x0 >> 16, Draw2D.pixels, y2, color);
                                x1 += xStepBC;
                                x0 += xStepAB;
                                y2 += Draw2D.width;
                            }
                        }
                        this.drawScanline(x1 >> 16, x2 >> 16, Draw2D.pixels, y2, color);
                        x1 += xStepBC;
                        x2 += xStepAC;
                        y2 += Draw2D.width;
                    }
                } else {
                    y1 -= y0;
                    y0 -= y2;
                    y2 = this.lineOffset[y2];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        y0--;
                        if (y0 < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                y1--;
                                if (y1 < 0) {
                                    return;
                                }
                                this.drawScanline(x0 >> 16, x1 >> 16, Draw2D.pixels, y2, color);
                                x1 += xStepBC;
                                x0 += xStepAB;
                                y2 += Draw2D.width;
                            }
                        }
                        this.drawScanline(x2 >> 16, x1 >> 16, Draw2D.pixels, y2, color);
                        x1 += xStepBC;
                        x2 += xStepAC;
                        y2 += Draw2D.width;
                    }
                }
            } else {
                x0 = x2 <<= 0x10;
                if (y2 < 0) {
                    x0 -= xStepBC * y2;
                    x2 -= xStepAC * y2;
                    y2 = 0;
                }
                x1 <<= 0x10;
                if (y1 < 0) {
                    x1 -= xStepAB * y1;
                    y1 = 0;
                }
                if (xStepBC < xStepAC) {
                    y0 -= y1;
                    y1 -= y2;
                    y2 = this.lineOffset[y2];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        y1--;
                        if (y1 < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                y0--;
                                if (y0 < 0) {
                                    return;
                                }
                                this.drawScanline(x1 >> 16, x2 >> 16, Draw2D.pixels, y2, color);
                                x1 += xStepAB;
                                x2 += xStepAC;
                                y2 += Draw2D.width;
                            }
                        }
                        this.drawScanline(x0 >> 16, x2 >> 16, Draw2D.pixels, y2, color);
                        x0 += xStepBC;
                        x2 += xStepAC;
                        y2 += Draw2D.width;
                    }
                } else {
                    y0 -= y1;
                    y1 -= y2;
                    y2 = this.lineOffset[y2];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        y1--;
                        if (y1 < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                y0--;
                                if (y0 < 0) {
                                    return;
                                }
                                this.drawScanline(x2 >> 16, x1 >> 16, Draw2D.pixels, y2, color);
                                x1 += xStepAB;
                                x2 += xStepAC;
                                y2 += Draw2D.width;
                            }
                        }
                        this.drawScanline(x2 >> 16, x0 >> 16, Draw2D.pixels, y2, color);
                        x0 += xStepBC;
                        x2 += xStepAC;
                        y2 += Draw2D.width;
                    }
                }
            }
        }
    };

    static fillTexturedTriangle = (
        xA: number,
        xB: number,
        xC: number,
        yA: number,
        yB: number,
        yC: number,
        shadeA: number,
        shadeB: number,
        shadeC: number,
        originX: number,
        originY: number,
        originZ: number,
        txB: number,
        txC: number,
        tyB: number,
        tyC: number,
        tzB: number,
        tzC: number,
        texture: number
    ): void => {
        const texels: Int32Array | null = this.getTexels(texture);
        this.opaque = !this.textureTranslucent[texture];

        const verticalX: number = originX - txB;
        const verticalY: number = originY - tyB;
        const verticalZ: number = originZ - tzB;

        const horizontalX: number = txC - originX;
        const horizontalY: number = tyC - originY;
        const horizontalZ: number = tzC - originZ;

        let u: number = (horizontalX * originY - horizontalY * originX) << 14;
        const uStride: number = (horizontalY * originZ - horizontalZ * originY) << 8;
        const uStepVertical: number = (horizontalZ * originX - horizontalX * originZ) << 5;

        let v: number = (verticalX * originY - verticalY * originX) << 14;
        const vStride: number = (verticalY * originZ - verticalZ * originY) << 8;
        const vStepVertical: number = (verticalZ * originX - verticalX * originZ) << 5;

        let w: number = (verticalY * horizontalX - verticalX * horizontalY) << 14;
        const wStride: number = (verticalZ * horizontalY - verticalY * horizontalZ) << 8;
        const wStepVertical: number = (verticalX * horizontalZ - verticalZ * horizontalX) << 5;

        let xStepAB: number = 0;
        let shadeStepAB: number = 0;
        if (yB !== yA) {
            xStepAB = Math.trunc(((xB - xA) << 16) / (yB - yA));
            shadeStepAB = Math.trunc(((shadeB - shadeA) << 16) / (yB - yA));
        }

        let xStepBC: number = 0;
        let shadeStepBC: number = 0;
        if (yC !== yB) {
            xStepBC = Math.trunc(((xC - xB) << 16) / (yC - yB));
            shadeStepBC = Math.trunc(((shadeC - shadeB) << 16) / (yC - yB));
        }

        let xStepAC: number = 0;
        let shadeStepAC: number = 0;
        if (yC !== yA) {
            xStepAC = Math.trunc(((xA - xC) << 16) / (yA - yC));
            shadeStepAC = Math.trunc(((shadeA - shadeC) << 16) / (yA - yC));
        }

        if (yA <= yB && yA <= yC) {
            if (yA < Draw2D.bottom) {
                if (yB > Draw2D.bottom) {
                    yB = Draw2D.bottom;
                }

                if (yC > Draw2D.bottom) {
                    yC = Draw2D.bottom;
                }

                if (yB < yC) {
                    xC = xA <<= 0x10;
                    shadeC = shadeA <<= 0x10;
                    if (yA < 0) {
                        xC -= xStepAC * yA;
                        xA -= xStepAB * yA;
                        shadeC -= shadeStepAC * yA;
                        shadeA -= shadeStepAB * yA;
                        yA = 0;
                    }
                    xB <<= 0x10;
                    shadeB <<= 0x10;
                    if (yB < 0) {
                        xB -= xStepBC * yB;
                        shadeB -= shadeStepBC * yB;
                        yB = 0;
                    }
                    const dy: number = yA - this.centerY;
                    u += uStepVertical * dy;
                    v += vStepVertical * dy;
                    w += wStepVertical * dy;
                    if ((yA !== yB && xStepAC < xStepAB) || (yA === yB && xStepAC > xStepBC)) {
                        yC -= yB;
                        yB -= yA;
                        yA = this.lineOffset[yA];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yB--;
                            if (yB < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yC--;
                                    if (yC < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xC >> 16, xB >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                                    xC += xStepAC;
                                    xB += xStepBC;
                                    shadeC += shadeStepAC;
                                    shadeB += shadeStepBC;
                                    yA += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xC >> 16, xA >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                            xC += xStepAC;
                            xA += xStepAB;
                            shadeC += shadeStepAC;
                            shadeA += shadeStepAB;
                            yA += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    } else {
                        yC -= yB;
                        yB -= yA;
                        yA = this.lineOffset[yA];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yB--;
                            if (yB < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yC--;
                                    if (yC < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xB >> 16, xC >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                                    xC += xStepAC;
                                    xB += xStepBC;
                                    shadeC += shadeStepAC;
                                    shadeB += shadeStepBC;
                                    yA += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xA >> 16, xC >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                            xC += xStepAC;
                            xA += xStepAB;
                            shadeC += shadeStepAC;
                            shadeA += shadeStepAB;
                            yA += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    }
                } else {
                    xB = xA <<= 0x10;
                    shadeB = shadeA <<= 0x10;
                    if (yA < 0) {
                        xB -= xStepAC * yA;
                        xA -= xStepAB * yA;
                        shadeB -= shadeStepAC * yA;
                        shadeA -= shadeStepAB * yA;
                        yA = 0;
                    }
                    xC <<= 0x10;
                    shadeC <<= 0x10;
                    if (yC < 0) {
                        xC -= xStepBC * yC;
                        shadeC -= shadeStepBC * yC;
                        yC = 0;
                    }
                    const dy: number = yA - this.centerY;
                    u += uStepVertical * dy;
                    v += vStepVertical * dy;
                    w += wStepVertical * dy;
                    if ((yA === yC || xStepAC >= xStepAB) && (yA !== yC || xStepBC <= xStepAB)) {
                        yB -= yC;
                        yC -= yA;
                        yA = this.lineOffset[yA];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yC--;
                            if (yC < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yB--;
                                    if (yB < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xA >> 16, xC >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                                    xC += xStepBC;
                                    xA += xStepAB;
                                    shadeC += shadeStepBC;
                                    shadeA += shadeStepAB;
                                    yA += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xA >> 16, xB >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                            xB += xStepAC;
                            xA += xStepAB;
                            shadeB += shadeStepAC;
                            shadeA += shadeStepAB;
                            yA += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    } else {
                        yB -= yC;
                        yC -= yA;
                        yA = this.lineOffset[yA];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yC--;
                            if (yC < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yB--;
                                    if (yB < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xC >> 16, xA >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                                    xC += xStepBC;
                                    xA += xStepAB;
                                    shadeC += shadeStepBC;
                                    shadeA += shadeStepAB;
                                    yA += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xB >> 16, xA >> 16, Draw2D.pixels, yA, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                            xB += xStepAC;
                            xA += xStepAB;
                            shadeB += shadeStepAC;
                            shadeA += shadeStepAB;
                            yA += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    }
                }
            }
        } else if (yB <= yC) {
            if (yB < Draw2D.bottom) {
                if (yC > Draw2D.bottom) {
                    yC = Draw2D.bottom;
                }
                if (yA > Draw2D.bottom) {
                    yA = Draw2D.bottom;
                }
                if (yC < yA) {
                    xA = xB <<= 0x10;
                    shadeA = shadeB <<= 0x10;
                    if (yB < 0) {
                        xA -= xStepAB * yB;
                        xB -= xStepBC * yB;
                        shadeA -= shadeStepAB * yB;
                        shadeB -= shadeStepBC * yB;
                        yB = 0;
                    }
                    xC <<= 0x10;
                    shadeC <<= 0x10;
                    if (yC < 0) {
                        xC -= xStepAC * yC;
                        shadeC -= shadeStepAC * yC;
                        yC = 0;
                    }
                    const dy: number = yB - this.centerY;
                    u += uStepVertical * dy;
                    v += vStepVertical * dy;
                    w += wStepVertical * dy;
                    if ((yB !== yC && xStepAB < xStepBC) || (yB === yC && xStepAB > xStepAC)) {
                        yA -= yC;
                        yC -= yB;
                        yB = this.lineOffset[yB];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yC--;
                            if (yC < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yA--;
                                    if (yA < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xA >> 16, xC >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                                    xA += xStepAB;
                                    xC += xStepAC;
                                    shadeA += shadeStepAB;
                                    shadeC += shadeStepAC;
                                    yB += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xA >> 16, xB >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                            xA += xStepAB;
                            xB += xStepBC;
                            shadeA += shadeStepAB;
                            shadeB += shadeStepBC;
                            yB += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    } else {
                        yA -= yC;
                        yC -= yB;
                        yB = this.lineOffset[yB];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yC--;
                            if (yC < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yA--;
                                    if (yA < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xC >> 16, xA >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                                    xA += xStepAB;
                                    xC += xStepAC;
                                    shadeA += shadeStepAB;
                                    shadeC += shadeStepAC;
                                    yB += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xB >> 16, xA >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                            xA += xStepAB;
                            xB += xStepBC;
                            shadeA += shadeStepAB;
                            shadeB += shadeStepBC;
                            yB += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    }
                } else {
                    xC = xB <<= 0x10;
                    shadeC = shadeB <<= 0x10;
                    if (yB < 0) {
                        xC -= xStepAB * yB;
                        xB -= xStepBC * yB;
                        shadeC -= shadeStepAB * yB;
                        shadeB -= shadeStepBC * yB;
                        yB = 0;
                    }
                    xA <<= 0x10;
                    shadeA <<= 0x10;
                    if (yA < 0) {
                        xA -= xStepAC * yA;
                        shadeA -= shadeStepAC * yA;
                        yA = 0;
                    }
                    const dy: number = yB - this.centerY;
                    u += uStepVertical * dy;
                    v += vStepVertical * dy;
                    w += wStepVertical * dy;
                    if (xStepAB < xStepBC) {
                        yC -= yA;
                        yA -= yB;
                        yB = this.lineOffset[yB];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yA--;
                            if (yA < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yC--;
                                    if (yC < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xA >> 16, xB >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                                    xA += xStepAC;
                                    xB += xStepBC;
                                    shadeA += shadeStepAC;
                                    shadeB += shadeStepBC;
                                    yB += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xC >> 16, xB >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                            xC += xStepAB;
                            xB += xStepBC;
                            shadeC += shadeStepAB;
                            shadeB += shadeStepBC;
                            yB += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    } else {
                        yC -= yA;
                        yA -= yB;
                        yB = this.lineOffset[yB];
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            yA--;
                            if (yA < 0) {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    yC--;
                                    if (yC < 0) {
                                        return;
                                    }
                                    this.drawTexturedScanline(xB >> 16, xA >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                                    xA += xStepAC;
                                    xB += xStepBC;
                                    shadeA += shadeStepAC;
                                    shadeB += shadeStepBC;
                                    yB += Draw2D.width;
                                    u += uStepVertical;
                                    v += vStepVertical;
                                    w += wStepVertical;
                                }
                            }
                            this.drawTexturedScanline(xB >> 16, xC >> 16, Draw2D.pixels, yB, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                            xC += xStepAB;
                            xB += xStepBC;
                            shadeC += shadeStepAB;
                            shadeB += shadeStepBC;
                            yB += Draw2D.width;
                            u += uStepVertical;
                            v += vStepVertical;
                            w += wStepVertical;
                        }
                    }
                }
            }
        } else if (yC < Draw2D.bottom) {
            if (yA > Draw2D.bottom) {
                yA = Draw2D.bottom;
            }
            if (yB > Draw2D.bottom) {
                yB = Draw2D.bottom;
            }
            if (yA < yB) {
                xB = xC <<= 0x10;
                shadeB = shadeC <<= 0x10;
                if (yC < 0) {
                    xB -= xStepBC * yC;
                    xC -= xStepAC * yC;
                    shadeB -= shadeStepBC * yC;
                    shadeC -= shadeStepAC * yC;
                    yC = 0;
                }
                xA <<= 0x10;
                shadeA <<= 0x10;
                if (yA < 0) {
                    xA -= xStepAB * yA;
                    shadeA -= shadeStepAB * yA;
                    yA = 0;
                }
                const dy: number = yC - this.centerY;
                u += uStepVertical * dy;
                v += vStepVertical * dy;
                w += wStepVertical * dy;
                if (xStepBC < xStepAC) {
                    yB -= yA;
                    yA -= yC;
                    yC = this.lineOffset[yC];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        yA--;
                        if (yA < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                yB--;
                                if (yB < 0) {
                                    return;
                                }
                                this.drawTexturedScanline(xB >> 16, xA >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeA >> 8);
                                xB += xStepBC;
                                xA += xStepAB;
                                shadeB += shadeStepBC;
                                shadeA += shadeStepAB;
                                yC += Draw2D.width;
                                u += uStepVertical;
                                v += vStepVertical;
                                w += wStepVertical;
                            }
                        }
                        this.drawTexturedScanline(xB >> 16, xC >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                        xB += xStepBC;
                        xC += xStepAC;
                        shadeB += shadeStepBC;
                        shadeC += shadeStepAC;
                        yC += Draw2D.width;
                        u += uStepVertical;
                        v += vStepVertical;
                        w += wStepVertical;
                    }
                } else {
                    yB -= yA;
                    yA -= yC;
                    yC = this.lineOffset[yC];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        yA--;
                        if (yA < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                yB--;
                                if (yB < 0) {
                                    return;
                                }
                                this.drawTexturedScanline(xA >> 16, xB >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeB >> 8);
                                xB += xStepBC;
                                xA += xStepAB;
                                shadeB += shadeStepBC;
                                shadeA += shadeStepAB;
                                yC += Draw2D.width;
                                u += uStepVertical;
                                v += vStepVertical;
                                w += wStepVertical;
                            }
                        }
                        this.drawTexturedScanline(xC >> 16, xB >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                        xB += xStepBC;
                        xC += xStepAC;
                        shadeB += shadeStepBC;
                        shadeC += shadeStepAC;
                        yC += Draw2D.width;
                        u += uStepVertical;
                        v += vStepVertical;
                        w += wStepVertical;
                    }
                }
            } else {
                xA = xC <<= 0x10;
                shadeA = shadeC <<= 0x10;
                if (yC < 0) {
                    xA -= xStepBC * yC;
                    xC -= xStepAC * yC;
                    shadeA -= shadeStepBC * yC;
                    shadeC -= shadeStepAC * yC;
                    yC = 0;
                }
                xB <<= 0x10;
                shadeB <<= 0x10;
                if (yB < 0) {
                    xB -= xStepAB * yB;
                    shadeB -= shadeStepAB * yB;
                    yB = 0;
                }
                const dy: number = yC - this.centerY;
                u += uStepVertical * dy;
                v += vStepVertical * dy;
                w += wStepVertical * dy;
                if (xStepBC < xStepAC) {
                    yA -= yB;
                    yB -= yC;
                    yC = this.lineOffset[yC];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        yB--;
                        if (yB < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                yA--;
                                if (yA < 0) {
                                    return;
                                }
                                this.drawTexturedScanline(xB >> 16, xC >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeB >> 8, shadeC >> 8);
                                xB += xStepAB;
                                xC += xStepAC;
                                shadeB += shadeStepAB;
                                shadeC += shadeStepAC;
                                yC += Draw2D.width;
                                u += uStepVertical;
                                v += vStepVertical;
                                w += wStepVertical;
                            }
                        }
                        this.drawTexturedScanline(xA >> 16, xC >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeA >> 8, shadeC >> 8);
                        xA += xStepBC;
                        xC += xStepAC;
                        shadeA += shadeStepBC;
                        shadeC += shadeStepAC;
                        yC += Draw2D.width;
                        u += uStepVertical;
                        v += vStepVertical;
                        w += wStepVertical;
                    }
                } else {
                    yA -= yB;
                    yB -= yC;
                    yC = this.lineOffset[yC];
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        yB--;
                        if (yB < 0) {
                            // eslint-disable-next-line no-constant-condition
                            while (true) {
                                yA--;
                                if (yA < 0) {
                                    return;
                                }
                                this.drawTexturedScanline(xC >> 16, xB >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeB >> 8);
                                xB += xStepAB;
                                xC += xStepAC;
                                shadeB += shadeStepAB;
                                shadeC += shadeStepAC;
                                yC += Draw2D.width;
                                u += uStepVertical;
                                v += vStepVertical;
                                w += wStepVertical;
                            }
                        }
                        this.drawTexturedScanline(xC >> 16, xA >> 16, Draw2D.pixels, yC, texels, 0, 0, u, v, w, uStride, vStride, wStride, shadeC >> 8, shadeA >> 8);
                        xA += xStepBC;
                        xC += xStepAC;
                        shadeA += shadeStepBC;
                        shadeC += shadeStepAC;
                        yC += Draw2D.width;
                        u += uStepVertical;
                        v += vStepVertical;
                        w += wStepVertical;
                    }
                }
            }
        }
    };

    private static drawTexturedScanline = (
        xA: number,
        xB: number,
        dst: Int32Array,
        offset: number,
        texels: Int32Array | null,
        curU: number,
        curV: number,
        u: number,
        v: number,
        w: number,
        uStride: number,
        vStride: number,
        wStride: number,
        shadeA: number,
        shadeB: number
    ): void => {
        if (xA >= xB) {
            return;
        }

        let shadeStrides: number;
        let strides: number;
        if (this.clipX) {
            shadeStrides = Math.trunc((shadeB - shadeA) / (xB - xA));

            if (xB > Draw2D.boundX) {
                xB = Draw2D.boundX;
            }

            if (xA < 0) {
                shadeA -= xA * shadeStrides;
                xA = 0;
            }

            if (xA >= xB) {
                return;
            }

            strides = (xB - xA) >> 3;
            shadeStrides <<= 0xc;
            shadeA <<= 0x9;
        } else {
            if (xB - xA > 7) {
                strides = (xB - xA) >> 3;
                shadeStrides = ((shadeB - shadeA) * this.reciprocal15[strides]) >> 6;
            } else {
                strides = 0;
                shadeStrides = 0;
            }

            shadeA <<= 0x9;
        }

        offset += xA;

        let nextU: number;
        let nextV: number;
        let curW: number;
        let dx: number;
        let stepU: number;
        let stepV: number;
        let shadeShift: number;
        if (this.lowMemory && texels) {
            nextU = 0;
            nextV = 0;
            dx = xA - this.centerX;
            u = u + (uStride >> 3) * dx;
            v = v + (vStride >> 3) * dx;
            w = w + (wStride >> 3) * dx;
            curW = w >> 12;
            if (curW !== 0) {
                curU = Math.trunc(u / curW);
                curV = Math.trunc(v / curW);
                if (curU < 0) {
                    curU = 0;
                } else if (curU > 4032) {
                    curU = 4032;
                }
            }
            u = u + uStride;
            v = v + vStride;
            w = w + wStride;
            curW = w >> 12;
            if (curW !== 0) {
                nextU = Math.trunc(u / curW);
                nextV = Math.trunc(v / curW);
                if (nextU < 7) {
                    nextU = 7;
                } else if (nextU > 4032) {
                    nextU = 4032;
                }
            }
            stepU = (nextU - curU) >> 3;
            stepV = (nextV - curV) >> 3;
            curU += (shadeA >> 3) & 0xc0000;
            shadeShift = shadeA >> 23;
            if (this.opaque) {
                while (strides-- > 0) {
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU = nextU;
                    curV = nextV;
                    u += uStride;
                    v += vStride;
                    w += wStride;
                    curW = w >> 12;
                    if (curW !== 0) {
                        nextU = Math.trunc(u / curW);
                        nextV = Math.trunc(v / curW);
                        if (nextU < 7) {
                            nextU = 7;
                        } else if (nextU > 4032) {
                            nextU = 4032;
                        }
                    }
                    stepU = (nextU - curU) >> 3;
                    stepV = (nextV - curV) >> 3;
                    shadeA += shadeStrides;
                    curU += (shadeA >> 3) & 0xc0000;
                    shadeShift = shadeA >> 23;
                }
                strides = (xB - xA) & 0x7;
                while (strides-- > 0) {
                    dst[offset++] = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift;
                    curU += stepU;
                    curV += stepV;
                }
            } else {
                while (strides-- > 0) {
                    let rgb: number;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset = offset + 1;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset = offset + 1;
                    curU = nextU;
                    curV = nextV;
                    u += uStride;
                    v += vStride;
                    w += wStride;
                    curW = w >> 12;
                    if (curW !== 0) {
                        nextU = Math.trunc(u / curW);
                        nextV = Math.trunc(v / curW);
                        if (nextU < 7) {
                            nextU = 7;
                        } else if (nextU > 4032) {
                            nextU = 4032;
                        }
                    }
                    stepU = (nextU - curU) >> 3;
                    stepV = (nextV - curV) >> 3;
                    shadeA += shadeStrides;
                    curU += (shadeA >> 3) & 0xc0000;
                    shadeShift = shadeA >> 23;
                }
                strides = (xB - xA) & 0x7;
                while (strides-- > 0) {
                    let rgb: number;
                    if ((rgb = texels[(curV & 0xfc0) + (curU >> 6)] >>> shadeShift) !== 0) {
                        dst[offset] = rgb;
                    }
                    offset++;
                    curU += stepU;
                    curV += stepV;
                }
            }
            return;
        }
        nextU = 0;
        nextV = 0;
        dx = xA - this.centerX;
        u = u + (uStride >> 3) * dx;
        v = v + (vStride >> 3) * dx;
        w = w + (wStride >> 3) * dx;
        curW = w >> 14;
        if (curW !== 0) {
            curU = Math.trunc(u / curW);
            curV = Math.trunc(v / curW);
            if (curU < 0) {
                curU = 0;
            } else if (curU > 16256) {
                curU = 16256;
            }
        }
        u = u + uStride;
        v = v + vStride;
        w = w + wStride;
        curW = w >> 14;
        if (curW !== 0) {
            nextU = Math.trunc(u / curW);
            nextV = Math.trunc(v / curW);
            if (nextU < 7) {
                nextU = 7;
            } else if (nextU > 16256) {
                nextU = 16256;
            }
        }
        stepU = (nextU - curU) >> 3;
        stepV = (nextV - curV) >> 3;
        curU += shadeA & 0x600000;
        shadeShift = shadeA >> 23;
        if (this.opaque && texels) {
            while (strides-- > 0) {
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU = nextU;
                curV = nextV;
                u += uStride;
                v += vStride;
                w += wStride;
                curW = w >> 14;
                if (curW !== 0) {
                    nextU = Math.trunc(u / curW);
                    nextV = Math.trunc(v / curW);
                    if (nextU < 7) {
                        nextU = 7;
                    } else if (nextU > 16256) {
                        nextU = 16256;
                    }
                }
                stepU = (nextU - curU) >> 3;
                stepV = (nextV - curV) >> 3;
                shadeA += shadeStrides;
                curU += shadeA & 0x600000;
                shadeShift = shadeA >> 23;
            }
            strides = (xB - xA) & 0x7;
            while (strides-- > 0) {
                dst[offset++] = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift;
                curU += stepU;
                curV += stepV;
            }
            return;
        }

        while (strides-- > 0 && texels) {
            let rgb: number;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset = offset + 1;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU = nextU;
            curV = nextV;
            u += uStride;
            v += vStride;
            w += wStride;
            curW = w >> 14;
            if (curW !== 0) {
                nextU = Math.trunc(u / curW);
                nextV = Math.trunc(v / curW);
                if (nextU < 7) {
                    nextU = 7;
                } else if (nextU > 16256) {
                    nextU = 16256;
                }
            }
            stepU = (nextU - curU) >> 3;
            stepV = (nextV - curV) >> 3;
            shadeA += shadeStrides;
            curU += shadeA & 0x600000;
            shadeShift = shadeA >> 23;
        }
        strides = (xB - xA) & 0x7;
        while (strides-- > 0 && texels) {
            let rgb: number;
            if ((rgb = texels[(curV & 0x3f80) + (curU >> 7)] >>> shadeShift) !== 0) {
                dst[offset] = rgb;
            }
            offset++;
            curU += stepU;
            curV += stepV;
        }
    };

    private static drawScanline = (x0: number, x1: number, dst: Int32Array, offset: number, rgb: number): void => {
        if (this.clipX) {
            if (x1 > Draw2D.boundX) {
                x1 = Draw2D.boundX;
            }
            if (x0 < 0) {
                x0 = 0;
            }
        }

        if (x0 >= x1) {
            return;
        }

        offset += x0;
        let length: number = (x1 - x0) >> 2;

        if (this.alpha === 0) {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                length--;
                if (length < 0) {
                    length = (x1 - x0) & 0x3;
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        length--;
                        if (length < 0) {
                            return;
                        }
                        dst[offset++] = rgb;
                    }
                }
                dst[offset++] = rgb;
                dst[offset++] = rgb;
                dst[offset++] = rgb;
                dst[offset++] = rgb;
            }
        }

        const alpha: number = this.alpha;
        const invAlpha: number = 256 - this.alpha;
        rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            length--;
            if (length < 0) {
                length = (x1 - x0) & 0x3;
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    length--;
                    if (length < 0) {
                        return;
                    }
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                }
            }

            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
        }
    };

    static pushTexture = (id: number): void => {
        if (this.activeTexels[id] && this.texelPool) {
            this.texelPool[this.poolSize++] = this.activeTexels[id];
            this.activeTexels[id] = null;
        }
    };

    private static getTexels = (id: number): Int32Array | null => {
        this.textureCycle[id] = this.cycle++;
        if (this.activeTexels[id]) {
            return this.activeTexels[id];
        }

        let texels: Int32Array | null;
        if (this.poolSize > 0 && this.texelPool) {
            texels = this.texelPool[--this.poolSize];
            this.texelPool[this.poolSize] = null;
        } else {
            let cycle: number = 0;
            let selected: number = -1;
            for (let t: number = 0; t < this.textureCount; t++) {
                if (this.activeTexels[t] && (this.textureCycle[t] < cycle || selected === -1)) {
                    cycle = this.textureCycle[t];
                    selected = t;
                }
            }
            texels = this.activeTexels[selected];
            this.activeTexels[selected] = null;
        }

        this.activeTexels[id] = texels;
        const texture: Pix8 = this.textures[id];
        const palette: Int32Array | null = this.texturePalette[id];

        if (texels && palette) {
            if (this.lowMemory) {
                this.textureTranslucent[id] = false;
                for (let i: number = 0; i < 4096; i++) {
                    const rgb: number = (texels[i] = palette[texture.pixels[i]] & 0xf8f8ff);
                    if (rgb === 0) {
                        this.textureTranslucent[id] = true;
                    }
                    texels[i + 4096] = (rgb - (rgb >>> 3)) & 0xf8f8ff;
                    texels[i + 8192] = (rgb - (rgb >>> 2)) & 0xf8f8ff;
                    texels[i + 12288] = (rgb - (rgb >>> 2) - (rgb >>> 3)) & 0xf8f8ff;
                }
            } else {
                if (texture.width === 64) {
                    for (let y: number = 0; y < 128; y++) {
                        for (let x: number = 0; x < 128; x++) {
                            texels[x + (y << 7)] = palette[texture.pixels[(x >> 1) + ((y >> 1) << 6)]];
                        }
                    }
                } else {
                    for (let i: number = 0; i < 16384; i++) {
                        texels[i] = palette[texture.pixels[i]];
                    }
                }

                this.textureTranslucent[id] = false;
                for (let i: number = 0; i < 16384; i++) {
                    texels[i] &= 0xf8f8ff;
                    const rgb: number = texels[i];
                    if (rgb === 0) {
                        this.textureTranslucent[id] = true;
                    }
                    texels[i + 16384] = (rgb - (rgb >>> 3)) & 0xf8f8ff;
                    texels[i + 32768] = (rgb - (rgb >>> 2)) & 0xf8f8ff;
                    texels[i + 49152] = (rgb - (rgb >>> 2) - (rgb >>> 3)) & 0xf8f8ff;
                }
            }
        }

        return texels;
    };
}
