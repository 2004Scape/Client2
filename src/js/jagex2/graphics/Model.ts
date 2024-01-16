import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';

import Draw2D from './Draw2D';
import Draw3D from './Draw3D';
import Hashable from '../datastruct/Hashable';

class Metadata {
    vertexCount: number = 0;
    faceCount: number = 0;
    texturedFaceCount: number = 0;

    vertexFlagsOffset: number = -1;
    vertexXOffset: number = -1;
    vertexYOffset: number = -1;
    vertexZOffset: number = -1;
    vertexLabelsOffset: number = -1;
    faceVerticesOffset: number = -1;
    faceOrientationsOffset: number = -1;
    faceColorsOffset: number = -1;
    faceInfosOffset: number = -1;
    facePrioritiesOffset: number = 0;
    faceAlphasOffset: number = -1;
    faceLabelsOffset: number = -1;
    faceTextureAxisOffset: number = -1;
}

class VertexNormal {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    w: number = 0;
}

export default class Model extends Hashable {
    static metadata: Metadata[] | null = null;

    static head: Packet | null = null;
    static face1: Packet | null = null;
    static face2: Packet | null = null;
    static face3: Packet | null = null;
    static face4: Packet | null = null;
    static face5: Packet | null = null;
    static point1: Packet | null = null;
    static point2: Packet | null = null;
    static point3: Packet | null = null;
    static point4: Packet | null = null;
    static point5: Packet | null = null;
    static vertex1: Packet | null = null;
    static vertex2: Packet | null = null;
    static axis: Packet | null = null;

    static faceClippedX: boolean[] | null = new Array(4096);
    static faceNearClipped: boolean[] | null = new Array(4096);

    static vertexScreenX: Int32Array | null = new Int32Array(4096);
    static vertexScreenY: Int32Array | null = new Int32Array(4096);
    static vertexScreenZ: Int32Array | null = new Int32Array(4096);
    static vertexViewSpaceX: Int32Array | null = new Int32Array(4096);
    static vertexViewSpaceY: Int32Array | null = new Int32Array(4096);
    static vertexViewSpaceZ: Int32Array | null = new Int32Array(4096);

    static tmpDepthFaceCount: Int32Array | null = new Int32Array(1500);
    static tmpDepthFaces: Int32Array[] | null = new Array(1500).fill(null).map((): Int32Array => new Int32Array(512));
    static tmpPriorityFaceCount: Int32Array | null = new Int32Array(12);
    static tmpPriorityFaces: Int32Array[] | null = new Array(12).fill(null).map((): Int32Array => new Int32Array(2000));
    static tmpPriority10FaceDepth: Int32Array | null = new Int32Array(2000);
    static tmpPriority11FaceDepth: Int32Array | null = new Int32Array(2000);
    static tmpPriorityDepthSum: Int32Array | null = new Int32Array(12);

    static clippedX: Int32Array = new Int32Array(10);
    static clippedY: Int32Array = new Int32Array(10);
    static clippedColor: Int32Array = new Int32Array(10);

    static baseX: number = 0;
    static baseY: number = 0;
    static baseZ: number = 0;

    static checkHover: boolean = false;
    static mouseX: number = 0;
    static mouseZ: number = 0;
    static pickedCount: number = 0;
    static pickedBitsets: Int32Array = new Int32Array(1000);

    static unpack(models: Jagfile): void {
        try {
            Model.head = new Packet(models.read('ob_head.dat'));
            Model.face1 = new Packet(models.read('ob_face1.dat'));
            Model.face2 = new Packet(models.read('ob_face2.dat'));
            Model.face3 = new Packet(models.read('ob_face3.dat'));
            Model.face4 = new Packet(models.read('ob_face4.dat'));
            Model.face5 = new Packet(models.read('ob_face5.dat'));
            Model.point1 = new Packet(models.read('ob_point1.dat'));
            Model.point2 = new Packet(models.read('ob_point2.dat'));
            Model.point3 = new Packet(models.read('ob_point3.dat'));
            Model.point4 = new Packet(models.read('ob_point4.dat'));
            Model.point5 = new Packet(models.read('ob_point5.dat'));
            Model.vertex1 = new Packet(models.read('ob_vertex1.dat'));
            Model.vertex2 = new Packet(models.read('ob_vertex2.dat'));
            Model.axis = new Packet(models.read('ob_axis.dat'));

            Model.head.pos = 0;
            Model.point1.pos = 0;
            Model.point2.pos = 0;
            Model.point3.pos = 0;
            Model.point4.pos = 0;
            Model.vertex1.pos = 0;
            Model.vertex2.pos = 0;

            const count: number = Model.head.g2;
            Model.metadata = new Array(count + 100);

            let vertexTextureDataOffset: number = 0;
            let labelDataOffset: number = 0;
            let triangleColorDataOffset: number = 0;
            let triangleInfoDataOffset: number = 0;
            let trianglePriorityDataOffset: number = 0;
            let triangleAlphaDataOffset: number = 0;
            let triangleSkinDataOffset: number = 0;

            for (let i: number = 0; i < count; i++) {
                const id: number = Model.head.g2;
                const meta: Metadata = new Metadata();

                meta.vertexCount = Model.head.g2;
                meta.faceCount = Model.head.g2;
                meta.texturedFaceCount = Model.head.g1;

                meta.vertexFlagsOffset = Model.point1.pos;
                meta.vertexXOffset = Model.point2.pos;
                meta.vertexYOffset = Model.point3.pos;
                meta.vertexZOffset = Model.point4.pos;
                meta.faceVerticesOffset = Model.vertex1.pos;
                meta.faceOrientationsOffset = Model.vertex2.pos;

                const hasInfo: number = Model.head.g1;
                const hasPriorities: number = Model.head.g1;
                const hasAlpha: number = Model.head.g1;
                const hasSkins: number = Model.head.g1;
                const hasLabels: number = Model.head.g1;

                for (let v: number = 0; v < meta.vertexCount; v++) {
                    const flags: number = Model.point1.g1;

                    if ((flags & 0x1) !== 0) {
                        Model.point2.gsmarts;
                    }

                    if ((flags & 0x2) !== 0) {
                        Model.point3.gsmarts;
                    }

                    if ((flags & 0x4) !== 0) {
                        Model.point4.gsmarts;
                    }
                }

                for (let v: number = 0; v < meta.faceCount; v++) {
                    const type: number = Model.vertex2.g1;

                    if (type === 1) {
                        Model.vertex1.gsmarts;
                        Model.vertex1.gsmarts;
                    }

                    Model.vertex1.gsmarts;
                }

                meta.faceColorsOffset = triangleColorDataOffset;
                triangleColorDataOffset += meta.faceCount * 2;

                if (hasInfo === 1) {
                    meta.faceInfosOffset = triangleInfoDataOffset;
                    triangleInfoDataOffset += meta.faceCount;
                }

                if (hasPriorities === 255) {
                    meta.facePrioritiesOffset = trianglePriorityDataOffset;
                    trianglePriorityDataOffset += meta.faceCount;
                } else {
                    meta.facePrioritiesOffset = -hasPriorities - 1;
                }

                if (hasAlpha === 1) {
                    meta.faceAlphasOffset = triangleAlphaDataOffset;
                    triangleAlphaDataOffset += meta.faceCount;
                }

                if (hasSkins === 1) {
                    meta.faceLabelsOffset = triangleSkinDataOffset;
                    triangleSkinDataOffset += meta.faceCount;
                }

                if (hasLabels === 1) {
                    meta.vertexLabelsOffset = labelDataOffset;
                    labelDataOffset += meta.vertexCount;
                }

                meta.faceTextureAxisOffset = vertexTextureDataOffset;
                vertexTextureDataOffset += meta.texturedFaceCount;

                Model.metadata[id] = meta;
            }
        } catch (err) {
            console.log('Error loading model index');
            console.error(err);
        }
    }

