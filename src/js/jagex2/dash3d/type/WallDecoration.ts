import Model from '../../graphics/Model';

export default class WallDecoration {
    // constructor
    y: number;
    x: number;
    z: number;
    type: number;
    angle: number;
    model: Model;
    bitset: number;
    info: number; // byte

    constructor(y: number, x: number, z: number, type: number, angle: number, model: Model, bitset: number, info: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.type = type;
        this.angle = angle;
        this.model = model;
        this.bitset = bitset;
        this.info = info;
    }
}
