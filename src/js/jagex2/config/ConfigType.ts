import Packet from '../io/Packet';

export abstract class ConfigType {
    id: number;
    debugname: string | null = null;

    constructor(id: number) {
        this.id = id;
    }

    abstract decode(code: number, dat: Packet): void;

    decodeType(dat: Packet): this {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const opcode: number = dat.g1;
            if (opcode === 0) {
                break;
            }
            this.decode(opcode, dat);
        }
        return this;
    }
}
