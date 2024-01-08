import PixMap from '../graphics/PixMap';
import Draw3D from '../graphics/Draw3D';

import {sleep} from '../util/JsUtil';

export default abstract class GameShell {
    static getParameter(name: string): string {
        const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) ?? '';
    }

    static setParameter(name: string, value: string): void {
        const url: URL = new URL(window.location.toString());
        url.searchParams.set(name, value);
        window.history.pushState(null, '', url.toString());
    }

    protected readonly canvas: HTMLCanvasElement;
    protected readonly ctx: CanvasRenderingContext2D;

    protected drawArea: PixMap | null = null;
    protected state: number = 0;
    protected deltime: number = 20;
    protected mindel: number = 1;
    protected otim: number[] = [];
    protected fps: number = 0;
    protected fpos: number = 0;
    protected frameTime: number[] = [];
    protected redrawScreen: boolean = true;
    protected resizeToFit: boolean = false;

    protected idleCycles: number = 0;
    protected mouseButton: number = 0;
    protected mouseX: number = 0;
    protected mouseY: number = 0;
    protected mouseClickButton: number = 0;
    protected mouseClickX: number = 0;
    protected mouseClickY: number = 0;
    protected actionKey: number[] = [];
    protected keyQueue: number[] = [];
    protected keyQueueReadPos: number = 0;
    protected keyQueueWritePos: number = 0;

    constructor(resizetoFit = false) {
        const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas not found!!!!!!!!');
        }
        const canvas2d: CanvasRenderingContext2D | null = canvas.getContext('2d');
        if (!canvas2d) {
            throw new Error('Canvas 2d not found!!!!!!!!');
        }
        this.canvas = canvas;
        this.ctx = canvas2d;
        this.resizeToFit = resizetoFit;
        if (this.resizeToFit) {
            this.resize(window.innerWidth, window.innerHeight);
        } else {
            this.resize(canvas.width, canvas.height);
        }
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    resize(width: number, height: number): void {
        const canvas: HTMLCanvasElement = this.canvas;
        canvas.width = width;
        canvas.height = height;
        this.drawArea = new PixMap(canvas, width, height);
        Draw3D.init2D();
    }

    async run(): Promise<void> {
        window.addEventListener(
            'resize',
            (): void => {
                if (this.resizeToFit) {
                    this.resize(window.innerWidth, window.innerHeight);
                }
            },
            false
        );

        window.addEventListener('keydown', this.keyDown);
        window.addEventListener('keyup', this.keyUp);
        window.addEventListener('mousedown', this.mousePressed);

        // Preventing mouse events from bubbling up to the context menu in the browser for our canvas.
        // This may need to be hooked up to our own context menu in the future.
        this.canvas.oncontextmenu = (e: MouseEvent): void => {
            e.preventDefault();
        };

        await this.showProgress(0, 'Loading...');
        await this.load();

        for (let i: number = 0; i < 10; i++) {
            this.otim[i] = Date.now();
        }

        let ntime: number;
        let opos: number = 0;
        let ratio: number = 256;
        let delta: number = 1;
        let count: number = 0;

        while (this.state >= 0) {
            if (this.state > 0) {
                this.state--;

                if (this.state === 0) {
                    this.shutdown();
                    return;
                }
            }

            const lastRatio: number = ratio;
            const lastDelta: number = delta;
            ratio = 300;
            delta = 1;

            ntime = Date.now();
            const otim: number = this.otim[opos];

            if (otim === 0) {
                ratio = lastRatio;
                delta = lastDelta;
            } else if (ntime > otim) {
                ratio = Math.trunc((this.deltime * 2560) / (ntime - otim));
            }

            if (ratio < 25) {
                ratio = 25;
            } else if (ratio > 256) {
                ratio = 256;
                delta = Math.trunc(this.deltime - (ntime - otim) / 10);
            }

            this.otim[opos] = ntime;
            opos = (opos + 1) % 10;

            if (delta > 1) {
                for (let i: number = 0; i < 10; i++) {
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
                await this.update();
                this.mouseClickButton = 0;
                this.keyQueueReadPos = this.keyQueueWritePos;
                count += ratio;
            }

            count &= 0xff;

            if (this.deltime > 0) {
                this.fps = Math.trunc((ratio * 1000) / (this.deltime * 256));
            }

            const time: number = performance.now();

            await this.draw();

            this.frameTime[this.fpos] = (performance.now() - time) / 1000;
            this.fpos = (this.fpos + 1) % this.frameTime.length;

            // console.log(`${this.fps} fps`);
            // console.log(`${this.ms.toFixed(4)} ms`);
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

    async load(): Promise<void> {}

    async update(): Promise<void> {}

    unload(): void {}

    async draw(): Promise<void> {}

    refresh(): void {}

    async showProgress(progress: number, message: string): Promise<void> {
        const ctx: CanvasRenderingContext2D = this.ctx;
        const width: number = this.width;
        const height: number = this.height;

        if (this.redrawScreen) {
            ctx.fillStyle = 'black';
            ctx.clearRect(0, 0, width, height);
            this.redrawScreen = false;
        }

        const y: number = height / 2 - 18;

        // draw full progress bar
        ctx.fillStyle = 'rgb(140, 17, 17)';
        ctx.rect(width / 2 - 152, y, 304, 34);
        ctx.fillRect(width / 2 - 150, y + 2, progress * 3, 30);

        // cover up progress bar
        ctx.fillStyle = 'black';
        ctx.fillRect(width / 2 - 150 + progress * 3, y + 2, 300 - progress * 3, 30);

        // draw text
        ctx.font = 'bold 13px helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText(message, width / 2, y + 22);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    keyDown = (e: KeyboardEvent): void => {
        this.idleCycles = 0;

        const code: number = e.keyCode;
        let ch: number = e.key.charCodeAt(0);

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
            this.keyQueueWritePos = (this.keyQueueWritePos + 1) & 0x7f;
        }
        // TODO input tracking
    };

    keyUp = (e: KeyboardEvent): void => {
        this.idleCycles = 0;

        let ch: number = e.key.charCodeAt(0);
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
    };

    pollKey(): number {
        let key: number = -1;
        if (this.keyQueueWritePos != this.keyQueueReadPos) {
            key = this.keyQueue[this.keyQueueReadPos];
            this.keyQueueReadPos = (this.keyQueueReadPos + 1) & 0x7f;
        }
        return key;
    }

    mousePressed = (e: MouseEvent): void => {
        let x: number = e.x;
        let y: number = e.y;

        const {top, left} = this.getInsets;
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
    };

    private get getInsets(): {top: number; left: number} {
        const rect: DOMRect = this.canvas.getBoundingClientRect();
        const computedStyle: CSSStyleDeclaration = window.getComputedStyle(this.canvas);
        const paddingLeft: number = parseFloat(computedStyle.paddingLeft || '0');
        const paddingTop: number = parseFloat(computedStyle.paddingTop || '0');
        const borderLeft: number = parseFloat(computedStyle.borderLeftWidth || '0');
        const borderTop: number = parseFloat(computedStyle.borderTopWidth || '0');

        const left: number = rect.left + borderLeft + paddingLeft;
        const top: number = rect.top + borderTop + paddingTop;

        return {top, left};
    }

    private get ms(): number {
        const length: number = this.frameTime.length;
        let ft: number = 0;
        for (let index: number = 0; index < length; index++) {
            ft += this.frameTime[index];
        }
        return ft / length;
    }
}
