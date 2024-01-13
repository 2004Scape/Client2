import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import SeqFrame from '../graphics/SeqFrame';

export default class SeqType extends ConfigType {
    static count: number = 0;
    static instances: SeqType[] = [];

    static unpack = (config: Jagfile): void => {
        const dat: Packet = new Packet(config.read('seq.dat'));
        this.count = dat.g2;
        for (let i: number = 0; i < this.count; i++) {
            this.instances[i] = new SeqType();
            this.instances[i].decodeType(i, dat);
        }
    };

    // ----

    frameCount: number = 0;
    frames: Uint16Array | null = null;
    iframes: Uint16Array | null = null;
    delay: Uint16Array | null = null;
    replayoff: number = -1;
    labelGroups: Int32Array | null = null;
    stretches: boolean = false;
    priority: number = 5;
    mainhand: number = -1;
    offhand: number = -1;
    replaycount: number = 99;
    duration: number = 0;

    decode = (_index: number, code: number, dat: Packet): void => {
        if (code === 1) {
            this.frameCount = dat.g1;
            this.frames = new Uint16Array(this.frameCount);
            this.iframes = new Uint16Array(this.frameCount);
            this.delay = new Uint16Array(this.frameCount);

            for (let i: number = 0; i < this.frameCount; i++) {
                this.frames[i] = dat.g2;

                this.iframes[i] = dat.g2;
                if (this.iframes[i] === 65535) {
                    this.iframes[i] = -1;
                }

                this.delay[i] = dat.g2;
                if (this.delay[i] === 0) {
                    this.delay[i] = SeqFrame.instances[this.frames[i]].delay;
                }

                if (this.delay[i] === 0) {
                    this.delay[i] = 1;
                }

                this.duration += this.delay[i];
            }
        } else if (code === 2) {
            this.replayoff = dat.g2;
        } else if (code === 3) {
            const count: number = dat.g1;
            this.labelGroups = new Int32Array(count + 1);

            for (let i: number = 0; i < count; i++) {
                this.labelGroups[i] = dat.g1;
            }

            this.labelGroups[count] = 9999999;
        } else if (code === 4) {
            this.stretches = true;
        } else if (code === 5) {
            this.priority = dat.g1;
        } else if (code === 6) {
            this.mainhand = dat.g2;
        } else if (code === 7) {
            this.offhand = dat.g2;
        } else if (code === 8) {
            this.replaycount = dat.g1;
        } else {
            throw new Error(`Unrecognized seq config code: ${code}`);
        }
    };
}
