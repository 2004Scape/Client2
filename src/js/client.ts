import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import ComType from './jagex2/config/ComType';

import PixMap from './jagex2/graphics/PixMap';
import Draw2D from './jagex2/graphics/Draw2D';
import Draw3D from './jagex2/graphics/Draw3D';
import Pix8 from './jagex2/graphics/Pix8';
import Pix24 from './jagex2/graphics/Pix24';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {arraycopy, decompressBz2, downloadUrl, sleep} from './jagex2/util/JsUtil';
import {playMidi} from './jagex2/util/AudioUtil.js';
import GameShell from './jagex2/client/GameShell';

import './vendor/midi.js';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import JString from './jagex2/datastruct/JString';
import World3D from './jagex2/dash3d/World3D';
import ClientStream from './jagex2/io/ClientStream';
import Protocol from './jagex2/io/Protocol';
import Isaac from './jagex2/io/Isaac';
import Database from './jagex2/io/Database';

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
    static UPDATE_COUNTER: number = 0;
    static UPDATE2_COUNTER: number = 0;

    private SCROLLBAR_TRACK: number = 0x23201b;
    private SCROLLBAR_GRIP_FOREGROUND: number = 0x4d4233;
    private SCROLLBAR_GRIP_HIGHLIGHT: number = 0x766654;
    private SCROLLBAR_GRIP_LOWLIGHT: number = 0x332d25;

    private alreadyStarted: boolean = false;
    private errorStarted: boolean = false;
    private errorLoading: boolean = false;
    private errorHost: boolean = false;

    // important client stuff
    private db: Database | null = null;
    private loopCycle: number = 0;
    private ingame: boolean = false;
    private archiveChecksums: number[] = [];
    private stream: ClientStream | null = null;
    private in: Packet = Packet.alloc(1);
    private out: Packet = Packet.alloc(1);
    private loginout: Packet = Packet.alloc(1);
    private serverSeed: bigint = 0n;
    private idleNetCycles: number = 0;
    private idleTimeout: number = 0;
    private systemUpdateTimer: number = 0;
    private randomIn: Isaac | null = null;
    private packetType: number = 0;
    private packetSize: number = 0;
    private lastPacketType0: number = 0;
    private lastPacketType1: number = 0;
    private lastPacketType2: number = 0;

    // archives
    private titleArchive: Jagfile | null = null;
    private configArchive: Jagfile | null = null;
    private interfaceArchive: Jagfile | null = null;
    private modelsArchive: Jagfile | null = null;
    private texturesArchive: Jagfile | null = null;
    private wordencArchive: Jagfile | null = null;
    private soundsArchive: Jagfile | null = null;
    private mediaArchive: Jagfile | null = null;

    // login screen properties
    private redrawTitleBackground: boolean = true;
    private titleScreenState: number = 0;
    private titleLoginField: number = 0;
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
    private viewportInterfaceID: number = -1;
    private dragCycles: number = 0;
    private crossMode: number = 0;
    private crossCycle: number = 0;
    private overrideChat: number = 0;
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
    private ignoreCount: number = 0;
    private ignoreName37: bigint[] = [];
    private hintType: number = 0;
    private hintNpc: number = 0;
    private hintOffsetX: number = 0;
    private hintOffsetZ: number = 0;
    private hintPlayer: number = 0;
    private hintTileX: number = 0;
    private hintTileZ: number = 0;
    private hintHeight: number = 0;
    private skillExperience: number[] = [];
    private skillLevel: number[] = [];
    private skillBaseLevel: number[] = [];
    private levelExperience: number[] = [];
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
    private objGrabThreshold: boolean = false;
    private selectedArea: number = 0;
    private selectedItem: number = 0;
    private selectedInterface: number = 0;
    private selectedCycle: number = 0;
    private pressedContinueOption: boolean = false;
    private awaitingLogin: boolean = false;
    private varps: number[] = [];
    private varCache: number[] = [];

    // scene
    private scene: World3D | null = null;
    private sceneState: number = 0;
    private sceneDelta: number = 0;
    private flagSceneTileX: number = 0;
    private flagSceneTileZ: number = 0;
    private cutscene: boolean = false;
    private cameraOffsetCycle: number = 0;
    private cameraAnticheatOffsetX: number = 0;
    private cameraAnticheatOffsetZ: number = 0;
    private cameraAnticheatAngle: number = 0;
    private cameraOffsetXModifier: number = 2;
    private cameraOffsetZModifier: number = 2;
    private cameraOffsetYawModifier: number = 1;
    private minimapOffsetCycle: number = 0;
    private minimapAnticheatAngle: number = 0;
    private minimapZoom: number = 0;
    private minimapZoomModifier: number = 1;
    private minimapAngleModifier: number = 2;
    private baseX: number = 0;
    private baseZ: number = 0;
    private sceneCenterZoneX: number = 0;
    private sceneCenterZoneZ: number = 0;
    private sceneBaseTileX: number = 0;
    private sceneBaseTileZ: number = 0;
    private sceneMapLandData: number[][] = [];
    private sceneMapLocData: number[][] = [];
    private sceneMapIndex: number[] = [];

    // other
    private energy: number = 0;
    private inMultizone: number = 0;
    private localPid: number = -1;
    private weightCarried: number = 0;
    private heartbeatTimer: number = 0;

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

            this.db = new Database(await Database.openDatabase());

            const checksums: Packet = new Packet(Uint8Array.from(await downloadUrl(`${Client.HOST}/crc`)));
            for (let i: number = 0; i < 9; i++) {
                this.archiveChecksums[i] = checksums.g4;
            }

            await this.setMidi('scape_main', 12345678);

            const title: Jagfile = await this.loadArchive('title', 'title screen', this.archiveChecksums[1], 10);
            this.titleArchive = title;

            this.fontPlain11 = PixFont.fromArchive(title, 'p11');
            this.fontPlain12 = PixFont.fromArchive(title, 'p12');
            this.fontBold12 = PixFont.fromArchive(title, 'b12');
            this.fontQuill8 = PixFont.fromArchive(title, 'q8');

            await this.loadTitleBackground();
            this.loadTitleImages();

            const config: Jagfile = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            const interfaces: Jagfile = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            const media: Jagfile = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            const models: Jagfile = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            const textures: Jagfile = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            const wordenc: Jagfile = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

            this.configArchive = config;
            this.interfaceArchive = interfaces;
            this.mediaArchive = media;
            this.modelsArchive = models;
            this.texturesArchive = textures;
            this.wordencArchive = wordenc;
            this.soundsArchive = sounds;

            await this.showProgress(75, 'Unpacking media');
            this.imageInvback = Pix8.fromArchive(media, 'invback', 0);
            this.imageChatback = Pix8.fromArchive(media, 'chatback', 0);
            this.imageMapback = Pix8.fromArchive(media, 'mapback', 0);
            this.imageBackbase1 = Pix8.fromArchive(media, 'backbase1', 0);
            this.imageBackbase2 = Pix8.fromArchive(media, 'backbase2', 0);
            this.imageBackhmid1 = Pix8.fromArchive(media, 'backhmid1', 0);
            for (let i: number = 0; i < 13; i++) {
                this.imageSideicons[i] = Pix8.fromArchive(media, 'sideicons', i);
            }
            this.imageCompass = Pix24.fromArchive(media, 'compass', 0);

            try {
                for (let i: number = 0; i < 50; i++) {
                    this.imageMapscene[i] = Pix8.fromArchive(media, 'mapscene', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i: number = 0; i < 50; i++) {
                    this.imageMapfunction[i] = Pix24.fromArchive(media, 'mapfunction', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i: number = 0; i < 20; i++) {
                    this.imageHitmarks[i] = Pix24.fromArchive(media, 'hitmarks', i);
                }
            } catch (e) {
                /* empty */
            }

            try {
                for (let i: number = 0; i < 20; i++) {
                    this.imageHeadicons[i] = Pix24.fromArchive(media, 'headicons', i);
                }
            } catch (e) {
                /* empty */
            }

            this.imageMapflag = Pix24.fromArchive(media, 'mapflag', 0);
            for (let i: number = 0; i < 8; i++) {
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
            const canvas: HTMLCanvasElement = this.canvas;
            const backleft1: Pix24 = Pix24.fromArchive(media, 'backleft1', 0);
            this.areaBackleft1 = new PixMap(canvas, backleft1.width, backleft1.height);
            backleft1.blitOpaque(0, 0);
            const backleft2: Pix24 = Pix24.fromArchive(media, 'backleft2', 0);
            this.areaBackleft2 = new PixMap(canvas, backleft2.width, backleft2.height);
            backleft2.blitOpaque(0, 0);
            const backright1: Pix24 = Pix24.fromArchive(media, 'backright1', 0);
            this.areaBackright1 = new PixMap(canvas, backright1.width, backright1.height);
            backright1.blitOpaque(0, 0);
            const backright2: Pix24 = Pix24.fromArchive(media, 'backright2', 0);
            this.areaBackright2 = new PixMap(canvas, backright2.width, backright2.height);
            backright2.blitOpaque(0, 0);
            const backtop1: Pix24 = Pix24.fromArchive(media, 'backtop1', 0);
            this.areaBacktop1 = new PixMap(canvas, backtop1.width, backtop1.height);
            backtop1.blitOpaque(0, 0);
            const backtop2: Pix24 = Pix24.fromArchive(media, 'backtop2', 0);
            this.areaBacktop2 = new PixMap(canvas, backtop2.width, backtop2.height);
            backtop2.blitOpaque(0, 0);
            const backvmid1: Pix24 = Pix24.fromArchive(media, 'backvmid1', 0);
            this.areaBackvmid1 = new PixMap(canvas, backvmid1.width, backvmid1.height);
            backvmid1.blitOpaque(0, 0);
            const backvmid2: Pix24 = Pix24.fromArchive(media, 'backvmid2', 0);
            this.areaBackvmid2 = new PixMap(canvas, backvmid2.width, backvmid2.height);
            backvmid2.blitOpaque(0, 0);
            const backvmid3: Pix24 = Pix24.fromArchive(media, 'backvmid3', 0);
            this.areaBackvmid3 = new PixMap(canvas, backvmid3.width, backvmid3.height);
            backvmid3.blitOpaque(0, 0);
            const backhmid2: Pix24 = Pix24.fromArchive(media, 'backhmid2', 0);
            this.areaBackhmid2 = new PixMap(canvas, backhmid2.width, backhmid2.height);
            backhmid2.blitOpaque(0, 0);

            const randR: number = Math.trunc(Math.random() * 21.0) - 10;
            const randG: number = Math.trunc(Math.random() * 21.0) - 10;
            const randB: number = Math.trunc(Math.random() * 21.0) - 10;
            const rand: number = Math.trunc(Math.random() * 41.0) - 20;
            for (let i: number = 0; i < 50; i++) {
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
            ComType.unpack(interfaces, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.showProgress(97, 'Preparing game engine');
            for (let y: number = 0; y < 33; y++) {
                let left: number = 999;
                let right: number = 0;
                for (let x: number = 0; x < 35; x++) {
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

            for (let y: number = 9; y < 160; y++) {
                let left: number = 999;
                let right: number = 0;
                for (let x: number = 10; x < 168; x++) {
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
            for (let x: number = 0; x < 9; x++) {
                const angle: number = x * 32 + 128 + 15;
                const offset: number = angle * 3 + 600;
                const sin: number = Draw3D.sin[angle];
                distance[x] = (offset * sin) >> 16;
            }

            World3D.init(512, 334, 500, 800, distance);
            WordFilter.unpack(wordenc);
            this.initializeLevelExperience();
        } catch (err) {
            console.error(err);
            this.errorLoading = true;
        }
    };

    update = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }
        this.loopCycle++;
        if (this.ingame) {
            await this.updateGame();
        } else {
            await this.updateTitleScreen();
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

        const x: number = 360;
        const y: number = 200;

        const offsetY: number = 20;
        this.fontBold12?.drawStringCenter(x / 2, y / 2 - offsetY - 26, 'RuneScape is loading - please wait...', 0xffffff);
        const midY: number = y / 2 - 18 - offsetY;

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

            const canvas: HTMLCanvasElement = this.canvas;
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
        const background: Pix24 = await Pix24.fromJpeg(this.titleArchive, 'title');

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

        const logo: Pix24 = Pix24.fromArchive(this.titleArchive, 'logo');
        this.imageTitle2?.bind();
        logo.draw(this.width / 2 - logo.width / 2 - 128, 18);
    };

    private updateFlameBuffer = (image: Pix8 | null): void => {
        const flameHeight: number = 256;

        // Clears the initial flame buffer
        for (let i: number = 0; i < 32768; i++) {
            this.flameBuffer0[i] = 0;
        }

        // Blends the fire at random
        for (let i: number = 0; i < 5000; i++) {
            const rand: number = Math.trunc(Math.random() * 128.0 * flameHeight);
            this.flameBuffer0[rand] = Math.trunc(Math.random() * 256.0);
        }

        // changes color between last few flames
        for (let i: number = 0; i < 20; i++) {
            for (let y: number = 1; y < Math.trunc(flameHeight) - 1; y++) {
                for (let x: number = 1; x < 127; x++) {
                    const index: number = x + (y << 7);
                    this.flameBuffer1[index] = ((this.flameBuffer0[index - 1] + this.flameBuffer0[index + 1] + this.flameBuffer0[index - 128] + this.flameBuffer0[index + 128]) / 4) | 0;
                }
            }

            const last: number[] = this.flameBuffer0;
            this.flameBuffer0 = this.flameBuffer1;
            this.flameBuffer1 = last;
        }

        // Renders the rune images
        if (image != null) {
            let off: number = 0;

            for (let y: number = 0; y < image.height; y++) {
                for (let x: number = 0; x < image.width; x++) {
                    if (image.pixels[off++] != 0) {
                        const x0: number = x + image.cropX + 16;
                        const y0: number = y + image.cropY + 16;
                        const index: number = x0 + (y0 << 7);
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
        for (let i: number = 0; i < 12; i++) {
            this.imageRunes[i] = Pix8.fromArchive(this.titleArchive, 'runes', i);
        }
        this.imageFlamesLeft = new Pix24(128, 265);
        this.imageFlamesRight = new Pix24(128, 265);

        if (this.imageTitle0) arraycopy(this.imageTitle0.pixels, 0, this.imageFlamesLeft.pixels, 0, 33920);
        if (this.imageTitle1) arraycopy(this.imageTitle1.pixels, 0, this.imageFlamesRight.pixels, 0, 33920);

        this.flameGradient0 = [];
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index] = index * 262144;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 64] = index * 1024 + 16711680;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 128] = index * 4 + 16776960;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 192] = 16777215;
        }
        this.flameGradient1 = [];
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index] = index * 1024;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 64] = index * 4 + 65280;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 128] = index * 262144 + 65535;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 192] = 16777215;
        }
        this.flameGradient2 = [];
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index] = index * 4;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 64] = index * 262144 + 255;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 128] = index * 1024 + 16711935;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 192] = 16777215;
        }

        this.flameGradient = [];
        this.flameBuffer0 = [];
        this.flameBuffer1 = [];
        this.updateFlameBuffer(null);
        this.flameBuffer3 = [];
        this.flameBuffer2 = [];

        this.showProgress(10, 'Connecting to fileserver').then((): void => {
            if (!this.flameActive) {
                this.flameActive = true;
                this.flamesInterval = setInterval(this.runFlames, 35);
            }
        });
    };

    private updateTitleScreen = async (): Promise<void> => {
        if (this.titleScreenState === 0) {
            let x: number = this.width / 2 - 80;
            let y: number = this.height / 2 + 20;

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
            let y: number = this.height / 2 - 40;
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

            let buttonX: number = this.width / 2 - 80;
            let buttonY: number = this.height / 2 + 50;
            buttonY += 20;

            if (this.mouseClickButton == 1 && this.mouseClickX >= buttonX - 75 && this.mouseClickX <= buttonX + 75 && this.mouseClickY >= buttonY - 20 && this.mouseClickY <= buttonY + 20) {
                await this.login(this.username, this.password, false);
            }

            buttonX = this.width / 2 + 80;
            if (this.mouseClickButton == 1 && this.mouseClickX >= buttonX - 75 && this.mouseClickX <= buttonX + 75 && this.mouseClickY >= buttonY - 20 && this.mouseClickY <= buttonY + 20) {
                this.titleScreenState = 0;
                this.username = '';
                this.password = '';
            }

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const key: number = this.pollKey();
                if (key == -1) {
                    return;
                }

                let valid: boolean = false;
                for (let i: number = 0; i < Client.CHARSET.length; i++) {
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
            const x: number = this.width / 2;
            let y: number = this.height / 2 + 50;
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

        const w: number = 360;
        const h: number = 200;

        if (this.titleScreenState === 0) {
            let x: number = w / 2;
            let y: number = h / 2 - 20;
            this.fontBold12?.drawStringTaggableCenter(x, y, 'Welcome to RuneScape', 0xffffff00, true);

            x = w / 2 - 80;
            y = h / 2 + 20;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'New user', 0xffffffff, true);

            x = w / 2 + 80;
            this.imageTitlebutton?.draw(x - 73, y - 20);
            this.fontBold12?.drawStringTaggableCenter(x, y + 5, 'Existing User', 0xffffffff, true);
        } else if (this.titleScreenState === 2) {
            let x: number = w / 2 - 80;
            let y: number = h / 2 - 40;
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

            const x: number = w / 2;
            let y: number = h / 2 - 35;

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
            for (let i: number = 0; i < 9; i++) {
                this.loginout.p4(this.archiveChecksums[i]);
            }
            this.loginout.pdata(this.out.data, this.out.pos, 0);
            this.out.random = new Isaac(seed);
            for (let i: number = 0; i < 4; i++) {
                seed[i] += 50;
            }
            this.randomIn = new Isaac(seed);
            this.stream?.write(this.loginout.data, this.loginout.pos, 0);
            const reply: number = await this.stream.read();
            console.log(`Login reply was: ${reply}`);

            if (reply === 1) {
                await sleep(2000);
                await this.login(username, password, reconnect);
                return;
            }
            if (reply === 2 || reply === 18) {
                // TODO
                //this.rights = reply == 18;
                // InputTracking.setDisabled();
                this.ingame = true;
                this.out.pos = 0;
                this.in.pos = 0;
                this.packetType = -1;
                this.lastPacketType0 = -1;
                this.lastPacketType1 = -1;
                this.lastPacketType2 = -1;
                this.packetSize = 0;
                this.idleNetCycles = 0;
                this.systemUpdateTimer = 0;
                this.idleTimeout = 0;
                this.hintType = 0;
                this.menuSize = 0;
                this.menuVisible = false;
                this.idleCycles = 0;
                this.messageText = [];
                // this.objSelected = 0;
                // this.spellSelected = 0;
                this.sceneState = 0;
                // this.waveCount = 0;
                this.cameraAnticheatOffsetX = Math.trunc(Math.random() * 100.0) - 50;
                this.cameraAnticheatOffsetZ = Math.trunc(Math.random() * 110.0) - 55;
                this.cameraAnticheatAngle = Math.trunc(Math.random() * 80.0) - 40;
                this.minimapAnticheatAngle = Math.trunc(Math.random() * 120.0) - 60;
                this.minimapZoom = Math.trunc(Math.random() * 30.0) - 20;
                // this.orbitCameraYaw = (int) (Math.random() * 20.0D) - 10 & 0x7FF;
                // this.minimapLevel = -1;
                this.flagSceneTileX = 0;
                this.flagSceneTileZ = 0;
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
                this.viewportInterfaceID = -1;
                this.sidebarInterfaceId = -1;
                this.pressedContinueOption = false;
                this.selectedTab = 3;
                this.chatbackInputOpen = false;
                this.menuVisible = false;
                this.showSocialInput = false;
                this.modalMessage = null;
                this.inMultizone = 0;
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
                this.packetType = -1;
                this.lastPacketType0 = -1;
                this.lastPacketType1 = -1;
                this.lastPacketType2 = -1;
                this.packetSize = 0;
                this.idleNetCycles = 0;
                this.systemUpdateTimer = 0;
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

    private updateGame = async (): Promise<void> => {
        if (this.systemUpdateTimer > 1) {
            this.systemUpdateTimer--;
        }

        if (this.idleTimeout > 0) {
            this.idleTimeout--;
        }

        for (let i: number = 0; i < 5 && (await this.read()); i++) {
            /* empty */
        }

        if (this.ingame) {
            // for (let wave = 0; wave < this.waveCount; wave++) {
            //     if (this.waveDelay[wave] <= 0) {
            //         let failed = false;
            //         try {
            //             if (this.waveIds[wave] != this.lastWaveId || this.waveLoops[wave] != this.lastWaveLoops) {
            //                 let buf = Wave.generate(this.waveIds[wave], this.waveLoops[wave]);
            //
            //                 if (System.currentTimeMillis() + (long) (buf.pos / 22) > this.lastWaveStartTime + (long) (this.lastWaveLength / 22)) {
            //                     this.lastWaveLength = buf.pos;
            //                     this.lastWaveStartTime = System.currentTimeMillis();
            //                     if (this.saveWave(buf.data, buf.pos)) {
            //                         this.lastWaveId = this.waveIds[wave];
            //                         this.lastWaveLoops = this.waveLoops[wave];
            //                     } else {
            //                         failed = true;
            //                     }
            //                 }
            //             } else if (!this.replayWave()) {
            //                 failed = true;
            //             }
            //         } catch (@Pc(139) Exception ignored) {
            //         }
            //
            //         if (failed && this.waveDelay[wave] != -5) {
            //             this.waveDelay[wave] = -5;
            //         } else {
            //             this.waveCount--;
            //             for (let i = wave; i < this.waveCount; i++) {
            //                 this.waveIds[i] = this.waveIds[i + 1];
            //                 this.waveLoops[i] = this.waveLoops[i + 1];
            //                 this.waveDelay[i] = this.waveDelay[i + 1];
            //             }
            //             wave--;
            //         }
            //     } else {
            //         this.waveDelay[wave]--;
            //     }
            // }
            //
            // if (this.nextMusicDelay > 0) {
            //     this.nextMusicDelay -= 20;
            //     if (this.nextMusicDelay < 0) {
            //         this.nextMusicDelay = 0;
            //     }
            //     if (this.nextMusicDelay == 0 && this.midiActive && !lowMemory) {
            //         this.setMidi(this.currentMidi, this.midiCrc, this.midiSize);
            //     }
            // }
            //
            // let tracking = InputTracking.flush();
            // if (tracking != null) {
            //     this.out.p1isaac(81);
            //     this.out.p2(tracking.pos);
            //     this.out.pdata(tracking.data, tracking.pos, 0);
            //     tracking.release();
            // }

            this.idleNetCycles++;
            if (this.idleNetCycles > 750) {
                await this.tryReconnect();
            }

            // this.updatePlayers();
            // this.updateNpcs();
            // this.updateEntityChats();
            // this.updateTemporaryLocs();
            //
            // if ((this.actionKey[1] == 1 || this.actionKey[2] == 1 || this.actionKey[3] == 1 || this.actionKey[4] == 1) && this.cameraMovedWrite++ > 5) {
            //     this.cameraMovedWrite = 0;
            //     this.out.p1isaac(189);
            //     this.out.p2(this.orbitCameraPitch);
            //     this.out.p2(this.orbitCameraYaw);
            //     this.out.p1(this.minimapAnticheatAngle);
            //     this.out.p1(this.minimapZoom);
            // }

            this.sceneDelta++;
            if (this.crossMode != 0) {
                this.crossCycle += 20;
                if (this.crossCycle >= 400) {
                    this.crossMode = 0;
                }
            }

            if (this.selectedArea != 0) {
                this.selectedCycle++;
                if (this.selectedCycle >= 15) {
                    if (this.selectedArea == 2) {
                        this.redrawSidebar = true;
                    }
                    if (this.selectedArea == 3) {
                        this.redrawChatback = true;
                    }
                    this.selectedArea = 0;
                }
            }

            if (this.objDragArea != 0) {
                this.objDragCycles++;
                if (this.mouseX > this.objGrabX + 5 || this.mouseX < this.objGrabX - 5 || this.mouseY > this.objGrabY + 5 || this.mouseY < this.objGrabY - 5) {
                    this.objGrabThreshold = true;
                }

                if (this.mouseButton == 0) {
                    if (this.objDragArea == 2) {
                        this.redrawSidebar = true;
                    }
                    if (this.objDragArea == 3) {
                        this.redrawChatback = true;
                    }

                    this.objDragArea = 0;
                    // if (this.objGrabThreshold && this.objDragCycles >= 5) {
                    //     this.hoveredSlotParentId = -1;
                    //     this.handleInput();
                    //     if (this.hoveredSlotParentId == this.objDragInterfaceId && this.hoveredSlot != this.objDragSlot) {
                    //         let com = ComType.instances[this.objDragInterfaceId];
                    //         int obj = com.inventorySlotObjId[this.hoveredSlot];
                    //         com.inventorySlotObjId[this.hoveredSlot] = com.inventorySlotObjId[this.objDragSlot];
                    //         com.inventorySlotObjId[this.objDragSlot] = obj;
                    //
                    //     @Pc(530) int count = com.inventorySlotObjCount[this.hoveredSlot];
                    //         com.inventorySlotObjCount[this.hoveredSlot] = com.inventorySlotObjCount[this.objDragSlot];
                    //         com.inventorySlotObjCount[this.objDragSlot] = count;
                    //
                    //         this.out.p1isaac(159);
                    //         this.out.p2(this.objDragInterfaceId);
                    //         this.out.p2(this.objDragSlot);
                    //         this.out.p2(this.hoveredSlot);
                    //     }
                    // } else if ((this.mouseButtonsOption == 1 || this.isAddFriendOption(this.menuSize - 1)) && this.menuSize > 2) {
                    //     this.showContextMenu();
                    // } else if (this.menuSize > 0) {
                    //     this.useMenuOption(this.menuSize - 1);
                    // }

                    this.selectedCycle = 10;
                    this.mouseClickButton = 0;
                }
            }

            Client.UPDATE_COUNTER++;
            if (Client.UPDATE_COUNTER > 127) {
                Client.UPDATE_COUNTER = 0;
                // this.out.p1isaac(215);
                // this.out.p3(4991788);
            }

            // if (World3D.clickTileX != -1) {
            //     const x = World3D.clickTileX;
            //     const z = World3D.clickTileZ;
            //     const success = this.tryMove(this.localPlayer.pathTileX[0], this.localPlayer.pathTileZ[0], x, z, 0, 0, 0, 0, 0, 0, true);
            //     World3D.clickTileX = -1;
            //
            //     if (success) {
            //         this.crossX = this.mouseClickX;
            //         this.crossY = this.mouseClickY;
            //         this.crossMode = 1;
            //         this.crossCycle = 0;
            //     }
            // }

            if (this.mouseClickButton == 1 && this.modalMessage != null) {
                this.modalMessage = null;
                this.redrawChatback = true;
                this.mouseClickButton = 0;
            }

            // this.handleMouseInput();
            // this.handleMinimapInput();
            // this.handleTabInput();
            // this.handleChatSettingsInput();

            if (this.mouseButton == 1 || this.mouseClickButton == 1) {
                this.dragCycles++;
            }

            if (this.sceneState == 2) {
                // this.updateOrbitCamera();
            }
            if (this.sceneState == 2 && this.cutscene) {
                // this.applyCutscene();
            }

            for (let i: number = 0; i < 5; i++) {
                // this.cameraModifierCycle[i]++;
            }

            // this.handleInputKey();
            this.idleCycles++;
            if (this.idleCycles > 4500) {
                this.idleTimeout = 250;
                this.idleCycles -= 500;
                // this.out.p1isaac(70);
            }

            this.cameraOffsetCycle++;
            if (this.cameraOffsetCycle > 500) {
                this.cameraOffsetCycle = 0;
                const rand: number = Math.trunc(Math.random() * 8.0);
                if ((rand & 0x1) == 1) {
                    this.cameraAnticheatOffsetX += this.cameraOffsetXModifier;
                }
                if ((rand & 0x2) == 2) {
                    this.cameraAnticheatOffsetZ += this.cameraOffsetZModifier;
                }
                if ((rand & 0x4) == 4) {
                    this.cameraAnticheatAngle += this.cameraOffsetYawModifier;
                }
            }

            if (this.cameraAnticheatOffsetX < -50) {
                this.cameraOffsetXModifier = 2;
            }
            if (this.cameraAnticheatOffsetX > 50) {
                this.cameraOffsetXModifier = -2;
            }
            if (this.cameraAnticheatOffsetZ < -55) {
                this.cameraOffsetZModifier = 2;
            }
            if (this.cameraAnticheatOffsetZ > 55) {
                this.cameraOffsetZModifier = -2;
            }
            if (this.cameraAnticheatAngle < -40) {
                this.cameraOffsetYawModifier = 1;
            }
            if (this.cameraAnticheatAngle > 40) {
                this.cameraOffsetYawModifier = -1;
            }

            this.minimapOffsetCycle++;
            if (this.minimapOffsetCycle > 500) {
                this.minimapOffsetCycle = 0;
                const rand: number = Math.trunc(Math.random() * 8.0);
                if ((rand & 0x1) == 1) {
                    this.minimapAnticheatAngle += this.minimapAngleModifier;
                }
                if ((rand & 0x2) == 2) {
                    this.minimapZoom += this.minimapZoomModifier;
                }
            }

            if (this.minimapAnticheatAngle < -60) {
                this.minimapAngleModifier = 2;
            }
            if (this.minimapAnticheatAngle > 60) {
                this.minimapAngleModifier = -2;
            }

            if (this.minimapZoom < -20) {
                this.minimapZoomModifier = 1;
            }
            if (this.minimapZoom > 10) {
                this.minimapZoomModifier = -1;
            }

            Client.UPDATE2_COUNTER++;
            if (Client.UPDATE2_COUNTER > 110) {
                Client.UPDATE2_COUNTER = 0;
                // this.out.p1isaac(236);
                // this.out.p4(0);
            }

            this.heartbeatTimer++;
            if (this.heartbeatTimer > 50) {
                // this.out.p1isaac(108);
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
        let redraw: boolean = false;
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

            let offset: number = this.chatScrollHeight - this.chatInterface.scrollPosition - 77;
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
        this.areaSidebar?.bind();
        if (this.areaSidebarOffsets) {
            Draw3D.lineOffset = this.areaSidebarOffsets;
        }
        this.imageInvback?.draw(0, 0);
        if (this.sidebarInterfaceId != -1) {
            this.drawInterface(ComType.instances[this.sidebarInterfaceId], 0, 0, 0);
        } else if (this.tabInterfaceId[this.selectedTab] != -1) {
            this.drawInterface(ComType.instances[this.tabInterfaceId[this.selectedTab]], 0, 0, 0);
        }
        if (this.menuVisible && this.menuArea == 1) {
            this.drawMenu();
        }
        this.areaSidebar?.draw(562, 231);
        // TODO Viewport Drawing
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
            const font: PixFont | null = this.fontPlain12;
            let line: number = 0;
            Draw2D.setBounds(0, 0, 463, 77);
            for (let i: number = 0; i < 100; i++) {
                if (this.messageText[i] == null) {
                    continue;
                }
                const type: number = this.messageType[i];
                const offset: number = this.chatScrollOffset + 70 - line * 14;
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

        let gripSize: number = (((height - 32) * height) / scrollHeight) | 0;
        if (gripSize < 8) {
            gripSize = 8;
        }

        const gripY: number = (((height - gripSize - 32) * scrollY) / (scrollHeight - height)) | 0;
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

        const left: number = Draw2D.left;
        const top: number = Draw2D.top;
        const right: number = Draw2D.right;
        const bottom: number = Draw2D.bottom;

        Draw2D.setBounds(x, y, x + com.width, y + com.height);
        const children: number = com.childId.length;

        for (let i: number = 0; i < children; i++) {
            if (!com.childX || !com.childY) {
                continue;
            }

            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollY;

            const child: ComType = ComType.instances[com.childId[i]];
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
                let slot: number = 0;

                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (!child.inventorySlotOffsetX || !child.inventorySlotOffsetY || !child.inventorySlotObjId || !child.inventorySlotObjCount) {
                            continue;
                        }

                        let slotX: number = childX + col * (child.inventoryMarginX + 32);
                        let slotY: number = childY + row * (child.inventoryMarginY + 32);

                        if (slot < 20) {
                            slotX += child.inventorySlotOffsetX[slot];
                            slotY += child.inventorySlotOffsetY[slot];
                        }

                        if (child.inventorySlotObjId[slot] > 0) {
                            let dx: number = 0;
                            let dy: number = 0;
                            const id: number = child.inventorySlotObjId[slot] - 1;

                            if ((slotX >= -32 && slotX <= 512 && slotY >= -32 && slotY <= 334) || (this.objDragArea != 0 && this.objDragSlot == slot)) {
                                const icon: Pix24 = ObjType.getIcon(id, child.inventorySlotObjCount[slot]);
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
                                    const count: number = child.inventorySlotObjCount[slot];
                                    this.fontPlain11?.drawString(slotX + dx + 1, slotY + 10 + dy, this.formatObjCount(count), 0);
                                    this.fontPlain11?.drawString(slotX + dx, slotY + 9 + dy, this.formatObjCount(count), 0xffff00);
                                }
                            }
                        } else if (child.inventorySlotImage != null && slot < 20) {
                            const image: {name: string; sprite: number} = child.inventorySlotImage[slot];

                            if (image != null && this.mediaArchive) {
                                const pix24: Pix24 = Pix24.fromArchive(this.mediaArchive, image.name, image.sprite);
                                pix24.draw(slotX, slotY);
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
                const font: PixFont | null = child.font;
                let color: number = child.color;
                let text: string | null = child.text;

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

                for (let lineY: number = childY + font.fontHeight; text.length > 0; lineY += font.fontHeight) {
                    if (text.indexOf('%') != -1) {
                        do {
                            const index: number = text.indexOf('%1');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 0)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%2');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 1)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%3');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 2)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%4');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 3)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%5');
                            if (index == -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 4)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);
                    }

                    const newline: number = text.indexOf('\\n');
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
                let image: {name: string; sprite: number} | null;
                if (this.executeInterfaceScript(child)) {
                    image = child.activeImage;
                } else {
                    image = child.image;
                }

                if (image != null && this.mediaArchive) {
                    const pix24: Pix24 = Pix24.fromArchive(this.mediaArchive, image.name, image.sprite);
                    pix24.draw(childX, childY);
                }
            } else if (child.type == 6) {
                const tmpX: number = Draw3D.centerX;
                const tmpY: number = Draw3D.centerY;

                Draw3D.centerX = childX + child.width / 2;
                Draw3D.centerY = childY + child.height / 2;

                const eyeY: number = (Draw3D.sin[child.modelPitch] * child.modelZoom) >> 16;
                const eyeZ: number = (Draw3D.cos[child.modelPitch] * child.modelZoom) >> 16;

                const active: boolean = this.executeInterfaceScript(child);
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
                    const seq: SeqType = SeqType.instances[seqId];
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
                const font: PixFont | null = child.font;
                if (!font || !child.inventorySlotObjId || !child.inventorySlotObjCount) {
                    continue;
                }

                let slot: number = 0;
                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (child.inventorySlotObjId[slot] > 0) {
                            const obj: ObjType = ObjType.get(child.inventorySlotObjId[slot] - 1);
                            let text: string | null = obj.name;
                            if (obj.stackable || child.inventorySlotObjCount[slot] != 1) {
                                text = text + ' x' + this.formatObjCountTagged(child.inventorySlotObjCount[slot]);
                            }

                            if (!text) {
                                continue;
                            }

                            const textX: number = childX + col * (child.inventoryMarginX + 115);
                            const textY: number = childY + row * (child.inventoryMarginY + 12);

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

        Draw2D.setBounds(left, top, right, bottom);
    };

    private drawMinimap = (): void => {
        // TODO
    };

    private drawMenu = (): void => {
        const x: number = this.menuX;
        const y: number = this.menuY;
        const w: number = this.menuWidth;
        const h: number = this.menuHeight;
        const background: number = 0x5d5447;
        Draw2D.fillRect(x, y, w, h, background);
        Draw2D.fillRect(x + 1, y + 1, w - 2, 16, 0);
        Draw2D.drawRect(x + 1, y + 18, w - 2, h - 19, 0);

        this.fontBold12?.drawString(x + 3, y + 14, 'Choose Option', background);
        let mouseX: number = this.mouseX;
        let mouseY: number = this.mouseY;
        if (this.menuArea == 0) {
            mouseX -= 8;
            mouseY -= 11;
        }
        if (this.menuArea === 1) {
            mouseX -= 562;
            mouseY -= 231;
        }
        if (this.menuArea === 2) {
            mouseX -= 22;
            mouseY -= 375;
        }

        for (let i: number = 0; i < this.menuSize; i++) {
            const optionY: number = y + (this.menuSize - 1 - i) * 15 + 31;
            let rgb: number = 0xffffff;
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
            let gripSize: number = ((height - 32) * height) / scrollableHeight;
            if (gripSize < 8) {
                gripSize = 8;
            }
            const gripY: number = mouseY - top - gripSize / 2 - 16;
            const maxY: number = height - gripSize - 32;
            component.scrollPosition = ((scrollableHeight - height) * gripY) / maxY;
            if (redraw) {
                this.redrawSidebar = true;
            }
            this.scrollGrabbed = true;
        }
    };

    private prepareGameScreen = (): void => {
        if (this.areaChatback === null) {
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
            const canvas: HTMLCanvasElement = this.canvas;
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
        let s: string = String(amount);
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
        if (!component.scripts || scriptId >= component.scripts.length) {
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

        for (let i: number = 0; i < com.scriptComparator.length; i++) {
            const value: number = this.executeClientscript1(com, i);
            const operand: number = com.scriptOperand[i];

            if (com.scriptComparator[i] === 2) {
                if (value >= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] === 3) {
                if (value <= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] === 4) {
                if (value === operand) {
                    return false;
                }
            } else if (value !== operand) {
                return false;
            }
        }

        return true;
    };

    private updateInterfaceContent = (component: ComType): void => {
        // TODO
    };

    private tryReconnect = async (): Promise<void> => {
        if (this.idleTimeout > 0) {
            this.logout();
        } else {
            this.areaViewport?.bind();
            this.fontPlain12?.drawStringCenter(257, 144, 'Connection lost', 0);
            this.fontPlain12?.drawStringCenter(256, 143, 'Connection lost', 16777215);
            this.fontPlain12?.drawStringCenter(257, 159, 'Please wait - attempting to reestablish', 0);
            this.fontPlain12?.drawStringCenter(256, 158, 'Please wait - attempting to reestablish', 16777215);
            this.areaViewport?.draw(8, 11);
            this.flagSceneTileX = 0;
            const stream: ClientStream | null = this.stream;
            this.ingame = false;
            await this.login(this.username, this.password, true);
            if (!this.ingame) {
                this.logout();
            }
            stream?.close();
        }
    };

    private logout = (): void => {
        if (this.stream !== null) {
            this.stream.close();
        }

        this.stream = null;
        this.ingame = false;
        this.titleScreenState = 0;
        this.username = '';
        this.password = '';

        // InputTracking.setDisabled();
        // this.clearCaches();
        this.scene?.reset();

        // for (let level = 0; level < 4; level++) {
        //     this.levelCollisionMap[level].reset();
        // }

        // this.stopMidi();
        // this.currentMidi = null;
        // this.nextMusicDelay = 0;
    };

    private read = async (): Promise<boolean> => {
        if (this.stream == null) {
            return false;
        }

        try {
            let available: number = this.stream.available;
            if (available === 0) {
                return false;
            }

            if (this.packetType == -1) {
                await this.stream.readBytes(this.in.data, 0, 1);
                this.packetType = this.in.data[0] & 0xff;
                if (this.randomIn != null) {
                    this.packetType = (this.packetType - this.randomIn.nextInt) & 0xff;
                }
                this.packetSize = Protocol.SERVERPROT_SIZES[this.packetType];
                available--;
            }

            if (this.packetSize == -1) {
                if (available <= 0) {
                    return false;
                }

                await this.stream.readBytes(this.in.data, 0, 1);
                this.packetSize = this.in.data[0] & 0xff;
                available--;
            }

            if (this.packetSize == -2) {
                if (available <= 1) {
                    return false;
                }

                await this.stream.readBytes(this.in.data, 0, 2);
                this.in.pos = 0;
                this.packetSize = this.in.g2;
                available -= 2;
            }

            if (available < this.packetSize) {
                return false;
            }

            this.in.pos = 0;
            await this.stream.readBytes(this.in.data, 0, this.packetSize);
            this.idleNetCycles = 0;
            this.lastPacketType2 = this.lastPacketType1;
            this.lastPacketType1 = this.lastPacketType0;
            this.lastPacketType0 = this.packetType;

            console.log(`Incoming packet: ${this.packetType}`);

            if (this.packetType == 150) {
                // VARP_SMALL
                const varp: number = this.in.g2;
                const value: number = this.in.g1b;
                this.varCache[varp] = value;
                if (this.varps[varp] != value) {
                    this.varps[varp] = value;
                    this.updateVarp(varp);
                    this.redrawSidebar = true;
                    if (this.stickyChatInterfaceId != -1) {
                        this.redrawChatback = true;
                    }
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 152) {
                // UPDATE_FRIENDLIST
                const username: bigint = this.in.g8;
                const world: number = this.in.g1;
                const displayName: string = JString.formatName(JString.fromBase37(username));
                // for (int i = 0; i < this.friendCount; i++) {
                //     if (username == this.friendName37[i]) {
                //         if (this.friendWorld[i] != world) {
                //             this.friendWorld[i] = world;
                //             this.redrawSidebar = true;
                //             if (world > 0) {
                //                 this.addMessage(5, displayName + " has logged in.", "");
                //             }
                //             if (world == 0) {
                //                 this.addMessage(5, displayName + " has logged out.", "");
                //             }
                //         }
                //         displayName = null;
                //         break;
                //     }
                // }
                // if (displayName != null && this.friendCount < 100) {
                //     this.friendName37[this.friendCount] = username;
                //     this.friendName[this.friendCount] = displayName;
                //     this.friendWorld[this.friendCount] = world;
                //     this.friendCount++;
                //     this.redrawSidebar = true;
                // }
                // @Pc(315) boolean sorted = false;
                //     while (!sorted) {
                //         sorted = true;
                //         for (int i = 0; i < this.friendCount - 1; i++) {
                //             if (this.friendWorld[i] != nodeId && this.friendWorld[i + 1] == nodeId || this.friendWorld[i] == 0 && this.friendWorld[i + 1] != 0) {
                //                 int oldWorld = this.friendWorld[i];
                //                 this.friendWorld[i] = this.friendWorld[i + 1];
                //                 this.friendWorld[i + 1] = oldWorld;
                //
                //             @Pc(376) String oldName = this.friendName[i];
                //                 this.friendName[i] = this.friendName[i + 1];
                //                 this.friendName[i + 1] = oldName;
                //
                //             @Pc(398) long oldName37 = this.friendName37[i];
                //                 this.friendName37[i] = this.friendName37[i + 1];
                //                 this.friendName37[i + 1] = oldName37;
                //                 this.redrawSidebar = true;
                //                 sorted = false;
                //             }
                //         }
                //     }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 43) {
                // UPDATE_REBOOT_TIMER
                this.systemUpdateTimer = this.in.g2 * 30;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 80) {
                // DATA_LAND_DONE
                const x: number = this.in.g1;
                const z: number = this.in.g1;
                // let index = -1;
                // for (int i = 0; i < this.sceneMapIndex.length; i++) {
                //     if (this.sceneMapIndex[i] == (x << 8) + z) {
                //         index = i;
                //     }
                // }
                // if (index != -1) {
                //     signlink.cachesave("m" + x + "_" + z, this.sceneMapLandData[index]);
                //     this.sceneState = 1;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 1) {
                // NPC_INFO
                // this.readNpcInfo(this.in, this.packetSize);
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 237) {
                // LOAD_AREA
                const zoneX: number = this.in.g2;
                const zoneZ: number = this.in.g2;

                if (this.sceneCenterZoneX === zoneX && this.sceneCenterZoneZ === zoneZ && this.sceneState !== 0) {
                    this.packetType = -1;
                    return true;
                }
                this.sceneCenterZoneX = zoneX;
                this.sceneCenterZoneZ = zoneZ;
                this.sceneBaseTileX = (this.sceneCenterZoneX - 6) * 8;
                this.sceneBaseTileZ = (this.sceneCenterZoneZ - 6) * 8;
                this.sceneState = 1;
                this.areaViewport?.bind();
                this.fontPlain12?.drawStringCenter(257, 151, 'Loading - please wait.', 0);
                this.fontPlain12?.drawStringCenter(256, 150, 'Loading - please wait.', 16777215);
                this.areaViewport?.draw(8, 11);
                this.setLoopRate(5);

                const regions: number = (this.packetSize - 2) / 10;

                this.sceneMapLandData = [];
                this.sceneMapLocData = [];
                this.sceneMapIndex = [];

                this.out.p1isaac(150);
                this.out.p1(0);

                let mapCount: number = 0;

                for (let i: number = 0; i < regions; i++) {
                    const mapsquareX: number = this.in.g1;
                    const mapsquareZ: number = this.in.g1;
                    const landCrc: number = this.in.g4;
                    const locCrc: number = this.in.g4;
                    this.sceneMapIndex[i] = (mapsquareX << 8) + mapsquareZ;

                    if (landCrc != 0) {
                        // TODO
                        let data: Uint8Array | null = null; // await downloadUrl(`https://2004scape.org:8080/m${mapsquareX}_${mapsquareZ}`);
                        // data = signlink.cacheload("m" + mapsquareX + "_" + mapsquareZ);
                        if (data) {
                            if (Packet.crc32(data) !== landCrc) {
                                data = null;
                            }
                            // this.crc32.reset();
                            // this.crc32.update(data);
                            // if (this.crc32.getValue() != landCrc) {
                            //     data = null;
                            // }
                        }
                        if (!data) {
                            this.sceneState = 0;
                            this.out.p1(0);
                            this.out.p1(mapsquareX);
                            this.out.p1(mapsquareZ);
                            mapCount += 3;
                        } else {
                            // this.sceneMapLandData[i] = data;
                        }
                    }
                }

                //     if (this.sceneCenterZoneX == zoneX && this.sceneCenterZoneZ == zoneZ && this.sceneState != 0) {
                //         this.packetType = -1;
                //         return true;
                //     }
                //     this.sceneCenterZoneX = zoneX;
                //     this.sceneCenterZoneZ = zoneZ;
                //     this.sceneBaseTileX = (this.sceneCenterZoneX - 6) * 8;
                //     this.sceneBaseTileZ = (this.sceneCenterZoneZ - 6) * 8;
                //     this.sceneState = 1;
                //     this.areaViewport?.bind();
                //     this.fontPlain12?.drawStringCenter(257, 151, "Loading - please wait.", 0);
                //     this.fontPlain12?.drawStringCenter(256, 150, "Loading - please wait.", 16777215);
                //     this.areaViewport?.draw(super.graphics, 8, 11);
                //     signlink.looprate(5);
                //     int regions = (this.packetSize - 2) / 10;
                //     this.sceneMapLandData = new byte[regions][];
                //     this.sceneMapLocData = new byte[regions][];
                //     this.sceneMapIndex = new int[regions];
                //     this.out.p1isaac(150);
                //     this.out.p1(0);
                //     int mapCount = 0;
                //     for (int i = 0; i < regions; i++) {
                //         int mapsquareX = this.in.g1;
                //         int mapsquareZ = this.in.g1;
                //         int landCrc = this.in.g4;
                //         int locCrc = this.in.g4;
                //         this.sceneMapIndex[i] = (mapsquareX << 8) + mapsquareZ;
                //     @Pc(686) byte[] data;
                //         if (landCrc != 0) {
                //             data = signlink.cacheload("m" + mapsquareX + "_" + mapsquareZ);
                //             if (data != null) {
                //                 this.crc32.reset();
                //                 this.crc32.update(data);
                //                 if ((int) this.crc32.getValue() != landCrc) {
                //                     data = null;
                //                 }
                //             }
                //             if (data == null) {
                //                 this.sceneState = 0;
                //                 this.out.p1(0);
                //                 this.out.p1(mapsquareX);
                //                 this.out.p1(mapsquareZ);
                //                 mapCount += 3;
                //             } else {
                //                 this.sceneMapLandData[i] = data;
                //             }
                //         }
                //         if (locCrc != 0) {
                //             data = signlink.cacheload("l" + mapsquareX + "_" + mapsquareZ);
                //             if (data != null) {
                //                 this.crc32.reset();
                //                 this.crc32.update(data);
                //                 if ((int) this.crc32.getValue() != locCrc) {
                //                     data = null;
                //                 }
                //             }
                //             if (data == null) {
                //                 this.sceneState = 0;
                //                 this.out.p1(1);
                //                 this.out.p1(mapsquareX);
                //                 this.out.p1(mapsquareZ);
                //                 mapCount += 3;
                //             } else {
                //                 this.sceneMapLocData[i] = data;
                //             }
                //         }
                //     }
                //     this.out.psize1(mapCount);
                //     signlink.looprate(50);
                //     this.areaViewport.bind();
                //     if (this.sceneState == 0) {
                //         this.fontPlain12.drawStringCenter(257, 166, "Map area updated since last visit, so load will take longer this time only", 0);
                //         this.fontPlain12.drawStringCenter(256, 165, "Map area updated since last visit, so load will take longer this time only", 16777215);
                //     }
                //     this.areaViewport.draw(super.graphics, 8, 11);
                //     int dx = this.sceneBaseTileX - this.mapLastBaseX;
                //     int dz = this.sceneBaseTileZ - this.mapLastBaseZ;
                //     this.mapLastBaseX = this.sceneBaseTileX;
                //     this.mapLastBaseZ = this.sceneBaseTileZ;
                //     for (int i = 0; i < 8192; i++) {
                //     @Pc(856) NpcEntity npc = this.npcs[i];
                //         if (npc != null) {
                //             for (@Pc(860) int j = 0; j < 10; j++) {
                //                 npc.pathTileX[j] -= dx;
                //                 npc.pathTileZ[j] -= dz;
                //             }
                //             npc.x -= dx * 128;
                //             npc.z -= dz * 128;
                //         }
                //     }
                //     for (int i = 0; i < this.MAX_PLAYER_COUNT; i++) {
                //     @Pc(911) PlayerEntity player = this.players[i];
                //         if (player != null) {
                //             for (@Pc(915) int j = 0; j < 10; j++) {
                //                 player.pathTileX[j] -= dx;
                //                 player.pathTileZ[j] -= dz;
                //             }
                //             player.x -= dx * 128;
                //             player.z -= dz * 128;
                //         }
                //     }
                // @Pc(960) byte startTileX = 0;
                // @Pc(962) byte endTileX = 104;
                // @Pc(964) byte dirX = 1;
                //     if (dx < 0) {
                //         startTileX = 103;
                //         endTileX = -1;
                //         dirX = -1;
                //     }
                // @Pc(974) byte startTileZ = 0;
                // @Pc(976) byte endTileZ = 104;
                // @Pc(978) byte dirZ = 1;
                //     if (dz < 0) {
                //         startTileZ = 103;
                //         endTileZ = -1;
                //         dirZ = -1;
                //     }
                //     for (@Pc(988) int x = startTileX; x != endTileX; x += dirX) {
                //         for (@Pc(992) int z = startTileZ; z != endTileZ; z += dirZ) {
                //         @Pc(998) int lastX = x + dx;
                //         @Pc(1002) int lastZ = z + dz;
                //             for (@Pc(1004) int level = 0; level < 4; level++) {
                //                 if (lastX >= 0 && lastZ >= 0 && lastX < 104 && lastZ < 104) {
                //                     this.levelObjStacks[level][x][z] = this.levelObjStacks[level][lastX][lastZ];
                //                 } else {
                //                     this.levelObjStacks[level][x][z] = null;
                //                 }
                //             }
                //         }
                //     }
                //     for (@Pc(1066) LocTemporary loc = (LocTemporary) this.spawnedLocations.peekFront(); loc != null; loc = (LocTemporary) this.spawnedLocations.prev()) {
                //         loc.x -= dx;
                //         loc.z -= dz;
                //         if (loc.x < 0 || loc.z < 0 || loc.x >= 104 || loc.z >= 104) {
                //             loc.unlink();
                //         }
                //     }
                //     if (this.flagSceneTileX != 0) {
                //         this.flagSceneTileX -= dx;
                //         this.flagSceneTileZ -= dz;
                //     }
                this.cutscene = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 197) {
                // IF_SETPLAYERHEAD
                const com: number = this.in.g2;
                // ComType.instances[com].model = this.localPlayer.getHeadModel();
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 25) {
                this.hintType = this.in.g1;
                if (this.hintType == 1) {
                    this.hintNpc = this.in.g2;
                }
                if (this.hintType >= 2 && this.hintType <= 6) {
                    if (this.hintType == 2) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 64;
                    }
                    if (this.hintType == 3) {
                        this.hintOffsetX = 0;
                        this.hintOffsetZ = 64;
                    }
                    if (this.hintType == 4) {
                        this.hintOffsetX = 128;
                        this.hintOffsetZ = 64;
                    }
                    if (this.hintType == 5) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 0;
                    }
                    if (this.hintType == 6) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 128;
                    }
                    this.hintType = 2;
                    this.hintTileX = this.in.g2;
                    this.hintTileZ = this.in.g2;
                    this.hintHeight = this.in.g1;
                }
                if (this.hintType == 10) {
                    this.hintPlayer = this.in.g2;
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 54) {
                // MIDI_SONG
                const name: string = this.in.gjstr;
                const crc: number = this.in.g4;
                const length: number = this.in.g4;
                // if (!name.equals(this.currentMidi) && this.midiActive && !lowMemory) {
                //     this.setMidi(name, crc, length);
                // }
                // this.currentMidi = name;
                // this.midiCrc = crc;
                // this.midiSize = length;
                // this.nextMusicDelay = 0;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 142) {
                // LOGOUT
                this.logout();
                this.packetType = -1;
                return false;
            }
            if (this.packetType == 20) {
                // DATA_LOC_DONE
                const x: number = this.in.g1;
                const z: number = this.in.g1;
                // let index: number = -1;
                // for (int i = 0; i < this.sceneMapIndex.length; i++) {
                //     if (this.sceneMapIndex[i] == (x << 8) + z) {
                //         index = i;
                //     }
                // }
                // if (index != -1) {
                //     signlink.cachesave("l" + x + "_" + z, this.sceneMapLocData[index]);
                //     this.sceneState = 1;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 19) {
                // CLEAR_WALKING_QUEUE
                this.flagSceneTileX = 0;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 139) {
                // UPDATE_UID192
                this.localPid = this.in.g2;
                this.packetType = -1;
                return true;
            }
            if (
                this.packetType == 151 ||
                this.packetType == 23 ||
                this.packetType == 50 ||
                this.packetType == 191 ||
                this.packetType == 69 ||
                this.packetType == 49 ||
                this.packetType == 223 ||
                this.packetType == 42 ||
                this.packetType == 76 ||
                this.packetType == 59
            ) {
                // Zone Protocol
                // this.readZonePacket(this.in, this.packetType);
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 28) {
                // IF_OPENMAINMODALSIDEOVERLAY
                const main: number = this.in.g2;
                const side: number = this.in.g2;
                if (this.chatInterfaceId != -1) {
                    this.chatInterfaceId = -1;
                    this.redrawChatback = true;
                }
                if (this.chatbackInputOpen) {
                    this.chatbackInputOpen = false;
                    this.redrawChatback = true;
                }
                this.viewportInterfaceID = main;
                this.sidebarInterfaceId = side;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.pressedContinueOption = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 175) {
                // VARP_LARGE
                const varp: number = this.in.g2;
                const value: number = this.in.g4;
                // this.varCache[varp] = value;
                // if (this.varps[varp] != value) {
                //     this.varps[varp] = value;
                //     this.updateVarp(varp);
                //     this.redrawSidebar = true;
                //     if (this.stickyChatInterfaceId != -1) {
                //         this.redrawChatback = true;
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 146) {
                // IF_SETANIM
                const com: number = this.in.g2;
                ComType.instances[com].seqId = this.in.g2;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 167) {
                // IF_SETTAB
                let com: number = this.in.g2;
                const tab: number = this.in.g1;
                if (com == 65535) {
                    com = -1;
                }
                this.tabInterfaceId[tab] = com;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 220) {
                // DATA_LOC
                const x: number = this.in.g1;
                const z: number = this.in.g1;
                const off: number = this.in.g2;
                const length: number = this.in.g2;
                // let index = -1;
                // for (int i = 0; i < this.sceneMapIndex.length; i++) {
                //     if (this.sceneMapIndex[i] == (x << 8) + z) {
                //         index = i;
                //     }
                // }
                // if (index != -1) {
                //     if (this.sceneMapLocData[index] == null || this.sceneMapLocData[index].length != length) {
                //         this.sceneMapLocData[index] = new byte[length];
                //     }
                //     this.in.gdata(this.packetSize - 6, off, this.sceneMapLocData[index]);
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 133) {
                // FINISH_TRACKING
                // const tracking = InputTracking.stop();
                // if (tracking != null) {
                //     this.out.p1isaac(81);
                //     this.out.p2(tracking.pos);
                //     this.out.pdata(tracking.data, tracking.pos, 0);
                //     tracking.release();
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 98) {
                // UPDATE_INV_FULL
                this.redrawSidebar = true;
                const com: number = this.in.g2;
                const inv: ComType = ComType.instances[com];
                const size: number = this.in.g1;
                // for (let i = 0; i < size; i++) {
                //     inv.inventorySlotObjId[i] = this.in.g2;
                //     let count = this.in.g1;
                //     if (count == 255) {
                //         count = this.in.g4;
                //     }
                //     inv.inventorySlotObjCount[i] = count;
                // }
                // for (let i = size; i < inv.inventorySlotObjId.length; i++) {
                //     inv.inventorySlotObjId[i] = 0;
                //     inv.inventorySlotObjCount[i] = 0;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 226) {
                // ENABLE_TRACKING
                // InputTracking.setEnabled();
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 243) {
                // IF_IAMOUNT
                this.showSocialInput = false;
                this.chatbackInputOpen = true;
                this.chatbackInput = '';
                this.redrawChatback = true;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 15) {
                // UPDATE_INV_STOP_TRANSMIT
                const com: number = this.in.g2;
                const inv: ComType = ComType.instances[com];
                // for (let i = 0; i < inv.inventorySlotObjId.length; i++) {
                //     inv.inventorySlotObjId[i] = -1;
                //     inv.inventorySlotObjId[i] = 0;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 140) {
                // LAST_LOGIN_INFO
                // this.lastAddress = this.in.g4;
                // this.daysSinceLastLogin = this.in.g2;
                // this.daysSinceRecoveriesChanged = this.in.g1;
                // this.unreadMessages = this.in.g2;
                // if (this.lastAddress != 0 && this.viewportInterfaceID == -1) {
                //     signlink.dnslookup(JString.formatIPv4(this.lastAddress));
                //     this.closeInterfaces();
                // @Pc(1915) short contentType = 650;
                //     if (this.daysSinceRecoveriesChanged != 201) {
                //         contentType = 655;
                //     }
                //     this.reportAbuseInput = "";
                //     this.reportAbuseMuteOption = false;
                //     for (int i = 0; i < ComType.instances.length; i++) {
                //         if (ComType.instances[i] != null && ComType.instances[i].contentType == contentType) {
                //             this.viewportInterfaceID = ComType.instances[i].parentId;
                //             break;
                //         }
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 126) {
                // IF_SETTAB_FLASH
                this.flashingTab = this.in.g1;
                if (this.flashingTab == this.selectedTab) {
                    if (this.flashingTab == 3) {
                        this.selectedTab = 1;
                    } else {
                        this.selectedTab = 3;
                    }
                    this.redrawSidebar = true;
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 212) {
                // MIDI_JINGLE
                // if (this.midiActive && !lowMemory) {
                //     int delay = this.in.g2;
                //     int length = this.in.g4;
                //     int remaining = this.packetSize - 6;
                // @Pc(2018) byte[] src = new byte[length];
                //     BZip2.read(src, length, this.in.data, remaining, this.in.pos);
                //     this.saveMidi(src, length, 0);
                //     this.nextMusicDelay = delay;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 254) {
                // IF_MULTIZONE
                this.inMultizone = this.in.g1;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 12) {
                // SYNTH_SOUND
                const id: number = this.in.g2;
                const loop: number = this.in.g1;
                const delay: number = this.in.g2;
                // if (this.waveEnabled && !lowMemory && this.waveCount < 50) {
                //     this.waveIds[this.waveCount] = id;
                //     this.waveLoops[this.waveCount] = loop;
                //     this.waveDelay[this.waveCount] = delay + Wave.delays[id];
                //     this.waveCount++;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 204) {
                // IF_SETNPCHEAD
                const com: number = this.in.g2;
                const npcId: number = this.in.g2;
                const npc: NpcType = NpcType.get(npcId);
                // ComType.instances[com].model = npc.getHeadModel();
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 7) {
                // UPDATE_ZONE_PARTIAL_FOLLOWS
                this.baseX = this.in.g1;
                this.baseZ = this.in.g1;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 103) {
                // IF_SETMODEL_COLOUR
                const com: number = this.in.g2;
                const src: number = this.in.g2;
                const dst: number = this.in.g2;
                const inter: ComType = ComType.instances[com];
                const model: Model | null = inter.model;
                if (model != null) {
                    model.recolor(src, dst);
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 32) {
                // CHAT_FILTER_SETTINGS
                this.publicChatSetting = this.in.g1;
                this.privateChatSetting = this.in.g1;
                this.tradeChatSetting = this.in.g1;
                this.redrawPrivacySettings = true;
                this.redrawChatback = true;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 195) {
                // IF_OPENSIDEOVERLAY
                const com: number = this.in.g2;
                this.resetInterfaceAnimation(com);
                if (this.chatInterfaceId != -1) {
                    this.chatInterfaceId = -1;
                    this.redrawChatback = true;
                }
                if (this.chatbackInputOpen) {
                    this.chatbackInputOpen = false;
                    this.redrawChatback = true;
                }
                this.sidebarInterfaceId = com;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.viewportInterfaceID = -1;
                this.pressedContinueOption = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 14) {
                // IF_OPENCHAT
                const com: number = this.in.g2;
                this.resetInterfaceAnimation(com);
                if (this.sidebarInterfaceId != -1) {
                    this.sidebarInterfaceId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }
                this.chatInterfaceId = com;
                this.redrawChatback = true;
                this.viewportInterfaceID = -1;
                this.pressedContinueOption = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 209) {
                // IF_SETPOSITION
                const com: number = this.in.g2;
                const x: number = this.in.g2b;
                const z: number = this.in.g2b;
                const inter: ComType = ComType.instances[com];
                inter.x = x;
                inter.y = z;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 3) {
                // CAM_LOOKAT
                this.cutscene = true;
                // this.cutsceneSrcLocalTileX = this.in.g1;
                // this.cutsceneSrcLocalTileZ = this.in.g1;
                // this.cutsceneSrcHeight = this.in.g2;
                // this.cutsceneMoveSpeed = this.in.g1;
                // this.cutsceneMoveAcceleration = this.in.g1;
                // if (this.cutsceneMoveAcceleration >= 100) {
                //     this.cameraX = this.cutsceneSrcLocalTileX * 128 + 64;
                //     this.cameraZ = this.cutsceneSrcLocalTileZ * 128 + 64;
                //     this.cameraY = this.getHeightmapY(this.currentLevel, this.cutsceneSrcLocalTileX, this.cutsceneSrcLocalTileZ) - this.cutsceneSrcHeight;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 135) {
                // UPDATE_ZONE_FULL_FOLLOWS
                this.baseX = this.in.g1;
                this.baseZ = this.in.g1;
                for (let x: number = this.baseX; x < this.baseX + 8; x++) {
                    for (let z: number = this.baseZ; z < this.baseZ + 8; z++) {
                        // if (this.levelObjStacks[this.currentLevel][x][z] != null) {
                        //     this.levelObjStacks[this.currentLevel][x][z] = null;
                        //     this.sortObjStacks(x, z);
                        // }
                    }
                }
                // for (@Pc(2487) LocTemporary loc = (LocTemporary) this.spawnedLocations.peekFront(); loc != null; loc = (LocTemporary) this.spawnedLocations.prev()) {
                //     if (loc.x >= this.baseX && loc.x < this.baseX + 8 && loc.z >= this.baseZ && loc.z < this.baseZ + 8 && loc.plane == this.currentLevel) {
                //         this.addLoc(loc.plane, loc.x, loc.z, loc.lastLocIndex, loc.lastAngle, loc.lastShape, loc.layer);
                //         loc.unlink();
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 132) {
                // DATA_LAND
                const x: number = this.in.g1;
                const z: number = this.in.g1;
                const offset: number = this.in.g2;
                const length: number = this.in.g2;
                // let index = -1;
                // for (let i = 0; i < this.sceneMapIndex.length; i++) {
                //     if (this.sceneMapIndex[i] == (x << 8) + z) {
                //         index = i;
                //     }
                // }
                // if (index != -1) {
                //     if (this.sceneMapLandData[index] == null || this.sceneMapLandData[index].length != length) {
                //         this.sceneMapLandData[index] = new byte[length];
                //     }
                //     this.in.gdata(this.packetSize - 6, offset, this.sceneMapLandData[index]);
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 41) {
                // MESSAGE_PRIVATE
                const from: bigint = this.in.g8;
                const messageId: number = this.in.g4;
                const staffModLevel: number = this.in.g1;
                // let ignored = false;
                //   for (let i = 0; i < 100; i++) {
                //       if (this.messageIds[i] == messageId) {
                //           ignored = true;
                //           break;
                //       }
                //   }
                //   if (staffModLevel <= 1) {
                //       for (let i = 0; i < this.ignoreCount; i++) {
                //           if (this.ignoreName37[i] == from) {
                //               ignored = true;
                //               break;
                //           }
                //       }
                //   }
                //   if (!ignored && this.overrideChat == 0) {
                //       try {
                //           this.messageIds[this.privateMessageCount] = messageId;
                //           this.privateMessageCount = (this.privateMessageCount + 1) % 100;
                //       @Pc(2721) String uncompressed = WordPack.unpack(this.in, this.packetSize - 13);
                //       @Pc(2725) String filtered = WordFilter.filter(uncompressed);
                //           if (staffModLevel > 1) {
                //               this.addMessage(7, filtered, JString.formatName(JString.fromBase37(from)));
                //           } else {
                //               this.addMessage(3, filtered, JString.formatName(JString.fromBase37(from)));
                //           }
                //       } catch (@Pc(2752) Exception ex) {
                //           signlink.reporterror("cde1");
                //       }
                //   }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 193) {
                // RESET_CLIENT_VARCACHE
                for (let i: number = 0; i < this.varps.length; i++) {
                    if (this.varps[i] != this.varCache[i]) {
                        this.varps[i] = this.varCache[i];
                        this.updateVarp(i);
                        this.redrawSidebar = true;
                    }
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 87) {
                // IF_SETMODEL
                const com: number = this.in.g2;
                const model: number = this.in.g2;
                ComType.instances[com].model = new Model(model);
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 185) {
                // IF_OPENCHATSTICKY
                this.stickyChatInterfaceId = this.in.g2b;
                this.redrawChatback = true;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 68) {
                // UPDATE_RUNENERGY
                if (this.selectedTab == 12) {
                    this.redrawSidebar = true;
                }
                this.energy = this.in.g1;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 74) {
                // CAM_MOVETO
                this.cutscene = true;
                // this.cutsceneDstLocalTileX = this.in.g1;
                // this.cutsceneDstLocalTileZ = this.in.g1;
                // this.cutsceneDstHeight = this.in.g2;
                // this.cutsceneRotateSpeed = this.in.g1;
                // this.cutsceneRotateAcceleration = this.in.g1;
                // if (this.cutsceneRotateAcceleration >= 100) {
                //     const sceneX = this.cutsceneDstLocalTileX * 128 + 64;
                //     const sceneZ = this.cutsceneDstLocalTileZ * 128 + 64;
                //     const sceneY = this.getHeightmapY(this.currentLevel, this.cutsceneDstLocalTileX, this.cutsceneDstLocalTileZ) - this.cutsceneDstHeight;
                //     const deltaX = sceneX - this.cameraX;
                //     const deltaY = sceneY - this.cameraY;
                //     const deltaZ = sceneZ - this.cameraZ;
                //     const distance = (int) Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
                //     this.cameraPitch = (int) (Math.atan2(deltaY, distance) * 325.949D) & 0x7FF;
                //     this.cameraYaw = (int) (Math.atan2(deltaX, deltaZ) * -325.949D) & 0x7FF;
                //     if (this.cameraPitch < 128) {
                //         this.cameraPitch = 128;
                //     }
                //     if (this.cameraPitch > 383) {
                //         this.cameraPitch = 383;
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 84) {
                // IF_SETTAB_ACTIVE
                this.selectedTab = this.in.g1;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 4) {
                // MESSAGE_GAME
                const message: string = this.in.gjstr;
                let username: bigint;
                if (message.endsWith(':tradereq:')) {
                    const player: string = message.substring(0, message.indexOf(':'));
                    username = JString.toBase37(player);
                    let ignored: boolean = false;
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] == username) {
                            ignored = true;
                            break;
                        }
                    }
                    if (!ignored && this.overrideChat == 0) {
                        this.addMessage(4, 'wishes to trade with you.', player);
                    }
                } else if (message.endsWith(':duelreq:')) {
                    const player: string = message.substring(0, message.indexOf(':'));
                    username = JString.toBase37(player);
                    let ignored: boolean = false;
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] == username) {
                            ignored = true;
                            break;
                        }
                    }
                    if (!ignored && this.overrideChat == 0) {
                        this.addMessage(8, 'wishes to duel with you.', player);
                    }
                } else {
                    this.addMessage(0, message, '');
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 46) {
                // IF_SETOBJECT
                const com: number = this.in.g2;
                const objId: number = this.in.g2;
                const zoom: number = this.in.g2;
                const obj: ObjType = ObjType.get(objId);
                // ComType.instances[com].model = obj.getInterfaceModel(50);
                ComType.instances[com].modelPitch = obj.xan2d;
                ComType.instances[com].modelYaw = obj.yan2d;
                ComType.instances[com].modelZoom = (obj.zoom2d * 100) / zoom;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 168) {
                // IF_OPENMAIN
                const com: number = this.in.g2;
                this.resetInterfaceAnimation(com);
                if (this.sidebarInterfaceId != -1) {
                    this.sidebarInterfaceId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }
                if (this.chatInterfaceId != -1) {
                    this.chatInterfaceId = -1;
                    this.redrawChatback = true;
                }
                if (this.chatbackInputOpen) {
                    this.chatbackInputOpen = false;
                    this.redrawChatback = true;
                }
                this.viewportInterfaceID = com;
                this.pressedContinueOption = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 2) {
                // IF_SETCOLOUR
                const com: number = this.in.g2;
                const color: number = this.in.g2;
                const r: number = (color >> 10) & 0x1f;
                const g: number = (color >> 5) & 0x1f;
                const b: number = color & 0x1f;
                ComType.instances[com].color = (r << 19) + (g << 11) + (b << 3);
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 136) {
                // RESET_ANIMS
                // for (let i = 0; i < this.players.length; i++) {
                //     if (this.players[i] != null) {
                //         this.players[i].primarySeqId = -1;
                //     }
                // }
                // for (let i = 0; i < this.npcs.length; i++) {
                //     if (this.npcs[i] != null) {
                //         this.npcs[i].primarySeqId = -1;
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 26) {
                // IF_SETHIDE
                const com: number = this.in.g2;
                ComType.instances[com].hide = this.in.g1 == 1;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 21) {
                // UPDATE_IGNORELIST
                // this.ignoreCount = this.packetSize / 8;
                // for (int i = 0; i < this.ignoreCount; i++) {
                //     this.ignoreName37[i] = this.in.g8;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 239) {
                // CAM_RESET
                this.cutscene = false;
                // for (let i = 0; i < 5; i++) {
                //     this.cameraModifierEnabled[i] = false;
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 129) {
                // IF_CLOSE
                if (this.sidebarInterfaceId != -1) {
                    this.sidebarInterfaceId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }
                if (this.chatInterfaceId != -1) {
                    this.chatInterfaceId = -1;
                    this.redrawChatback = true;
                }
                if (this.chatbackInputOpen) {
                    this.chatbackInputOpen = false;
                    this.redrawChatback = true;
                }
                this.viewportInterfaceID = -1;
                this.pressedContinueOption = false;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 201) {
                // IF_SETTEXT
                const com: number = this.in.g2;
                ComType.instances[com].text = this.in.gjstr;
                if (ComType.instances[com].parentId == this.tabInterfaceId[this.selectedTab]) {
                    this.redrawSidebar = true;
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 44) {
                // UPDATE_STAT
                this.redrawSidebar = true;
                const stat: number = this.in.g1;
                const xp: number = this.in.g4;
                const level: number = this.in.g1;
                this.skillExperience[stat] = xp;
                this.skillLevel[stat] = level;
                this.skillBaseLevel[stat] = 1;
                for (let i: number = 0; i < 98; i++) {
                    if (xp >= this.levelExperience[i]) {
                        this.skillBaseLevel[stat] = i + 2;
                    }
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 162) {
                // UPDATE_ZONE_PARTIAL_ENCLOSED
                this.baseX = this.in.g1;
                this.baseZ = this.in.g1;
                while (this.in.pos < this.packetSize) {
                    const opcode: number = this.in.g1;
                    // this.readZonePacket(this.in, opcode);
                }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 22) {
                // UPDATE_RUNWEIGHT
                if (this.selectedTab == 12) {
                    this.redrawSidebar = true;
                }
                this.weightCarried = this.in.g2b;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 13) {
                // CAM_SHAKE
                const type: number = this.in.g1;
                const jitter: number = this.in.g1;
                const wobbleScale: number = this.in.g1;
                const wobbleSpeed: number = this.in.g1;
                // this.cameraModifierEnabled[type] = true;
                // this.cameraModifierJitter[type] = jitter;
                // this.cameraModifierWobbleScale[type] = wobbleScale;
                // this.cameraModifierWobbleSpeed[type] = wobbleSpeed;
                // this.cameraModifierCycle[type] = 0;
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 213) {
                // UPDATE_INV_PARTIAL
                this.redrawSidebar = true;
                const com: number = this.in.g2;
                const inv: ComType = ComType.instances[com];
                // while (this.in.pos < this.packetSize) {
                //     const slot = this.in.g1;
                //     const id = this.in.g2;
                //     let count = this.in.g1;
                //     if (count == 255) {
                //         count = this.in.g4;
                //     }
                //     if (slot >= 0 && slot < inv.inventorySlotObjId.length) {
                //         inv.inventorySlotObjId[slot] = id;
                //         inv.inventorySlotObjCount[slot] = count;
                //     }
                // }
                this.packetType = -1;
                return true;
            }
            if (this.packetType == 184) {
                // PLAYER_INFO
                // this.readPlayerInfo(this.in, this.packetSize);
                if (this.sceneState == 1) {
                    this.sceneState = 2;
                    // World.levelBuilt = this.currentLevel;
                    // this.buildScene();
                }
                if (Client.LOW_MEMORY && this.sceneState == 2 /* && World.levelBuilt != this.currentLevel*/) {
                    this.areaViewport?.bind();
                    this.fontPlain12?.drawStringCenter(257, 151, 'Loading - please wait.', 0);
                    this.fontPlain12?.drawStringCenter(256, 150, 'Loading - please wait.', 16777215);
                    this.areaViewport?.draw(8, 11);
                    // World.levelBuilt = this.currentLevel;
                    // this.buildScene();
                }
                // if (this.currentLevel != this.minimapLevel && this.sceneState == 2) {
                //     this.minimapLevel = this.currentLevel;
                //     this.createMinimap(this.currentLevel);
                // }
                this.packetType = -1;
                return true;
            }
            this.logout();
        } catch (e) {
            console.log(e);
            await this.tryReconnect();
            // TODO extra logic for logout??
        }
        return true;
    };

    private resetInterfaceAnimation = (id: number): void => {
        const parent: ComType = ComType.instances[id];
        if (!parent.childId) {
            return;
        }
        for (let i: number = 0; i < parent.childId.length && parent.childId[i] != -1; i++) {
            const child: ComType = ComType.instances[parent.childId[i]];
            if (child.type == 1) {
                this.resetInterfaceAnimation(child.id);
            }
            child.seqFrame = 0;
            child.seqCycle = 0;
        }
    };

    private initializeLevelExperience = (): void => {
        let acc: number = 0;
        for (let i: number = 0; i < 99; i++) {
            const level: number = i + 1;
            const delta: number = Math.floor((level + Math.pow(2.0, level / 7.0)) * 300.0);
            acc += delta;
            this.levelExperience[i] = Math.floor(acc / 4);
        }
    };

    private addMessage = (type: number, text: string, sender: string): void => {
        console.log(`${type}, ${text}, ${sender}, ${this.stickyChatInterfaceId}`);
        if (type == 0 && this.stickyChatInterfaceId != -1) {
            this.modalMessage = text;
            this.mouseClickButton = 0;
        }
        if (this.chatInterfaceId == -1) {
            this.redrawChatback = true;
        }
        for (let i: number = 99; i > 0; i--) {
            this.messageType[i] = this.messageType[i - 1];
            this.messageSender[i] = this.messageSender[i - 1];
            this.messageText[i] = this.messageText[i - 1];
        }
        this.messageType[0] = type;
        this.messageSender[0] = sender;
        this.messageText[0] = text;
    };

    private updateVarp = (id: number): void => {
        const clientcode: number = VarpType.instances[id].clientcode;
        if (clientcode != 0) {
            const value: number = this.varps[id];
            if (clientcode == 1) {
                if (value == 1) {
                    Draw3D.setBrightness(0.9);
                }
                if (value == 2) {
                    Draw3D.setBrightness(0.8);
                }
                if (value == 3) {
                    Draw3D.setBrightness(0.7);
                }
                if (value == 4) {
                    Draw3D.setBrightness(0.6);
                }
                //TODO obj sprite cache
                //ObjType.iconCache.clear();
                this.redrawTitleBackground = true;
            }
            if (clientcode == 3) {
                //TODO midi states
                //var lastMidiActive: boolean = this.midiActive;
                // if (value == 0) {
                //     this.setMidiVolume(0);
                //     this.midiActive = true;
                // }
                // if (value == 1) {
                //     this.setMidiVolume(-400);
                //     this.midiActive = true;
                // }
                // if (value == 2) {
                //     this.setMidiVolume(-800);
                //     this.midiActive = true;
                // }
                // if (value == 3) {
                //     this.setMidiVolume(-1200);
                //     this.midiActive = true;
                // }
                // if (value == 4) {
                //     this.midiActive = false;
                // }
                // if (this.midiActive != lastMidiActive) {
                //     if (this.midiActive) {
                //         this.setMidi(this.currentMidi, this.midiCrc, this.midiSize);
                //     } else {
                //         this.stopMidi();
                //     }
                //     this.nextMusicDelay = 0;
                // }
            }
            if (clientcode == 4) {
                //TODO wave states
                // if (value == 0) {
                //     this.waveEnabled = true;
                //     this.setWaveVolume = 0;
                // }
                // if (value == 1) {
                //     this.waveEnabled = true;
                //     this.setWaveVolume = -400;
                // }
                // if (value == 2) {
                //     this.waveEnabled = true;
                //     this.setWaveVolume = -800;
                // }
                // if (value == 3) {
                //     this.waveEnabled = true;
                //     this.setWaveVolume = -1200;
                // }
                // if (value == 4) {
                //     this.waveEnabled = false;
                // }
            }
            if (clientcode == 5) {
                //TODO mouseButtonOption
                //this.mouseButtonOption = value;
            }
            if (clientcode == 6) {
                //TODO chatEffects
                //this.chatEffects = value;
            }
            if (clientcode == 8) {
                this.splitPrivateChat = value;
                this.redrawChatback = true;
            }
        }
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
        let retry: number = 5;
        let data: Int8Array | undefined = await this.db?.cacheload(filename);
        if (data && Packet.crc32(data) !== crc) {
            data = undefined;
        }

        if (data) {
            return new Jagfile(Uint8Array.from(data));
        }

        while (!data) {
            await this.showProgress(progress, `Requesting ${displayName}`);

            try {
                data = await downloadUrl(`${Client.HOST}/${filename}${crc}`);
            } catch (e) {
                data = undefined;
                for (let i: number = retry; i > 0; i--) {
                    await this.showProgress(progress, `Error loading - Will retry in ${i} secs.`);
                    await sleep(1000);
                }
                retry *= 2;
                if (retry > 60) {
                    retry = 60;
                }
            }
        }
        await this.db?.cachesave(filename, data);
        return new Jagfile(Uint8Array.from(data));
    };

    private setMidi = async (name: string, crc: number): Promise<void> => {
        const file: Packet = new Packet(Uint8Array.from(await downloadUrl(`${Client.HOST}/${name.replaceAll(' ', '_')}_${crc}.mid`)));
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

            let y: number = 35;
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

            let y: number = 35;
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
        const height: number = 256;

        for (let x: number = 10; x < 117; x++) {
            const rand: number = Math.trunc(Math.random() * 100.0);
            if (rand < 50) this.flameBuffer3[x + ((height - 2) << 7)] = 255;
        }

        for (let l: number = 0; l < 100; l++) {
            const x: number = Math.trunc(Math.random() * 124.0 + 2);
            const y: number = Math.trunc(Math.random() * 128.0 + 128);
            const index: number = x + (y << 7);
            this.flameBuffer3[index] = 192;
        }

        for (let y: number = 1; y < height - 1; y++) {
            for (let x: number = 1; x < 127; x++) {
                const index: number = x + (y << 7);
                this.flameBuffer2[index] = ((this.flameBuffer3[index - 1] + this.flameBuffer3[index + 1] + this.flameBuffer3[index - 128] + this.flameBuffer3[index + 128]) / 4) | 0;
            }
        }

        this.flameCycle0 += 128;
        if (this.flameCycle0 > 32768) {
            this.flameCycle0 -= 32768;
            const rand: number = Math.trunc(Math.random() * 12.0);
            this.updateFlameBuffer(this.imageRunes[rand]);
        }

        for (let y: number = 1; y < height - 1; y++) {
            for (let x: number = 1; x < 127; x++) {
                const index: number = x + (y << 7);
                let intensity: number = (this.flameBuffer2[index + 128] - this.flameBuffer0[(index + this.flameCycle0) & (32768 - 1)] / 5) | 0;
                if (intensity < 0) {
                    intensity = 0;
                }
                this.flameBuffer3[index] = intensity;
            }
        }

        for (let y: number = 0; y < height - 1; y++) {
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
            const rand: number = Math.trunc(Math.random() * 2000.0);

            if (rand == 0) {
                this.flameGradientCycle0 = 1024;
            } else if (rand == 1) {
                this.flameGradientCycle1 = 1024;
            }
        }
    };

    private mix = (src: number, alpha: number, dst: number): number => {
        const invAlpha: number = 256 - alpha;
        return ((((src & 0xff00ff) * invAlpha + (dst & 0xff00ff) * alpha) & 0xff00ff00) + (((src & 0xff00) * invAlpha + (dst & 0xff00) * alpha) & 0xff0000)) >> 8;
    };

    private drawFlames = (): void => {
        const height: number = 256;

        // just colors
        if (this.flameGradientCycle0 > 0) {
            for (let i: number = 0; i < 256; i++) {
                if (this.flameGradientCycle0 > 768) {
                    this.flameGradient[i] = this.mix(this.flameGradient0[i], 1024 - this.flameGradientCycle0, this.flameGradient1[i]);
                } else if (this.flameGradientCycle0 > 256) {
                    this.flameGradient[i] = this.flameGradient1[i];
                } else {
                    this.flameGradient[i] = this.mix(this.flameGradient1[i], 256 - this.flameGradientCycle0, this.flameGradient0[i]);
                }
            }
        } else if (this.flameGradientCycle1 > 0) {
            for (let i: number = 0; i < 256; i++) {
                if (this.flameGradientCycle1 > 768) {
                    this.flameGradient[i] = this.mix(this.flameGradient0[i], 1024 - this.flameGradientCycle1, this.flameGradient2[i]);
                } else if (this.flameGradientCycle1 > 256) {
                    this.flameGradient[i] = this.flameGradient2[i];
                } else {
                    this.flameGradient[i] = this.mix(this.flameGradient2[i], 256 - this.flameGradientCycle1, this.flameGradient0[i]);
                }
            }
        } else {
            for (let i: number = 0; i < 256; i++) {
                this.flameGradient[i] = this.flameGradient0[i];
            }
        }
        for (let i: number = 0; i < 33920; i++) {
            if (this.imageTitle0 && this.imageFlamesLeft) this.imageTitle0.pixels[i] = this.imageFlamesLeft.pixels[i];
        }

        let srcOffset: number = 0;
        let dstOffset: number = 1152;

        for (let y: number = 1; y < height - 1; y++) {
            const offset: number = ((this.flameLineOffset[y] * (height - y)) / height) | 0;
            let step: number = offset + 22;
            if (step < 0) {
                step = 0;
            }
            srcOffset += step;
            for (let x: number = step; x < 128; x++) {
                let value: number = this.flameBuffer3[srcOffset++] | 0;
                if (value == 0) {
                    dstOffset++;
                } else {
                    const alpha: number = value;
                    const invAlpha: number = 256 - value;
                    value = this.flameGradient[value];
                    if (this.imageTitle0) {
                        const background: number = this.imageTitle0.pixels[dstOffset];
                        this.imageTitle0.pixels[dstOffset++] = ((((value & 0xff00ff) * alpha + (background & 0xff00ff) * invAlpha) & 0xff00ff00) + (((value & 0xff00) * alpha + (background & 0xff00) * invAlpha) & 0xff0000)) >> 8;
                    }
                }
            }
            dstOffset += step;
        }

        this.imageTitle0?.draw(0, 0);

        for (let i: number = 0; i < 33920; i++) {
            if (this.imageTitle1 && this.imageFlamesRight) {
                this.imageTitle1.pixels[i] = this.imageFlamesRight.pixels[i];
            }
        }

        srcOffset = 0;
        dstOffset = 1176;
        for (let y: number = 1; y < height - 1; y++) {
            const offset: number = ((this.flameLineOffset[y] * (height - y)) / height) | 0;
            const step: number = 103 - offset;
            dstOffset += offset;
            for (let x: number = 0; x < step; x++) {
                let value: number = this.flameBuffer3[srcOffset++] | 0;
                if (value == 0) {
                    dstOffset++;
                } else {
                    const alpha: number = value;
                    const invAlpha: number = 256 - value;
                    value = this.flameGradient[value];
                    if (this.imageTitle1) {
                        const background: number = this.imageTitle1.pixels[dstOffset];
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

new Client().run().then((): void => {});
