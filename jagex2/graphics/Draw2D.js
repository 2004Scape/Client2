class Draw2D {
    pixels = null;
    width = -1;
    height = -1;
    top = -1;
    bottom = -1;
    left = -1;
    right = -1;
    boundX = -1;
    centerX = -1;
    centerY = -1;
    prepare(pixels, width, height) {
        this.pixels = pixels;
        this.width = width;
        this.height = height;
        this.setBounds(0, 0, width, height);
    }
    setBounds(x0, y0, x1, y1) {
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
    clear() {
        this.pixels.fill(0);
    }
    // draw a 1px border rectangle
    drawRect(x, y, w, h, color) {
        let pixels = this.pixels;
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
    fillRect(x, y, w, h, color) {
        let pixels = this.pixels;
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
export default new Draw2D();
