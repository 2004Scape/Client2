import PixMap from '../graphics/PixMap';
import Draw3D from '../graphics/Draw3D';

import {sleep} from '../util/JsUtil';
import {CANVAS_PREVENTED, KEY_CODES} from './KeyCodes';
import InputTracking from './InputTracking';
import {canvas, canvas2d} from '../graphics/Canvas';

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

    protected ingame: boolean = false;

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

    // touch controls
    private touchInput: HTMLElement | null = null;
    private touching: boolean = false;
    private startedInViewport: boolean = false;
    private startedInTabArea: boolean = false;
    private time: number = -1;
    private sx: number = 0;
    private sy: number = 0;
    private mx: number = 0;
    private my: number = 0;
    private nx: number = 0;
    private ny: number = 0;

    constructor(resizetoFit: boolean = false) {
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(0, 0, canvas.width, canvas.height);
        this.resizeToFit = resizetoFit;
        if (this.resizeToFit) {
            this.resize(window.innerWidth, window.innerHeight);
        } else {
            this.resize(canvas.width, canvas.height);
        }
    }

    abstract getTitleScreenState(): number;
    abstract isChatBackInputOpen(): boolean;
    abstract isShowSocialInput(): boolean;
    abstract getChatInterfaceId(): number;
    abstract getViewportInterfaceId(): number;

    protected get width(): number {
        return canvas.width;
    }

    protected get height(): number {
        return canvas.height;
    }

    protected resize(width: number, height: number): void {
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

        // pc
        window.onkeydown = this.keyPressed;
        window.onkeyup = this.keyReleased;
        window.onmousedown = this.mousePressed;
        window.onmouseup = this.mouseReleased;
        window.onmouseenter = this.mouseEntered;
        window.onmouseleave = this.mouseExited;
        window.onmousemove = this.mouseMoved;
        window.onbeforeunload = this.unload;
        window.onfocus = this.focusGained;
        window.onblur = this.focusLost;

        // mobile
        window.ontouchstart = this.touchStarted;
        window.ontouchend = this.touchEnded;
        window.ontouchmove = this.touchMoved;

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

    protected shutdown(): void {
        this.state = -2;
        this.unload();
    }

    protected setFramerate(rate: number): void {
        this.deltime = (1000 / rate) | 0;
    }

    protected start(): void {
        if (this.state >= 0) {
            this.state = 0;
        }
    }

    protected stop(): void {
        if (this.state >= 0) {
            this.state = (4000 / this.deltime) | 0;
        }
    }

    protected destroy(): void {
        this.state = -1;
    }

    protected async load(): Promise<void> {}

    protected async update(): Promise<void> {}

    protected unload(): void {}

    protected async draw(): Promise<void> {}

    protected refresh(): void {}

    protected async showProgress(progress: number, message: string): Promise<void> {
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

    protected pollKey = (): number => {
        let key: number = -1;
        if (this.keyQueueWritePos !== this.keyQueueReadPos) {
            key = this.keyQueue[this.keyQueueReadPos];
            this.keyQueueReadPos = (this.keyQueueReadPos + 1) & 0x7f;
        }
        return key;
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

    private keyPressed = (e: KeyboardEvent): void => {
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

    private keyReleased = (e: KeyboardEvent): void => {
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

    private mousePressed = (e: MouseEvent): void => {
        this.idleCycles = 0;
        this.mouseClickX = this.mouseX;
        this.mouseClickY = this.mouseY;

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

    private mouseReleased = (e: MouseEvent): void => {
        this.idleCycles = 0;
        this.mouseButton = 0;

        if (InputTracking.enabled) {
            // InputTracking.mouseReleased((e.getModifiersEx() & MouseEvent.BUTTON3_DOWN_MASK) !== 0 ? 1 : 0);
        }
    };

    private mouseEntered = (e: MouseEvent): void => {
        if (!InputTracking.enabled) {
            return;
        }
        InputTracking.mouseEntered();
    };

    private mouseExited = (e: MouseEvent): void => {
        if (!InputTracking.enabled) {
            return;
        }
        InputTracking.mouseExited();
    };

    private mouseMoved = (e: MouseEvent): void => {
        this.setMousePosition(e);
        this.idleCycles = 0;

        if (InputTracking.enabled) {
            InputTracking.mouseMoved(this.mouseX, this.mouseY);
        }
    };

    private focusGained = (e: FocusEvent): void => {
        this.redrawScreen = true;
        this.refresh();

        if (InputTracking.enabled) {
            InputTracking.focusGained();
        }
    };

    private focusLost = (e: FocusEvent): void => {
        if (InputTracking.enabled) {
            InputTracking.focusLost();
        }
    };

    private touchStarted = (e: TouchEvent): void => {
        if (!this.isMobile) {
            return;
        }

        if (this.touchInput !== null) {
            this.touchInput.parentNode?.removeChild(this.touchInput);
            this.touchInput = null;
        }

        this.touching = true;
        const touch: Touch = e.changedTouches[0];
        const clientX: number = touch.clientX || 0;
        const clientY: number = touch.clientY || 0;
        this.mouseMoved(new MouseEvent('mousedown', {clientX: clientX, clientY: clientY}));

        this.sx = this.nx = this.mx = touch.screenX || 0;
        this.sy = this.ny = this.my = touch.screenY || 0;
        this.time = e.timeStamp || 0;

        this.startedInViewport = this.insideViewportArea();
        this.startedInTabArea = this.insideTabArea();
    };

    private touchEnded = (e: TouchEvent): void => {
        if (!this.isMobile || !this.touching) {
            return;
        }

        const touch: Touch = e.changedTouches[0];
        const clientX: number = touch.clientX || 0;
        const clientY: number = touch.clientY || 0;
        this.mouseMoved(new MouseEvent('mousedown', {clientX: clientX, clientY: clientY}));

        const nx: number = touch.screenX || 0;
        const ny: number = touch.screenY || 0;

        this.keyReleased(new KeyboardEvent('ArrowLeft', {key: 'ArrowLeft', code: 'ArrowLeft'}));
        this.keyReleased(new KeyboardEvent('ArrowUp', {key: 'ArrowUp', code: 'ArrowUp'}));
        this.keyReleased(new KeyboardEvent('ArrowRight', {key: 'ArrowRight', code: 'ArrowRight'}));
        this.keyReleased(new KeyboardEvent('ArrowDown', {key: 'ArrowDown', code: 'ArrowDown'}));

        if (this.startedInViewport && !this.insideViewportArea()) {
            this.touching = false;
            return;
        } else if (this.startedInTabArea && !this.insideTabArea()) {
            this.touching = false;
            return;
        } else if (this.insideChatInputArea() || this.insideChatPopupArea() || this.insideUsernameArea() || this.inPasswordArea()) {
            if (this.touchInput !== null) {
                this.touchInput.parentNode?.removeChild(this.touchInput);
                this.touchInput = null;
            }

            // const document = document; // Replace with your document reference
            this.touchInput = document.createElement('touchInput');
            if (this.insideUsernameArea()) {
                this.touchInput.setAttribute('id', 'username');
                this.touchInput.setAttribute('placeholder', 'Username');
            } else if (this.inPasswordArea()) {
                this.touchInput.setAttribute('id', 'password');
                this.touchInput.setAttribute('placeholder', 'Password');
            }
            this.touchInput.setAttribute('type', this.inPasswordArea() ? 'password' : 'text');
            this.touchInput.setAttribute('autofocus', 'autofocus');
            this.touchInput.setAttribute('style', `position: absolute; left: ${clientX}px; top: ${clientY}px; width: 1px; height: 1px; opacity: 0;`);
            document.body.appendChild(this.touchInput);
            this.touchInput.focus();
            this.touchInput.click();

            this.touchInput.addEventListener('keydown', (event: KeyboardEvent): void => {
                this.keyPressed(event);
            });

            this.touchInput.addEventListener('keyup', (event: KeyboardEvent): void => {
                this.keyReleased(event);
            });

            this.touchInput.addEventListener('focusout', (): void => {
                this.touchInput?.parentNode?.removeChild(this.touchInput);
                this.touchInput = null;
            });

            this.touching = false;
            return;
        }

        const eventTime: number = e.timeStamp || 0;
        const longPress: boolean = eventTime >= this.time + 500;
        const moved: boolean = Math.abs(this.sx - nx) > 16 || Math.abs(this.sy - ny) > 16;

        if (longPress && !moved) {
            this.touching = true;
            this.mousePressed(new MouseEvent('e', {buttons: 2}));
        } else {
            this.mouseButton = 0;
            this.touching = false;
        }
    };

    private touchMoved = (e: TouchEvent): void => {
        if (!this.isMobile || !this.touching) {
            return;
        }

        const touch: Touch = e.changedTouches[0];
        const clientX: number = touch.clientX || 0;
        const clientY: number = touch.clientY || 0;
        this.mouseMoved(new MouseEvent('mousedown', {clientX: clientX, clientY: clientY}));

        const nx: number = touch.screenX || 0;
        const ny: number = touch.screenY || 0;

        if (this.startedInViewport && this.getViewportInterfaceId() === -1) {
            // Camera panning
            if (this.mx - nx > 0) {
                this.rotate(2);
            } else if (this.mx - nx < 0) {
                this.rotate(0);
            }

            if (this.my - ny > 0) {
                this.rotate(3);
            } else if (this.my - ny < 0) {
                this.rotate(1);
            }
        } else if (this.startedInTabArea || this.getViewportInterfaceId() !== -1) {
            // Drag and drop
            this.mousePressed(new MouseEvent('e2', {buttons: 1}));
        }

        this.mx = nx;
        this.my = ny;
    };

    private get isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    private insideViewportArea(): boolean {
        // 512 x 334
        const viewportAreaX1: number = 8;
        const viewportAreaY1: number = 11;
        const viewportAreaX2: number = viewportAreaX1 + 512;
        const viewportAreaY2: number = viewportAreaY1 + 334;
        return this.ingame && this.mouseX >= viewportAreaX1 && this.mouseX <= viewportAreaX2 && this.mouseY >= viewportAreaY1 && this.mouseY <= viewportAreaY2;
    }

    private insideChatInputArea(): boolean {
        // 495 x 33
        const chatInputAreaX1: number = 11;
        const chatInputAreaY1: number = 449;
        const chatInputAreaX2: number = chatInputAreaX1 + 495;
        const chatInputAreaY2: number = chatInputAreaY1 + 33;
        return (
            this.ingame &&
            this.getChatInterfaceId() == -1 &&
            !this.isChatBackInputOpen() &&
            !this.isShowSocialInput() &&
            this.mouseX >= chatInputAreaX1 &&
            this.mouseX <= chatInputAreaX2 &&
            this.mouseY >= chatInputAreaY1 &&
            this.mouseY <= chatInputAreaY2
        );
    }

    private insideChatPopupArea(): boolean {
        // 495 x 99
        const chatInputAreaX1: number = 11;
        const chatInputAreaY1: number = 383;
        const chatInputAreaX2: number = chatInputAreaX1 + 495;
        const chatInputAreaY2: number = chatInputAreaY1 + 99;
        return this.ingame && (this.isChatBackInputOpen() || this.isShowSocialInput()) && this.mouseX >= chatInputAreaX1 && this.mouseX <= chatInputAreaX2 && this.mouseY >= chatInputAreaY1 && this.mouseY <= chatInputAreaY2;
    }

    private insideTabArea(): boolean {
        // 190 x 261
        const tabAreaX1: number = 562;
        const tabAreaY1: number = 231;
        const tabAreaX2: number = tabAreaX1 + 190;
        const tabAreaY2: number = tabAreaY1 + 261;
        return this.ingame && this.mouseX >= tabAreaX1 && this.mouseX <= tabAreaX2 && this.mouseY >= tabAreaY1 && this.mouseY <= tabAreaY2;
    }

    private insideUsernameArea(): boolean {
        // 261 x 17
        const usernameAreaX1: number = 301;
        const usernameAreaY1: number = 262;
        const usernameAreaX2: number = usernameAreaX1 + 261;
        const usernameAreaY2: number = usernameAreaY1 + 17;
        return !this.ingame && this.getTitleScreenState() == 2 && this.mouseX >= usernameAreaX1 && this.mouseX <= usernameAreaX2 && this.mouseY >= usernameAreaY1 && this.mouseY <= usernameAreaY2;
    }

    private inPasswordArea(): boolean {
        // 261 x 17
        const passwordAreaX1: number = 301;
        const passwordAreaY1: number = 279;
        const passwordAreaX2: number = passwordAreaX1 + 261;
        const passwordAreaY2: number = passwordAreaY1 + 17;
        return !this.ingame && this.getTitleScreenState() == 2 && this.mouseX >= passwordAreaX1 && this.mouseX <= passwordAreaX2 && this.mouseY >= passwordAreaY1 && this.mouseY <= passwordAreaY2;
    }

    private rotate = (direction: number): void => {
        if (direction == 0) {
            this.keyReleased(new KeyboardEvent('ArrowRight', {key: 'ArrowRight', code: 'ArrowRight'}));
            this.keyPressed(new KeyboardEvent('ArrowLeft', {key: 'ArrowLeft', code: 'ArrowLeft'}));
        } else if (direction == 1) {
            this.keyReleased(new KeyboardEvent('ArrowDown', {key: 'ArrowDown', code: 'ArrowDown'}));
            this.keyPressed(new KeyboardEvent('ArrowUp', {key: 'ArrowUp', code: 'ArrowUp'}));
        } else if (direction == 2) {
            this.keyReleased(new KeyboardEvent('ArrowLeft', {key: 'ArrowLeft', code: 'ArrowLeft'}));
            this.keyPressed(new KeyboardEvent('ArrowRight', {key: 'ArrowRight', code: 'ArrowRight'}));
        } else if (direction == 3) {
            this.keyReleased(new KeyboardEvent('ArrowUp', {key: 'ArrowUp', code: 'ArrowUp'}));
            this.keyPressed(new KeyboardEvent('ArrowDown', {key: 'ArrowDown', code: 'ArrowDown'}));
        }
    };

    private isFullScreen = (): boolean => {
        return document.fullscreenElement != null;
    };

    private setMousePosition = (e: MouseEvent): void => {
        const fixedWidth: number = 789;
        const fixedHeight: number = 532;

        if (this.isFullScreen()) {
            const element: HTMLElement = e.target as HTMLElement;
            const br: DOMRect = element.getBoundingClientRect();
            const ratio: number = window.innerHeight / canvas.height;
            const offset: number = (window.innerWidth - canvas.width * ratio) / 2.0;
            this.mouseX = this.mapCoord(e.clientX - br.left - offset, 0, canvas.width * ratio, 0, fixedWidth) | 0;
            this.mouseY = this.mapCoord(e.clientY - br.top, 0, canvas.height * ratio, 0, fixedHeight) | 0;
        } else {
            const rect: DOMRect = canvas.getBoundingClientRect();
            const scaleX: number = canvas.width / rect.width;
            const scaleY: number = canvas.height / rect.height;
            this.mouseX = ((e.clientX - rect.left) * scaleX) | 0;
            this.mouseY = ((e.clientY - rect.top) * scaleY) | 0;
        }

        if (this.mouseX < 0) {
            this.mouseX = 0;
        }

        if (this.mouseY < 0) {
            this.mouseY = 0;
        }

        if (this.mouseX > fixedWidth) {
            this.mouseX = fixedWidth;
        }

        if (this.mouseY > fixedHeight) {
            this.mouseY = fixedHeight;
        }
    };

    private mapCoord = (v: number, n1: number, n2: number, m1: number, m2: number): number => {
        return ((v - n1) * (m2 - m1)) / (n2 - n1) + m1;
    };
}
