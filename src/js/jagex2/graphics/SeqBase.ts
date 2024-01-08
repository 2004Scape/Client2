import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';

export default class SeqBase {
    static instances: SeqBase[] = [];

    static unpack = (models: Jagfile): void => {
        const head: Packet = new Packet(models.read('base_head.dat'));
        const type: Packet = new Packet(models.read('base_type.dat'));
        const label: Packet = new Packet(models.read('base_label.dat'));

        const total = head.g2;
        head.pos += 2; // const count = head.g2;

        for (let i = 0; i < total; i++) {
            const id = head.g2;
            const length = head.g1;

            const transformTypes = new Uint8Array(length);
            const groupLabels = new Array<Uint8Array>(length);

            for (let j = 0; j < length; j++) {
                transformTypes[j] = type.g1;

                const groupCount = label.g1;
                groupLabels[j] = new Uint8Array(groupCount);

                for (let k = 0; k < groupCount; k++) {
                    groupLabels[j][k] = label.g1;
                }
            }

            this.instances[id] = new SeqBase();
            this.instances[id].length = length;
            this.instances[id].types = transformTypes;
            this.instances[id].labels = groupLabels;
        }
    };

    // ----

    length: number = 0;
    types: Uint8Array | null = null;
    labels: Array<Uint8Array> | null = null;
}
