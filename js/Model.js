import Buffer from './Buffer.js';
import Draw3D from './Draw3D.js';

class Metadata {
    vertexCount = -1;
    faceCount = -1;
    texturedFaceCount = -1;
    vertexFlagsOffset = -1;
    vertexXOffset = -1;
    vertexYOffset = -1;
    vertexZOffset = -1;
    vertexLabelsOffset = -1;
    faceVerticesOffset = -1;
    faceOrientationsOffset = -1;
    faceColorsOffset = -1;
    faceInfosOffset = -1;
    facePrioritiesOffset = -1;
    faceAlphasOffset = -1;
    faceLabelsOffset = -1;
    faceTextureAxisOffset = -1;
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
            let faceColorsOffset = 0;
            let faceInfosOffset = 0;
            let facePrioritiesOffset = 0;
            let faceAlphasOffset = 0;
            let faceLabelsOffset = 0;
            let vertexLabelsOffset = 0;
            let faceTextureAxisOffset = 0;

            let count = Model.head.g2();
            for (let i = 0; i < count; i++) {
                let id = Model.head.g2();
                let metadata = new Metadata();
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
                let hasFaceLabels = Model.head.g1();
                let hasVertexLabels = Model.head.g1();

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

                for (let j = 0; j < metadata.vertexCount; j++) {
                    let flags = Model.vertex2.g1();

                    if (flags == 1) {
                        Model.vertex1.gsmart();
                        Model.vertex1.gsmart();
                    }

                    Model.vertex1.gsmart();
                }

                metadata.faceColorsOffset = faceColorsOffset;
                faceColorsOffset += metadata.faceCount * 2;

                if (hasInfo == 1) {
                    metadata.faceInfosOffset = faceInfosOffset;
                    faceInfosOffset += metadata.faceCount;
                }

                if (priority == 255) {
                    metadata.facePrioritiesOffset = facePrioritiesOffset;
                    facePrioritiesOffset += metadata.faceCount;
                } else {
                    metadata.facePrioritiesOffset = -priority - 1;
                }

                if (hasAlpha == 1) {
                    metadata.faceAlphasOffset = faceAlphasOffset;
                    faceAlphasOffset += metadata.faceCount;
                }

                if (hasFaceLabels == 1) {
                    metadata.faceLabelsOffset = faceLabelsOffset;
                    faceLabelsOffset += metadata.faceCount;
                }

                if (hasVertexLabels == 1) {
                    metadata.vertexLabelsOffset = vertexLabelsOffset;
                    vertexLabelsOffset += metadata.vertexCount;
                }

                metadata.faceTextureAxisOffset = faceTextureAxisOffset;
                faceTextureAxisOffset += metadata.texturedFaceCount;

                Model.metadata[id] = metadata;
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
    vertexLabels = null;
    faceInfos = null;
    facePriorities = null;
    priority = 0;
    faceAlphas = null;
    faceLabels = null;
    faceColors = null;

    constructor(id) {
        if (Model.metadata == null) {
            return;
        }

        let metadata = Model.metadata[id];
        if (!metadata) {
            console.log(`Error model:${id} not found`);
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

        if (metadata.vertexLabelsOffset != -1) {
            this.vertexLabels = new Int32Array(this.vertexCount);
        }

        if (metadata.faceInfosOffset != -1) {
            this.faceInfos = new Int32Array(this.faceCount);
        }

        if (metadata.facePrioritiesOffset != -1) {
            this.facePriorities = new Int32Array(this.faceCount);
        } else {
            this.priority = -metadata.facePrioritiesOffset - 1;
        }

        if (metadata.faceAlphasOffset != -1) {
            this.faceAlphas = new Int32Array(this.faceCount);
        }

        if (metadata.faceLabelsOffset != -1) {
            this.faceLabels = new Int32Array(this.faceCount);
        }

        this.faceColors = new Int32Array(this.faceCount);

        Model.point1.pos = metadata.vertexFlagsOffset;
        Model.point2.pos = metadata.vertexXOffset;
        Model.point3.pos = metadata.vertexYOffset;
        Model.point4.pos = metadata.vertexZOffset;
        Model.point5.pos = metadata.vertexLabelsOffset;

        let x = 0;
        let y = 0;
        let z = 0;

        for (let i = 0; i < metadata.vertexCount; i++) {
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

            if (metadata.vertexLabelsOffset != -1) {
                this.vertexLabels[i] = Model.point5.g1();
            }
        }

        Model.face1.pos = metadata.faceColorsOffset;
        Model.face2.pos = metadata.faceInfosOffset;
        Model.face3.pos = metadata.facePrioritiesOffset;
        Model.face4.pos = metadata.faceAlphasOffset;
        Model.face5.pos = metadata.faceLabelsOffset;

        for (let i = 0; i < metadata.faceCount; i++) {
            this.faceColors[i] = Model.face1.g2();

            if (metadata.faceInfosOffset != -1) {
                this.faceInfos[i] = Model.face2.g1();
            }

            if (metadata.facePrioritiesOffset != -1) {
                this.facePriorities[i] = Model.face3.g1();
            }

            if (metadata.faceAlphasOffset != -1) {
                this.faceAlphas[i] = Model.face4.g1();
            }

            if (metadata.faceLabelsOffset != -1) {
                this.faceLabels[i] = Model.face5.g1();
            }
        }

        Model.vertex1.pos = metadata.faceVerticesOffset;
        Model.vertex2.pos = metadata.faceOrientationsOffset;

        let a = 0;
        let b = 0;
        let c = 0;
        let last = 0;

        for (let i = 0; i < metadata.faceCount; i++) {
            let orientation = Model.vertex2.g1();

            if (orientation == 1) {
                // new a, b, c
                a = Model.vertex1.gsmart() + last;
                last = a;
                b = Model.vertex1.gsmart() + last;
                last = b;
                c = Model.vertex1.gsmart() + last;
                last = c;
                this.faceVertexA[i] = a;
                this.faceVertexB[i] = b;
                this.faceVertexC[i] = c;
            } else if (orientation == 2) {
                // reuse a, c, new b
                b = c;
                c = Model.vertex1.gsmart() + last;
                last = c;
                this.faceVertexA[i] = a;
                this.faceVertexB[i] = b;
                this.faceVertexC[i] = c;
            } else if (orientation == 3) {
                // reuse b, c, new a
                a = c;
                c = Model.vertex1.gsmart() + last;
                last = c;
                this.faceVertexA[i] = a;
                this.faceVertexB[i] = b;
                this.faceVertexC[i] = c;
            } else if (orientation == 4) {
                // reuse a, b, new c
                let temp = a;
                a = b;
                b = temp;
                c = Model.vertex1.gsmart() + last;
                last = c;
                this.faceVertexA[i] = a;
                this.faceVertexB[i] = b;
                this.faceVertexC[i] = c;
            }
        }

        Model.axis.pos = metadata.faceTextureAxisOffset * 6;
        for (let i = 0; i < metadata.texturedFaceCount; i++) {
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
}
