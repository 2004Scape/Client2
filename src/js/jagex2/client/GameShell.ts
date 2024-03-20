import PixMap from '../graphics/PixMap';
import Draw3D from '../graphics/Draw3D';

import {sleep} from '../util/JsUtil';
import {CANVAS_PREVENTED, KEY_CODES} from './KeyCodes';
import InputTracking from './InputTracking';
import {canvas, canvas2d} from '../graphics/Canvas';
import DrawGL from '../graphics/DrawGL';
import { RenderMode } from '../graphics/RenderMode';

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

    protected slowestMS: number = 0.0; // custom
    protected averageMS: number[] = []; // custom
    protected averageIndexMS: number = 0; // custom

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

    protected renderMode: RenderMode = RenderMode.GPU;

    constructor(resizetoFit: boolean = false) {
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(0, 0, canvas.width, canvas.height);
        this.resizeToFit = resizetoFit;
        if (this.resizeToFit) {
            this.resize(window.innerWidth, window.innerHeight);
        } else {
            this.resize(canvas.width, canvas.height);
        }
        if(this.renderMode === RenderMode.GPU) {
            DrawGL.init();
        }
    }

    get width(): number {
        return canvas.width;
    }

    get height(): number {
        return canvas.height;
    }

    resize(width: number, height: number): void {
        canvas.width = width;
        canvas.height = height;
        this.drawArea = new PixMap(width, height);
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

        window.addEventListener('keydown', this.keyPressed);
        window.addEventListener('keyup', this.keyReleased);
        window.addEventListener('mousedown', this.mousePressed);
        window.addEventListener('mouseup', this.mouseReleased);
        window.addEventListener('mouseenter', this.mouseEntered);
        window.addEventListener('mouseleave', this.mouseExited);
        window.addEventListener('mousemove', this.mouseMoved);
        window.addEventListener('focusin', this.focusGained);
        window.addEventListener('focusout', this.focusLost);
        window.addEventListener('beforeunload', this.unload);

        // Preventing mouse events from bubbling up to the context menu in the browser for our canvas.
        // This may need to be hooked up to our own context menu in the future.
        canvas.oncontextmenu = (e: MouseEvent): void => {
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
                ratio = ((this.deltime * 2560) / (ntime - otim)) | 0;
            }

            if (ratio < 25) {
                ratio = 25;
            } else if (ratio > 256) {
                ratio = 256;
                delta = (this.deltime - (ntime - otim) / 10) | 0;
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
                this.fps = ((ratio * 1000) / (this.deltime * 256)) | 0;
            }

            const time: number = performance.now();

            if (this.redrawScreen) {
                this.refresh();
            }
            await this.draw();

            this.frameTime[this.fpos] = (performance.now() - time) / 1000;
            this.fpos = (this.fpos + 1) % this.frameTime.length;
        }
        if (this.state === -1) {
            this.shutdown();
        }
    }

    shutdown(): void {
        this.state = -2;
        this.unload();
    }

    setFramerate(rate: number): void {
        this.deltime = (1000 / rate) | 0;
    }

    start(): void {
        if (this.state >= 0) {
            this.state = 0;
        }
    }

    stop(): void {
        if (this.state >= 0) {
            this.state = (4000 / this.deltime) | 0;
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
        const width: number = this.width;
        const height: number = this.height;

        if (this.redrawScreen) {
            canvas2d.fillStyle = 'black';
            canvas2d.fillRect(0, 0, width, height);
            this.redrawScreen = false;
        }

        const y: number = height / 2 - 18;

        // draw full progress bar
        canvas2d.fillStyle = 'rgb(140, 17, 17)';
        canvas2d.rect(((width / 2) | 0) - 152, y, 304, 34);
        canvas2d.fillRect(((width / 2) | 0) - 150, y + 2, progress * 3, 30);

        // cover up progress bar
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(((width / 2) | 0) - 150 + progress * 3, y + 2, 300 - progress * 3, 30);

        // draw text
        canvas2d.font = 'bold 13px helvetica, sans-serif';
        canvas2d.textAlign = 'center';
        canvas2d.fillStyle = 'white';
        canvas2d.fillText(message, (width / 2) | 0, y + 22);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    keyPressed = (e: KeyboardEvent): void => {
        const key: string = e.key;

        if (CANVAS_PREVENTED.includes(key)) {
            // prevent canvas from using tab and other blacklisted keys. no function in 225?
            e.preventDefault();
        }

        this.idleCycles = 0;

        const mappedKey: {key: number; ch: number} = KEY_CODES[key];

        if (!mappedKey) {
            console.error(`Unhandled key ${key}`);
            return;
        }

        const code: number = mappedKey.key;
        let ch: number = mappedKey.ch;

        if (ch < 30) {
            ch = 0;
        }

        if (code === 37) {
            ch = 1;
        } else if (code === 39) {
            ch = 2;
        } else if (code === 38) {
            ch = 3;
        } else if (code === 40) {
            ch = 4;
        } else if (code === 17) {
            ch = 5;
        } else if (code === 8) {
            ch = 8;
        } else if (code === 127) {
            ch = 8;
        } else if (code === 9) {
            ch = 9;
        } else if (code === 10) {
            ch = 10;
        } else if (code >= 112 && code <= 123) {
            ch = code + 1008 - 112;
        } else if (code === 36) {
            ch = 1000;
        } else if (code === 35) {
            ch = 1001;
        } else if (code === 33) {
            ch = 1002;
        } else if (code === 34) {
            ch = 1003;
        }

        if (ch > 0 && ch < 128) {
            this.actionKey[ch] = 1;
        }

        if (ch > 4) {
            this.keyQueue[this.keyQueueWritePos] = ch;
            this.keyQueueWritePos = (this.keyQueueWritePos + 1) & 0x7f;
        }

        if (InputTracking.enabled) {
            InputTracking.keyPressed(ch);
        }
    };

    keyReleased = (e: KeyboardEvent): void => {
        const key: string = e.key;

        if (CANVAS_PREVENTED.includes(key)) {
            // prevent canvas from using tab and other blacklisted keys. no function in 225?
            e.preventDefault();
        }

        this.idleCycles = 0;

        const mappedKey: {key: number; ch: number} = KEY_CODES[key];

        if (!mappedKey) {
            console.error(`Unhandled key ${key}`);
            return;
        }

        const code: number = mappedKey.key;
        let ch: number = mappedKey.ch;

        if (ch < 30) {
            ch = 0;
        }

        if (code === 37) {
            ch = 1;
        } else if (code === 39) {
            ch = 2;
        } else if (code === 38) {
            ch = 3;
        } else if (code === 40) {
            ch = 4;
        } else if (code === 17) {
            ch = 5;
        } else if (code === 8) {
            ch = 8;
        } else if (code === 127) {
            ch = 8;
        } else if (code === 9) {
            ch = 9;
        } else if (code === 10) {
            ch = 10;
        } else if (code >= 112 && code <= 123) {
            ch = code + 1008 - 112;
        } else if (code === 36) {
            ch = 1000;
        } else if (code === 35) {
            ch = 1001;
        } else if (code === 33) {
            ch = 1002;
        } else if (code === 34) {
            ch = 1003;
        }

        if (ch > 0 && ch < 128) {
            this.actionKey[ch] = 0;
        }

        if (InputTracking.enabled) {
            InputTracking.keyReleased(ch);
        }
    };

    pollKey(): number {
        let key: number = -1;
        if (this.keyQueueWritePos !== this.keyQueueReadPos) {
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

        const rect: DOMRect = canvas.getBoundingClientRect();
        x *= canvas.width / rect.width;
        y *= canvas.height / rect.height;

        x |= 0;
        y |= 0;

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

        if (InputTracking.enabled) {
            // InputTracking.mousePressed(x, y, (e.getModifiersEx() & MouseEvent.BUTTON3_DOWN_MASK) !== 0 ? 1 : 0);
        }
    };

    mouseReleased = (e: MouseEvent): void => {
        this.idleCycles = 0;
        this.mouseButton = 0;

        if (InputTracking.enabled) {
            // InputTracking.mouseReleased((e.getModifiersEx() & MouseEvent.BUTTON3_DOWN_MASK) !== 0 ? 1 : 0);
        }
    };

    mouseEntered = (e: MouseEvent): void => {
        if (!InputTracking.enabled) {
            return;
        }
        InputTracking.mouseEntered();
    };

    mouseExited = (e: MouseEvent): void => {
        if (!InputTracking.enabled) {
            return;
        }
        InputTracking.mouseExited();
    };

    mouseMoved = (e: MouseEvent): void => {
        let x: number = e.x;
        let y: number = e.y;

        const {top, left} = this.getInsets;
        x -= left;
        y -= top;

        const rect: DOMRect = canvas.getBoundingClientRect();
        x *= canvas.width / rect.width;
        y *= canvas.height / rect.height;

        x |= 0;
        y |= 0;

        this.idleCycles = 0;
        this.mouseX = x;
        this.mouseY = y;

        if (InputTracking.enabled) {
            InputTracking.mouseMoved(x, y);
        }
    };

    focusGained = (e: FocusEvent): void => {
        this.redrawScreen = true;
        this.refresh();

        if (InputTracking.enabled) {
            InputTracking.focusGained();
        }
    };

    focusLost = (e: FocusEvent): void => {
        if (InputTracking.enabled) {
            InputTracking.focusLost();
        }
    };

    protected get ms(): number {
        const length: number = this.frameTime.length;
        let ft: number = 0;
        for (let index: number = 0; index < length; index++) {
            ft += this.frameTime[index];
        }
        const ms: number = ft / length;
        if (ms > this.slowestMS) {
            this.slowestMS = ms;
        }
        this.averageMS[this.averageIndexMS] = ms;
        this.averageIndexMS = (this.averageIndexMS + 1) % 250; // 250 circular limit
        return ms;
    }

    protected get msAvg(): number {
        return this.averageMS.reduce((accumulator: number, currentValue: number): number => accumulator + currentValue, 0) / 250; // 250 circular limit
    }

    private get getInsets(): {top: number; left: number} {
        const rect: DOMRect = canvas.getBoundingClientRect();
        const computedStyle: CSSStyleDeclaration = window.getComputedStyle(canvas);
        const paddingLeft: number = parseFloat(computedStyle.paddingLeft || '0');
        const paddingTop: number = parseFloat(computedStyle.paddingTop || '0');
        const borderLeft: number = parseFloat(computedStyle.borderLeftWidth || '0');
        const borderTop: number = parseFloat(computedStyle.borderTopWidth || '0');

        const left: number = rect.left + borderLeft + paddingLeft;
        const top: number = rect.top + borderTop + paddingTop;

        return {top, left};
    }
}
