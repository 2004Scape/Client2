import Draw3D from '../graphics/Draw3D';
import Loc from './type/Loc';
import Tile from './type/Tile';
import Occluder from './type/Occluder';
import CollisionMap from './CollisionMap';
import Model from '../graphics/Model';
import GroundDecoration from './type/GroundDecoration';
import Entity from './entity/Entity';
import Wall from './type/Wall';
import WallDecoration from './type/WallDecoration';

export default class World3D {
    private static readonly visibilityMatrix: boolean[][][][] = new Array(8).fill(false).map((): boolean[][][] => new Array(32).fill(false).map((): boolean[][] => new Array(51).fill(false).map((): boolean[] => new Array(51).fill(false))));
    private static readonly locBuffer: (Loc | null)[] = new Array(100);
    private static readonly levelOccluderCount: Int32Array = new Int32Array(CollisionMap.LEVELS);
    private static readonly levelOccluders: (Occluder | null)[][] = new Array(CollisionMap.LEVELS).fill(null).map((): Occluder[] => new Array(500).fill(null));
    private static readonly activeOccluders: (Occluder | null)[] = new Array(500).fill(null);

    private static cycle: number = 0;

    private static viewportLeft: number = 0;
    private static viewportTop: number = 0;
    private static viewportRight: number = 0;
    private static viewportBottom: number = 0;
    private static viewportCenterX: number = 0;
    private static viewportCenterY: number = 0;

    private static sinEyePitch: number = 0;
    private static cosEyePitch: number = 0;
    private static sinEyeYaw: number = 0;
    private static cosEyeYaw: number = 0;

    private static eyeX: number = 0;
    private static eyeY: number = 0;
    private static eyeZ: number = 0;
    private static eyeTileX: number = 0;
    private static eyeTileZ: number = 0;

    private static minDrawTileX: number = 0;
    private static maxDrawTileX: number = 0;
    private static minDrawTileZ: number = 0;
    private static maxDrawTileZ: number = 0;

    private static topLevel: number = 0;
    private static tilesRemaining: number = 0;
    private static takingInput: boolean = false;

    private static visibilityMap: boolean[][] | null = null;

    static activeOccluderCount: number = 0;

