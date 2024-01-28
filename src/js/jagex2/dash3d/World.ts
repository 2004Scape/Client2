import CollisionMap from './CollisionMap';
import FloType from '../config/FloType';
import Packet from '../io/Packet';
import Draw3D from '../graphics/Draw3D';
import World3D from './World3D';
import LinkList from '../datastruct/LinkList';
import LocType from '../config/LocType';
import Model from '../graphics/Model';
import LocEntity from './entity/LocEntity';
import SeqType from '../config/SeqType';
import LocShape from './LocShape';
import LocAngle from './LocAngle';

export default class World {
    static readonly ROTATION_WALL_TYPE: Int8Array = Int8Array.of(1, 2, 4, 8);
    static readonly ROTATION_WALL_CORNER_TYPE: Int8Array = Int8Array.of(16, 32, 64, 128);
    static readonly WALL_DECORATION_ROTATION_FORWARD_X: Int8Array = Int8Array.of(1, 0, -1, 0);
    static readonly WALL_DECORATION_ROTATION_FORWARD_Z: Int8Array = Int8Array.of(0, -1, 0, 1);

    static randomHueOffset: number = Math.trunc(Math.random() * 17.0) - 8;
    static randomLightnessOffset: number = Math.trunc(Math.random() * 33.0) - 16;

    static lowMemory: boolean = true;
    static levelBuilt: number = 0;
    static fullbright: boolean = false;

    static perlin = (x: number, z: number): number => {
        let value: number = this.perlinScale(x + 45365, z + 91923, 4) + ((this.perlinScale(x + 10294, z + 37821, 2) - 128) >> 1) + ((this.perlinScale(x, z, 1) - 128) >> 2) - 128;
        value = Math.trunc(value * 0.3) + 35;
        if (value < 10) {
            value = 10;
        } else if (value > 60) {
            value = 60;
        }
        return value;
    };

    static perlinScale = (x: number, z: number, scale: number): number => {
        const intX: number = Math.trunc(x / scale);
        const fracX: number = x & (scale - 1);
        const intZ: number = Math.trunc(z / scale);
        const fracZ: number = z & (scale - 1);
        const v1: number = this.smoothNoise(intX, intZ);
        const v2: number = this.smoothNoise(intX + 1, intZ);
        const v3: number = this.smoothNoise(intX, intZ + 1);
        const v4: number = this.smoothNoise(intX + 1, intZ + 1);
        const i1: number = this.interpolate(v1, v2, fracX, scale);
        const i2: number = this.interpolate(v3, v4, fracX, scale);
        return this.interpolate(i1, i2, fracZ, scale);
    };

    static interpolate = (a: number, b: number, x: number, scale: number): number => {
        const f: number = (65536 - Draw3D.cos[Math.trunc((x * 1024) / scale)]) >> 1;
        return ((a * (65536 - f)) >> 16) + ((b * f) >> 16);
    };

    static smoothNoise = (x: number, y: number): number => {
        const corners: number = this.noise(x - 1, y - 1) + this.noise(x + 1, y - 1) + this.noise(x - 1, y + 1) + this.noise(x + 1, y + 1);
        const sides: number = this.noise(x - 1, y) + this.noise(x + 1, y) + this.noise(x, y - 1) + this.noise(x, y + 1);
        const center: number = this.noise(x, y);
        return Math.trunc(corners / 16) + Math.trunc(sides / 8) + Math.trunc(center / 4);
    };

    static noise = (x: number, y: number): number => {
        const n: number = x + y * 57;
        const n1: number = (n << 13) ^ n;
        const n2: bigint = (BigInt(n1) * (BigInt(n1) * BigInt(n1) * 15731n + 789221n) + 1376312589n) & 0x7fffffffn;
        return Number(n2 >> 19n) & 0xff;
    };

