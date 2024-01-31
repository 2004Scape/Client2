import Draw2D from './Draw2D';
import {canvas2d} from './Canvas';
import Colors from './Colors';

export default class PixMap {
    // constructor
    readonly image: ImageData;
    readonly pixels: Int32Array;
    readonly width: number;
    readonly height: number;
    readonly ctx: CanvasRenderingContext2D;

    constructor(width: number, height: number, ctx: CanvasRenderingContext2D = canvas2d) {
        this.ctx = ctx;
        this.image = this.ctx.getImageData(0, 0, width, height);
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

    draw = (width: number, height: number, magenta: boolean = false): void => {
        this.#setPixels(magenta);
        this.ctx.putImageData(this.image, width, height);
    };

    #setPixels = (magenta: boolean = false): void => {
        // copy pixels (uint32) to imageData (uint8)
        const data: Uint8ClampedArray = this.image.data;

        if (magenta) {
            for (let i: number = 0; i < this.pixels.length; i++) {
                const pixel: number = this.pixels[i];
                const index: number = i * 4;

                if (pixel === Colors.MAGENTA) {
                    data[index] = 0;
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                    data[index + 3] = 0;
                } else {
                    data[index] = (pixel >> 16) & 0xff;
                    data[index + 1] = (pixel >> 8) & 0xff;
                    data[index + 2] = (pixel >> 0) & 0xff;
                    data[index + 3] = 255;
                }
            }
        } else {
            for (let i: number = 0; i < this.pixels.length; i++) {
                const pixel: number = this.pixels[i];
                const index: number = i * 4;
                data[index] = (pixel >> 16) & 0xff;
                data[index + 1] = (pixel >> 8) & 0xff;
                data[index + 2] = (pixel >> 0) & 0xff;
                data[index + 3] = 255;
            }
        }
    };
}
