import CanvasFrameBuffer from './graphics/CanvasFrameBuffer.js';

import { sleep } from './util/JsUtil.js';

export default class GameShell {
    canvas = null;
    ctx = null;

    state = 0;
    deltime = 20;
    mindel = 1;
    otim = [];
    fps = 0;
    width = -1;
    height = -1;
    drawArea = null;
    redrawScreen = true;

    idleCycles = 0;
    mouseButton = 0;
    mouseX = 0;
    mouseY = 0;
    mouseClickButton = 0;
    mouseClickX = 0;
    mouseClickY = 0;
    actionKey = [];
    keyQueue = [];
    keyQueueReadPos = 0;
    keyQueueWritePos = 0;

    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.drawArea = new CanvasFrameBuffer(this.canvas, this.width, this.height);
    }

    async run() {
        await this.showProgress(0, 'Loading...');
        await this.load();

        let opos = 0;
        let ratio = 256;
        let delta = 1;
        let count = 0;
        for (let i = 0; i < 10; i++) {
            this.otim[i] = Date.now();
        }

        while (this.state >= 0) {
            if (this.state > 0) {
                this.state--;

                if (this.state === 0) {
                    this.shutdown();
                    return;
                }
            }

            let lastRatio = ratio;
            let lastDelta = delta;
            ratio = 300;
            delta = 1;

            let ntime = Date.now();
            if (this.otim[opos] === 0) {
                ratio = lastRatio;
                delta = lastDelta;
            } else if (ntime > this.otim[opos]) {
                ratio = (this.deltime * 256 * 10) / (ntime - this.otim[opos]);
            }

            if (ratio < 25) {
                ratio = 25;
            } else if (ratio > 256) {
                ratio = 256;
                delta = this.deltime - ((ntime - this.otim[opos]) / 10);
            }

            this.otim[opos] = ntime;
            opos = (opos + 1) % 10;
            
            if (delta > 1) {
                for (let i = 0; i < 10; i++) {
                    if (this.otim[i] !== 0) {
                        this.otim[i] += delta;
                    }
                }
            }

            if (delta < this.mindel) {
                delta = this.mindel;
            }

            await sleep(delta);

            while (count < 256) {
                this.update();
                count += ratio;
            }

            count &= 0xFF;

            if (this.deltime > 0) {
                this.fps = (1000 * ratio) / (this.deltime * 256);
            }

            await this.draw();
        }

        if (state == -1) {
            this.shutdown();
        }
    }

    shutdown() {
        state = -2;
        this.unload();
    }

    setLoopRate(rate) {
        this.deltime = 1000 / rate;
    }

    start() {
        if (this.state >= 0) {
            this.state = 0;
        }
    }

    stop() {
        if (this.state >= 0) {
            this.state = 4000 / this.deltime;
        }
    }

    destroy() {
        this.state = -1;
    }

    async load() {
    }

    update() {
    }

    unload() {
    }

    async draw() {
    }

    refresh() {
    }

    async showProgress(progress, message) {
        if (this.redrawScreen) {
            this.ctx.fillStyle = 'black';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.redrawScreen = false;
        }

        let y = this.canvas.height / 2 - 18;

        // draw full progress bar
        this.ctx.fillStyle = 'rgb(140, 17, 17)';
        this.ctx.rect((this.canvas.width / 2) - 152, y, 304, 34);
        this.ctx.fillRect((this.canvas.width / 2) - 150, y + 2, progress * 3, 30);

        // cover up progress bar
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(((this.canvas.width / 2) - 150) + (progress * 3), y + 2, 300 - (progress * 3), 30);

        // draw text
        this.ctx.font = 'bold 13px helvetica, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(message, this.canvas.width / 2, y + 22);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }
}