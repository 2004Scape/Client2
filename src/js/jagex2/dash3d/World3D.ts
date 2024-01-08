import Draw3D from '../graphics/Draw3D';

export default class World3D {
    private static visibilityMatrix: boolean[][][][] = [];

    private static viewportLeft: number = 0;
    private static viewportTop: number = 0;
    private static viewportRight: number = 0;
    private static viewportBottom: number = 0;
    private static viewportCenterX: number = 0;
    private static viewportCenterY: number = 0;

    private static sinEyePitch: number = 0;
    private static cosEyePitch: number = 0;
    private static sinEyeYaw: number = 0;
    private static cosEyeYaw: number = 0;

    static {
        this.visibilityMatrix = new Array(8);
        for (let i = 0; i < 8; i++) {
            this.visibilityMatrix[i] = new Array(32);
            for (let j = 0; j < 32; j++) {
                this.visibilityMatrix[i][j] = new Array(51);
                for (let k = 0; k < 51; k++) {
                    this.visibilityMatrix[i][j][k] = new Array(51).fill(false);
                }
            }
        }
    }

    static init = (viewportWidth: number, viewportHeight: number, frustumStart: number, frustumEnd: number, pitchDistance: Int32Array): void => {
        this.viewportLeft = 0;
        this.viewportTop = 0;
        this.viewportRight = viewportWidth;
        this.viewportBottom = viewportHeight;
        this.viewportCenterX = viewportWidth / 2;
        this.viewportCenterY = viewportHeight / 2;

        const matrix: boolean[][][][] = new Array(9);

        for (let i = 0; i < 9; i++) {
            matrix[i] = new Array(32);
            for (let j = 0; j < 32; j++) {
                matrix[i][j] = new Array(53);
                for (let k = 0; k < 53; k++) {
                    matrix[i][j][k] = new Array(53).fill(false);
                }
            }
        }

        for (let pitch = 128; pitch <= 384; pitch += 32) {
            for (let yaw = 0; yaw < 2048; yaw += 64) {
                this.sinEyePitch = Draw3D.sin[pitch];
                this.cosEyePitch = Draw3D.cos[pitch];
                this.sinEyeYaw = Draw3D.sin[yaw];
                this.cosEyeYaw = Draw3D.cos[yaw];

                const pitchLevel = (pitch - 128) / 32;
                const yawLevel = yaw / 64;
                for (let dx = -26; dx <= 26; dx++) {
                    for (let dz = -26; dz <= 26; dz++) {
                        const x = dx * 128;
                        const z = dz * 128;

                        let visible = false;
                        for (let y = -frustumStart; y <= frustumEnd; y += 128) {
                            if (this.testPoint(x, z, pitchDistance[pitchLevel] + y)) {
                                visible = true;
                                break;
                            }
                        }
                        matrix[pitchLevel][yawLevel][dx + 25 + 1][dz + 25 + 1] = visible;
                    }
                }
            }
        }

        for (let pitchLevel = 0; pitchLevel < 8; pitchLevel++) {
            for (let yawLevel = 0; yawLevel < 32; yawLevel++) {
                for (let x = -25; x < 25; x++) {
                    for (let z = -25; z < 25; z++) {
                        let visible = false;
                        check_areas: for (let dx = -1; dx <= 1; dx++) {
                            for (let dz = -1; dz <= 1; dz++) {
                                if (matrix[pitchLevel][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel + 1][yawLevel][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }

                                if (matrix[pitchLevel + 1][(yawLevel + 1) % 31][x + dx + 25 + 1][z + dz + 25 + 1]) {
                                    visible = true;
                                    break check_areas;
                                }
                            }
                        }
                        this.visibilityMatrix[pitchLevel][yawLevel][x + 25][z + 25] = visible;
                    }
                }
            }
        }
    };

    reset = (): void => {
        // TODO
    };

    private static testPoint = (x: number, z: number, y: number): boolean => {
        const px = (z * this.sinEyeYaw + x * this.cosEyeYaw) >> 16;
        const tmp = (z * this.cosEyeYaw - x * this.sinEyeYaw) >> 16;
        const pz = (y * this.sinEyePitch + tmp * this.cosEyePitch) >> 16;
        const py = (y * this.cosEyePitch - tmp * this.sinEyePitch) >> 16;
        if (pz < 50 || pz > 3500) {
            return false;
        }
        const viewportX = this.viewportCenterX + (px << 9) / pz;
        const viewportY = this.viewportCenterY + (py << 9) / pz;
        return viewportX >= this.viewportLeft && viewportX <= this.viewportRight && viewportY >= this.viewportTop && viewportY <= this.viewportBottom;
    };
}
