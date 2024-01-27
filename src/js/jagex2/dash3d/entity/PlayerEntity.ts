import PathingEntity from './PathingEntity';
import Model from '../../graphics/Model';
import LruCache from '../../datastruct/LruCache';
import SpotAnimType from '../../config/SpotAnimType';
import SeqType from '../../config/SeqType';
import IdkType from '../../config/IdkType';
import ObjType from '../../config/ObjType';
import Packet from '../../io/Packet';
import JString from '../../datastruct/JString';

export default class PlayerEntity extends PathingEntity {
    static readonly DESIGN_HAIR_COLOR: number[] = [9104, 10275, 7595, 3610, 7975, 8526, 918, 38802, 24466, 10145, 58654, 5027, 1457, 16565, 34991, 25486];
    static readonly DESIGN_BODY_COLOR: number[][] = [
        [6798, 107, 10283, 16, 4797, 7744, 5799, 4634, 33697, 22433, 2983, 54193],
        [8741, 12, 64030, 43162, 7735, 8404, 1701, 38430, 24094, 10153, 56621, 4783, 1341, 16578, 35003, 25239],
        [25238, 8742, 12, 64030, 43162, 7735, 8404, 1701, 38430, 24094, 10153, 56621, 4783, 1341, 16578, 35003],
        [4626, 11146, 6439, 12, 4758, 10270],
        [4550, 4537, 5681, 5673, 5790, 6806, 8076, 4574]
    ];

    static modelCache: LruCache | null = new LruCache(200);

    name: string | null = null;
    visible: boolean = false;
    gender: number = 0;
    headicons: number = 0;
    appearances: Uint16Array = new Uint16Array(12);
    colors: Uint16Array = new Uint16Array(5);
    combatLevel: number = 0;
    appearanceHashcode: number = 0;
    y: number = 0;
    locStartCycle: number = 0;
    locStopCycle: number = 0;
    locOffsetX: number = 0;
    locOffsetY: number = 0;
    locOffsetZ: number = 0;
    locModel: Model | null = null;
    minTileX: number = 0;
    minTileZ: number = 0;
    maxTileX: number = 0;
    maxTileZ: number = 0;
    lowMemory: boolean = false;

    draw(loopCycle: number): Model | null {
        if (!this.visible) {
            return null;
        }

        let model: Model = this.getSequencedModel();
        this.height = model.maxY;
        model.pickable = true;

        if (this.lowMemory) {
            return model;
        }

        if (this.spotanimId !== -1 && this.spotanimFrame !== -1) {
            const spotanim: SpotAnimType = SpotAnimType.instances[this.spotanimId];
            const model2: Model = Model.modelShareColored(spotanim.getModel(), true, !spotanim.disposeAlpha, false);

            model2.translate(-this.spotanimOffset, 0, 0);
            model2.createLabelReferences();
            if (spotanim.seq && spotanim.seq.frames) {
                model2.applyTransform(spotanim.seq.frames[this.spotanimFrame]);
            }
            model2.labelFaces = null;
            model2.labelVertices = null;
            if (spotanim.resizeh !== 128 || spotanim.resizev !== 128) {
                model2.scale(spotanim.resizeh, spotanim.resizev, spotanim.resizeh);
            }
            model2.calculateNormals(spotanim.ambient + 64, spotanim.contrast + 850, -30, -50, -30, true);

            const models: Model[] = [model, model2];
            model = Model.modelFromModelsBounds(models, 2);
        }

        if (this.locModel) {
            if (loopCycle >= this.locStopCycle) {
                this.locModel = null;
            }

            if (loopCycle >= this.locStartCycle && loopCycle < this.locStopCycle) {
                const loc: Model | null = this.locModel;
                if (loc) {
                    loc.translate(this.locOffsetY - this.y, this.locOffsetX - this.x, this.locOffsetZ - this.z);
                    if (this.dstYaw === 512) {
                        loc.rotateY90();
                        loc.rotateY90();
                        loc.rotateY90();
                    } else if (this.dstYaw === 1024) {
                        loc.rotateY90();
                        loc.rotateY90();
                    } else if (this.dstYaw === 1536) {
                        loc.rotateY90();
                    }

                    const models: Model[] = [model, loc];
                    model = Model.modelFromModelsBounds(models, 2);
                    if (this.dstYaw === 512) {
                        loc.rotateY90();
                    } else if (this.dstYaw === 1024) {
                        loc.rotateY90();
                        loc.rotateY90();
                    } else if (this.dstYaw === 1536) {
                        loc.rotateY90();
                        loc.rotateY90();
                        loc.rotateY90();
                    }
                    loc.translate(this.y - this.locOffsetY, this.x - this.locOffsetX, this.z - this.locOffsetZ);
                }
            }
        }

        model.pickable = true;
        return model;
    }

