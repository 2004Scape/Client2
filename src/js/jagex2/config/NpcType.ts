import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import LruCache from '../datastruct/LruCache';

export default class NpcType extends ConfigType {
    static count: number = 0;
    static cache: NpcType[] | null = null;
    static dat: Packet | null = null;
    static offsets: Int32Array | null = null;
    static cachePos: number = 0;
    static modelCache: LruCache | null = new LruCache(30);

    static unpack = (config: Jagfile): void => {
        this.dat = new Packet(config.read('npc.dat'));
        const idx: Packet = new Packet(config.read('npc.idx'));

        this.count = idx.g2;
        this.offsets = new Int32Array(this.count);

        let offset: number = 2;
        for (let id: number = 0; id < this.count; id++) {
            this.offsets[id] = offset;
            offset += idx.g2;
        }

        this.cache = new Array(20);
        for (let id: number = 0; id < 20; id++) {
            this.cache[id] = new NpcType();
        }
    };

    static get = (id: number): NpcType => {
        if (!this.cache || !this.offsets || !this.dat) {
            throw new Error('LocType not loaded!!!');
        }

        for (let id: number = 0; id < 20; id++) {
            if (this.cache[id].index == id) {
                return this.cache[id];
            }
        }

        this.cachePos = (this.cachePos + 1) % 20;
        const loc: NpcType = (this.cache[this.cachePos] = new NpcType());
        this.dat.pos = this.offsets[id];
        loc.index = id;
        loc.decodeType(id, this.dat);
        return loc;
    };

    static unload = (): void => {
        this.modelCache = null;
        this.offsets = null;
        this.cache = null;
        this.dat = null;
    };

    // ----

    index: number = -1;
    name: string | null = null;
    desc: string | null = null;
    size: number = 1;
    models: Uint16Array | null = null;
    heads: Uint16Array | null = null;
    hasanim: boolean = false;
    readyanim: number = -1;
    walkanim: number = -1;
    walkanim_b: number = -1;
    walkanim_r: number = -1;
    walkanim_l: number = -1;
    hasalpha: boolean = false;
    recol_s: Uint16Array | null = null;
    recol_d: Uint16Array | null = null;
    ops: (string | null)[] = [];
    code90: number = -1;
    code91: number = -1;
    code92: number = -1;
    visonmap: boolean = true;
    vislevel: number = -1;
    resizeh: number = 128;
    resizev: number = 128;

    decode = (_index: number, code: number, dat: Packet): void => {
        if (code === 1) {
            const count: number = dat.g1;
            this.models = new Uint16Array(count);

            for (let i: number = 0; i < count; i++) {
                this.models[i] = dat.g2;
            }
        } else if (code === 2) {
            this.name = dat.gjstr;
        } else if (code === 3) {
            this.desc = dat.gjstr;
        } else if (code === 12) {
            this.size = dat.g1;
        } else if (code === 13) {
            this.readyanim = dat.g2;
        } else if (code === 14) {
            this.walkanim = dat.g2;
        } else if (code === 16) {
            this.hasanim = true;
        } else if (code === 17) {
            this.walkanim = dat.g2;
            this.walkanim_b = dat.g2;
            this.walkanim_r = dat.g2;
            this.walkanim_l = dat.g2;
        } else if (code >= 30 && code < 40) {
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
            const count: number = dat.g1;
            this.heads = new Uint16Array(count);

            for (let i: number = 0; i < count; i++) {
                this.heads[i] = dat.g2;
            }
        } else if (code === 90) {
            this.code90 = dat.g2;
        } else if (code === 91) {
            this.code91 = dat.g2;
        } else if (code === 92) {
            this.code92 = dat.g2;
        } else if (code === 93) {
            this.visonmap = false;
        } else if (code === 95) {
            this.vislevel = dat.g2;
        } else if (code === 97) {
            this.resizeh = dat.g2;
        } else if (code === 98) {
            this.resizev = dat.g2;
        } else {
            throw new Error(`Unrecognized npc config code: ${code}`);
        }
    };
}
