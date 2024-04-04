import CollisionFlag from './CollisionFlag';
import LocAngle from './LocAngle';
import LocShape from './LocShape';
import DirectionFlag from './DirectionFlag';

export default class CollisionMap {
    static readonly LEVELS: number = 4;
    static readonly SIZE: number = 104;
    static index = (x: number, z: number): number => x * CollisionMap.SIZE + z;

    // constructor
    readonly offsetX: number;
    readonly offsetZ: number;
    readonly sizeX: number;
    readonly sizeZ: number;
    readonly flags: Int32Array;

    constructor() {
        this.offsetX = 0;
        this.offsetZ = 0;
        this.sizeX = CollisionMap.SIZE;
        this.sizeZ = CollisionMap.SIZE;
        this.flags = new Int32Array(this.sizeX * this.sizeZ);
        this.reset();
    }

    reset = (): void => {
        for (let x: number = 0; x < this.sizeX; x++) {
            for (let z: number = 0; z < this.sizeZ; z++) {
                const index: number = CollisionMap.index(x, z);
                if (x === 0 || z === 0 || x === this.sizeX - 1 || z === this.sizeZ - 1) {
                    this.flags[index] = CollisionFlag.BOUNDS;
                } else {
                    this.flags[index] = CollisionFlag.OPEN;
                }
            }
        }
    };

    addFloor = (tileX: number, tileZ: number): void => {
        this.flags[CollisionMap.index(tileX - this.offsetX, tileZ - this.offsetZ)] |= CollisionFlag.FLOOR;
    };

    removeFloor = (tileX: number, tileZ: number): void => {
        this.flags[CollisionMap.index(tileX - this.offsetX, tileZ - this.offsetZ)] &= ~CollisionFlag.FLOOR;
    };

    addLoc = (tileX: number, tileZ: number, sizeX: number, sizeZ: number, angle: LocAngle, blockrange: boolean): void => {
        let flags: number = CollisionFlag.LOC;
        if (blockrange) {
            flags |= CollisionFlag.LOC_PROJ_BLOCKER;
        }

        const x: number = tileX - this.offsetX;
        const z: number = tileZ - this.offsetZ;

        if (angle === LocAngle.NORTH || angle === LocAngle.SOUTH) {
            // north or south
            const tmp: number = sizeX;
            sizeX = sizeZ;
            sizeZ = tmp;
        }

        for (let tx: number = x; tx < x + sizeX; tx++) {
            if (!(tx >= 0 && tx < this.sizeX)) {
                continue;
            }
            for (let tz: number = z; tz < z + sizeZ; tz++) {
                if (!(tz >= 0 && tz < this.sizeZ)) {
                    continue;
                }
                this.add(tx, tz, flags);
            }
        }
    };

    removeLoc = (tileX: number, tileZ: number, sizeX: number, sizeZ: number, angle: LocAngle, blockrange: boolean): void => {
        let flags: number = CollisionFlag.LOC;
        if (blockrange) {
            flags |= CollisionFlag.LOC_PROJ_BLOCKER;
        }

        const x: number = tileX - this.offsetX;
        const z: number = tileZ - this.offsetZ;

        if (angle === LocAngle.NORTH || angle === LocAngle.SOUTH) {
            const tmp: number = sizeX;
            sizeX = sizeZ;
            sizeZ = tmp;
        }

        for (let tx: number = x; tx < x + sizeX; tx++) {
            if (!(tx >= 0 && tx < this.sizeX)) {
                continue;
            }
            for (let tz: number = z; tz < z + sizeZ; tz++) {
                if (!(tz >= 0 && tz < this.sizeZ)) {
                    continue;
                }
                this.remove(tx, tz, flags);
            }
        }
    };

