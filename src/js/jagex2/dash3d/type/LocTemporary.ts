import Linkable from '../../datastruct/Linkable';

export default class LocTemporary extends Linkable {
    // constructor
    readonly plane: number;
    readonly layer: number;
    x: number;
    z: number;
    locIndex: number;
    angle: number;
    shape: number;
    readonly lastLocIndex: number;
    readonly lastAngle: number;
    readonly lastShape: number;

    constructor(plane: number, layer: number, x: number, z: number, locIndex: number, angle: number, shape: number, lastLocIndex: number, lastAngle: number, lastShape: number) {
        super();
        this.plane = plane;
        this.layer = layer;
        this.x = x;
        this.z = z;
        this.locIndex = locIndex;
        this.angle = angle;
        this.shape = shape;
        this.lastLocIndex = lastLocIndex;
        this.lastAngle = lastAngle;
        this.lastShape = lastShape;
    }
}
