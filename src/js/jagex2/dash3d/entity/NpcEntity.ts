import PathingEntity from './PathingEntity';
import NpcType from '../../config/NpcType';
import Model from '../../graphics/Model';
import SpotAnimType from '../../config/SpotAnimType';
import SeqType from '../../config/SeqType';

export default class NpcEntity extends PathingEntity {
    type: NpcType | null = null;

    draw(_loopCycle: number): Model | null {
        if (!this.type) {
            return null;
        }

        if (this.spotanimId === -1 || this.spotanimFrame === -1) {
            return this.getSequencedModel();
        }

        const model: Model | null = this.getSequencedModel();
        if (!model) {
            return null;
        }
        const spotanim: SpotAnimType = SpotAnimType.instances[this.spotanimId];

        const model1: Model = Model.modelShareColored(spotanim.getModel(), true, !spotanim.disposeAlpha, false);
        model1.translate(-this.spotanimOffset, 0, 0);
        model1.createLabelReferences();
        if (spotanim.seq && spotanim.seq.frames) {
            model1.applyTransform(spotanim.seq.frames[this.spotanimFrame]);
        }
        model1.labelFaces = null;
        model1.labelVertices = null;

        if (spotanim.resizeh !== 128 || spotanim.resizev !== 128) {
            model1.scale(spotanim.resizeh, spotanim.resizev, spotanim.resizeh);
        }

        model1.calculateNormals(64 + spotanim.ambient, 850 + spotanim.contrast, -30, -50, -30, true);
        const models: Model[] = [model, model1];

        const tmp: Model = Model.modelFromModelsBounds(models, 2);
        if (this.type.size === 1) {
            tmp.pickable = true;
        }

        return tmp;
    }

    isVisible(): boolean {
        return this.type !== null;
    }

    private getSequencedModel(): Model | null {
        if (!this.type) {
            return null;
        }
        if (this.primarySeqId >= 0 && this.primarySeqDelay === 0) {
            const frames: Int16Array | null = SeqType.instances[this.primarySeqId].frames;
            if (frames) {
                const primaryTransformId: number = frames[this.primarySeqFrame];
                let secondaryTransformId: number = -1;
                if (this.secondarySeqId >= 0 && this.secondarySeqId !== this.seqStandId) {
                    const secondFrames: Int16Array | null = SeqType.instances[this.secondarySeqId].frames;
                    if (secondFrames) {
                        secondaryTransformId = secondFrames[this.secondarySeqFrame];
                    }
                }
                return this.type.getSequencedModel(primaryTransformId, secondaryTransformId, SeqType.instances[this.primarySeqId].walkmerge);
            }
        }

        let transformId: number = -1;
        if (this.secondarySeqId >= 0) {
            const secondFrames: Int16Array | null = SeqType.instances[this.secondarySeqId].frames;
            if (secondFrames) {
                transformId = secondFrames[this.secondarySeqFrame];
            }
        }

        const model: Model | null = this.type.getSequencedModel(transformId, -1, null);
        if (!model) {
            return null;
        }
        this.height = model.maxY;
        return model;
    }
}
