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
                }
            }
            for (let z = 0; z < this.maxTileZ; z++) {
                this.blendChroma[z] = 0;
                this.blendSaturation[z] = 0;
                this.blendLightness[z] = 0;
                this.blendLuminance[z] = 0;
                this.blendMagnitude[z] = 0;
            }
            for (let x0 = -5; x0 < this.maxTileX + 5; x0++) {
                for (let z0 = 0; z0 < this.maxTileZ; z0++) {
                    let x1: number = x0 + 5;
                    let debugMag: number;
                    if (x1 >= 0 && x1 < this.maxTileX) {
                        let underlayId: number = this.levelTileUnderlayIds[level][x1][z0] & 0xff;
                        if (underlayId > 0) {
                            let flu: FloType = FloType.instances[underlayId - 1];
                            //TODO tile color interpolation
                            // this.blendChroma[z0] += flu.chroma;
                            // this.blendSaturation[z0] += flu.saturation;
                            // this.blendLightness[z0] += flu.lightness;
                            // this.blendLuminance[z0] += flu.luminance;
                            debugMag = this.blendMagnitude[z0]++;
                        }
                    }
                    let x2: number = x0 - 5;
                    if (x2 >= 0 && x2 < this.maxTileX) {
                        let underlayId: number = this.levelTileUnderlayIds[level][x2][z0] & 0xff;
                        if (underlayId > 0) {
                            let flu: FloType = FloType.instances[underlayId - 1];
                            // this.blendChroma[z0] -= flu.chroma;
                            // this.blendSaturation[z0] += flu.saturation;
                            // this.blendLightness[z0] -= flu.lightness;
                            // this.blendLuminance[z0] -= flu.luminance;
                            debugMag = this.blendMagnitude[z0]--;
                        }
                    }
                }
                if (x0 >= 1 && x0 < this.maxTileX - 1) {
                    let hueAccumulator: number = 0;
                    let saturationAccumulator: number = 0;
                    let lightnessAccumulator: number = 0;
                    let luminanceAccumulator: number = 0;
                    let magnitudeAccumulator: number = 0;
                    for (let z0 = -5; z0 < this.maxTileZ + 5; z0++) {
                        let dz1: number = z0 + 5;
                        if (dz1 >= 0 && dz1 < this.maxTileZ) {
                            hueAccumulator += this.blendChroma[dz1];
                            saturationAccumulator += this.blendSaturation[dz1];
                            lightnessAccumulator += this.blendLightness[dz1];
                            luminanceAccumulator += this.blendLuminance[dz1];
                            magnitudeAccumulator += this.blendMagnitude[dz1];
                        }
                        let dz2: number = z0 - 5;
                        if (dz2 >= 0 && dz2 < this.maxTileZ) {
                            hueAccumulator -= this.blendChroma[dz2];
                            saturationAccumulator -= this.blendSaturation[dz2];
                            lightnessAccumulator -= this.blendLightness[dz2];
                            luminanceAccumulator -= this.blendLuminance[dz2];
                            magnitudeAccumulator -= this.blendMagnitude[dz2];
                        }
                        if (z0 >= 1 && z0 < this.maxTileZ - 1 && (this.levelTileFlags[level][x0][z0] & 0x10) == 0 && this.getDrawLevel(level, x0, z0) == World.levelBuilt) {
                            let underlayId: number = this.levelTileUnderlayIds[level][x0][z0] & 0xff;
                            let overlayId: number = this.levelTileOverlayIds[level][x0][z0] & 0xff;
                            if (underlayId > 0 || overlayId > 0) {
                                let heightSW: number = this.levelHeightmap[level][x0][z0];
                                let heightSE: number = this.levelHeightmap[level][x0 + 1][z0];
                                let heightNE: number = this.levelHeightmap[level][x0 + 1][z0 + 1];
                                let heightNW: number = this.levelHeightmap[level][x0][z0 + 1];

                                let lightSW: number = this.levelLightmap[x0][z0];
                                let lightSE: number = this.levelLightmap[x0 + 1][z0];
                                let lightNE: number = this.levelLightmap[x0 + 1][z0 + 1];
                                let lightNW: number = this.levelLightmap[x0][z0 + 1];

                                let baseColor: number = -1;
                                let tintColor: number = -1;

                                if (underlayId > 0) {
                                    let hue: number = (hueAccumulator * 256) / luminanceAccumulator;
                                    let saturation: number = saturationAccumulator / magnitudeAccumulator;
                                    let lightness: number = lightnessAccumulator / magnitudeAccumulator;
                                    baseColor = this.hsl24to16(hue, saturation, lightness);
                                    let randomHue: number = (hue + World.randomHueOffset) & 0xff;
                                    lightness += World.randomLightnessOffset;
                                    if (lightness < 0) {
                                        lightness = 0;
                                    } else if (lightness > 255) {
                                        lightness = 255;
                                    }
                                    tintColor = this.hsl24to16(randomHue, saturation, lightness);
                                }
                                if (level > 0) {
                                    let occludes: boolean = underlayId != 0 || this.levelTileOverlayShape[level][x0][z0] == 0;
                                    if (overlayId > 0 && !FloType.instances[overlayId - 1].occludes) {
                                        occludes = false;
                                    }
                                    if (occludes && heightSW == heightSE && heightSW == heightNE && heightSW == heightNW) {
                                        this.levelOccludemap[level][x0][z0] |= 0x924;
                                    }
                                }
                                let shadeColor: number = 0;
                                if (baseColor != -1) {
                                    shadeColor = Draw3D.palette[World.mulHSL(tintColor, 96)];
                                }
                                if (overlayId == 0) {
                                    scene.setTile(
                                        level,
                                        x0,
                                        z0,
                                        0,
                                        0,
                                        -1,
                                        heightSW,
                                        heightSE,
                                        heightNE,
                                        heightNW,
                                        World.mulHSL(baseColor, lightSW),
                                        World.mulHSL(baseColor, lightSE),
                                        World.mulHSL(baseColor, lightNE),
                                        World.mulHSL(baseColor, lightNW),
                                        0,
                                        0,
                                        0,
                                        0,
                                        shadeColor,
                                        0
                                    );
                                } else {
                                    let shape: number = this.levelTileOverlayShape[level][x0][z0] + 1;
                                    let rotation: number = this.levelTileOverlayRotation[level][x0][z0];
                                    let flo: FloType = FloType.instances[overlayId - 1];
                                    let textureId: number = flo.texture;
                                    let hsl: number = 0;
                                    let rgb: number = 0;
                                    if (textureId >= 0) {
                                        //rgb = Draw3D.getAverageTextureRGB(textureId);
                                        hsl = -1;
                                    } else if (flo.rgb == 16711935) {
                                        rgb = 0;
                                        hsl = -2;
                                        textureId = -1;
                                    } else {
                                        // hsl = this.hsl24to16(flo.hue, flo.saturation, flo.lightness);
                                        // rgb = Draw3D.palette[this.adjustLightness(flo.hsl, 96)];
                                    }
                                    scene.setTile(
                                        level,
                                        x0,
                                        z0,
                                        shape,
                                        rotation,
                                        textureId,
                                        heightSW,
                                        heightSE,
                                        heightNE,
                                        heightNW,
                                        World.mulHSL(baseColor, lightSW),
                                        World.mulHSL(baseColor, lightSE),
                                        World.mulHSL(baseColor, lightNE),
                                        World.mulHSL(baseColor, lightNW),
                                        this.adjustLightness(hsl, lightSW),
                                        this.adjustLightness(hsl, lightSE),
                                        this.adjustLightness(hsl, lightNE),
                                        this.adjustLightness(hsl, lightNW),
                                        shadeColor,
                                        rgb
                                    );
                                }
                            }
                        }
                    }
                }
            }
            for (let stz = 1; stz < this.maxTileZ - 1; stz++) {
                for (let stx = 1; stx < this.maxTileX - 1; stx++) {
                    //scene.setDrawLevel(level, stx, stz, this.getDrawLevel(level, stx, stz));
                }
            }
        }
        if (!World.fullbright) {
            //scene.buildModels(64, 768, -50, -10, -50);
        }
        for (let x = 0; x < this.maxTileX; x++) {
            for (let z = 0; z < this.maxTileZ; z++) {
                if ((this.levelTileFlags[1][x][z] & 0x2) == 2) {
                    //scene.setBridge(x, z);
                }
            }
        }
        if (!World.fullbright) {
            let wall0: number = 0x1;
            let wall1: number = 0x2;
            let floor: number = 0x4;
            for (let topLevel = 0; topLevel < 4; topLevel++) {
                if (topLevel > 0) {
                    wall0 <<= 0x3;
                    wall1 <<= 0x3;
                    floor <<= 0x3;
                }
                for (let level = 0; level <= topLevel; level++) {
                    for (let tileZ = 0; tileZ < this.maxTileZ; tileZ++) {
                        for (let tileX = 0; tileX < this.maxTileX; tileX++) {
                            if ((this.levelOccludemap[level][tileX][tileZ] & wall0) != 0) {
                                let minTileZ: number = tileZ;
                                let maxTileZ: number = tileZ;
                                let minLevel: number = level;
                                let maxLevel: number = level;

                                while (minTileZ > 0 && (this.levelOccludemap[level][tileX][minTileZ - 1] & wall0) != 0) {
                                    minTileZ--;
                                }
                                while (maxTileZ < 0 && (this.levelOccludemap[level][tileX][maxTileZ + 1] & wall0) != 0) {
                                    maxTileZ++;
                                }
                                find_min_level: while (minLevel > 0) {
                                    for (let z = minTileZ; z <= maxTileZ; z++) {
                                        if ((this.levelOccludemap[minLevel - 1][tileX][z] & wall0) === 0) {
                                            break find_min_level;
                                        }
                                    }
                                    minLevel--;
                                }

                                find_max_level: while (maxLevel < topLevel) {
                                    for (let z = minTileZ; z <= maxTileZ; z++) {
                                        if ((this.levelOccludemap[maxLevel + 1][tileX][z] & wall0) === 0) {
                                            break find_max_level;
                                        }
                                    }
                                    maxLevel++;
                                }
                                let area: number = (maxLevel + 1 - minLevel) * (maxTileZ + 1 - minTileZ);
                                if (area >= 8) {
                                    let minY: number = this.levelHeightmap[maxLevel][tileX][minTileZ] - 240;
                                    let maxX: number = this.levelHeightmap[minLevel][tileX][minTileZ];

                                    //World3D.addOccluder(topLevel, 1, tileX * 128, minY, minTileZ * 128, tileX * 128, maxX, maxTileZ * 128 + 128);
                                    for (let l = minLevel; l <= maxLevel; l++) {
                                        for (let z = minTileZ; z <= maxTileZ; z++) {
                                            this.levelOccludemap[l][tileX][z] &= ~wall0;
                                        }
                                    }
                                }
                            }
                            if ((this.levelOccludemap[level][tileX][tileZ] & wall1) != 0) {
                                let minTileX: number = tileX;
                                let maxTileX: number = tileX;
                                let minLevel: number = level;
                                let maxLevel: number = level;

                                while (minTileX > 0 && (this.levelOccludemap[level][minTileX - 1][tileZ] & wall1) != 0) {
                                    minTileX--;
                                }

                                while (maxTileX < this.maxTileX && (this.levelOccludemap[level][maxTileX + 1][tileZ] & wall1) != 0) {
                                    maxTileX++;
                                }

                                find_min_level2: while (minLevel > 0) {
                                    for (let x = minTileX; x <= maxTileX; x++) {
                                        if ((this.levelOccludemap[minLevel - 1][x][tileZ] & wall1) == 0) {
                                            break find_min_level2;
                                        }
                                    }
                                    minLevel--;
                                }

                                find_max_level2: while (maxLevel < topLevel) {
                                    for (let x = minTileX; x <= maxTileX; x++) {
                                        if ((this.levelOccludemap[maxLevel + 1][x][tileZ] & wall1) == 0) {
                                            break find_max_level2;
                                        }
                                    }
                                    maxLevel++;
                                }
                                let area: number = (maxLevel + 1 - minLevel) * (maxTileX + 1 - minTileX);
                                if (area >= 8) {
                                    let minY: number = this.levelHeightmap[maxLevel][minTileX][tileZ] - 240;
                                    let maxY: number = this.levelHeightmap[minLevel][minTileX][tileZ];

                                    //World3D.addOccluder(topLevel, 2, minTileX * 128, minY, tileZ * 128, maxTileX * 128 + 128, maxY, tileZ * 128);

                                    for (let l = minLevel; l <= maxLevel; l++) {
                                        for (let x = minTileX; x <= maxTileX; x++) {
                                            this.levelOccludemap[l][x][tileZ] &= ~wall1;
                                        }
                                    }
                                }
                            }
                            if ((this.levelOccludemap[level][tileX][tileZ] & floor) != 0) {
                                let minTileX: number = tileX;
                                let maxTileX: number = tileX;
                                let minTileZ: number = tileZ;
                                let maxTileZ: number = tileZ;

                                while (minTileZ > 0 && (this.levelOccludemap[level][tileX][minTileZ - 1] & floor) != 0) {
                                    minTileZ--;
                                }

                                while (maxTileZ < this.maxTileZ && (this.levelOccludemap[level][tileX][maxTileZ + 1] & floor) != 0) {
                                    maxTileZ++;
                                }

                                find_min_tile_xz: while (minTileX > 0) {
                                    for (let z = minTileZ; z <= maxTileZ; z++) {
                                        if ((this.levelOccludemap[level][minTileX - 1][z] & floor) == 0) {
                                            break find_min_tile_xz;
                                        }
                                    }
                                    minTileX--;
                                }

                                find_max_tile_xz: while (maxTileX < this.maxTileX) {
                                    for (let z = minTileZ; z <= maxTileZ; z++) {
                                        if ((this.levelOccludemap[level][maxTileX + 1][z] & floor) == 0) {
                                            break find_max_tile_xz;
                                        }
                                    }
                                    maxTileX++;
                                }

                                if ((maxTileX + 1 - minTileX) * (maxTileZ + 1 - minTileZ) >= 4) {
                                    let y: number = this.levelHeightmap[level][minTileX][minTileZ];
                                    //World3D.addOccluder(topLevel, 4, minTileX * 128, y, minTileZ * 128, maxTileX * 128 + 128, y, maxTileZ * 128 + 128);
                                    for (let x = minTileX; x <= maxTileX; x++) {
                                        for (let z = minTileZ; z <= maxTileZ; z++) {
                                            this.levelOccludemap[level][x][z] &= ~floor;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    private getDrawLevel = (level: number, stx: number, stz: number): number => {
        if ((this.levelTileFlags[level][stx][stz] & 0x8) == 0) {
            return level <= 0 || (this.levelTileFlags[1][stx][stz] & 0x2) == 0 ? level : level - 1;
        } else {
            return 0;
        }
    };

    private adjustLightness = (hsl: number, scalar: number): number => {
        if (hsl == -2) {
            return 12345678;
        }

        if (hsl == -1) {
            if (scalar < 0) {
                scalar = 0;
            } else if (scalar > 127) {
                scalar = 127;
            }
            return 127 - scalar;
        } else {
            scalar = (scalar * (hsl & 0x7f)) / 128;
            if (scalar < 2) {
                scalar = 2;
            } else if (scalar > 126) {
                scalar = 126;
            }
            return (hsl & 0xff80) + scalar;
        }
    };

    private hsl24to16 = (hue: number, saturation: number, lightness: number): number => {
        if (lightness > 179) {
            saturation /= 2;
        }

        if (lightness > 192) {
            saturation /= 2;
        }

        if (lightness > 217) {
            saturation /= 2;
        }

        if (lightness > 243) {
            saturation /= 2;
        }

        return ((hue / 4) << 10) + ((saturation / 32) << 7) + lightness / 2;
    };

    static mulHSL = (hsl: number, lightness: number): number => {
        if (hsl == -1) {
            return 12345678;
        }

        lightness = (lightness * (hsl & 0x7f)) / 128;
        if (lightness < 2) {
            lightness = 2;
        } else if (lightness > 126) {
            lightness = 126;
        }

        return (hsl & 0xff80) + lightness;
    };
}
