export default class TileOverlay {
    static tmpScreenX: Int32Array = new Int32Array(6);
    static tmpScreenY: Int32Array = new Int32Array(6);
    static tmpViewspaceX: Int32Array = new Int32Array(6);
    static tmpViewspaceY: Int32Array = new Int32Array(6);
    static tmpViewspaceZ: Int32Array = new Int32Array(6);

    // prettier-ignore
    private static SHAPE_POINTS: number[][] = [
        [1, 3, 5, 7],
        [1, 3, 5, 7],
        [1, 3, 5, 7],
        [1, 3, 5, 7, 6],
        [1, 3, 5, 7, 6],
        [1, 3, 5, 7, 6],
        [1, 3, 5, 7, 6],
        [1, 3, 5, 7, 2, 6],
        [1, 3, 5, 7, 2, 8],
        [1, 3, 5, 7, 2, 8],
        [1, 3, 5, 7, 11, 12],
        [1, 3, 5, 7, 11, 12],
        [1, 3, 5, 7, 13, 14]
    ];

    // prettier-ignore
    private static SHAPE_PATHS: number[][] = [
        [0, 1, 2, 3, 0, 0, 1, 3],
        [1, 1, 2, 3, 1, 0, 1, 3],
        [0, 1, 2, 3, 1, 0, 1, 3],
        [0, 0, 1, 2, 0, 0, 2, 4, 1, 0, 4, 3],
        [0, 0, 1, 4, 0, 0, 4, 3, 1, 1, 2, 4],
        [0, 0, 4, 3, 1, 0, 1, 2, 1, 0, 2, 4],
        [0, 1, 2, 4, 1, 0, 1, 4, 1, 0, 4, 3],
        [0, 4, 1, 2, 0, 4, 2, 5, 1, 0, 4, 5, 1, 0, 5, 3],
        [0, 4, 1, 2, 0, 4, 2, 3, 0, 4, 3, 5, 1, 0, 4, 5],
        [0, 0, 4, 5, 1, 4, 1, 2, 1, 4, 2, 3, 1, 4, 3, 5],
        [0, 0, 1, 5, 0, 1, 4, 5, 0, 1, 2, 4, 1, 0, 5, 3, 1, 5, 4, 3, 1, 4, 2, 3],
        [1, 0, 1, 5, 1, 1, 4, 5, 1, 1, 2, 4, 0, 0, 5, 3, 0, 5, 4, 3, 0, 4, 2, 3],
        [1, 0, 5, 4, 1, 0, 1, 5, 0, 0, 4, 3, 0, 4, 5, 3, 0, 5, 2, 3, 0, 1, 2, 5]
    ];

    readonly vertexX: Int32Array;
    readonly vertexY: Int32Array;
    readonly vertexZ: Int32Array;
    readonly triangleColorA: Int32Array;
    readonly triangleColorB: Int32Array;
    readonly triangleColorC: Int32Array;
    readonly triangleVertexA: Int32Array;
    readonly triangleVertexB: Int32Array;
    readonly triangleVertexC: Int32Array;
    readonly triangleTextureIds: Int32Array | null;
    readonly flat: boolean;
    readonly shape: number;
    readonly rotation: number;
    readonly backgroundRgb: number;
    readonly foregroundRgb: number;

