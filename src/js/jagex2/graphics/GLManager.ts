import {Int32Array2d} from '../util/Arrays';
import {canvas} from './Canvas';
import Draw2D from './Draw2D';
import Draw3D from './Draw3D';
import GLFloatBuffer from './GLFloatBuffer';
import GLIntBuffer from './GLIntBuffer';
import Model from './Model';

export default class GLManager {
    private static distances: Int32Array | null;
    private static distanceFaceCount: string[] | null;
    private static distanceToFaces: string[][] | null;

    private static modelCanvasX: Float32Array | null;
    private static modelCanvasY: Float32Array | null;

    private static modelLocalX: Int32Array | null;
    private static modelLocalY: Int32Array | null;
    private static modelLocalZ: Int32Array | null;

    private static numOfPriority: Int32Array | null;
    private static eq10: Int32Array | null;
    private static eq11: Int32Array | null;
    private static lt10: Int32Array | null;
    private static orderedFaces: Int32Array2d | null;

    static initSortingBuffers(): void {
        const MAX_VERTEX_COUNT: number = 6500;
        const MAX_DIAMETER: number = 6000;

        this.distances = new Int32Array(MAX_VERTEX_COUNT);
        this.distanceFaceCount = new Array(MAX_DIAMETER);
        this.distanceToFaces = new Array(MAX_DIAMETER).fill(null).map((): string[] => new Array(512));

        this.modelCanvasX = new Float32Array(MAX_VERTEX_COUNT);
        this.modelCanvasY = new Float32Array(MAX_VERTEX_COUNT);

        this.modelLocalX = new Int32Array(MAX_VERTEX_COUNT);
        this.modelLocalY = new Int32Array(MAX_VERTEX_COUNT);
        this.modelLocalZ = new Int32Array(MAX_VERTEX_COUNT);

        this.numOfPriority = new Int32Array(12);
        this.eq10 = new Int32Array(2000);
        this.eq11 = new Int32Array(2000);
        this.lt10 = new Int32Array(12);
        this.orderedFaces = new Int32Array2d(12, 2000);
    }

    static releaseSortingBuffers(): void {
        this.distances = null;
        this.distanceFaceCount = null;
        this.distanceToFaces = null;

        this.modelCanvasX = null;
        this.modelCanvasY = null;

        this.modelLocalX = null;
        this.modelLocalY = null;
        this.modelLocalZ = null;

        this.numOfPriority = null;
        this.eq10 = null;
        this.eq11 = null;
        this.lt10 = null;
        this.orderedFaces = null;
    }

