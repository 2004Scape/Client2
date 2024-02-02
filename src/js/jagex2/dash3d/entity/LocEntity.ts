import Linkable from '../../datastruct/Linkable';
import SeqType from '../../config/SeqType';

export default class LocEntity extends Linkable {
    // constructor
    heightmapSW: number;
    readonly heightmapSE: number;
    readonly heightmapNE: number;
    readonly heightmapNW: number;
    readonly index: number;
    readonly seq: SeqType;
    seqFrame: number;
    seqCycle: number;

    constructor(index: number, heightmapSW: number, heightmapSE: number, heightmapNE: number, heightmapNW: number, seq: SeqType, randomFrame: boolean) {
        super();
        this.heightmapSW = heightmapSW;
        this.heightmapSE = heightmapSE;
        this.heightmapNE = heightmapNE;
        this.heightmapNW = heightmapNW;
        this.index = index;
        this.seq = seq;

        if (randomFrame && seq.replayoff !== -1 && this.seq.delay) {
            this.seqFrame = (Math.random() * this.seq.frameCount) | 0;
            this.seqCycle = (Math.random() * this.seq.delay[this.seqFrame]) | 0;
        } else {
            this.seqFrame = -1;
            this.seqCycle = 0;
        }
    }
}
