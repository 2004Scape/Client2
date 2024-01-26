import {__Record5, instantiate} from './bz2.js';

export default class Bzip {
    private static bz2: {
        newBzip2State(): __Record5<never>;
        read(length: number, stream: Int8Array, avail_in: number, next_in: number, state: __Record5<undefined>): Int8Array;
    } | null = null;

    private static state: __Record5<never> | null = null;

    static load = async (bytes: BufferSource): Promise<void> => {
        const bz2wasm: WebAssembly.Module = new WebAssembly.Module(bytes);
        const bz2: {
            newBzip2State(): __Record5<never>;
            read(length: number, stream: Int8Array, avail_in: number, next_in: number, state: __Record5<undefined>): Int8Array;
        } = await instantiate(bz2wasm, {env: undefined});
        this.bz2 = bz2;
        this.state = bz2.newBzip2State();
    };

    static decompressBz2 = (length: number, stream: Int8Array, avail_in: number, next_in: number): Int8Array => {
        if (!this.bz2 || !this.state) {
            throw new Error('bz2 not found!!');
        }
        return this.bz2.read(length, stream, avail_in, next_in, this.state);
    };
}
