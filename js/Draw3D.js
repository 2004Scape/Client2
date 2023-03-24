class Draw3D {
    static reciprocal15 = [];
    static reciprocal16 = [];
    static sin = [];
    static cos = [];

    static {
        for (let i = 1; i < 512; i++) {
            Draw3D.reciprocal15[i] = 32768 / i;
        }

        for (let i = 1; i < 2048; i++) {
            Draw3D.reciprocal16[i] = 65536 / i;
        }

        for (let i = 0; i < 2048; i++) {
            Draw3D.sin[i] = Math.trunc(Math.sin(i * 0.0030679615757712823) * 65536);
            Draw3D.cos[i] = Math.trunc(Math.cos(i * 0.0030679615757712823) * 65536);
        }
    }
}

export default new Draw3D();