    static unload(): void {
        Model.metadata = null;
        Model.head = null;
        Model.face1 = null;
        Model.face2 = null;
        Model.face3 = null;
        Model.face4 = null;
        Model.face5 = null;
        Model.point1 = null;
        Model.point2 = null;
        Model.point3 = null;
        Model.point4 = null;
        Model.point5 = null;
        Model.vertex1 = null;
        Model.vertex2 = null;
        Model.axis = null;
        Model.faceClippedX = null;
        Model.faceNearClipped = null;
        Model.vertexScreenX = null;
        Model.vertexScreenY = null;
        Model.vertexScreenZ = null;
        Model.vertexViewSpaceX = null;
        Model.vertexViewSpaceY = null;
        Model.vertexViewSpaceZ = null;
        Model.tmpDepthFaceCount = null;
        Model.tmpDepthFaces = null;
        Model.tmpPriorityFaceCount = null;
        Model.tmpPriorityFaces = null;
        Model.tmpPriority10FaceDepth = null;
        Model.tmpPriority11FaceDepth = null;
        Model.tmpPriorityDepthSum = null;
    }

    static mulColorLightness(hsl: number, scalar: number, faceInfo: number): number {
        hsl |= 0;
        scalar |= 0;
        faceInfo |= 0;
        if ((faceInfo & 0x2) === 2) {
            if (scalar < 0) {
                scalar = 0;
            } else if (scalar > 127) {
                scalar = 127;
            }

            return 127 - scalar;
        }

        scalar = (scalar * (hsl & 0x7f)) >> 7;

        if (scalar < 2) {
            scalar = 2;
        } else if (scalar > 126) {
            scalar = 126;
        }

        return (hsl & 0xff80) + scalar;
    }

    static modelCopyFaces = (src: Model, copyVertexY: boolean, copyFaces: boolean): Model => {
        const vertexCount: number = src.vertexCount;
        const faceCount: number = src.faceCount;
        const texturedFaceCount: number = src.texturedFaceCount;

        let vertexY: Int32Array;
        if (copyVertexY) {
            vertexY = new Int32Array(vertexCount);
            for (let v: number = 0; v < vertexCount; v++) {
                vertexY[v] = src.vertexY[v];
            }
        } else {
            vertexY = src.vertexY;
        }

        let faceColorA: Int32Array | null;
        let faceColorB: Int32Array | null;
        let faceColorC: Int32Array | null;
        let faceInfo: Int32Array | null;
        let vertexNormal: VertexNormal[] | null = null;
        let vertexNormalOriginal: VertexNormal[] | null = null;
        if (copyFaces) {
            faceColorA = new Int32Array(faceCount);
            faceColorB = new Int32Array(faceCount);
            faceColorC = new Int32Array(faceCount);
            for (let f: number = 0; f < faceCount; f++) {
                if (src.faceColorA) {
                    faceColorA[f] = src.faceColorA[f];
                }
                if (src.faceColorB) {
                    faceColorB[f] = src.faceColorB[f];
                }
                if (src.faceColorC) {
                    faceColorC[f] = src.faceColorC[f];
                }
            }

            faceInfo = new Int32Array(faceCount);
            if (!src.faceInfo) {
                for (let f: number = 0; f < faceCount; f++) {
                    faceInfo[f] = 0;
                }
            } else {
                for (let f: number = 0; f < faceCount; f++) {
                    faceInfo[f] = src.faceInfo[f];
                }
            }

            vertexNormal = []; // = new VertexNormal[this.vertexCount];
            for (let v: number = 0; v < vertexCount; v++) {
                if (!src.vertexNormal) {
                    continue;
                }
                const copy: VertexNormal = (vertexNormal[v] = new VertexNormal());
                const original: VertexNormal = src.vertexNormal[v];
                copy.x = original.x;
                copy.y = original.y;
                copy.z = original.z;
                copy.w = original.w;
            }

            vertexNormalOriginal = src.vertexNormalOriginal;
        } else {
            faceColorA = src.faceColorA;
            faceColorB = src.faceColorB;
            faceColorC = src.faceColorC;
            faceInfo = src.faceInfo;
        }

        return new Model(
            vertexCount,
            src.vertexX,
            vertexY,
            src.vertexZ,
            faceCount,
            src.faceVertexA,
            src.faceVertexB,
            src.faceVertexC,
            faceColorA,
            faceColorB,
            faceColorC,
            faceInfo,
            src.facePriority,
            src.faceAlpha,
            src.faceColor,
            src.priority,
            texturedFaceCount,
            src.texturedVertexA,
            src.texturedVertexB,
            src.texturedVertexC,
            src.minX,
            src.maxX,
            src.minZ,
            src.maxZ,
            src.radius,
            src.minY,
            src.maxY,
            src.maxDepth,
            src.minDepth,
            null,
            null,
            null,
            null,
            vertexNormal,
            vertexNormalOriginal
        );
    };

    static modelShareColored = (src: Model, shareColors: boolean, shareAlpha: boolean, shareVertices: boolean): Model => {
        const vertexCount: number = src.vertexCount;
        const faceCount: number = src.faceCount;
        const texturedFaceCount: number = src.texturedFaceCount;

        let vertexX: Int32Array;
        let vertexY: Int32Array;
        let vertexZ: Int32Array;

        if (shareVertices) {
            vertexX = src.vertexX;
            vertexY = src.vertexY;
            vertexZ = src.vertexZ;
        } else {
            vertexX = new Int32Array(vertexCount);
            vertexY = new Int32Array(vertexCount);
            vertexZ = new Int32Array(vertexCount);

            for (let v: number = 0; v < vertexCount; v++) {
                vertexX[v] = src.vertexX[v];
                vertexY[v] = src.vertexY[v];
                vertexZ[v] = src.vertexZ[v];
            }
        }

        let faceColor: Int32Array | null;
        if (shareColors) {
            faceColor = src.faceColor;
        } else {
            faceColor = new Int32Array(faceCount);
            for (let f: number = 0; f < faceCount; f++) {
                if (src.faceColor) {
                    faceColor[f] = src.faceColor[f];
                }
            }
        }

        let faceAlpha: Int32Array | null;
        if (shareAlpha) {
            faceAlpha = src.faceAlpha;
        } else {
            faceAlpha = new Int32Array(faceCount);
            if (src.faceAlpha === null) {
                for (let f: number = 0; f < faceCount; f++) {
                    faceAlpha[f] = 0;
                }
            } else {
                for (let f: number = 0; f < faceCount; f++) {
                    faceAlpha[f] = src.faceAlpha[f];
                }
            }
        }

        return new Model(
            vertexCount,
            vertexX,
            vertexY,
            vertexZ,
            faceCount,
            src.faceVertexA,
            src.faceVertexB,
            src.faceVertexC,
            null,
            null,
            null,
            src.faceInfo,
            src.facePriority,
            faceAlpha,
            faceColor,
            src.priority,
            texturedFaceCount,
            src.texturedVertexA,
            src.texturedVertexB,
            src.texturedVertexC,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            src.vertexLabel,
            src.faceLabel,
            null,
            null,
            null,
            null
        );
    };

