import SeqType from './jagex2/config/SeqType.js';
import LocType from './jagex2/config/LocType.js';
import FloType from './jagex2/config/FloType.js';
import ObjType from './jagex2/config/ObjType.js';
import NpcType from './jagex2/config/NpcType.js';
import IdkType from './jagex2/config/IdkType.js';
import SpotAnimType from './jagex2/config/SpotAnimType.js';
import VarpType from './jagex2/config/VarpType.js';
import ComType from './jagex2/config/ComType.js';

import PixMap from './jagex2/graphics/PixMap.js';
import Draw2D from './jagex2/graphics/Draw2D.js';
import Draw3D from './jagex2/graphics/Draw3D.js';
import Pix8 from './jagex2/graphics/Pix8.js';
import Pix24 from './jagex2/graphics/Pix24.js';
import PixFont from './jagex2/graphics/PixFont.js';
import Model from './jagex2/graphics/Model.js';
import SeqBase from './jagex2/graphics/SeqBase.js';
import SeqFrame from './jagex2/graphics/SeqFrame.js';

import Jagfile from './jagex2/io/Jagfile.js';

import WordFilter from './jagex2/wordenc/WordFilter.js';
import {arraycopy, decompressBz2, downloadUrl, sleep} from './jagex2/util/JsUtil.js';
import {playMidi} from './jagex2/util/AudioUtil.js';
import GameShell from './jagex2/client/GameShell.js';

import './vendor/midi.js';
import Packet from './jagex2/io/Packet.js';
import Wave from './jagex2/sound/Wave';
import JString from './jagex2/datastruct/JString';
import World3D from './jagex2/dash3d/World3D';
import ClientStream from './jagex2/io/ClientStream';

class Client extends GameShell {
    // static readonly HOST: string = 'http://localhost';
    // static readonly PORT: number = 43595;
    static readonly HOST: string = 'https://w2.225.2004scape.org';
    static readonly PORT: number = 43599;
    static readonly CHARSET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

    static EXPONENT: bigint = 58778699976184461502525193738213253649000149147835990136706041084440742975821n;
    static MODULUS: bigint = 7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789n;
    static MEMBERS: boolean = true;
    static LOW_MEMORY: boolean = false;

    private SCROLLBAR_TRACK: number = 0x23201b;
    private SCROLLBAR_GRIP_FOREGROUND: number = 0x4d4233;
    private SCROLLBAR_GRIP_HIGHLIGHT: number = 0x766654;
    private SCROLLBAR_GRIP_LOWLIGHT: number = 0x332d25;

    private alreadyStarted: boolean = false;
    private errorStarted: boolean = false;
    private errorLoading: boolean = false;
    private errorHost: boolean = false;

    private loopCycle: number = 0;
    private ingame: boolean = false;
    private archiveChecksums: number[] = [];
    private stream: ClientStream | null = null;
    private in: Packet = Packet.alloc(1);
    private out: Packet = Packet.alloc(1);
    private loginout: Packet = Packet.alloc(1);
    private serverSeed: bigint = 0n;

    // login screen properties
    private redrawTitleBackground: boolean = true;
    private titleScreenState: number = 0;
    private titleLoginField: number = 0;
    private titleArchive: Jagfile | null = null;
    private imageTitle2: PixMap | null = null;
    private imageTitle3: PixMap | null = null;
    private imageTitle4: PixMap | null = null;
    private imageTitle0: PixMap | null = null;
    private imageTitle1: PixMap | null = null;
    private imageTitle5: PixMap | null = null;
    private imageTitle6: PixMap | null = null;
    private imageTitle7: PixMap | null = null;
    private imageTitle8: PixMap | null = null;
    private imageTitlebox: Pix8 | null = null;
    private imageTitlebutton: Pix8 | null = null;
    private loginMessage0: string = '';
    private loginMessage1: string = '';
    private username: string = '';
    private password: string = '';

    // fonts
    private fontPlain11: PixFont | null = null;
    private fontPlain12: PixFont | null = null;
    private fontBold12: PixFont | null = null;
    private fontQuill8: PixFont | null = null;

    // login screen pillar flames properties
    private imageRunes: Pix8[] = [];
    private flameActive: boolean = false;
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
    private flamesInterval: NodeJS.Timeout | null = null;

    // game world properties
    private areaSidebar: PixMap | null = null;
    private areaMapback: PixMap | null = null;
    private areaViewport: PixMap | null = null;
    private areaChatback: PixMap | null = null;
    private areaBackbase1: PixMap | null = null;
    private areaBackbase2: PixMap | null = null;
    private areaBackhmid1: PixMap | null = null;
    private areaBackleft1: PixMap | null = null;
    private areaBackleft2: PixMap | null = null;
    private areaBackright1: PixMap | null = null;
    private areaBackright2: PixMap | null = null;
    private areaBacktop1: PixMap | null = null;
    private areaBacktop2: PixMap | null = null;
    private areaBackvmid1: PixMap | null = null;
    private areaBackvmid2: PixMap | null = null;
    private areaBackvmid3: PixMap | null = null;
    private areaBackhmid2: PixMap | null = null;
    private areaChatbackOffsets: Int32Array | null = null;
    private areaSidebarOffsets: Int32Array | null = null;
    private areaViewportOffsets: Int32Array | null = null;
    private compassMaskLineOffsets: Uint16Array = new Uint16Array(33);
    private compassMaskLineLengths: Uint16Array = new Uint16Array(33);
    private minimapMaskLineOffsets: Uint16Array = new Uint16Array(151);
    private minimapMaskLineLengths: Uint16Array = new Uint16Array(151);

    private imageInvback: Pix8 | null = null;
    private imageChatback: Pix8 | null = null;
    private imageMapback: Pix8 | null = null;
    private imageBackbase1: Pix8 | null = null;
    private imageBackbase2: Pix8 | null = null;
    private imageBackhmid1: Pix8 | null = null;
    private imageSideicons: Pix8[] = [];
    private imageCompass: Pix24 | null = null;
    private imageMapscene: Pix8[] = [];
    private imageMapfunction: Pix24[] = [];
    private imageHitmarks: Pix24[] = [];
    private imageHeadicons: Pix24[] = [];
    private imageMapflag: Pix24 | null = null;
    private imageCrosses: Pix24[] = [];
    private imageMapdot0: Pix24 | null = null;
    private imageMapdot1: Pix24 | null = null;
    private imageMapdot2: Pix24 | null = null;
    private imageMapdot3: Pix24 | null = null;
    private imageScrollbar0: Pix8 | null = null;
    private imageScrollbar1: Pix8 | null = null;
    private imageRedstone1: Pix8 | null = null;
    private imageRedstone2: Pix8 | null = null;
    private imageRedstone3: Pix8 | null = null;
    private imageRedstone1h: Pix8 | null = null;
    private imageRedstone2h: Pix8 | null = null;
    private imageRedstone1v: Pix8 | null = null;
    private imageRedstone2v: Pix8 | null = null;
    private imageRedstone3v: Pix8 | null = null;
    private imageRedstone1hv: Pix8 | null = null;
    private imageRedstone2hv: Pix8 | null = null;

