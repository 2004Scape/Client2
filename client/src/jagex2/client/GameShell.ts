import CanvasFrameBuffer from '../graphics/CanvasFrameBuffer.js';
import Draw3D from '../graphics/Draw3D.js';

import { sleep } from '../util/JsUtil.js';

export default class GameShell {
    static getParameter(name: string): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setParameter(name: string, value: string): void {
        const url = new URL(window.location.toString());
        url.searchParams.set(name, value);
        window.history.pushState(null, '', url.toString());
    }

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    drawArea: CanvasFrameBuffer;

    state: number = 0;
    deltime: number = 20;
    mindel: number = 1;
    otim: number[] = [];
    fps: number = 0;
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
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error("Canvas not found!!!!!!!!");
        }
        const canvas2d = canvas.getContext('2d');
        if (!canvas2d) {
            throw new Error("Canvas 2d not found!!!!!!!!");
        }
        this.canvas = canvas;
        this.ctx = canvas2d;

        this.resizeToFit = resizetoFit;
        if (this.resizeToFit) {
            this.resize(window.innerWidth, window.innerHeight);
        } else {
            this.resize(this.canvas.width, this.canvas.height);
        }
        this.drawArea = new CanvasFrameBuffer(this.canvas, this.width, this.height);
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
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

        window.addEventListener('mousedown', (e) => {
            this.mousePressed(e)
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

    shutdown(): void {
        this.state = -2;
        this.unload();
    }

    setLoopRate(rate: number): void {
        this.deltime = 1000 / rate;
    }

    start(): void {
        if (this.state >= 0) {
            this.state = 0;
        }
    }

    stop(): void {
        if (this.state >= 0) {
            this.state = 4000 / this.deltime;
        }
    }

    destroy(): void {
        this.state = -1;
    }

    async load(): Promise<void> {
    }

    update(): void {
    }

    unload(): void {
    }

    async draw(): Promise<void> {
    }

    refresh(): void {
    }

    async showProgress(progress: number, message: string): Promise<void> {
        if (this.redrawScreen) {
            this.ctx.fillStyle = 'black';
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.redrawScreen = false;
        }

        let y = this.height / 2 - 18;

        // draw full progress bar
        this.ctx.fillStyle = 'rgb(140, 17, 17)';
        this.ctx.rect((this.width / 2) - 152, y, 304, 34);
        this.ctx.fillRect((this.width / 2) - 150, y + 2, progress * 3, 30);

        // cover up progress bar
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(((this.width / 2) - 150) + (progress * 3), y + 2, 300 - (progress * 3), 30);

        // draw text
        this.ctx.font = 'bold 13px helvetica, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(message, this.width / 2, y + 22);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    keyDown(e: KeyboardEvent): void {
        this.idleCycles = 0;

        let code = e.keyCode;
        let ch = e.key.charCodeAt(0);

        if (ch === 83) {
            return; // Custom for shift key.
        }

        if (ch < 30) {
            ch = 0;
        }

        if (code == 37) {
            ch = 1;
        } else if (code == 39) {
            ch = 2;
        } else if (code == 38) {
            ch = 3;
        } else if (code == 40) {
            ch = 4;
        } else if (code == 17) {
            ch = 5;
        } else if (code == 8) {
            ch = 8;
        } else if (code == 127) {
            ch = 8;
        } else if (code == 9) {
            ch = 9;
        } else if (code == 10) {
            ch = 10;
        } else if (code >= 112 && code <= 123) {
            ch = code + 1008 - 112;
        } else if (code == 36) {
            ch = 1000;
        } else if (code == 35) {
            ch = 1001;
        } else if (code == 33) {
            ch = 1002;
        } else if (code == 34) {
            ch = 1003;
        }

        if (ch > 0 && ch < 128) {
            this.actionKey[ch] = 1;
        }

        if (ch > 4) {
            this.keyQueue[this.keyQueueWritePos] = ch;
            this.keyQueueWritePos = this.keyQueueWritePos + 1 & 0x7F;
        }
        // TODO input tracking
    }

    keyUp(e: KeyboardEvent): void {
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

    pollKey(): number {
        let key = -1;
        if (this.keyQueueWritePos != this.keyQueueReadPos) {
            key = this.keyQueue[this.keyQueueReadPos];
            this.keyQueueReadPos = (this.keyQueueReadPos + 1) & 0x7F;
        }
        return key;
    }

    mousePressed(e: MouseEvent): void {
        let x = e.x;
        let y = e.y;

        const {top, left} = this.getInsets();
        x -= left;
        y -= top;

        this.idleCycles = 0;
        this.mouseClickX = x;
        this.mouseClickY = y;

        if (e.buttons === 2) {
            this.mouseClickButton = 2;
            this.mouseButton = 2;
        } else if (e.buttons === 1) {
            this.mouseClickButton = 1;
            this.mouseButton = 1;
        }
        // TODO input tracking
    }

    getInsets(): { top: number; left: number } {
        const rect = this.canvas.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(this.canvas);
        const paddingLeft = parseFloat(computedStyle.paddingLeft || '0');
        const paddingTop = parseFloat(computedStyle.paddingTop || '0');
        const borderLeft = parseFloat(computedStyle.borderLeftWidth || '0');
        const borderTop = parseFloat(computedStyle.borderTopWidth || '0');

        const left = rect.left + borderLeft + paddingLeft;
        const top = rect.top + borderTop + paddingTop;

        return { top, left };
    }
}