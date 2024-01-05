import SoundTrack from './jagex2/audio/SoundTrack.js';

import SeqType from './jagex2/config/SeqType.js';
import LocType from './jagex2/config/LocType.js';
import FloType from './jagex2/config/FloType.js';
import ObjType from './jagex2/config/ObjType.js';
import NpcType from './jagex2/config/NpcType.js';
import IdkType from './jagex2/config/IdkType.js';
import SpotAnimType from './jagex2/config/SpotAnimType.js';
import VarpType from './jagex2/config/VarpType.js';
import IfType from './jagex2/config/IfType.js';

import CanvasFrameBuffer from './jagex2/graphics/CanvasFrameBuffer.js';
import Draw2D from './jagex2/graphics/Draw2D.js';
import Draw3D from './jagex2/graphics/Draw3D.js';
import Image8 from './jagex2/graphics/Image8.js';
import Image24 from './jagex2/graphics/Image24.js';
import Font from './jagex2/graphics/Font.js';
import Model from './jagex2/graphics/Model.js';
import SeqBase from './jagex2/graphics/SeqBase.js';
import SeqFrame from './jagex2/graphics/SeqFrame.js';

import Archive from './jagex2/io/Archive.js';

import Censor from './jagex2/util/Censor.js';
import { decompressBz2, downloadUrl, sleep } from './jagex2/util/JsUtil.js';
import { playMidi } from './jagex2/util/AudioUtil.js';
import GameShell from "./jagex2/client/GameShell.js";

export default class Client extends GameShell {
    static HOST = 'https://w2.225.2004scape.org ';

    alreadyStarted = false;
    errorStarted = false;
    errorLoading = false;
    errorHost = false;

    clientClock = 0;
    ingame = false;
    redrawBackground = true;
    archiveChecksums: number[] = [];

    titleState = 0;
    titleArchive: Archive | null = null;
    titleDrawn = false;
    titleTop: CanvasFrameBuffer | null = null;
    titleBottom: CanvasFrameBuffer | null = null;
    titleCenter: CanvasFrameBuffer | null = null;
    titleLeft: CanvasFrameBuffer | null = null;
    titleRight: CanvasFrameBuffer | null = null;
    titleBottomLeft: CanvasFrameBuffer | null = null;
    titleBottomRight: CanvasFrameBuffer | null = null;
    titleLeftSpace: CanvasFrameBuffer | null = null;
    titleRightSpace: CanvasFrameBuffer | null = null;
    imageTitleBox: Image8 | null = null;
    imageTitleButton: Image24 | null = null;

    p11: Font | null = null;
    p12: Font | null = null;
    b12: Font | null = null;
    q8: Font | null = null;

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
            Draw3D.unpackTextures(textures);
            Draw3D.setBrightness(0.8);
            // Draw3D.initPool(20);
    
            await this.showProgress(83, 'Unpacking models');
            Model.unpack(models);
            SeqBase.unpack(models);
            SeqFrame.unpack(models);
    
            await this.showProgress(86, 'Unpacking config');
            SeqType.unpack(config);
            LocType.unpack(config);
            FloType.unpack(config);
            ObjType.unpack(config);
            NpcType.unpack(config);
            IdkType.unpack(config);
            SpotAnimType.unpack(config);
            VarpType.unpack(config);
    
            await this.showProgress(90, 'Unpacking sounds');
            SoundTrack.unpack(sounds);
    
            await this.showProgress(92, 'Unpacking interfaces');
            IfType.unpack(interfaces);
    
