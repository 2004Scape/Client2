import Model from '../../graphics/Model';

export default class ObjStack {
    // constructor
    readonly y: number;
    readonly x: number;
    readonly z: number;
    readonly topObj: Model | null;
    readonly middleObj: Model | null;
    readonly bottomObj: Model | null;
    readonly bitset: number;
    readonly offset: number;

    constructor(y: number, x: number, z: number, topObj: Model | null, middleObj: Model | null, bottomObj: Model | null, bitset: number, offset: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.topObj = topObj;
        this.middleObj = middleObj;
        this.bottomObj = bottomObj;
        this.bitset = bitset;
        this.offset = offset;
    }
}
