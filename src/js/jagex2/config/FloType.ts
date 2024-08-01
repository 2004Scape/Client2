import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import {ConfigType} from './ConfigType';

export default class FloType extends ConfigType {
    static count: number = 0;
    static instances: FloType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat: Packet = new Packet(config.read('flo.dat'));
        this.count = dat.g2;
        for (let i: number = 0; i < this.count; i++) {
            this.instances[i] = new FloType(i).decodeType(dat);
        }
    };

    static hsl24to16 = (hue: number, saturation: number, lightness: number): number => {
        if (lightness > 179) {
            saturation = (saturation / 2) | 0;
        }
        if (lightness > 192) {
            saturation = (saturation / 2) | 0;
        }
        if (lightness > 217) {
            saturation = (saturation / 2) | 0;
        }
        if (lightness > 243) {
            saturation = (saturation / 2) | 0;
        }
        return (((hue / 4) | 0) << 10) + (((saturation / 32) | 0) << 7) + ((lightness / 2) | 0);
    };

    static mulHSL = (hsl: number, lightness: number): number => {
        if (hsl === -1) {
            return 12345678;
        }
        lightness = ((lightness * (hsl & 0x7f)) / 128) | 0;
        if (lightness < 2) {
            lightness = 2;
        } else if (lightness > 126) {
            lightness = 126;
        }
        return (hsl & 0xff80) + lightness;
    };

    static adjustLightness = (hsl: number, scalar: number): number => {
        if (hsl === -2) {
            return 12345678;
        }

        if (hsl === -1) {
            if (scalar < 0) {
                scalar = 0;
            } else if (scalar > 127) {
                scalar = 127;
            }
            return 127 - scalar;
        } else {
            scalar = ((scalar * (hsl & 0x7f)) / 128) | 0;
            if (scalar < 2) {
                scalar = 2;
            } else if (scalar > 126) {
                scalar = 126;
            }
            return (hsl & 0xff80) + scalar;
        }
    };

    // ----

    rgb: number = 0;
    texture: number = -1;
    opcode3: boolean = false;
    occlude: boolean = true;

    // runtime
    hue: number = 0;
    saturation: number = 0;
    lightness: number = 0;
    luminance: number = 0;
    chroma: number = 0;
    hsl: number = 0;

    decode(code: number, dat: Packet): void {
        if (code === 1) {
            this.rgb = dat.g3;
            this.setColor(this.rgb);
        } else if (code === 2) {
            this.texture = dat.g1;
        } else if (code === 3) {
            this.opcode3 = true;
        } else if (code === 5) {
            this.occlude = false;
        } else if (code === 6) {
            this.debugname = dat.gjstr;
        } else {
            console.log('Error unrecognised config code: ', code);
        }
    }

    private setColor(rgb: number): void {
        const red: number = ((rgb >> 16) & 0xff) / 256.0;
        const green: number = ((rgb >> 8) & 0xff) / 256.0;
        const blue: number = (rgb & 0xff) / 256.0;

        let min: number = red;
        if (green < red) {
            min = green;
        }
        if (blue < min) {
            min = blue;
        }

        let max: number = red;
        if (green > red) {
            max = green;
        }
        if (blue > max) {
            max = blue;
        }

        let h: number = 0.0;
        let s: number = 0.0;
        const l: number = (min + max) / 2.0;

        if (min !== max) {
            if (l < 0.5) {
                s = (max - min) / (max + min);
            }
            if (l >= 0.5) {
                s = (max - min) / (2.0 - max - min);
            }

            if (red === max) {
                h = (green - blue) / (max - min);
            } else if (green === max) {
                h = (blue - red) / (max - min) + 2.0;
            } else if (blue === max) {
                h = (red - green) / (max - min) + 4.0;
            }
        }

        h /= 6.0;

        this.hue = (h * 256.0) | 0;
        this.saturation = (s * 256.0) | 0;
        this.lightness = (l * 256.0) | 0;

        if (this.saturation < 0) {
            this.saturation = 0;
        } else if (this.saturation > 255) {
            this.saturation = 255;
        }

        if (this.lightness < 0) {
            this.lightness = 0;
        } else if (this.lightness > 255) {
            this.lightness = 255;
        }

        if (l > 0.5) {
            this.luminance = ((1.0 - l) * s * 512.0) | 0;
        } else {
            this.luminance = (l * s * 512.0) | 0;
        }

        if (this.luminance < 1) {
            this.luminance = 1;
        }

        this.chroma = (h * this.luminance) | 0;

        let hue: number = this.hue + ((Math.random() * 16.0) | 0) - 8;
        if (hue < 0) {
            hue = 0;
        } else if (hue > 255) {
            hue = 255;
        }

        let saturation: number = this.saturation + ((Math.random() * 48.0) | 0) - 24;
        if (saturation < 0) {
            saturation = 0;
        } else if (saturation > 255) {
            saturation = 255;
        }

        let lightness: number = this.lightness + ((Math.random() * 48.0) | 0) - 24;
        if (lightness < 0) {
            lightness = 0;
        } else if (lightness > 255) {
            lightness = 255;
        }

        this.hsl = FloType.hsl24to16(hue, saturation, lightness);
    }
}
