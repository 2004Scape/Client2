import Draw2D from './Draw2D.js';
import Image8 from './Image8.js';

export default class Draw3D {
    static reciprocal15 = new Int32Array(512);
    static reciprocal16 = new Int32Array(2048);
    static sin = new Int32Array(2048);
    static cos = new Int32Array(2048);
    static palette = new Uint32Array(65536);

    static textures = [];
    static textureCount = 0;

    static {
        for (let i = 1; i < 512; i++) {
            Draw3D.reciprocal15[i] = 32768 / i;
        }

        for (let i = 1; i < 2048; i++) {
            Draw3D.reciprocal16[i] = 65536 / i;
        }

        for (let i = 0; i < 2048; i++) {
            // angular frequency: 2 * pi / 2048 = 0.0030679615757712823
            // * 65536 = maximum amplitude
            Draw3D.sin[i] = Math.trunc(Math.sin(i * 0.0030679615757712823) * 65536);
            Draw3D.cos[i] = Math.trunc(Math.cos(i * 0.0030679615757712823) * 65536);
        }

        let offset = 0;
        for (let y = 0; y < 512; y++) {
            let hue = ((y / 8) / 64) + 0.0078125;
            let saturation = ((y & 7) / 8) + 0.0625;

            for (let x = 0; x < 128; x++) {
                let lightness = x / 128;

                let r = lightness;
                let g = lightness;
                let b = lightness;

                if (saturation) {
                    let q;
                    if (lightness < 0.5) {
                        q = lightness * (1 + saturation);
                    } else {
                        q = (lightness + saturation) - (lightness * saturation);
                    }

                    let p = 2 * lightness - q;
                    let t = hue + 0.3333333333333333;
                    if (t > 1) {
                        t--;
                    }

                    let d11 = hue - 0.3333333333333333;
                    if (d11 < 0) {
                        d11++;
                    }

                    if (6 * t < 1) {
                        r = p + ((q - p) * 6 * t);
                    } else if (2 * t < 1) {
                        r = q;
                    } else if (3 * t < 2) {
                        r = p + ((q - p) * ((0.6666666666666666 - t) * 6));
                    } else {
                        r = p;
                    }

                    if (6 * hue < 1) {
                        g = p + ((q - p) * 6 * hue);
                    } else if (2 * hue < 1) {
                        g = q;
                    } else if (3 * hue < 2) {
                        g = p + ((q - p) * ((0.6666666666666666 - hue) * 6));
                    } else {
                        g = p;
                    }

                    if (6 * d11 < 1) {
                        b = p + ((q - p) * 6 * d11);
                    } else if (2 * d11 < 1) {
                        b = q;
                    } else if (3 * d11 < 2) {
                        b = p + ((q - p) * ((0.6666666666666666 - d11) * 6));
                    } else {
                        b = p;
                    }
                }

                let intR = Math.trunc(r * 256);
                let intG = Math.trunc(g * 256);
                let intB = Math.trunc(b * 256);

                let rgb = (intR << 16) | (intG << 8) | intB;
                if (rgb === 0) {
                    rgb = 1;
                }
                Draw3D.palette[offset++] = rgb;
            }
        }
    }

    static unpackTextures(textures) {
        Draw3D.textureCount = 0;

        for (let i = 0; i < 50; i++) {
            try {
                Draw3D.textures[i] = Image8.fromArchive(textures, i.toString());
                Draw3D.textureCount++;
            } catch (err) {
            }
        }
    }

    static lineOffset = null;
    static centerX = 0;
    static centerY = 0;

    static init2D() {
        Draw3D.lineOffset = new Int32Array(Draw2D.height);
        for (let i = 0; i < Draw2D.height; i++) {
            Draw3D.lineOffset[i] = Draw2D.width * i;
        }
        this.centerX = Draw2D.width / 2;
        this.centerY = Draw2D.height / 2;
    }

