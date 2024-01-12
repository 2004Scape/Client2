export default class TileOverlay {
    readonly vertexX: number[] = [];
    readonly vertexY: number[] = [];
    readonly vertexZ: number[] = [];
    readonly triangleColorA: number[] = [];
    readonly triangleColorB: number[] = [];
    readonly triangleColorC: number[] = [];
    readonly triangleVertexA: number[] = [];
    readonly triangleVertexB: number[] = [];
    readonly triangleVertexC: number[] = [];
    readonly triangleTextureIds: number[] = [];
    readonly flat: boolean = true;
    readonly shape: number = 0;
    readonly rotation: number = 0;
    readonly backgroundRgb: number = 0;
    readonly foregroundRgb: number = 0;
    static readonly tmpScreenX: number[] = [];
    static readonly tmpScreenY: number[] = [];
    static readonly tmpViewspaceX: number[] = [];
    static readonly tmpViewspaceY: number[] = [];
    static readonly tmpViewspaceZ: number[] = [];
    static readonly SHAPE_POINTS: number[][] = [
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
    static readonly SHAPE_PATHS: number[][] = [
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
        if (southwestY != southeastY || southwestY != northeastY || southwestY != northwestY) {
            this.flat = false;
        }
        this.shape = shape;
        this.rotation = rotation;
        this.backgroundRgb = backgroundRgb;
        this.foregroundRgb = foregroundRgb;

        let ONE: number = 128;
        let HALF: number = ONE / 2;
        let QUARTER: number = ONE / 4;
        let THREE_QUARTER: number = (ONE * 3) / 4;

        let points: number[] = TileOverlay.SHAPE_POINTS[shape];
        let vertexCount: number = points.length;

        this.vertexX = new Array<number>(vertexCount).fill(0);
        this.vertexY = new Array<number>(vertexCount).fill(0);
        this.vertexZ = new Array<number>(vertexCount).fill(0);
        let primaryColors: number[] = new Array<number>(vertexCount).fill(0);
        let secondaryColors: number[] = new Array<number>(vertexCount).fill(0);

        let sceneX: number = tileX * ONE;
        let sceneZ: number = tileZ * ONE;

        for (let v = 0; v < vertexCount; v++) {
            let type: number = points[v];

            if ((type & 0x1) == 0 && type <= 8) {
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

            if (type == 1) {
                x = sceneX;
                z = sceneZ;
                y = southwestY;
                color1 = southwestColor1;
                color2 = southwestColor2;
            } else if (type == 2) {
                x = sceneX + HALF;
                z = sceneZ;
                y = (southwestY + southeastY) >> 1;
                color1 = (southwestColor1 + southeastColor1) >> 1;
                color2 = (southwestColor2 + southeastColor2) >> 1;
            } else if (type == 3) {
                x = sceneX + ONE;
                z = sceneZ;
                y = southeastY;
                color1 = southeastColor1;
                color2 = southeastColor2;
            } else if (type == 4) {
                x = sceneX + ONE;
                z = sceneZ + HALF;
                y = (southeastY + northeastY) >> 1;
                color1 = (southeastColor1 + northeastColor1) >> 1;
                color2 = (southeastColor2 + northeastColor2) >> 1;
            } else if (type == 5) {
                x = sceneX + ONE;
                z = sceneZ + ONE;
                y = northeastY;
                color1 = northeastColor1;
                color2 = northeastColor2;
            } else if (type == 6) {
                x = sceneX + HALF;
                z = sceneZ + ONE;
                y = (northeastY + northwestY) >> 1;
                color1 = (northeastColor1 + northwestColor1) >> 1;
                color2 = (northeastColor2 + northwestColor2) >> 1;
            } else if (type == 7) {
                x = sceneX;
                z = sceneZ + ONE;
                y = northwestY;
                color1 = northwestColor1;
                color2 = northwestColor2;
            } else if (type == 8) {
                x = sceneX;
                z = sceneZ + HALF;
                y = (northwestY + southwestY) >> 1;
                color1 = (northwestColor1 + southwestColor1) >> 1;
                color2 = (northwestColor2 + southwestColor2) >> 1;
            } else if (type == 9) {
                x = sceneX + HALF;
                z = sceneZ + QUARTER;
                y = (southwestY + southeastY) >> 1;
                color1 = (southwestColor1 + southeastColor1) >> 1;
                color2 = (southwestColor2 + southeastColor2) >> 1;
            } else if (type == 10) {
                x = sceneX + THREE_QUARTER;
                z = sceneZ + HALF;
                y = (southeastY + northeastY) >> 1;
                color1 = (southeastColor1 + northeastColor1) >> 1;
                color2 = (southeastColor2 + northeastColor2) >> 1;
            } else if (type == 11) {
                x = sceneX + HALF;
                z = sceneZ + THREE_QUARTER;
                y = (northeastY + northwestY) >> 1;
                color1 = (northeastColor1 + northwestColor1) >> 1;
                color2 = (northeastColor2 + northwestColor2) >> 1;
            } else if (type == 12) {
                x = sceneX + QUARTER;
                z = sceneZ + HALF;
                y = (northwestY + southwestY) >> 1;
                color1 = (northwestColor1 + southwestColor1) >> 1;
                color2 = (northwestColor2 + southwestColor2) >> 1;
            } else if (type == 13) {
                x = sceneX + QUARTER;
                z = sceneZ + QUARTER;
                y = southwestY;
                color1 = southwestColor1;
                color2 = southwestColor2;
            } else if (type == 14) {
                x = sceneX + THREE_QUARTER;
                z = sceneZ + QUARTER;
                y = southeastY;
                color1 = southeastColor1;
                color2 = southeastColor2;
            } else if (type == 15) {
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

        let paths: number[] = TileOverlay.SHAPE_PATHS[shape];
        let triangleCount: number = paths.length / 4;
        this.triangleVertexA = new Array<number>(triangleCount).fill(0);
        this.triangleVertexB = new Array<number>(triangleCount).fill(0);
        this.triangleVertexC = new Array<number>(triangleCount).fill(0);
        this.triangleColorA = new Array<number>(triangleCount).fill(0);
        this.triangleColorB = new Array<number>(triangleCount).fill(0);
        this.triangleColorC = new Array<number>(triangleCount).fill(0);

        if (textureId != -1) {
            this.triangleTextureIds = new Array<number>(triangleCount).fill(0);
        }

        let index: number = 0;
        for (let t = 0; t < triangleCount; t++) {
            let color: number = paths[index];
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

            if (color == 0) {
                this.triangleColorA[t] = primaryColors[a];
                this.triangleColorB[t] = primaryColors[b];
                this.triangleColorC[t] = primaryColors[c];

                if (this.triangleTextureIds != null) {
                    this.triangleTextureIds[t] = -1;
                }
            } else {
                this.triangleColorA[t] = secondaryColors[a];
                this.triangleColorB[t] = secondaryColors[b];
                this.triangleColorC[t] = secondaryColors[c];

                if (this.triangleTextureIds != null) {
                    this.triangleTextureIds[t] = textureId;
                }
            }
        }
    }
}
