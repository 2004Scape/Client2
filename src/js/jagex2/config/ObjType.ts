import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import Pix24 from '../graphics/Pix24';
import LruCache from '../datastruct/LruCache';

export default class ObjType extends ConfigType {
    static count: number = 0;
    static cache: Array<ObjType> | null = null;
    static dat: Packet | null = null;
    static offsets: Int32Array | null = null;
    static cachePos: number = 0;
    static membersWorld: boolean = true;
    static modelCache: LruCache | null = new LruCache(50);
    static iconCache: LruCache | null = new LruCache(200);

    static unpack = (config: Jagfile, members: boolean): void => {
        this.membersWorld = members;
        this.dat = new Packet(config.read('obj.dat'));
        const idx: Packet = new Packet(config.read('obj.idx'));

        this.count = idx.g2;
        this.offsets = new Int32Array(this.count);

        let offset: number = 2;
        for (let id: number = 0; id < this.count; id++) {
            this.offsets[id] = offset;
            offset += idx.g2;
        }

        this.cache = new Array(10);
        for (let id: number = 0; id < 10; id++) {
            this.cache[id] = new ObjType();
        }
    };

    static get = (id: number): ObjType => {
        if (!this.cache || !this.offsets || !this.dat) {
            throw new Error('ObjType not loaded!!!');
        }

        for (let id: number = 0; id < 10; id++) {
            if (this.cache[id].index == id) {
                return this.cache[id];
            }
        }

        this.cachePos = (this.cachePos + 1) % 10;
        const obj: ObjType = this.cache[this.cachePos];
        this.dat.pos = this.offsets[id];
        obj.index = id;
        obj.reset();
        obj.decodeType(id, this.dat);

        if (obj.certtemplate != -1) {
            obj.toCertificate();
        }

        if (!this.membersWorld && obj.members) {
            obj.name = 'Members Object';
            obj.desc = "Login to a members' server to use this object.";
            obj.ops = [];
            obj.iops = [];
        }

        return obj;
    };

    static unload = (): void => {
        this.modelCache = null;
        this.iconCache = null;
        this.offsets = null;
        this.cache = null;
        this.dat = null;
    };

    static getIcon = (id: number, count: number): Pix24 => {
        // TODO
        return new Pix24(32, 32);
    };

    // ----

    index: number = -1;
    model: number = 0;
    name: string | null = null;
    desc: string | null = null;
    recol_s: Uint16Array | null = null;
    recol_d: Uint16Array | null = null;
    zoom2d: number = 2000;
    xan2d: number = 0;
    yan2d: number = 0;
    zan2d: number = 0;
    xof2d: number = 0;
    yof2d: number = 0;
    code9: boolean = false;
    code10: number = -1;
    stackable: boolean = false;
    cost: number = 1;
    members: boolean = false;
    ops: (string | null)[] = [];
    iops: string[] = [];
    manwear: number = -1;
    manwear2: number = -1;
    manwearOffsetY: number = 0;
    womanwear: number = -1;
    womanwear2: number = -1;
    womanwearOffsetY: number = 0;
    manwear3: number = -1;
    womanwear3: number = -1;
    manhead: number = -1;
    manhead2: number = -1;
    womanhead: number = -1;
    womanhead2: number = -1;
    countobj: Uint16Array | null = null;
    countco: Uint16Array | null = null;
    certlink: number = -1;
    certtemplate: number = -1;