    static pushSortedModel(
        model: Model,
        yaw: number,
        sinEyePitch: number,
        cosEyePitch: number,
        sinEyeYaw: number,
        cosEyeYaw: number,
        relativeX: number,
        relativeY: number,
        relativeZ: number,
        bitset: number,
        vertexBuffer: GLIntBuffer,
        uvBuffer: GLFloatBuffer
    ): number {
        const zPrime: number = (relativeZ * cosEyeYaw - relativeX * sinEyeYaw) >> 16;
        const midZ: number = (relativeY * sinEyePitch + zPrime * cosEyePitch) >> 16;
        const radiusCosEyePitch: number = (model.radius * cosEyePitch) >> 16;

        const maxZ: number = midZ + radiusCosEyePitch;
        if (maxZ <= 50 || midZ >= 3500) {
            return 0;
        }

        const midX: number = (relativeZ * sinEyeYaw + relativeX * cosEyeYaw) >> 16;
        let leftX: number = (midX - model.radius) << 9;
        if (((leftX / maxZ) | 0) >= Draw2D.centerX2d) {
            return 0;
        }

        let rightX: number = (midX + model.radius) << 9;
        if (((rightX / maxZ) | 0) <= -Draw2D.centerX2d) {
            return 0;
        }

        const midY: number = (relativeY * cosEyePitch - zPrime * sinEyePitch) >> 16;
        const radiusSinEyePitch: number = (model.radius * sinEyePitch) >> 16;

        let bottomY: number = (midY + radiusSinEyePitch) << 9;
        if (((bottomY / maxZ) | 0) <= -Draw2D.centerY2d) {
            return 0;
        }

        const yPrime: number = radiusSinEyePitch + ((model.maxY * cosEyePitch) >> 16);
        let topY: number = (midY - yPrime) << 9;
        if (((topY / maxZ) | 0) >= Draw2D.centerY2d) {
            return 0;
        }

        const radiusZ: number = radiusCosEyePitch + ((model.maxY * sinEyePitch) >> 16);

        let clipped: boolean = midZ - radiusZ <= 50;
        let picking: boolean = false;

        if (bitset > 0 && Model.checkHover) {
            let z: number = midZ - radiusCosEyePitch;
            if (z <= 50) {
                z = 50;
            }

            if (midX > 0) {
                leftX = (leftX / maxZ) | 0;
                rightX = (rightX / z) | 0;
            } else {
                rightX = (rightX / maxZ) | 0;
                leftX = (leftX / z) | 0;
            }

            if (midY > 0) {
                topY = (topY / maxZ) | 0;
                bottomY = (bottomY / z) | 0;
            } else {
                bottomY = (bottomY / maxZ) | 0;
                topY = (topY / z) | 0;
            }

            const mouseX: number = Model.mouseX - Draw3D.centerX;
            const mouseY: number = Model.mouseY - Draw3D.centerY;
            if (mouseX > leftX && mouseX < rightX && mouseY > topY && mouseY < bottomY) {
                if (model.pickable) {
                    Model.pickedBitsets[Model.pickedCount++] = bitset;
                } else {
                    picking = true;
                }
            }
        }

        // vertex count
        const vertexCount: number = model.vertexCount;
        // vertices on X, Y, Z
        const verticesX: Int32Array = model.vertexX;
        const verticesY: Int32Array = model.vertexY;
        const verticesZ: Int32Array = model.vertexZ;

        // face count
        const faceCount: number = model.faceCount;
        // faces
        const faceVertexA: Int32Array = model.faceVertexA;
        const faceVertexB: Int32Array = model.faceVertexB;
        const faceVertexC: Int32Array = model.faceVertexC;
        //face color
        const faceColor: Int32Array | null = model.faceColor;
        const facePriority: Int32Array | null = model.facePriority;

        const zoom: number = 1;

        // camera X, Y, Z
        const centerX: number = Draw3D.centerX;
        const centerY: number = Draw3D.centerY;

        let sinYaw: number = 0;
        let cosYaw: number = 0;
        if (yaw !== 0) {
            sinYaw = Draw3D.sin[yaw];
            cosYaw = Draw3D.cos[yaw];
        }

        for (let v: number = 0; v < model.vertexCount; v++) {
            let x: number = model.vertexX[v];
            let y: number = model.vertexY[v];
            let z: number = model.vertexZ[v];

            let temp: number;
            if (yaw !== 0) {
                temp = (z * sinYaw + x * cosYaw) >> 16;
                z = (z * cosYaw - x * sinYaw) >> 16;
                x = temp;
            }

            x += relativeX;
            y += relativeY;
            z += relativeZ;

            this.modelLocalX![v] = x;
            this.modelLocalY![v] = y;
            this.modelLocalZ![v] = z;

            temp = (z * sinEyeYaw + x * cosEyeYaw) >> 16;
            z = (z * cosEyeYaw - x * sinEyeYaw) >> 16;
            x = temp;

            temp = (y * cosEyePitch - z * sinEyePitch) >> 16;
            z = (y * sinEyePitch + z * cosEyePitch) >> 16;
            y = temp;

            if (Model.vertexScreenZ) {
                Model.vertexScreenZ[v] = z - midZ;
            }

            if (z >= 50 && Model.vertexScreenX && Model.vertexScreenY) {
                Model.vertexScreenX[v] = centerX + (((x << 9) / z) | 0);
                Model.vertexScreenY[v] = centerY + (((y << 9) / z) | 0);
            } else if (Model.vertexScreenX) {
                Model.vertexScreenX[v] = -5000;
                clipped = true;
            }

            if ((clipped || model.texturedFaceCount > 0) && Model.vertexViewSpaceX && Model.vertexViewSpaceY && Model.vertexViewSpaceZ) {
                Model.vertexViewSpaceX[v] = x;
                Model.vertexViewSpaceY[v] = y;
                Model.vertexViewSpaceZ[v] = z;
            }
        }

        try {
            // try catch for example a model being drawn from 3d can crash like at baxtorian falls
            //this.draw2(clipped, picking, bitset);
        } catch (err) {
            /* empty */
        }

        return 0;
    }

