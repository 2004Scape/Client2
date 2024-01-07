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

import PixMap from './jagex2/graphics/PixMap.js';
import Draw2D from './jagex2/graphics/Draw2D.js';
import Draw3D from './jagex2/graphics/Draw3D.js';
import Pix8 from './jagex2/graphics/Pix8.js';
import Pix24 from './jagex2/graphics/Pix24.js';
import Font from './jagex2/graphics/Font.js';
import Model from './jagex2/graphics/Model.js';
import SeqBase from './jagex2/graphics/SeqBase.js';
import SeqFrame from './jagex2/graphics/SeqFrame.js';

import Archive from './jagex2/io/Archive.js';

import Censor from './jagex2/util/Censor.js';
import {arraycopy, decompressBz2, downloadUrl, sleep} from './jagex2/util/JsUtil.js';
import {playMidi} from './jagex2/util/AudioUtil.js';
import GameShell from "./jagex2/client/GameShell.js";

import './vendor/midi.js';
import Packet from "./jagex2/io/Packet.js";

class Client extends GameShell {
    static readonly HOST: string = 'https://w2.225.2004scape.org';
    static readonly CHARSET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

    private alreadyStarted: boolean = false;
    private errorStarted: boolean = false;
    private errorLoading: boolean = false;
    private errorHost: boolean = false;

    private loopCycle: number = 0;
    private ingame: boolean = false;
    private redrawTitleBackground: boolean = true;
    private archiveChecksums: number[] = [];

    private titleScreenState: number = 0;
    private titleLoginField: number = 0;
    private titleArchive: Archive | null = null;
    private imageTitle2: PixMap | null = null;
    private imageTitle3: PixMap | null = null;
    private imageTitle4: PixMap | null = null;
    private imageTitle0: PixMap | null = null;
    private imageTitle1: PixMap | null = null;
    private imageTitle5: PixMap | null = null;
    private imageTitle6: PixMap | null = null;
    private imageTitle7: PixMap | null = null;
    private imageTitle8: PixMap | null = null;
    private imageTitleBox: Pix8 | null = null;
    private imageTitleButton: Pix8 | null = null;

    private fontPlain11: Font | null = null;
    private fontPlain12: Font | null = null;
    private fontBold12: Font | null = null;
    private fontQuill8: Font | null = null;

    private flameActive: boolean = false;

    private loginMessage0: string = '';
    private loginMessage1: string = '';
    private username: string = '';
    private password: string = '';

    private areaSidebar: PixMap | null = null;
    private areaMapback: PixMap | null = null;
    private areaViewport: PixMap | null = null;
    private areaChatback: PixMap | null = null;
    private areaBackbase1: PixMap | null = null;
    private areaBackbase2: PixMap | null = null;
    private areaBackhmid1: PixMap | null = null;

    private imageRunes: Pix8[] = [];

    private imageFlamesLeft: Pix24 | null = null;
    private imageFlamesRight: Pix24 | null = null;

    private flameBuffer1: number[] = [];
    private flameBuffer0: number[] = [];
    private flameBuffer3: number[] = [];
    private flameBuffer2: number[] = [];


    private flameGradient: number[] = [];
    private flameGradient0: number[] = [];
    private flameGradient1: number[] = [];
    private flameGradient2: number[] = [];

    private flameLineOffset: number[] = [];

    private flameCycle0: number = 0;

    private flameGradientCycle0: number = 0;
    private flameGradientCycle1: number = 0;

    run = async (): Promise<void> => {
        setInterval(() => {
            if (this.flameActive) {
                this.updateFlames();
                this.updateFlames();
                this.drawFlames();
            }
        }, 35);
        await super.run();
    }

    load = async (): Promise<void> => {
        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        try {
            await this.showProgress(10, 'Connecting to fileserver');

            const checksums = new Packet(await downloadUrl(`${Client.HOST}/crc`));
            for (let i = 0; i < 9; i++) {
                this.archiveChecksums[i] = checksums.g4;
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
    };

    update = (): void => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }
        this.loopCycle++;
        if (this.ingame) {
            // TODO
        } else {
            this.updateTitleScreen();
        }
    };

