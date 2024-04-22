import Entity from './Entity';
import SeqType from '../../config/SeqType';
import {TypedArray1d} from '../../util/Arrays';

export default abstract class PathingEntity extends Entity {
    x: number = 0;
    z: number = 0;
    yaw: number = 0;
    seqStretches: boolean = false;
    size: number = 1;
    seqStandId: number = -1;
    seqTurnId: number = -1;
    seqWalkId: number = -1;
    seqTurnAroundId: number = -1;
    seqTurnLeftId: number = -1;
    seqTurnRightId: number = -1;
    seqRunId: number = -1;
    chat: string | null = null;
    chatTimer: number = 100;
    chatColor: number = 0;
    chatStyle: number = 0;
    damage: number = 0;
    damageType: number = 0;
    combatCycle: number = -1000;
    health: number = 0;
    totalHealth: number = 0;
    targetId: number = -1;
    targetTileX: number = 0;
    targetTileZ: number = 0;
    secondarySeqId: number = -1;
    secondarySeqFrame: number = 0;
    secondarySeqCycle: number = 0;
    primarySeqId: number = -1;
    primarySeqFrame: number = 0;
    primarySeqCycle: number = 0;
    primarySeqDelay: number = 0;
    primarySeqLoop: number = 0;
    spotanimId: number = -1;
    spotanimFrame: number = 0;
    spotanimCycle: number = 0;
    spotanimLastCycle: number = 0;
    spotanimOffset: number = 0;
    forceMoveStartSceneTileX: number = 0;
    forceMoveEndSceneTileX: number = 0;
    forceMoveStartSceneTileZ: number = 0;
    forceMoveEndSceneTileZ: number = 0;
    forceMoveEndCycle: number = 0;
    forceMoveStartCycle: number = 0;
    forceMoveFaceDirection: number = 0;
    cycle: number = 0;
    height: number = 0;
    dstYaw: number = 0;
    pathLength: number = 0;
    pathTileX: Int32Array = new Int32Array(10);
    pathTileZ: Int32Array = new Int32Array(10);
    pathRunning: boolean[] = new TypedArray1d(10, false);
    seqTrigger: number = 0;

    lastMask: number = -1;
    lastMaskCycle: number = -1;
    lastFaceX: number = -1;
    lastFaceZ: number = -1;

    abstract isVisible(): boolean;

    move(teleport: boolean, x: number, z: number): void {
        if (this.primarySeqId !== -1 && SeqType.instances[this.primarySeqId].priority <= 1) {
            this.primarySeqId = -1;
        }

        if (!teleport) {
            const dx: number = x - this.pathTileX[0];
            const dz: number = z - this.pathTileZ[0];

            if (dx >= -8 && dx <= 8 && dz >= -8 && dz <= 8) {
                if (this.pathLength < 9) {
                    this.pathLength++;
                }

                for (let i: number = this.pathLength; i > 0; i--) {
                    this.pathTileX[i] = this.pathTileX[i - 1];
                    this.pathTileZ[i] = this.pathTileZ[i - 1];
                    this.pathRunning[i] = this.pathRunning[i - 1];
                }

                this.pathTileX[0] = x;
                this.pathTileZ[0] = z;
                this.pathRunning[0] = false;
                return;
            }
        }

        this.pathLength = 0;
        this.seqTrigger = 0;
        this.pathTileX[0] = x;
        this.pathTileZ[0] = z;
        this.x = this.pathTileX[0] * 128 + this.size * 64;
        this.z = this.pathTileZ[0] * 128 + this.size * 64;
    }

    step(running: boolean, direction: number): void {
        let nextX: number = this.pathTileX[0];
        let nextZ: number = this.pathTileZ[0];

        if (direction === 0) {
            nextX--;
            nextZ++;
        } else if (direction === 1) {
            nextZ++;
        } else if (direction === 2) {
            nextX++;
            nextZ++;
        } else if (direction === 3) {
            nextX--;
        } else if (direction === 4) {
            nextX++;
        } else if (direction === 5) {
            nextX--;
            nextZ--;
        } else if (direction === 6) {
            nextZ--;
        } else if (direction === 7) {
            nextX++;
            nextZ--;
        }

        if (this.primarySeqId !== -1 && SeqType.instances[this.primarySeqId].priority <= 1) {
            this.primarySeqId = -1;
        }

        if (this.pathLength < 9) {
            this.pathLength++;
        }

        for (let i: number = this.pathLength; i > 0; i--) {
            this.pathTileX[i] = this.pathTileX[i - 1];
            this.pathTileZ[i] = this.pathTileZ[i - 1];
            this.pathRunning[i] = this.pathRunning[i - 1];
        }

        this.pathTileX[0] = nextX;
        this.pathTileZ[0] = nextZ;
        this.pathRunning[0] = running;
    }
}
