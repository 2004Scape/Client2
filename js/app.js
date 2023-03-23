import Buffer from './Buffer.js';
import Archive from './Archive.js';
import Draw2D from './Draw2D.js';
import Image8 from './Image8.js';
import Image24 from './Image24.js';
import CanvasFrameBuffer from './CanvasFrameBuffer.js';
import { decompressBz2, downloadUrl, sleep } from './Util.js';
import { playMidi } from './Audio.js';
import Font from './Font.js';

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

    p11 = null;
    p12 = null;
    b12 = null;
    q8 = null;

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
            await this.showProgress(10, 'Connecting to fileserver');

            let checksums = await downloadUrl(`${Client.HOST}/crc`);
            for (let i = 0; i < checksums.length / 4; i++) {
                this.archiveChecksums[i] = checksums.g4();
            }

            await this.setMidi('scape_main', 12345678);

            this.titleArchive = await this.loadArchive('title', 'title screen', this.archiveChecksums[1], 10);

            this.p11 = Font.fromArchive(this.titleArchive, 'p11');
            this.p12 = Font.fromArchive(this.titleArchive, 'p12');
            this.b12 = Font.fromArchive(this.titleArchive, 'b12');
            this.q8 = Font.fromArchive(this.titleArchive, 'q8');

            await this.loadTitleBackground();
            this.loadTitleForeground();

            let config = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            let interfaces = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            let media = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            let models = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            let textures = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            let wordenc = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            let sounds = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

            await this.showProgress(75, 'Unpacking media');
            await this.showProgress(80, 'Unpacking textures');
            await this.showProgress(83, 'Unpacking models');
            await this.showProgress(86, 'Unpacking config');
            await this.showProgress(90, 'Unpacking sounds');
            await this.showProgress(92, 'Unpacking interfaces');
            await this.showProgress(97, 'Preparing game engine');
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
            this.drawErrorScreen();
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
            this.ctx.fillText(str, this.canvas.width / 2, y + 22);

            return;
        }

        this.titleCenter.bind();

        let x = 360;
        let y = 200;

        let offsetY = 20;
        this.b12.drawCentered(x / 2, (y / 2) - offsetY - 26, 'RuneScape is loading - please wait...', 0xFFFFFF, false);
        let midY = (y / 2) - 18 - offsetY;

        Draw2D.drawRect((x / 2) - 152, midY, 304, 34, 0x8c1111);
        Draw2D.drawRect((x / 2) - 151, midY + 1, 302, 32, 0x000000);
        Draw2D.fillRect((x / 2) - 150, midY + 2, progress * 3, 30, 0x8c1111);
        Draw2D.fillRect(((x / 2) - 150) + (progress * 3), midY + 2, 300 - (progress * 3), 30, 0x000000);

        this.b12.drawCentered(x / 2, (y / 2) + 5 - offsetY, str, 0xFFFFFF, false);
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

        let logo = Image24.fromArchive(this.titleArchive, 'logo');
        this.titleTop.bind();
        logo.draw((this.canvas.width / 2) - (logo.width / 2) - 128, 18);
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

            let x = 360;
            let y = 200;

            if (this.titleState == 0) {
                let offsetX = x / 2;
                let offsetY = (y / 2) - 20;
                this.b12.drawCentered(offsetX, offsetY, 'Welcome to RuneScape', 0xFFFFFF00);

                // y += 30;
                offsetX = (x / 2) - 80;
                offsetY = (y / 2) + 20;
                this.imageTitleButton.draw(offsetX - 73, offsetY - 20);
                this.b12.drawCentered(offsetX, offsetY + 5, 'New user', 0xFFFFFFFF);

                offsetX = (x / 2) + 80;
                this.imageTitleButton.draw(offsetX - 73, offsetY - 20);
                this.b12.drawCentered(offsetX, offsetY + 5, 'Existing User', 0xFFFFFFFF);
            }
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

        await this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Client.HOST}/${filename}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }

    async setMidi(name, crc) {
        let file = await downloadUrl(`${Client.HOST}/${name.replaceAll(' ', '_')}_${crc}.mid`);
        playMidi(decompressBz2(file.data, true, false), 192);
    }

    setLoopRate(rate) {
        this.deltime = 1000 / rate;
    }

    drawErrorScreen() {
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.setLoopRate(1);

        if (this.errorLoading) {
            this.ctx.font = 'bold 16px helvetica, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = 'yellow';

            let y = 35;
            this.ctx.fillText('Sorry, an error has occured whilst loading RuneScape', 30, y);

            y += 50;
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            this.ctx.font = 'bold 12px helvetica, sans-serif';
            this.ctx.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            this.ctx.fillText('2: Try clearing your web-browsers cache from tools->internet options', 30, y);

            y += 30;
            this.ctx.fillText('3: Try using a different game-world', 30, y);

            y += 30;
            this.ctx.fillText('4: Try rebooting your computer', 30, y);

            y += 30;
            this.ctx.fillText('5: Try selecting a different version of Java from the play-game menu', 30, y);
        }

        if (this.errorHost) {
            this.ctx.font = 'bold 20px helvetica, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = 'white';

            this.ctx.fillText('Error - unable to load game!', 50, 50);
            this.ctx.fillText('To play RuneScape make sure you play from', 50, 100);
            this.ctx.fillText('https://2004scape.org', 50, 150);
        }

        if (this.errorStarted) {
            this.ctx.font = 'bold 13px helvetica, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = 'yellow';

            let y = 35;
            this.ctx.fillText('Error a copy of RuneScape already appears to be loaded', 30, y);

            y += 50;
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            this.ctx.font = 'bold 12px helvetica, sans-serif';
            this.ctx.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            this.ctx.fillText('2: Try rebooting your computer, and reloading', 30, y);
        }
    }
}

let client = new Client();
client.main();
