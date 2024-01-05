import Draw2D from './Draw2D.js';
export default class CanvasFrameBuffer {
    canvas = null;
    ctx = null;
    image = null;
    pixels = null;
    width = -1;
    height = -1;
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.imageData = this.ctx.getImageData(0, 0, width, height);
        this.pixels = new Uint32Array(width * height);
        this.width = width;
        this.height = height;
        this.bind();
    }
    clear() {
        this.pixels.fill(0);
    }
    bind() {
        Draw2D.prepare(this.pixels, this.width, this.height);
    }
    draw(x, y) {
        this.#setPixels();
        this.ctx.putImageData(this.imageData, x, y);
    }
    #setPixels() {
        // copy pixels (uint32) to imageData (uint8)
        const data = this.imageData.data;
        for (let i = 0; i < this.pixels.length; i++) {
            const pixel = this.pixels[i];
            const index = i * 4;
            data[index + 0] = (pixel >> 16) & 0xff;
            data[index + 1] = (pixel >> 8) & 0xff;
            data[index + 2] = (pixel >> 0) & 0xff;
            data[index + 3] = 255;
        }
    }
}
