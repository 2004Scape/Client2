import Model from '../../graphics/Model';

export default class GroundDecoration {
    // constructor
    y: number;
    x: number;
    z: number;
    model: Model;
    bitset: number;
    info: number; // byte

    constructor(y: number, x: number, z: number, model: Model, bitset: number, info: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.model = model;
        this.bitset = bitset;
        this.info = info;
    }
}