    decode = (_index: number, code: number, dat: Packet): void => {
        if (code === 1) {
            this.model = dat.g2;
        } else if (code === 2) {
            this.name = dat.gjstr;
        } else if (code === 3) {
            this.desc = dat.gjstr;
        } else if (code === 4) {
            this.zoom2d = dat.g2;
        } else if (code === 5) {
            this.xan2d = dat.g2;
        } else if (code === 6) {
            this.yan2d = dat.g2;
        } else if (code === 7) {
            this.xof2d = dat.g2b;
            if (this.xof2d > 32767) {
                this.xof2d -= 65536;
            }
        } else if (code === 8) {
            this.yof2d = dat.g2b;
            if (this.yof2d > 32767) {
                this.yof2d -= 65536;
            }
        } else if (code === 9) {
            this.code9 = true;
        } else if (code === 10) {
            this.code10 = dat.g2;
        } else if (code === 11) {
            this.stackable = true;
        } else if (code === 12) {
            this.cost = dat.g4;
        } else if (code === 16) {
            this.members = true;
        } else if (code === 23) {
            this.manwear = dat.g2;
            this.manwearOffsetY = dat.g1b;
        } else if (code === 24) {
            this.manwear2 = dat.g2;
        } else if (code === 25) {
            this.womanwear = dat.g2;
            this.womanwearOffsetY = dat.g1b;
        } else if (code === 26) {
            this.womanwear2 = dat.g2;
        } else if (code >= 30 && code < 35) {
            this.ops[code - 30] = dat.gjstr;

            if (this.ops[code - 30] === 'hidden') {
                this.ops[code - 30] = null;
            }
        } else if (code >= 35 && code < 40) {
            this.iops[code - 35] = dat.gjstr;
        } else if (code === 40) {
            const count: number = dat.g1;
            this.recol_s = new Uint16Array(count);
            this.recol_d = new Uint16Array(count);

            for (let i: number = 0; i < count; i++) {
                this.recol_s[i] = dat.g2;
                this.recol_d[i] = dat.g2;
            }
        } else if (code === 78) {
            this.manwear3 = dat.g2;
        } else if (code === 79) {
            this.womanwear3 = dat.g2;
        } else if (code === 90) {
            this.manhead = dat.g2;
        } else if (code === 91) {
            this.womanhead = dat.g2;
        } else if (code === 92) {
            this.manhead2 = dat.g2;
        } else if (code === 93) {
            this.womanhead2 = dat.g2;
        } else if (code === 95) {
            this.zan2d = dat.g2;
        } else if (code === 97) {
            this.certlink = dat.g2;
        } else if (code === 98) {
            this.certtemplate = dat.g2;
        } else if (code >= 100 && code < 110) {
            if (!this.countobj || !this.countco) {
                this.countobj = new Uint16Array(10);
                this.countco = new Uint16Array(10);
            }
            this.countobj[code - 100] = dat.g2;
            this.countco[code - 100] = dat.g2;
        } else {
            throw new Error(`Unrecognized obj config code: ${code}`);
        }
    };

    private toCertificate = (): void => {
        const template: ObjType = ObjType.get(this.certtemplate);
        this.model = template.model;
        this.zoom2d = template.zoom2d;
        this.xan2d = template.xan2d;
        this.yan2d = template.yan2d;
        this.zan2d = template.zan2d;
        this.xof2d = template.xof2d;
        this.yof2d = template.yof2d;
        this.recol_s = template.recol_s;
        this.recol_d = template.recol_d;

        const link: ObjType = ObjType.get(this.certlink);
        this.name = link.name;
        this.members = link.members;
        this.cost = link.cost;

        let article: string = 'a';
        const c: string = (link.name || '').toLowerCase().charAt(0);
        if (c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u') {
            article = 'an';
        }
        this.desc = `Swap this note at any bank for ${article} ${link.name}.`;

        this.stackable = true;
    };

    private reset = (): void => {
        this.model = 0;
        this.name = null;
        this.desc = null;
        this.recol_s = null;
        this.recol_d = null;
        this.zoom2d = 2000;
        this.xan2d = 0;
        this.yan2d = 0;
        this.zan2d = 0;
        this.xof2d = 0;
        this.yof2d = 0;
        this.code9 = false;
        this.code10 = -1;
        this.stackable = false;
        this.cost = 1;
        this.members = false;
        this.ops = [];
        this.iops = [];
        this.manwear = -1;
        this.manwear2 = -1;
        this.manwearOffsetY = 0;
        this.womanwear = -1;
        this.womanwear2 = -1;
        this.womanwearOffsetY = 0;
        this.manwear3 = -1;
        this.womanwear3 = -1;
        this.manhead = -1;
        this.manhead2 = -1;
        this.womanhead = -1;
        this.womanhead2 = -1;
        this.countobj = null;
        this.countco = null;
        this.certlink = -1;
        this.certtemplate = -1;
    };
}