    isVisible = (): boolean => this.visible;

    read = (buf: Packet): void => {
        buf.pos = 0;

        this.gender = buf.g1;
        this.headicons = buf.g1;

        for (let part: number = 0; part < 12; part++) {
            const msb: number = buf.g1;
            if (msb === 0) {
                this.appearances[part] = 0;
            } else {
                this.appearances[part] = (msb << 8) + buf.g1;
            }
        }

        for (let part: number = 0; part < 5; part++) {
            let color: number = buf.g1;
            if (color < 0 || color >= PlayerEntity.DESIGN_BODY_COLOR[part].length) {
                color = 0;
            }
            this.colors[part] = color;
        }

        this.seqStandId = buf.g2;
        if (this.seqStandId === 65535) {
            this.seqStandId = -1;
        }

        this.seqTurnId = buf.g2;
        if (this.seqTurnId === 65535) {
            this.seqTurnId = -1;
        }

        this.seqWalkId = buf.g2;
        if (this.seqWalkId === 65535) {
            this.seqWalkId = -1;
        }

        this.seqTurnAroundId = buf.g2;
        if (this.seqTurnAroundId === 65535) {
            this.seqTurnAroundId = -1;
        }

        this.seqTurnLeftId = buf.g2;
        if (this.seqTurnLeftId === 65535) {
            this.seqTurnLeftId = -1;
        }

        this.seqTurnRightId = buf.g2;
        if (this.seqTurnRightId === 65535) {
            this.seqTurnRightId = -1;
        }

        this.seqRunId = buf.g2;
        if (this.seqRunId === 65535) {
            this.seqRunId = -1;
        }

        this.name = JString.formatName(JString.fromBase37(buf.g8));
        this.combatLevel = buf.g1;
        this.visible = true;

        this.appearanceHashcode = 0;
        for (let part: number = 0; part < 12; part++) {
            this.appearanceHashcode <<= 0x4;
            if (this.appearances[part] >= 256) {
                this.appearanceHashcode += this.appearances[part] - 256;
            }
        }
        if (this.appearances[0] >= 256) {
            this.appearanceHashcode += (this.appearances[0] - 256) >> 4;
        }
        if (this.appearances[1] >= 256) {
            this.appearanceHashcode += (this.appearances[1] - 256) >> 8;
        }
        for (let part: number = 0; part < 5; part++) {
            this.appearanceHashcode <<= 0x3;
            this.appearanceHashcode += this.colors[part];
        }
        this.appearanceHashcode <<= 0x1;
        this.appearanceHashcode += this.gender;
    };

    getHeadModel = (): Model | null => {
        if (!this.visible) {
            return null;
        }

        const models: Model[] = [];
        let modelCount: number = 0;
        for (let part: number = 0; part < 12; part++) {
            const value: number = this.appearances[part];

            if (value >= 256 && value < 512) {
                models[modelCount++] = IdkType.instances[value - 256].getHeadModel();
            }

            if (value >= 512) {
                const headModel: Model | null = ObjType.get(value - 512).getHeadModel(this.gender);
                if (headModel) {
                    models[modelCount++] = headModel;
                }
            }
        }

        const tmp: Model = Model.modelFromModels(models, modelCount);
        for (let part: number = 0; part < 5; part++) {
            if (this.colors[part] === 0) {
                continue;
            }
            tmp.recolor(PlayerEntity.DESIGN_BODY_COLOR[part][0], PlayerEntity.DESIGN_BODY_COLOR[part][this.colors[part]]);
            if (part === 1) {
                tmp.recolor(PlayerEntity.DESIGN_HAIR_COLOR[0], PlayerEntity.DESIGN_HAIR_COLOR[this.colors[part]]);
            }
        }

        return tmp;
    };