    addWall = (tileX: number, tileZ: number, shape: number, angle: LocAngle, blockrange: boolean): void => {
        const x: number = tileX - this.offsetX;
        const z: number = tileZ - this.offsetZ;

        const west: number = blockrange ? CollisionFlag.WALL_WEST_PROJ_BLOCKER : CollisionFlag.WALL_WEST;
        const east: number = blockrange ? CollisionFlag.WALL_EAST_PROJ_BLOCKER : CollisionFlag.WALL_EAST;
        const north: number = blockrange ? CollisionFlag.WALL_NORTH_PROJ_BLOCKER : CollisionFlag.WALL_NORTH;
        const south: number = blockrange ? CollisionFlag.WALL_SOUTH_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH;
        const northWest: number = blockrange ? CollisionFlag.WALL_NORTH_WEST_PROJ_BLOCKER : CollisionFlag.WALL_NORTH_WEST;
        const southEast: number = blockrange ? CollisionFlag.WALL_SOUTH_EAST_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH_EAST;
        const northEast: number = blockrange ? CollisionFlag.WALL_NORTH_EAST_PROJ_BLOCKER : CollisionFlag.WALL_NORTH_EAST;
        const southWest: number = blockrange ? CollisionFlag.WALL_SOUTH_WEST_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH_WEST;

        if (shape === LocShape.WALL_STRAIGHT.id) {
            if (angle === LocAngle.WEST) {
                this.add(x, z, west);
                this.add(x - 1, z, east);
            } else if (angle === LocAngle.NORTH) {
                this.add(x, z, north);
                this.add(x, z + 1, south);
            } else if (angle === LocAngle.EAST) {
                this.add(x, z, east);
                this.add(x + 1, z, west);
            } else if (angle === LocAngle.SOUTH) {
                this.add(x, z, south);
                this.add(x, z - 1, north);
            }
        } else if (shape === LocShape.WALL_DIAGONAL_CORNER.id || shape === LocShape.WALL_SQUARE_CORNER.id) {
            if (angle === LocAngle.WEST) {
                this.add(x, z, northWest);
                this.add(x - 1, z + 1, southEast);
            } else if (angle === LocAngle.NORTH) {
                this.add(x, z, northEast);
                this.add(x + 1, z + 1, southWest);
            } else if (angle === LocAngle.EAST) {
                this.add(x, z, southEast);
                this.add(x + 1, z - 1, northWest);
            } else if (angle === LocAngle.SOUTH) {
                this.add(x, z, southWest);
                this.add(x - 1, z - 1, northEast);
            }
        } else if (shape === LocShape.WALL_L.id) {
            if (angle === LocAngle.WEST) {
                this.add(x, z, north | west);
                this.add(x - 1, z, east);
                this.add(x, z + 1, south);
            } else if (angle === LocAngle.NORTH) {
                this.add(x, z, north | east);
                this.add(x, z + 1, south);
                this.add(x + 1, z, west);
            } else if (angle === LocAngle.EAST) {
                this.add(x, z, south | east);
                this.add(x + 1, z, west);
                this.add(x, z - 1, north);
            } else if (angle === LocAngle.SOUTH) {
                this.add(x, z, south | west);
                this.add(x, z - 1, north);
                this.add(x - 1, z, east);
            }
        }
        if (blockrange) {
            this.addWall(tileX, tileZ, shape, angle, false);
        }
    };