    private static pushFace(model: Model, face: number, vertexBuffer: GLIntBuffer, uvBuffer: GLFloatBuffer): number {
        const indices1: Int32Array = model.faceVertexA;
        const indices2: Int32Array = model.faceVertexB;
        const indices3: Int32Array = model.faceVertexC;

        const faceColors1: Int32Array = model.faceColorA!;
        const faceColors2: Int32Array = model.faceColorB!;
        const faceColors3: Int32Array = model.faceColorC!;

        /*const overrideAmount: number = model.getOverrideAmount();
        const overrideHue: number = model.getOverrideHue();
        const overrideSat: number = model.getOverrideSaturation();
        const overrideLum: number = model.getOverrideLuminance();*/

        const faceTextures: Int32Array = model.faceInfo!;
        const textureFaces: Int32Array = model.faceInfo!;
        const texIndices1: Int32Array = model.texturedVertexA;
        const texIndices2: Int32Array = model.texturedVertexB;
        const texIndices3: Int32Array = model.texturedVertexC;

        const faceRenderPriorities: Int32Array = model.facePriority!;
        const transparencies: Int32Array = model.faceAlpha!;

        const packAlphaPriority: number = this.packAlphaPriority(faceTextures, transparencies, faceRenderPriorities, face);

        const triangleA: number = indices1[face];
        const triangleB: number = indices2[face];
        const triangleC: number = indices3[face];

        const color1: number = faceColors1[face];
        let color2: number = faceColors2[face];
        let color3: number = faceColors3[face];

        if (color3 === -1) {
            color2 = color3 = color1;
        }

        // HSL override is not applied to textured faces
        /*if (faceTextures === null || faceTextures[face] === -1) {
            if (overrideAmount > 0) {
                color1 = this.interpolateHSL(color1, overrideHue, overrideSat, overrideLum, overrideAmount);
                color2 = this.interpolateHSL(color2, overrideHue, overrideSat, overrideLum, overrideAmount);
                color3 = this.interpolateHSL(color3, overrideHue, overrideSat, overrideLum, overrideAmount);
            }
        }*/

        vertexBuffer.putC(this.modelLocalX![triangleA], this.modelLocalY![triangleA], this.modelLocalZ![triangleA], packAlphaPriority | color1);
        vertexBuffer.putC(this.modelLocalX![triangleB], this.modelLocalY![triangleB], this.modelLocalZ![triangleB], packAlphaPriority | color2);
        vertexBuffer.putC(this.modelLocalX![triangleC], this.modelLocalY![triangleC], this.modelLocalZ![triangleC], packAlphaPriority | color3);

        if (faceTextures !== null && faceTextures[face] !== -1) {
            let texA: number, texB: number, texC: number;

            if (textureFaces !== null && textureFaces[face] !== -1) {
                const tfaceIdx: number = textureFaces[face] & 0xff;
                texA = texIndices1[tfaceIdx];
                texB = texIndices2[tfaceIdx];
                texC = texIndices3[tfaceIdx];
            } else {
                texA = triangleA;
                texB = triangleB;
                texC = triangleC;
            }

            const texture: number = faceTextures[face] + 1;
            uvBuffer.putC(texture, this.modelLocalX![texA], this.modelLocalY![texA], this.modelLocalZ![texA]);
            uvBuffer.putC(texture, this.modelLocalX![texB], this.modelLocalY![texB], this.modelLocalZ![texB]);
            uvBuffer.putC(texture, this.modelLocalX![texC], this.modelLocalY![texC], this.modelLocalZ![texC]);
        } else {
            uvBuffer.putC(0, 0, 0, 0);
            uvBuffer.putC(0, 0, 0, 0);
            uvBuffer.putC(0, 0, 0, 0);
        }
        return 3;
    }

    static packAlphaPriority(faceTextures: Int32Array, faceTransparencies: Int32Array, facePriorities: Int32Array, face: number): number {
        let alpha: number = 0;
        if (faceTransparencies != null && (faceTextures == null || faceTextures[face] == -1)) {
            alpha = (faceTransparencies[face] & 0xff) << 24;
        }
        let priority: number = 0;
        if (facePriorities != null) {
            priority = (facePriorities[face] & 0xff) << 16;
        }
        return alpha | priority;
    }

    static interpolateHSL(hsl: number, hue2: number, sat2: number, lum2: number, lerp: number): number {
        let hue: number = (hsl >> 10) & 63;
        let sat: number = (hsl >> 7) & 7;
        let lum: number = hsl & 127;
        const var9: number = lerp & 255;
        if (hue2 != -1) {
            hue += (var9 * (hue2 - hue)) >> 7;
        }

        if (sat2 != -1) {
            sat += (var9 * (sat2 - sat)) >> 7;
        }

        if (lum2 != -1) {
            lum += (var9 * (lum2 - lum)) >> 7;
        }

        return ((hue << 10) | (sat << 7) | lum) & 65535;
    }
}
