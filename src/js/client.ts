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
import {decompressBz2, downloadUrl, sleep} from './jagex2/util/JsUtil.js';
import {playMidi} from './jagex2/util/AudioUtil.js';
import GameShell from "./jagex2/client/GameShell.js";

import './vendor/midi.js';

class Client extends GameShell {
    static HOST: string = 'https://w2.225.2004scape.org';
    static CHARSET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

    alreadyStarted: boolean = false;
    errorStarted: boolean = false;
    errorLoading: boolean = false;
    errorHost: boolean = false;

    loopCycle: number = 0;
    ingame: boolean = false;
    redrawTitleBackground: boolean = true;
    archiveChecksums: number[] = [];

    titleScreenState: number = 0;
    titleLoginField: number = 0;
    titleArchive: Archive | null = null;
    imageTitle2: CanvasFrameBuffer | null = null;
    imageTitle3: CanvasFrameBuffer | null = null;
    imageTitle4: CanvasFrameBuffer | null = null;
    imageTitle0: CanvasFrameBuffer | null = null;
    imageTitle1: CanvasFrameBuffer | null = null;
    imageTitle5: CanvasFrameBuffer | null = null;
    imageTitle6: CanvasFrameBuffer | null = null;
    imageTitle7: CanvasFrameBuffer | null = null;
    imageTitle8: CanvasFrameBuffer | null = null;
    imageTitleBox: Image8 | null = null;
    imageTitleButton: Image24 | null = null;

    fontPlain11: Font | null = null;
    fontPlain12: Font | null = null;
    fontBold12: Font | null = null;
    fontQuill8: Font | null = null;

    flameActive: boolean = false;

    loginMessage0: string = '';
    loginMessage1: string = '';
    username: string = '';
    password: string = '';

    async load(): Promise<void> {
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

            this.fontPlain11 = Font.fromArchive(this.titleArchive, 'p11');
            this.fontPlain12 = Font.fromArchive(this.titleArchive, 'p12');
            this.fontBold12 = Font.fromArchive(this.titleArchive, 'b12');
            this.fontQuill8 = Font.fromArchive(this.titleArchive, 'q8');

            await this.loadTitleBackground();
            this.loadTitleImages();

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

    update(): void {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }
        this.loopCycle++;
        if (this.ingame) {
            // TODO
        } else {
            this.updateTitleScreen();
        }
    }

    async draw(): Promise<void> {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawErrorScreen();
            return;
        }

