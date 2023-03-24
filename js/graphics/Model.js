import Draw3D from './Draw3D.js';

import Buffer from '../io/Buffer.js';

class Metadata {
    vertexCount = -1;
    faceCount = -1;
    texturedFaceCount = -1;
    vertexFlagsOffset = -1;
    vertexXOffset = -1;
    vertexYOffset = -1;
    vertexZOffset = -1;
    vertexLabelOffset = -1;
    faceVerticesOffset = -1;
    faceOrientationsOffset = -1;
    faceColorOffset = -1;
    faceInfoOffset = -1;
    facePriorityOffset = -1;
    faceAlphaOffset = -1;
    faceLabelOffset = -1;
    faceTextureAxisOffset = -1;
}

class VertexNormal {
    x = -1;
    y = -1;
    z = -1;
    w = -1;
}

export default class Model {
    static metadata = null;

    static head = null;
    static face1 = null;
    static face2 = null;
    static face3 = null;
    static face4 = null;
    static face5 = null;
    static point1 = null;
    static point2 = null;
    static point3 = null;
    static point4 = null;
    static point5 = null;
    static vertex1 = null;
    static vertex2 = null;
    static axis = null;

    static unpack(archive) {
        try {
            Model.head = new Buffer(archive.read('ob_head.dat'));
            Model.face1 = new Buffer(archive.read('ob_face1.dat'));
            Model.face2 = new Buffer(archive.read('ob_face2.dat'));
            Model.face3 = new Buffer(archive.read('ob_face3.dat'));
            Model.face4 = new Buffer(archive.read('ob_face4.dat'));
            Model.face5 = new Buffer(archive.read('ob_face5.dat'));
            Model.point1 = new Buffer(archive.read('ob_point1.dat'));
            Model.point2 = new Buffer(archive.read('ob_point2.dat'));
            Model.point3 = new Buffer(archive.read('ob_point3.dat'));
            Model.point4 = new Buffer(archive.read('ob_point4.dat'));
            Model.point5 = new Buffer(archive.read('ob_point5.dat'));
            Model.vertex1 = new Buffer(archive.read('ob_vertex1.dat'));
            Model.vertex2 = new Buffer(archive.read('ob_vertex2.dat'));
            Model.axis = new Buffer(archive.read('ob_axis.dat'));

            Model.metadata = [];
            let faceColorOffset = 0;
            let faceInfoOffset = 0;
            let facePriorityOffset = 0;
            let faceAlphaOffset = 0;
            let faceLabelOffset = 0;
            let vertexLabelOffset = 0;
            let faceTextureAxisOffset = 0;

            let count = Model.head.g2();
            for (let i = 0; i < count; i++) {
                let id = Model.head.g2();
                let metadata = Model.metadata[id] = new Metadata();

                metadata.vertexCount = Model.head.g2();
                metadata.faceCount = Model.head.g2();
                metadata.texturedFaceCount = Model.head.g1();
                metadata.vertexFlagsOffset = Model.point1.pos;
                metadata.vertexXOffset = Model.point2.pos;
                metadata.vertexYOffset = Model.point3.pos;
                metadata.vertexZOffset = Model.point4.pos;
                metadata.faceVerticesOffset = Model.vertex1.pos;
                metadata.faceOrientationsOffset = Model.vertex2.pos;

                let hasInfo = Model.head.g1();
                let priority = Model.head.g1();
                let hasAlpha = Model.head.g1();
                let hasFaceLabel = Model.head.g1();
                let hasVertexLabel = Model.head.g1();

                metadata.faceColorOffset = faceColorOffset;
                faceColorOffset += metadata.faceCount * 2;

                if (hasInfo == 1) {
                    metadata.faceInfoOffset = faceInfoOffset;
                    faceInfoOffset += metadata.faceCount;
                }

                if (priority == 255) {
                    metadata.facePriorityOffset = facePriorityOffset;
                    facePriorityOffset += metadata.faceCount;
                } else {
                    metadata.facePriorityOffset = -priority - 1;
                }

                if (hasAlpha == 1) {
                    metadata.faceAlphaOffset = faceAlphaOffset;
                    faceAlphaOffset += metadata.faceCount;
                }

                if (hasFaceLabel == 1) {
                    metadata.faceLabelOffset = faceLabelOffset;
                    faceLabelOffset += metadata.faceCount;
                }

                if (hasVertexLabel == 1) {
                    metadata.vertexLabelOffset = vertexLabelOffset;
                    vertexLabelOffset += metadata.vertexCount;
                }

                for (let j = 0; j < metadata.vertexCount; j++) {
                    let flags = Model.point1.g1();
                    
                    if (flags & 0x1) {
                        Model.point2.gsmarts();
                    }

                    if (flags & 0x2) {
                        Model.point3.gsmarts();
                    }

                    if (flags & 0x4) {
                        Model.point4.gsmarts();
                    }
                }

                for (let j = 0; j < metadata.faceCount; j++) {
                    let type = Model.vertex2.g1();

                    if (type == 1) {
                        Model.vertex1.gsmarts();
                        Model.vertex1.gsmarts();
                    }

                    Model.vertex1.gsmarts();
                }

                metadata.faceTextureAxisOffset = faceTextureAxisOffset;
                faceTextureAxisOffset += metadata.texturedFaceCount;
            }
        } catch (err) {
            console.log('Error loading model index');
            console.error(err);
        }
    }

