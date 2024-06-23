import Entity from './Entity';
import SpotAnimType from '../../config/SpotAnimType';
import Model from '../../graphics/Model';

export default class SpotAnimEntity extends Entity {
    // constructor
    readonly type: SpotAnimType;
    readonly level: number;
    readonly x: number;
    readonly z: number;
    readonly y: number;
    readonly startCycle: number;

    // runtime
    seqComplete: boolean = false;
    seqFrame: number = 0;
    seqCycle: number = 0;

    constructor(id: number, level: number, x: number, z: number, y: number, cycle: number, delay: number) {
        super();
        this.type = SpotAnimType.instances[id];
        this.level = level;
        this.x = x;
        this.z = z;
        this.y = y;
        this.startCycle = cycle + delay;
    }

    update(delta: number): void {
        if (!this.type.seq || !this.type.seq.delay) {
            return;
        }
        for (this.seqCycle += delta; this.seqCycle > this.type.seq.delay[this.seqFrame]; ) {
            this.seqCycle -= this.type.seq.delay[this.seqFrame] + 1;
            this.seqFrame++;

            if (this.seqFrame >= this.type.seq.frameCount) {
                this.seqFrame = 0;
                this.seqComplete = true;
            }
        }
    }

    draw(): Model {
        const tmp: Model = this.type.getModel();
        const model: Model = Model.modelShareColored(tmp, true, !this.type.disposeAlpha, false);
        if (!this.seqComplete && this.type.seq && this.type.seq.frames) {
            model.createLabelReferences();
            model.applyTransform(this.type.seq.frames[this.seqFrame]);
            model.labelFaces = null;
            model.labelVertices = null;
        }

        if (this.type.resizeh !== 128 || this.type.resizev !== 128) {
            model.scale(this.type.resizeh, this.type.resizev, this.type.resizeh);
        }

        if (this.type.orientation !== 0) {
            if (this.type.orientation === 90) {
                model.rotateY90();
            } else if (this.type.orientation === 180) {
                model.rotateY90();
                model.rotateY90();
            } else if (this.type.orientation === 270) {
                model.rotateY90();
                model.rotateY90();
                model.rotateY90();
            }
        }

        model.calculateNormals(64 + this.type.ambient, 850 + this.type.contrast, -30, -50, -30, true);
        return model;
    }
}
