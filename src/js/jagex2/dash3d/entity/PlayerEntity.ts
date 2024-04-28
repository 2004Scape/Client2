import PathingEntity from './PathingEntity';
import Model from '../../graphics/Model';
import LruCache from '../../datastruct/LruCache';
import SpotAnimType from '../../config/SpotAnimType';
import SeqType from '../../config/SeqType';
import IdkType from '../../config/IdkType';
import ObjType from '../../config/ObjType';
import Packet from '../../io/Packet';
import JString from '../../datastruct/JString';
import {TypedArray1d} from '../../util/Arrays';
import Colors from '../../graphics/Colors';

export default class PlayerEntity extends PathingEntity {
    // prettier-ignore
    static readonly TORSO_RECOLORS: number[] = [
        Colors.BODY_RECOLOR_KHAKI,
        Colors.BODY_RECOLOR_CHARCOAL,
        Colors.BODY_RECOLOR_CRIMSON,
        Colors.BODY_RECOLOR_NAVY,
        Colors.BODY_RECOLOR_STRAW,
        Colors.BODY_RECOLOR_WHITE,
        Colors.BODY_RECOLOR_RED,
        Colors.BODY_RECOLOR_BLUE,
        Colors.BODY_RECOLOR_GREEN,
        Colors.BODY_RECOLOR_YELLOW,
        Colors.BODY_RECOLOR_PURPLE,
        Colors.BODY_RECOLOR_ORANGE,
        Colors.BODY_RECOLOR_ROSE,
        Colors.BODY_RECOLOR_LIME,
        Colors.BODY_RECOLOR_CYAN,
        Colors.BODY_RECOLOR_EMERALD
    ];

    // prettier-ignore
    static readonly DESIGN_IDK_COLORS: number[][] = [
        [ // hair
            Colors.HAIR_DARK_BROWN,
            Colors.HAIR_WHITE,
            Colors.HAIR_LIGHT_GREY,
            Colors.HAIR_DARK_GREY,
            Colors.HAIR_APRICOT,
            Colors.HAIR_STRAW,
            Colors.HAIR_LIGHT_BROWN,
            Colors.HAIR_BROWN,
            Colors.HAIR_TURQUOISE,
            Colors.HAIR_GREEN,
            Colors.HAIR_GINGER,
            Colors.HAIR_MAGENTA
        ],
        [ // torso
            Colors.BODY_KHAKI,
            Colors.BODY_CHARCOAL,
            Colors.BODY_CRIMSON,
            Colors.BODY_NAVY,
            Colors.BODY_STRAW,
            Colors.BODY_WHITE,
            Colors.BODY_RED,
            Colors.BODY_BLUE,
            Colors.BODY_GREEN,
            Colors.BODY_YELLOW,
            Colors.BODY_PURPLE,
            Colors.BODY_ORANGE,
            Colors.BODY_ROSE,
            Colors.BODY_LIME,
            Colors.BODY_CYAN,
            Colors.BODY_EMERALD
        ],
        [ // legs
            Colors.BODY_EMERALD - 1,
            Colors.BODY_KHAKI + 1,
            Colors.BODY_CHARCOAL,
            Colors.BODY_CRIMSON,
            Colors.BODY_NAVY,
            Colors.BODY_STRAW,
            Colors.BODY_WHITE,
            Colors.BODY_RED,
            Colors.BODY_BLUE,
            Colors.BODY_GREEN,
            Colors.BODY_YELLOW,
            Colors.BODY_PURPLE,
            Colors.BODY_ORANGE,
            Colors.BODY_ROSE,
            Colors.BODY_LIME,
            Colors.BODY_CYAN
        ],
        [ // feet
            Colors.FEET_BROWN,
            Colors.FEET_KHAKI,
            Colors.FEET_ASHEN,
            Colors.FEET_DARK,
            Colors.FEET_TERRACOTTA,
            Colors.FEET_GREY
        ],
        [ // skin
            Colors.SKIN_DARKER,
            Colors.SKIN_DARKER_DARKER,
            Colors.SKIN_DARKER_DARKER_DARKER,
            Colors.SKIN_DARKER_DARKER_DARKER_DARKER,
            Colors.SKIN_DARKER_DARKER_DARKER_DARKER_DARKER,
            Colors.SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER,
            Colors.SKIN_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER_DARKER,
            Colors.SKIN
        ]
    ];