    static modelShareAlpha = (src: Model, shareAlpha: boolean): Model => {
        const vertexCount: number = src.vertexCount;
        const faceCount: number = src.faceCount;
        const texturedFaceCount: number = src.texturedFaceCount;

        const vertexX: Int32Array = new Int32Array(vertexCount);
        const vertexY: Int32Array = new Int32Array(vertexCount);
        const vertexZ: Int32Array = new Int32Array(vertexCount);

        for (let v: number = 0; v < vertexCount; v++) {
            vertexX[v] = src.vertexX[v];
            vertexY[v] = src.vertexY[v];
            vertexZ[v] = src.vertexZ[v];
        }

        let faceAlpha: Int32Array | null;
        if (shareAlpha) {
            faceAlpha = src.faceAlpha;
        } else {
            faceAlpha = new Int32Array(faceCount);
            if (!src.faceAlpha) {
                for (let f: number = 0; f < faceCount; f++) {
                    faceAlpha[f] = 0;
                }
            } else {
                for (let f: number = 0; f < faceCount; f++) {
                    faceAlpha[f] = src.faceAlpha[f];
                }
            }
        }

        return new Model(
            vertexCount,
            vertexX,
            vertexY,
            vertexZ,
            faceCount,
            src.faceVertexA,
            src.faceVertexB,
            src.faceVertexC,
            src.faceColorA,
            src.faceColorB,
            src.faceColorC,
            src.faceInfo,
            src.facePriority,
            faceAlpha,
            src.faceColor,
            src.priority,
            texturedFaceCount,
            src.texturedVertexA,
            src.texturedVertexB,
            src.texturedVertexC,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            null,
            null,
            src.labelVertices,
            src.labelFaces,
            null,
            null
        );
    };

    static modelFromModelsBounds = (models: Model[], count: number): Model => {
        let copyInfo: boolean = false;
        let copyPriority: boolean = false;
        let copyAlpha: boolean = false;
        let copyColor: boolean = false;

        let vertexCount: number = 0;
        let faceCount: number = 0;
        let texturedFaceCount: number = 0;
        let priority: number = -1;

        for (let i: number = 0; i < count; i++) {
            const model: Model = models[i];
            if (model) {
                vertexCount += model.vertexCount;
                faceCount += model.faceCount;
                texturedFaceCount += model.texturedFaceCount;

                copyInfo ||= model.faceInfo !== null;

                if (!model.facePriority) {
                    if (priority === -1) {
                        priority = model.priority;
                    }
                    if (priority !== model.priority) {
                        copyPriority = true;
                    }
                } else {
                    copyPriority = true;
                }

                copyAlpha ||= model.faceAlpha !== null;
                copyColor ||= model.faceColor !== null;
            }
        }

        const vertexX: Int32Array = new Int32Array(vertexCount);
        const vertexY: Int32Array = new Int32Array(vertexCount);
        const vertexZ: Int32Array = new Int32Array(vertexCount);

        const faceVertexA: Int32Array = new Int32Array(faceCount);
        const faceVertexB: Int32Array = new Int32Array(faceCount);
        const faceVertexC: Int32Array = new Int32Array(faceCount);

        const faceColorA: Int32Array = new Int32Array(faceCount);
        const faceColorB: Int32Array = new Int32Array(faceCount);
        const faceColorC: Int32Array = new Int32Array(faceCount);

        const texturedVertexA: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexB: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexC: Int32Array = new Int32Array(texturedFaceCount);

        let faceInfo: Int32Array | null = null;
        if (copyInfo) {
            faceInfo = new Int32Array(faceCount);
        }

        let facePriority: Int32Array | null = null;
        if (copyPriority) {
            facePriority = new Int32Array(faceCount);
        }

        let faceAlpha: Int32Array | null = null;
        if (copyAlpha) {
            faceAlpha = new Int32Array(faceCount);
        }

        let faceColor: Int32Array | null = null;
        if (copyColor) {
            faceColor = new Int32Array(faceCount);
        }

        vertexCount = 0;
        faceCount = 0;
        texturedFaceCount = 0;

        for (let i: number = 0; i < count; i++) {
            const model: Model = models[i];
            if (model) {
                const vertexCount2: number = vertexCount;

                for (let v: number = 0; v < model.vertexCount; v++) {
                    vertexX[vertexCount] = model.vertexX[v];
                    vertexY[vertexCount] = model.vertexY[v];
                    vertexZ[vertexCount] = model.vertexZ[v];
                    vertexCount++;
                }

                for (let f: number = 0; f < model.faceCount; f++) {
                    faceVertexA[faceCount] = model.faceVertexA[f] + vertexCount2;
                    faceVertexB[faceCount] = model.faceVertexB[f] + vertexCount2;
                    faceVertexC[faceCount] = model.faceVertexC[f] + vertexCount2;
                    if (model.faceColorA) {
                        faceColorA[faceCount] = model.faceColorA[f];
                    }
                    if (model.faceColorB) {
                        faceColorB[faceCount] = model.faceColorB[f];
                    }
                    if (model.faceColorC) {
                        faceColorC[faceCount] = model.faceColorC[f];
                    }

                    if (copyInfo) {
                        if (!model.faceInfo) {
                            if (faceInfo) {
                                faceInfo[faceCount] = 0;
                            }
                        } else {
                            if (faceInfo) {
                                faceInfo[faceCount] = model.faceInfo[f];
                            }
                        }
                    }

                    if (copyPriority) {
                        if (model.facePriority === null) {
                            if (facePriority) {
                                facePriority[faceCount] = model.priority;
                            }
                        } else {
                            if (facePriority) {
                                facePriority[faceCount] = model.facePriority[f];
                            }
                        }
                    }

                    if (copyAlpha) {
                        if (model.faceAlpha === null) {
                            if (faceAlpha) {
                                faceAlpha[faceCount] = 0;
                            }
                        } else {
                            if (faceAlpha) {
                                faceAlpha[faceCount] = model.faceAlpha[f];
                            }
                        }
                    }

                    if (copyColor && model.faceColor !== null) {
                        if (faceColor) {
                            faceColor[faceCount] = model.faceColor[f];
                        }
                    }

                    faceCount++;
                }

                for (let f: number = 0; f < model.texturedFaceCount; f++) {
                    texturedVertexA[texturedFaceCount] = model.texturedVertexA[f] + vertexCount2;
                    texturedVertexB[texturedFaceCount] = model.texturedVertexB[f] + vertexCount2;
                    texturedVertexC[texturedFaceCount] = model.texturedVertexC[f] + vertexCount2;
                    texturedFaceCount++;
                }
            }
        }

        const model: Model = new Model(
            vertexCount,
            vertexX,
            vertexY,
            vertexZ,
            faceCount,
            faceVertexA,
            faceVertexB,
            faceVertexC,
            faceColorA,
            faceColorB,
            faceColorC,
            faceInfo,
            facePriority,
            faceAlpha,
            faceColor,
            priority,
            texturedFaceCount,
            texturedVertexA,
            texturedVertexB,
            texturedVertexC,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            null,
            null,
            null,
            null,
            null,
            null
        );

        model.calculateBoundsCylinder();
        return model;
    };

