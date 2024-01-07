import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';

export default class VarpType extends ConfigType {
    static count: number = 0;
    static instances: VarpType[] = [];
    static code3: number[] = [];
    static code3Count: number = 0;

    static unpack = (config: Jagfile): void => {
        const dat = new Packet(config.read('varp.dat'));
        this.count = dat.g2;
        for (let i = 0; i < this.count; i++) {
            this.instances[i] = new VarpType(i);
            this.instances[i].decodeType(dat);
        }
    };

    static get = (id: number): VarpType => VarpType.instances[id];

    // ----

    code10: string | null = null;
    code1: number = 0;
    code2: number = 0;
    hasCode3: boolean = false;
    code4: boolean = true;
    clientcode: number = 0;
    code7: number = 0;
    code6: boolean = false;
    code8: boolean = false;

    decode(code: number, dat: Packet): void {
        if (code == 1) {
            this.code1 = dat.g1;
        } else if (code == 2) {
            this.code2 = dat.g1;
        } else if (code == 3) {
            this.hasCode3 = true;
            VarpType.code3[VarpType.code3Count++] = this.index;
        } else if (code == 4) {
            this.code4 = false;
        } else if (code == 5) {
            this.clientcode = dat.g2;
        } else if (code == 6) {
            this.code6 = true;
        } else if (code == 7) {
            this.code7 = dat.g4;
        } else if (code == 8) {
            this.code8 = true;
        } else if (code == 10) {
            this.code10 = dat.gjstr;
        } else {
            throw new Error(`Error unrecognised config code: ${code}`);
        }
    }
}