    vertexCount = null;
    faceCount = null;
    texturedFaceCount = null;
    vertexX = null;
    vertexY = null;
    vertexZ = null;
    faceVertexA = null;
    faceVertexB = null;
    faceVertexC = null;
    texturedVertexA = null;
    texturedVertexB = null;
    texturedVertexC = null;
    vertexLabel = null;
    faceInfo = null;
    facePriority = null;
    priority = 0;
    faceAlpha = null;
    faceLabel = null;
    faceColor = null;

    constructor(id) {
        if (!Model.metadata) {
            return;
        }

        let metadata = Model.metadata[id];
        if (!metadata) {
            console.log(`Error model:${id} not found!`);
            return;
        }

        this.vertexCount = metadata.vertexCount;
        this.faceCount = metadata.faceCount;
        this.texturedFaceCount = metadata.texturedFaceCount;

        this.vertexX = new Int32Array(this.vertexCount);
        this.vertexY = new Int32Array(this.vertexCount);
        this.vertexZ = new Int32Array(this.vertexCount);

        this.faceVertexA = new Int32Array(this.faceCount);
        this.faceVertexB = new Int32Array(this.faceCount);
        this.faceVertexC = new Int32Array(this.faceCount);

        this.texturedVertexA = new Int32Array(this.texturedFaceCount);
        this.texturedVertexB = new Int32Array(this.texturedFaceCount);
        this.texturedVertexC = new Int32Array(this.texturedFaceCount);

        if (metadata.vertexLabelOffset >= 0) {
            this.vertexLabel = new Int32Array(this.vertexCount);
        }

        if (metadata.faceInfoOffset >= 0) {
            this.faceInfo = new Int32Array(this.faceCount);
        }

        if (metadata.facePriorityOffset >= 0) {
            this.facePriority = new Int32Array(this.faceCount);
        } else {
            this.priority = -metadata.facePriorityOffset - 1;
        }

        if (metadata.faceAlphaOffset >= 0) {
            this.faceAlpha = new Int32Array(this.faceCount);
        }

        if (metadata.faceLabelOffset >= 0) {
            this.faceLabel = new Int32Array(this.faceCount);
        }

        this.faceColor = new Int32Array(this.faceCount);

        Model.point1.pos = metadata.vertexFlagsOffset;
        Model.point2.pos = metadata.vertexXOffset;
        Model.point3.pos = metadata.vertexYOffset;
        Model.point4.pos = metadata.vertexZOffset;
        Model.point5.pos = metadata.vertexLabelOffset;

        let x = 0;
        let y = 0;
        let z = 0;

        for (let i = 0; i < this.vertexCount; i++) {
            let flags = Model.point1.g1();

            let dx = 0;
            let dy = 0;
            let dz = 0;

            if (flags & 0x1) {
                dx = Model.point2.gsmarts();
            }

            if (flags & 0x2) {
                dy = Model.point3.gsmarts();
            }

            if (flags & 0x4) {
                dz = Model.point4.gsmarts();
            }

            this.vertexX[i] = x + dx;
            this.vertexY[i] = y + dy;
            this.vertexZ[i] = z + dz;

            x = this.vertexX[i];
            y = this.vertexY[i];
            z = this.vertexZ[i];

            if (this.vertexLabel) {
                this.vertexLabel[i] = Model.point5.g1();
            }
        }

        Model.face1.pos = metadata.faceColorOffset;
        Model.face2.pos = metadata.faceInfoOffset;
        Model.face3.pos = metadata.facePriorityOffset;
        Model.face4.pos = metadata.faceAlphaOffset;
        Model.face5.pos = metadata.faceLabelOffset;

        for (let i = 0; i < this.faceCount; i++) {
            this.faceColor[i] = Model.face1.g2();

            if (this.faceInfo) {
                this.faceInfo[i] = Model.face2.g1();
            }

            if (this.facePriority) {
                this.facePriority[i] = Model.face3.g1();
            }

            if (this.faceAlpha) {
                this.faceAlpha[i] = Model.face4.g1();
            }

            if (this.faceLabel) {
                this.faceLabel[i] = Model.face5.g1();
            }
        }

        Model.vertex1.pos = metadata.faceVerticesOffset;
        Model.vertex2.pos = metadata.faceOrientationsOffset;

        let a = 0;
        let b = 0;
        let c = 0;
        let last = 0;

        for (let i = 0; i < this.faceCount; i++) {
            let orientation = Model.vertex2.g1();

            if (orientation === 1) {
                a = Model.vertex1.gsmarts() + last;
                last = a;
                b = Model.vertex1.gsmarts() + last;
                last = b;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            } else if (orientation === 2) {
                b = c;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            } else if (orientation === 3) {
                a = c;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            } else if (orientation === 4) {
                let temp = a;
                a = b;
                b = temp;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            }

            this.faceVertexA[i] = a;
            this.faceVertexB[i] = b;
            this.faceVertexC[i] = c;
        }

        Model.axis.pos = metadata.faceTextureAxisOffset * 6;
        for (let i = 0; i < this.texturedFaceCount; i++) {
            this.texturedVertexA[i] = Model.axis.g2();
            this.texturedVertexB[i] = Model.axis.g2();
            this.texturedVertexC[i] = Model.axis.g2();
        }
    }

