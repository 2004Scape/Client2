import Draw3D from '../graphics/Draw3D';
import FloType from '../config/FloType';
import Packet from '../io/Packet';
import World3D from './World3D';

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

        this.blendChroma = new Array(this.maxTileZ).fill(0);
        this.blendSaturation = new Array(this.maxTileZ).fill(0);
        this.blendLightness = new Array(this.maxTileZ).fill(0);
        this.blendLuminance = new Array(this.maxTileZ).fill(0);
        this.blendMagnitude = new Array(this.maxTileZ).fill(0);
    }

    static perlin = (x: number, z: number): number => {
        let value: number = this.perlinNoise(x + 45365, z + 91923, 4) + ((this.perlinNoise(x + 10294, z + 37821, 2) - 128) >> 1) + ((this.perlinNoise(x, z, 1) - 128) >> 2);
        value = value * 0.3 + 35;
        if (value < 10) {
            value = 10;
        } else if (value > 60) {
            value = 60;
        }
        return value;
    };

    private static perlinNoise = (x: number, z: number, scale: number): number => {
        let intX: number = x / scale;
        let fracX: number = x & (scale - 1);
        let intZ: number = z / scale;
        let fracZ: number = z & (scale - 1);
        let v1: number = this.smoothNoise(intX, intZ);
        let v2: number = this.smoothNoise(intX + 1, intZ);
        let v3: number = this.smoothNoise(intX, intZ + 1);
        let v4: number = this.smoothNoise(intX + 1, intZ + 1);
        let i1: number = this.interpolate(v1, v2, fracX, scale);
        let i2: number = this.interpolate(v3, v4, fracX, scale);
        return this.interpolate(i1, i2, fracZ, scale);
    };

    private static interpolate = (a: number, b: number, x: number, scale: number): number => {
        let f = (65536 - Draw3D.cos[(x * 1024) / scale]) >> 1;
        return ((a * (65536 - f)) >> 16) + ((b * f) >> 16);
    };

    private static smoothNoise = (x: number, y: number): number => {
        let corners: number = this.noise(x - 1, y - 1) + this.noise(x + 1, y - 1) + this.noise(x - 1, y + 1) + this.noise(x + 1, y + 1);
        let sides: number = this.noise(x - 1, y) + this.noise(x + 1, y) + this.noise(x, y - 1) + this.noise(x, y + 1);
        let center: number = this.noise(x, y);
        return corners / 16 + sides / 8 + center / 4;
    };

    private static noise = (x: number, y: number): number => {
        let n: number = x + y * 57;
        let n1: number = (n << 13) ^ n;
        let n2 = (n1 * (n1 * n1 * 15731 + 789221) + 1376312589) & 2147483647;
        return (n2 >> 19) & 0xff;
    };

    clearLandscape = (startX: number, startZ: number, endX: number, endZ: number): void => {
        let waterOverlay: number = 0;
        for (let i = 0; i < FloType.count; i++) {
            if (FloType.instances[i].name?.toLowerCase() == 'water') {
                waterOverlay = i + 1;
                break;
            }
        }
        for (let z = startX; z < startX + endX; z++) {
            for (let x = startZ; x < startZ + endZ; x++) {
                if (x >= 0 && x < this.maxTileX && z >= 0 && z < this.maxTileZ) {
                    this.levelTileOverlayIds[0][x][z] = waterOverlay;
                    for (let level = 0; level < 4; level++) {
                        this.levelHeightmap[level][x][z] = 0;
                        this.levelTileFlags[level][x][z] = 0;
                    }
                }
            }
        }
    };

    readLandscape = (originX: number, originZ: number, offsetX: number, offsetZ: number, src: number[]): void => {
        let buf = new Packet(Uint8Array.from(src));
        for (let level = 0; level < 4; level++) {
            for (let x = 0; x < 64; x++) {
                for (let z = 0; z < 64; z++) {
                    let stx: number = x + offsetX;
                    let stz: number = z + offsetZ;
                    let opcode: number;

                    if (stx >= 0 && stx < 104 && stz >= 0 && stz < 104) {
                        this.levelTileFlags[level][stx][stz] = 0;
                        while (true) {
                            opcode = buf.g1;
                            if (opcode == 0) {
                                if (level == 0) {
                                    this.levelHeightmap[0][stx][stz] = -World.perlin(stx + originX + 932731, stz + 556238 + originZ) * 8;
                                } else {
                                    this.levelHeightmap[level][stx][stz] = this.levelHeightmap[level - 1][stx][stz] - 240;
                                }
                                break;
                            }
                            if (opcode == 1) {
                                let height = buf.g1;
                                if (height == 1) {
                                    height = 0;
                                }
                                if (level == 0) {
                                    this.levelHeightmap[0][stx][stz] = -height * 8;
                                } else {
                                    this.levelHeightmap[level][stx][stz] = this.levelHeightmap[level - 1][stx][stz] - height * 8;
                                }
                                break;
                            }
                            if (opcode <= 49) {
                                this.levelTileOverlayIds[level][stx][stz] = buf.g1b;
                                this.levelTileOverlayShape[level][stx][stz] = (opcode - 2) / 4;
                                this.levelTileOverlayRotation[level][stx][stz] = (opcode - 2) & 0x3;
                            } else if (opcode <= 81) {
                                this.levelTileFlags[level][stx][stz] = opcode - 49;
                            } else {
                                this.levelTileUnderlayIds[level][stx][stz] = opcode - 81;
                            }
                        }
                    } else {
                        while (true) {
                            opcode = buf.g1;
                            if (opcode == 0) {
                                break;
                            }
                            if (opcode == 1) {
                                buf.g1;
                                break;
                            }
                            if (opcode <= 49) {
                                buf.g1;
                            }
                        }
                    }
                }
            }
        }
    };

    build = (scene: World3D): void => {
        for (let level = 0; level < 4; level++) {
            for (let x = 0; x < 104; x++) {
                for (let z = 0; z < 104; z++) {
                    if ((this.levelTileFlags[level][x][z] & 0x1) == 1) {
                        let trueLevel: number = level;
                        if ((this.levelTileFlags[1][x][z] & 0x2) == 2) {
                            trueLevel--;
                        }
                        if (trueLevel >= 0) {
                            //TODO set blocked
                        }
                    }
                }
            }
        }
        World.randomHueOffset += Math.random() * 5.0 - 2;
        if (World.randomHueOffset < -8) {
            World.randomHueOffset = -8;
        } else if (World.randomHueOffset > 8) {
            World.randomHueOffset = 8;
        }

        World.randomLightnessOffset += Math.random() * 5.0 - 2;
        if (World.randomLightnessOffset < -16) {
            World.randomLightnessOffset = -16;
        } else if (World.randomLightnessOffset > 16) {
            World.randomLightnessOffset = 16;
        }

        for (let level = 0; level < 4; level++) {
            let shademap: number[][] = this.levelShademap[level];
            let lightAmbient: number = 96;
            let lightAttenuation: number = 768;
            let lightX: number = -50;
            let lightY: number = -10;
            let lightZ: number = -50;
            let lightMag: number = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ);
            let lightMagnitude: number = (lightAttenuation * lightMag) >> 8;
            for (let z = 1; z < this.maxTileZ; z++) {
                for (let x = 1; x < this.maxTileX; x++) {
                    let dx: number = this.levelHeightmap[level][x + 1][z] - this.levelHeightmap[level][x - 1][z];
                    let dz: number = this.levelHeightmap[level][x][z + 1] - this.levelHeightmap[level][x][z - 1];
                    let len: number = Math.sqrt(dx * dx + dz * dz + 65536);
                    let normalX: number = (dx << 8) / len;
                    let normalY: number = 65536 / len;
                    let normalZ: number = (dz << 8) / len;
                    let light: number = lightAmbient + (lightX * normalX + lightY * normalY + lightZ * normalZ) / lightMagnitude;
                    let shade: number = (shademap[x - 1][z] >> 2) + (shademap[x + 1][z] >> 3) + (shademap[x][z - 1] >> 2) + (shademap[x][z + 1] >> 3) + (shademap[x][z] >> 1);
                    this.levelLightmap[x][z] = light - shade;
                    //TODO do it all later because im gonna cry
                }
            }
        }
    };
}
