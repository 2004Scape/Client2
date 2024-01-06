export default class Draw2D {
    static pixels: Uint32Array | null = null;

    static width: number = 0;
    static height: number = 0;

    static top: number = 0;
    static bottom: number = 0;
    static left: number = 0;
    static right: number = 0;
    static boundX: number = 0;

    static centerX: number = 0;
    static centerY: number = 0;

    static prepare(pixels: Uint32Array, width: number, height: number): void {
        this.pixels = pixels;
        this.width = width;
        this.height = height;
        this.setBounds(0, 0, width, height);
    }

    static setBounds(x0: number, y0: number, x1: number, y1: number): void {
        if (x0 < 0) {
            x0 = 0;
        }

        if (y0 < 0) {
            y0 = 0;
        }

        if (x1 > this.width) {
            x1 = this.width;
        }

        if (y1 > this.height) {
            y1 = this.height;
        }

        this.top = y0;
        this.bottom = y1;
        this.left = x0;
        this.right = x1;
        this.boundX = this.right - 1;
        this.centerX = this.right / 2;
        this.centerY = this.bottom / 2;
    }

    static clear() {
        this.pixels?.fill(0);
    }

    // draw a 1px border rectangle
    static drawRect(x: number, y: number, w: number, h: number, color: number): void {
        let pixels = this.pixels;
        if (pixels === null) {
            return;
        }

        let x0 = x;
        let y0 = y;
        let x1 = x + w;
        let y1 = y + h;

        if (x0 < this.left) {
            x0 = this.left;
        }

        if (y0 < this.top) {
            y0 = this.top;
        }

        if (x1 > this.right) {
            x1 = this.right;
        }

        if (y1 > this.bottom) {
            y1 = this.bottom;
        }

        let width = this.width;

        for (let xx = x0; xx < x1; xx++) {
            let off = xx + (y0 * width);
            pixels[off] = color;
            off = xx + ((y1 - 1) * width);
            pixels[off] = color;
        }

        for (let yy = y0; yy < y1; yy++) {
            let off = x0 + (yy * width);
            pixels[off] = color;
            off = (x1 - 1) + (yy * width);
            pixels[off] = color;
        }
    }

    // fill in a rectangle area
    static fillRect(x: number, y: number, w: number, h: number, color: number): void {
        let pixels = this.pixels;
        if (pixels === null) {
            return;
        }

        let x0 = x;
        let y0 = y;
        let x1 = x + w;
        let y1 = y + h;

        if (x0 < this.left) {
            x0 = this.left;
        }

        if (y0 < this.top) {
            y0 = this.top;
        }

        if (x1 > this.right) {
            x1 = this.right;
        }

        if (y1 > this.bottom) {
            y1 = this.bottom;
        }

        let width = this.width;

        for (let yy = y0; yy < y1; yy++) {
            let off = x0 + (yy * width);
            pixels.fill(color, off, off + (x1 - x0));
        }
    }
}