    constructor(
        tileX: number,
        shape: number,
        southeastColor2: number,
        southeastY: number,
        northeastColor1: number,
        rotation: number,
        southwestColor1: number,
        northwestY: number,
        foregroundRgb: number,
        southwestColor2: number,
        textureId: number,
        northwestColor2: number,
        backgroundRgb: number,
        northeastY: number,
        northeastColor2: number,
        northwestColor1: number,
        southwestY: number,
        tileZ: number,
        southeastColor1: number
    ) {
        this.flat = !(southwestY !== southeastY || southwestY !== northeastY || southwestY !== northwestY);
        this.shape = shape;
        this.rotation = rotation;
        this.backgroundRgb = backgroundRgb;
        this.foregroundRgb = foregroundRgb;

        const ONE: number = 128; // short
        const HALF: number = Math.trunc(ONE / 2);
        const QUARTER: number = Math.trunc(ONE / 4);
        const THREE_QUARTER: number = Math.trunc((ONE * 3) / 4);

        const points: number[] = TileOverlay.SHAPE_POINTS[shape];
        const vertexCount: number = points.length;
        this.vertexX = new Int32Array(vertexCount);
        this.vertexY = new Int32Array(vertexCount);
        this.vertexZ = new Int32Array(vertexCount);
        const primaryColors: Int32Array = new Int32Array(vertexCount);
        const secondaryColors: Int32Array = new Int32Array(vertexCount);

        const sceneX: number = tileX * ONE;
        const sceneZ: number = tileZ * ONE;

        for (let v: number = 0; v < vertexCount; v++) {
            let type: number = points[v];

            if ((type & 0x1) === 0 && type <= 8) {
                type = ((type - rotation - rotation - 1) & 0x7) + 1;
            }

            if (type > 8 && type <= 12) {
                type = ((type - rotation - 9) & 0x3) + 9;
            }

            if (type > 12 && type <= 16) {
                type = ((type - rotation - 13) & 0x3) + 13;
            }

            let x: number;
            let z: number;
            let y: number;
            let color1: number;
            let color2: number;

            if (type === 1) {
                x = sceneX;
                z = sceneZ;
                y = southwestY;
                color1 = southwestColor1;
                color2 = southwestColor2;
            } else if (type === 2) {
                x = sceneX + HALF;
                z = sceneZ;
                y = (southwestY + southeastY) >> 1;
                color1 = (southwestColor1 + southeastColor1) >> 1;
                color2 = (southwestColor2 + southeastColor2) >> 1;
            } else if (type === 3) {
                x = sceneX + ONE;
                z = sceneZ;
                y = southeastY;
                color1 = southeastColor1;
                color2 = southeastColor2;
            } else if (type === 4) {
                x = sceneX + ONE;
                z = sceneZ + HALF;
                y = (southeastY + northeastY) >> 1;
                color1 = (southeastColor1 + northeastColor1) >> 1;
                color2 = (southeastColor2 + northeastColor2) >> 1;
            } else if (type === 5) {
                x = sceneX + ONE;
                z = sceneZ + ONE;
                y = northeastY;
                color1 = northeastColor1;
                color2 = northeastColor2;
            } else if (type === 6) {
                x = sceneX + HALF;
                z = sceneZ + ONE;
                y = (northeastY + northwestY) >> 1;
                color1 = (northeastColor1 + northwestColor1) >> 1;
                color2 = (northeastColor2 + northwestColor2) >> 1;
            } else if (type === 7) {
                x = sceneX;
                z = sceneZ + ONE;
                y = northwestY;
                color1 = northwestColor1;
                color2 = northwestColor2;
            } else if (type === 8) {
                x = sceneX;
                z = sceneZ + HALF;
                y = (northwestY + southwestY) >> 1;
                color1 = (northwestColor1 + southwestColor1) >> 1;
                color2 = (northwestColor2 + southwestColor2) >> 1;
            } else if (type === 9) {
                x = sceneX + HALF;
                z = sceneZ + QUARTER;
                y = (southwestY + southeastY) >> 1;
                color1 = (southwestColor1 + southeastColor1) >> 1;
                color2 = (southwestColor2 + southeastColor2) >> 1;
            } else if (type === 10) {
                x = sceneX + THREE_QUARTER;
                z = sceneZ + HALF;
                y = (southeastY + northeastY) >> 1;
                color1 = (southeastColor1 + northeastColor1) >> 1;
                color2 = (southeastColor2 + northeastColor2) >> 1;
            } else if (type === 11) {
                x = sceneX + HALF;
                z = sceneZ + THREE_QUARTER;
                y = (northeastY + northwestY) >> 1;
                color1 = (northeastColor1 + northwestColor1) >> 1;
                color2 = (northeastColor2 + northwestColor2) >> 1;
            } else if (type === 12) {
                x = sceneX + QUARTER;
                z = sceneZ + HALF;
                y = (northwestY + southwestY) >> 1;
                color1 = (northwestColor1 + southwestColor1) >> 1;
                color2 = (northwestColor2 + southwestColor2) >> 1;
            } else if (type === 13) {
                x = sceneX + QUARTER;
                z = sceneZ + QUARTER;
                y = southwestY;
                color1 = southwestColor1;
                color2 = southwestColor2;
            } else if (type === 14) {
                x = sceneX + THREE_QUARTER;
                z = sceneZ + QUARTER;
                y = southeastY;
                color1 = southeastColor1;
                color2 = southeastColor2;
            } else if (type === 15) {
                x = sceneX + THREE_QUARTER;
                z = sceneZ + THREE_QUARTER;
                y = northeastY;
                color1 = northeastColor1;
                color2 = northeastColor2;
            } else {
                x = sceneX + QUARTER;
                z = sceneZ + THREE_QUARTER;
                y = northwestY;
                color1 = northwestColor1;
                color2 = northwestColor2;
            }

            this.vertexX[v] = x;
            this.vertexY[v] = y;
            this.vertexZ[v] = z;
            primaryColors[v] = color1;
            secondaryColors[v] = color2;
        }

        const paths: number[] = TileOverlay.SHAPE_PATHS[shape];
        const triangleCount: number = Math.trunc(paths.length / 4);
        this.triangleVertexA = new Int32Array(triangleCount);
        this.triangleVertexB = new Int32Array(triangleCount);
        this.triangleVertexC = new Int32Array(triangleCount);
        this.triangleColorA = new Int32Array(triangleCount);
        this.triangleColorB = new Int32Array(triangleCount);
        this.triangleColorC = new Int32Array(triangleCount);

        if (textureId !== -1) {
            this.triangleTextureIds = new Int32Array(triangleCount);
        } else {
            this.triangleTextureIds = null;
        }

        let index: number = 0;
        for (let t: number = 0; t < triangleCount; t++) {
            const color: number = paths[index];
            let a: number = paths[index + 1];
            let b: number = paths[index + 2];
            let c: number = paths[index + 3];
            index += 4;

            if (a < 4) {
                a = (a - rotation) & 0x3;
            }

            if (b < 4) {
                b = (b - rotation) & 0x3;
            }

            if (c < 4) {
                c = (c - rotation) & 0x3;
            }

            this.triangleVertexA[t] = a;
            this.triangleVertexB[t] = b;
            this.triangleVertexC[t] = c;

            if (color === 0) {
                this.triangleColorA[t] = primaryColors[a];
                this.triangleColorB[t] = primaryColors[b];
                this.triangleColorC[t] = primaryColors[c];

                if (this.triangleTextureIds) {
                    this.triangleTextureIds[t] = -1;
                }
            } else {
                this.triangleColorA[t] = secondaryColors[a];
                this.triangleColorB[t] = secondaryColors[b];
                this.triangleColorC[t] = secondaryColors[c];

                if (this.triangleTextureIds) {
                    this.triangleTextureIds[t] = textureId;
                }
            }
        }
    }
}
