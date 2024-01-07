import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import {ConfigType} from './ConfigType';

export default class IdkType extends ConfigType {
    static count: number = 0;
    static instances: IdkType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat = new Packet(config.read('idk.dat'));
        this.count = dat.g2;
        for (let i = 0; i < this.count; i++) {
            this.instances[i] = new IdkType(i);
            this.instances[i].decodeType(dat);
        }
    };

    static get = (id: number): IdkType => IdkType.instances[id];

    // ----

    type: number = -1;
    models: Uint16Array | null = null;
    heads: Uint16Array = new Uint16Array(5).fill(-1);
    recol_s: Uint16Array = new Uint16Array(6);
    recol_d: Uint16Array = new Uint16Array(6);
    disable: boolean = false;

    decode = (code: number, dat: Packet): void => {
        if (code === 1) {
            this.type = dat.g1;
        } else if (code === 2) {
            const count = dat.g1;
            this.models = new Uint16Array(count);

            for (let i = 0; i < count; i++) {
                this.models[i] = dat.g2;
            }
        } else if (code === 3) {
            this.disable = true;
        } else if (code >= 40 && code < 50) {
            this.recol_s[code - 40] = dat.g2;
        } else if (code >= 50 && code < 60) {
            this.recol_d[code - 50] = dat.g2;
        } else if (code >= 60 && code < 70) {
            this.heads[code - 60] = dat.g2;
        } else {
            throw new Error(`Unrecognized idk config code: ${code}`);
        }
    };
}
