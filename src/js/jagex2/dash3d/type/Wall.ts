import Model from '../../graphics/Model';

export default class Wall {
    // constructor
    readonly y: number;
    readonly x: number;
    readonly z: number;
    readonly typeA: number;
    readonly typeB: number;
    readonly modelA: Model | null;
    readonly modelB: Model | null;
    readonly bitset: number;
    readonly info: number; // byte

    constructor(y: number, x: number, z: number, typeA: number, typeB: number, modelA: Model | null, modelB: Model | null, bitset: number, info: number) {
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