    static modelCache: LruCache | null = new LruCache(200);

    name: string | null = null;
    visible: boolean = false;
    gender: number = 0;
    headicons: number = 0;
    appearances: Uint16Array = new Uint16Array(12);
    colors: Uint16Array = new Uint16Array(5);
    combatLevel: number = 0;
    appearanceHashcode: bigint = 0n;
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

    isVisible(): boolean {
        return this.visible;
    }

    read(buf: Packet): void {
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
            if (color < 0 || color >= PlayerEntity.DESIGN_IDK_COLORS[part].length) {
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

        this.appearanceHashcode = 0n;
        for (let part: number = 0; part < 12; part++) {
            this.appearanceHashcode <<= 0x4n;
            if (this.appearances[part] >= 256) {
                this.appearanceHashcode += BigInt(this.appearances[part]) - 256n;
            }
        }
        if (this.appearances[0] >= 256) {
            this.appearanceHashcode += (BigInt(this.appearances[0]) - 256n) >> 4n;
        }
        if (this.appearances[1] >= 256) {
            this.appearanceHashcode += (BigInt(this.appearances[1]) - 256n) >> 8n;
        }
        for (let part: number = 0; part < 5; part++) {
            this.appearanceHashcode <<= 0x3n;
            this.appearanceHashcode += BigInt(this.colors[part]);
        }
        this.appearanceHashcode <<= 0x1n;
        this.appearanceHashcode += BigInt(this.gender);
    }

    getHeadModel(): Model | null {
        if (!this.visible) {
            return null;
        }

        const models: (Model | null)[] = new TypedArray1d(12, null);
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
            tmp.recolor(PlayerEntity.DESIGN_IDK_COLORS[part][0], PlayerEntity.DESIGN_IDK_COLORS[part][this.colors[part]]);
            if (part === 1) {
                tmp.recolor(PlayerEntity.TORSO_RECOLORS[0], PlayerEntity.TORSO_RECOLORS[this.colors[part]]);
            }
        }

        return tmp;
    }

    private getSequencedModel(): Model {
        let hashCode: bigint = this.appearanceHashcode;
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

            if (seq.righthand >= 0) {
                rightHandValue = seq.righthand;
                hashCode += BigInt(rightHandValue - this.appearances[5]) << 8n;
            }

            if (seq.lefthand >= 0) {
                leftHandValue = seq.lefthand;
                hashCode += BigInt(leftHandValue - this.appearances[3]) << 16n;
            }
        } else if (this.secondarySeqId >= 0) {
            const secondFrames: Int16Array | null = SeqType.instances[this.secondarySeqId].frames;
            if (secondFrames) {
                primaryTransformId = secondFrames[this.secondarySeqFrame];
            }
        }

        let model: Model | null = PlayerEntity.modelCache?.get(hashCode) as Model | null;
        if (!model) {
            const models: (Model | null)[] = new TypedArray1d(12, null);
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
                model.recolor(PlayerEntity.DESIGN_IDK_COLORS[part][0], PlayerEntity.DESIGN_IDK_COLORS[part][this.colors[part]]);
                if (part === 1) {
                    model.recolor(PlayerEntity.TORSO_RECOLORS[0], PlayerEntity.TORSO_RECOLORS[this.colors[part]]);
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
            tmp.applyTransforms(primaryTransformId, secondaryTransformId, SeqType.instances[this.primarySeqId].walkmerge);
        } else if (primaryTransformId !== -1) {
            tmp.applyTransform(primaryTransformId);
        }

        tmp.calculateBoundsCylinder();
        tmp.labelFaces = null;
        tmp.labelVertices = null;
        return tmp;
    }
}
