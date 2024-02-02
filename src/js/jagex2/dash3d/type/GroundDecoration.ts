import Model from '../../graphics/Model';

export default class GroundDecoration {
    // constructor
    readonly y: number;
    readonly x: number;
    readonly z: number;
    model: Model | null;
    readonly bitset: number;
    readonly info: number; // byte

    constructor(y: number, x: number, z: number, model: Model | null, bitset: number, info: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.model = model;
        this.bitset = bitset;
        this.info = info;
    }
}
