import Buffer from '../io/Buffer.js';

export default class FloType {
    static count = 0;
    static instances = [];

    static unpack(config) {
        let dat = new Buffer(config.read('flo.dat'));
        FloType.count = dat.g2;

        for (let i = 0; i < FloType.count; i++) {
            FloType.instances[i] = new FloType();
            FloType.instances[i].decode(dat);
        }
    }

    static get(id) {
        return FloType.instances[id];
    }

    rgb = 0;
    texture = -1;
    opcode3 = false;
    occludes = true;
    name = null;

    decode(dat) {
        while (true) {
            let opcode = dat.g1;
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
    }
}
