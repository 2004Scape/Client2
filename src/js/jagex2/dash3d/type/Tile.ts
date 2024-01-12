import TileOverlay from './TileOverlay';
import TileUnderlay from './TileUnderlay';

export default class Tile {
    level: number = 0;
    x: number = 0;
    z: number = 0;
    occludeLevel: number = 0;
    underlay?: TileUnderlay;
    overlay?: TileOverlay;
    // wall: Wall;
    // wallDecoration: WallDecoration
    // groundDecoration: GroundDecoration
    // objStack: ObjStack
    locCount: number = 0;
    // locs: Loc[] = [];
    locSpan: number[] = [];
    locSpans: number = 0;
    drawLevel: number = 0;
    visible: boolean = false;
    update: boolean = false;
    containsLocs: boolean = false;
    checkLocSpans: boolean = false;
    blockLocSpans: boolean = false;
    inverseBlockLocSpans: boolean = false;
    backWallTypes: number = 0;
    bridge?: Tile;

    constructor(level: number, x: number, z: number) {
        this.occludeLevel = this.level;
        this.x = x;
        this.z = z;
    }
}
