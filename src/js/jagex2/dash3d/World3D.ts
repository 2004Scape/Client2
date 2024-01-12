import Draw3D from '../graphics/Draw3D';
import TileUnderlay from './type/TileUnderlay';
import TileOverlay from './type/TileOverlay';
import Tile from './type/Tile';

export default class World3D {
    private static visibilityMatrix: boolean[][][][] = [];
    public static visibilityMap: boolean[][];

    private static viewportLeft: number = 0;
    private static viewportTop: number = 0;
    private static viewportRight: number = 0;
    private static viewportBottom: number = 0;
    private static viewportCenterX: number = 0;
    private static viewportCenterY: number = 0;

    static sinEyePitch: number = 0;
    static cosEyePitch: number = 0;
    static sinEyeYaw: number = 0;
    static cosEyeYaw: number = 0;

    private readonly maxLevel: number = 0;
    private readonly maxTileX: number = 0;
    private readonly maxTileZ: number = 0;
    private readonly levelHeightmaps?: number[][][];
    private readonly levelTiles: (Tile | null)[][][];
    private minLevel: number = 0;
    private temporaryLocCount: number = 0;
    //private temporaryLocs: Loc[] = [];
    private readonly levelTileOcclusionCycles?: number[][][];
    public static tilesRemaining: number = 0;
    public static topLevel: number = 0;
    public static cycle: number = 0;
    public static minDrawTileX: number = 0;
    public static maxDrawTileX: number = 0;
    public static eyeTileX: number = 0;
    public static eyeTileZ: number = 0;
    public static eyeX: number = 0;
    public static eyeY: number = 0;
    public static eyeZ: number = 0;
    //static locBuffer?: Loc[];
    public static readonly WALL_DECORATION_INSET_X: number[] = [53, -53, -53, 53];
    public static readonly WALL_DECORATION_INSET_Z: number[] = [-53, -53, 53, 53];
    public static readonly WALL_DECORATION_OUTSET_X: number[] = [-45, 45, 45, -45];
    public static readonly WALL_DECORATION_OUTSET_Z: number[] = [45, 45, -45, -45];

    public static takingInput: boolean;
    public static mouseX: number;
    public static mouseY: number;
    public static clickTileX: number = -1;
    public static clickTileZ: number = -1;

    public static readonly LEVEL_COUNT: number = 4;
    public static levelOccluderCount: number[] = new Array(World3D.LEVEL_COUNT).fill(0);
    //public static levelOccluders: Occluder[][] = Array.from({ length: YourClassName.LEVEL_COUNT }, () => new Array(500));
    public static activeOccluderCount: number;
    //public static readonly activeOccluders: Occluder[] = new Array(500);
    //public static drawTileQueue: LinkList; // Assuming LinkList is a class or type you have defined
    public static readonly FRONT_WALL_TYPES: number[] = [19, 55, 38, 155, 255, 110, 137, 205, 76];
    public static readonly DIRECTION_ALLOW_WALL_CORNER_TYPE: number[] = [160, 192, 80, 96, 0, 144, 80, 48, 160];
    public static readonly BACK_WALL_TYPES: number[] = [76, 8, 137, 4, 0, 1, 38, 2, 19];
    public static readonly WALL_CORNER_TYPE_16_BLOCK_LOC_SPANS: number[] = [0, 0, 2, 0, 0, 2, 1, 1, 0];
    public static readonly WALL_CORNER_TYPE_32_BLOCK_LOC_SPANS: number[] = [2, 0, 0, 2, 0, 0, 0, 4, 4];
    public static readonly WALL_CORNER_TYPE_64_BLOCK_LOC_SPANS: number[] = [0, 4, 4, 8, 0, 0, 8, 0, 0];
    public static readonly WALL_CORNER_TYPE_128_BLOCK_LOC_SPANS: number[] = [1, 1, 0, 0, 0, 8, 0, 0, 8];
    public static readonly TEXTURE_HSL: number[] = [
        41, 39248, 41, 4643, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 43086, 41, 41, 41, 41, 41, 41, 41, 8602, 41, 28992, 41, 41, 41, 41, 41, 5056, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 3131, 41, 41, 41
    ];
    private readonly mergeIndexA: number[] = new Array(10000).fill(0);
    private readonly mergeIndexB: number[] = new Array(10000).fill(0);
    private tmpMergeIndex: number = 0;

