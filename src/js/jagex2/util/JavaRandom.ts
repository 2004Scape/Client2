export default class JavaRandom {
    private seed: bigint;

    constructor(seed: bigint) {
        this.seed = (seed ^ BigInt(0x5deece66d)) & BigInt((BigInt(1) << BigInt(48)) - BigInt(1));
    }

    setSeed = (seed: bigint): void => {
        this.seed = (seed ^ BigInt(0x5deece66d)) & BigInt((BigInt(1) << BigInt(48)) - BigInt(1));
    };

    nextInt = (): number => {
        return this.next(32);
    };

    next = (bits: number): number => {
        this.seed = (this.seed * BigInt(0x5deece66d) + BigInt(0xb)) & BigInt((BigInt(1) << BigInt(48)) - BigInt(1));
        return Number(this.seed) >>> (48 - bits);
    };
}