    removeWall = (tileX: number, tileZ: number, shape: number, angle: LocAngle, blockrange: boolean): void => {
        const x: number = tileX - this.offsetX;
        const z: number = tileZ - this.offsetZ;

        const west: number = blockrange ? CollisionFlag.WALL_WEST_PROJ_BLOCKER : CollisionFlag.WALL_WEST;
        const east: number = blockrange ? CollisionFlag.WALL_EAST_PROJ_BLOCKER : CollisionFlag.WALL_EAST;
        const north: number = blockrange ? CollisionFlag.WALL_NORTH_PROJ_BLOCKER : CollisionFlag.WALL_NORTH;
        const south: number = blockrange ? CollisionFlag.WALL_SOUTH_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH;
        const northWest: number = blockrange ? CollisionFlag.WALL_NORTH_WEST_PROJ_BLOCKER : CollisionFlag.WALL_NORTH_WEST;
        const southEast: number = blockrange ? CollisionFlag.WALL_SOUTH_EAST_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH_EAST;
        const northEast: number = blockrange ? CollisionFlag.WALL_NORTH_EAST_PROJ_BLOCKER : CollisionFlag.WALL_NORTH_EAST;
        const southWest: number = blockrange ? CollisionFlag.WALL_SOUTH_WEST_PROJ_BLOCKER : CollisionFlag.WALL_SOUTH_WEST;

        if (shape === LocShape.WALL_STRAIGHT.id) {
            if (angle === LocAngle.WEST) {
                this.remove(x, z, west);
                this.remove(x - 1, z, east);
            } else if (angle === LocAngle.NORTH) {
                this.remove(x, z, north);
                this.remove(x, z + 1, south);
            } else if (angle === LocAngle.EAST) {
                this.remove(x, z, east);
                this.remove(x + 1, z, west);
            } else if (angle === LocAngle.SOUTH) {
                this.remove(x, z, south);
                this.remove(x, z - 1, north);
            }
        } else if (shape === LocShape.WALL_DIAGONAL_CORNER.id || shape === LocShape.WALL_SQUARE_CORNER.id) {
            if (angle === LocAngle.WEST) {
                this.remove(x, z, northWest);
                this.remove(x - 1, z + 1, southEast);
            } else if (angle === LocAngle.NORTH) {
                this.remove(x, z, northEast);
                this.remove(x + 1, z + 1, southWest);
            } else if (angle === LocAngle.EAST) {
                this.remove(x, z, southEast);
                this.remove(x + 1, z - 1, northWest);
            } else if (angle === LocAngle.SOUTH) {
                this.remove(x, z, southWest);
                this.remove(x - 1, z - 1, northEast);
            }
        } else if (shape === LocShape.WALL_L.id) {
            if (angle === LocAngle.WEST) {
                this.remove(x, z, north | west);
                this.remove(x - 1, z, east);
                this.remove(x, z + 1, south);
            } else if (angle === LocAngle.NORTH) {
                this.remove(x, z, north | east);
                this.remove(x, z + 1, south);
                this.remove(x + 1, z, west);
            } else if (angle === LocAngle.EAST) {
                this.remove(x, z, south | east);
                this.remove(x + 1, z, west);
                this.remove(x, z - 1, north);
            } else if (angle === LocAngle.SOUTH) {
                this.remove(x, z, south | west);
                this.remove(x, z - 1, north);
                this.remove(x - 1, z, east);
            }
        }
        if (blockrange) {
            this.removeWall(tileX, tileZ, shape, angle, false);
        }
    };