    draw = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawError();
            return;
        }
        if (this.ingame) {
            // TODO
        } else {
            await this.drawTitleScreen();

        }
    };

    refresh = (): void => {
        this.redrawTitleBackground = true;
    };

    showProgress = async (progress: number, str: string): Promise<void> => {
        console.log(`${progress}%: ${str}`);

        await this.loadTitle();
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
    };

    // ----

    private loadTitle = async (): Promise<void> => {
        if (this.imageTitle2 === null) {
            this.drawArea = null;
            this.areaChatback = null;
            this.areaMapback = null;
            this.areaSidebar = null;
            this.areaViewport = null;
            this.areaBackbase1 = null;
            this.areaBackbase2 = null;
            this.areaBackhmid1 = null;

            const canvas = this.canvas;
            this.imageTitle0 = new PixMap(canvas, 128, 265);
            Draw2D.clear();

            this.imageTitle1 = new PixMap(canvas, 128, 265);
            Draw2D.clear();

            this.imageTitle2 = new PixMap(canvas, 533, 186);
            Draw2D.clear();

            this.imageTitle3 = new PixMap(canvas, 360, 146);
            Draw2D.clear();

            this.imageTitle4 = new PixMap(canvas, 360, 200);
            Draw2D.clear();

            this.imageTitle5 = new PixMap(canvas, 214, 267);
            Draw2D.clear();

            this.imageTitle6 = new PixMap(canvas, 215, 267);
            Draw2D.clear();

            this.imageTitle7 = new PixMap(canvas, 86, 79);
            Draw2D.clear();

            this.imageTitle8 = new PixMap(canvas, 87, 79);
            Draw2D.clear();

            if (this.titleArchive !== null) {
                await this.loadTitleBackground();
                this.loadTitleImages();
            }
            this.redrawTitleBackground = true;
        }
    };

    private loadTitleBackground = async (): Promise<void> => {
        if (!this.titleArchive) {
            return;
        }
        const background = await Pix24.fromJpeg(this.titleArchive, 'title');

        this.imageTitle0?.bind();
        background.blitOpaque(0, 0);

        this.imageTitle1?.bind();
        background.blitOpaque(-661, 0);

        this.imageTitle2?.bind();
        background.blitOpaque(-128, 0);

        this.imageTitle3?.bind();
        background.blitOpaque(-214, -386);

        this.imageTitle4?.bind();
        background.blitOpaque(-214, -186);

        this.imageTitle5?.bind();
        background.blitOpaque(0, -265);

        this.imageTitle6?.bind();
        background.blitOpaque(-128, -186);

        this.imageTitle7?.bind();
        background.blitOpaque(-128, -186);

        this.imageTitle8?.bind();
        background.blitOpaque(-574, -186);

        // draw right side (mirror image)
        background.flipHorizontally();

        this.imageTitle0?.bind();
        background.blitOpaque(394, 0);

        this.imageTitle1?.bind();
        background.blitOpaque(-267, 0);

        this.imageTitle2?.bind();
        background.blitOpaque(266, 0);

        this.imageTitle3?.bind();
        background.blitOpaque(180, -386);

        this.imageTitle4?.bind();
        background.blitOpaque(180, -186);

        this.imageTitle5?.bind();
        background.blitOpaque(394, -265);

        this.imageTitle6?.bind();
        background.blitOpaque(-180, -265);

        this.imageTitle7?.bind();
        background.blitOpaque(212, -186);

        this.imageTitle8?.bind();
        background.blitOpaque(-180, -186);

        const logo = Pix24.fromArchive(this.titleArchive, 'logo');
        this.imageTitle2?.bind();
        logo.draw((this.width / 2) - (logo.width / 2) - 128, 18);
    };

    private updateFlameBuffer = (image: Pix8 | null): void => {
        const flameHeight = 256;

        // Clears the initial flame buffer
        for (let i = 0; i < 32768; i++) {
            this.flameBuffer0[i] = 0;
        }

        // Blends the fire at random
        for (let i = 0; i < 5000; i++) {
            const rand = Math.trunc(Math.random() * 128.0 * flameHeight);
            this.flameBuffer0[rand] = Math.trunc(Math.random() * 256.0);
        }

        // changes color between last few flames
        for (let i = 0; i < 20; i++) {
            for (let y = 1; y < Math.trunc(flameHeight) - 1; y++) {
                for (let x = 1; x < 127; x++) {
                    const index = x + (y << 7);
                    this.flameBuffer1[index] = ((this.flameBuffer0[index - 1] + this.flameBuffer0[index + 1] + this.flameBuffer0[index - 128] + this.flameBuffer0[index + 128]) / 4) | 0;
                }
            }

            const last = this.flameBuffer0;
            this.flameBuffer0 = this.flameBuffer1;
            this.flameBuffer1 = last;
        }

        // Renders the rune images
        if (image != null) {
            let off = 0;

            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    if (image.pixels[off++] != 0) {
                        const x0 = x + image.cropX + 16;
                        const y0 = y + image.cropY + 16;
                        const index = x0 + (y0 << 7);
                        this.flameBuffer0[index] = 0;
                    }
                }
            }
        }
    }

    private loadTitleImages = (): void => {
        if (!this.titleArchive) {
            return;
        }
        this.imageTitleBox = Pix8.fromArchive(this.titleArchive, 'titlebox');
        this.imageTitleButton = Pix8.fromArchive(this.titleArchive, 'titlebutton');
        for (let i = 0; i < 12; i++) {
            this.imageRunes[i] = Pix8.fromArchive(this.titleArchive, "runes", i);
        }
        this.imageFlamesLeft = new Pix24(128, 265);
        this.imageFlamesRight = new Pix24(128, 265);

        if (this.imageTitle0) arraycopy(this.imageTitle0.pixels, 0, this.imageFlamesLeft.pixels, 0, 33920)
        if (this.imageTitle1) arraycopy(this.imageTitle1.pixels, 0, this.imageFlamesRight.pixels, 0, 33920);

        this.flameGradient0 = [];
        for (let index = 0; index < 64; index++) {
            this.flameGradient0[index] = index * 262144;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient0[index + 64] = index * 1024 + 16711680;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient0[index + 128] = index * 4 + 16776960;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient0[index + 192] = 16777215;
        }
        this.flameGradient1 = [];
        for (let index = 0; index < 64; index++) {
            this.flameGradient1[index] = index * 1024;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient1[index + 64] = index * 4 + 65280;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient1[index + 128] = index * 262144 + 65535;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient1[index + 192] = 16777215;
        }
        this.flameGradient2 = [];
        for (let index = 0; index < 64; index++) {
            this.flameGradient2[index] = index * 4;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient2[index + 64] = index * 262144 + 255;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient2[index + 128] = index * 1024 + 16711935;
        }
        for (let index = 0; index < 64; index++) {
            this.flameGradient2[index + 192] = 16777215;
        }

        this.flameGradient = [];
        this.flameBuffer0 = [];
        this.flameBuffer1 = [];
        this.updateFlameBuffer(null);
        this.flameBuffer3 = [];
        this.flameBuffer2 = [];

        if (!this.flameActive) this.flameActive = true;

        this.showProgress(10, 'Connecting to fileserver').then(() => {
            console.log('Finished loading.')
        });
    };

    private updateTitleScreen = (): void => {
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
            // y += 15; dead code

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
    };

    private drawTitleScreen = async (): Promise<void> => {
        await this.loadTitle();
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

            // x = w / 2 - 80; dead code
            y = h / 2 + 50;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Login', 0xFFFFFF, true);

            x = w / 2 + 80;
            this.imageTitleButton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Cancel', 0xFFFFFF, true);
        } else if (this.titleScreenState == 3) {
            this.fontBold12?.drawStringTaggableCenter(w / 2, 16776960, "Create a free account", h / 2 - 60, true);

            let x = w / 2;
            let y = h / 2 - 35;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "To create a new account you need to", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "go back to the main RuneScape webpage", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "and choose the red 'create account'", 0xFFFFFF, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "button at the top right of that page.", 0xFFFFFF, true);
            // y += 15; dead code

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
    };

    private loadArchive = async (filename: string, displayName: string, crc: number, progress: number): Promise<Archive> => {
        // TODO: caching
        // TODO: download progress, retry

        await this.showProgress(progress, `Requesting ${displayName}`);
        const data: Archive = await Archive.loadUrl(`${Client.HOST}/${filename}${crc}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    };

    private setMidi = async (name: string, crc: number): Promise<void> => {
        const file: Packet = new Packet(await downloadUrl(`${Client.HOST}/${name.replaceAll(' ', '_')}_${crc}.mid`));
        playMidi(decompressBz2(file.data, true, false), 192);
    };

    private drawError = (): void => {
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.setLoopRate(1);

        if (this.errorLoading) {
            this.flameActive = false;

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
            this.flameActive = false;

            this.ctx.font = 'bold 20px helvetica, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = 'white';

            this.ctx.fillText('Error - unable to load game!', 50, 50);
            this.ctx.fillText('To play RuneScape make sure you play from', 50, 100);
            this.ctx.fillText('https://2004scape.org', 50, 150);
        }

        if (this.errorStarted) {
            this.flameActive = false;

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
    };

    private updateFlames = (): void => {
        const height = 256;

        for (let x = 10; x < 117; x++) {
            const rand = Math.trunc(Math.random() * 100.0);
            if (rand < 50) this.flameBuffer3[x + (height - 2 << 7)] = 255
        }

        for (let l = 0; l < 100; l++) {
            const x = Math.trunc(Math.random() * 124.0 + 2);
            const y = Math.trunc(Math.random() * 128.0 + 128);
            const index = x + (y << 7);
            this.flameBuffer3[index] = 192;
        }

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < 127; x++) {
                const index = x + (y << 7);
                this.flameBuffer2[index] = ((this.flameBuffer3[index - 1] + this.flameBuffer3[index + 1] + this.flameBuffer3[index - 128] + this.flameBuffer3[index + 128]) / 4) | 0;
            }
        }

        this.flameCycle0 += 128;
        if (this.flameCycle0 > 32768) {
            this.flameCycle0 -= 32768;
            const rand = Math.trunc(Math.random() * 12.0);
            this.updateFlameBuffer(this.imageRunes[rand]);
        }

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < 127; x++) {
                const index = x + (y << 7);
                let intensity = (this.flameBuffer2[index + 128] - this.flameBuffer0[index + this.flameCycle0 & 32768 - 1] / 5) | 0;
                if (intensity < 0) {
                    intensity = 0;
                }
                this.flameBuffer3[index] = intensity;
            }
        }

        for (let y = 0; y < height - 1; y++) {
            this.flameLineOffset[y] = this.flameLineOffset[y + 1];
        }

        this.flameLineOffset[height - 1] = (Math.sin(this.loopCycle / 14.0) * 16.0 + Math.sin(this.loopCycle / 15.0) * 14.0 + Math.sin(this.loopCycle / 16.0) * 12.0) | 0;

        if (this.flameGradientCycle0 > 0) {
            this.flameGradientCycle0 -= 4;
        }

        if (this.flameGradientCycle1 > 0) {
            this.flameGradientCycle1 -= 4;
        }

        if (this.flameGradientCycle0 == 0 && this.flameGradientCycle1 == 0) {
            let rand = Math.trunc(Math.random() * 2000.0);

            if (rand == 0) {
                this.flameGradientCycle0 = 1024;
            } else if (rand == 1) {
                this.flameGradientCycle1 = 1024;
            }
        }
    }

    private mix = (src: number, alpha: number, dst: number) => {
        const invAlpha = 256 - alpha;
        return (((src & 0xFF00FF) * invAlpha + (dst & 0xFF00FF) * alpha) & 0xFF00FF00) + (((src & 0xFF00) * invAlpha + (dst & 0xFF00) * alpha) & 0xFF0000) >> 8;
    }

    private drawFlames = (): void => {
        const height = 256;

        // just colors
        if (this.flameGradientCycle0 > 0) {
            for (let i = 0; i < 256; i++) {
                if (this.flameGradientCycle0 > 768) {
                    this.flameGradient[i] = this.mix(this.flameGradient0[i], 1024 - this.flameGradientCycle0, this.flameGradient1[i]);
                } else if (this.flameGradientCycle0 > 256) {
                    this.flameGradient[i] = this.flameGradient1[i];
                } else {
                    this.flameGradient[i] = this.mix(this.flameGradient1[i], 256 - this.flameGradientCycle0, this.flameGradient0[i]);
                }
            }
        } else if (this.flameGradientCycle1 > 0) {
            for (let i = 0; i < 256; i++) {
                if (this.flameGradientCycle1 > 768) {
                    this.flameGradient[i] = this.mix(this.flameGradient0[i], 1024 - this.flameGradientCycle1, this.flameGradient2[i]);
                } else if (this.flameGradientCycle1 > 256) {
                    this.flameGradient[i] = this.flameGradient2[i];
                } else {
                    this.flameGradient[i] = this.mix(this.flameGradient2[i], 256 - this.flameGradientCycle1, this.flameGradient0[i]);
                }
            }
        } else {
            for (let i = 0; i < 256; i++) {
                this.flameGradient[i] = this.flameGradient0[i];
            }
        }
        for (let i = 0; i < 33920; i++) {
            if (this.imageTitle0 && this.imageFlamesLeft)
                this.imageTitle0.pixels[i] = this.imageFlamesLeft.pixels[i];
        }

        let srcOffset = 0;
        let dstOffset = 1152;

        for (let y = 1; y < height - 1; y++) {
            const offset = (this.flameLineOffset[y] * (height - y) / height) | 0;
            let step = offset + 22;
            if (step < 0) {
                step = 0;
            }
            srcOffset += step;
            for (let x = step; x < 128; x++) {
                let value = this.flameBuffer3[srcOffset++] | 0;
                if (value == 0) {
                    dstOffset++;
                } else {
                    const alpha = value;
                    const invAlpha = 256 - value;
                    value = this.flameGradient[value];
                    if (this.imageTitle0) {
                        const background = this.imageTitle0.pixels[dstOffset];
                        this.imageTitle0.pixels[dstOffset++] = (((value & 0xFF00FF) * alpha + (background & 0xFF00FF) * invAlpha) & 0xFF00FF00) + (((value & 0xFF00) * alpha + (background & 0xFF00) * invAlpha) & 0xFF0000) >> 8;
                    }
                }
            }
            dstOffset += step;
        }

        this.imageTitle0?.draw(0, 0);

        for (let i = 0; i < 33920; i++) {
            if (this.imageTitle1 && this.imageFlamesRight) {
                this.imageTitle1.pixels[i] = this.imageFlamesRight.pixels[i];
            }
        }

        srcOffset = 0;
        dstOffset = 1176;
        for (let y = 1; y < height - 1; y++) {
            const offset = (this.flameLineOffset[y] * (height - y) / height) | 0;
            const step = 103 - offset;
            dstOffset += offset;
            for (let x = 0; x < step; x++) {
                let value = this.flameBuffer3[srcOffset++] | 0;
                if (value == 0) {
                    dstOffset++;
                } else {
                    const alpha = value;
                    const invAlpha = 256 - value;
                    value = this.flameGradient[value];
                    if (this.imageTitle1) {
                        const background = this.imageTitle1.pixels[dstOffset];
                        this.imageTitle1.pixels[dstOffset++] = (((value & 0xFF00FF) * alpha + (background & 0xFF00FF) * invAlpha) & 0xFF00FF00) + (((value & 0xFF00) * alpha + (background & 0xFF00) * invAlpha) & 0xFF0000) >> 8;
                    }
                }
            }
            srcOffset += 128 - step;
            dstOffset += 128 - step - offset;
        }

        this.imageTitle1?.draw(661, 0);
    }
}

const client = new Client();
client.run().then(() => {
});
