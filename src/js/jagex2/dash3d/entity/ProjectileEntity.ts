import SpotAnimType from '../../config/SpotAnimType';
import Entity from './Entity';
import Model from '../../graphics/Model';

export default class ProjectileEntity extends Entity {
    // constructor
    readonly spotanim: SpotAnimType;
    readonly level: number;
    readonly srcX: number;
    readonly srcZ: number;
    readonly srcY: number;
    readonly offsetY: number;
    readonly startCycle: number;
    readonly lastCycle: number;
    readonly peakPitch: number;
    readonly arc: number;
    readonly target: number;

    // runtime
    mobile: boolean = false;
    x: number = 0.0;
    z: number = 0.0;
    y: number = 0.0;
    velocityX: number = 0.0;
    velocityZ: number = 0.0;
    velocity: number = 0.0;
    velocityY: number = 0.0;
    accelerationY: number = 0.0;
    yaw: number = 0;
    pitch: number = 0;
    seqFrame: number = 0;
    seqCycle: number = 0;

    constructor(spotanim: number, level: number, srcX: number, srcY: number, srcZ: number, startCycle: number, lastCycle: number, peakPitch: number, arc: number, target: number, offsetY: number) {
        super();
        this.spotanim = SpotAnimType.instances[spotanim];
        this.level = level;
        this.srcX = srcX;
        this.srcZ = srcZ;
        this.srcY = srcY;
        this.startCycle = startCycle;
        this.lastCycle = lastCycle;
        this.peakPitch = peakPitch;
        this.arc = arc;
        this.target = target;
        this.offsetY = offsetY;
    }

    updateVelocity(dstX: number, dstY: number, dstZ: number, cycle: number): void {
        if (!this.mobile) {
            const dx: number = dstX - this.srcX;
            const dz: number = dstZ - this.srcZ;
            const d: number = Math.sqrt(dx * dx + dz * dz);

            this.x = this.srcX + (dx * this.arc) / d;
            this.z = this.srcZ + (dz * this.arc) / d;
            this.y = this.srcY;
        }

        const dt: number = this.lastCycle + 1 - cycle;
        this.velocityX = (dstX - this.x) / dt;
        this.velocityZ = (dstZ - this.z) / dt;
        this.velocity = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ);
        if (!this.mobile) {
            this.velocityY = -this.velocity * Math.tan(this.peakPitch * 0.02454369);
        }
        this.accelerationY = ((dstY - this.y - this.velocityY * dt) * 2.0) / (dt * dt);
    }

    update(delta: number): void {
        this.mobile = true;
        this.x += this.velocityX * delta;
        this.z += this.velocityZ * delta;
        this.y += this.velocityY * delta + this.accelerationY * 0.5 * delta * delta;
        this.velocityY += this.accelerationY * delta;
        this.yaw = ((Math.atan2(this.velocityX, this.velocityZ) * 325.949 + 1024) | 0) & 0x7ff;
        this.pitch = ((Math.atan2(this.velocityY, this.velocity) * 325.949) | 0) & 0x7ff;

        if (!this.spotanim.seq || !this.spotanim.seq.delay) {
            return;
        }
        this.seqCycle += delta;
        while (this.seqCycle > this.spotanim.seq.delay[this.seqFrame]) {
            this.seqCycle -= this.spotanim.seq.delay[this.seqFrame] + 1;
            this.seqFrame++;
            if (this.seqFrame >= this.spotanim.seq.frameCount) {
                this.seqFrame = 0;
            }
        }
    }

    draw(): Model | null {
        const tmp: Model = this.spotanim.getModel();
        const model: Model = Model.modelShareColored(tmp, true, !this.spotanim.disposeAlpha, false);

        if (this.spotanim.seq && this.spotanim.seq.frames) {
            model.createLabelReferences();
            model.applyTransform(this.spotanim.seq.frames[this.seqFrame]);
            model.labelFaces = null;
            model.labelVertices = null;
        }

        if (this.spotanim.resizeh !== 128 || this.spotanim.resizev !== 128) {
            model.scale(this.spotanim.resizeh, this.spotanim.resizev, this.spotanim.resizeh);
        }

        model.rotateX(this.pitch);
        model.calculateNormals(64 + this.spotanim.ambient, 850 + this.spotanim.contrast, -30, -50, -30, true);
        return model;
    }
}