    rotateX(angle) {
        let sin = Model.SINE[angle];
        let cos = Model.COSINE[angle];

        for (let i = 0; i < this.vertexCount; i++) {
            let tmp = ((this.vertexY[i] * cos) - (this.vertexZ[i] * sin)) >>> 16;
            this.vertexZ[i] = ((this.vertexY[i] * sin) + (this.vertexZ[i] * cos)) >>> 16;
            this.vertexY[i] = tmp;
        }
    }

    translate(x, y, z) {
        for (let i = 0; i < this.vertexCount; i++) {
            this.vertexX[i] += x;
            this.vertexY[i] += y;
            this.vertexZ[i] += z;
        }
    }

    scale(x, y, z) {
        for (let i = 0; i < this.vertexCount; i++) {
            this.vertexX[i] = (this.vertexX[i] * x) / 128;
            this.vertexY[i] = (this.vertexY[i] * y) / 128;
            this.vertexZ[i] = (this.vertexZ[i] * z) / 128;
        }
    }

    calculateNormals(baseLightness, intensity, x, y, z, apply) {
        let lightLength = Math.sqrt((x * x) + (y * y) + (z * z));
        let lightIntensity = intensity * lightLength >>> 8;

        if (!this.faceColorA) {
            this.faceColorA = new Uint32Array(this.faceCount);
            this.faceColorB = new Uint32Array(this.faceCount);
            this.faceColorC = new Uint32Array(this.faceCount);
        }

        if (!this.vertexNormal) {
            this.vertexNormal = [];

            for (let i = 0; i < this.vertexCount; i++) {
                this.vertexNormal[i] = new VertexNormal();
            }
        }

        for (let i = 0; i < this.faceCount; i++) {
            let a = this.faceVertexA[i];
            let b = this.faceVertexB[i];
            let c = this.faceVertexC[i];

            let dxAB = this.vertexX[b] - this.vertexX[a];
            let dyAB = this.vertexY[b] - this.vertexY[a];
            let dzAB = this.vertexZ[b] - this.vertexZ[a];

            let dxAC = this.vertexX[c] - this.vertexX[a];
            let dyAC = this.vertexY[c] - this.vertexY[a];
            let dzAC = this.vertexZ[c] - this.vertexZ[a];

            let nx = (dyAB * dzAC) - (dyAC * dzAB);
            let ny = (dzAB * dxAC) - (dzAC * dxAB);
            let nz = (dxAB * dyAC) - (dxAC * dyAB);

            while (nx > 8192 || ny > 8192 || nz > 8192 || nx < -8192 || ny < -8192 || nz < -8192) {
                nx >>= 1;
                ny >>= 1;
                nz >>= 1;
            }

            let length = Math.sqrt((nx * nx) + (ny * ny) + (nz * nz));
            if (length <= 0) {
                length = 1;
            }

            nx = (nx * 256) / length;
            ny = (ny * 256) / length;
            nz = (nz * 256) / length;

            if (!this.faceInfo || (this.faceInfo[i] & 0x1) == 0) {
                let n = this.vertexNormal[a];
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
                let lightness = baseLightness + (x * nx + y * ny + z * nz) / (lightIntensity + lightIntensity / 2);
                // this.faceColorA[i] = mulColorLightness(this.faceColor[local50], local355, this.faceInfo[local50]);
            }
        }

        if (apply) {
            // applyLighting
        } else {
            // ?
        }

        if (apply) {
            // calculateBoundsCylinder
        } else {
            // calculateBoundsAABB
        }
    }

    draw() {
    }
}
