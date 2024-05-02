import Draw2D from './Draw2D';
import {canvas2d} from './Canvas';

export default class PixMap {
    // constructor
    private readonly image: ImageData;
    private readonly width: number;
    private readonly height: number;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly paint: Uint32Array;
    readonly pixels: Int32Array;

    constructor(width: number, height: number, ctx: CanvasRenderingContext2D = canvas2d) {
        this.ctx = ctx;
        this.image = this.ctx.getImageData(0, 0, width, height);
        this.paint = new Uint32Array(this.image.data.buffer);
        this.pixels = new Int32Array(width * height);
        this.width = width;
        this.height = height;
        this.bind();
    }

    clear(): void {
        this.pixels.fill(0);
    }

    bind(): void {
        Draw2D.bind(this.pixels, this.width, this.height);
    }

    draw(x: number, y: number): void {
        this.#setPixels();
        this.ctx.putImageData(this.image, x, y);
    }

    #setPixels(): void {
        const length: number = this.pixels.length;
        const pixels: Int32Array = this.pixels;
        const paint: Uint32Array = this.paint;
        for (let i: number = 0; i < length; i++) {
            const pixel: number = pixels[i];
            paint[i] = ((pixel >> 16) & 0xff) | (((pixel >> 8) & 0xff) << 8) | ((pixel & 0xff) << 16) | 0xff000000;
        }
    }
}