    private readonly MINIMAP_TILE_MASK: number[][] = [
        new Array(16).fill(0),
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1]
    ];
    private readonly MINIMAP_TILE_ROTATION_MAP: number[][] = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [12, 8, 4, 0, 13, 9, 5, 1, 14, 10, 6, 2, 15, 11, 7, 3],
        [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        [3, 7, 11, 15, 2, 6, 10, 14, 1, 5, 9, 13, 0, 4, 8, 12]
    ];

    static {
        this.visibilityMatrix = new Array(8);
        for (let i: number = 0; i < 8; i++) {
            this.visibilityMatrix[i] = new Array(32);
            for (let j: number = 0; j < 32; j++) {
                this.visibilityMatrix[i][j] = new Array(51);
                for (let k: number = 0; k < 51; k++) {
                    this.visibilityMatrix[i][j][k] = new Array(51).fill(false);
                }
            }
        }
    }

    constructor(levelHeightmaps: number[][][], maxTileZ: number, maxLevel: number, maxTileX: number) {
        this.maxLevel = maxLevel;
        this.maxTileX = maxTileX;
        this.maxTileZ = maxTileZ;
        this.levelTiles = Array.from({length: maxLevel}, (_, i): Tile[][] => Array.from({length: maxTileX}, (_, j): Tile[] => Array.from({length: maxTileZ}, (_, k): Tile => new Tile(i, j, k))));
        this.levelTileOcclusionCycles = Array.from({length: maxLevel}, (): number[][] => Array.from({length: maxTileX + 1}, (): number[] => new Array(maxTileZ + 1).fill(0)));
        this.levelHeightmaps = levelHeightmaps;
        this.reset();
    }

    static init = (viewportWidth: number, viewportHeight: number, frustumStart: number, frustumEnd: number, pitchDistance: Int32Array): void => {
        this.viewportLeft = 0;
        this.viewportTop = 0;
        this.viewportRight = viewportWidth;
        this.viewportBottom = viewportHeight;
        this.viewportCenterX = viewportWidth / 2;
        this.viewportCenterY = viewportHeight / 2;

        const matrix: boolean[][][][] = new Array(9);

        for (let i: number = 0; i < 9; i++) {
            matrix[i] = new Array(32);
            for (let j: number = 0; j < 32; j++) {
                matrix[i][j] = new Array(53);
                for (let k: number = 0; k < 53; k++) {
                    matrix[i][j][k] = new Array(53).fill(false);
                }
            }
        }

        for (let pitch: number = 128; pitch <= 384; pitch += 32) {
            for (let yaw: number = 0; yaw < 2048; yaw += 64) {
                this.sinEyePitch = Draw3D.sin[pitch];
                this.cosEyePitch = Draw3D.cos[pitch];
                this.sinEyeYaw = Draw3D.sin[yaw];
                this.cosEyeYaw = Draw3D.cos[yaw];

                const pitchLevel: number = (pitch - 128) / 32;
                const yawLevel: number = yaw / 64;
                for (let dx: number = -26; dx <= 26; dx++) {
                    for (let dz: number = -26; dz <= 26; dz++) {
                        const x: number = dx * 128;
                        const z: number = dz * 128;

                        let visible: boolean = false;
                        for (let y: number = -frustumStart; y <= frustumEnd; y += 128) {
                            if (this.testPoint(x, z, pitchDistance[pitchLevel] + y)) {
                                visible = true;
                                break;
                            }
                        }
                        matrix[pitchLevel][yawLevel][dx + 25 + 1][dz + 25 + 1] = visible;
                    }
                }
            }
        }

        for (let pitchLevel: number = 0; pitchLevel < 8; pitchLevel++) {
            for (let yawLevel: number = 0; yawLevel < 32; yawLevel++) {
                for (let x: number = -25; x < 25; x++) {
                    for (let z: number = -25; z < 25; z++) {
                        let visible: boolean = false;
                        check_areas: for (let dx: number = -1; dx <= 1; dx++) {
                            for (let dz: number = -1; dz <= 1; dz++) {
                                if (matrix[pitchLevel][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel + 1][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel + 1][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }
                            }
                        }
                        this.visibilityMatrix[pitchLevel][yawLevel][x + 25][z + 25] = visible;
                    }
                }
            }
        }
    };

    setMinLevel = (level: number): void => {
        this.minLevel = level;
        for (let stx: number = 0; stx < this.maxTileX; stx++) {
            for (let stz: number = 0; stz < this.maxTileZ; stz++) {
                this.levelTiles[level][stx][stz] = new Tile(level, stx, stz);
            }
        }
    };

    reset = (): void => {
        for (let level: number = 0; level < this.maxLevel; level++) {
            for (let x: number = 0; x < this.maxTileX; x++) {
                for (let z: number = 0; z < this.maxTileZ; z++) {
                    this.levelTiles[level][x][z] = null;
                }
            }
        }

        // for (let l = 0; l < World3D.LEVEL_COUNT; l++) {
        //     for (let o = 0; o < this.levelOccluderCount[l]; o++) {
        //         this.levelOccluders[l][o] = null;
        //     }

        //     this.levelOccluderCount[l] = 0;
        // }

        // for (let i = 0; i < this.temporaryLocCount; i++) {
        //     this.temporaryLocs[i] = null;
        // }

        // this.temporaryLocCount = 0;

        // for (let i = 0; i < this.locBuffer.length; i++) {
        //     this.locBuffer[i] = null;
        // }
    };

    private static testPoint = (x: number, z: number, y: number): boolean => {
        const px: number = (z * this.sinEyeYaw + x * this.cosEyeYaw) >> 16;
        const tmp: number = (z * this.cosEyeYaw - x * this.sinEyeYaw) >> 16;
        const pz: number = (y * this.sinEyePitch + tmp * this.cosEyePitch) >> 16;
        const py: number = (y * this.cosEyePitch - tmp * this.sinEyePitch) >> 16;
        if (pz < 50 || pz > 3500) {
            return false;
        }
        const viewportX: number = this.viewportCenterX + (px << 9) / pz;
        const viewportY: number = this.viewportCenterY + (py << 9) / pz;
        return viewportX >= this.viewportLeft && viewportX <= this.viewportRight && viewportY >= this.viewportTop && viewportY <= this.viewportBottom;
    };

    setTile = (
        level: number,
        x: number,
        z: number,
        shape: number,
        angle: number,
        textureId: number,
        southwestY: number,
        southeastY: number,
        northeastY: number,
        northwestY: number,
        southwestColor: number,
        southeastColor: number,
        northeastColor: number,
        northwestColor: number,
        southwestColor2: number,
        southeastColor2: number,
        northeastColor2: number,
        northwestColor2: number,
        backgroundRgb: number,
        foregroundRgb: number
    ): void => {
        let underlay: TileUnderlay;
        let l: number = 0;
        if (shape == 0) {
            underlay = new TileUnderlay(southwestColor, southeastColor, northeastColor, northwestColor, -1, backgroundRgb, false);
            for (l = level; l >= 0; l--) {
                if (this.levelTiles[l][x][z] == null) {
                    this.levelTiles[l][x][z] = new Tile(l, x, z);
                }
            }
            // this is getting fucky... need to come back to this.
            this.levelTiles[level][x][z]!.underlay = underlay;
        }
        if (shape == 1) {
            underlay = new TileUnderlay(southwestColor2, southeastColor2, northeastColor2, northwestColor2, textureId, foregroundRgb, southwestY == southeastY && southwestY == northeastY && southwestY == northwestY);
            for (l = level; l >= 0; l--) {
                if (this.levelTiles[l][x][z] == null) {
                    this.levelTiles[l][x][z] = new Tile(l, x, z);
                }
            }
            this.levelTiles[level][x][z]!.underlay = underlay;
        } else {
            const overlay: TileOverlay = new TileOverlay(
                x,
                shape,
                southeastColor2,
                southeastY,
                northeastColor,
                angle,
                southwestColor,
                northwestY,
                foregroundRgb,
                southwestColor2,
                textureId,
                northwestColor2,
                backgroundRgb,
                northeastY,
                northeastColor2,
                northwestColor,
                southwestY,
                z,
                southeastColor
            );
            for (l = level; l >= 0; l--) {
                if (this.levelTiles[l][x][z] == null) {
                    this.levelTiles[l][x][z] = new Tile(l, x, z);
                }
            }
            this.levelTiles[level][x][z]!.overlay = overlay;
        }
    };
}
