import Buffer from './Buffer.js';
import Archive from './Archive.js';
import Draw2D from './Draw2D.js';
import Image8 from './Image8.js';
import Image24 from './Image24.js';
import CanvasFrameBuffer from './CanvasFrameBuffer.js';
import { downloadUrl, sleep } from './Util.js';

class Client {
    static HOST = 'https://world2.runewiki.org';
    canvas = null;
    ctx = null;

    state = 0;
    deltime = 20;
    mindel = 1;
    otim = [];
    fps = 0;

    alreadyStarted = false;
    errorStarted = false;
    errorLoading = false;
    errorHost = false;

    clientClock = 0;
    ingame = false;
    redrawScreen = false;
    redrawBackground = false;
    archiveChecksums = [];

    titleState = 0;
    titleArchive = null;
    titleDrawn = false;
    titleTop = null;
    titleBottom = null;
    titleCenter = null;
    titleLeft = null;
    titleRight = null;
    titleBottomLeft = null;
    titleBottomRight = null;
    titleLeftSpace = null;
    titleRightSpace = null;
    imageTitleBox = null;
    imageTitleButton = null;

    async main() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.refresh();
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
                ratio = (2560 * delta) / (ntime - this.otim[opos]);
            }

            if (ratio < 25) {
                ratio = 25;
            } else if (ratio > 256) {
                ratio = 256;
                delta = (ntime - this.otim[opos]) / 10;
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

            for (; count < 256; count += ratio) {
                this.update();
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

    async load() {
        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        try {
            this.showProgress(10, 'Connecting to fileserver');

            let checksums = await downloadUrl(`${Client.HOST}/crc`);
            for (let i = 0; i < checksums.length / 4; i++) {
                this.archiveChecksums[i] = checksums.g4();
            }

            this.titleArchive = await this.loadArchive('title', 'title screen', this.archiveChecksums[1], 10);

            await this.loadTitleBackground();
            this.loadTitleForeground();

            let config = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            let interfaces = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            let media = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            let models = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            let textures = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            let wordenc = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            let sounds = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);
        } catch (err) {
            console.error(err);
            this.errorLoading = true;
        }
    }

    unload() {
    }

    shutdown() {
        state = -2;
        this.unload();
    }

    refresh() {
        this.redrawBackground = true;
    }

    update() {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        this.clientClock++;

        if (!this.ingame) {
            this.updateTitleScreen();
        }
    }

    async draw() {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        if (!this.ingame) {
            await this.drawTitleScreen();
        }
    }

    //

    async showProgress(progress, str) {
        console.log(`${progress}%: ${str}`);

        await this.prepareTitleScreen();
        if (this.titleArchive === null) {
            if (this.redrawScreen) {
                this.ctx.fillStyle = '#000';
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.redrawScreen = false;
            }

            let y = this.canvas.height / 2 - 18;

            // draw full progress bar
            this.ctx.fillStyle = 'rgb(140, 17, 17)';
            this.ctx.rect((this.canvas.width / 2) - 152, y, 304, 34);
            this.ctx.fillRect((this.canvas.width / 2) - 150, y + 2, progress * 3, 30);

            // cover up progress bar
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(((this.canvas.width / 2) - 150) + (progress * 3), y + 2, 300 - (progress * 3), 30);

            // draw text
            this.ctx.font = 'bold 13px helvetica, sans-serif ';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(str, this.canvas.width / 2, y + 22);

            return;
        }

        this.titleCenter.bind();

        let x = 360;
        let y = 200;

        let offsetY = 20;
        // TODO: RuneScape is loading - please wait...
        let midY = (y / 2) - 18 - offsetY;

        Draw2D.drawRect((x / 2) - 152, midY, 304, 34, 0xFF8c1111);
        Draw2D.drawRect((x / 2) - 151, midY + 1, 302, 32, 0xFF000000);
        Draw2D.fillRect((x / 2) - 150, midY + 2, progress * 3, 30, 0xFF8c1111);
        Draw2D.fillRect(((x / 2) - 150) + (progress * 3), midY + 2, 300 - (progress * 3), 30, 0xFF000000);

        // TODO: draw string
        this.titleCenter.draw(214, 186);

        if (this.redrawBackground) {
            this.redrawBackground = false;
            this.titleDrawn = true;

            // TODO: flame active logic
            this.titleLeft.draw(0, 0);
            this.titleRight.draw(661, 0);

            this.titleTop.draw(128, 0);
            this.titleBottom.draw(214, 386);
            this.titleBottomLeft.draw(0, 265);
            this.titleBottomRight.draw(574, 265);
            this.titleLeftSpace.draw(128, 186);
            this.titleRightSpace.draw(574, 186);
        }
    }

    //

    async prepareTitleScreen() {
        this.titleLeft = new CanvasFrameBuffer(this.canvas, 128, 265);
        Draw2D.clear();

        this.titleRight = new CanvasFrameBuffer(this.canvas, 128, 265);
        Draw2D.clear();

        this.titleTop = new CanvasFrameBuffer(this.canvas, 533, 186);
        Draw2D.clear();

        this.titleBottom = new CanvasFrameBuffer(this.canvas, 360, 146);
        Draw2D.clear();

        this.titleCenter = new CanvasFrameBuffer(this.canvas, 360, 200);
        Draw2D.clear();

        this.titleBottomLeft = new CanvasFrameBuffer(this.canvas, 214, 267);
        Draw2D.clear();

        this.titleBottomRight = new CanvasFrameBuffer(this.canvas, 215, 267);
        Draw2D.clear();

        this.titleLeftSpace = new CanvasFrameBuffer(this.canvas, 86, 79);
        Draw2D.clear();

        this.titleRightSpace = new CanvasFrameBuffer(this.canvas, 87, 79);
        Draw2D.clear();

        if (this.titleArchive != null) {
            await this.loadTitleBackground();
            this.loadTitleForeground();
        }
    }

    async loadTitleBackground() {
        let background = await Image24.fromJpeg(this.titleArchive, 'title');

        this.titleLeft.bind();
        background.draw(0, 0);

        this.titleRight.bind();
        background.draw(-661, 0);

        this.titleTop.bind();
        background.draw(-128, 0);

        this.titleBottom.bind();
        background.draw(-214, -386);

        this.titleCenter.bind();
        background.draw(-214, -186);

        this.titleBottomLeft.bind();
        background.draw(0, -265);

        this.titleBottomRight.bind();
        background.draw(-128, -186);

        this.titleLeftSpace.bind();
        background.draw(-128, -186);

        this.titleRightSpace.bind();
        background.draw(-574, -186);

        // draw right side (mirror image)
        background.flipHorizontally();

        this.titleLeft.bind();
        background.draw(394, 0);

        this.titleRight.bind();
        background.draw(-267, 0);

        this.titleTop.bind();
        background.draw(266, 0);

        this.titleBottom.bind();
        background.draw(180, -386);

        this.titleCenter.bind();
        background.draw(180, -186);

        this.titleBottomLeft.bind();
        background.draw(394, -265);

        this.titleBottomRight.bind();
        background.draw(-180, -265);

        this.titleLeftSpace.bind();
        background.draw(212, -186);

        this.titleRightSpace.bind();
        background.draw(-180, -186);
    }

    loadTitleForeground() {
        this.imageTitleBox = Image8.fromArchive(this.titleArchive, 'titlebox');
        this.imageTitleButton = Image24.fromArchive(this.titleArchive, 'titlebutton');
    }

    updateTitleScreen() {
    }

    async drawTitleScreen() {
        await this.prepareTitleScreen();

        if (this.titleArchive != null) {
            this.titleCenter.bind();
            this.imageTitleBox.draw(0, 0);
        }

        this.titleCenter.draw(214, 186);
        if (this.redrawBackground) {
            this.redrawBackground = false;
            this.titleDrawn = true;

            this.titleTop.draw(128, 0);
            this.titleBottom.draw(214, 386);
            this.titleBottomLeft.draw(0, 265);
            this.titleBottomRight.draw(574, 265);
            this.titleLeftSpace.draw(128, 186);
            this.titleRightSpace.draw(574, 186);
        }
    }

    async loadArchive(filename, displayName, crc, progress) {
        // TODO: caching
        // TODO: download progress, retry

        this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Client.HOST}/${filename}`);
        this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }
}

let client = new Client();
client.main();