    static fillGouraudTriangle(yA, yB, yC, xA, xB, xC, colorA, colorB, colorC) {
        let xStepAB = 0;
        let xStepBC = 0;
        let xStepAC = 0;

        let colorStepAB = 0;
        let colorStepBC = 0;
        let colorStepAC = 0;

        if (yB != yA) {
            xStepAB = ((xB - xA) << 16) / (yB - yA);
            colorStepAB = ((colorB - colorA) << 15) / (yB - yA);
        }

        if (yC != yB) {
            xStepBC = ((xC - xB) << 16) / (yC - yB);
            colorStepBC = ((colorC - colorB) << 15) / (yC - yB);
        }

        if (yC != yA) {
            xStepAC = ((xA - xC) << 16) / (yA - yC);
            colorStepAC = ((colorA - colorC) << 15) / (yA - yC);
        }

        if ((yA <= yB) && (yA <= yC)) {
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
                xC = (xA <<= 16);
                colorC = (colorA <<= 15);
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
                if (((yA != yB) && (xStepAC < xStepAB)) || ((yA == yB) && (xStepAC > xStepBC))) {
                    yC -= yB;
                    yB -= yA;
                    for (yA = Draw3D.lineOffset[yA]; --yB >= 0; yA += Draw2D.width) {
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
                for (yA = Draw3D.lineOffset[yA]; --yB >= 0; yA += Draw2D.width) {
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
            xB = (xA <<= 16);
            colorB = (colorA <<= 15);
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
            if (((yA != yC) && (xStepAC < xStepAB)) || ((yA == yC) && (xStepBC > xStepAB))) {
                yB -= yC;
                yC -= yA;
                for (yA = Draw3D.lineOffset[yA]; --yC >= 0; yA += Draw2D.width) {
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
            for (yA = Draw3D.lineOffset[yA]; --yC >= 0; yA += Draw2D.width) {
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
                xA = (xB <<= 16);
                colorA = (colorB <<= 15);
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
                if (((yB != yC) && (xStepAB < xStepBC)) || ((yB == yC) && (xStepAB > xStepAC))) {
                    yA -= yC;
                    yC -= yB;
                    for (yB = Draw3D.lineOffset[yB]; --yC >= 0; yB += Draw2D.width) {
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
                for (yB = Draw3D.lineOffset[yB]; --yC >= 0; yB += Draw2D.width) {
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
            xC = (xB <<= 16);
            colorC = (colorB <<= 15);
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
                for (yB = Draw3D.lineOffset[yB]; --yA >= 0; yB += Draw2D.width) {
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
            for (yB = Draw3D.lineOffset[yB]; --yA >= 0; yB += Draw2D.width) {
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
            xB = (xC <<= 16);
            colorB = (colorC <<= 15);
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
                for (yC = Draw3D.lineOffset[yC]; --yA >= 0; yC += Draw2D.width) {
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
            for (yC = Draw3D.lineOffset[yC]; --yA >= 0; yC += Draw2D.width) {
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
        xA = (xC <<= 16);
        colorA = (colorC <<= 15);
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
            for (yC = Draw3D.lineOffset[yC]; --yB >= 0; yC += Draw2D.width) {
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
        for (yC = Draw3D.lineOffset[yC]; --yB >= 0; yC += Draw2D.width) {
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
    }

    static drawGouraudScanline(dst, offset, x0, x1, color0, color1) {
        let rgb = 0;
        let length = 0;

        if (Draw3D.jagged) {
            let colorStep = 0;

            if (Draw3D.clipX) {
                if ((x1 - x0) > 3) {
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
                    colorStep = ((color1 - color0) * reciprocal15[length]) >> 15;
                } else {
                    colorStep = 0;
                }
            }

            if (Draw3D.alpha == 0) {
                while (--length >= 0) {
                    rgb = Draw3D.palette[color0 >> 8];
                    color0 += colorStep;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                    dst[offset++] = rgb;
                }

                length = (x1 - x0) & 3;

                if (length > 0) {
                    rgb = Draw3D.palette[color0 >> 8];
                    do {
                        dst[offset++] = rgb;
                    } while (--length > 0);
                    return;
                }
            } else {
                let alpha = Draw3D.alpha;
                let invAlpha = 256 - Draw3D.alpha;

                while (--length >= 0) {
                    rgb = Draw3D.palette[color0 >> 8];
                    color0 += colorStep;
                    rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                    dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
                }

                length = (x1 - x0) & 3;

                if (length > 0) {
                    rgb = Draw3D.palette[color0 >> 8];
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

        let colorStep = (color1 - color0) / (x1 - x0);

        if (Draw3D.clipX) {
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

        if (Draw3D.alpha == 0) {
            do {
                dst[offset++] = Draw3D.palette[color0 >> 8];
                color0 += colorStep;
            } while (--length > 0);
            return;
        }

        let alpha = Draw3D.alpha;
        let invAlpha = 256 - Draw3D.alpha;

        do {
            rgb = Draw3D.palette[color0 >> 8];
            color0 += colorStep;
            rgb = ((((rgb & 0xff00ff) * invAlpha) >> 8) & 0xff00ff) + ((((rgb & 0xff00) * invAlpha) >> 8) & 0xff00);
            dst[offset++] = rgb + ((((dst[offset] & 0xff00ff) * alpha) >> 8) & 0xff00ff) + ((((dst[offset] & 0xff00) * alpha) >> 8) & 0xff00);
        } while (--length > 0);
    }

    static fillTriangle() {
    }

    static fillTexturedTriangle() {
    }
}