    static init = (viewportWidth: number, viewportHeight: number, frustumStart: number, frustumEnd: number, pitchDistance: Int32Array): void => {
        this.viewportLeft = 0;
        this.viewportTop = 0;
        this.viewportRight = viewportWidth;
        this.viewportBottom = viewportHeight;
        this.viewportCenterX = Math.trunc(viewportWidth / 2);
        this.viewportCenterY = Math.trunc(viewportHeight / 2);

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

                const pitchLevel: number = Math.trunc((pitch - 128) / 32);
                const yawLevel: number = Math.trunc(yaw / 64);
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

    static unload = (): void => {
        // this.locBuffer = null;
        // this.levelOccluderCount = null;
        // this.levelOccluders = null;
        // this.drawTileQueue = null;
        // this.visibilityMatrix = null;
        // this.visibilityMap = null;
    };

    private static testPoint = (x: number, z: number, y: number): boolean => {
        const px: number = (z * this.sinEyeYaw + x * this.cosEyeYaw) >> 16;
        const tmp: number = (z * this.cosEyeYaw - x * this.sinEyeYaw) >> 16;
        const pz: number = (y * this.sinEyePitch + tmp * this.cosEyePitch) >> 16;
        const py: number = (y * this.cosEyePitch - tmp * this.sinEyePitch) >> 16;
        if (pz < 50 || pz > 3500) {
            return false;
        }
        const viewportX: number = this.viewportCenterX + Math.trunc((px << 9) / pz);
        const viewportY: number = this.viewportCenterY + Math.trunc((py << 9) / pz);
        return viewportX >= this.viewportLeft && viewportX <= this.viewportRight && viewportY >= this.viewportTop && viewportY <= this.viewportBottom;
    };

    // ----

    // constructor
    private readonly maxLevel: number;
    private readonly maxTileX: number;
    private readonly maxTileZ: number;
    private readonly levelHeightmaps: Int32Array[][];
    private readonly levelTiles: (Tile | null)[][][];
    private readonly temporaryLocs: (Loc | null)[];
    private readonly levelTileOcclusionCycles: Int32Array[][];
    private readonly mergeIndexA: Int32Array;
    private readonly mergeIndexB: Int32Array;

    // runtime
    private temporaryLocCount: number = 0;
    private minLevel: number = 0;

    constructor(levelHeightmaps: Int32Array[][], maxTileZ: number, maxLevel: number, maxTileX: number) {
        this.maxLevel = maxLevel;
        this.maxTileX = maxTileX;
        this.maxTileZ = maxTileZ;
        this.levelTiles = new Array(maxLevel).fill(null).map((): Tile[][] => new Array(maxTileX + 1).fill(null).map((): Tile[] => new Array(maxTileZ + 1).fill(null)));
        this.levelTileOcclusionCycles = new Array(maxLevel).fill(null).map((): Int32Array[] => new Array(maxTileX + 1).fill(null).map((): Int32Array => new Int32Array(maxTileZ + 1)));
        this.levelHeightmaps = levelHeightmaps;
        this.temporaryLocs = new Array(5000).fill(null);
        this.mergeIndexA = new Int32Array(10000);
        this.mergeIndexB = new Int32Array(10000);
        this.reset();
    }

    reset = (): void => {
        for (let level: number = 0; level < this.maxLevel; level++) {
            for (let x: number = 0; x < this.maxTileX; x++) {
                for (let z: number = 0; z < this.maxTileZ; z++) {
                    this.levelTiles[level][x][z] = null;
                }
            }
        }

        for (let l: number = 0; l < CollisionMap.LEVELS; l++) {
            for (let o: number = 0; o < World3D.levelOccluderCount[l]; o++) {
                World3D.levelOccluders[l][o] = null;
            }

            World3D.levelOccluderCount[l] = 0;
        }

        for (let i: number = 0; i < this.temporaryLocCount; i++) {
            this.temporaryLocs[i] = null;
        }

        this.temporaryLocCount = 0;

        for (let i: number = 0; i < World3D.locBuffer.length; i++) {
            World3D.locBuffer[i] = null;
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

    addGroundDecoration = (model: Model | null, tileLevel: number, tileX: number, tileZ: number, y: number, bitset: number, info: number): void => {
        if (!model) {
            return;
        }
        const decor: GroundDecoration = new GroundDecoration(y, tileX * 128 + 64, tileZ * 128 + 64, model, bitset, info);
        const tile: Tile = this.levelTiles[tileLevel][tileX][tileZ] ?? new Tile(tileLevel, tileX, tileZ);
        tile.groundDecoration = decor;
        if (!this.levelTiles[tileLevel][tileX][tileZ]) {
            this.levelTiles[tileLevel][tileX][tileZ] = tile;
        }
    };

    removeGroundDecoration = (level: number, x: number, z: number): void => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (!tile) {
            return;
        }

        tile.groundDecoration = null;
    };

    addWall = (level: number, tileX: number, tileZ: number, y: number, typeA: number, typeB: number, modelA: Model | null, modelB: Model | null, bitset: number, info: number): void => {
        if (!modelA || !modelB) {
            return;
        }
        const wall: Wall = new Wall(y, tileX * 128 + 64, tileZ * 128 + 64, typeA, typeB, modelA, modelB, bitset, info);
        for (let l: number = level; l >= 0; l--) {
            if (!this.levelTiles[l][tileX][tileZ]) {
                this.levelTiles[l][tileX][tileZ] = new Tile(l, tileX, tileZ);
            }
        }
        const tile: Tile | null = this.levelTiles[level][tileX][tileZ];
        if (tile) {
            tile.wall = wall;
        }
    };

    removeWall = (level: number, x: number, z: number, force: number): void => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (force === 1 && tile) {
            tile.wall = null;
        }
    };

    setWallDecoration = (level: number, tileX: number, tileZ: number, y: number, offsetX: number, offsetZ: number, bitset: number, model: Model | null, info: number, angle: number, type: number): void => {
        if (!model) {
            return;
        }
        const decor: WallDecoration = new WallDecoration(y, tileX * 128 + offsetX + 64, tileZ * 128 + offsetZ + 64, type, angle, model, bitset, info);
        for (let l: number = level; l >= 0; l--) {
            if (!this.levelTiles[l][tileX][tileZ]) {
                this.levelTiles[l][tileX][tileZ] = new Tile(l, tileX, tileZ);
            }
        }
        const tile: Tile | null = this.levelTiles[level][tileX][tileZ];
        if (tile) {
            tile.wallDecoration = decor;
        }
    };

    removeWallDecoration = (level: number, x: number, z: number): void => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (!tile) {
            return;
        }

        tile.wallDecoration = null;
    };

