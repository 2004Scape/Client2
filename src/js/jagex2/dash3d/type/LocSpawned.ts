import Linkable from '../../datastruct/Linkable';

export default class LocSpawned extends Linkable {
    readonly plane: number;
    readonly layer: number;
    readonly x: number;
    readonly z: number;
    readonly locIndex: number;
    readonly angle: number;
    readonly shape: number;
    readonly lastCycle: number;

    constructor(plane: number, layer: number, x: number, z: number, locIndex: number, angle: number, shape: number, lastCycle: number) {
        super();
        this.plane = plane;
        this.layer = layer;
        this.x = x;
        this.z = z;
        this.locIndex = locIndex;
        this.angle = angle;
        this.shape = shape;
        this.lastCycle = lastCycle;
    }
}