    static modelFromModels = (models: Model[], count: number): Model => {
        let copyInfo: boolean = false;
        let copyPriorities: boolean = false;
        let copyAlpha: boolean = false;
        let copyLabels: boolean = false;

        let vertexCount: number = 0;
        let faceCount: number = 0;
        let texturedFaceCount: number = 0;
        let priority: number = -1;

        for (let i: number = 0; i < count; i++) {
            const model: Model = models[i];
            if (model) {
                vertexCount += model.vertexCount;
                faceCount += model.faceCount;
                texturedFaceCount += model.texturedFaceCount;
                copyInfo ||= model.faceInfo !== null;

                if (!model.facePriority) {
                    if (priority === -1) {
                        priority = model.priority;
                    }

                    if (priority !== model.priority) {
                        copyPriorities = true;
                    }
                } else {
                    copyPriorities = true;
                }

                copyAlpha ||= model.faceAlpha !== null;
                copyLabels ||= model.faceLabel !== null;
            }
        }

        const vertexX: Int32Array = new Int32Array(vertexCount);
        const vertexY: Int32Array = new Int32Array(vertexCount);
        const vertexZ: Int32Array = new Int32Array(vertexCount);

        const vertexLabel: Int32Array = new Int32Array(vertexCount);

        const faceVertexA: Int32Array = new Int32Array(faceCount);
        const faceVertexB: Int32Array = new Int32Array(faceCount);
        const faceVertexC: Int32Array = new Int32Array(faceCount);

        const texturedVertexA: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexB: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexC: Int32Array = new Int32Array(texturedFaceCount);

        let faceInfo: Int32Array | null = null;
        if (copyInfo) {
            faceInfo = new Int32Array(faceCount);
        }

        let facePriority: Int32Array | null = null;
        if (copyPriorities) {
            facePriority = new Int32Array(faceCount);
        }

        let faceAlpha: Int32Array | null = null;
        if (copyAlpha) {
            faceAlpha = new Int32Array(faceCount);
        }

        let faceLabel: Int32Array | null = null;
        if (copyLabels) {
            faceLabel = new Int32Array(faceCount);
        }

        const faceColor: Int32Array = new Int32Array(faceCount);
        vertexCount = 0;
        faceCount = 0;
        texturedFaceCount = 0;

        const addVertex = (src: Model, vertexId: number, vertexX: Int32Array, vertexY: Int32Array, vertexZ: Int32Array, vertexLabel: Int32Array, vertexCount: number): number => {
            let identical: number = -1;

            const x: number = src.vertexX[vertexId];
            const y: number = src.vertexY[vertexId];
            const z: number = src.vertexZ[vertexId];

            for (let v: number = 0; v < vertexCount; v++) {
                if (x === vertexX[v] && y === vertexY[v] && z === vertexZ[v]) {
                    identical = v;
                    break;
                }
            }

            if (identical === -1) {
                vertexX[vertexCount] = x;
                vertexY[vertexCount] = y;
                vertexZ[vertexCount] = z;

                if (vertexLabel && src.vertexLabel) {
                    vertexLabel[vertexCount] = src.vertexLabel[vertexId];
                }

                identical = vertexCount++;
            }

            return identical;
        };

        for (let i: number = 0; i < count; i++) {
            const model: Model = models[i];

            if (model) {
                for (let face: number = 0; face < model.faceCount; face++) {
                    if (copyInfo) {
                        if (!model.faceInfo) {
                            if (faceInfo) {
                                faceInfo[faceCount] = 0;
                            }
                        } else {
                            if (faceInfo) {
                                faceInfo[faceCount] = model.faceInfo[face];
                            }
                        }
                    }

                    if (copyPriorities) {
                        if (!model.facePriority) {
                            if (facePriority) {
                                facePriority[faceCount] = model.priority;
                            }
                        } else {
                            if (facePriority) {
                                facePriority[faceCount] = model.facePriority[face];
                            }
                        }
                    }

                    if (copyAlpha) {
                        if (!model.faceAlpha) {
                            if (faceAlpha) {
                                faceAlpha[faceCount] = 0;
                            }
                        } else {
                            if (faceAlpha) {
                                faceAlpha[faceCount] = model.faceAlpha[face];
                            }
                        }
                    }

                    if (copyLabels && model.faceLabel) {
                        if (faceLabel) {
                            faceLabel[faceCount] = model.faceLabel[face];
                        }
                    }

                    if (model.faceColor) {
                        faceColor[faceCount] = model.faceColor[face];
                    }
                    faceVertexA[faceCount] = addVertex(model, model.faceVertexA[face], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    faceVertexB[faceCount] = addVertex(model, model.faceVertexB[face], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    faceVertexC[faceCount] = addVertex(model, model.faceVertexC[face], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    faceCount++;
                }

                for (let f: number = 0; f < model.texturedFaceCount; f++) {
                    texturedVertexA[texturedFaceCount] = addVertex(model, model.texturedVertexA[f], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    texturedVertexB[texturedFaceCount] = addVertex(model, model.texturedVertexB[f], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    texturedVertexC[texturedFaceCount] = addVertex(model, model.texturedVertexC[f], vertexX, vertexY, vertexZ, vertexLabel, vertexCount);
                    texturedFaceCount++;
                }
            }
        }
        return new Model(
            vertexCount,
            vertexX,
            vertexY,
            vertexZ,
            faceCount,
            faceVertexA,
            faceVertexB,
            faceVertexC,
            null,
            null,
            null,
            faceInfo,
            facePriority,
            faceAlpha,
            faceColor,
            priority,
            texturedFaceCount,
            texturedVertexA,
            texturedVertexB,
            texturedVertexC,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            vertexLabel,
            faceLabel,
            null,
            null,
            null,
            null
        );
    };

    static model = (id: number): Model => {
        if (
            Model.head === null ||
            Model.face1 === null ||
            Model.face2 === null ||
            Model.face3 === null ||
            Model.face4 === null ||
            Model.face5 === null ||
            Model.point1 === null ||
            Model.point2 === null ||
            Model.point3 === null ||
            Model.point4 === null ||
            Model.point5 === null ||
            Model.vertex1 === null ||
            Model.vertex2 === null ||
            Model.axis === null
        ) {
            throw new Error('cant loading model!!!!!');
        }

        if (Model.metadata === null) {
            throw new Error('cant loading model metadata!!!!!');
        }

        const meta: Metadata = Model.metadata[id];
        if (typeof meta === 'undefined') {
            console.log(`Error model:${id} not found!`);
            throw new Error('cant loading model metadata!!!!!');
        }

        const vertexCount: number = meta.vertexCount;
        const faceCount: number = meta.faceCount;
        const texturedFaceCount: number = meta.texturedFaceCount;

        const vertexX: Int32Array = new Int32Array(vertexCount);
        const vertexY: Int32Array = new Int32Array(vertexCount);
        const vertexZ: Int32Array = new Int32Array(vertexCount);

        const faceVertexA: Int32Array = new Int32Array(faceCount);
        const faceVertexB: Int32Array = new Int32Array(faceCount);
        const faceVertexC: Int32Array = new Int32Array(faceCount);

        const texturedVertexA: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexB: Int32Array = new Int32Array(texturedFaceCount);
        const texturedVertexC: Int32Array = new Int32Array(texturedFaceCount);

        let vertexLabel: Int32Array | null = null;
        if (meta.vertexLabelsOffset >= 0) {
            vertexLabel = new Int32Array(vertexCount);
        }

        let faceInfo: Int32Array | null = null;
        if (meta.faceInfosOffset >= 0) {
            faceInfo = new Int32Array(faceCount);
        }

        let facePriority: Int32Array | null = null;
        let priority: number = 0;
        if (meta.facePrioritiesOffset >= 0) {
            facePriority = new Int32Array(faceCount);
        } else {
            priority = -meta.facePrioritiesOffset - 1;
        }

        let faceAlpha: Int32Array | null = null;
        if (meta.faceAlphasOffset >= 0) {
            faceAlpha = new Int32Array(faceCount);
        }

        let faceLabel: Int32Array | null = null;
        if (meta.faceLabelsOffset >= 0) {
            faceLabel = new Int32Array(faceCount);
        }

        const faceColor: Int32Array = new Int32Array(faceCount);

        Model.point1.pos = meta.vertexFlagsOffset;
        Model.point2.pos = meta.vertexXOffset;
        Model.point3.pos = meta.vertexYOffset;
        Model.point4.pos = meta.vertexZOffset;
        Model.point5.pos = meta.vertexLabelsOffset;

        let dx: number = 0;
        let dy: number = 0;
        let dz: number = 0;
        let a: number;
        let b: number;
        let c: number;

        for (let v: number = 0; v < vertexCount; v++) {
            const flags: number = Model.point1.g1;

            a = 0;
            if ((flags & 0x1) !== 0) {
                a = Model.point2.gsmart;
            }

            b = 0;
            if ((flags & 0x2) !== 0) {
                b = Model.point3.gsmart;
            }

            c = 0;
            if ((flags & 0x4) !== 0) {
                c = Model.point4.gsmart;
            }

            vertexX[v] = dx + a;
            vertexY[v] = dy + b;
            vertexZ[v] = dz + c;
            dx = vertexX[v];
            dy = vertexY[v];
            dz = vertexZ[v];

            if (vertexLabel) {
                vertexLabel[v] = Model.point5.g1;
            }
        }

        Model.face1.pos = meta.faceColorsOffset;
        Model.face2.pos = meta.faceInfosOffset;
        Model.face3.pos = meta.facePrioritiesOffset;
        Model.face4.pos = meta.faceAlphasOffset;
        Model.face5.pos = meta.faceLabelsOffset;

        for (let f: number = 0; f < faceCount; f++) {
            faceColor[f] = Model.face1.g2;

            if (faceInfo) {
                faceInfo[f] = Model.face2.g1;
            }

            if (facePriority) {
                facePriority[f] = Model.face3.g1;
            }

            if (faceAlpha) {
                faceAlpha[f] = Model.face4.g1;
            }

            if (faceLabel) {
                faceLabel[f] = Model.face5.g1;
            }
        }

        Model.vertex1.pos = meta.faceVerticesOffset;
        Model.vertex2.pos = meta.faceOrientationsOffset;

        a = 0;
        b = 0;
        c = 0;
        let last: number = 0;

        for (let f: number = 0; f < faceCount; f++) {
            const orientation: number = Model.vertex2.g1;

            if (orientation === 1) {
                a = Model.vertex1.gsmart + last;
                last = a;
                b = Model.vertex1.gsmart + last;
                last = b;
                c = Model.vertex1.gsmart + last;
                last = c;
            } else if (orientation === 2) {
                b = c;
                c = Model.vertex1.gsmart + last;
                last = c;
            } else if (orientation === 3) {
                a = c;
                c = Model.vertex1.gsmart + last;
                last = c;
            } else if (orientation === 4) {
                const tmp: number = a;
                a = b;
                b = tmp;
                c = Model.vertex1.gsmart + last;
                last = c;
            }

            faceVertexA[f] = a;
            faceVertexB[f] = b;
            faceVertexC[f] = c;
        }

        Model.axis.pos = meta.faceTextureAxisOffset * 6;
        for (let f: number = 0; f < texturedFaceCount; f++) {
            texturedVertexA[f] = Model.axis.g2;
            texturedVertexB[f] = Model.axis.g2;
            texturedVertexC[f] = Model.axis.g2;
        }
        return new Model(
            vertexCount,
            vertexX,
            vertexY,
            vertexZ,
            faceCount,
            faceVertexA,
            faceVertexB,
            faceVertexC,
            null,
            null,
            null,
            faceInfo,
            facePriority,
            faceAlpha,
            faceColor,
            priority,
            texturedFaceCount,
            texturedVertexA,
            texturedVertexB,
            texturedVertexC,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            vertexLabel,
            faceLabel,
            null,
            null,
            null,
            null
        );
    };

    // ----

    // constructor
    vertexCount: number;
    vertexX: Int32Array;
    vertexY: Int32Array;
    vertexZ: Int32Array;

    faceCount: number;
    faceVertexA: Int32Array;
    faceVertexB: Int32Array;
    faceVertexC: Int32Array;
    faceColorA: Int32Array | null;
    faceColorB: Int32Array | null;
    faceColorC: Int32Array | null;
    faceInfo: Int32Array | null;
    facePriority: Int32Array | null;
    faceAlpha: Int32Array | null;
    faceColor: Int32Array | null;

    priority: number;

    texturedFaceCount: number;
    texturedVertexA: Int32Array;
    texturedVertexB: Int32Array;
    texturedVertexC: Int32Array;

    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    radius: number;
    minY: number;
    maxY: number;
    maxDepth: number;
    minDepth: number;

    vertexLabel: Int32Array | null;
    faceLabel: Int32Array | null;
    labelVertices: Array<Int32Array> | null;
    labelFaces: Array<Int32Array> | null;

    vertexNormal: VertexNormal[] | null;
    vertexNormalOriginal: VertexNormal[] | null;

    // runtime
    objRaise: number = 0;
    pickable: boolean = false;

    constructor(
        vertexCount: number,
        vertexX: Int32Array,
        vertexY: Int32Array,
        vertexZ: Int32Array,
        faceCount: number,
        faceVertexA: Int32Array,
        faceVertexB: Int32Array,
        faceVertexC: Int32Array,
        faceColorA: Int32Array | null,
        faceColorB: Int32Array | null,
        faceColorC: Int32Array | null,
        faceInfo: Int32Array | null,
        facePriority: Int32Array | null,
        faceAlpha: Int32Array | null,
        faceColor: Int32Array | null,
        priority: number,
        texturedFaceCount: number,
        texturedVertexA: Int32Array,
        texturedVertexB: Int32Array,
        texturedVertexC: Int32Array,
        minX: number,
        maxX: number,
        minZ: number,
        maxZ: number,
        radius: number,
        minY: number,
        maxY: number,
        maxDepth: number,
        minDepth: number,
        vertexLabel: Int32Array | null,
        faceLabel: Int32Array | null,
        labelVertices: Array<Int32Array> | null,
        labelFaces: Array<Int32Array> | null,
        vertexNormal: VertexNormal[] | null,
        vertexNormalOriginal: VertexNormal[] | null
    ) {
        super();
        this.vertexCount = vertexCount;
        this.vertexX = vertexX;
        this.vertexY = vertexY;
        this.vertexZ = vertexZ;
        this.faceCount = faceCount;
        this.faceVertexA = faceVertexA;
        this.faceVertexB = faceVertexB;
        this.faceVertexC = faceVertexC;
        this.faceColorA = faceColorA;
        this.faceColorB = faceColorB;
        this.faceColorC = faceColorC;
        this.faceInfo = faceInfo;
        this.facePriority = facePriority;
        this.faceAlpha = faceAlpha;
        this.faceColor = faceColor;
        this.priority = priority;
        this.texturedFaceCount = texturedFaceCount;
        this.texturedVertexA = texturedVertexA;
        this.texturedVertexB = texturedVertexB;
        this.texturedVertexC = texturedVertexC;
        this.minX = minX;
        this.maxX = maxX;
        this.minZ = minZ;
        this.maxZ = maxZ;
        this.radius = radius;
        this.minY = minY;
        this.maxY = maxY;
        this.maxDepth = maxDepth;
        this.minDepth = minDepth;
        this.vertexLabel = vertexLabel;
        this.faceLabel = faceLabel;
        this.labelVertices = labelVertices;
        this.labelFaces = labelFaces;
        this.vertexNormal = vertexNormal;
        this.vertexNormalOriginal = vertexNormalOriginal;
    }

    calculateBoundsCylinder = (): void => {
        this.maxY = 0;
        this.radius = 0;
        this.minY = 0;

        for (let i: number = 0; i < this.vertexCount; i++) {
            const x: number = this.vertexX[i];
            const y: number = this.vertexY[i];
            const z: number = this.vertexZ[i];

            if (-y > this.maxY) {
                this.maxY = -y;
            }

            if (y > this.minY) {
                this.minY = y;
            }

            const radiusSqr: number = x * x + z * z;
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }

        this.radius = Math.trunc(Math.sqrt(this.radius) + 0.99);
        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99);
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99);
    };

    calculateBoundsY = (): void => {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }

        this.maxY = 0;
        this.minY = 0;

        for (let v: number = 0; v < this.vertexCount; v++) {
            const y: number = this.vertexY[v];

            if (-y > this.maxY) {
                this.maxY = -y;
            }

            if (y > this.minY) {
                this.minY = y;
            }
        }

        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99);
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99);
    };

