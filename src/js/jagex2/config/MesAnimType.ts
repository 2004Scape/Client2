import {ConfigType} from './ConfigType';

import Packet from '../io/Packet';

// server-sided chat (message) animations
export default class MesAnimType extends ConfigType {
    static count: number = 0;
    static instances: MesAnimType[] = [];

    static unpack = (dat: Packet): void => {
        this.count = dat.g2;
        for (let i: number = 0; i < this.count; i++) {
            this.instances[i] = new MesAnimType(i).decodeType(dat);
        }
    };

    // ----

    len: Int32Array = new Int32Array(4).fill(-1);

    decode(code: number, dat: Packet): void {
        if (code >= 1 && code < 5) {
            this.len[code - 1] = dat.g2;
        } else if (code === 250) {
            this.debugname = dat.gjstr;
        } else {
            throw new Error(`Unrecognized mesanim config code: ${code}`);
        }
    }
}
