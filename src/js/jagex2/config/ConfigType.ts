import Packet from '../io/Packet';

export abstract class ConfigType {
    id: number = -1;
    debugname: string | null = null;

    abstract decode(index: number, code: number, dat: Packet): void;

    decodeType = (index: number, dat: Packet): void => {
        this.id = index;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const opcode: number = dat.g1;
            if (opcode === 0) {
                break;
            }
            this.decode(index, opcode, dat);
        }
    };
}