    calculateBoundsAABB = (): void => {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }

        this.maxY = 0;
        this.radius = 0;
        this.minY = 0;
        this.minX = 999999;
        this.maxX = -999999;
        this.maxZ = -99999;
        this.minZ = 99999;

        for (let v: number = 0; v < this.vertexCount; v++) {
            const x: number = this.vertexX[v];
            const y: number = this.vertexY[v];
            const z: number = this.vertexZ[v];

            if (x < this.minX) {
                this.minX = x;
            }

            if (x > this.maxX) {
                this.maxX = x;
            }

            if (z < this.minZ) {
                this.minZ = z;
            }

            if (z > this.maxZ) {
                this.maxZ = z;
            }

            if (-y > this.maxY) {
                this.maxY = -y;
            }

            if (y > this.minY) {
                this.minY = y;
            }

            const radiusSqr: number = x * x + z * z;
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }

        this.radius = Math.trunc(Math.sqrt(this.radius));
        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY));
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY));
    };

    createLabelReferences = (): void => {
        // TODO
    };

    applyTransforms = (primaryId: number, secondaryId: number, mask: Int32Array | null): void => {
        // TODO
    };

    applyTransform = (id: number): void => {
        // TODO
    };

    rotateY90 = (): void => {
        for (let v: number = 0; v < this.vertexCount; v++) {
            const tmp: number = this.vertexX[v];
            this.vertexX[v] = this.vertexZ[v];
            this.vertexZ[v] = -tmp;
        }
    };

    rotateX = (angle: number): void => {
        const sin: number = Draw3D.sin[angle];
        const cos: number = Draw3D.cos[angle];

        for (let v: number = 0; v < this.vertexCount; v++) {
            const tmp: number = (this.vertexY[v] * cos - this.vertexZ[v] * sin) >> 16;
            this.vertexZ[v] = (this.vertexY[v] * sin + this.vertexZ[v] * cos) >> 16;
            this.vertexY[v] = tmp;
        }
    };

    translate = (y: number, x: number, z: number): void => {
        for (let v: number = 0; v < this.vertexCount; v++) {
            this.vertexX[v] += x;
            this.vertexY[v] += y;
            this.vertexZ[v] += z;
        }
    };

    recolor = (src: number, dst: number): void => {
        if (this.faceColor === null) {
            return;
        }

        for (let f: number = 0; f < this.faceCount; f++) {
            if (this.faceColor[f] === src) {
                this.faceColor[f] = dst;
            }
        }
    };

    rotateY180 = (): void => {
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null) {
            return;
        }

        for (let v: number = 0; v < this.vertexCount; v++) {
            this.vertexZ[v] = -this.vertexZ[v];
        }

        for (let f: number = 0; f < this.faceCount; f++) {
            const temp: number = this.faceVertexA[f];
            this.faceVertexA[f] = this.faceVertexC[f];
            this.faceVertexC[f] = temp;
        }
    };

    scale = (x: number, y: number, z: number): void => {
        for (let v: number = 0; v < this.vertexCount; v++) {
            this.vertexX[v] = (this.vertexX[v] * x) / 128;
            this.vertexY[v] = (this.vertexY[v] * y) / 128;
            this.vertexZ[v] = (this.vertexZ[v] * z) / 128;
        }
    };

    calculateNormals = (lightAmbient: number, lightAttenuation: number, lightSrcX: number, lightSrcY: number, lightSrcZ: number, applyLighting: boolean): void => {
        const lightMagnitude: number = Math.trunc(Math.sqrt(lightSrcX * lightSrcX + lightSrcY * lightSrcY + lightSrcZ * lightSrcZ));
        const attenuation: number = (lightAttenuation * lightMagnitude) >> 8;

        if (this.faceColorA === null || this.faceColorB === null || this.faceColorC === null) {
            this.faceColorA = new Int32Array(this.faceCount);
            this.faceColorB = new Int32Array(this.faceCount);
            this.faceColorC = new Int32Array(this.faceCount);
        }

        if (this.vertexNormal === null) {
            this.vertexNormal = new Array(this.vertexCount);

            for (let v: number = 0; v < this.vertexCount; v++) {
                this.vertexNormal[v] = new VertexNormal();
            }
        }

        for (let f: number = 0; f < this.faceCount; f++) {
            const a: number = this.faceVertexA[f];
            const b: number = this.faceVertexB[f];
            const c: number = this.faceVertexC[f];

            const dxAB: number = this.vertexX[b] - this.vertexX[a];
            const dyAB: number = this.vertexY[b] - this.vertexY[a];
            const dzAB: number = this.vertexZ[b] - this.vertexZ[a];

            const dxAC: number = this.vertexX[c] - this.vertexX[a];
            const dyAC: number = this.vertexY[c] - this.vertexY[a];
            const dzAC: number = this.vertexZ[c] - this.vertexZ[a];

            let nx: number = dyAB * dzAC - dyAC * dzAB;
            let ny: number = dzAB * dxAC - dzAC * dxAB;
            let nz: number = dxAB * dyAC - dxAC * dyAB;

            while (nx > 8192 || ny > 8192 || nz > 8192 || nx < -8192 || ny < -8192 || nz < -8192) {
                nx >>= 1;
                ny >>= 1;
                nz >>= 1;
            }

            let length: number = Math.trunc(Math.sqrt(nx * nx + ny * ny + nz * nz));
            if (length <= 0) {
                length = 1;
            }

            nx = Math.trunc((nx * 256) / length);
            ny = Math.trunc((ny * 256) / length);
            nz = Math.trunc((nz * 256) / length);

            if (this.faceInfo === null || (this.faceInfo[f] & 0x1) === 0) {
                let n: VertexNormal = this.vertexNormal[a];
                n.x += nx;
                n.y += ny;
                n.z += nz;
                n.w++;

                n = this.vertexNormal[b];
                n.x += nx;
                n.y += ny;
                n.z += nz;
                n.w++;

                n = this.vertexNormal[c];
                n.x += nx;
                n.y += ny;
                n.z += nz;
                n.w++;
            } else {
                const lightness: number = Math.trunc(lightAmbient + (lightSrcX * nx + lightSrcY * ny + lightSrcZ * nz) / (attenuation + attenuation / 2));
                if (this.faceColor) {
                    this.faceColorA[f] = Model.mulColorLightness(this.faceColor[f], lightness, this.faceInfo[f]);
                }
            }
        }

        if (applyLighting) {
            this.applyLighting(lightAmbient, lightAttenuation, lightSrcX, lightSrcY, lightSrcZ);
        } else {
            this.vertexNormalOriginal = new Array(this.vertexCount);

            for (let v: number = 0; v < this.vertexCount; v++) {
                const normal: VertexNormal = this.vertexNormal[v];
                const copy: VertexNormal = new VertexNormal();

                copy.x = normal.x;
                copy.y = normal.y;
                copy.z = normal.z;
                copy.w = normal.w;

                this.vertexNormalOriginal[v] = copy;
            }
        }

        if (applyLighting) {
            this.calculateBoundsCylinder();
        } else {
            this.calculateBoundsAABB();
        }
    };

    applyLighting = (lightAmbient: number, lightAttenuation: number, lightSrcX: number, lightSrcY: number, lightSrcZ: number): void => {
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null || this.faceColor === null || this.vertexNormal === null) {
            return;
        }

        if (this.faceColorA === null || this.faceColorB === null || this.faceColorC === null) {
            return;
        }

        for (let f: number = 0; f < this.faceCount; f++) {
            const a: number = this.faceVertexA[f];
            const b: number = this.faceVertexB[f];
            const c: number = this.faceVertexC[f];

            if (this.faceInfo === null) {
                const color: number = this.faceColor[f];

                let n: VertexNormal = this.vertexNormal[a];
                let lightness: number = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorA[f] = Model.mulColorLightness(color, lightness, 0);

                n = this.vertexNormal[b];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorB[f] = Model.mulColorLightness(color, lightness, 0);

                n = this.vertexNormal[c];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorC[f] = Model.mulColorLightness(color, lightness, 0);
            } else if ((this.faceInfo[f] & 0x1) === 0) {
                const color: number = this.faceColor[f];
                const info: number = this.faceInfo[f];

                let n: VertexNormal = this.vertexNormal[a];
                let lightness: number = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorA[f] = Model.mulColorLightness(color, lightness, info);

                n = this.vertexNormal[b];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorB[f] = Model.mulColorLightness(color, lightness, info);

                n = this.vertexNormal[c];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorC[f] = Model.mulColorLightness(color, lightness, info);
            }
        }

        this.vertexNormal = null;
        this.vertexNormalOriginal = null;
        this.vertexLabel = null;
        this.faceLabel = null;

        if (this.faceInfo !== null) {
            for (let f: number = 0; f < this.faceCount; f++) {
                if ((this.faceInfo[f] & 0x2) === 2) {
                    return;
                }
            }
        }

        this.faceColor = null;
    };

    // todo: better name, Java relies on overloads
    drawSimple = (pitch: number, yaw: number, roll: number, eyePitch: number, eyeX: number, eyeY: number, eyeZ: number): void => {
        if (Model.vertexScreenX === null || Model.vertexScreenY === null || Model.vertexScreenZ === null) {
            return;
        }

        if (Model.vertexViewSpaceX === null || Model.vertexViewSpaceY === null || Model.vertexViewSpaceZ === null) {
            return;
        }

        const sinPitch: number = Draw3D.sin[pitch];
        const cosPitch: number = Draw3D.cos[pitch];

        const sinYaw: number = Draw3D.sin[yaw];
        const cosYaw: number = Draw3D.cos[yaw];

        const sinRoll: number = Draw3D.sin[roll];
        const cosRoll: number = Draw3D.cos[roll];

        const sinEyePitch: number = Draw3D.sin[eyePitch];
        const cosEyePitch: number = Draw3D.cos[eyePitch];

        const midZ: number = (eyeY * sinEyePitch + eyeZ * cosEyePitch) >> 16;

        for (let v: number = 0; v < this.vertexCount; v++) {
            let x: number = this.vertexX[v];
            let y: number = this.vertexY[v];
            let z: number = this.vertexZ[v];

            let tmp: number;
            if (roll !== 0) {
                tmp = (y * sinRoll + x * cosRoll) >> 16;
                y = (y * cosRoll - x * sinRoll) >> 16;
                x = tmp;
            }

            if (pitch !== 0) {
                tmp = (y * cosPitch - z * sinPitch) >> 16;
                z = (y * sinPitch + z * cosPitch) >> 16;
                y = tmp;
            }

            if (yaw !== 0) {
                tmp = (z * sinYaw + x * cosYaw) >> 16;
                z = (z * cosYaw - x * sinYaw) >> 16;
                x = tmp;
            }

            x += eyeX;
            y += eyeY;
            z += eyeZ;

            tmp = (y * cosEyePitch - z * sinEyePitch) >> 16;
            z = (y * sinEyePitch + z * cosEyePitch) >> 16;
            y = tmp;

            Model.vertexScreenX[v] = Draw3D.centerX + (x << 9) / z;
            Model.vertexScreenY[v] = Draw3D.centerY + (y << 9) / z;
            Model.vertexScreenZ[v] = z - midZ;

            if (this.texturedFaceCount > 0) {
                Model.vertexViewSpaceX[v] = x;
                Model.vertexViewSpaceY[v] = y;
                Model.vertexViewSpaceZ[v] = z;
            }
        }

        // try {
        this.draw2(false, false, 0);
        // } catch (err) {
        //     console.error(err);
        // }
    };

    // todo: better name, Java relies on overloads
    draw = (yaw: number, sinEyePitch: number, cosEyePitch: number, sinEyeYaw: number, cosEyeYaw: number, relativeX: number, relativeY: number, relativeZ: number, bitset: number): void => {};

    // todo: better name, Java relies on overloads
    draw2 = (clipped: boolean, picking: boolean, bitset: number): void => {
        if (Model.vertexScreenX === null || Model.vertexScreenY === null || Model.vertexScreenZ === null) {
            return;
        }

        if (Model.vertexViewSpaceX === null || Model.vertexViewSpaceY === null || Model.vertexViewSpaceZ === null) {
            return;
        }

        if (Model.faceNearClipped === null || Model.faceClippedX === null) {
            return;
        }

        if (
            Model.tmpDepthFaceCount === null ||
            Model.tmpDepthFaces === null ||
            Model.tmpPriorityFaces === null ||
            Model.tmpPriorityFaceCount === null ||
            Model.tmpPriorityDepthSum === null ||
            Model.tmpPriority10FaceDepth === null ||
            Model.tmpPriority11FaceDepth === null
        ) {
            return;
        }
        for (let depth: number = 0; depth < this.maxDepth; depth++) {
            Model.tmpDepthFaceCount[depth] = 0;
        }

        for (let f: number = 0; f < this.faceCount; f++) {
            if (this.faceInfo && this.faceInfo[f] === -1) {
                continue;
            }

            const a: number = this.faceVertexA[f];
            const b: number = this.faceVertexB[f];
            const c: number = this.faceVertexC[f];

            const xA: number = Model.vertexScreenX[a];
            const xB: number = Model.vertexScreenX[b];
            const xC: number = Model.vertexScreenX[c];

            if (clipped && (xA === -5000 || xB === -5000 || xC === -5000)) {
                Model.faceNearClipped[f] = true;

                const depthAverage: number = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3 + this.minDepth);
                Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
            } else {
                if (picking && this.pointWithinTriangle(Model.mouseX, Model.mouseZ, Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], xA, xB, xC)) {
                    Model.pickedBitsets[Model.pickedCount++] = bitset;
                    picking = false;
                }

                const dxAB: number = xA - xB;
                const dyAB: number = Model.vertexScreenY[a] - Model.vertexScreenY[b];
                const dxCB: number = xC - xB;
                const dyCB: number = Model.vertexScreenY[c] - Model.vertexScreenY[b];

                if (dxAB * dyCB - dyAB * dxCB <= 0) {
                    continue;
                }

                Model.faceNearClipped[f] = false;
                Model.faceClippedX[f] = xA < 0 || xB < 0 || xC < 0 || xA > Draw2D.boundX || xB > Draw2D.boundX || xC > Draw2D.boundX;

                const depthAverage: number = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3 + this.minDepth);
                Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
            }
        }

        if (this.facePriority === null) {
            for (let depth: number = this.maxDepth - 1; depth >= 0; depth--) {
                const count: number = Model.tmpDepthFaceCount[depth];
                if (count <= 0) {
                    continue;
                }

                const faces: Int32Array = Model.tmpDepthFaces[depth];
                for (let f: number = 0; f < count; f++) {
                    this.drawFace(faces[f]);
                }
            }

            return;
        }

        for (let priority: number = 0; priority < 12; priority++) {
            Model.tmpPriorityFaceCount[priority] = 0;
            Model.tmpPriorityDepthSum[priority] = 0;
        }

        for (let depth: number = this.maxDepth - 1; depth >= 0; depth--) {
            const faceCount: number = Model.tmpDepthFaceCount[depth];

            if (faceCount > 0) {
                const faces: Int32Array = Model.tmpDepthFaces[depth];

                for (let i: number = 0; i < faceCount; i++) {
                    const priorityDepth: number = faces[i];
                    const priorityFace: number = this.facePriority[priorityDepth];
                    const priorityFaceCount: number = Model.tmpPriorityFaceCount[priorityFace]++;

                    Model.tmpPriorityFaces[priorityFace][priorityFaceCount] = priorityDepth;

                    if (priorityFace < 10) {
                        Model.tmpPriorityDepthSum[priorityFace] += depth;
                    } else if (priorityFace === 10) {
                        Model.tmpPriority10FaceDepth[priorityFaceCount] = depth;
                    } else {
                        Model.tmpPriority11FaceDepth[priorityFaceCount] = depth;
                    }
                }
            }
        }

        let averagePriorityDepthSum1_2: number = 0;
        if (Model.tmpPriorityFaceCount[1] > 0 || Model.tmpPriorityFaceCount[2] > 0) {
            averagePriorityDepthSum1_2 = Math.trunc((Model.tmpPriorityDepthSum[1] + Model.tmpPriorityDepthSum[2]) / (Model.tmpPriorityFaceCount[1] + Model.tmpPriorityFaceCount[2]));
        }

        let averagePriorityDepthSum3_4: number = 0;
        if (Model.tmpPriorityFaceCount[3] > 0 || Model.tmpPriorityFaceCount[4] > 0) {
            averagePriorityDepthSum3_4 = Math.trunc((Model.tmpPriorityDepthSum[3] + Model.tmpPriorityDepthSum[4]) / (Model.tmpPriorityFaceCount[3] + Model.tmpPriorityFaceCount[4]));
        }

        let averagePriorityDepthSum6_8: number = 0;
        if (Model.tmpPriorityFaceCount[6] > 0 || Model.tmpPriorityFaceCount[8] > 0) {
            averagePriorityDepthSum6_8 = Math.trunc((Model.tmpPriorityDepthSum[6] + Model.tmpPriorityDepthSum[8]) / (Model.tmpPriorityFaceCount[6] + Model.tmpPriorityFaceCount[8]));
        }

        let priorityFace: number = 0;
        let priorityFaceCount: number = Model.tmpPriorityFaceCount[10];

        let priorityFaces: Int32Array = Model.tmpPriorityFaces[10];
        let priorityFaceDepths: Int32Array = Model.tmpPriority10FaceDepth;
        if (priorityFace === priorityFaceCount) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
        }

        let priorityDepth: number;
        if (priorityFace < priorityFaceCount) {
            priorityDepth = priorityFaceDepths[priorityFace];
        } else {
            priorityDepth = -1000;
        }

        for (let priority: number = 0; priority < 10; priority++) {
            while (priority === 0 && priorityDepth > averagePriorityDepthSum1_2) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            while (priority === 3 && priorityDepth > averagePriorityDepthSum3_4) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            while (priority === 5 && priorityDepth > averagePriorityDepthSum6_8) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            const count: number = Model.tmpPriorityFaceCount[priority];
            const faces: Int32Array = Model.tmpPriorityFaces[priority];

            for (let i: number = 0; i < count; i++) {
                this.drawFace(faces[i]);
            }
        }

        while (priorityDepth !== -1000) {
            this.drawFace(priorityFaces[priorityFace++]);

            if (priorityFace === priorityFaceCount && priorityFaces !== Model.tmpPriorityFaces[11]) {
                priorityFace = 0;
                priorityFaces = Model.tmpPriorityFaces[11];
                priorityFaceCount = Model.tmpPriorityFaceCount[11];
                priorityFaceDepths = Model.tmpPriority11FaceDepth;
            }

            if (priorityFace < priorityFaceCount) {
                priorityDepth = priorityFaceDepths[priorityFace];
            } else {
                priorityDepth = -1000;
            }
        }
    };

    drawFace = (face: number): void => {
        if (Model.faceNearClipped !== null && Model.faceNearClipped[face]) {
            this.drawNearClippedFace(face);
            return;
        }

        if (Model.faceClippedX === null) {
            return;
        }

        if (Model.vertexScreenX === null || Model.vertexScreenY === null || Model.vertexScreenZ === null) {
            return;
        }

        if (Model.vertexViewSpaceX === null || Model.vertexViewSpaceY === null || Model.vertexViewSpaceZ === null) {
            return;
        }

        const a: number = this.faceVertexA[face];
        const b: number = this.faceVertexB[face];
        const c: number = this.faceVertexC[face];

        Draw3D.clipX = Model.faceClippedX[face];

        if (this.faceAlpha === null) {
            Draw3D.alpha = 0;
        } else {
            Draw3D.alpha = this.faceAlpha[face];
        }

        let type: number;
        if (this.faceInfo === null) {
            type = 0;
        } else {
            type = this.faceInfo[face] & 0x3;
        }

        if (type === 0 && this.faceColorA !== null && this.faceColorB !== null && this.faceColorC !== null) {
            Draw3D.fillGouraudTriangle(
                Model.vertexScreenX[a],
                Model.vertexScreenX[b],
                Model.vertexScreenX[c],
                Model.vertexScreenY[a],
                Model.vertexScreenY[b],
                Model.vertexScreenY[c],
                this.faceColorA[face],
                this.faceColorB[face],
                this.faceColorC[face]
            );
        } else if (type === 1) {
            // Draw3D.fillTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], palette[this.faceColorA[face]]);
        } else if (type === 2 && this.faceInfo !== null && this.texturedVertexA !== null && this.texturedVertexB !== null && this.texturedVertexC !== null) {
            // const texturedFace = this.faceInfo[face] >> 2;
            // const tA = this.texturedVertexA[texturedFace];
            // const tB = this.texturedVertexB[texturedFace];
            // const tC = this.texturedVertexC[texturedFace];
            // Draw3D.fillTexturedTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColorA[face], this.faceColorB[face], this.faceColorC[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColor[face]);
        } else if (type === 3 && this.faceInfo !== null && this.texturedVertexA !== null && this.texturedVertexB !== null && this.texturedVertexC !== null) {
            // const texturedFace = this.faceInfo[face] >> 2;
            // const tA = this.texturedVertexA[texturedFace];
            // const tB = this.texturedVertexB[texturedFace];
            // const tC = this.texturedVertexC[texturedFace];
            // Draw3D.fillTexturedTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColorA[face], this.faceColorA[face], this.faceColorA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColor[face]);
        }
    };

    drawNearClippedFace = (face: number): void => {};

    pointWithinTriangle = (x: number, y: number, xA: number, xB: number, xC: number, yA: number, yB: number, yC: number): boolean => {
        if (y < yA && y < yB && y < yC) {
            return false;
        } else if (y > yA && y > yB && y > yC) {
            return false;
        } else if (x < xA && x < xB && x < xC) {
            return false;
        } else {
            return x <= xA || x <= xB || x <= xC;
        }
    };
}
