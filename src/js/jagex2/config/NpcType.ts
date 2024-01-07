import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';

export default class NpcType extends ConfigType {
    static count: number = 0;
    static instances: NpcType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat = new Packet(config.read('npc.dat'));
        this.count = dat.g2;
        for (let i = 0; i < this.count; i++) {
            this.instances[i] = new NpcType(i);
            this.instances[i].decodeType(dat);
        }
    };

    static get = (id: number): NpcType => NpcType.instances[id];

    // ----

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

    decode = (code: number, dat: Packet): void => {
        if (code === 1) {
            const count = dat.g1;
            this.models = new Uint16Array(count);

            for (let i = 0; i < count; i++) {
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
            const count = dat.g1;
            this.recol_s = new Uint16Array(count);
            this.recol_d = new Uint16Array(count);

            for (let i = 0; i < count; i++) {
                this.recol_s[i] = dat.g2;
                this.recol_d[i] = dat.g2;
            }
        } else if (code === 60) {
            const count = dat.g1;
            this.heads = new Uint16Array(count);

            for (let i = 0; i < count; i++) {
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
