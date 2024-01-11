export default class World {
    static lowMemory: boolean = true;
    static levelBuilt: number = 0;
    static fullbright: boolean = false;
    private readonly maxTileX: number = 0;
    private readonly maxTileZ: number = 0;
    private readonly levelHeightmap: number[][][] = [];
    private readonly levelTileFlags: number[][][] = [];
    private readonly levelTileUnderlayIds: number[][][] = [];
    private readonly levelTileOverlayIds: number[][][] = [];
    private readonly levelTileOverlayShape: number[][][] = [];
    private readonly levelTileOverlayRotation: number[][][] = [];
    private readonly levelShademap: number[][][] = [];
    private readonly levelLightmap: number[][] = [];
    private readonly blendChroma: number[] = [];
    private readonly blendSaturation: number[] = [];
    private readonly blendLightness: number[] = [];
    private readonly blendLuminance: number[] = [];
    private readonly blendMagnitude: number[] = [];
    private readonly levelOccludemap: number[][][] = [];
    static readonly ROTATION_WALL_TYPE: number[] = [1, 2, 4, 8];
    static readonly ROTATION_WALL_CORNER_TYPE: number[] = [16, 32, 64, 128];
    static readonly WALL_DECORATION_ROTATION_FORWARD_X: number[] = [1, 0, -1, 0];
    static readonly WALL_DECORATION_ROTATION_FORWARD_Z: number[] = [0, -1, 0, 1];
    static randomHueOffset: number = Math.random() * 17.0 - 8;
    static randomLightnessOffset: number = Math.random() * 33.0 - 16;

    constructor(maxTileX: number, maxTileZ: number, levelHeightmap: number[][][], levelTileFlags: number[][][]) {
        this.maxTileX = maxTileX;
        this.maxTileZ = maxTileZ;
        this.levelHeightmap = levelHeightmap;
        this.levelTileFlags = levelTileFlags;

        this.levelTileUnderlayIds = Array.from({length: 4}, () => Array.from({length: this.maxTileX}, () => new Array(this.maxTileZ).fill(0)));
        this.levelTileOverlayIds = Array.from({length: 4}, () => Array.from({length: this.maxTileX}, () => new Array(this.maxTileZ).fill(0)));
        this.levelTileOverlayShape = Array.from({length: 4}, () => Array.from({length: this.maxTileX}, () => new Array(this.maxTileZ).fill(0)));
        this.levelTileOverlayRotation = Array.from({length: 4}, () => Array.from({length: this.maxTileX}, () => new Array(this.maxTileZ).fill(0)));

        this.levelOccludemap = Array.from({length: 4}, () => Array.from({length: this.maxTileX + 1}, () => new Array(this.maxTileZ + 1).fill(0)));
        this.levelShademap = Array.from({length: 4}, () => Array.from({length: this.maxTileX + 1}, () => new Array(this.maxTileZ + 1).fill(0)));
        this.levelLightmap = Array.from({length: this.maxTileX + 1}, () => new Array(this.maxTileZ + 1).fill(0));
    }
}
