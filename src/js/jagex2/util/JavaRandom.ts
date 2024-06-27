export default class JavaRandom {
    private seed: bigint;

    constructor(seed: bigint) {
        this.seed = (seed ^ 0x5deece66dn) & ((1n << 48n) - 1n);
    }

    setSeed(seed: bigint): void {
        this.seed = (seed ^ 0x5deece66dn) & ((1n << 48n) - 1n);
    }

    nextInt(): number {
        return this.next(32);
    }

    next(bits: number): number {
        this.seed = (this.seed * 0x5deece66dn + 0xbn) & ((1n << 48n) - 1n);
        return Number(this.seed) >>> (48 - bits);
    }
}
