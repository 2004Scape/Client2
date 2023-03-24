import Draw3D from './Draw3D.js';

import Buffer from '../io/Buffer.js';
import Draw2D from './Draw2D.js';

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

    static vertexScreenX = new Int32Array(4096);
    static vertexScreenY = new Int32Array(4096);
    static vertexScreenZ = new Int32Array(4096);
    static vertexViewSpaceX = new Int32Array(4096);
    static vertexViewSpaceY = new Int32Array(4096);
    static vertexViewSpaceZ = new Int32Array(4096);

    static faceClippedX = []; // [4096]
    static faceNearClipped = []; // [4096]
    static tmpDepthFaceCount = new Int32Array(1500);
    static tmpDepthFaces = []; // [1500][512]
    static tmpPriorityFaceCount = new Int32Array(12);
    static tmpPriorityFaces = []; // [12][2000]
    static tmpPriority10FaceDepth = new Int32Array(2000);
    static tmpPriority11FaceDepth = new Int32Array(2000);
    static tmpPriorityDepthSum = new Int32Array(12);

    static pickedBitsets = new Int32Array(1000);
    static pickedCount = 0;
    static mouseX = 0;
    static mouseY = 0;

    static {
        for (let i = 0; i < 1500; i++) {
            Model.tmpDepthFaces[i] = new Int32Array(512);
        }

        for (let i = 0; i < 12; i++) {
            Model.tmpPriorityFaces[i] = new Int32Array(2000);
        }
    }

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

    static mulColorLightness(hsl, scalar, faceInfo) {
        if ((faceInfo & 2) == 2) {
            if (scalar < 0) {
                scalar = 0;
            } else if (scalar > 127) {
                scalar = 127;
            }

            scalar = 127 - scalar;
            return scalar;
        } else {
            scalar = (scalar * (hsl & 0x7f)) >> 7;
            if (scalar < 2) {
                scalar = 2;
            } else if (scalar > 126) {
                scalar = 126;
            }

            return (hsl & 0xff80) + scalar;
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

    faceColorA = null;
    faceColorB = null;
    faceColorC = null;
    vertexNormal = null;

    radius = 0;
    minDepth = 0;
    maxDepth = 0;
    minX = 0;
    maxX = 0;
    minY = 0;
    maxY = 0;
    minZ = 0;
    maxZ = 0;

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
            let tmp = ((this.vertexY[i] * cos) - (this.vertexZ[i] * sin)) >> 16;
            this.vertexZ[i] = ((this.vertexY[i] * sin) + (this.vertexZ[i] * cos)) >> 16;
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

    calculateNormals(lightAmbient, lightAttenuation, x, y, z, applyLighting) {
        let lightMagnitude = Math.sqrt((x * x) + (y * y) + (z * z));
        let attenuation = lightAttenuation * lightMagnitude >> 8;

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
                let lightness = lightAmbient + (x * nx + y * ny + z * nz) / (attenuation + attenuation / 2);
                this.faceColorA[i] = Model.mulColorLightness(this.faceColor[i], lightness, this.faceInfo[i]);
            }
        }

        if (applyLighting) {
            this.applyLighting(lightAmbient, attenuation, x, y, z);
        } else {
            this.vertexNormalOriginal = [];
            for (let i = 0; i < this.vertexCount; i++) {
                let n = this.vertexNormal[i];
                let copy = this.vertexNormalOriginal[i] = new VertexNormal();
                copy.x = n.x;
                copy.y = n.y;
                copy.z = n.z;
                copy.w = n.w;
            }
        }

        if (applyLighting) {
            this.calculateBoundsCylinder();
        } else {
            this.calculateBoundsAABB();
        }
    }

    applyLighting(lightAmbient, lightAttenuation, lightSrcX, lightSrcY, lightSrcZ) {
        for (let f = 0; f < this.faceCount; f++) {
            let a = this.faceVertexA[f];
            let b = this.faceVertexB[f];
            let c = this.faceVertexC[f];

            if (!this.faceInfo) {
                let color = this.faceColor[f];

                let n = this.vertexNormal[a];
                let lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorA[f] = Model.mulColorLightness(color, lightness, 0);

                n = this.vertexNormal[b];
                lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorB[f] = Model.mulColorLightness(color, lightness, 0);

                n = this.vertexNormal[c];
                lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorC[f] = Model.mulColorLightness(color, lightness, 0);
            } else if ((this.faceInfo[f] & 1) == 0) {
                let color = this.faceColor[f];
                let info = this.faceInfo[f];

                let n = this.vertexNormal[a];
                let lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorA[f] = Model.mulColorLightness(color, lightness, info);

                n = this.vertexNormal[b];
                lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorB[f] = Model.mulColorLightness(color, lightness, info);

                n = this.vertexNormal[c];
                lightness = lightAmbient + (((lightSrcX * n.x) + (lightSrcY * n.y) + (lightSrcZ * n.z)) / (lightAttenuation * n.w));
                this.faceColorC[f] = Model.mulColorLightness(color, lightness, info);
            }
        }

        this.vertexNormal = null;
        this.vertexNormalOriginal = null;
        this.vertexLabel = null;
        this.faceLabel = null;

        if (this.faceInfo) {
            for (let f = 0; f < this.faceCount; f++) {
                if ((this.faceInfo[f] & 2) == 2) {
                    return;
                }
            }
        }

        this.faceColor = null;
    }

    calculateBoundsCylinder() {
        this.radius = 0;
        this.minY = 0;
        this.maxY = 0;

        for (let i = 0; i < this.vertexCount; i++) {
            let x = this.vertexX[i];
            let y = this.vertexY[i];
            let z = this.vertexZ[i];

            if (-y > this.minY) {
                this.minY = -y;
            }

            if (y > this.maxY) {
                this.maxY = y;
            }

            let radiusSqr = Math.trunc((x * x) + (z * z));
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }

        this.radius = Math.trunc(Math.sqrt(this.radius) + 0.99);
        this.minDepth = Math.trunc(Math.sqrt((this.radius * this.radius) + (this.minY * this.minY)) + 0.99);
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt((this.radius * this.radius) + (this.maxY * this.maxY)) + 0.99);
    }

    calculateBoundsAABB() {
        this.radius = 0;
        this.minY = 0;
        this.maxY = 0;
        this.minX = 999999;
        this.maxX = -999999;
        this.maxZ = -999999;
        this.minZ = 999999;

        for (let i = 0; i < this.vertexCount; i++) {
            let x = this.vertexX[i];
            let y = this.vertexY[i];
            let z = this.vertexZ[i];

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

            if (-y > this.minY) {
                this.minY = -y;
            }

            if (y > this.maxY) {
                this.maxY = y;
            }

            let radiusSqr = Math.trunc((x * x) + (z * z));
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }

        this.radius = Math.trunc(Math.sqrt(this.radius));
        this.minDepth = Math.trunc(Math.sqrt((this.radius * this.radius) + (this.minY * this.minY)));
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt((this.radius * this.radius) + (this.maxY * this.maxY)));
    }

    draw(pitch, yaw, roll, eyePitch, eyeX, eyeY, eyeZ) {
        let sinPitch = Draw3D.sin[pitch];
        let cosPitch = Draw3D.cos[pitch];

        let sinYaw = Draw3D.sin[yaw];
        let cosYaw = Draw3D.cos[yaw];

        let sinRoll = Draw3D.sin[roll];
        let cosRoll = Draw3D.cos[roll];

        let sinEyePitch = Draw3D.sin[eyePitch];
        let cosEyePitch = Draw3D.cos[eyePitch];

        let midZ = ((eyeY * sinEyePitch) + (eyeZ * cosEyePitch)) >> 16;

        for (let i = 0; i < this.vertexCount; i++) {
            let x = this.vertexX[i];
            let y = this.vertexY[i];
            let z = this.vertexZ[i];

            if (roll) {
                let x_ = ((y * sinRoll) + (x * cosRoll)) >> 16;
                y = ((y * cosRoll) - (x * sinRoll)) >> 16;
                x = x_;
            }

            if (pitch) {
                let y_ = ((y * cosPitch) - (z * sinPitch)) >> 16;
                z = ((y * sinPitch) + (z * cosPitch)) >> 16;
                y = y_;
            }

            if (yaw) {
                let x_ = ((z * sinYaw) + (x * cosYaw)) >> 16;
                z = ((z * cosYaw) - (x * sinYaw)) >> 16;
                x = x_;
            }

            x += eyeX;
            y += eyeY;
            z += eyeZ;

            let y_ = ((y * cosEyePitch) - (z * sinEyePitch)) >> 16;
            z = ((y * sinEyePitch) + (z * cosEyePitch)) >> 16;
            y = y_;

            Model.vertexScreenX[i] = Draw3D.centerX + ((x << 9) / z);
            Model.vertexScreenY[i] = Draw3D.centerY + ((y << 9) / z);
            Model.vertexScreenZ[i] = z - midZ;

            if (this.texturedFaceCount > 0) {
                Model.vertexViewSpaceX[i] = x;
                Model.vertexViewSpaceY[i] = y;
                Model.vertexViewSpaceZ[i] = z;
            }
        }

        this.draw2(false, false, 0);
    }

    draw2(clipped, picking, bitset) {
        for (let i = 0; i < this.maxDepth; i++) {
            Model.tmpDepthFaceCount[i] = 0;
        }

        for (let i = 0; i < this.faceCount; i++) {
            if (this.faceInfo && this.faceInfo[i] == -1) {
                continue;
            }

            let a = this.faceVertexA[i];
            let b = this.faceVertexB[i];
            let c = this.faceVertexC[i];

            let xA = Model.vertexScreenX[a];
            let xB = Model.vertexScreenX[b];
            let xC = Model.vertexScreenX[c];

            if (clipped && (xA === -5000 || xB === -5000 || xC === -5000)) {
                Model.faceNearClipped[i] = true;
                let depthAverage = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3) + this.minDepth;
                Model.tmpDepthFaces[i][Model.tmpDepthFaceCount[depthAverage]++] = i;
            } else {
                if (picking && this.pointWithinTriangle(0, 0, Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], xA, xB, xC)) {
                    Model.pickedBitsets[Model.pickedCount++] = bitset;
                    picking = false;
                }

                let dxAB = xA - xB;
                let dyAB = Model.vertexScreenY[a] - Model.vertexScreenY[b];
                let dxCB = xC - xB;
                let dyCB = Model.vertexScreenY[c] - Model.vertexScreenY[b];

                if (((dxAB * dyCB) - (dyAB * dxCB)) <= 0) {
                    continue;
                }

                Model.faceNearClipped[i] = false;
                Model.faceClippedX[i] = (xA < 0) || (xB < 0) || (xC < 0) || (xA > Draw2D.right) || (xB > Draw2D.right) || (xC > Draw2D.right);

                let depthAverage = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3) + this.minDepth;
                Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = i;
            }
        }

        if (!this.facePriority) {
            for (let i = this.maxDepth - 1; i >= 0; i--) {
                let count = Model.tmpDepthFaceCount[i];
                if (count <= 0) {
                    continue;
                }

                let faces = Model.tmpDepthFaces[i];
                for (let j = 0; j < count; j++) {
                    this.drawFace(faces[j]);
                }
            }

            return;
        }

        for (let i = 0; i < 12; i++) {
            Model.tmpPriorityFaceCount[i] = 0;
            Model.tmpPriorityDepthSum[i] = 0;
        }

        for (let i = this.maxDepth - 1; i >= 0; i--) {
            let count = Model.tmpDepthFaceCount[i];
            if (count <= 0) {
                continue;
            }

            let faces = Model.tmpDepthFaces[i];
            for (let j = 0; j < count; j++) {
                let face = faces[j];
                let priority = this.facePriority[face];
                let count = Model.tmpPriorityFaceCount[priority]++;
                Model.tmpPriorityFaces[priority][count] = face;

                if (priority < 10) {
                    Model.tmpPriorityDepthSum[priority] += i;
                } else if (priority === 10) {
                    Model.tmpPriority10FaceDepth[count] = i;
                } else {
                    Model.tmpPriority11FaceDepth[count] = i;
                }
            }
        }

        let averagePriorityDepth1_2 = 0;
        let averagePriorityDepth3_4 = 0;
        let averagePriorityDepth6_8 = 0;

        if ((Model.tmpPriorityFaceCount[1] > 0) || (Model.tmpPriorityFaceCount[2] > 0)) {
            averagePriorityDepth1_2 = Math.trunc((Model.tmpPriorityDepthSum[1] + Model.tmpPriorityDepthSum[2]) / (Model.tmpPriorityFaceCount[1] + Model.tmpPriorityFaceCount[2]));
        }

        if ((Model.tmpPriorityFaceCount[3] > 0) || (Model.tmpPriorityFaceCount[4] > 0)) {
            averagePriorityDepth3_4 = Math.trunc((Model.tmpPriorityDepthSum[3] + Model.tmpPriorityDepthSum[4]) / (Model.tmpPriorityFaceCount[3] + Model.tmpPriorityFaceCount[4]));
        }

        if ((Model.tmpPriorityFaceCount[6] > 0) || (Model.tmpPriorityFaceCount[8] > 0)) {
            averagePriorityDepth6_8 = Math.trunc((Model.tmpPriorityDepthSum[6] + Model.tmpPriorityDepthSum[8]) / (Model.tmpPriorityFaceCount[6] + Model.tmpPriorityFaceCount[8]));
        }

        let priorityFace = 0;
        let priorityFaceCount = Model.tmpPriorityFaceCount[10];
        let priorityFaces = Model.tmpPriorityFaces[10];
        let priorityFaceDepths = Model.tmpPriority10FaceDepth;

        if (priorityFace === priorityFaceCount) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
        }

        let priorityDepth;
        if (priorityFace < priorityFaceCount) {
            priorityDepth = priorityFaceDepths[priorityFace];
        } else {
            priorityDepth = -1000;
        }

        for (let i = 0; i < 10; i++) {
            while (i === 0 && priorityDepth > averagePriorityDepth1_2) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            while (i === 3 && priorityDepth > averagePriorityDepth3_4) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            while (i === 5 && priorityDepth > averagePriorityDepth6_8) {
                this.drawFace(priorityFaces[priorityFace++]);

                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = tmpPriority11FaceDepth;
                }

                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                } else {
                    priorityDepth = -1000;
                }
            }

            let count = Model.tmpPriorityFaceCount[i];
            let faces = Model.tmpPriorityFaces[i];

            for (let j = 0; j < count; j++) {
                this.drawFace(faces[j]);
            }
        }

        while (priorityDepth != -1000) {
            this.drawFace(priorityFaces[priorityFace++]);

            if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                priorityFace = 0;
                priorityFaces = Model.tmpPriorityFaces[11];
                priorityFaceCount = Model.tmpPriorityFaceCount[11];
                priorityFaceDepths = tmpPriority11FaceDepth;
            }

            if (priorityFace < priorityFaceCount) {
                priorityDepth = priorityFaceDepths[priorityFace];
            } else {
                priorityDepth = -1000;
            }
        }
    }

    pointWithinTriangle() {
        return false;
    }

    drawFace(face) {
        if (Model.faceNearClipped[face]) {
            this.drawNearClippedFace(face);
            return;
        }

        let a = this.faceVertexA[face];
        let b = this.faceVertexB[face];
        let c = this.faceVertexC[face];
        Draw3D.clipX = Model.faceClippedX[face];

        if (this.faceAlpha) {
            Draw3D.alpha = this.faceAlpha[face];
        } else {
            Draw3D.alpha = 0;
        }

        let type;
        if (this.faceInfo) {
            type = this.faceInfo[face] & 3;
        } else {
            type = 0;
        }

        if (type == 0) {
            Draw3D.fillGouraudTriangle(Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], this.faceColorA[face], this.faceColorB[face], this.faceColorC[face]);
        } else if (type == 1) {
            Draw3D.fillTriangle(Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Draw3D.palette[this.faceColorA[face]]);
        } else if (type == 2) {
            let texturedFace = this.faceInfo[face] >> 2;
            let ta = this.texturedVertexA[texturedFace];
            let tb = this.texturedVertexB[texturedFace];
            let tc = this.texturedVertexC[texturedFace];
            Draw3D.fillTexturedTriangle(Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], this.faceColorA[face], this.faceColorB[face], this.faceColorC[face], Model.vertexViewSpaceSpaceX[ta], Model.vertexViewSpaceSpaceX[tb], Model.vertexViewSpaceSpaceX[tc], Model.vertexViewSpaceSpaceY[ta], Model.vertexViewSpaceSpaceY[tb], Model.vertexViewSpaceSpaceY[tc], Model.vertexViewSpaceSpaceZ[ta], Model.vertexViewSpaceSpaceZ[tb], Model.vertexViewSpaceSpaceZ[tc], this.faceColor[face]);
        } else if (type == 3) {
            let texturedFace = this.faceInfo[face] >> 2;
            let ta = this.texturedVertexA[texturedFace];
            let tb = this.texturedVertexB[texturedFace];
            let tc = this.texturedVertexC[texturedFace];
            Draw3D.fillTexturedTriangle(Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], this.faceColorA[face], this.faceColorA[face], this.faceColorA[face],this. vertexViewSpaceSpaceX[ta], Model.vertexViewSpaceSpaceX[tb], Model.vertexViewSpaceSpaceX[tc], Model.vertexViewSpaceSpaceY[ta], Model.vertexViewSpaceSpaceY[tb], Model.vertexViewSpaceSpaceY[tc], Model.vertexViewSpaceSpaceZ[ta], Model.vertexViewSpaceSpaceZ[tb], Model.vertexViewSpaceSpaceZ[tc], this.faceColor[face]);
        }
    }

    drawNearClippedFace(face) {
    }
}