        if (!this.ingame) {
            await this.drawTitleScreen();
        }
    }

    //

    async showProgress(progress: number, str: string): Promise<void> {
        console.log(`${progress}%: ${str}`);

        await this.prepareTitleScreen();
        if (!this.titleArchive) {
            await super.showProgress(progress, str);
            return;
        }

        this.imageTitle4?.bind();

        let x = 360;
        let y = 200;

        let offsetY = 20;
        this.fontBold12?.drawStringCenter(x / 2, (y / 2) - offsetY - 26, 'RuneScape is loading - please wait...', 0xFFFFFF);
        let midY = (y / 2) - 18 - offsetY;

        Draw2D.drawRect((x / 2) - 152, midY, 304, 34, 0x8c1111);
        Draw2D.drawRect((x / 2) - 151, midY + 1, 302, 32, 0x000000);
        Draw2D.fillRect((x / 2) - 150, midY + 2, progress * 3, 30, 0x8c1111);
        Draw2D.fillRect(((x / 2) - 150) + (progress * 3), midY + 2, 300 - (progress * 3), 30, 0x000000);

        this.fontBold12?.drawStringCenter(x / 2, (y / 2) + 5 - offsetY, str, 0xFFFFFF);
        this.imageTitle4?.draw(214, 186);

        if (this.redrawTitleBackground) {
            this.redrawTitleBackground = false;
            if (!this.flameActive) {
                this.imageTitle0?.draw(0, 0);
                this.imageTitle1?.draw(661, 0);
            }
            this.imageTitle2?.draw(128, 0);
            this.imageTitle3?.draw(214, 386);
            this.imageTitle5?.draw(0, 265);
            this.imageTitle6?.draw(574, 265);
            this.imageTitle7?.draw(128, 186);
            this.imageTitle8?.draw(574, 186);
        }

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    //

    async prepareTitleScreen(): Promise<void> {
        this.imageTitle0 = new CanvasFrameBuffer(this.canvas, 128, 265);
        Draw2D.clear();

        this.imageTitle1 = new CanvasFrameBuffer(this.canvas, 128, 265);
        Draw2D.clear();

        this.imageTitle2 = new CanvasFrameBuffer(this.canvas, 533, 186);
        Draw2D.clear();

        this.imageTitle3 = new CanvasFrameBuffer(this.canvas, 360, 146);
        Draw2D.clear();

        this.imageTitle4 = new CanvasFrameBuffer(this.canvas, 360, 200);
        Draw2D.clear();

        this.imageTitle5 = new CanvasFrameBuffer(this.canvas, 214, 267);
        Draw2D.clear();

        this.imageTitle6 = new CanvasFrameBuffer(this.canvas, 215, 267);
        Draw2D.clear();

        this.imageTitle7 = new CanvasFrameBuffer(this.canvas, 86, 79);
        Draw2D.clear();

        this.imageTitle8 = new CanvasFrameBuffer(this.canvas, 87, 79);
        Draw2D.clear();

        if (this.titleArchive != null) {
            await this.loadTitleBackground();
            this.loadTitleImages();
        }
    }

    async loadTitleBackground(): Promise<void> {
        let background: Image24 = await Image24.fromJpeg(this.titleArchive, 'title');

        this.imageTitle0?.bind();
        background.draw(0, 0);

        this.imageTitle1?.bind();
        background.draw(-661, 0);

        this.imageTitle2?.bind();
        background.draw(-128, 0);

        this.imageTitle3?.bind();
        background.draw(-214, -386);

        this.imageTitle4?.bind();
        background.draw(-214, -186);

        this.imageTitle5?.bind();
        background.draw(0, -265);

        this.imageTitle6?.bind();
        background.draw(-128, -186);

        this.imageTitle7?.bind();
        background.draw(-128, -186);

        this.imageTitle8?.bind();
        background.draw(-574, -186);

        // draw right side (mirror image)
        background.flipHorizontally();

        this.imageTitle0?.bind();
        background.draw(394, 0);

        this.imageTitle1?.bind();
        background.draw(-267, 0);

        this.imageTitle2?.bind();
        background.draw(266, 0);

        this.imageTitle3?.bind();
        background.draw(180, -386);

        this.imageTitle4?.bind();
        background.draw(180, -186);

        this.imageTitle5?.bind();
        background.draw(394, -265);

        this.imageTitle6?.bind();
        background.draw(-180, -265);

        this.imageTitle7?.bind();
        background.draw(212, -186);

        this.imageTitle8?.bind();
        background.draw(-180, -186);

        let logo: Image24 = Image24.fromArchive(this.titleArchive, 'logo');
        this.imageTitle2?.bind();
        logo.draw((this.width / 2) - (logo.width / 2) - 128, 18);
    }

    loadTitleImages(): void {
        this.imageTitleBox = Image8.fromArchive(this.titleArchive, 'titlebox');
        this.imageTitleButton = Image24.fromArchive(this.titleArchive, 'titlebutton');
        // TODO Flames
    }

    updateTitleScreen(): void {
        if (this.titleScreenState === 0) {
            let x = this.width / 2 - 80;
            let y = this.height / 2 + 20;

            y += 20;
            if (this.mouseClickButton == 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.titleScreenState = 3;
                this.titleLoginField = 0;
            }

            x = this.width / 2 + 80;
            if (this.mouseClickButton == 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.loginMessage0 = '';
                this.loginMessage1 = 'Enter your username & password.';
                this.titleScreenState = 2;
                this.titleLoginField = 0;
            }
        } else if (this.titleScreenState == 2) {
            let y = this.height / 2 - 40;
            y += 30;
            y += 25;

            if (this.mouseClickButton == 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
                this.titleLoginField = 0;
            }
            y += 15;

            if (this.mouseClickButton == 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
                this.titleLoginField = 1;
            }
            y += 15;

            let buttonX = this.width / 2 - 80;
            let buttonY = this.height / 2 + 50;
            buttonY += 20;

            if (this.mouseClickButton == 1 && this.mouseClickX >= buttonX - 75 && this.mouseClickX <= buttonX + 75 && this.mouseClickY >= buttonY - 20 && this.mouseClickY <= buttonY + 20) {
                // this.login(this.username, this.password, false);
            }

            buttonX = this.width / 2 + 80;
            if (this.mouseClickButton == 1 && this.mouseClickX >= buttonX - 75 && this.mouseClickX <= buttonX + 75 && this.mouseClickY >= buttonY - 20 && this.mouseClickY <= buttonY + 20) {
                this.titleScreenState = 0;
                this.username = '';
                this.password = '';
            }

            while (true) {
                let key = this.pollKey();
                if (key == -1) {
                    return;
                }

                let valid = false;
                for (let i = 0; i < Client.CHARSET.length; i++) {
                    if (String.fromCharCode(key) === Client.CHARSET.charAt(i)) {
                        valid = true;
                        break;
                    }
                }

                if (this.titleLoginField == 0) {
                    console.log(key);
                    if (key == 8 && this.username.length > 0) {
                        this.username = this.username.substring(0, this.username.length - 1);
                    }

                    if (key == 9 || key == 10 || key == 13) {
                        this.titleLoginField = 1;
                    }

                    if (valid) {
                        this.username = this.username + String.fromCharCode(key);
                    }

                    if (this.username.length > 12) {
                        this.username = this.username.substring(0, 12);
                    }
                } else if (this.titleLoginField == 1) {
                    if (key == 8 && this.password.length > 0) {
                        this.password = this.password.substring(0, this.password.length - 1);
                    }

                    if (key == 9 || key == 10 || key == 13) {
                        this.titleLoginField = 0;
                    }

                    if (valid) {
                        this.password = this.password + String.fromCharCode(key);
                    }

                    if (this.password.length > 20) {
                        this.password = this.password.substring(0, 20);
                    }
                }
            }
        } else if (this.titleScreenState == 3) {
            let x = this.width / 2;
            let y = this.height / 2 + 50;
            y += 20;

            if (this.mouseClickButton == 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.titleScreenState = 0;
            }
        }
    }

    async drawTitleScreen(): Promise<void> {
        await this.prepareTitleScreen();
        this.imageTitle4?.bind();
        this.imageTitleBox?.draw(0, 0);

        let w = 360;
        let h = 200;

        if (this.titleScreenState === 0) {
            let x = w / 2;
            let y = (h / 2) - 20;
            this.fontBold12?.drawStringTaggableCenter(x, y, 'Welcome to RuneScape', 0xFFFFFF00, true);

            x = (w / 2) - 80;
            y = (h / 2) + 20;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'New user', 0xFFFFFFFF, true);

            x = (w / 2) + 80;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Existing User', 0xFFFFFFFF, true);
        } else if (this.titleScreenState === 2) {
            let x = w / 2 - 80;
            let y = h / 2 - 40;
            if (this.loginMessage0.length === 0) {
                this.fontBold12?.drawStringTaggableCenter(w / 2, y - 15, this.loginMessage0, 0xFFFF00, true);
                this.fontBold12?.drawStringTaggableCenter(w / 2, y, this.loginMessage1, 0xFFFF00, true);
                y += 30;
            } else {
                this.fontBold12?.drawStringTaggableCenter(w / 2, y - 7, this.loginMessage1, 0xFFFF00, true);
                y += 30;
            }

            this.fontBold12?.drawStringTaggable(w / 2 - 90, y, `Username: ${this.username}${(this.titleLoginField == 0 && this.loopCycle % 40 < 20) ? '@yel@|' : ''}`, 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggable(w / 2 - 88, y, `Password: ${this.password}${(this.titleLoginField == 1 && this.loopCycle % 40 < 20) ? '@yel@|' : ''}`, 0xFFFFFF, true);

            x = w / 2 - 80;
            y = h / 2 + 50;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Login', 0xFFFFFF, true);

            x = w / 2 + 80;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Cancel', 0xFFFFFF, true);
        } else if (this.titleScreenState == 3) {
            this.fontBold12?.drawStringTaggableCenter(w / 2, 16776960, true, h / 2 - 60, "Create a free account");

            let x = w / 2;
            let y = h / 2 - 35;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "To create a new account you need to", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "go back to the main RuneScape webpage", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "and choose the red 'create account'", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "button at the top right of that page.", 0xFFFFFF, true);
            y += 15;

            y = h / 2 + 50;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, "Cancel", 16777215, true);
        }

        this.imageTitle4?.draw(214, 186);
        if (this.redrawTitleBackground) {
            this.redrawTitleBackground = false;
            this.imageTitle2?.draw(128, 0);
            this.imageTitle3?.draw(214, 386);
            this.imageTitle5?.draw(0, 265);
            this.imageTitle6?.draw(574, 265);
            this.imageTitle7?.draw(128, 186);
            this.imageTitle8?.draw(574, 186);
        }
    }

    async loadArchive(filename: string, displayName: string, crc: number, progress: number): Promise<Archive> {
        // TODO: caching
        // TODO: download progress, retry

        await this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Client.HOST}/${filename}${crc}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }

    async setMidi(name: string, crc: number): Promise<void> {
        let file = await downloadUrl(`${Client.HOST}/${name.replaceAll(' ', '_')}_${crc}.mid`);
        playMidi(decompressBz2(file.data, true, false), 192);
    }

    drawErrorScreen(): void {
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
client.run().then(() => {
});
