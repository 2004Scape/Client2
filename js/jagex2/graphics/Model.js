import Packet from '../io/Packet.js';
import Draw2D from './Draw2D.js';
import Draw3D from './Draw3D.js';
class Metadata {
    vertexCount = 0;
    faceCount = 0;
    texturedFaceCount = 0;
    vertexFlagsOffset = -1;
    vertexXOffset = -1;
    vertexYOffset = -1;
    vertexZOffset = -1;
    vertexLabelsOffset = -1;
    faceVerticesOffset = -1;
    faceOrientationsOffset = -1;
    faceColorsOffset = -1;
    faceInfosOffset = -1;
    facePrioritiesOffset = 0;
    faceAlphasOffset = -1;
    faceLabelsOffset = -1;
    faceTextureAxisOffset = -1;
}
class VertexNormal {
    x = 0;
    y = 0;
    z = 0;
    w = 0;
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
    static faceClippedX = new Array(4096);
    static faceNearClipped = new Array(4096);
    static vertexScreenX = new Int32Array(4096);
    static vertexScreenY = new Int32Array(4096);
    static vertexScreenZ = new Int32Array(4096);
    static vertexViewSpaceX = new Int32Array(4096);
    static vertexViewSpaceY = new Int32Array(4096);
    static vertexViewSpaceZ = new Int32Array(4096);
    static tmpDepthFaceCount = new Int32Array(1500);
    static tmpDepthFaces = new Array(1500).fill(null).map(() => new Int32Array(512));
    static tmpPriorityFaceCount = new Int32Array(12);
    static tmpPriorityFaces = new Array(12).fill(null).map(() => new Int32Array(2000));
    static tmpPriority10FaceDepth = new Int32Array(2000);
    static tmpPriority11FaceDepth = new Int32Array(2000);
    static tmpPriorityDepthSum = new Int32Array(12);
    static clippedX = new Int32Array(10);
    static clippedY = new Int32Array(10);
    static clippedColor = new Int32Array(10);
    static baseX = 0;
    static baseY = 0;
    static baseZ = 0;
    static checkHover = false;
    static mouseX = 0;
    static mouseZ = 0;
    static pickedCount = 0;
    static pickedBitsets = new Int32Array(1000);
    static unpack(models) {
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
            const count = Model.head.g2();
            Model.metadata = new Array(count + 100);
            let vertexTextureDataOffset = 0;
            let labelDataOffset = 0;
            let triangleColorDataOffset = 0;
            let triangleInfoDataOffset = 0;
            let trianglePriorityDataOffset = 0;
            let triangleAlphaDataOffset = 0;
            let triangleSkinDataOffset = 0;
            for (let i = 0; i < count; i++) {
                const id = Model.head.g2();
                const meta = new Metadata();
                meta.vertexCount = Model.head.g2();
                meta.faceCount = Model.head.g2();
                meta.texturedFaceCount = Model.head.g1();
                meta.vertexFlagsOffset = Model.point1.pos;
                meta.vertexXOffset = Model.point2.pos;
                meta.vertexYOffset = Model.point3.pos;
                meta.vertexZOffset = Model.point4.pos;
                meta.faceVerticesOffset = Model.vertex1.pos;
                meta.faceOrientationsOffset = Model.vertex2.pos;
                const hasInfo = Model.head.g1();
                const hasPriorities = Model.head.g1();
                const hasAlpha = Model.head.g1();
                const hasSkins = Model.head.g1();
                const hasLabels = Model.head.g1();
                for (let v = 0; v < meta.vertexCount; v++) {
                    const flags = Model.point1.g1();
                    if ((flags & 0x1) !== 0) {
                        Model.point2.gsmarts();
                    }
                    if ((flags & 0x2) !== 0) {
                        Model.point3.gsmarts();
                    }
                    if ((flags & 0x4) !== 0) {
                        Model.point4.gsmarts();
                    }
                }
                for (let v = 0; v < meta.faceCount; v++) {
                    const type = Model.vertex2.g1();
                    if (type === 1) {
                        Model.vertex1.gsmarts();
                        Model.vertex1.gsmarts();
                    }
                    Model.vertex1.gsmarts();
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
                }
                else {
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
        }
        catch (err) {
            console.log('Error loading model index');
            console.error(err);
        }
    }
    static unload() {
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
    static mulColorLightness(hsl, scalar, faceInfo) {
        if ((faceInfo & 0x2) == 2) {
            if (scalar < 0) {
                scalar = 0;
            }
            else if (scalar > 127) {
                scalar = 127;
            }
            return 127 - scalar;
        }
        scalar = (scalar * (hsl & 0x7F)) >> 7;
        if (scalar < 2) {
            scalar = 2;
        }
        else if (scalar > 126) {
            scalar = 126;
        }
        return (hsl & 0xFF80) + scalar;
    }
    // ----
    vertexCount = 0;
    vertexX = null;
    vertexY = null;
    vertexZ = null;
    faceCount = 0;
    faceVertexA = null;
    faceVertexB = null;
    faceVertexC = null;
    faceColorA = null;
    faceColorB = null;
    faceColorC = null;
    faceInfo = null;
    facePriority = null;
    faceAlpha = null;
    faceColor = null;
    priority = 0;
    texturedFaceCount = 0;
    texturedVertexA = null;
    texturedVertexB = null;
    texturedVertexC = null;
    minX = 0;
    maxX = 0;
    minZ = 0;
    maxZ = 0;
    radius = 0;
    minY = 0;
    maxY = 0;
    maxDepth = 0;
    minDepth = 0;
    objRaise = 0;
    vertexLabel = null;
    faceLabel = null;
    labelVertices = null;
    labelFaces = null;
    pickable = false;
    vertexNormal = null;
    vertexNormalOriginal = null;
    constructor(id) {
        if (Model.head === null || Model.face1 === null || Model.face2 === null || Model.face3 === null || Model.face4 === null || Model.face5 === null || Model.point1 === null || Model.point2 === null || Model.point3 === null || Model.point4 === null || Model.point5 === null || Model.vertex1 === null || Model.vertex2 === null || Model.axis === null) {
            return;
        }
        if (Model.metadata === null) {
            return;
        }
        const meta = Model.metadata[id];
        if (typeof meta === 'undefined') {
            console.log(`Error model:${id} not found!`);
            return;
        }
        this.vertexCount = meta.vertexCount;
        this.faceCount = meta.faceCount;
        this.texturedFaceCount = meta.texturedFaceCount;
        this.vertexX = new Int32Array(this.vertexCount);
        this.vertexY = new Int32Array(this.vertexCount);
        this.vertexZ = new Int32Array(this.vertexCount);
        this.faceVertexA = new Int32Array(this.faceCount);
        this.faceVertexB = new Int32Array(this.faceCount);
        this.faceVertexC = new Int32Array(this.faceCount);
        this.texturedVertexA = new Int32Array(this.texturedFaceCount);
        this.texturedVertexB = new Int32Array(this.texturedFaceCount);
        this.texturedVertexC = new Int32Array(this.texturedFaceCount);
        if (meta.vertexLabelsOffset >= 0) {
            this.vertexLabel = new Int32Array(this.vertexCount);
        }
        if (meta.faceInfosOffset >= 0) {
            this.faceInfo = new Int32Array(this.faceCount);
        }
        if (meta.facePrioritiesOffset >= 0) {
            this.facePriority = new Int32Array(this.faceCount);
        }
        else {
            this.priority = -meta.facePrioritiesOffset - 1;
        }
        if (meta.faceAlphasOffset >= 0) {
            this.faceAlpha = new Int32Array(this.faceCount);
        }
        if (meta.faceLabelsOffset >= 0) {
            this.faceLabel = new Int32Array(this.faceCount);
        }
        this.faceColor = new Int32Array(this.faceCount);
        Model.point1.pos = meta.vertexFlagsOffset;
        Model.point2.pos = meta.vertexXOffset;
        Model.point3.pos = meta.vertexYOffset;
        Model.point4.pos = meta.vertexZOffset;
        Model.point5.pos = meta.vertexLabelsOffset;
        let dx = 0;
        let dy = 0;
        let dz = 0;
        let a;
        let b;
        let c;
        for (let v = 0; v < this.vertexCount; v++) {
            const flags = Model.point1.g1();
            a = 0;
            if ((flags & 0x1) != 0) {
                a = Model.point2.gsmarts();
            }
            b = 0;
            if ((flags & 0x2) != 0) {
                b = Model.point3.gsmarts();
            }
            c = 0;
            if ((flags & 0x4) != 0) {
                c = Model.point4.gsmarts();
            }
            this.vertexX[v] = dx + a;
            this.vertexY[v] = dy + b;
            this.vertexZ[v] = dz + c;
            dx = this.vertexX[v];
            dy = this.vertexY[v];
            dz = this.vertexZ[v];
            if (this.vertexLabel != null) {
                this.vertexLabel[v] = Model.point5.g1();
            }
        }
        Model.face1.pos = meta.faceColorsOffset;
        Model.face2.pos = meta.faceInfosOffset;
        Model.face3.pos = meta.facePrioritiesOffset;
        Model.face4.pos = meta.faceAlphasOffset;
        Model.face5.pos = meta.faceLabelsOffset;
        for (let f = 0; f < this.faceCount; f++) {
            this.faceColor[f] = Model.face1.g2();
            if (this.faceInfo != null) {
                this.faceInfo[f] = Model.face2.g1();
            }
            if (this.facePriority != null) {
                this.facePriority[f] = Model.face3.g1();
            }
            if (this.faceAlpha != null) {
                this.faceAlpha[f] = Model.face4.g1();
            }
            if (this.faceLabel != null) {
                this.faceLabel[f] = Model.face5.g1();
            }
        }
        Model.vertex1.pos = meta.faceVerticesOffset;
        Model.vertex2.pos = meta.faceOrientationsOffset;
        a = 0;
        b = 0;
        c = 0;
        let last = 0;
        for (let f = 0; f < this.faceCount; f++) {
            let orientation = Model.vertex2.g1();
            if (orientation === 1) {
                a = Model.vertex1.gsmarts() + last;
                last = a;
                b = Model.vertex1.gsmarts() + last;
                last = b;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            }
            else if (orientation === 2) {
                b = c;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            }
            else if (orientation === 3) {
                a = c;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            }
            else if (orientation === 4) {
                const tmp = a;
                a = b;
                b = tmp;
                c = Model.vertex1.gsmarts() + last;
                last = c;
            }
            this.faceVertexA[f] = a;
            this.faceVertexB[f] = b;
            this.faceVertexC[f] = c;
        }
        Model.axis.pos = meta.faceTextureAxisOffset * 6;
        for (let f = 0; f < this.texturedFaceCount; f++) {
            this.texturedVertexA[f] = Model.axis.g2();
            this.texturedVertexB[f] = Model.axis.g2();
            this.texturedVertexC[f] = Model.axis.g2();
        }
    }
    addVertex(src, vertexId) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        if (src.vertexX === null || src.vertexY === null || src.vertexZ === null) {
            return;
        }
        let identical = -1;
        const x = src.vertexX[vertexId];
        const y = src.vertexY[vertexId];
        const z = src.vertexZ[vertexId];
        for (let v = 0; v < this.vertexCount; v++) {
            if (x == this.vertexX[v] && y == this.vertexY[v] && z == this.vertexZ[v]) {
                identical = v;
                break;
            }
        }
        if (identical == -1) {
            this.vertexX[this.vertexCount] = x;
            this.vertexY[this.vertexCount] = y;
            this.vertexZ[this.vertexCount] = z;
            if (this.vertexLabel != null && src.vertexLabel != null) {
                this.vertexLabel[this.vertexCount] = src.vertexLabel[vertexId];
            }
            identical = this.vertexCount++;
        }
        return identical;
    }
    calculateBoundsCylinder() {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        this.maxY = 0;
        this.radius = 0;
        this.minY = 0;
        for (let i = 0; i < this.vertexCount; i++) {
            const x = this.vertexX[i];
            const y = this.vertexY[i];
            const z = this.vertexZ[i];
            if (-y > this.maxY) {
                this.maxY = -y;
            }
            if (y > this.minY) {
                this.minY = y;
            }
            const radiusSqr = x * x + z * z;
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }
        this.radius = Math.trunc(Math.sqrt(this.radius) + 0.99);
        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99);
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99);
    }
    calculateBoundsY() {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        this.maxY = 0;
        this.minY = 0;
        for (let v = 0; v < this.vertexCount; v++) {
            const y = this.vertexY[v];
            if (-y > this.maxY) {
                this.maxY = -y;
            }
            if (y > this.minY) {
                this.minY = y;
            }
        }
        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY) + 0.99);
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY) + 0.99);
    }
    calculateBoundsAABB() {
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
        for (let v = 0; v < this.vertexCount; v++) {
            const x = this.vertexX[v];
            const y = this.vertexY[v];
            const z = this.vertexZ[v];
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
            const radiusSqr = x * x + z * z;
            if (radiusSqr > this.radius) {
                this.radius = radiusSqr;
            }
        }
        this.radius = Math.trunc(Math.sqrt(this.radius));
        this.minDepth = Math.trunc(Math.sqrt(this.radius * this.radius + this.maxY * this.maxY));
        this.maxDepth = this.minDepth + Math.trunc(Math.sqrt(this.radius * this.radius + this.minY * this.minY));
    }
    createLabelReferences() {
    }
    applyTransform() {
    }
    rotateY90() {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        for (let v = 0; v < this.vertexCount; v++) {
            const tmp = this.vertexX[v];
            this.vertexX[v] = this.vertexZ[v];
            this.vertexZ[v] = -tmp;
        }
    }
    rotateX(angle) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        const sin = Draw3D.sin[angle];
        const cos = Draw3D.cos[angle];
        for (let v = 0; v < this.vertexCount; v++) {
            const tmp = (this.vertexY[v] * cos - this.vertexZ[v] * sin) >> 16;
            this.vertexZ[v] = (this.vertexY[v] * sin + this.vertexZ[v] * cos) >> 16;
            this.vertexY[v] = tmp;
        }
    }
    translate(x, y, z) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        for (let v = 0; v < this.vertexCount; v++) {
            this.vertexX[v] += x;
            this.vertexY[v] += y;
            this.vertexZ[v] += z;
        }
    }
    recolor(src, dst) {
        if (this.faceColor === null) {
            return;
        }
        for (let f = 0; f < this.faceCount; f++) {
            if (this.faceColor[f] == src) {
                this.faceColor[f] = dst;
            }
        }
    }
    rotateY180() {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null) {
            return;
        }
        for (let v = 0; v < this.vertexCount; v++) {
            this.vertexZ[v] = -this.vertexZ[v];
        }
        for (let f = 0; f < this.faceCount; f++) {
            const temp = this.faceVertexA[f];
            this.faceVertexA[f] = this.faceVertexC[f];
            this.faceVertexC[f] = temp;
        }
    }
    scale(x, y, z) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        for (let v = 0; v < this.vertexCount; v++) {
            this.vertexX[v] = this.vertexX[v] * x / 128;
            this.vertexY[v] = this.vertexY[v] * y / 128;
            this.vertexZ[v] = this.vertexZ[v] * z / 128;
        }
    }
    calculateNormals(lightAmbient, lightAttenuation, lightSrcX, lightSrcY, lightSrcZ, applyLighting) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null || this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null || this.faceColor === null) {
            return;
        }
        const lightMagnitude = Math.sqrt(lightSrcX * lightSrcX + lightSrcY * lightSrcY + lightSrcZ * lightSrcZ);
        const attenuation = (lightAttenuation * lightMagnitude) >> 8;
        if (this.faceColorA === null || this.faceColorB === null || this.faceColorC === null) {
            this.faceColorA = new Int32Array(this.faceCount);
            this.faceColorB = new Int32Array(this.faceCount);
            this.faceColorC = new Int32Array(this.faceCount);
        }
        if (this.vertexNormal === null) {
            this.vertexNormal = new Array(this.vertexCount);
            for (let v = 0; v < this.vertexCount; v++) {
                this.vertexNormal[v] = new VertexNormal();
            }
        }
        for (let f = 0; f < this.faceCount; f++) {
            const a = this.faceVertexA[f];
            const b = this.faceVertexB[f];
            const c = this.faceVertexC[f];
            const dxAB = this.vertexX[b] - this.vertexX[a];
            const dyAB = this.vertexY[b] - this.vertexY[a];
            const dzAB = this.vertexZ[b] - this.vertexZ[a];
            const dxAC = this.vertexX[c] - this.vertexX[a];
            const dyAC = this.vertexY[c] - this.vertexY[a];
            const dzAC = this.vertexZ[c] - this.vertexZ[a];
            let nx = dyAB * dzAC - dyAC * dzAB;
            let ny = dzAB * dxAC - dzAC * dxAB;
            let nz = dxAB * dyAC - dxAC * dyAB;
            while (nx > 8192 || ny > 8192 || nz > 8192 || nx < -8192 || ny < -8192 || nz < -8192) {
                nx >>= 1;
                ny >>= 1;
                nz >>= 1;
            }
            let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (length <= 0) {
                length = 1;
            }
            nx = nx * 256 / length;
            ny = ny * 256 / length;
            nz = nz * 256 / length;
            if (this.faceInfo === null || (this.faceInfo[f] & 0x1) === 0) {
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
            }
            else {
                const lightness = lightAmbient + (lightSrcX * nx + lightSrcY * ny + lightSrcZ * nz) / (attenuation + attenuation / 2);
                this.faceColorA[f] = Model.mulColorLightness(this.faceColor[f], lightness, this.faceInfo[f]);
            }
        }
        if (applyLighting) {
            this.applyLighting(lightAmbient, lightAttenuation, lightSrcX, lightSrcY, lightSrcZ);
        }
        else {
            this.vertexNormalOriginal = new Array(this.vertexCount);
            for (let v = 0; v < this.vertexCount; v++) {
                const normal = this.vertexNormal[v];
                const copy = new VertexNormal();
                copy.x = normal.x;
                copy.y = normal.y;
                copy.z = normal.z;
                copy.w = normal.w;
                this.vertexNormalOriginal[v] = copy;
            }
        }
        if (applyLighting) {
            this.calculateBoundsCylinder();
        }
        else {
            this.calculateBoundsAABB();
        }
    }
    applyLighting(lightAmbient, lightAttenuation, lightSrcX, lightSrcY, lightSrcZ) {
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null || this.faceColor === null || this.vertexNormal === null) {
            return;
        }
        if (this.faceColorA === null || this.faceColorB === null || this.faceColorC === null) {
            return;
        }
        for (let f = 0; f < this.faceCount; f++) {
            const a = this.faceVertexA[f];
            const b = this.faceVertexB[f];
            const c = this.faceVertexC[f];
            if (this.faceInfo === null) {
                const color = this.faceColor[f];
                let n = this.vertexNormal[a];
                let lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorA[f] = Model.mulColorLightness(color, lightness, 0);
                n = this.vertexNormal[b];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorB[f] = Model.mulColorLightness(color, lightness, 0);
                n = this.vertexNormal[c];
                lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
                this.faceColorC[f] = Model.mulColorLightness(color, lightness, 0);
            }
            else if ((this.faceInfo[f] & 0x1) === 0) {
                const color = this.faceColor[f];
                const info = this.faceInfo[f];
                let n = this.vertexNormal[a];
                let lightness = lightAmbient + (lightSrcX * n.x + lightSrcY * n.y + lightSrcZ * n.z) / (lightAttenuation * n.w);
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
            for (let f = 0; f < this.faceCount; f++) {
                if ((this.faceInfo[f] & 0x2) === 2) {
                    return;
                }
            }
        }
        this.faceColor = null;
    }
    // todo: better name, Java relies on overloads
    drawSimple(pitch, yaw, roll, eyePitch, eyeX, eyeY, eyeZ) {
        if (this.vertexX === null || this.vertexY === null || this.vertexZ === null) {
            return;
        }
        if (Model.vertexScreenX === null || Model.vertexScreenY === null || Model.vertexScreenZ === null) {
            return;
        }
        if (Model.vertexViewSpaceX === null || Model.vertexViewSpaceY === null || Model.vertexViewSpaceZ === null) {
            return;
        }
        const sinPitch = Draw3D.sin[pitch];
        const cosPitch = Draw3D.cos[pitch];
        const sinYaw = Draw3D.sin[yaw];
        const cosYaw = Draw3D.cos[yaw];
        const sinRoll = Draw3D.sin[roll];
        const cosRoll = Draw3D.cos[roll];
        const sinEyePitch = Draw3D.sin[eyePitch];
        const cosEyePitch = Draw3D.cos[eyePitch];
        const midZ = (eyeY * sinEyePitch + eyeZ * cosEyePitch) >> 16;
        for (let v = 0; v < this.vertexCount; v++) {
            let x = this.vertexX[v];
            let y = this.vertexY[v];
            let z = this.vertexZ[v];
            let tmp;
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
    }
    // todo: better name, Java relies on overloads
    draw(yaw, sinEyePitch, cosEyePitch, sinEyeYaw, cosEyeYaw, relativeX, relativeY, relativeZ, bitset) {
    }
    // todo: better name, Java relies on overloads
    draw2(clipped, picking, bitset) {
        if (Model.vertexScreenX === null || Model.vertexScreenY === null || Model.vertexScreenZ === null) {
            return;
        }
        if (Model.vertexViewSpaceX === null || Model.vertexViewSpaceY === null || Model.vertexViewSpaceZ === null) {
            return;
        }
        if (Model.faceNearClipped === null || Model.faceClippedX === null) {
            return;
        }
        if (Model.tmpDepthFaceCount === null || Model.tmpDepthFaces === null || Model.tmpPriorityFaces === null || Model.tmpPriorityFaceCount === null || Model.tmpPriorityDepthSum === null || Model.tmpPriority10FaceDepth === null || Model.tmpPriority11FaceDepth === null) {
            return;
        }
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null) {
            return;
        }
        for (let depth = 0; depth < this.maxDepth; depth++) {
            Model.tmpDepthFaceCount[depth] = 0;
        }
        for (let f = 0; f < this.faceCount; f++) {
            if (this.faceInfo && this.faceInfo[f] == -1) {
                continue;
            }
            const a = this.faceVertexA[f];
            const b = this.faceVertexB[f];
            const c = this.faceVertexC[f];
            const xA = Model.vertexScreenX[a];
            const xB = Model.vertexScreenX[b];
            const xC = Model.vertexScreenX[c];
            if (clipped && (xA == -5000 || xB == -5000 || xC == -5000)) {
                Model.faceNearClipped[f] = true;
                const depthAverage = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3 + this.minDepth);
                Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
            }
            else {
                if (picking && this.pointWithinTriangle(Model.mouseX, Model.mouseZ, Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], xA, xB, xC)) {
                    Model.pickedBitsets[Model.pickedCount++] = bitset;
                    picking = false;
                }
                const dxAB = xA - xB;
                const dyAB = Model.vertexScreenY[a] - Model.vertexScreenY[b];
                const dxCB = xC - xB;
                const dyCB = Model.vertexScreenY[c] - Model.vertexScreenY[b];
                if ((dxAB * dyCB - dyAB * dxCB) <= 0) {
                    continue;
                }
                Model.faceNearClipped[f] = false;
                Model.faceClippedX[f] = xA < 0 || xB < 0 || xC < 0 || xA > Draw2D.boundX || xB > Draw2D.boundX || xC > Draw2D.boundX;
                const depthAverage = Math.trunc((Model.vertexScreenZ[a] + Model.vertexScreenZ[b] + Model.vertexScreenZ[c]) / 3 + this.minDepth);
                Model.tmpDepthFaces[depthAverage][Model.tmpDepthFaceCount[depthAverage]++] = f;
            }
        }
        if (this.facePriority == null) {
            for (let depth = this.maxDepth - 1; depth >= 0; depth--) {
                const count = Model.tmpDepthFaceCount[depth];
                if (count <= 0) {
                    continue;
                }
                const faces = Model.tmpDepthFaces[depth];
                for (let f = 0; f < count; f++) {
                    this.drawFace(faces[f]);
                }
            }
            return;
        }
        for (let priority = 0; priority < 12; priority++) {
            Model.tmpPriorityFaceCount[priority] = 0;
            Model.tmpPriorityDepthSum[priority] = 0;
        }
        for (let depth = this.maxDepth - 1; depth >= 0; depth--) {
            const faceCount = Model.tmpDepthFaceCount[depth];
            if (faceCount > 0) {
                const faces = Model.tmpDepthFaces[depth];
                for (let i = 0; i < faceCount; i++) {
                    const priorityDepth = faces[i];
                    const priorityFace = this.facePriority[priorityDepth];
                    const priorityFaceCount = Model.tmpPriorityFaceCount[priorityFace]++;
                    Model.tmpPriorityFaces[priorityFace][priorityFaceCount] = priorityDepth;
                    if (priorityFace < 10) {
                        Model.tmpPriorityDepthSum[priorityFace] += depth;
                    }
                    else if (priorityFace == 10) {
                        Model.tmpPriority10FaceDepth[priorityFaceCount] = depth;
                    }
                    else {
                        Model.tmpPriority11FaceDepth[priorityFaceCount] = depth;
                    }
                }
            }
        }
        let averagePriorityDepthSum1_2 = 0;
        if (Model.tmpPriorityFaceCount[1] > 0 || Model.tmpPriorityFaceCount[2] > 0) {
            averagePriorityDepthSum1_2 = Math.trunc((Model.tmpPriorityDepthSum[1] + Model.tmpPriorityDepthSum[2]) / (Model.tmpPriorityFaceCount[1] + Model.tmpPriorityFaceCount[2]));
        }
        let averagePriorityDepthSum3_4 = 0;
        if (Model.tmpPriorityFaceCount[3] > 0 || Model.tmpPriorityFaceCount[4] > 0) {
            averagePriorityDepthSum3_4 = Math.trunc((Model.tmpPriorityDepthSum[3] + Model.tmpPriorityDepthSum[4]) / (Model.tmpPriorityFaceCount[3] + Model.tmpPriorityFaceCount[4]));
        }
        let averagePriorityDepthSum6_8 = 0;
        if (Model.tmpPriorityFaceCount[6] > 0 || Model.tmpPriorityFaceCount[8] > 0) {
            averagePriorityDepthSum6_8 = Math.trunc((Model.tmpPriorityDepthSum[6] + Model.tmpPriorityDepthSum[8]) / (Model.tmpPriorityFaceCount[6] + Model.tmpPriorityFaceCount[8]));
        }
        let priorityFace = 0;
        let priorityFaceCount = Model.tmpPriorityFaceCount[10];
        let priorityFaces = Model.tmpPriorityFaces[10];
        let priorityFaceDepths = Model.tmpPriority10FaceDepth;
        if (priorityFace == priorityFaceCount) {
            priorityFace = 0;
            priorityFaceCount = Model.tmpPriorityFaceCount[11];
            priorityFaces = Model.tmpPriorityFaces[11];
            priorityFaceDepths = Model.tmpPriority11FaceDepth;
        }
        let priorityDepth;
        if (priorityFace < priorityFaceCount) {
            priorityDepth = priorityFaceDepths[priorityFace];
        }
        else {
            priorityDepth = -1000;
        }
        for (let priority = 0; priority < 10; priority++) {
            while (priority == 0 && priorityDepth > averagePriorityDepthSum1_2) {
                this.drawFace(priorityFaces[priorityFace++]);
                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }
                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                }
                else {
                    priorityDepth = -1000;
                }
            }
            while (priority == 3 && priorityDepth > averagePriorityDepthSum3_4) {
                this.drawFace(priorityFaces[priorityFace++]);
                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }
                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                }
                else {
                    priorityDepth = -1000;
                }
            }
            while (priority == 5 && priorityDepth > averagePriorityDepthSum6_8) {
                this.drawFace(priorityFaces[priorityFace++]);
                if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                    priorityFace = 0;
                    priorityFaceCount = Model.tmpPriorityFaceCount[11];
                    priorityFaces = Model.tmpPriorityFaces[11];
                    priorityFaceDepths = Model.tmpPriority11FaceDepth;
                }
                if (priorityFace < priorityFaceCount) {
                    priorityDepth = priorityFaceDepths[priorityFace];
                }
                else {
                    priorityDepth = -1000;
                }
            }
            const count = Model.tmpPriorityFaceCount[priority];
            const faces = Model.tmpPriorityFaces[priority];
            for (let i = 0; i < count; i++) {
                this.drawFace(faces[i]);
            }
        }
        while (priorityDepth != -1000) {
            this.drawFace(priorityFaces[priorityFace++]);
            if (priorityFace == priorityFaceCount && priorityFaces != Model.tmpPriorityFaces[11]) {
                priorityFace = 0;
                priorityFaces = Model.tmpPriorityFaces[11];
                priorityFaceCount = Model.tmpPriorityFaceCount[11];
                priorityFaceDepths = Model.tmpPriority11FaceDepth;
            }
            if (priorityFace < priorityFaceCount) {
                priorityDepth = priorityFaceDepths[priorityFace];
            }
            else {
                priorityDepth = -1000;
            }
        }
    }
    drawFace(face) {
        if (Model.faceNearClipped !== null && Model.faceNearClipped[face]) {
            this.drawNearClippedFace(face);
            return;
        }
        if (this.faceVertexA === null || this.faceVertexB === null || this.faceVertexC === null) {
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
        const a = this.faceVertexA[face];
        const b = this.faceVertexB[face];
        const c = this.faceVertexC[face];
        Draw3D.clipX = Model.faceClippedX[face];
        if (this.faceAlpha === null) {
            Draw3D.alpha = 0;
        }
        else {
            Draw3D.alpha = this.faceAlpha[face];
        }
        let type;
        if (this.faceInfo === null) {
            type = 0;
        }
        else {
            type = this.faceInfo[face] & 0x3;
        }
        if (type === 0 && this.faceColorA !== null && this.faceColorB !== null && this.faceColorC !== null) {
            Draw3D.fillGouraudTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColorA[face], this.faceColorB[face], this.faceColorC[face]);
        }
        else if (type === 1) {
            // Draw3D.fillTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], palette[this.faceColorA[face]]);
        }
        else if (type === 2 && this.faceInfo !== null && this.texturedVertexA !== null && this.texturedVertexB !== null && this.texturedVertexC !== null) {
            // const texturedFace = this.faceInfo[face] >> 2;
            // const tA = this.texturedVertexA[texturedFace];
            // const tB = this.texturedVertexB[texturedFace];
            // const tC = this.texturedVertexC[texturedFace];
            // Draw3D.fillTexturedTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColorA[face], this.faceColorB[face], this.faceColorC[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColor[face]);
        }
        else if (type === 3 && this.faceInfo !== null && this.texturedVertexA !== null && this.texturedVertexB !== null && this.texturedVertexC !== null) {
            // const texturedFace = this.faceInfo[face] >> 2;
            // const tA = this.texturedVertexA[texturedFace];
            // const tB = this.texturedVertexB[texturedFace];
            // const tC = this.texturedVertexC[texturedFace];
            // Draw3D.fillTexturedTriangle(Model.vertexScreenX[a], Model.vertexScreenX[b], Model.vertexScreenX[c], Model.vertexScreenY[a], Model.vertexScreenY[b], Model.vertexScreenY[c], this.faceColorA[face], this.faceColorA[face], this.faceColorA[face], Model.vertexViewSpaceX[tA], Model.vertexViewSpaceY[tA], Model.vertexViewSpaceZ[tA], Model.vertexViewSpaceX[tB], Model.vertexViewSpaceX[tC], Model.vertexViewSpaceY[tB], Model.vertexViewSpaceY[tC], Model.vertexViewSpaceZ[tB], Model.vertexViewSpaceZ[tC], this.faceColor[face]);
        }
    }
    drawNearClippedFace(face) {
    }
    pointWithinTriangle(x, y, xA, xB, xC, yA, yB, yC) {
        if (y < yA && y < yB && y < yC) {
            return false;
        }
        else if (y > yA && y > yB && y > yC) {
            return false;
        }
        else if (x < xA && x < xB && x < xC) {
            return false;
        }
        else {
            return x <= xA || x <= xB || x <= xC;
        }
    }
}