    private getSequencedModel = (): Model => {
        let hashCode: number = this.appearanceHashcode;
        let primaryTransformId: number = -1;
        let secondaryTransformId: number = -1;
        let rightHandValue: number = -1;
        let leftHandValue: number = -1;

        if (this.primarySeqId >= 0 && this.primarySeqDelay === 0) {
            const seq: SeqType = SeqType.instances[this.primarySeqId];

            if (seq.frames) {
                primaryTransformId = seq.frames[this.primarySeqFrame];
            }
            if (this.secondarySeqId >= 0 && this.secondarySeqId !== this.seqStandId) {
                const secondFrames: Int16Array | null = SeqType.instances[this.secondarySeqId].frames;
                if (secondFrames) {
                    secondaryTransformId = secondFrames[this.secondarySeqFrame];
                }
            }

            if (seq.mainhand >= 0) {
                rightHandValue = seq.mainhand;
                hashCode += (rightHandValue - this.appearances[5]) << 8;
            }

            if (seq.offhand >= 0) {
                leftHandValue = seq.offhand;
                hashCode += (leftHandValue - this.appearances[3]) << 16;
            }
        } else if (this.secondarySeqId >= 0) {
            const secondFrames: Int16Array | null = SeqType.instances[this.secondarySeqId].frames;
            if (secondFrames) {
                primaryTransformId = secondFrames[this.secondarySeqFrame];
            }
        }

        let model: Model | null = PlayerEntity.modelCache?.get(hashCode) as Model | null;
        if (!model) {
            const models: Model[] = [];
            let modelCount: number = 0;

            for (let part: number = 0; part < 12; part++) {
                let value: number = this.appearances[part];

                if (leftHandValue >= 0 && part === 3) {
                    value = leftHandValue;
                }

                if (rightHandValue >= 0 && part === 5) {
                    value = rightHandValue;
                }

                if (value >= 256 && value < 512) {
                    const idkModel: Model | null = IdkType.instances[value - 256].getModel();
                    if (idkModel) {
                        models[modelCount++] = idkModel;
                    }
                }

                if (value >= 512) {
                    const obj: ObjType = ObjType.get(value - 512);
                    const wornModel: Model | null = obj.getWornModel(this.gender);
                    if (wornModel) {
                        models[modelCount++] = wornModel;
                    }
                }
            }

            model = Model.modelFromModels(models, modelCount);
            for (let part: number = 0; part < 5; part++) {
                if (this.colors[part] === 0) {
                    continue;
                }
                model.recolor(PlayerEntity.DESIGN_BODY_COLOR[part][0], PlayerEntity.DESIGN_BODY_COLOR[part][this.colors[part]]);
                if (part === 1) {
                    model.recolor(PlayerEntity.DESIGN_HAIR_COLOR[0], PlayerEntity.DESIGN_HAIR_COLOR[this.colors[part]]);
                }
            }

            model.createLabelReferences();
            model.calculateNormals(64, 850, -30, -50, -30, true);
            PlayerEntity.modelCache?.put(hashCode, model);
        }

        if (this.lowMemory) {
            return model;
        }

        const tmp: Model = Model.modelShareAlpha(model, true);
        if (primaryTransformId !== -1 && secondaryTransformId !== -1) {
            tmp.applyTransforms(primaryTransformId, secondaryTransformId, SeqType.instances[this.primarySeqId].labelGroups);
        } else if (primaryTransformId !== -1) {
            tmp.applyTransform(primaryTransformId);
        }

        tmp.calculateBoundsCylinder();
        tmp.labelFaces = null;
        tmp.labelVertices = null;
        return tmp;
    };
}
