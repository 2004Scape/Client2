import {instantiate} from './bz2.js';

export default class Bzip {
    private static bz2: {
        read(length: number, stream: ArrayLike<number>, avail_in: number, next_in: number): ArrayLike<number>;
    } | null = null;

    static load = async (bytes: BufferSource): Promise<void> => {
        this.bz2 = await instantiate(new WebAssembly.Module(bytes), {env: undefined});
    };

    static read = (length: number, stream: ArrayLike<number>, avail_in: number, next_in: number): Int8Array => {
        if (!this.bz2) {
            throw new Error('bz2 not found!!');
        }
        return Int8Array.from(this.bz2.read(length, stream, avail_in, next_in));
    };
}
