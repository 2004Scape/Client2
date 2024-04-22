export const sleep = async (ms: number): Promise<void> => new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));
export const downloadUrl = async (url: string): Promise<Int8Array> => new Int8Array(await (await fetch(url)).arrayBuffer());
export const downloadText = async (url: string): Promise<string> => (await fetch(url)).text();

export function arraycopy(src: Int32Array | Uint8Array, srcPos: number, dst: Int32Array | Uint8Array, dstPos: number, length: number): void {
    while (length--) dst[dstPos++] = src[srcPos++];
}

export function bytesToBigInt(bytes: Uint8Array): bigint {
    let result: bigint = 0n;
    for (let index: number = 0; index < bytes.length; index++) {
        result = (result << 8n) + BigInt(bytes[index]);
    }
    return result;
}

export function bigIntToBytes(bigInt: bigint): Uint8Array {
    const byteArray: number[] = [];
    while (bigInt > 0n) {
        byteArray.unshift(Number(bigInt & 255n));
        bigInt >>= 8n;
    }
    return new Uint8Array(byteArray);
}

export function bigIntModPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result: bigint = 1n;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent >>= 1n;
    }
    return result;
}
