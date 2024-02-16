type SyncInitInput = BufferSource | WebAssembly.Module;
type InitInput = RequestInfo | URL | Response | SyncInitInput;
type ByteArrayInput = Uint8Array | Int8Array | Uint8ClampedArray | readonly number[];
/**
 * If `module_or_path` is {@link RequestInfo} or {@link URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param module_or_path
 */
export default function init(module_or_path?: InitInput | Promise<InitInput> | undefined): Promise<void>;
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param module
 */
export declare function initSync(module: SyncInitInput): void;
/**
 * Represents an error that occured while attempting to decompress
 * gzipped data.
 */
export declare class DecompressionError extends Error {
    name: string;
    constructor(message: string);
}
/**
 * Compresses the given bytes / UTF-8 string and returns a buffer.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param data Binary data or UTF-8 string.
 * @returns GZip compressed binary data.
 */
export declare function compress(data: ByteArrayInput | string): Uint8Array;
/**
 * Compresses the data provided by {@link cb}. This method is the most
 * efficient as it writes directly into WASM memory without copying.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param len Length in bytes.
 * @param cb Callback which initializes the data array.
 * @returns GZip compressed binary data.
 */
export declare function compress(len: number, cb: (data: Uint8Array) => void): Uint8Array;
/**
 * Decompresses the given bytes and returns a buffer.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param data GZip compressed binary data.
 * @returns Raw binary data.
 */
export declare function decompress(data: ByteArrayInput): Uint8Array;
/**
 * Decompresses the data provided by {@link cb}. This method is the most
 * efficient as it writes directly into WASM memory without copying.
 *
 * **NOTE:** The returned buffer is only valid until new data is (de-)compressed.
 *
 * @param len Length in bytes.
 * @param cb Callback which initializes the data array.
 * @returns Raw binary data.
 */
export declare function decompress(len: number, cb: (data: Uint8Array) => void): Uint8Array;
/**
 * Deallocates the buffer used to store the result of (de-)compression.
 */
export declare function freeBuffer(): void;
export {};