    setWallDecorationOffset = (level: number, x: number, z: number, offset: number): void => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (!tile) {
            return;
        }

        const decor: WallDecoration | null = tile.wallDecoration;
        if (!decor) {
            return;
        }

        const sx: number = x * 128 + 64;
        const sz: number = z * 128 + 64;
        decor.x = sx + (decor.x - sx) * Math.trunc(offset / 16);
        decor.z = sz + (decor.z - sz) * Math.trunc(offset / 16);
    };

    addLoc = (level: number, tileX: number, tileZ: number, y: number, model: Model | null, entity: Entity | null, bitset: number, info: number, width: number, length: number, yaw: number): boolean => {
        if (!model && !entity) {
            return true;
        }
        const sceneX: number = tileX * 128 + width * 64;
        const sceneZ: number = tileZ * 128 + length * 64;
        return this.addLoc2(sceneX, sceneZ, y, level, tileX, tileZ, width, length, model, entity, bitset, info, yaw, false);
    };

    removeLoc = (level: number, x: number, z: number): void => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (!tile) {
            return;
        }

        for (let l: number = 0; l < tile.locCount; l++) {
            const loc: Loc | null = tile.locs[l];
            if (loc && ((loc.bitset >> 29) & 0x3) === 2 && loc.minSceneTileX === x && loc.minSceneTileZ === z) {
                this.removeLoc2(loc);
                return;
            }
        }
    };

    clearTemporaryLocs = (): void => {
        for (let i: number = 0; i < this.temporaryLocCount; i++) {
            const loc: Loc | null = this.temporaryLocs[i];
            if (loc) {
                this.removeLoc2(loc);
            }
            this.temporaryLocs[i] = null;
        }

        this.temporaryLocCount = 0;
    };

    getWallBitset = (level: number, x: number, z: number): number => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        return !tile || !tile.wall ? 0 : tile.wall.bitset;
    };

    getWallDecorationBitset = (level: number, z: number, x: number): number => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        return !tile || !tile.wallDecoration ? 0 : tile.wallDecoration.bitset;
    };

    getLocBitset = (level: number, x: number, z: number): number => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (tile === null) {
            return 0;
        }

        for (let l: number = 0; l < tile.locCount; l++) {
            const loc: Loc | null = tile.locs[l];
            if (loc && ((loc.bitset >> 29) & 0x3) === 2 && loc.minSceneTileX === x && loc.minSceneTileZ === z) {
                return loc.bitset;
            }
        }

        return 0;
    };

    getGroundDecorationBitset = (level: number, x: number, z: number): number => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        return !tile || !tile.groundDecoration ? 0 : tile.groundDecoration.bitset;
    };

    getInfo = (level: number, x: number, z: number, bitset: number): number => {
        const tile: Tile | null = this.levelTiles[level][x][z];
        if (!tile) {
            return -1;
        } else if (tile.wall && tile.wall.bitset === bitset) {
            return tile.wall.info & 0xff;
        } else if (tile.wallDecoration && tile.wallDecoration.bitset === bitset) {
            return tile.wallDecoration.info & 0xff;
        } else if (tile.groundDecoration && tile.groundDecoration.bitset === bitset) {
            return tile.groundDecoration.info & 0xff;
        } else {
            for (let i: number = 0; i < tile.locCount; i++) {
                const loc: Loc | null = tile.locs[i];
                if (loc && loc.bitset === bitset) {
                    return loc.info & 0xff;
                }
            }
            return -1;
        }
    };

    draw = (eyeX: number, eyeY: number, eyeZ: number, topLevel: number, eyeYaw: number, eyePitch: number, loopCycle: number): void => {
        if (eyeX < 0) {
            eyeX = 0;
        } else if (eyeX >= this.maxTileX * 128) {
            eyeX = this.maxTileX * 128 - 1;
        }

        if (eyeZ < 0) {
            eyeZ = 0;
        } else if (eyeZ >= this.maxTileZ * 128) {
            eyeZ = this.maxTileZ * 128 - 1;
        }

        World3D.cycle++;
        World3D.sinEyePitch = Draw3D.sin[eyePitch];
        World3D.cosEyePitch = Draw3D.cos[eyePitch];
        World3D.sinEyeYaw = Draw3D.sin[eyeYaw];
        World3D.cosEyeYaw = Draw3D.cos[eyeYaw];

        World3D.visibilityMap = World3D.visibilityMatrix[Math.trunc((eyePitch - 128) / 32)][Math.trunc(eyeYaw / 64)];
        World3D.eyeX = eyeX;
        World3D.eyeY = eyeY;
        World3D.eyeZ = eyeZ;
        World3D.eyeTileX = Math.trunc(eyeX / 128);
        World3D.eyeTileZ = Math.trunc(eyeZ / 128);
        World3D.topLevel = topLevel;

        World3D.minDrawTileX = World3D.eyeTileX - 25;
        if (World3D.minDrawTileX < 0) {
            World3D.minDrawTileX = 0;
        }

        World3D.minDrawTileZ = World3D.eyeTileZ - 25;
        if (World3D.minDrawTileZ < 0) {
            World3D.minDrawTileZ = 0;
        }

        World3D.maxDrawTileX = World3D.eyeTileX + 25;
        if (World3D.maxDrawTileX > this.maxTileX) {
            World3D.maxDrawTileX = this.maxTileX;
        }

        World3D.maxDrawTileZ = World3D.eyeTileZ + 25;
        if (World3D.maxDrawTileZ > this.maxTileZ) {
            World3D.maxDrawTileZ = this.maxTileZ;
        }

        this.updateActiveOccluders();
        World3D.tilesRemaining = 0;

        for (let level: number = this.minLevel; level < this.maxLevel; level++) {
            const tiles: (Tile | null)[][] = this.levelTiles[level];
            for (let x: number = World3D.minDrawTileX; x < World3D.maxDrawTileX; x++) {
                for (let z: number = World3D.minDrawTileZ; z < World3D.maxDrawTileZ; z++) {
                    const tile: Tile | null = tiles[x][z];
                    if (!tile) {
                        continue;
                    }

                    if (tile.drawLevel <= topLevel && (World3D.visibilityMap[x + 25 - World3D.eyeTileX][z + 25 - World3D.eyeTileZ] || this.levelHeightmaps[level][x][z] - eyeY >= 2000)) {
                        tile.visible = true;
                        tile.update = true;
                        tile.containsLocs = tile.locCount > 0;
                        // tilesRemaining++; // TODO
                    } else {
                        tile.visible = false;
                        tile.update = false;
                        tile.checkLocSpans = 0;
                    }
                }
            }
        }

        for (let level: number = this.minLevel; level < this.maxLevel; level++) {
            const tiles: (Tile | null)[][] = this.levelTiles[level];
            for (let dx: number = -25; dx <= 0; dx++) {
                const rightTileX: number = World3D.eyeTileX + dx;
                const leftTileX: number = World3D.eyeTileX - dx;

                if (rightTileX < World3D.minDrawTileX && leftTileX >= World3D.maxDrawTileX) {
                    continue;
                }

                for (let dz: number = -25; dz <= 0; dz++) {
                    const forwardTileZ: number = World3D.eyeTileZ + dz;
                    const backwardTileZ: number = World3D.eyeTileZ - dz;
                    let tile: Tile | null;
                    if (rightTileX >= World3D.minDrawTileX) {
                        if (forwardTileZ >= World3D.minDrawTileZ) {
                            tile = tiles[rightTileX][forwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, true, loopCycle);
                            }
                        }

                        if (backwardTileZ < World3D.maxDrawTileZ) {
                            tile = tiles[rightTileX][backwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, true, loopCycle);
                            }
                        }
                    }

                    if (leftTileX < World3D.maxDrawTileX) {
                        if (forwardTileZ >= World3D.minDrawTileZ) {
                            tile = tiles[leftTileX][forwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, true, loopCycle);
                            }
                        }

                        if (backwardTileZ < World3D.maxDrawTileZ) {
                            tile = tiles[leftTileX][backwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, true, loopCycle);
                            }
                        }
                    }

                    if (World3D.tilesRemaining === 0) {
                        World3D.takingInput = false;
                        return;
                    }
                }
            }
        }

        for (let level: number = this.minLevel; level < this.maxLevel; level++) {
            const tiles: (Tile | null)[][] = this.levelTiles[level];
            for (let dx: number = -25; dx <= 0; dx++) {
                const rightTileX: number = World3D.eyeTileX + dx;
                const leftTileX: number = World3D.eyeTileX - dx;
                if (rightTileX < World3D.minDrawTileX && leftTileX >= World3D.maxDrawTileX) {
                    continue;
                }

                for (let dz: number = -25; dz <= 0; dz++) {
                    const forwardTileZ: number = World3D.eyeTileZ + dz;
                    const backgroundTileZ: number = World3D.eyeTileZ - dz;
                    let tile: Tile | null;
                    if (rightTileX >= World3D.minDrawTileX) {
                        if (forwardTileZ >= World3D.minDrawTileZ) {
                            tile = tiles[rightTileX][forwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, false, loopCycle);
                            }
                        }

                        if (backgroundTileZ < World3D.maxDrawTileZ) {
                            tile = tiles[rightTileX][backgroundTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, false, loopCycle);
                            }
                        }
                    }

                    if (leftTileX < World3D.maxDrawTileX) {
                        if (forwardTileZ >= World3D.minDrawTileZ) {
                            tile = tiles[leftTileX][forwardTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, false, loopCycle);
                            }
                        }

                        if (backgroundTileZ < World3D.maxDrawTileZ) {
                            tile = tiles[leftTileX][backgroundTileZ];
                            if (tile && tile.visible) {
                                this.drawTile(tile, false, loopCycle);
                            }
                        }
                    }

                    if (World3D.tilesRemaining === 0) {
                        World3D.takingInput = false;
                        return;
                    }
                }
            }
        }
    };

    private addLoc2 = (
        x: number,
        z: number,
        y: number,
        level: number,
        tileX: number,
        tileZ: number,
        tileSizeX: number,
        tileSizeZ: number,
        model: Model | null,
        entity: Entity | null,
        bitset: number,
        info: number,
        yaw: number,
        temporary: boolean
    ): boolean => {
        if (!model || !entity) {
            return false;
        }
        for (let tx: number = tileX; tx < tileX + tileSizeX; tx++) {
            for (let tz: number = tileZ; tz < tileZ + tileSizeZ; tz++) {
                if (tx < 0 || tz < 0 || tx >= this.maxTileX || tz >= this.maxTileZ) {
                    return false;
                }
                const tile: Tile | null = this.levelTiles[level][tx][tz];
                if (tile && tile.locCount >= 5) {
                    return false;
                }
            }
        }
        const loc: Loc = new Loc(level, y, x, z, model, entity, yaw, tileX, tileX + tileSizeX - 1, tileZ, tileZ + tileSizeZ - 1, bitset, info);
        for (let tx: number = tileX; tx < tileX + tileSizeX; tx++) {
            for (let tz: number = tileZ; tz < tileZ + tileSizeZ; tz++) {
                let spans: number = 0;
                if (tx > tileX) {
                    spans |= 0x1;
                }
                if (tx < tileX + tileSizeX - 1) {
                    spans += 0x4;
                }
                if (tz > tileZ) {
                    spans += 0x8;
                }
                if (tz < tileZ + tileSizeZ - 1) {
                    spans += 0x2;
                }
                for (let l: number = level; l >= 0; l--) {
                    if (!this.levelTiles[l][tx][tz]) {
                        this.levelTiles[l][tx][tz] = new Tile(l, tx, tz);
                    }
                }
                const tile: Tile | null = this.levelTiles[level][tx][tz];
                if (tile) {
                    tile.locs[tile.locCount] = loc;
                    tile.locSpan[tile.locCount] = spans;
                    tile.locSpans |= spans;
                    tile.locCount++;
                }
            }
        }
        if (temporary) {
            this.temporaryLocs[this.temporaryLocCount++] = loc;
        }
        return true;
    };

    private removeLoc2 = (loc: Loc): void => {
        for (let tx: number = loc.minSceneTileX; tx <= loc.maxSceneTileX; tx++) {
            for (let tz: number = loc.minSceneTileZ; tz <= loc.maxSceneTileZ; tz++) {
                const tile: Tile | null = this.levelTiles[loc.level][tx][tz];
                if (!tile) {
                    continue;
                }

                for (let i: number = 0; i < tile.locCount; i++) {
                    if (tile.locs[i] === loc) {
                        tile.locCount--;
                        for (let j: number = i; j < tile.locCount; j++) {
                            tile.locs[j] = tile.locs[j + 1];
                            tile.locSpan[j] = tile.locSpan[j + 1];
                        }
                        tile.locs[tile.locCount] = null;
                        break;
                    }
                }

                tile.locSpans = 0;

                for (let i: number = 0; i < tile.locCount; i++) {
                    tile.locSpans |= tile.locSpan[i];
                }
            }
        }
    };

    private updateActiveOccluders = (): void => {
        const count: number = World3D.levelOccluderCount[World3D.topLevel];
        const occluders: (Occluder | null)[] = World3D.levelOccluders[World3D.topLevel];
        World3D.activeOccluderCount = 0;
        for (let i: number = 0; i < count; i++) {
            const occluder: Occluder | null = occluders[i];
            if (!occluder) {
                continue;
            }

            let deltaMaxY: number;
            let deltaMinTileZ: number;
            let deltaMaxTileZ: number;
            let deltaMaxTileX: number;
            if (occluder.type === 1) {
                deltaMaxY = occluder.minTileX + 25 - World3D.eyeTileX;
                if (deltaMaxY >= 0 && deltaMaxY <= 50) {
                    deltaMinTileZ = occluder.minTileZ + 25 - World3D.eyeTileZ;
                    if (deltaMinTileZ < 0) {
                        deltaMinTileZ = 0;
                    }
                    deltaMaxTileZ = occluder.maxTileZ + 25 - World3D.eyeTileZ;
                    if (deltaMaxTileZ > 50) {
                        deltaMaxTileZ = 50;
                    }
                    let ok: boolean = false;
                    while (deltaMinTileZ <= deltaMaxTileZ) {
                        if (World3D.visibilityMap && World3D.visibilityMap[deltaMaxY][deltaMinTileZ++]) {
                            ok = true;
                            break;
                        }
                    }
                    if (ok) {
                        deltaMaxTileX = World3D.eyeX - occluder.minX;
                        if (deltaMaxTileX > 32) {
                            occluder.mode = 1;
                        } else {
                            if (deltaMaxTileX >= -32) {
                                continue;
                            }
                            occluder.mode = 2;
                            deltaMaxTileX = -deltaMaxTileX;
                        }
                        occluder.minDeltaZ = Math.trunc(((occluder.minZ - World3D.eyeZ) << 8) / deltaMaxTileX);
                        occluder.maxDeltaZ = Math.trunc(((occluder.maxZ - World3D.eyeZ) << 8) / deltaMaxTileX);
                        occluder.minDeltaY = Math.trunc(((occluder.minY - World3D.eyeY) << 8) / deltaMaxTileX);
                        occluder.maxDeltaY = Math.trunc(((occluder.maxY - World3D.eyeY) << 8) / deltaMaxTileX);
                        World3D.activeOccluders[World3D.activeOccluderCount++] = occluder;
                    }
                }
            } else if (occluder.type === 2) {
                deltaMaxY = occluder.minTileZ + 25 - World3D.eyeTileZ;
                if (deltaMaxY >= 0 && deltaMaxY <= 50) {
                    deltaMinTileZ = occluder.minTileX + 25 - World3D.eyeTileX;
                    if (deltaMinTileZ < 0) {
                        deltaMinTileZ = 0;
                    }
                    deltaMaxTileZ = occluder.maxTileX + 25 - World3D.eyeTileX;
                    if (deltaMaxTileZ > 50) {
                        deltaMaxTileZ = 50;
                    }
                    let ok: boolean = false;
                    while (deltaMinTileZ <= deltaMaxTileZ) {
                        if (World3D.visibilityMap && World3D.visibilityMap[deltaMinTileZ++][deltaMaxY]) {
                            ok = true;
                            break;
                        }
                    }
                    if (ok) {
                        deltaMaxTileX = World3D.eyeZ - occluder.minZ;
                        if (deltaMaxTileX > 32) {
                            occluder.mode = 3;
                        } else {
                            if (deltaMaxTileX >= -32) {
                                continue;
                            }
                            occluder.mode = 4;
                            deltaMaxTileX = -deltaMaxTileX;
                        }
                        occluder.minDeltaX = Math.trunc(((occluder.minX - World3D.eyeX) << 8) / deltaMaxTileX);
                        occluder.maxDeltaX = Math.trunc(((occluder.maxX - World3D.eyeX) << 8) / deltaMaxTileX);
                        occluder.minDeltaY = Math.trunc(((occluder.minY - World3D.eyeY) << 8) / deltaMaxTileX);
                        occluder.maxDeltaY = Math.trunc(((occluder.maxY - World3D.eyeY) << 8) / deltaMaxTileX);
                        World3D.activeOccluders[World3D.activeOccluderCount++] = occluder;
                    }
                }
            } else if (occluder.type === 4) {
                deltaMaxY = occluder.minY - World3D.eyeY;
                if (deltaMaxY > 128) {
                    deltaMinTileZ = occluder.minTileZ + 25 - World3D.eyeTileZ;
                    if (deltaMinTileZ < 0) {
                        deltaMinTileZ = 0;
                    }
                    deltaMaxTileZ = occluder.maxTileZ + 25 - World3D.eyeTileZ;
                    if (deltaMaxTileZ > 50) {
                        deltaMaxTileZ = 50;
                    }
                    if (deltaMinTileZ <= deltaMaxTileZ) {
                        let deltaMinTileX: number = occluder.minTileX + 25 - World3D.eyeTileX;
                        if (deltaMinTileX < 0) {
                            deltaMinTileX = 0;
                        }
                        deltaMaxTileX = occluder.maxTileX + 25 - World3D.eyeTileX;
                        if (deltaMaxTileX > 50) {
                            deltaMaxTileX = 50;
                        }
                        let ok: boolean = false;
                        find_visible_tile: for (let x: number = deltaMinTileX; x <= deltaMaxTileX; x++) {
                            for (let z: number = deltaMinTileZ; z <= deltaMaxTileZ; z++) {
                                if (World3D.visibilityMap && World3D.visibilityMap[x][z]) {
                                    ok = true;
                                    break find_visible_tile;
                                }
                            }
                        }
                        if (ok) {
                            occluder.mode = 5;
                            occluder.minDeltaX = Math.trunc(((occluder.minX - World3D.eyeX) << 8) / deltaMaxY);
                            occluder.maxDeltaX = Math.trunc(((occluder.maxX - World3D.eyeX) << 8) / deltaMaxY);
                            occluder.minDeltaZ = Math.trunc(((occluder.minZ - World3D.eyeZ) << 8) / deltaMaxY);
                            occluder.maxDeltaZ = Math.trunc(((occluder.maxZ - World3D.eyeZ) << 8) / deltaMaxY);
                            World3D.activeOccluders[World3D.activeOccluderCount++] = occluder;
                        }
                    }
                }
            }
        }
    };

    private drawTile = (next: Tile, checkAdjacent: boolean, loopCycle: number): void => {
        // TODO
    };
}
