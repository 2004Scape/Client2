import Archive from '../io/Archive';
import Packet from '../io/Packet';

export default class FloType {
    static count: number = 0;
    static instances: FloType[] = [];

    static unpack = (config: Archive): void => {
        const dat = new Packet(config.read('flo.dat'));
        FloType.count = dat.g2;

        for (let i = 0; i < FloType.count; i++) {
            FloType.instances[i] = new FloType();
            FloType.instances[i].decode(dat);
        }
    };

    static get = (id: number): FloType => FloType.instances[id];

    rgb: number = 0;
    texture: number = -1;
    opcode3: boolean = false;
    occludes: boolean = true;
    name: string | null = null;

    decode = (dat: Packet): void => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const opcode = dat.g1;
            if (opcode === 0) {
                break;
            }

            if (opcode === 1) {
                this.rgb = dat.g3;
            } else if (opcode === 2) {
                this.texture = dat.g1;
            } else if (opcode === 3) {
                this.opcode3 = true;
            } else if (opcode === 5) {
                this.occludes = false;
            } else if (opcode === 6) {
                this.name = dat.gjstr;
            } else {
                console.log('Error unrecognised config code: ', opcode);
            }
        }
    };
}
