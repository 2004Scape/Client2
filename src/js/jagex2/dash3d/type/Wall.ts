import Model from '../../graphics/Model';

export default class Wall {
    // constructor
    y: number;
    x: number;
    z: number;
    typeA: number;
    typeB: number;
    modelA: Model;
    modelB: Model;
    bitset: number;
    info: number; // byte

    constructor(y: number, x: number, z: number, typeA: number, typeB: number, modelA: Model, modelB: Model, bitset: number, info: number) {
        this.y = y;
        this.x = x;
        this.z = z;
        this.typeA = typeA;
        this.typeB = typeB;
        this.modelA = modelA;
        this.modelB = modelB;
        this.bitset = bitset;
        this.info = info;
    }
}
