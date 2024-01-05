import Buffer from '../io/Buffer.js';

import { decompress } from '../../vendor/bz2.js';

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadUrl(url) {
    return new Buffer(await (await fetch(url)).arrayBuffer());
}

export async function downloadText(url) {
    return (await fetch(url)).text();
}

export function decompressBz2(data, addMagic = true, prepend = true) {
    if (addMagic) {
        let magic = Uint8Array.from([ 'B'.charCodeAt(0), 'Z'.charCodeAt(0), 'h'.charCodeAt(0), '1'.charCodeAt(0) ]);
        
        if (prepend) {
            let temp = data;
            data = new Uint8Array(magic.length + data.length);
            data.set(temp, magic.length);
        }

        data.set(magic, 0);
    }

    return decompress(data);
}

export async function decodeJpeg(data) {
    if (data[0] !== 0xFF) {
        // fix invalid JPEG header
        data[0] = 0xFF;
    }

    // create img element
    let img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + btoa(String.fromCharCode(...data));

    // wait for img to load
    await new Promise(resolve => img.onload = resolve);

    // get imagedata from img element
    let canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
