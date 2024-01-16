import Draw2D from './Draw2D';
import Pix8 from './Pix8';
import Jagfile from '../io/Jagfile';

export default class Draw3D {
    static reciprocal15: Int32Array = new Int32Array(512);
    static reciprocal16: Int32Array = new Int32Array(2048);
    static sin: Int32Array = new Int32Array(2048);
    static cos: Int32Array = new Int32Array(2048);
    static palette: Uint32Array = new Uint32Array(65536);

    static textures: Pix8[] = [];
    static textureCount: number = 0;

    static lineOffset: Int32Array = new Int32Array();
    static centerX: number = 0;
    static centerY: number = 0;

    static jagged: boolean = true;
    static clipX: boolean = false;
    static alpha: number = 0;

    static texelPool: number[][] | null = null;
    static activeTexels: number[] = [];
    static poolSize: number = 0;

    static {
        for (let i: number = 1; i < 512; i++) {
            this.reciprocal15[i] = 32768 / i;
        }

        for (let i: number = 1; i < 2048; i++) {
            this.reciprocal16[i] = 65536 / i;
        }

        for (let i: number = 0; i < 2048; i++) {
            // angular frequency: 2 * pi / 2048 = 0.0030679615757712823
            // * 65536 = maximum amplitude
            this.sin[i] = Math.trunc(Math.sin(i * 0.0030679615757712823) * 65536);
            this.cos[i] = Math.trunc(Math.cos(i * 0.0030679615757712823) * 65536);
        }
    }

    static init2D = (): void => {
        this.lineOffset = new Int32Array(Draw2D.height);
        for (let y: number = 0; y < Draw2D.height; y++) {
            this.lineOffset[y] = Draw2D.width * y;
        }
        this.centerX = Draw2D.width / 2;
        this.centerY = Draw2D.height / 2;
    };

    static init3D = (width: number, height: number): void => {
        this.lineOffset = new Int32Array(height);
        for (let y: number = 0; y < height; y++) {
            this.lineOffset[y] = width * y;
        }
        this.centerX = width / 2;
        this.centerY = height / 2;
    };

    static unpackTextures = (textures: Jagfile): void => {
        this.textureCount = 0;

        for (let i: number = 0; i < 50; i++) {
            try {
                this.textures[i] = Pix8.fromArchive(textures, i.toString());
                this.textureCount++;
            } catch (err) {
                /* empty */
            }
        }
    };

    static setBrightness = (brightness: number): void => {
        brightness += Math.random() * 0.3 - 0.15;

        let offset: number = 0;
        for (let y: number = 0; y < 512; y++) {
            const hue: number = y / 8 / 64 + 0.0078125;
            const saturation: number = (y & 7) / 8 + 0.0625;

            for (let x: number = 0; x < 128; x++) {
                const lightness: number = x / 128;

                let r: number = lightness;
                let g: number = lightness;
                let b: number = lightness;

                if (saturation) {
                    let q: number;
                    if (lightness < 0.5) {
                        q = lightness * (1 + saturation);
                    } else {
                        q = lightness + saturation - lightness * saturation;
                    }

                    const p: number = 2 * lightness - q;
                    let t: number = hue + 0.3333333333333333;
                    if (t > 1) {
                        t--;
                    }

                    let d11: number = hue - 0.3333333333333333;
                    if (d11 < 0) {
                        d11++;
                    }

                    if (6 * t < 1) {
                        r = p + (q - p) * 6 * t;
                    } else if (2 * t < 1) {
                        r = q;
                    } else if (3 * t < 2) {
                        r = p + (q - p) * ((0.6666666666666666 - t) * 6);
                    } else {
                        r = p;
                    }

                    if (6 * hue < 1) {
                        g = p + (q - p) * 6 * hue;
                    } else if (2 * hue < 1) {
                        g = q;
                    } else if (3 * hue < 2) {
                        g = p + (q - p) * ((0.6666666666666666 - hue) * 6);
                    } else {
                        g = p;
                    }

                    if (6 * d11 < 1) {
                        b = p + (q - p) * 6 * d11;
                    } else if (2 * d11 < 1) {
                        b = q;
                    } else if (3 * d11 < 2) {
                        b = p + (q - p) * ((0.6666666666666666 - d11) * 6);
                    } else {
                        b = p;
                    }
                }

                const intR: number = Math.trunc(r * 256);
                const intG: number = Math.trunc(g * 256);
                const intB: number = Math.trunc(b * 256);
                let rgb: number = (intR << 16) | (intG << 8) | intB;
                rgb = this.setGamma(rgb, brightness);
                if (rgb === 0) {
                    rgb = 1;
                }

                this.palette[offset++] = rgb;
            }
        }
    };

    private static setGamma = (rgb: number, gamma: number): number => {
        let r: number = (rgb >> 16) / 256;
        let g: number = ((rgb >> 8) & 255) / 256;
        let b: number = (rgb & 255) / 256;
        r = Math.pow(r, gamma);
        g = Math.pow(g, gamma);
        b = Math.pow(b, gamma);
        const intR: number = Math.trunc(r * 256);
        const intG: number = Math.trunc(g * 256);
        const intB: number = Math.trunc(b * 256);
        return (intR << 16) | (intG << 8) | intB;
    };

    static initPool = (size: number): void => {
        if (this.texelPool !== null) {
            return;
        }
        this.poolSize = size;
        this.texelPool = [];
        this.activeTexels = [];
    };

    static fillGouraudTriangle = (xA: number, xB: number, xC: number, yA: number, yB: number, yC: number, colorA: number, colorB: number, colorC: number): void => {
        let xStepAB: number = 0;
        let xStepBC: number = 0;
        let xStepAC: number = 0;

        let colorStepAB: number = 0;
        let colorStepBC: number = 0;
        let colorStepAC: number = 0;

        if (yB !== yA) {
            xStepAB = ((xB - xA) << 16) / (yB - yA);
            colorStepAB = ((colorB - colorA) << 15) / (yB - yA);
        }

        if (yC !== yB) {
            xStepBC = ((xC - xB) << 16) / (yC - yB);
            colorStepBC = ((colorC - colorB) << 15) / (yC - yB);
        }

        if (yC !== yA) {
            xStepAC = ((xA - xC) << 16) / (yA - yC);
            colorStepAC = ((colorA - colorC) << 15) / (yA - yC);
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
                    colorStep = (color1 - color0) / (x1 - x0);
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

        const colorStep: number = (color1 - color0) / (x1 - x0);

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
        if (y1 != y0) {
            xStepAB = Math.trunc(((x1 - x0) << 16) / (y1 - y0));
        }
        let xStepBC: number = 0;
        if (y2 != y1) {
            xStepBC = Math.trunc(((x2 - x1) << 16) / (y2 - y1));
        }
        let xStepAC: number = 0;
        if (y2 != y0) {
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
                    if ((y0 != y1 && xStepAC < xStepAB) || (y0 == y1 && xStepAC > xStepBC)) {
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
                    if ((y0 != y2 && xStepAC < xStepAB) || (y0 == y2 && xStepBC > xStepAB)) {
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
                    if ((y1 != y2 && xStepAB < xStepBC) || (y1 == y2 && xStepAB > xStepAC)) {
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

    static fillTexturedTriangle = (): void => {};

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

        if (this.alpha == 0) {
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
}
