import Draw2D from './Draw2D';
import {canvas2d} from './Canvas';

export default class PixMap {
    // constructor
    readonly image: ImageData;
    readonly pixels: Int32Array;
    readonly width: number;
    readonly height: number;

    constructor(width: number, height: number) {
        this.image = canvas2d.getImageData(0, 0, width, height);
        this.pixels = new Int32Array(width * height);
        this.width = width;
        this.height = height;
        this.bind();
    }

    clear = (): void => {
        this.pixels.fill(0);
    };

    bind = (): void => {
        Draw2D.bind(this.pixels, this.width, this.height);
    };

    draw = (width: number, height: number): void => {
        this.#setPixels();
        canvas2d.putImageData(this.image, width, height);
    };

    #setPixels = (): void => {
        // copy pixels (uint32) to imageData (uint8)
        const data: Uint8ClampedArray = this.image.data;
        for (let i: number = 0; i < this.pixels.length; i++) {
            const pixel: number = this.pixels[i];
            const index: number = i * 4;
            data[index] = (pixel >> 16) & 0xff;
            data[index + 1] = (pixel >> 8) & 0xff;
            data[index + 2] = (pixel >> 0) & 0xff;
            data[index + 3] = 255;
        }
    };
}
