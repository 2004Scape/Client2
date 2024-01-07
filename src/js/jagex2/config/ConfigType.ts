import Packet from '../io/Packet';

export abstract class ConfigType {
    readonly index: number;

    constructor(index: number) {
        this.index = index;
    }

    abstract decode(code: number, dat: Packet): void;

    decodeType = (dat: Packet): void => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const opcode: number = dat.g1;
            if (opcode === 0) {
                break;
            }
            this.decode(opcode, dat);
        }
    };
}
