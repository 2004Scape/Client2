import CanvasFrameBuffer from '../graphics/CanvasFrameBuffer.js';
import Draw3D from '../graphics/Draw3D.js';

import { sleep } from '../util/JsUtil.js';

export default class GameShell {
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;

    state: number = 0;
    deltime: number = 20;
    mindel: number = 1;
    otim: number[] = [];
    fps: number = 0;
    drawArea: CanvasFrameBuffer | null = null;
    redrawScreen: boolean = true;
    resizeToFit: boolean = false;

    idleCycles: number = 0;
    mouseButton: number = 0;
    mouseX: number = 0;
    mouseY: number = 0;
    mouseClickButton: number = 0;
    mouseClickX: number = 0;
    mouseClickY: number = 0;
    actionKey: number[] = [];
    keyQueue: number[] = [];
    keyQueueReadPos: number = 0;
    keyQueueWritePos: number = 0;

    constructor(resizetoFit = false) {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.ctx = this.canvas!.getContext('2d');

        this.resizeToFit = resizetoFit;
        if (this.resizeToFit) {
            this.resize(window.innerWidth, window.innerHeight);
        } else {
            this.resize(this.canvas.width, this.canvas.height);
        }
    }

    get width() {
        return this.canvas!.width;
    }

    get height() {
        return this.canvas!.height;
    }

    resize(width: number, height: number): void {
        this.canvas!.width = width;
        this.canvas!.height = height;
        this.drawArea = new CanvasFrameBuffer(this.canvas, this.width, this.height);
        Draw3D.init2D();
    }

    async run(): Promise<void> {
        window.addEventListener('resize', () => {
            if (this.resizeToFit) {
                this.resize(window.innerWidth, window.innerHeight);
            }
        }, false);

        window.addEventListener('keydown', (e) => {
            this.keyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keyUp(e);
        });

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
                ratio = Math.trunc((this.deltime * 256 * 10) / (ntime - this.otim[opos]));
            }

            if (ratio < 25) {
                ratio = 25;
            } else if (ratio > 256) {
                ratio = 256;
                delta = Math.trunc(this.deltime - ((ntime - this.otim[opos]) / 10));
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
                this.mouseClickButton = 0;
                this.keyQueueReadPos = this.keyQueueWritePos;
                count += ratio;
            }

            count &= 0xFF;

            if (this.deltime > 0) {
                this.fps = Math.trunc((1000 * ratio) / (this.deltime * 256));
            }

            await this.draw();
        }

        if (this.state == -1) {
            this.shutdown();
        }
    }

    shutdown() {
        this.state = -2;
        this.unload();
    }

    setLoopRate(rate: number) {
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

    async showProgress(progress: number, message: string) {
        if (this.redrawScreen) {
            this.ctx!.fillStyle = 'black';
            this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
            this.redrawScreen = false;
        }

        let y = this.canvas!.height / 2 - 18;

        // draw full progress bar
        this.ctx!.fillStyle = 'rgb(140, 17, 17)';
        this.ctx!.rect((this.canvas!.width / 2) - 152, y, 304, 34);
        this.ctx!.fillRect((this.canvas!.width / 2) - 150, y + 2, progress * 3, 30);

        // cover up progress bar
        this.ctx!.fillStyle = 'black';
        this.ctx!.fillRect(((this.canvas!.width / 2) - 150) + (progress * 3), y + 2, 300 - (progress * 3), 30);

        // draw text
        this.ctx!.font = 'bold 13px helvetica, sans-serif';
        this.ctx!.textAlign = 'center';
        this.ctx!.fillStyle = 'white';
        this.ctx!.fillText(message, this.canvas!.width / 2, y + 22);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    keyDown(e: KeyboardEvent) {
        this.idleCycles = 0;

        let ch = e.key.charCodeAt(0);
        if (e.key == 'ArrowLeft') {
            ch = 1;
        } else if (e.key == 'ArrowRight') {
            ch = 2;
        } else if (e.key == 'ArrowUp') {
            ch = 3;
        } else if (e.key == 'ArrowDown') {
            ch = 4;
        }

        // console.log(e.key, ch);
        this.actionKey[ch] = 1;
        this.keyQueue[this.keyQueueWritePos] = ch;
        this.keyQueueWritePos = (this.keyQueueWritePos + 1) % 128;
    }

    keyUp(e: KeyboardEvent) {
        this.idleCycles = 0;

        let ch = e.key.charCodeAt(0);
        if (e.key == 'ArrowLeft') {
            ch = 1;
        } else if (e.key == 'ArrowRight') {
            ch = 2;
        } else if (e.key == 'ArrowUp') {
            ch = 3;
        } else if (e.key == 'ArrowDown') {
            ch = 4;
        }

        this.actionKey[ch] = 0;
    }

    pollKey() {
        let key = -1;
        if (this.keyQueueWritePos != this.keyQueueReadPos) {
            key = this.keyQueue[this.keyQueueReadPos];
            this.keyQueueReadPos = (this.keyQueueReadPos + 1) % 128;
        }
        return key;
    }
}