            await this.showProgress(97, 'Preparing game engine');
            Censor.unpack(wordenc);
        } catch (err) {
            console.error(err);
            this.errorLoading = true;
        }
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

    async showProgress(progress: number, str: string) {
        console.log(`${progress}%: ${str}`);

        await this.prepareTitleScreen();
        if (!this.titleArchive) {
            await super.showProgress(progress, str);
            return;
        }

        this.titleCenter?.bind();

        let x = 360;
        let y = 200;

        let offsetY = 20;
        this.b12?.drawCentered(x / 2, (y / 2) - offsetY - 26, 'RuneScape is loading - please wait...', 0xFFFFFF, false);
        let midY = (y / 2) - 18 - offsetY;

        Draw2D.drawRect((x / 2) - 152, midY, 304, 34, 0x8c1111);
        Draw2D.drawRect((x / 2) - 151, midY + 1, 302, 32, 0x000000);
        Draw2D.fillRect((x / 2) - 150, midY + 2, progress * 3, 30, 0x8c1111);
        Draw2D.fillRect(((x / 2) - 150) + (progress * 3), midY + 2, 300 - (progress * 3), 30, 0x000000);

        this.b12?.drawCentered(x / 2, (y / 2) + 5 - offsetY, str, 0xFFFFFF, false);
        this.titleCenter?.draw(214, 186);

        if (this.redrawBackground) {
            this.redrawBackground = false;
            this.titleDrawn = true;

            // TODO: flame active logic
            this.titleLeft?.draw(0, 0);
            this.titleRight?.draw(661, 0);

            this.titleTop?.draw(128, 0);
            this.titleBottom?.draw(214, 386);
            this.titleBottomLeft?.draw(0, 265);
            this.titleBottomRight?.draw(574, 265);
            this.titleLeftSpace?.draw(128, 186);
            this.titleRightSpace?.draw(574, 186);
        }

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
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

        this.titleLeft?.bind();
        background.draw(0, 0);

        this.titleRight?.bind();
        background.draw(-661, 0);

        this.titleTop?.bind();
        background.draw(-128, 0);

        this.titleBottom?.bind();
        background.draw(-214, -386);

        this.titleCenter?.bind();
        background.draw(-214, -186);

        this.titleBottomLeft?.bind();
        background.draw(0, -265);

        this.titleBottomRight?.bind();
        background.draw(-128, -186);

        this.titleLeftSpace?.bind();
        background.draw(-128, -186);

        this.titleRightSpace?.bind();
        background.draw(-574, -186);

        // draw right side (mirror image)
        background.flipHorizontally();

        this.titleLeft?.bind();
        background.draw(394, 0);

        this.titleRight?.bind();
        background.draw(-267, 0);

        this.titleTop?.bind();
        background.draw(266, 0);

        this.titleBottom?.bind();
        background.draw(180, -386);

        this.titleCenter?.bind();
        background.draw(180, -186);

        this.titleBottomLeft?.bind();
        background.draw(394, -265);

        this.titleBottomRight?.bind();
        background.draw(-180, -265);

        this.titleLeftSpace?.bind();
        background.draw(212, -186);

        this.titleRightSpace?.bind();
        background.draw(-180, -186);

        let logo = Image24.fromArchive(this.titleArchive, 'logo');
        this.titleTop?.bind();
        logo.draw((this.canvas!.width / 2) - (logo.width / 2) - 128, 18);
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
            this.titleCenter?.bind();
            this.imageTitleBox?.draw(0, 0);

            let x = 360;
            let y = 200;

            if (this.titleState === 0) {
                let offsetX = x / 2;
                let offsetY = (y / 2) - 20;
                this.b12?.drawCentered(offsetX, offsetY, 'Welcome to RuneScape', 0xFFFFFF00);

                // y += 30;
                offsetX = (x / 2) - 80;
                offsetY = (y / 2) + 20;
                this.imageTitleButton?.draw(offsetX - 73, offsetY - 20);
                this.b12?.drawCentered(offsetX, offsetY + 5, 'New user', 0xFFFFFFFF);

                offsetX = (x / 2) + 80;
                this.imageTitleButton?.draw(offsetX - 73, offsetY - 20);
                this.b12?.drawCentered(offsetX, offsetY + 5, 'Existing User', 0xFFFFFFFF);
            }
        }

        this.titleCenter?.draw(214, 186);
        if (this.redrawBackground) {
            this.redrawBackground = false;
            this.titleDrawn = true;

            this.titleTop?.draw(128, 0);
            this.titleBottom?.draw(214, 386);
            this.titleBottomLeft?.draw(0, 265);
            this.titleBottomRight?.draw(574, 265);
            this.titleLeftSpace?.draw(128, 186);
            this.titleRightSpace?.draw(574, 186);
        }
    }

    async loadArchive(filename: string, displayName: string, crc: number, progress: number) {
        // TODO: caching
        // TODO: download progress, retry

        await this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Client.HOST}/${filename}${crc}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }

    async setMidi(name: string, crc: number) {
        let file = await downloadUrl(`${Client.HOST}/${name.replaceAll(' ', '_')}_${crc}.mid`);
        playMidi(decompressBz2(file.data, true, false), 192);
    }

    drawErrorScreen() {
        if (!this.ctx || !this.canvas) {
            return;
        }

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

const client = new Client();
client.run().then(() => {});
