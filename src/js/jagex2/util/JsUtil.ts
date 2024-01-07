import {decompress} from '../../vendor/bz2.js';

export const sleep = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
export const downloadUrl = async (url: string): Promise<Uint8Array> => new Uint8Array(await (await fetch(url)).arrayBuffer());
export const downloadText = async (url: string): Promise<string> => (await fetch(url)).text();

export const decompressBz2 = (data: Uint8Array, addMagic: boolean = true, prepend: boolean = true): Uint8Array => {
    if (addMagic) {
        const magic = Uint8Array.from(['B'.charCodeAt(0), 'Z'.charCodeAt(0), 'h'.charCodeAt(0), '1'.charCodeAt(0)]);

        if (prepend) {
            const temp = data;
            data = new Uint8Array(magic.length + data.length);
            data.set(temp, magic.length);
        }

        data.set(magic, 0);
    }

    return decompress(data);
};

export const decodeJpeg = async (data: Uint8Array | null): Promise<ImageData> => {
    if (!data) {
        throw new Error('Input jpeg data was null!');
    }
    if (data[0] !== 0xff) {
        // fix invalid JPEG header
        data[0] = 0xff;
    }

    // create img element
    const img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + btoa(String.fromCharCode(...data));

    // wait for img to load
    await new Promise(resolve => (img.onload = resolve));

    // get imagedata from img element
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2d not found!!!!!!!!');
    }
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const arraycopy = (src: Int32Array, srcPos: number, dst: Int32Array, dstPos: number, length: number): void => {
    while (length--) dst[dstPos++] = src[srcPos++];
};
