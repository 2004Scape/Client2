export const sleep = async (ms: number): Promise<void> => new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));
export const downloadUrl = async (url: string): Promise<ArrayBuffer> => await (await fetch(url)).arrayBuffer();
export const downloadText = async (url: string): Promise<string> => (await fetch(url)).text();

export const arraycopy = (src: Int32Array | Uint8Array, srcPos: number, dst: Int32Array | Uint8Array, dstPos: number, length: number): void => {
    while (length--) dst[dstPos++] = src[srcPos++];
};

export const bytesToBigInt = (bytes: Uint8Array): bigint => {
    let result: bigint = BigInt(0);
    for (let index: number = 0; index < bytes.length; index++) {
        result = (result << BigInt(8)) + BigInt(bytes[index]);
    }
    return result;
};

export const bigIntToBytes = (bigInt: bigint): Uint8Array => {
    const byteArray: number[] = [];
    while (bigInt > BigInt(0)) {
        byteArray.unshift(Number(bigInt & BigInt(0xff)));
        bigInt >>= BigInt(8);
    }
    return new Uint8Array(byteArray);
};

export const bigIntModPow = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
    let result: bigint = BigInt(1);
    while (exponent > BigInt(0)) {
        if (exponent % BigInt(2) === BigInt(1)) {
            result = (result * base) % modulus;
        }
        base = (base * base) % modulus;
        exponent >>= BigInt(1);
    }
    return result;
};
