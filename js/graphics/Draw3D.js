class Draw3D {
    static reciprocal15 = new Int32Array(512);
    static reciprocal16 = new Int32Array(2048);
    static sin = new Int32Array(2048);
    static cos = new Int32Array(2048);

    static {
        for (let i = 1; i < 512; i++) {
            Draw3D.reciprocal15[i] = 32768 / i;
        }

        for (let i = 1; i < 2048; i++) {
            Draw3D.reciprocal16[i] = 65536 / i;
        }

        for (let i = 0; i < 2048; i++) {
            // angular frequency: 2 * pi / 2048 = 0.0030679615757712823
            // * 65536 = maximum amplitude
            Draw3D.sin[i] = Math.trunc(Math.sin(i * 0.0030679615757712823) * 65536);
            Draw3D.cos[i] = Math.trunc(Math.cos(i * 0.0030679615757712823) * 65536);
        }
    }
}

export default new Draw3D();
