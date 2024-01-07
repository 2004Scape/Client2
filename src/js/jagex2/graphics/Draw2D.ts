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

    static setBounds = (x0: number, y0: number, x1: number, y1: number): void => {
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
    };

    static clear = () => {
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

        const off = x + y * this.width;
        for (let i = 0; i < width; i++) {
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

        const off = x + y * this.width;
        for (let i = 0; i < width; i++) {
            this.pixels[off + i * this.width] = color;
        }
    };

    static drawLine = (x1: number, y1: number, x2: number, y2: number, color: number): void => {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);

        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;

        let err = dx - dy;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (x1 >= this.left && x1 < this.right && y1 >= this.top && y1 < this.bottom) {
                this.pixels[x1 + y1 * this.width] = color;
            }

            if (x1 == x2 && y1 == y2) {
                break;
            }

            const e2 = 2 * err;

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
        const pixels = this.pixels;

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

        const width = this.width;

        for (let yy = y0; yy < y1; yy++) {
            const off = x0 + yy * width;
            pixels.fill(color, off, off + (x1 - x0));
        }
    };
}
