export default class Draw2D {
    static pixels: Int32Array = new Int32Array();

    static width: number = 0;
    static height: number = 0;

    static top: number = 0;
    static bottom: number = 0;
    static left: number = 0;
    static right: number = 0;
    static boundX: number = 0;

    static centerX: number = 0;
    static centerY: number = 0;

    static bind = (pixels: Int32Array, width: number, height: number): void => {
        this.pixels = pixels;
        this.width = width;
        this.height = height;
        this.setBounds(0, 0, width, height);
    };

    static resetBounds = (): void => {
        this.left = 0;
        this.top = 0;
        this.right = this.width;
        this.bottom = this.height;
        this.boundX = this.right - 1;
        this.centerX = this.right / 2;
    };

    static setBounds = (left: number, top: number, right: number, bottom: number): void => {
        if (left < 0) {
            left = 0;
        }

        if (top < 0) {
            top = 0;
        }

        if (right > this.width) {
            right = this.width;
        }

        if (bottom > this.height) {
            bottom = this.height;
        }

        this.top = top;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
        this.boundX = this.right - 1;
        this.centerX = this.right / 2;
        this.centerY = this.bottom / 2;
    };

    static clear = (): void => {
        this.pixels.fill(0);
    };

    // draw a 1px border rectangle
    static drawRect = (x: number, y: number, w: number, h: number, color: number): void => {
        this.drawHorizontalLine(x, y, color, w);
        this.drawHorizontalLine(x, y + h - 1, color, w);
        this.drawVerticalLine(x, y, color, h);
        this.drawVerticalLine(x + w - 1, y, color, h);
    };

    static drawHorizontalLine = (x: number, y: number, color: number, width: number): void => {
        if (y < this.top || y >= this.bottom) {
            return;
        }

        if (x < this.left) {
            width -= this.left - x;
            x = this.left;
        }

        if (x + width > this.right) {
            width = this.right - x;
        }

        const off: number = x + y * this.width;
        for (let i: number = 0; i < width; i++) {
            this.pixels[off + i] = color;
        }
    };

    static drawVerticalLine = (x: number, y: number, color: number, width: number): void => {
        if (x < this.left || x >= this.right) {
            return;
        }

        if (y < this.top) {
            width -= this.top - y;
            y = this.top;
        }

        if (y + width > this.bottom) {
            width = this.bottom - y;
        }

        const off: number = x + y * this.width;
        for (let i: number = 0; i < width; i++) {
            this.pixels[off + i * this.width] = color;
        }
    };

    static drawLine = (x1: number, y1: number, x2: number, y2: number, color: number): void => {
        const dx: number = Math.abs(x2 - x1);
        const dy: number = Math.abs(y2 - y1);

        const sx: number = x1 < x2 ? 1 : -1;
        const sy: number = y1 < y2 ? 1 : -1;

        let err: number = dx - dy;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (x1 >= this.left && x1 < this.right && y1 >= this.top && y1 < this.bottom) {
                this.pixels[x1 + y1 * this.width] = color;
            }

            if (x1 === x2 && y1 === y2) {
                break;
            }

            const e2: number = 2 * err;

            if (e2 > -dy) {
                err = err - dy;
                x1 = x1 + sx;
            }

            if (e2 < dx) {
                err = err + dx;
                y1 = y1 + sy;
            }
        }
    };

    // fill in a rectangle area
    static fillRect = (x: number, y: number, w: number, h: number, color: number): void => {
        const pixels: Int32Array = this.pixels;

        let x0: number = x;
        let y0: number = y;
        let x1: number = x + w;
        let y1: number = y + h;

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

        const width: number = this.width;

        for (let yy: number = y0; yy < y1; yy++) {
            const off: number = x0 + yy * width;
            pixels.fill(color, off, off + (x1 - x0));
        }
    };
}
