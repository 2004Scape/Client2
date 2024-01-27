import Model from '../../graphics/Model';

export default class ObjStack {
    // constructor
    y: number;
    x: number;
    z: number;
    topObj: Model;
    bottomObj: Model;
    middleObj: Model;
    bitset: number;
    offset: number;

    constructor(y: number, x: number, z: number, topObj: Model, bottomObj: Model, middleObj: Model, bitset: number, offset: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.topObj = topObj;
        this.bottomObj = bottomObj;
        this.middleObj = middleObj;
        this.bitset = bitset;
        this.offset = offset;
    }
}
