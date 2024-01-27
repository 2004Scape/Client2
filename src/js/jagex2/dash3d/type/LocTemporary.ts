import Linkable from '../../datastruct/Linkable';

export default class LocTemporary extends Linkable {
    plane: number;
    layer: number;
    x: number;
    z: number;
    locIndex: number;
    angle: number;
    shape: number;
    lastLocIndex: number;
    lastAngle: number;
    lastShape: number;

    constructor() {
        super();
        this.plane = 0;
        this.layer = 0;
        this.x = 0;
        this.z = 0;
        this.locIndex = 0;
        this.angle = 0;
        this.shape = 0;
        this.lastLocIndex = 0;
        this.lastAngle = 0;
        this.lastShape = 0;
    }
}