    private redrawSidebar: boolean = false;
    private redrawChatback: boolean = false;
    private redrawSideicons: boolean = false;
    private redrawPrivacySettings: boolean = false;
    private dragCycles: number = 0;
    private sceneState: number = 0;
    private sceneDelta: number = 0;
    private menuVisible: boolean = false;
    private menuArea: number = 0;
    private menuX: number = 0;
    private menuY: number = 0;
    private menuWidth: number = 0;
    private menuHeight: number = 0;
    private menuSize: number = 0;
    private menuOption: string[] = [];
    private sidebarInterfaceId: number = -1;
    private chatInterfaceId: number = -1;
    private chatInterface: ComType = new ComType();
    private chatScrollHeight: number = 78;
    private chatScrollOffset: number = 0;
    private modalMessage: string | null = null;
    private flashingTab: number = -1;
    private selectedTab: number = 3;
    private tabInterfaceId: number[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    private publicChatSetting: number = 0;
    private privateChatSetting: number = 0;
    private tradeChatSetting: number = 0;
    private scrollGrabbed: boolean = false;
    private scrollInputPadding: number = 0;
    private showSocialInput: boolean = false;
    private socialMessage: string = '';
    private socialInput: string = '';
    private chatbackInput: string = '';
    private chatbackInputOpen: boolean = false;
    private stickyChatInterfaceId: number = -1;
    private messageText: string[] = [];
    private messageSender: string[] = [];
    private messageType: number[] = [];
    private splitPrivateChat: number = 0;
    private chatTyped: string = '';
    private viewportHoveredInterfaceIndex: number = 0;
    private sidebarHoveredInterfaceIndex: number = 0;
    private chatHoveredInterfaceIndex: number = 0;
    private objDragInterfaceId: number = 0;
    private objDragSlot: number = 0;
    private objDragArea: number = 0;
    private objGrabX: number = 0;
    private objGrabY: number = 0;
    private objDragCycles: number = 0;
    private selectedArea: number = 0;
    private selectedItem: number = 0;
    private selectedInterface: number = 0;
    private selectedCycle: number = 0;
    private pressedContinueOption: boolean = false;
    private awaitingLogin: boolean = false;

    runFlames = (): void => {
        if (!this.flameActive) {
            return;
        }
        this.updateFlames();
        this.updateFlames();
        this.drawFlames();
    };

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

            this.fontPlain11 = PixFont.fromArchive(this.titleArchive, 'p11');
            this.fontPlain12 = PixFont.fromArchive(this.titleArchive, 'p12');
            this.fontBold12 = PixFont.fromArchive(this.titleArchive, 'b12');
            this.fontQuill8 = PixFont.fromArchive(this.titleArchive, 'q8');

            await this.loadTitleBackground();
            this.loadTitleImages();

            const config = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            const interfaces = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            const media = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            const models = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            const textures = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            const wordenc = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            const sounds = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

            await this.showProgress(75, 'Unpacking media');
            this.imageInvback = Pix8.fromArchive(media, 'invback', 0);
            this.imageChatback = Pix8.fromArchive(media, 'chatback', 0);
            this.imageMapback = Pix8.fromArchive(media, 'mapback', 0);
            this.imageBackbase1 = Pix8.fromArchive(media, 'backbase1', 0);
            this.imageBackbase2 = Pix8.fromArchive(media, 'backbase2', 0);
            this.imageBackhmid1 = Pix8.fromArchive(media, 'backhmid1', 0);
            for (let i = 0; i < 13; i++) {
                this.imageSideicons[i] = Pix8.fromArchive(media, 'sideicons', i);
            }
            this.imageCompass = Pix24.fromArchive(media, 'compass', 0);

            try {
                for (let i = 0; i < 50; i++) {
                    this.imageMapscene[i] = Pix8.fromArchive(media, 'mapscene', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i = 0; i < 50; i++) {
                    this.imageMapfunction[i] = Pix24.fromArchive(media, 'mapfunction', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i = 0; i < 20; i++) {
                    this.imageHitmarks[i] = Pix24.fromArchive(media, 'hitmarks', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i = 0; i < 20; i++) {
                    this.imageHeadicons[i] = Pix24.fromArchive(media, 'headicons', i);
                }
            } catch (e) {
                /* empty */
            }

            this.imageMapflag = Pix24.fromArchive(media, 'mapflag', 0);
            for (let i = 0; i < 8; i++) {
                this.imageCrosses[i] = Pix24.fromArchive(media, 'cross', i);
            }
            this.imageMapdot0 = Pix24.fromArchive(media, 'mapdots', 0);
            this.imageMapdot1 = Pix24.fromArchive(media, 'mapdots', 1);
            this.imageMapdot2 = Pix24.fromArchive(media, 'mapdots', 2);
            this.imageMapdot3 = Pix24.fromArchive(media, 'mapdots', 3);
            this.imageScrollbar0 = Pix8.fromArchive(media, 'scrollbar', 0);
            this.imageScrollbar1 = Pix8.fromArchive(media, 'scrollbar', 1);
            this.imageRedstone1 = Pix8.fromArchive(media, 'redstone1', 0);
            this.imageRedstone2 = Pix8.fromArchive(media, 'redstone2', 0);
            this.imageRedstone3 = Pix8.fromArchive(media, 'redstone3', 0);
            this.imageRedstone1h = Pix8.fromArchive(media, 'redstone1', 0);
            this.imageRedstone1h?.flipHorizontally();
            this.imageRedstone2h = Pix8.fromArchive(media, 'redstone2', 0);
            this.imageRedstone2h?.flipHorizontally();
            this.imageRedstone1v = Pix8.fromArchive(media, 'redstone1', 0);
            this.imageRedstone1v?.flipVertically();
            this.imageRedstone2v = Pix8.fromArchive(media, 'redstone2', 0);
            this.imageRedstone2v?.flipVertically();
            this.imageRedstone3v = Pix8.fromArchive(media, 'redstone3', 0);
            this.imageRedstone3v?.flipVertically();
            this.imageRedstone1hv = Pix8.fromArchive(media, 'redstone1', 0);
            this.imageRedstone1hv?.flipHorizontally();
            this.imageRedstone1hv?.flipVertically();
            this.imageRedstone2hv = Pix8.fromArchive(media, 'redstone2', 0);
            this.imageRedstone2hv?.flipHorizontally();
            this.imageRedstone2hv?.flipVertically();
            const canvas = this.canvas;
            const backleft1 = Pix24.fromArchive(media, 'backleft1', 0);
            this.areaBackleft1 = new PixMap(canvas, backleft1.width, backleft1.height);
            backleft1.blitOpaque(0, 0);
            const backleft2 = Pix24.fromArchive(media, 'backleft2', 0);
            this.areaBackleft2 = new PixMap(canvas, backleft2.width, backleft2.height);
            backleft2.blitOpaque(0, 0);
            const backright1 = Pix24.fromArchive(media, 'backright1', 0);
            this.areaBackright1 = new PixMap(canvas, backright1.width, backright1.height);
            backright1.blitOpaque(0, 0);
            const backright2 = Pix24.fromArchive(media, 'backright2', 0);
            this.areaBackright2 = new PixMap(canvas, backright2.width, backright2.height);
            backright2.blitOpaque(0, 0);
            const backtop1 = Pix24.fromArchive(media, 'backtop1', 0);
            this.areaBacktop1 = new PixMap(canvas, backtop1.width, backtop1.height);
            backtop1.blitOpaque(0, 0);
            const backtop2 = Pix24.fromArchive(media, 'backtop2', 0);
            this.areaBacktop2 = new PixMap(canvas, backtop2.width, backtop2.height);
            backtop2.blitOpaque(0, 0);
            const backvmid1 = Pix24.fromArchive(media, 'backvmid1', 0);
            this.areaBackvmid1 = new PixMap(canvas, backvmid1.width, backvmid1.height);
            backvmid1.blitOpaque(0, 0);
            const backvmid2 = Pix24.fromArchive(media, 'backvmid2', 0);
            this.areaBackvmid2 = new PixMap(canvas, backvmid2.width, backvmid2.height);
            backvmid2.blitOpaque(0, 0);
            const backvmid3 = Pix24.fromArchive(media, 'backvmid3', 0);
            this.areaBackvmid3 = new PixMap(canvas, backvmid3.width, backvmid3.height);
            backvmid3.blitOpaque(0, 0);
            const backhmid2 = Pix24.fromArchive(media, 'backhmid2', 0);
            this.areaBackhmid2 = new PixMap(canvas, backhmid2.width, backhmid2.height);
            backhmid2.blitOpaque(0, 0);

            const randR = Math.trunc(Math.random() * 21.0) - 10;
            const randG = Math.trunc(Math.random() * 21.0) - 10;
            const randB = Math.trunc(Math.random() * 21.0) - 10;
            const rand = Math.trunc(Math.random() * 41.0) - 20;
            for (let i = 0; i < 50; i++) {
                if (this.imageMapfunction[i] != null) {
                    this.imageMapfunction[i].translate(randR + rand, randG + rand, randB + rand);
                }

                if (this.imageMapscene[i] != null) {
                    this.imageMapscene[i].translate(randR + rand, randG + rand, randB + rand);
                }
            }

            await this.showProgress(80, 'Unpacking textures');
            Draw3D.unpackTextures(textures);
            Draw3D.setBrightness(0.8);
            Draw3D.initPool(20);

            await this.showProgress(83, 'Unpacking models');
            Model.unpack(models);
            SeqBase.unpack(models);
            SeqFrame.unpack(models);

            await this.showProgress(86, 'Unpacking config');
            SeqType.unpack(config);
            LocType.unpack(config);
            FloType.unpack(config);
            ObjType.unpack(config, Client.MEMBERS);
            NpcType.unpack(config);
            IdkType.unpack(config);
            SpotAnimType.unpack(config);
            VarpType.unpack(config);

            if (!Client.LOW_MEMORY) {
                await this.showProgress(90, 'Unpacking sounds');
                Wave.unpack(sounds);
            }

            await this.showProgress(92, 'Unpacking interfaces');
            ComType.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.showProgress(97, 'Preparing game engine');
            for (let y = 0; y < 33; y++) {
                let left = 999;
                let right = 0;
                for (let x = 0; x < 35; x++) {
                    if (this.imageMapback.pixels[x + y * this.imageMapback.width] == 0) {
                        if (left == 999) {
                            left = x;
                        }
                    } else if (left != 999) {
                        right = x;
                        break;
                    }
                }
                this.compassMaskLineOffsets[y] = left;
                this.compassMaskLineLengths[y] = right - left;
            }

            for (let y = 9; y < 160; y++) {
                let left = 999;
                let right = 0;
                for (let x = 10; x < 168; x++) {
                    if (this.imageMapback.pixels[x + y * this.imageMapback.width] == 0 && (x > 34 || y > 34)) {
                        if (left == 999) {
                            left = x;
                        }
                    } else if (left != 999) {
                        right = x;
                        break;
                    }
                }
                this.minimapMaskLineOffsets[y - 9] = left - 21;
                this.minimapMaskLineLengths[y - 9] = right - left;
            }

            Draw3D.init3D(479, 96);
            this.areaChatbackOffsets = Draw3D.lineOffset;
            Draw3D.init3D(190, 261);
            this.areaSidebarOffsets = Draw3D.lineOffset;
            Draw3D.init3D(512, 334);
            this.areaViewportOffsets = Draw3D.lineOffset;

            const distance: Int32Array = new Int32Array(9);
            for (let x = 0; x < 9; x++) {
                const angle = x * 32 + 128 + 15;
                const offset = angle * 3 + 600;
                const sin = Draw3D.sin[angle];
                distance[x] = (offset * sin) >> 16;
            }

            World3D.init(512, 334, 500, 800, distance);
            WordFilter.unpack(wordenc);
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
            this.updateGame();
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
            this.drawGame();
        } else {
            await this.drawTitleScreen();
        }
        this.dragCycles = 0;
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

        const x = 360;
        const y = 200;

        const offsetY = 20;
        this.fontBold12?.drawStringCenter(x / 2, y / 2 - offsetY - 26, 'RuneScape is loading - please wait...', 0xffffff);
        const midY = y / 2 - 18 - offsetY;

        Draw2D.drawRect(x / 2 - 152, midY, 304, 34, 0x8c1111);
        Draw2D.drawRect(x / 2 - 151, midY + 1, 302, 32, 0x000000);
        Draw2D.fillRect(x / 2 - 150, midY + 2, progress * 3, 30, 0x8c1111);
        Draw2D.fillRect(x / 2 - 150 + progress * 3, midY + 2, 300 - progress * 3, 30, 0x000000);

        this.fontBold12?.drawStringCenter(x / 2, y / 2 + 5 - offsetY, str, 0xffffff);
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
        logo.draw(this.width / 2 - logo.width / 2 - 128, 18);
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
    };

    private loadTitleImages = (): void => {
        if (!this.titleArchive) {
            return;
        }
        this.imageTitlebox = Pix8.fromArchive(this.titleArchive, 'titlebox');
        this.imageTitlebutton = Pix8.fromArchive(this.titleArchive, 'titlebutton');
        for (let i = 0; i < 12; i++) {
            this.imageRunes[i] = Pix8.fromArchive(this.titleArchive, 'runes', i);
        }
        this.imageFlamesLeft = new Pix24(128, 265);
        this.imageFlamesRight = new Pix24(128, 265);

        if (this.imageTitle0) arraycopy(this.imageTitle0.pixels, 0, this.imageFlamesLeft.pixels, 0, 33920);
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

        this.showProgress(10, 'Connecting to fileserver').then(() => {
            if (!this.flameActive) {
                this.flameActive = true;
                this.flamesInterval = setInterval(this.runFlames, 35);
            }
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
                if (!this.awaitingLogin) {
                    this.awaitingLogin = true; // this is custom from java client because javascript
                    this.login(this.username, this.password, false).then((): void => {
                        this.awaitingLogin = false;
                    });
                }
            }

            buttonX = this.width / 2 + 80;
            if (this.mouseClickButton == 1 && this.mouseClickX >= buttonX - 75 && this.mouseClickX <= buttonX + 75 && this.mouseClickY >= buttonY - 20 && this.mouseClickY <= buttonY + 20) {
                this.titleScreenState = 0;
                this.username = '';
                this.password = '';
            }

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const key = this.pollKey();
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
            const x = this.width / 2;
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
        this.imageTitlebox?.draw(0, 0);

        const w = 360;
        const h = 200;

        if (this.titleScreenState === 0) {
            let x = w / 2;
            let y = h / 2 - 20;
            this.fontBold12?.drawStringTaggableCenter(x, y, 'Welcome to RuneScape', 0xffffff00, true);

            x = w / 2 - 80;
            y = h / 2 + 20;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'New user', 0xffffffff, true);

            x = w / 2 + 80;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Existing User', 0xffffffff, true);
        } else if (this.titleScreenState === 2) {
            let x = w / 2 - 80;
            let y = h / 2 - 40;
            if (this.loginMessage0.length > 0) {
                this.fontBold12?.drawStringTaggableCenter(w / 2, y - 15, this.loginMessage0, 0xffff00, true);
                this.fontBold12?.drawStringTaggableCenter(w / 2, y, this.loginMessage1, 0xffff00, true);
                y += 30;
            } else {
                this.fontBold12?.drawStringTaggableCenter(w / 2, y - 7, this.loginMessage1, 0xffff00, true);
                y += 30;
            }

            this.fontBold12?.drawStringTaggable(w / 2 - 90, y, `Username: ${this.username}${this.titleLoginField == 0 && this.loopCycle % 40 < 20 ? '@yel@|' : ''}`, 0xffffff, true);
            y += 15;

            this.fontBold12?.drawStringTaggable(w / 2 - 88, y, `Password: ${JString.toAsterisks(this.password)}${this.titleLoginField == 1 && this.loopCycle % 40 < 20 ? '@yel@|' : ''}`, 0xffffff, true);

            // x = w / 2 - 80; dead code
            y = h / 2 + 50;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Login', 0xffffff, true);

            x = w / 2 + 80;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Cancel', 0xffffff, true);
        } else if (this.titleScreenState == 3) {
            this.fontBold12?.drawStringTaggableCenter(w / 2, 16776960, 'Create a free account', h / 2 - 60, true);

            const x = w / 2;
            let y = h / 2 - 35;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, 'To create a new account you need to', 0xffffff, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, 'go back to the main RuneScape webpage', 0xffffff, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, "and choose the red 'create account'", 0xffffff, true);
            y += 15;

            this.fontBold12?.drawStringTaggableCenter(w / 2, y, 'button at the top right of that page.', 0xffffff, true);
            // y += 15; dead code

            y = h / 2 + 50;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Cancel', 16777215, true);
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

    private login = async (username: string, password: string, reconnect: boolean): Promise<void> => {
        try {
            if (!reconnect) {
                this.loginMessage0 = '';
                this.loginMessage1 = 'Connecting to server...';
                await this.drawTitleScreen();
            }
            this.stream = new ClientStream(await ClientStream.openSocket({host: Client.HOST, port: Client.PORT}));
            await this.stream?.readBytes(this.in.data, 0, 8);
            this.in.pos = 0;
            this.serverSeed = this.in.g8;
            const seed: Int32Array = new Int32Array([Math.floor(Math.random() * 99999999), Math.floor(Math.random() * 99999999), Number(this.serverSeed >> BigInt(32)), Number(this.serverSeed & BigInt(0xffffffff))]);
            this.out.pos = 0;
            this.out.p1(10);
            this.out.p4(seed[0]);
            this.out.p4(seed[1]);
            this.out.p4(seed[2]);
            this.out.p4(seed[3]);
            this.out.p4(0); // TODO signlink UUID
            this.out.pjstr(username);
            this.out.pjstr(password);
            this.out.rsaenc(Client.MODULUS, Client.EXPONENT);
            this.loginout.pos = 0;
            if (reconnect) {
                this.loginout.p1(18);
            } else {
                this.loginout.p1(16);
            }
            this.loginout.p1(this.out.pos + 36 + 1 + 1);
            this.loginout.p1(225);
            this.loginout.p1(Client.LOW_MEMORY ? 1 : 0);
            for (let i = 0; i < 9; i++) {
                this.loginout.p4(this.archiveChecksums[i]);
            }
            this.loginout.pdata(this.out.data, this.out.pos, 0);
            this.stream.write(this.loginout.data, this.loginout.pos, 0);
            const reply = await this.stream.read();
            console.log(`Login reply was: ${reply}`);

            if (reply === 1) {
                await sleep(2000);
                await this.login(username, password, reconnect);
                return;
            }
            if (reply === 2 || reply === 18) {
                // TODO
                // this.rights = reply == 18;
                // InputTracking.setDisabled();
                this.ingame = true;
                this.out.pos = 0;
                this.in.pos = 0;
                // this.packetType = -1;
                // this.lastPacketType0 = -1;
                // this.lastPacketType1 = -1;
                // this.lastPacketType2 = -1;
                // this.packetSize = 0;
                // this.idleNetCycles = 0;
                // this.systemUpdateTimer = 0;
                // this.idleTimeout = 0;
                // this.hintType = 0;
                this.menuSize = 0;
                this.menuVisible = false;
                this.idleCycles = 0;
                this.messageText = [];
                // this.objSelected = 0;
                // this.spellSelected = 0;
                this.sceneState = 0;
                // this.waveCount = 0;
                // this.cameraAnticheatOffsetX = (int) (Math.random() * 100.0D) - 50;
                // this.cameraAnticheatOffsetZ = (int) (Math.random() * 110.0D) - 55;
                // this.cameraAnticheatAngle = (int) (Math.random() * 80.0D) - 40;
                // this.minimapAnticheatAngle = (int) (Math.random() * 120.0D) - 60;
                // this.minimapZoom = (int) (Math.random() * 30.0D) - 20;
                // this.orbitCameraYaw = (int) (Math.random() * 20.0D) - 10 & 0x7FF;
                // this.minimapLevel = -1;
                // this.flagSceneTileX = 0;
                // this.flagSceneTileZ = 0;
                // this.playerCount = 0;
                // this.npcCount = 0;
                // for (let i = 0; i < this.MAX_PLAYER_COUNT; i++) {
                //     this.players[i] = null;
                //     this.playerAppearanceBuffer[i] = null;
                // }
                // for (let i = 0; i < 8192; i++) {
                //     this.npcs[i] = null;
                // }
                // this.localPlayer = this.players[this.LOCAL_PLAYER_INDEX] = new PlayerEntity();
                // this.projectiles.clear();
                // this.spotanims.clear();
                // this.temporaryLocs.clear();
                // for (let level = 0; level < 4; level++) {
                //     for (let x = 0; x < 104; x++) {
                //         for (let z = 0; z < 104; z++) {
                //             this.levelObjStacks[level][x][z] = null;
                //         }
                //     }
                // }
                // this.spawnedLocations = new LinkList();
                // this.friendCount = 0;
                this.stickyChatInterfaceId = -1;
                this.chatInterfaceId = -1;
                // this.viewportInterfaceID = -1;
                this.sidebarInterfaceId = -1;
                this.pressedContinueOption = false;
                this.selectedTab = 3;
                this.chatbackInputOpen = false;
                this.menuVisible = false;
                this.showSocialInput = false;
                this.modalMessage = null;
                // this.inMultizone = 0;
                this.flashingTab = -1;
                // this.designGenderMale = true;
                // this.validateCharacterDesign();
                // for (let i = 0; i < 5; i++) {
                //     this.designColors[i] = 0;
                // }
                // opLoc4Counter = 0;
                // opNpc3Counter = 0;
                // opHeld4Counter = 0;
                // opNpc5Counter = 0;
                // opHeld1Counter = 0;
                // opLoc5Counter = 0;
                // ifButton5Counter = 0;
                // opPlayer2Counter = 0;
                // opHeld9Counter = 0;
                this.prepareGameScreen();
                return;
            }
            if (reply == 3) {
                this.loginMessage0 = '';
                this.loginMessage1 = 'Invalid username or password.';
                return;
            }
            if (reply == 4) {
                this.loginMessage0 = 'Your account has been disabled.';
                this.loginMessage1 = 'Please check your message-centre for details.';
                return;
            }
            if (reply == 5) {
                this.loginMessage0 = 'Your account is already logged in.';
                this.loginMessage1 = 'Try again in 60 secs...';
                return;
            }
            if (reply == 6) {
                this.loginMessage0 = 'RuneScape has been updated!';
                this.loginMessage1 = 'Please reload this page.';
                return;
            }
            if (reply == 7) {
                this.loginMessage0 = 'This world is full.';
                this.loginMessage1 = 'Please use a different world.';
                return;
            }
            if (reply == 8) {
                this.loginMessage0 = 'Unable to connect.';
                this.loginMessage1 = 'Login server offline.';
                return;
            }
            if (reply == 9) {
                this.loginMessage0 = 'Login limit exceeded.';
                this.loginMessage1 = 'Too many connections from your address.';
                return;
            }
            if (reply == 10) {
                this.loginMessage0 = 'Unable to connect.';
                this.loginMessage1 = 'Bad session id.';
                return;
            }
            if (reply == 11) {
                this.loginMessage1 = 'Login server rejected session.';
                this.loginMessage1 = 'Please try again.';
                return;
            }
            if (reply == 12) {
                this.loginMessage0 = 'You need a members account to login to this world.';
                this.loginMessage1 = 'Please subscribe, or use a different world.';
                return;
            }
            if (reply == 13) {
                this.loginMessage0 = 'Could not complete login.';
                this.loginMessage1 = 'Please try using a different world.';
                return;
            }
            if (reply == 14) {
                this.loginMessage0 = 'The server is being updated.';
                this.loginMessage1 = 'Please wait 1 minute and try again.';
                return;
            }
            if (reply == 15) {
                this.ingame = true;
                this.out.pos = 0;
                this.in.pos = 0;
                // TODO
                // this.packetType = -1;
                // this.lastPacketType0 = -1;
                // this.lastPacketType1 = -1;
                // this.lastPacketType2 = -1;
                // this.packetSize = 0;
                // this.idleNetCycles = 0;
                // this.systemUpdateTimer = 0;
                this.menuSize = 0;
                this.menuVisible = false;
                return;
            }
            if (reply == 16) {
                this.loginMessage0 = 'Login attempts exceeded.';
                this.loginMessage1 = 'Please wait 1 minute and try again.';
                return;
            }
            if (reply == 17) {
                this.loginMessage0 = 'You are standing in a members-only area.';
                this.loginMessage1 = 'To play on this world move to a free area first';
            }
        } catch (err) {
            console.log(err);
            this.loginMessage0 = '';
            this.loginMessage1 = 'Error connecting to server.';
        }
    };

    private updateGame = (): void => {
        if (this.ingame) {
            // TODO
            this.sceneDelta++;
            if (this.mouseButton == 1 || this.mouseClickButton == 1) {
                this.dragCycles++;
            }
        }
    };

    private drawGame = (): void => {
        if (this.redrawTitleBackground) {
            this.redrawTitleBackground = false;
            this.areaBackleft1?.draw(0, 11);
            this.areaBackleft2?.draw(0, 375);
            this.areaBackright1?.draw(729, 5);
            this.areaBackright2?.draw(752, 231);
            this.areaBacktop1?.draw(0, 0);
            this.areaBacktop2?.draw(561, 0);
            this.areaBackvmid1?.draw(520, 11);
            this.areaBackvmid2?.draw(520, 231);
            this.areaBackvmid3?.draw(501, 375);
            this.areaBackhmid2?.draw(0, 345);
            this.redrawSidebar = true;
            this.redrawChatback = true;
            this.redrawSideicons = true;
            this.redrawPrivacySettings = true;
            if (this.sceneState != 2) {
                this.areaViewport?.draw(8, 11);
                this.areaMapback?.draw(561, 5);
            }
        }
        if (this.sceneState == 2) {
            this.drawScene();
        }
        if (this.menuVisible && this.menuArea == 1) {
            this.redrawSidebar = true;
        }
        let redraw = false;
        if (this.sidebarInterfaceId != -1) {
            redraw = this.updateInterfaceAnimation(this.sidebarInterfaceId, this.sceneDelta);
            if (redraw) {
                this.redrawSidebar = true;
            }
        }
        if (this.selectedArea == 2) {
            this.redrawSidebar = true;
        }
        if (this.objDragArea == 2) {
            this.redrawSidebar = true;
        }
        if (this.redrawSidebar) {
            this.drawSidebar();
            this.redrawSidebar = false;
        }
        if (this.chatInterfaceId == -1) {
            this.chatInterface.scrollPosition = this.chatScrollHeight - this.chatScrollOffset - 77;
            if (this.mouseX > 453 && this.mouseX < 565 && this.mouseY > 350) {
                this.handleScrollInput(this.mouseX - 22, this.mouseY - 375, this.chatScrollHeight, 77, false, 463, 0, this.chatInterface);
            }

            let offset = this.chatScrollHeight - this.chatInterface.scrollPosition - 77;
            if (offset < 0) {
                offset = 0;
            }

            if (offset > this.chatScrollHeight - 77) {
                offset = this.chatScrollHeight - 77;
            }

            if (this.chatScrollOffset != offset) {
                this.chatScrollOffset = offset;
                this.redrawChatback = true;
            }
        }

        if (this.chatInterfaceId != -1) {
            redraw = this.updateInterfaceAnimation(this.chatInterfaceId, this.sceneDelta);
            if (redraw) {
                this.redrawChatback = true;
            }
        }

        if (this.selectedArea == 3) {
            this.redrawChatback = true;
        }

        if (this.objDragArea == 3) {
            this.redrawChatback = true;
        }

        if (this.modalMessage != null) {
            this.redrawChatback = true;
        }

        if (this.menuVisible && this.menuArea == 2) {
            this.redrawChatback = true;
        }

        if (this.redrawChatback) {
            this.drawChatback();
            this.redrawChatback = false;
        }

        if (this.sceneState == 2) {
            this.drawMinimap();
            this.areaMapback?.draw(561, 5);
        }

        if (this.flashingTab != -1) {
            this.redrawSideicons = true;
        }

        if (this.redrawSideicons) {
            /*if (this.flashingTab != -1 && this.flashingTab == this.selectedTab) {
                this.flashingTab = -1;
                this.out.p1isaac(175);
                this.out.p1(this.selectedTab);
            }*/

            this.redrawSideicons = false;
            this.areaBackhmid1?.bind();
            this.imageBackhmid1?.draw(0, 0);

            if (this.sidebarInterfaceId == -1) {
                if (this.tabInterfaceId[this.selectedTab] != -1) {
                    if (this.selectedTab == 0) {
                        this.imageRedstone1?.draw(29, 30);
                    } else if (this.selectedTab == 1) {
                        this.imageRedstone2?.draw(59, 29);
                    } else if (this.selectedTab == 2) {
                        this.imageRedstone2?.draw(87, 29);
                    } else if (this.selectedTab == 3) {
                        this.imageRedstone3?.draw(115, 29);
                    } else if (this.selectedTab == 4) {
                        this.imageRedstone2h?.draw(156, 29);
                    } else if (this.selectedTab == 5) {
                        this.imageRedstone2h?.draw(184, 29);
                    } else if (this.selectedTab == 6) {
                        this.imageRedstone1h?.draw(212, 30);
                    }
                }

                if (this.tabInterfaceId[0] != -1 && (this.flashingTab != 0 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[0].draw(35, 34);
                }

                if (this.tabInterfaceId[1] != -1 && (this.flashingTab != 1 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[1].draw(59, 32);
                }

                if (this.tabInterfaceId[2] != -1 && (this.flashingTab != 2 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[2].draw(86, 32);
                }

                if (this.tabInterfaceId[3] != -1 && (this.flashingTab != 3 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[3].draw(121, 33);
                }

                if (this.tabInterfaceId[4] != -1 && (this.flashingTab != 4 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[4].draw(157, 34);
                }

                if (this.tabInterfaceId[5] != -1 && (this.flashingTab != 5 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[5].draw(185, 32);
                }

                if (this.tabInterfaceId[6] != -1 && (this.flashingTab != 6 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[6].draw(212, 34);
                }
            }

            this.areaBackhmid1?.draw(520, 165);
            this.areaBackbase2?.bind();
            this.imageBackbase2?.draw(0, 0);

            if (this.sidebarInterfaceId == -1) {
                if (this.tabInterfaceId[this.selectedTab] != -1) {
                    if (this.selectedTab == 7) {
                        this.imageRedstone1v?.draw(49, 0);
                    } else if (this.selectedTab == 8) {
                        this.imageRedstone2v?.draw(81, 0);
                    } else if (this.selectedTab == 9) {
                        this.imageRedstone2v?.draw(108, 0);
                    } else if (this.selectedTab == 10) {
                        this.imageRedstone3v?.draw(136, 1);
                    } else if (this.selectedTab == 11) {
                        this.imageRedstone2hv?.draw(178, 0);
                    } else if (this.selectedTab == 12) {
                        this.imageRedstone2hv?.draw(205, 0);
                    } else if (this.selectedTab == 13) {
                        this.imageRedstone1hv?.draw(233, 0);
                    }
                }

                if (this.tabInterfaceId[8] != -1 && (this.flashingTab != 8 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[7].draw(80, 2);
                }

                if (this.tabInterfaceId[9] != -1 && (this.flashingTab != 9 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[8].draw(107, 3);
                }

                if (this.tabInterfaceId[10] != -1 && (this.flashingTab != 10 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[9].draw(142, 4);
                }

                if (this.tabInterfaceId[11] != -1 && (this.flashingTab != 11 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[10].draw(179, 2);
                }

                if (this.tabInterfaceId[12] != -1 && (this.flashingTab != 12 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[11].draw(206, 2);
                }

                if (this.tabInterfaceId[13] != -1 && (this.flashingTab != 13 || this.loopCycle % 20 < 10)) {
                    this.imageSideicons[12].draw(230, 2);
                }
            }
            this.areaBackbase2?.draw(501, 492);
            this.areaViewport?.bind();
        }

        if (this.redrawPrivacySettings) {
            this.redrawPrivacySettings = false;
            this.areaBackbase1?.bind();
            this.imageBackbase1?.draw(0, 0);

            this.fontPlain12?.drawStringTaggableCenter(57, 33, 'Public chat', 16777215, true);
            if (this.publicChatSetting == 0) {
                this.fontPlain12?.drawStringTaggableCenter(57, 46, 'On', 65280, true);
            }
            if (this.publicChatSetting == 1) {
                this.fontPlain12?.drawStringTaggableCenter(57, 46, 'Friends', 16776960, true);
            }
            if (this.publicChatSetting == 2) {
                this.fontPlain12?.drawStringTaggableCenter(57, 46, 'Off', 16711680, true);
            }
            if (this.publicChatSetting == 3) {
                this.fontPlain12?.drawStringTaggableCenter(57, 46, 'Hide', 65535, true);
            }

            this.fontPlain12?.drawStringTaggableCenter(186, 33, 'Private chat', 16777215, true);
            if (this.privateChatSetting == 0) {
                this.fontPlain12?.drawStringTaggableCenter(186, 46, 'On', 65280, true);
            }
            if (this.privateChatSetting == 1) {
                this.fontPlain12?.drawStringTaggableCenter(186, 46, 'Friends', 16776960, true);
            }
            if (this.privateChatSetting == 2) {
                this.fontPlain12?.drawStringTaggableCenter(186, 46, 'Off', 16711680, true);
            }

            this.fontPlain12?.drawStringTaggableCenter(326, 33, 'Trade/duel', 16777215, true);
            if (this.tradeChatSetting == 0) {
                this.fontPlain12?.drawStringTaggableCenter(326, 46, 'On', 65280, true);
            }
            if (this.tradeChatSetting == 1) {
                this.fontPlain12?.drawStringTaggableCenter(326, 46, 'Friends', 16776960, true);
            }
            if (this.tradeChatSetting == 2) {
                this.fontPlain12?.drawStringTaggableCenter(326, 46, 'Off', 16711680, true);
            }

            this.fontPlain12?.drawStringTaggableCenter(462, 38, 'Report abuse', 16777215, true);
            this.areaBackbase1?.draw(0, 471);
            this.areaViewport?.bind();
        }

        this.sceneDelta = 0;
    };

    private drawScene = (): void => {
        // TODO
    };

    private drawSidebar = (): void => {
        // TODO
    };

    private drawChatback = (): void => {
        this.areaChatback?.bind();
        if (this.areaChatbackOffsets) {
            Draw3D.lineOffset = this.areaChatbackOffsets;
        }
        this.imageChatback?.draw(0, 0);
        if (this.showSocialInput) {
            this.fontBold12?.drawStringCenter(239, 40, this.socialMessage, 0);
            this.fontBold12?.drawStringCenter(239, 60, this.socialInput + '*', 128);
        } else if (this.chatbackInputOpen) {
            this.fontBold12?.drawStringCenter(239, 40, 'Enter amount:', 0);
            this.fontBold12?.drawStringCenter(239, 60, this.chatbackInput + '*', 128);
        } else if (this.modalMessage != null) {
            this.fontBold12?.drawStringCenter(239, 40, this.modalMessage, 0);
            this.fontBold12?.drawStringCenter(239, 60, 'Click to continue', 128);
        } else if (this.chatInterfaceId != -1) {
            this.drawInterface(ComType.instances[this.chatInterfaceId], 0, 0, 0);
        } else if (this.stickyChatInterfaceId == -1) {
            const font = this.fontPlain12;
            let line = 0;
            Draw2D.setBounds(77, 463, 0, 0);
            for (let i = 0; i < 100; i++) {
                if (this.messageText[i] != null) {
                    const type = this.messageType[i];
                    const offset = this.chatScrollOffset + 70 - line * 14;
                    if (type === 0) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageText[i], 0);
                        }
                        line++;
                    }
                    if (type === 1) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageSender[i] + ':', 16777215);
                            font?.drawString(font.stringWidth(this.messageSender[i]) + 12, offset, this.messageText[i], 255);
                        }
                        line++;
                    }
                    if (type === 2 && (this.publicChatSetting == 0 || (this.publicChatSetting == 1 && this.isFriend(this.messageSender[i])))) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageSender[i] + ':', 0);
                            font?.drawString(font.stringWidth(this.messageSender[i]) + 12, offset, this.messageText[i], 255);
                        }
                        line++;
                    }
                    if ((type === 3 || type === 7) && this.splitPrivateChat == 0 && (type == 7 || this.privateChatSetting == 0 || (this.privateChatSetting == 1 && this.isFriend(this.messageSender[i])))) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, 'From ' + this.messageSender[i] + ':', 0);
                            font?.drawString(font.stringWidth('From ' + this.messageSender[i]) + 12, offset, this.messageText[i], 8388608);
                        }
                        line++;
                    }
                    if (type === 4 && (this.tradeChatSetting == 0 || (this.tradeChatSetting == 1 && this.isFriend(this.messageSender[i])))) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageSender[i] + ' ' + this.messageText[i], 8388736);
                        }
                        line++;
                    }
                    if (type === 5 && this.splitPrivateChat == 0 && this.privateChatSetting < 2) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageText[i], 8388608);
                        }
                        line++;
                    }
                    if (type === 6 && this.splitPrivateChat == 0 && this.privateChatSetting < 2) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, 'To ' + this.messageSender[i] + ':', 0);
                            font?.drawString(font.stringWidth('To ' + this.messageSender[i]) + 12, offset, this.messageText[i], 8388608);
                        }
                        line++;
                    }
                    if (type === 8 && (this.tradeChatSetting == 0 || (this.tradeChatSetting == 1 && this.isFriend(this.messageSender[i])))) {
                        if (offset > 0 && offset < 110) {
                            font?.drawString(4, offset, this.messageSender[i] + ' ' + this.messageText[i], 13350793);
                        }
                        line++;
                    }
                }
            }
            Draw2D.resetBounds();
            this.chatScrollHeight = line * 14 + 7;
            if (this.chatScrollHeight < 78) {
                this.chatScrollHeight = 78;
            }
            this.drawScrollbar(463, 0, this.chatScrollHeight - this.chatScrollOffset - 77, this.chatScrollHeight, 77);
            font?.drawString(4, 90, JString.formatName(this.username) + ':', 0);
            font?.drawString(font.stringWidth(this.username + ': ') + 6, 90, this.chatTyped + '*', 255);
            Draw2D.drawHorizontalLine(0, 77, 0, 479);
        } else {
            this.drawInterface(ComType.instances[this.stickyChatInterfaceId], 0, 0, 0);
        }
        if (this.menuVisible && this.menuArea == 2) {
            this.drawMenu();
        }
        this.areaChatback?.draw(22, 375);
        this.areaViewport?.bind();
        if (this.areaViewportOffsets) {
            Draw3D.lineOffset = this.areaViewportOffsets;
        }
    };

    private drawScrollbar = (x: number, y: number, scrollY: number, scrollHeight: number, height: number): void => {
        this.imageScrollbar0?.draw(x, y);
        this.imageScrollbar1?.draw(x, y + height - 16);
        Draw2D.fillRect(x, y + 16, 16, height - 32, this.SCROLLBAR_TRACK);

        let gripSize = (((height - 32) * height) / scrollHeight) | 0;
        if (gripSize < 8) {
            gripSize = 8;
        }

        const gripY = (((height - gripSize - 32) * scrollY) / (scrollHeight - height)) | 0;
        Draw2D.fillRect(x, y + gripY + 16, 16, gripSize, this.SCROLLBAR_GRIP_FOREGROUND);

        Draw2D.drawVerticalLine(x, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);
        Draw2D.drawVerticalLine(x + 1, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);

        Draw2D.drawHorizontalLine(x, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, 16);
        Draw2D.drawHorizontalLine(x, y + gripY + 17, this.SCROLLBAR_GRIP_HIGHLIGHT, 16);

        Draw2D.drawVerticalLine(x + 15, y + gripY + 16, this.SCROLLBAR_GRIP_LOWLIGHT, gripSize);
        Draw2D.drawVerticalLine(x + 14, y + gripY + 17, this.SCROLLBAR_GRIP_LOWLIGHT, gripSize - 1);

        Draw2D.drawHorizontalLine(x, y + gripY + gripSize + 15, this.SCROLLBAR_GRIP_LOWLIGHT, 16);
        Draw2D.drawHorizontalLine(x + 1, y + gripY + gripSize + 14, this.SCROLLBAR_GRIP_LOWLIGHT, 15);
    };

    private drawInterface = (com: ComType, x: number, y: number, scrollY: number): void => {
        if (com.type != 0 || com.childId == null || (com.hide && this.viewportHoveredInterfaceIndex != com.id && this.sidebarHoveredInterfaceIndex != com.id && this.chatHoveredInterfaceIndex != com.id)) {
            return;
        }

        const left = Draw2D.left;
        const top = Draw2D.top;
        const right = Draw2D.right;
        const bottom = Draw2D.bottom;

        Draw2D.setBounds(y + com.height, x + com.width, y, x);
        const children = com.childId.length;

        for (let i = 0; i < children; i++) {
            if (!com.childX || !com.childY) {
                continue;
            }

            let childX = com.childX[i] + x;
            let childY = com.childY[i] + y - scrollY;

            const child = ComType.instances[com.childId[i]];
            childX += child.x;
            childY += child.y;

            if (child.contentType > 0) {
                this.updateInterfaceContent(child);
            }

            if (child.type == 0) {
                if (child.scrollPosition > child.scrollableHeight - child.height) {
                    child.scrollPosition = child.scrollableHeight - child.height;
                }

                if (child.scrollPosition < 0) {
                    child.scrollPosition = 0;
                }

                this.drawInterface(child, childX, childY, child.scrollPosition);
                if (child.scrollableHeight > child.height) {
                    this.drawScrollbar(childX + child.width, childY, child.scrollPosition, child.scrollableHeight, child.height);
                }
            } else if (child.type == 2) {
                let slot = 0;

                for (let row = 0; row < child.height; row++) {
                    for (let col = 0; col < child.width; col++) {
                        if (!child.inventorySlotOffsetX || !child.inventorySlotOffsetY || !child.inventorySlotObjId || !child.inventorySlotObjCount) {
                            continue;
                        }

                        let slotX = childX + col * (child.inventoryMarginX + 32);
                        let slotY = childY + row * (child.inventoryMarginY + 32);

                        if (slot < 20) {
                            slotX += child.inventorySlotOffsetX[slot];
                            slotY += child.inventorySlotOffsetY[slot];
                        }

                        if (child.inventorySlotObjId[slot] > 0) {
                            let dx = 0;
                            let dy = 0;
                            const id = child.inventorySlotObjId[slot] - 1;

                            if ((slotX >= -32 && slotX <= 512 && slotY >= -32 && slotY <= 334) || (this.objDragArea != 0 && this.objDragSlot == slot)) {
                                const icon = ObjType.getIcon(id, child.inventorySlotObjCount[slot]);
                                if (this.objDragArea != 0 && this.objDragSlot == slot && this.objDragInterfaceId == child.id) {
                                    dx = this.mouseX - this.objGrabX;
                                    dy = this.mouseY - this.objGrabY;

                                    if (dx < 5 && dx > -5) {
                                        dx = 0;
                                    }

                                    if (dy < 5 && dy > -5) {
                                        dy = 0;
                                    }

                                    if (this.objDragCycles < 5) {
                                        dx = 0;
                                        dy = 0;
                                    }

                                    icon.drawAlpha(128, slotX + dx, slotY + dy);
                                } else if (this.selectedArea != 0 && this.selectedItem == slot && this.selectedInterface == child.id) {
                                    icon.drawAlpha(128, slotX, slotY);
                                } else {
                                    icon.draw(slotX, slotY);
                                }

                                if (icon.cropW == 33 || child.inventorySlotObjCount[slot] != 1) {
                                    const count = child.inventorySlotObjCount[slot];
                                    this.fontPlain11?.drawString(slotX + dx + 1, slotY + 10 + dy, this.formatObjCount(count), 0);
                                    this.fontPlain11?.drawString(slotX + dx, slotY + 9 + dy, this.formatObjCount(count), 0xffff00);
                                }
                            }
                        } else if (child.inventorySlotImage != null && slot < 20) {
                            const image = child.inventorySlotImage[slot];

                            if (image != null) {
                                image.draw(slotX, slotY);
                            }
                        }

                        slot++;
                    }
                }
            } else if (child.type == 3) {
                if (child.fill) {
                    Draw2D.fillRect(childX, childY, child.color, child.width, child.height);
                } else {
                    Draw2D.drawRect(childX, childY, child.color, child.width, child.height);
                }
            } else if (child.type == 4) {
                const font = child.font;
                let color = child.color;
                let text = child.text;

                if ((this.chatHoveredInterfaceIndex == child.id || this.sidebarHoveredInterfaceIndex == child.id || this.viewportHoveredInterfaceIndex == child.id) && child.hoverColor != 0) {
                    color = child.hoverColor;
                }

                if (this.executeInterfaceScript(child)) {
                    color = child.activeColor;

                    if (child.activeText && child.activeText.length > 0) {
                        text = child.activeText;
                    }
                }

                if (child.optionType == 6 && this.pressedContinueOption) {
                    text = 'Please wait...';
                    color = child.color;
                }

                if (!font || !text) {
                    continue;
                }

                for (let lineY = childY + font.fontHeight; text.length > 0; lineY += font.fontHeight) {
                    if (text.indexOf('%') != -1) {
                        do {
                            const index = text.indexOf('%1');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 0)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index = text.indexOf('%2');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 1)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index = text.indexOf('%3');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 2)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index = text.indexOf('%4');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 3)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index = text.indexOf('%5');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 4)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);
                    }

                    const newline = text.indexOf('\\n');
                    let split: string;
                    if (newline != -1) {
                        split = text.substring(0, newline);
                        text = text.substring(newline + 2);
                    } else {
                        split = text;
                        text = '';
                    }

                    if (child.center) {
                        font.drawStringTaggableCenter(childX + child.width / 2, lineY, split, color, child.shadow);
                    } else {
                        font.drawStringTaggable(childX, lineY, split, color, child.shadow);
                    }
                }
            } else if (child.type == 5) {
                let image: Pix24 | null;
                if (this.executeInterfaceScript(child)) {
                    image = child.activeImage;
                } else {
                    image = child.image;
                }

                if (image != null) {
                    image.draw(childX, childY);
                }
            } else if (child.type == 6) {
                const tmpX = Draw3D.centerX;
                const tmpY = Draw3D.centerY;

                Draw3D.centerX = childX + child.width / 2;
                Draw3D.centerY = childY + child.height / 2;

                const eyeY = (Draw3D.sin[child.modelPitch] * child.modelZoom) >> 16;
                const eyeZ = (Draw3D.cos[child.modelPitch] * child.modelZoom) >> 16;

                const active = this.executeInterfaceScript(child);
                let seqId: number;
                if (active) {
                    seqId = child.activeSeqId;
                } else {
                    seqId = child.seqId;
                }

                let model: Model | null = null;
                if (seqId == -1) {
                    model = child.getModel(-1, -1, active);
                } else {
                    const seq = SeqType.instances[seqId];
                    if (seq.frames && seq.iframes) {
                        model = child.getModel(seq.frames[child.seqFrame], seq.iframes[child.seqFrame], active);
                    }
                }

                if (model) {
                    model.drawSimple(0, child.modelYaw, 0, child.modelPitch, 0, eyeY, eyeZ);
                }

                Draw3D.centerX = tmpX;
                Draw3D.centerY = tmpY;
            } else if (child.type == 7) {
                const font = child.font;
                if (!font || !child.inventorySlotObjId || !child.inventorySlotObjCount) {
                    continue;
                }

                let slot = 0;
                for (let row = 0; row < child.height; row++) {
                    for (let col = 0; col < child.width; col++) {
                        if (child.inventorySlotObjId[slot] > 0) {
                            const obj = ObjType.get(child.inventorySlotObjId[slot] - 1);
                            let text = obj.name;
                            if (obj.stackable || child.inventorySlotObjCount[slot] != 1) {
                                text = text + ' x' + this.formatObjCountTagged(child.inventorySlotObjCount[slot]);
                            }

                            if (!text) {
                                continue;
                            }

                            const textX = childX + col * (child.inventoryMarginX + 115);
                            const textY = childY + row * (child.inventoryMarginY + 12);

                            if (child.center) {
                                font.drawStringTaggableCenter(textX + child.width / 2, textY, text, child.color, child.shadow);
                            } else {
                                font.drawStringTaggable(textX, textY, text, child.color, child.shadow);
                            }
                        }

                        slot++;
                    }
                }
            }
        }

        Draw2D.setBounds(bottom, right, top, left);
    };

    private drawMinimap = (): void => {
        // TODO
    };

    private drawMenu = (): void => {
        const x = this.menuX;
        const y = this.menuY;
        const w = this.menuWidth;
        const h = this.menuHeight;
        const background = 0x5d5447;
        Draw2D.fillRect(x, y, w, h, background);
        Draw2D.fillRect(x + 1, y + 1, w - 2, 16, 0);
        Draw2D.drawRect(x + 1, y + 18, w - 2, h - 19, 0);

        this.fontBold12?.drawString(x + 3, y + 14, 'Choose Option', background);
        let mouseX = this.mouseX;
        let mouseY = this.mouseY;
        if (this.menuArea == 0) {
            mouseX -= 8;
            mouseY -= 11;
        }
        if (this.menuArea == 1) {
            mouseX -= 562;
            mouseY -= 231;
        }
        if (this.menuArea == 2) {
            mouseX -= 22;
            mouseY -= 375;
        }

        for (let i = 0; i < this.menuSize; i++) {
            const optionY = y + (this.menuSize - 1 - i) * 15 + 31;
            let rgb = 0xffffff;
            if (mouseX > x && mouseX < x + w && mouseY > optionY - 13 && mouseY < optionY + 3) {
                rgb = 0xffff00;
            }
            this.fontBold12?.drawStringTaggable(x + 3, optionY, this.menuOption[i], rgb, true);
        }
    };

    private updateInterfaceAnimation = (id: number, delta: number): boolean => {
        // TODO
        return false;
    };

    private handleScrollInput = (mouseX: number, mouseY: number, scrollableHeight: number, height: number, redraw: boolean, left: number, top: number, component: ComType): void => {
        if (this.scrollGrabbed) {
            this.scrollInputPadding = 32;
        } else {
            this.scrollInputPadding = 0;
        }

        this.scrollGrabbed = false;

        if (mouseX >= left && mouseX < left + 16 && mouseY >= top && mouseY < top + 16) {
            component.scrollPosition -= this.dragCycles * 4;
            if (redraw) {
                this.redrawSidebar = true;
            }
        } else if (mouseX >= left && mouseX < left + 16 && mouseY >= top + height - 16 && mouseY < top + height) {
            component.scrollPosition += this.dragCycles * 4;
            if (redraw) {
                this.redrawSidebar = true;
            }
        } else if (mouseX >= left - this.scrollInputPadding && mouseX < left + this.scrollInputPadding + 16 && mouseY >= top + 16 && mouseY < top + height - 16 && this.dragCycles > 0) {
            let gripSize = ((height - 32) * height) / scrollableHeight;
            if (gripSize < 8) {
                gripSize = 8;
            }
            const gripY = mouseY - top - gripSize / 2 - 16;
            const maxY = height - gripSize - 32;
            component.scrollPosition = ((scrollableHeight - height) * gripY) / maxY;
            if (redraw) {
                this.redrawSidebar = true;
            }
            this.scrollGrabbed = true;
        }
    };

    private prepareGameScreen = (): void => {
        if (this.areaChatback == null) {
            this.unloadTitle();
            this.drawArea = null;
            this.imageTitle2 = null;
            this.imageTitle3 = null;
            this.imageTitle4 = null;
            this.imageTitle0 = null;
            this.imageTitle1 = null;
            this.imageTitle5 = null;
            this.imageTitle6 = null;
            this.imageTitle7 = null;
            this.imageTitle8 = null;
            const canvas = this.canvas;
            this.areaChatback = new PixMap(canvas, 479, 96);
            this.areaMapback = new PixMap(canvas, 168, 160);
            Draw2D.clear();
            this.imageMapback?.draw(0, 0);
            this.areaSidebar = new PixMap(canvas, 190, 261);
            this.areaViewport = new PixMap(canvas, 512, 334);
            Draw2D.clear();
            this.areaBackbase1 = new PixMap(canvas, 501, 61);
            this.areaBackbase2 = new PixMap(canvas, 288, 40);
            this.areaBackhmid1 = new PixMap(canvas, 269, 66);
            this.redrawTitleBackground = true;
        }
    };

    private isFriend = (username: string): boolean => {
        // TODO
        return false;
    };

    private getIntString = (value: number): string => {
        return value < 999999999 ? String(value) : '*';
    };

    private formatObjCountTagged = (amount: number): string => {
        let s = String(amount);
        for (let i: number = s.length - 3; i > 0; i -= 3) {
            s = s.substring(0, i) + ',' + s.substring(i);
        }
        if (s.length > 8) {
            s = '@gre@' + s.substring(0, s.length - 8) + ' million @whi@(' + s + ')';
        } else if (s.length > 4) {
            s = '@cya@' + s.substring(0, s.length - 4) + 'K @whi@(' + s + ')';
        }
        return ' ' + s;
    };

    private formatObjCount = (amount: number): string => {
        if (amount < 100000) {
            return String(amount);
        } else if (amount < 10000000) {
            return Math.floor(amount / 1000) + 'K';
        } else {
            return Math.floor(amount / 1000000) + 'M';
        }
    };

    private executeClientscript1 = (component: ComType, scriptId: number): number => {
        if (component.scripts == null || scriptId >= component.scripts.length) {
            return -2;
        }

        try {
            // TODO
            return -1;
        } catch (e) {
            return -1;
        }
    };

    private executeInterfaceScript = (com: ComType): boolean => {
        if (!com.scriptComparator || !com.scriptOperand) {
            return false;
        }

        for (let i = 0; i < com.scriptComparator.length; i++) {
            const value = this.executeClientscript1(com, i);
            const operand = com.scriptOperand[i];

            if (com.scriptComparator[i] == 2) {
                if (value >= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] == 3) {
                if (value <= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] == 4) {
                if (value == operand) {
                    return false;
                }
            } else if (value != operand) {
                return false;
            }
        }

        return true;
    };

    private updateInterfaceContent = (component: ComType): void => {
        // TODO
    };

    private unloadTitle = (): void => {
        this.flameActive = false;
        if (this.flamesInterval) {
            clearInterval(this.flamesInterval);
            this.flamesInterval = null;
        }
        this.imageTitlebox = null;
        this.imageTitlebutton = null;
        this.imageRunes = [];
        this.flameGradient = [];
        this.flameGradient0 = [];
        this.flameGradient1 = [];
        this.flameGradient2 = [];
        this.flameBuffer0 = [];
        this.flameBuffer1 = [];
        this.flameBuffer3 = [];
        this.flameBuffer2 = [];
        this.imageFlamesLeft = null;
        this.imageFlamesRight = null;
    };

    private loadArchive = async (filename: string, displayName: string, crc: number, progress: number): Promise<Jagfile> => {
        // TODO: caching
        // TODO: download progress, retry

        await this.showProgress(progress, `Requesting ${displayName}`);
        const data: Jagfile = await Jagfile.loadUrl(`${Client.HOST}/${filename}${crc}`);
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
            if (rand < 50) this.flameBuffer3[x + ((height - 2) << 7)] = 255;
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
                let intensity = (this.flameBuffer2[index + 128] - this.flameBuffer0[(index + this.flameCycle0) & (32768 - 1)] / 5) | 0;
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
            const rand = Math.trunc(Math.random() * 2000.0);

            if (rand == 0) {
                this.flameGradientCycle0 = 1024;
            } else if (rand == 1) {
                this.flameGradientCycle1 = 1024;
            }
        }
    };

    private mix = (src: number, alpha: number, dst: number) => {
        const invAlpha = 256 - alpha;
        return ((((src & 0xff00ff) * invAlpha + (dst & 0xff00ff) * alpha) & 0xff00ff00) + (((src & 0xff00) * invAlpha + (dst & 0xff00) * alpha) & 0xff0000)) >> 8;
    };

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
            if (this.imageTitle0 && this.imageFlamesLeft) this.imageTitle0.pixels[i] = this.imageFlamesLeft.pixels[i];
        }

        let srcOffset = 0;
        let dstOffset = 1152;

        for (let y = 1; y < height - 1; y++) {
            const offset = ((this.flameLineOffset[y] * (height - y)) / height) | 0;
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
                        this.imageTitle0.pixels[dstOffset++] = ((((value & 0xff00ff) * alpha + (background & 0xff00ff) * invAlpha) & 0xff00ff00) + (((value & 0xff00) * alpha + (background & 0xff00) * invAlpha) & 0xff0000)) >> 8;
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
            const offset = ((this.flameLineOffset[y] * (height - y)) / height) | 0;
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
                        this.imageTitle1.pixels[dstOffset++] = ((((value & 0xff00ff) * alpha + (background & 0xff00ff) * invAlpha) & 0xff00ff00) + (((value & 0xff00) * alpha + (background & 0xff00) * invAlpha) & 0xff0000)) >> 8;
                    }
                }
            }
            srcOffset += 128 - step;
            dstOffset += 128 - step - offset;
        }

        this.imageTitle1?.draw(661, 0);
    };
}

const client = new Client();
client.run().then(() => {});