    static addLoc = (level: number, x: number, z: number, scene: World3D | null, levelHeightmap: Int32Array[][], locs: LinkList, collision: CollisionMap, locId: number, shape: number, angle: number, trueLevel: number): void => {
        const heightSW: number = levelHeightmap[trueLevel][x][z];
        const heightSE: number = levelHeightmap[trueLevel][x + 1][z];
        const heightNW: number = levelHeightmap[trueLevel][x + 1][z + 1];
        const heightNE: number = levelHeightmap[trueLevel][x][z + 1];
        const y: number = (heightSW + heightSE + heightNW + heightNE) >> 2;

        const loc: LocType = LocType.get(locId);
        let bitset: number = x + (z << 7) + (locId << 14) + 1073741824;
        if (!loc.active) {
            bitset += 0x80000000; // int.min
            // TODO possible some overflow magic happen here idk tho
        }

        const info: number = (angle << 6) + shape;

        if (shape === LocShape.GROUND_DECOR) {
            scene?.addGroundDecoration(loc.getModel(LocShape.GROUND_DECOR, angle, heightSW, heightSE, heightNW, heightNE, -1), level, x, z, y, bitset, info);

            if (loc.blockwalk && loc.active) {
                collision.addFloor(x, z);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 3, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.CENTREPIECE_STRAIGHT || shape === LocShape.CENTREPIECE_DIAGONAL) {
            const model: Model | null = loc.getModel(LocShape.CENTREPIECE_STRAIGHT, angle, heightSW, heightSE, heightNW, heightNE, -1);
            if (model) {
                let yaw: number = 0;
                if (shape === LocShape.CENTREPIECE_DIAGONAL) {
                    yaw += 256;
                }

                let width: number;
                let height: number;
                if (angle === LocAngle.NORTH || angle === LocAngle.SOUTH) {
                    width = loc.length;
                    height = loc.width;
                } else {
                    width = loc.width;
                    height = loc.length;
                }

                scene?.addLoc(level, x, z, y, model, null, bitset, info, width, height, yaw);
            }

            if (loc.blockwalk) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape >= LocShape.ROOF_STRAIGHT) {
            scene?.addLoc(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info, 1, 1, 0);

            if (loc.blockwalk) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_STRAIGHT) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_TYPE[angle], 0, loc.getModel(LocShape.WALL_STRAIGHT, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (loc.blockwalk) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_DIAGONAL_CORNER) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_CORNER_TYPE[angle], 0, loc.getModel(LocShape.WALL_DIAGONAL_CORNER, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (loc.blockwalk) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_L) {
            const offset: number = (angle + 1) & 0x3;

            scene?.addWall(
                level,
                x,
                z,
                y,
                World.ROTATION_WALL_TYPE[angle],
                World.ROTATION_WALL_TYPE[offset],
                loc.getModel(LocShape.WALL_L, angle + 4, heightSW, heightSE, heightNW, heightNE, -1),
                loc.getModel(LocShape.WALL_L, offset, heightSW, heightSE, heightNW, heightNE, -1),
                bitset,
                info
            );

            if (loc.blockwalk) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_SQUARE_CORNER) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_CORNER_TYPE[angle], 0, loc.getModel(LocShape.WALL_SQUARE_CORNER, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (loc.blockwalk) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_DIAGONAL) {
            scene?.addLoc(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info, 1, 1, 0);

            if (loc.blockwalk) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_STRAIGHT_NOOFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle * 512, World.ROTATION_WALL_TYPE[angle]);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_STRAIGHT_OFFSET) {
            let offset: number = 16;
            if (scene) {
                const width: number = scene.getWallBitset(level, x, z);
                if (width > 0) {
                    offset = LocType.get((width >> 14) & 0x7fff).walloff;
                }
            }

            scene?.setWallDecoration(
                level,
                x,
                z,
                y,
                World.WALL_DECORATION_ROTATION_FORWARD_X[angle] * offset,
                World.WALL_DECORATION_ROTATION_FORWARD_Z[angle] * offset,
                bitset,
                loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1),
                info,
                angle * 512,
                World.ROTATION_WALL_TYPE[angle]
            );

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_OFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 256);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_NOOFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 512);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_BOTH) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 768);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        }
    };

    private readonly maxTileX: number;
    private readonly maxTileZ: number;
    private readonly levelHeightmap: Int32Array[][];
    private readonly levelTileFlags: Uint8Array[][];
    private readonly levelTileUnderlayIds: Uint8Array[][];
    private readonly levelTileOverlayIds: Uint8Array[][];
    private readonly levelTileOverlayShape: Uint8Array[][];
    private readonly levelTileOverlayRotation: Uint8Array[][];
    private readonly levelShademap: Uint8Array[][];
    private readonly levelLightmap: Int32Array[];
    private readonly blendChroma: Int32Array;
    private readonly blendSaturation: Int32Array;
    private readonly blendLightness: Int32Array;
    private readonly blendLuminance: Int32Array;
    private readonly blendMagnitude: Int32Array;
    private readonly levelOccludemap: Int32Array[][];

    public constructor(maxTileX: number, maxTileZ: number, levelHeightmap: Int32Array[][], levelTileFlags: Uint8Array[][]) {
        this.maxTileX = maxTileX;
        this.maxTileZ = maxTileZ;
        this.levelHeightmap = levelHeightmap;
        this.levelTileFlags = levelTileFlags;

        this.levelTileUnderlayIds = new Array(CollisionMap.LEVELS).fill(null).map((): Uint8Array[] => new Array(maxTileX + 1).fill(null).map((): Uint8Array => new Uint8Array(maxTileZ + 1)));
        this.levelTileOverlayIds = new Array(CollisionMap.LEVELS).fill(null).map((): Uint8Array[] => new Array(maxTileX + 1).fill(null).map((): Uint8Array => new Uint8Array(maxTileZ + 1)));
        this.levelTileOverlayShape = new Array(CollisionMap.LEVELS).fill(null).map((): Uint8Array[] => new Array(maxTileX + 1).fill(null).map((): Uint8Array => new Uint8Array(maxTileZ + 1)));
        this.levelTileOverlayRotation = new Array(CollisionMap.LEVELS).fill(null).map((): Uint8Array[] => new Array(maxTileX + 1).fill(null).map((): Uint8Array => new Uint8Array(maxTileZ + 1)));

        this.levelOccludemap = new Array(CollisionMap.LEVELS).fill(null).map((): Int32Array[] => new Array(maxTileX + 1).fill(null).map((): Int32Array => new Int32Array(maxTileZ + 1)));
        this.levelShademap = new Array(CollisionMap.LEVELS).fill(null).map((): Uint8Array[] => new Array(maxTileX + 1).fill(null).map((): Uint8Array => new Uint8Array(maxTileZ + 1)));
        this.levelLightmap = new Array(maxTileX + 1).fill(null).map((): Int32Array => new Int32Array(maxTileZ + 1));

        this.blendChroma = new Int32Array(maxTileZ);
        this.blendSaturation = new Int32Array(maxTileZ);
        this.blendLightness = new Int32Array(maxTileZ);
        this.blendLuminance = new Int32Array(maxTileZ);
        this.blendMagnitude = new Int32Array(maxTileZ);
    }

    build = (scene: World3D | null, collision: (CollisionMap | null)[]): void => {
        for (let level: number = 0; level < 4; level++) {
            for (let x: number = 0; x < 104; x++) {
                for (let z: number = 0; z < 104; z++) {
                    // solid
                    if ((this.levelTileFlags[level][x][z] & 0x1) == 1) {
                        let trueLevel: number = level;

                        // bridge
                        if ((this.levelTileFlags[1][x][z] & 0x2) == 2) {
                            trueLevel--;
                        }

                        if (trueLevel >= 0) {
                            collision[trueLevel]?.addFloor(x, z);
                        }
                    }
                }
            }
        }

        World.randomHueOffset += Math.trunc(Math.random() * 5.0) - 2;
        if (World.randomHueOffset < -8) {
            World.randomHueOffset = -8;
        } else if (World.randomHueOffset > 8) {
            World.randomHueOffset = 8;
        }

        World.randomLightnessOffset += Math.trunc(Math.random() * 5.0) - 2;
        if (World.randomLightnessOffset < -16) {
            World.randomLightnessOffset = -16;
        } else if (World.randomLightnessOffset > 16) {
            World.randomLightnessOffset = 16;
        }

        for (let level: number = 0; level < 4; level++) {
            // TODO
        }
    };

    clearLandscape = (startX: number, startZ: number, endX: number, endZ: number): void => {
        let waterOverlay: number = 0;
        for (let i: number = 0; i < FloType.count; i++) {
            if (FloType.instances[i].name?.toLowerCase() === 'water') {
                waterOverlay = i + 1;
                break;
            }
        }

        for (let z: number = startX; z < startX + endX; z++) {
            for (let x: number = startZ; x < startZ + endZ; x++) {
                if (x >= 0 && x < this.maxTileX && z >= 0 && z < this.maxTileZ) {
                    this.levelTileOverlayIds[0][x][z] = waterOverlay;

                    for (let level: number = 0; level < 4; level++) {
                        this.levelHeightmap[level][x][z] = 0;
                        this.levelTileFlags[level][x][z] = 0;
                    }
                }
            }
        }
    };

    readLandscape = (originX: number, originZ: number, xOffset: number, zOffset: number, src: Int8Array): void => {
        const buf: Packet = new Packet(new Uint8Array(src));

        for (let level: number = 0; level < CollisionMap.LEVELS; level++) {
            for (let x: number = 0; x < 64; x++) {
                for (let z: number = 0; z < 64; z++) {
                    const stx: number = x + xOffset;
                    const stz: number = z + zOffset;
                    let opcode: number;

                    if (stx >= 0 && stx < CollisionMap.SIZE && stz >= 0 && stz < CollisionMap.SIZE) {
                        this.levelTileFlags[level][stx][stz] = 0;
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            opcode = buf.g1;
                            if (opcode === 0) {
                                if (level === 0) {
                                    this.levelHeightmap[0][stx][stz] = -World.perlin(stx + originX + 932731, stz + 556238 + originZ) * 8;
                                } else {
                                    this.levelHeightmap[level][stx][stz] = this.levelHeightmap[level - 1][stx][stz] - 240;
                                }
                                break;
                            }

                            if (opcode === 1) {
                                let height: number = buf.g1;
                                if (height === 1) {
                                    height = 0;
                                }
                                if (level === 0) {
                                    this.levelHeightmap[0][stx][stz] = -height * 8;
                                } else {
                                    this.levelHeightmap[level][stx][stz] = this.levelHeightmap[level - 1][stx][stz] - height * 8;
                                }
                                break;
                            }

                            if (opcode <= 49) {
                                this.levelTileOverlayIds[level][stx][stz] = buf.g1b;
                                this.levelTileOverlayShape[level][stx][stz] = Math.trunc((opcode - 2) / 4);
                                this.levelTileOverlayRotation[level][stx][stz] = (opcode - 2) & 0x3;
                            } else if (opcode <= 81) {
                                this.levelTileFlags[level][stx][stz] = opcode - 49;
                            } else {
                                this.levelTileUnderlayIds[level][stx][stz] = opcode - 81;
                            }
                        }
                    } else {
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            opcode = buf.g1;
                            if (opcode === 0) {
                                break;
                            }

                            if (opcode === 1) {
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

    readLocs = (scene: World3D | null, locs: LinkList, collision: (CollisionMap | null)[], src: Int8Array, xOffset: number, zOffset: number): void => {
        const buf: Packet = new Packet(new Uint8Array(src));
        let locId: number = -1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const deltaId: number = buf.gsmarts;
            if (deltaId === 0) {
                return;
            }

            locId += deltaId;

            let locPos: number = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const deltaPos: number = buf.gsmarts;
                if (deltaPos === 0) {
                    break;
                }

                locPos += deltaPos - 1;
                const z: number = locPos & 0x3f;
                const x: number = (locPos >> 6) & 0x3f;
                const level: number = locPos >> 12;

                const info: number = buf.g1;
                const shape: number = info >> 2;
                const rotation: number = info & 0x3;
                const stx: number = x + xOffset;
                const stz: number = z + zOffset;

                if (stx > 0 && stz > 0 && stx < CollisionMap.SIZE - 1 && stz < CollisionMap.SIZE - 1) {
                    let currentLevel: number = level;
                    if ((this.levelTileFlags[1][stx][stz] & 0x2) === 2) {
                        currentLevel = level - 1;
                    }

                    let collisionMap: CollisionMap | null = null;
                    if (currentLevel >= 0) {
                        collisionMap = collision[currentLevel];
                    }

                    this.addLoc(level, stx, stz, scene, locs, collisionMap, locId, shape, rotation);
                }
            }
        }
    };

    private addLoc = (level: number, x: number, z: number, scene: World3D | null, locs: LinkList, collision: CollisionMap | null, locId: number, shape: number, angle: number): void => {
        if (World.lowMemory) {
            if ((this.levelTileFlags[level][x][z] & 0x10) !== 0) {
                return;
            }

            /*if (this.getDrawLevel(level, x, z) !== levelBuilt) {
                return;
            }*/
        }

        const heightSW: number = this.levelHeightmap[level][x][z];
        const heightSE: number = this.levelHeightmap[level][x + 1][z];
        const heightNW: number = this.levelHeightmap[level][x + 1][z + 1];
        const heightNE: number = this.levelHeightmap[level][x][z + 1];
        const y: number = (heightSW + heightSE + heightNW + heightNE) >> 2;

        const loc: LocType = LocType.get(locId);
        let bitset: number = x + (z << 7) + (locId << 14) + 0x40000000;
        if (!loc.active) {
            bitset += 0x80000000; // int.min
            // TODO possible some overflow magic happen here idk tho
        }

        const info: number = (angle << 6) + shape;

        if (shape === LocShape.GROUND_DECOR) {
            if (!World.lowMemory || loc.active || loc.forcedecor) {
                scene?.addGroundDecoration(loc.getModel(LocShape.GROUND_DECOR, angle, heightSW, heightSE, heightNW, heightNE, -1), level, x, z, y, bitset, info);

                if (loc.blockwalk && loc.active && collision) {
                    collision.addFloor(x, z);
                }

                if (loc.anim !== -1) {
                    locs.pushBack(new LocEntity(locId, level, 3, x, z, SeqType.instances[loc.anim], true));
                }
            }
        } else if (shape === LocShape.CENTREPIECE_STRAIGHT || shape === LocShape.CENTREPIECE_DIAGONAL) {
            const model: Model | null = loc.getModel(LocShape.CENTREPIECE_STRAIGHT, angle, heightSW, heightSE, heightNW, heightNE, -1);
            if (model) {
                let yaw: number = 0;
                if (shape === LocShape.CENTREPIECE_DIAGONAL) {
                    yaw += 256;
                }

                let width: number;
                let height: number;
                if (angle === LocAngle.NORTH || angle === LocAngle.SOUTH) {
                    width = loc.length;
                    height = loc.width;
                } else {
                    width = loc.width;
                    height = loc.length;
                }

                if (scene?.addLoc(level, x, z, y, model, null, bitset, info, width, height, yaw) && loc.shadow) {
                    for (let dx: number = 0; dx <= width; dx++) {
                        for (let dz: number = 0; dz <= height; dz++) {
                            let shade: number = Math.trunc(model.radius / 4);
                            if (shade > 30) {
                                shade = 30;
                            }

                            if (shade > this.levelShademap[level][x + dx][z + dz]) {
                                this.levelShademap[level][x + dx][z + dz] = shade;
                            }
                        }
                    }
                }
            }

            if (loc.blockwalk && collision) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape >= LocShape.ROOF_STRAIGHT) {
            scene?.addLoc(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info, 1, 1, 0);

            if (shape >= LocShape.ROOF_STRAIGHT && shape <= LocShape.ROOF_FLAT && shape !== LocShape.ROOF_DIAGONAL_WITH_ROOFEDGE && level > 0) {
                this.levelOccludemap[level][x][z] |= 0x924;
            }

            if (loc.blockwalk && collision) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_STRAIGHT) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_TYPE[angle], 0, loc.getModel(LocShape.WALL_STRAIGHT, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (angle === LocAngle.WEST) {
                if (loc.shadow) {
                    this.levelShademap[level][x][z] = 50;
                    this.levelShademap[level][x][z + 1] = 50;
                }

                if (loc.occlude) {
                    this.levelOccludemap[level][x][z] |= 0x249;
                }
            } else if (angle === LocAngle.NORTH) {
                if (loc.shadow) {
                    this.levelShademap[level][x][z + 1] = 50;
                    this.levelShademap[level][x + 1][z + 1] = 50;
                }

                if (loc.occlude) {
                    this.levelOccludemap[level][x][z + 1] |= 0x492;
                }
            } else if (angle === LocAngle.EAST) {
                if (loc.shadow) {
                    this.levelShademap[level][x + 1][z] = 50;
                    this.levelShademap[level][x + 1][z + 1] = 50;
                }

                if (loc.occlude) {
                    this.levelOccludemap[level][x + 1][z] |= 0x249;
                }
            } else if (angle === LocAngle.SOUTH) {
                if (loc.shadow) {
                    this.levelShademap[level][x][z] = 50;
                    this.levelShademap[level][x + 1][z] = 50;
                }

                if (loc.occlude) {
                    this.levelOccludemap[level][x][z] |= 0x492;
                }
            }

            if (loc.blockwalk && collision) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }

            if (loc.walloff !== 16) {
                scene?.setWallDecorationOffset(level, x, z, loc.walloff);
            }
        } else if (shape === LocShape.WALL_DIAGONAL_CORNER) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_CORNER_TYPE[angle], 0, loc.getModel(LocShape.WALL_DIAGONAL_CORNER, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (loc.shadow) {
                if (angle === LocAngle.WEST) {
                    this.levelShademap[level][x][z + 1] = 50;
                } else if (angle === LocAngle.NORTH) {
                    this.levelShademap[level][x + 1][z + 1] = 50;
                } else if (angle === LocAngle.EAST) {
                    this.levelShademap[level][x + 1][z] = 50;
                } else if (angle === LocAngle.SOUTH) {
                    this.levelShademap[level][x][z] = 50;
                }
            }

            if (loc.blockwalk && collision) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_L) {
            const offset: number = (angle + 1) & 0x3;

            scene?.addWall(
                level,
                x,
                z,
                y,
                World.ROTATION_WALL_TYPE[angle],
                World.ROTATION_WALL_TYPE[offset],
                loc.getModel(LocShape.WALL_L, angle + 4, heightSW, heightSE, heightNW, heightNE, -1),
                loc.getModel(LocShape.WALL_L, offset, heightSW, heightSE, heightNW, heightNE, -1),
                bitset,
                info
            );

            if (loc.occlude) {
                if (angle === LocAngle.WEST) {
                    this.levelOccludemap[level][x][z] |= 0x109;
                    this.levelOccludemap[level][x][z + 1] |= 0x492;
                } else if (angle === LocAngle.NORTH) {
                    this.levelOccludemap[level][x][z + 1] |= 0x492;
                    this.levelOccludemap[level][x + 1][z] |= 0x249;
                } else if (angle === LocAngle.EAST) {
                    this.levelOccludemap[level][x + 1][z] |= 0x249;
                    this.levelOccludemap[level][x][z] |= 0x492;
                } else if (angle === LocAngle.SOUTH) {
                    this.levelOccludemap[level][x][z] |= 0x492;
                    this.levelOccludemap[level][x][z] |= 0x249;
                }
            }

            if (loc.blockwalk && collision) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }

            if (loc.walloff !== 16) {
                scene?.setWallDecorationOffset(level, x, z, loc.walloff);
            }
        } else if (shape === LocShape.WALL_SQUARE_CORNER) {
            scene?.addWall(level, x, z, y, World.ROTATION_WALL_CORNER_TYPE[angle], 0, loc.getModel(LocShape.WALL_SQUARE_CORNER, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info);

            if (loc.shadow) {
                if (angle === LocAngle.WEST) {
                    this.levelShademap[level][x][z + 1] = 50;
                } else if (angle === LocAngle.NORTH) {
                    this.levelShademap[level][x + 1][z + 1] = 50;
                } else if (angle === LocAngle.EAST) {
                    this.levelShademap[level][x + 1][z] = 50;
                } else if (angle === LocAngle.SOUTH) {
                    this.levelShademap[level][x][z] = 50;
                }
            }

            if (loc.blockwalk && collision) {
                collision.addWall(x, z, shape, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 0, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALL_DIAGONAL) {
            scene?.addLoc(level, x, z, y, loc.getModel(shape, angle, heightSW, heightSE, heightNW, heightNE, -1), null, bitset, info, 1, 1, 0);

            if (loc.blockwalk && collision) {
                collision.addLoc(x, z, loc.width, loc.length, angle, loc.blockrange);
            }

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 2, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_STRAIGHT_NOOFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle * 512, World.ROTATION_WALL_TYPE[angle]);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_STRAIGHT_OFFSET) {
            let offset: number = 16;
            if (scene) {
                const width: number = scene.getWallBitset(level, x, z);
                if (width > 0) {
                    offset = LocType.get((width >> 14) & 0x7fff).walloff;
                }
            }

            scene?.setWallDecoration(
                level,
                x,
                z,
                y,
                World.WALL_DECORATION_ROTATION_FORWARD_X[angle] * offset,
                World.WALL_DECORATION_ROTATION_FORWARD_Z[angle] * offset,
                bitset,
                loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1),
                info,
                angle * 512,
                World.ROTATION_WALL_TYPE[angle]
            );

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_OFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 256);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_NOOFFSET) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 512);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_BOTH) {
            scene?.setWallDecoration(level, x, z, y, 0, 0, bitset, loc.getModel(LocShape.WALLDECOR_STRAIGHT_NOOFFSET, LocAngle.WEST, heightSW, heightSE, heightNW, heightNE, -1), info, angle, 768);

            if (loc.anim !== -1) {
                locs.pushBack(new LocEntity(locId, level, 1, x, z, SeqType.instances[loc.anim], true));
            }
        }
    };
}