    reachedWall = (sourceX: number, sourceZ: number, destX: number, destZ: number, shape: number, angle: LocAngle): boolean => {
        if (sourceX === destX && sourceZ === destZ) {
            return true;
        }

        const sx: number = sourceX - this.offsetX;
        const sz: number = sourceZ - this.offsetZ;
        const dx: number = destX - this.offsetX;
        const dz: number = destZ - this.offsetZ;
        const index: number = CollisionMap.index(sx, sz);

        if (shape === LocShape.WALL_STRAIGHT.id) {
            if (angle === LocAngle.WEST) {
                if (sx === dx - 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.NORTH) {
                if (sx === dx && sz === dz + 1) {
                    return true;
                } else if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.EAST) {
                if (sx === dx + 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.SOUTH) {
                if (sx === dx && sz === dz - 1) {
                    return true;
                } else if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                    return true;
                }
            }
        } else if (shape === LocShape.WALL_L.id) {
            if (angle === LocAngle.WEST) {
                if (sx === dx - 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz + 1) {
                    return true;
                } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.NORTH) {
                if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz + 1) {
                    return true;
                } else if (sx === dx + 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.EAST) {
                if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx + 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz - 1) {
                    return true;
                }
            } else if (angle === LocAngle.SOUTH) {
                if (sx === dx - 1 && sz === dz) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1) {
                    return true;
                }
            }
        } else if (shape === LocShape.WALL_DIAGONAL.id) {
            if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.WALL_SOUTH) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.WALL_NORTH) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_EAST) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_WEST) === CollisionFlag.OPEN) {
                return true;
            }
        }
        return false;
    };

    reachedWallDecoration = (sourceX: number, sourceZ: number, destX: number, destZ: number, shape: number, angle: number): boolean => {
        if (sourceX === destX && sourceZ === destZ) {
            return true;
        }

        const sx: number = sourceX - this.offsetX;
        const sz: number = sourceZ - this.offsetZ;
        const dx: number = destX - this.offsetX;
        const dz: number = destZ - this.offsetZ;
        const index: number = CollisionMap.index(sx, sz);

        if (shape === LocShape.WALLDECOR_DIAGONAL_OFFSET.id || shape === LocShape.WALLDECOR_DIAGONAL_NOOFFSET.id) {
            if (shape === LocShape.WALLDECOR_DIAGONAL_NOOFFSET.id) {
                angle = (angle + 2) & 0x3;
            }

            if (angle === LocAngle.WEST) {
                if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.WALL_NORTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.NORTH) {
                if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_EAST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.WALL_NORTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.EAST) {
                if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_EAST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.WALL_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            } else if (angle === LocAngle.SOUTH) {
                if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_WEST) === CollisionFlag.OPEN) {
                    return true;
                } else if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.WALL_SOUTH) === CollisionFlag.OPEN) {
                    return true;
                }
            }
        } else if (shape === LocShape.WALLDECOR_DIAGONAL_BOTH.id) {
            if (sx === dx && sz === dz + 1 && (this.flags[index] & CollisionFlag.WALL_SOUTH) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx && sz === dz - 1 && (this.flags[index] & CollisionFlag.WALL_NORTH) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx - 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_EAST) === CollisionFlag.OPEN) {
                return true;
            } else if (sx === dx + 1 && sz === dz && (this.flags[index] & CollisionFlag.WALL_WEST) === CollisionFlag.OPEN) {
                return true;
            }
        }
        return false;
    };

    reachedLoc = (srcX: number, srcZ: number, dstX: number, dstZ: number, dstSizeX: number, dstSizeZ: number, forceapproach: number): boolean => {
        const maxX: number = dstX + dstSizeX - 1;
        const maxZ: number = dstZ + dstSizeZ - 1;
        const index: number = CollisionMap.index(srcX - this.offsetX, srcZ - this.offsetZ);

        if (srcX >= dstX && srcX <= maxX && srcZ >= dstZ && srcZ <= maxZ) {
            return true;
        } else if (srcX === dstX - 1 && srcZ >= dstZ && srcZ <= maxZ && (this.flags[index] & CollisionFlag.WALL_EAST) === CollisionFlag.OPEN && (forceapproach & DirectionFlag.WEST) === CollisionFlag.OPEN) {
            return true;
        } else if (srcX === maxX + 1 && srcZ >= dstZ && srcZ <= maxZ && (this.flags[index] & CollisionFlag.WALL_WEST) === CollisionFlag.OPEN && (forceapproach & DirectionFlag.EAST) === CollisionFlag.OPEN) {
            return true;
        } else if (srcZ === dstZ - 1 && srcX >= dstX && srcX <= maxX && (this.flags[index] & CollisionFlag.WALL_NORTH) === CollisionFlag.OPEN && (forceapproach & DirectionFlag.SOUTH) === CollisionFlag.OPEN) {
            return true;
        } else if (srcZ === maxZ + 1 && srcX >= dstX && srcX <= maxX && (this.flags[index] & CollisionFlag.WALL_SOUTH) === CollisionFlag.OPEN && (forceapproach & DirectionFlag.NORTH) === CollisionFlag.OPEN) {
            return true;
        }
        return false;
    };

    private add = (x: number, z: number, flags: number): void => {
        this.flags[CollisionMap.index(x, z)] |= flags;
    };

    private remove = (x: number, z: number, flags: number): void => {
        this.flags[CollisionMap.index(x, z)] &= CollisionFlag.BOUNDS - flags;
    };
}
