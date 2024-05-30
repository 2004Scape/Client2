import Jagfile from '../io/Jagfile';
import AnimBase from './AnimBase';
import Packet from '../io/Packet';

export default class AnimFrame {
    static instances: AnimFrame[] = [];

    static unpack = (models: Jagfile): void => {
        const head: Packet = new Packet(models.read('frame_head.dat'));
        const tran1: Packet = new Packet(models.read('frame_tran1.dat'));
        const tran2: Packet = new Packet(models.read('frame_tran2.dat'));
        const del: Packet = new Packet(models.read('frame_del.dat'));

        const total: number = head.g2;
        head.pos += 2; // const count = head.g2;

        const labels: Int32Array = new Int32Array(500);
        const x: Int32Array = new Int32Array(500);
        const y: Int32Array = new Int32Array(500);
        const z: Int32Array = new Int32Array(500);

        for (let i: number = 0; i < total; i++) {
            const id: number = head.g2;
            const frame: AnimFrame = (this.instances[id] = new AnimFrame());
            frame.delay = del.g1;

            const baseId: number = head.g2;
            const base: AnimBase = AnimBase.instances[baseId];
            frame.base = base;

            const groupCount: number = head.g1;
            let lastGroup: number = -1;
            let current: number = 0;

            for (let j: number = 0; j < groupCount; j++) {
                if (!base.types) {
                    throw new Error('SeqBase not loaded!!!');
                }
                const flags: number = tran1.g1;

                if (flags > 0) {
                    if (base.types[j] !== 0) {
                        for (let group: number = j - 1; group > lastGroup; group--) {
                            if (base.types[group] === 0) {
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

                    let defaultValue: number = 0;
                    if (base.types[labels[current]] === 3) {
                        defaultValue = 128;
                    }

                    if ((flags & 0x1) === 0) {
                        x[current] = defaultValue;
                    } else {
                        x[current] = tran2.gsmart;
                    }

                    if ((flags & 0x2) === 0) {
                        y[current] = defaultValue;
                    } else {
                        y[current] = tran2.gsmart;
                    }

                    if ((flags & 0x4) === 0) {
                        z[current] = defaultValue;
                    } else {
                        z[current] = tran2.gsmart;
                    }

                    lastGroup = j;
                    current++;
                }
            }

            frame.length = current;
            frame.bases = new Int32Array(current);
            frame.x = new Int32Array(current);
            frame.y = new Int32Array(current);
            frame.z = new Int32Array(current);

            for (let j: number = 0; j < current; j++) {
                frame.bases[j] = labels[j];
                frame.x[j] = x[j];
                frame.y[j] = y[j];
                frame.z[j] = z[j];
            }
        }
    };

    // ----

    delay: number = 0;
    base: AnimBase | null = null;
    length: number = 0;
    bases: Int32Array | null = null;
    x: Int32Array | null = null;
    y: Int32Array | null = null;
    z: Int32Array | null = null;
}
