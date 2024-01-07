import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';

export default class LocType extends ConfigType {
    static count: number = 0;
    static instances: LocType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat = new Packet(config.read('loc.dat'));
        this.count = dat.g2;
        for (let i = 0; i < this.count; i++) {
            const type = new LocType(i);
            this.instances[i] = type;
            type.decodeType(dat);

            if (!type.shapes) {
                type.shapes = new Uint8Array(0);
            }

            if (type.active === -1) {
                type.active = type.shapes.length > 0 && type.shapes[0] == 10 ? 1 : 0;

                if (type.ops.length > 0) {
                    type.active = 1;
                }
            }
        }
    };

    static get = (id: number): LocType => LocType.instances[id];

    // ----

    models: Uint16Array | null = null;
    shapes: Uint8Array | null = null;
    name: string | null = null;
    desc: string | null = null;
    recol_s: Uint16Array | null = null;
    recol_d: Uint16Array | null = null;
    width: number = 1;
    length: number = 1;
    blockwalk: boolean = true;
    blockrange: boolean = true;
    active: number = -1;
    hillskew: boolean = false;
    sharelight: boolean = false;
    occlude: boolean = false;
    anim: number = -1;
    hasalpha: boolean = false;
    walloff: number = 16;
    ambient: number = 0;
    contrast: number = 0;
    ops: (string | null)[] = [];
    mapfunction: number = -1;
    mapscene: number = -1;
    mirror: boolean = false;
    shadow: boolean = true;
    resizex: number = 128;
    resizey: number = 128;
    resizez: number = 128;
    forceapproach: number = 0;
    xoff: number = 0;
    yoff: number = 0;
    zoff: number = 0;
    forcedecor: boolean = false;

    decode = (code: number, dat: Packet): void => {
        if (code === 1) {
            const count = dat.g1;
            this.models = new Uint16Array(count);
            this.shapes = new Uint8Array(count);

            for (let i = 0; i < count; i++) {
                this.models[i] = dat.g2;
                this.shapes[i] = dat.g1;
            }
        } else if (code === 2) {
            this.name = dat.gjstr;
        } else if (code === 3) {
            this.desc = dat.gjstr;
        } else if (code === 14) {
            this.width = dat.g1;
        } else if (code === 15) {
            this.length = dat.g1;
        } else if (code === 17) {
            this.blockwalk = false;
        } else if (code === 18) {
            this.blockrange = false;
        } else if (code === 19) {
            this.active = dat.g1;
        } else if (code === 21) {
            this.hillskew = true;
        } else if (code === 22) {
            this.sharelight = true;
        } else if (code === 23) {
            this.occlude = true;
        } else if (code === 24) {
            this.anim = dat.g2;

            if (this.anim == 65535) {
                this.anim = -1;
            }
        } else if (code === 25) {
            this.hasalpha = true;
        } else if (code === 28) {
            this.walloff = dat.g1;
        } else if (code === 29) {
            this.ambient = dat.g1b;
        } else if (code === 39) {
            this.contrast = dat.g1b;
        } else if (code >= 30 && code < 35) {
            this.ops[code - 30] = dat.gjstr;

            if (this.ops[code - 30] === 'hidden') {
                this.ops[code - 30] = null;
            }
        } else if (code === 40) {
            const count = dat.g1;
            this.recol_s = new Uint16Array(count);
            this.recol_d = new Uint16Array(count);

            for (let i = 0; i < count; i++) {
                this.recol_s[i] = dat.g2;
                this.recol_d[i] = dat.g2;
            }
        } else if (code === 60) {
            this.mapfunction = dat.g2;
        } else if (code === 62) {
            this.mirror = true;
        } else if (code === 64) {
            this.shadow = false;
        } else if (code === 65) {
            this.resizex = dat.g2;
        } else if (code === 66) {
            this.resizey = dat.g2;
        } else if (code === 67) {
            this.resizez = dat.g2;
        } else if (code === 68) {
            this.mapscene = dat.g2;
        } else if (code === 69) {
            this.forceapproach = dat.g1;
        } else if (code === 70) {
            this.xoff = dat.g2b;
        } else if (code === 71) {
            this.yoff = dat.g2b;
        } else if (code === 72) {
            this.zoff = dat.g2b;
        } else if (code === 73) {
            this.forcedecor = true;
        } else {
            throw new Error(`Unrecognized loc config code: ${code}`);
        }
    };
}
