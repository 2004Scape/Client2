import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import SeqType from './SeqType';

export default class SpotAnimType extends ConfigType {
    static count: number = 0;
    static instances: SpotAnimType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat = new Packet(config.read('spotanim.dat'));
        this.count = dat.g2;
        for (let i = 0; i < this.count; i++) {
            this.instances[i] = new SpotAnimType();
            this.instances[i].decodeType(i, dat);
        }
    };

    static get = (id: number): SpotAnimType => SpotAnimType.instances[id];

    // ----

    model: number = 0;
    anim: number = -1;
    seq: SeqType | null = null;
    disposeAlpha: boolean = false;
    recol_s: Uint16Array = new Uint16Array(6);
    recol_d: Uint16Array = new Uint16Array(6);
    resizeh: number = 128;
    resizev: number = 128;
    orientation: number = 0;
    ambient: number = 0;
    contrast: number = 0;

    decode = (_index: number, code: number, dat: Packet): void => {
        if (code == 1) {
            this.model = dat.g2;
        } else if (code == 2) {
            this.anim = dat.g2;

            if (SeqType.instances != null) {
                this.seq = SeqType.instances[this.anim];
            }
        } else if (code == 3) {
            this.disposeAlpha = true;
        } else if (code == 4) {
            this.resizeh = dat.g2;
        } else if (code == 5) {
            this.resizev = dat.g2;
        } else if (code == 6) {
            this.orientation = dat.g2;
        } else if (code == 7) {
            this.ambient = dat.g1;
        } else if (code == 8) {
            this.contrast = dat.g1;
        } else if (code >= 40 && code < 50) {
            this.recol_s[code - 40] = dat.g2;
        } else if (code >= 50 && code < 60) {
            this.recol_d[code - 50] = dat.g2;
        } else {
            throw new Error(`Unrecognized spotanim config code: ${code}`);
        }
    };
}
