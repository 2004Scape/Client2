import Linkable from '../../datastruct/Linkable';
import Loc from './Loc';
import TileUnderlay from './TileUnderlay';
import TileOverlay from './TileOverlay';
import Wall from './Wall';
import WallDecoration from './WallDecoration';
import GroundDecoration from './GroundDecoration';
import ObjStack from './ObjStack';

export default class Tile extends Linkable {
    // constructor
    level: number;
    readonly x: number;
    readonly z: number;
    readonly occludeLevel: number;
    readonly locs: (Loc | null)[];
    readonly locSpan: Int32Array;

    // runtime
    underlay: TileUnderlay | null = null;
    overlay: TileOverlay | null = null;
    wall: Wall | null = null;
    wallDecoration: WallDecoration | null = null;
    groundDecoration: GroundDecoration | null = null;
    objStack: ObjStack | null = null;
    bridge: Tile | null = null;
    locCount: number = 0;
    locSpans: number = 0;
    drawLevel: number = 0;
    visible: boolean = false;
    update: boolean = false;
    containsLocs: boolean = false;
    checkLocSpans: number = 0;
    blockLocSpans: number = 0;
    inverseBlockLocSpans: number = 0;
    backWallTypes: number = 0;

    constructor(level: number, x: number, z: number) {
        super();
        this.occludeLevel = this.level = level;
        this.x = x;
        this.z = z;
        this.locs = new Array(5).fill(null);
        this.locSpan = new Int32Array(5);
    }
}
