import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import LruCache from '../datastruct/LruCache';

export default class LocType extends ConfigType {
    static count: number = 0;
    static cache: LocType[] | null = null;
    static dat: Packet | null = null;
    static offsets: Int32Array | null = null;
    static cachePos: number = 0;
    static modelCacheStatic: LruCache | null = new LruCache(500);
    static modelCacheDynamic: LruCache | null = new LruCache(30);

    static unpack = (config: Jagfile): void => {
        this.dat = new Packet(config.read('loc.dat'));
        const idx: Packet = new Packet(config.read('loc.idx'));

        this.count = idx.g2;
        this.offsets = new Int32Array(this.count);

        let offset: number = 2;
        for (let id: number = 0; id < this.count; id++) {
            this.offsets[id] = offset;
            offset += idx.g2;
        }

        this.cache = new Array(10);
        for (let id: number = 0; id < 10; id++) {
            this.cache[id] = new LocType();
        }
    };

    static get = (id: number): LocType => {
        if (!this.cache || !this.offsets || !this.dat) {
            throw new Error('LocType not loaded!!!');
        }

        for (let i: number = 0; i < 10; i++) {
            if (this.cache[i].index === id) {
                return this.cache[i];
            }
        }

        this.cachePos = (this.cachePos + 1) % 10;
        const loc: LocType = this.cache[this.cachePos];
        this.dat.pos = this.offsets[id];
        loc.index = id;
        loc.reset();
        loc.decodeType(id, this.dat);
        return loc;
    };

    static unload = (): void => {
        this.modelCacheStatic = null;
        this.modelCacheDynamic = null;
        this.offsets = null;
        this.cache = null;
        this.dat = null;
    };

    // ----

    index: number = -1;
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
    disposeAlpha: boolean = false;
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

    decode = (_index: number, code: number, dat: Packet): void => {
        if (code === 1) {
            const count: number = dat.g1;
            this.models = new Uint16Array(count);
            this.shapes = new Uint8Array(count);

            for (let i: number = 0; i < count; i++) {
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

            if (this.anim === 65535) {
                this.anim = -1;
            }
        } else if (code === 25) {
            this.disposeAlpha = true;
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
            const count: number = dat.g1;
            this.recol_s = new Uint16Array(count);
            this.recol_d = new Uint16Array(count);

            for (let i: number = 0; i < count; i++) {
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

    private reset = (): void => {
        this.models = null;
        this.shapes = null;
        this.name = null;
        this.desc = null;
        this.recol_s = null;
        this.recol_d = null;
        this.width = 1;
        this.length = 1;
        this.blockwalk = true;
        this.blockrange = true;
        this.active = 0;
        this.hillskew = false;
        this.sharelight = false;
        this.occlude = false;
        this.anim = -1;
        this.walloff = 16;
        this.ambient = 0;
        this.contrast = 0;
        this.ops = [];
        this.disposeAlpha = false;
        this.mapfunction = -1;
        this.mapscene = -1;
        this.mirror = false;
        this.shadow = true;
        this.resizex = 128;
        this.resizey = 128;
        this.resizez = 128;
        this.forceapproach = 0;
        this.xoff = 0;
        this.yoff = 0;
        this.zoff = 0;
        this.forcedecor = false;
    };
}
