import Jagfile from '../io/Jagfile';
import SeqBase from './SeqBase';
import Packet from '../io/Packet';

export default class SeqFrame {
    static instances: SeqFrame[] = [];

    static unpack = (models: Jagfile): void => {
        const head: Packet = new Packet(models.read('frame_head.dat'));
        const tran1: Packet = new Packet(models.read('frame_tran1.dat'));
        const tran2: Packet = new Packet(models.read('frame_tran2.dat'));
        const del: Packet = new Packet(models.read('frame_del.dat'));

        const total = head.g2;
        head.pos += 2; // const count = head.g2;

        const labels: Uint32Array = new Uint32Array(500);
        const x: Uint32Array = new Uint32Array(500);
        const y: Uint32Array = new Uint32Array(500);
        const z: Uint32Array = new Uint32Array(500);

        for (let i = 0; i < total; i++) {
            const id = head.g2;
            const frame: SeqFrame = (this.instances[id] = new SeqFrame());
            frame.delay = del.g1;

            const baseId = head.g2;
            const base: SeqBase = SeqBase.instances[baseId];
            frame.base = base;

            const groupCount = head.g1;
            let lastGroup = -1;
            let current = 0;

            for (let j = 0; j < groupCount; j++) {
                const flags = tran1.g1;

                if (flags > 0) {
                    if (base.types[j] != 0) {
                        for (let group = j - 1; group > lastGroup; group--) {
                            if (base.types[group] == 0) {
                                labels[current] = group;
                                x[current] = 0;
                                y[current] = 0;
                                z[current] = 0;
                                current++;
                                break;
                            }
                        }
                    }

                    labels[current] = j;

                    let defaultValue = 0;
                    if (base.types[labels[current]] == 3) {
                        defaultValue = 128;
                    }

                    if ((flags & 0x1) == 0) {
                        x[current] = defaultValue;
                    } else {
                        x[current] = tran2.gsmart;
                    }

                    if ((flags & 0x2) == 0) {
                        y[current] = defaultValue;
                    } else {
                        y[current] = tran2.gsmart;
                    }

                    if ((flags & 0x4) == 0) {
                        z[current] = defaultValue;
                    } else {
                        z[current] = tran2.gsmart;
                    }

                    lastGroup = j;
                    current++;
                }
            }

            frame.length = current;
            frame.bases = new Uint32Array(current);
            frame.x = new Uint32Array(current);
            frame.y = new Uint32Array(current);
            frame.z = new Uint32Array(current);

            for (let j = 0; j < current; j++) {
                frame.bases[j] = labels[j];
                frame.x[j] = x[j];
                frame.y[j] = y[j];
                frame.z[j] = z[j];
            }
        }
    };

    // ----

    delay: number = 0;
    base: SeqBase | null = null;
    length: number = 0;
    bases: Uint32Array | null = null;
    x: Uint32Array | null = null;
    y: Uint32Array | null = null;
    z: Uint32Array | null = null;
}
