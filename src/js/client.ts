import ComType from './jagex2/config/ComType';

import PixMap from './jagex2/graphics/PixMap';
import Draw3D from './jagex2/graphics/Draw3D';
import Pix8 from './jagex2/graphics/Pix8';
import Pix24 from './jagex2/graphics/Pix24';
import PixFont from './jagex2/graphics/PixFont';

import Jagfile from './jagex2/io/Jagfile';
import Packet from './jagex2/io/Packet';
import ClientStream from './jagex2/io/ClientStream';
import Isaac from './jagex2/io/Isaac';
import Database from './jagex2/io/Database';

import GameShell from './jagex2/client/GameShell';

import './vendor/midi.js';

import LinkList from './jagex2/datastruct/LinkList';

import World3D from './jagex2/dash3d/World3D';
import World from './jagex2/dash3d/World';
import CollisionMap from './jagex2/dash3d/CollisionMap';
import PlayerEntity from './jagex2/dash3d/entity/PlayerEntity';
import NpcEntity from './jagex2/dash3d/entity/NpcEntity';
import {Int32Array2d, TypedArray1d, TypedArray3d} from './jagex2/util/Arrays';
import {canvas2d} from './jagex2/graphics/Canvas';
import Draw2D from './jagex2/graphics/Draw2D';
import ObjType from './jagex2/config/ObjType';
import Colors from './jagex2/graphics/Colors';
import Model from './jagex2/graphics/Model';
import SeqType from './jagex2/config/SeqType';
import JString from './jagex2/datastruct/JString';
import IdkType from './jagex2/config/IdkType';
import {downloadUrl, sleep} from './jagex2/util/JsUtil';
import Bzip from './vendor/bzip';
import {playMidi, stopMidi} from './jagex2/util/AudioUtil';
import LocType from './jagex2/config/LocType';
import NpcType from './jagex2/config/NpcType';
import FloType from './jagex2/config/FloType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';
import Tile from './jagex2/dash3d/type/Tile';

// noinspection JSSuspiciousNameCombination
export abstract class Client extends GameShell {
    static readonly clientversion: number = 225;
    static nodeId: number = 10;
    static portOffset: number = 0;
    static members: boolean = true;
    static lowMemory: boolean = false;
    static serverAddress: string = '';
    static httpAddress: string = '';
    static showDebug: boolean = false;
    static githubRepository: string = 'https://raw.githubusercontent.com/2004scape/Server/main';

    // original keys:
    static readonly exponent: bigint = 58778699976184461502525193738213253649000149147835990136706041084440742975821n;
    static readonly modulus: bigint = 7162900525229798032761816791230527296329313291232324290237849263501208207972894053929065636522363163621000728841182238772712427862772219676577293600221789n;

    static cyclelogic1: number = 0;
    static cyclelogic2: number = 0;
    static cyclelogic3: number = 0;
    static cyclelogic4: number = 0;
    static cyclelogic5: number = 0;
    static cyclelogic6: number = 0;

    static oplogic1: number = 0;
    static oplogic2: number = 0;
    static oplogic3: number = 0;
    static oplogic4: number = 0;
    static oplogic5: number = 0;
    static oplogic6: number = 0;
    static oplogic7: number = 0;
    static oplogic8: number = 0;
    static oplogic9: number = 0;

    static setHighMemory = (): void => {
        World3D.lowMemory = false;
        Draw3D.lowMemory = false;
        Client.lowMemory = false;
        World.lowMemory = false;
    };

    static setLowMemory = (): void => {
        World3D.lowMemory = true;
        Draw3D.lowMemory = true;
        Client.lowMemory = true;
        World.lowMemory = true;
    };

    protected readonly MAX_PLAYER_COUNT: number = 2048;
    protected readonly LOCAL_PLAYER_INDEX: number = 2047;

    protected alreadyStarted: boolean = false;
    protected errorStarted: boolean = false;
    protected errorLoading: boolean = false;
    protected errorHost: boolean = false;

    // important client stuff
    protected db: Database | null = null;
    protected loopCycle: number = 0;
    protected archiveChecksums: number[] = [];
    protected stream: ClientStream | null = null;
    protected in: Packet = Packet.alloc(1);
    protected out: Packet = Packet.alloc(1);
    protected loginout: Packet = Packet.alloc(1);
    protected serverSeed: bigint = 0n;
    protected idleNetCycles: number = 0;
    protected idleTimeout: number = 0;
    protected systemUpdateTimer: number = 0;
    protected randomIn: Isaac | null = null;
    protected packetType: number = 0;
    protected packetSize: number = 0;
    protected lastPacketType0: number = 0;
    protected lastPacketType1: number = 0;
    protected lastPacketType2: number = 0;

    // archives
    protected titleArchive: Jagfile | null = null;

    // login screen properties
    protected redrawTitleBackground: boolean = true;
    protected titleScreenState: number = 0;
    protected titleLoginField: number = 0;
    protected imageTitle2: PixMap | null = null;
    protected imageTitle3: PixMap | null = null;
    protected imageTitle4: PixMap | null = null;
    protected imageTitle0: PixMap | null = null;
    protected imageTitle1: PixMap | null = null;
    protected imageTitle5: PixMap | null = null;
    protected imageTitle6: PixMap | null = null;
    protected imageTitle7: PixMap | null = null;
    protected imageTitle8: PixMap | null = null;
    protected imageTitlebox: Pix8 | null = null;
    protected imageTitlebutton: Pix8 | null = null;
    protected loginMessage0: string = '';
    protected loginMessage1: string = '';
    protected username: string = '';
    protected password: string = '';

    // fonts
    protected fontPlain11: PixFont | null = null;
    protected fontPlain12: PixFont | null = null;
    protected fontBold12: PixFont | null = null;
    protected fontQuill8: PixFont | null = null;

    // login screen pillar flames properties
    protected imageRunes: Pix8[] = [];
    protected flameActive: boolean = false;
    protected imageFlamesLeft: Pix24 | null = null;
    protected imageFlamesRight: Pix24 | null = null;
    protected flameBuffer1: Int32Array | null = null;
    protected flameBuffer0: Int32Array | null = null;
    protected flameBuffer3: Int32Array | null = null;
    protected flameBuffer2: Int32Array | null = null;
    protected flameGradient: Int32Array | null = null;
    protected flameGradient0: Int32Array | null = null;
    protected flameGradient1: Int32Array | null = null;
    protected flameGradient2: Int32Array | null = null;
    protected flameLineOffset: Int32Array = new Int32Array(256);
    protected flameCycle0: number = 0;
    protected flameGradientCycle0: number = 0;
    protected flameGradientCycle1: number = 0;
    protected flamesInterval: NodeJS.Timeout | null = null;

    // game world properties
    protected areaSidebar: PixMap | null = null;
    protected areaMapback: PixMap | null = null;
    protected areaViewport: PixMap | null = null;
    protected areaChatback: PixMap | null = null;
    protected areaBackbase1: PixMap | null = null;
    protected areaBackbase2: PixMap | null = null;
    protected areaBackhmid1: PixMap | null = null;
    protected areaBackleft1: PixMap | null = null;
    protected areaBackleft2: PixMap | null = null;
    protected areaBackright1: PixMap | null = null;
    protected areaBackright2: PixMap | null = null;
    protected areaBacktop1: PixMap | null = null;
    protected areaBacktop2: PixMap | null = null;
    protected areaBackvmid1: PixMap | null = null;
    protected areaBackvmid2: PixMap | null = null;
    protected areaBackvmid3: PixMap | null = null;
    protected areaBackhmid2: PixMap | null = null;
    protected areaChatbackOffsets: Int32Array | null = null;
    protected areaSidebarOffsets: Int32Array | null = null;
    protected areaViewportOffsets: Int32Array | null = null;
    protected compassMaskLineOffsets: Int32Array = new Int32Array(33);
    protected compassMaskLineLengths: Int32Array = new Int32Array(33);
    protected minimapMaskLineOffsets: Int32Array = new Int32Array(151);
    protected minimapMaskLineLengths: Int32Array = new Int32Array(151);

    protected imageInvback: Pix8 | null = null;
    protected imageChatback: Pix8 | null = null;
    protected imageMapback: Pix8 | null = null;
    protected imageBackbase1: Pix8 | null = null;
    protected imageBackbase2: Pix8 | null = null;
    protected imageBackhmid1: Pix8 | null = null;
    protected imageSideicons: (Pix8 | null)[] = new TypedArray1d(13, null);
    protected imageMinimap: Pix24 | null = null;
    protected imageCompass: Pix24 | null = null;
    protected imageMapscene: (Pix8 | null)[] = new TypedArray1d(50, null);
    protected imageMapfunction: (Pix24 | null)[] = new TypedArray1d(50, null);
    protected imageHitmarks: (Pix24 | null)[] = new TypedArray1d(20, null);
    protected imageHeadicons: (Pix24 | null)[] = new TypedArray1d(20, null);
    protected imageMapflag: Pix24 | null = null;
    protected imageCrosses: (Pix24 | null)[] = new TypedArray1d(8, null);
    protected imageMapdot0: Pix24 | null = null;
    protected imageMapdot1: Pix24 | null = null;
    protected imageMapdot2: Pix24 | null = null;
    protected imageMapdot3: Pix24 | null = null;
    protected imageScrollbar0: Pix8 | null = null;
    protected imageScrollbar1: Pix8 | null = null;
    protected imageRedstone1: Pix8 | null = null;
    protected imageRedstone2: Pix8 | null = null;
    protected imageRedstone3: Pix8 | null = null;
    protected imageRedstone1h: Pix8 | null = null;
    protected imageRedstone2h: Pix8 | null = null;
    protected imageRedstone1v: Pix8 | null = null;
    protected imageRedstone2v: Pix8 | null = null;
    protected imageRedstone3v: Pix8 | null = null;
    protected imageRedstone1hv: Pix8 | null = null;
    protected imageRedstone2hv: Pix8 | null = null;

    protected genderButtonImage0: Pix24 | null = null;
    protected genderButtonImage1: Pix24 | null = null;

    protected activeMapFunctions: (Pix24 | null)[] = new TypedArray1d(1000, null);

    protected redrawSidebar: boolean = false;
    protected redrawChatback: boolean = false;
    protected redrawSideicons: boolean = false;
    protected redrawPrivacySettings: boolean = false;
    protected viewportInterfaceId: number = -1;
    protected dragCycles: number = 0;
    protected crossMode: number = 0;
    protected crossCycle: number = 0;
    protected crossX: number = 0;
    protected crossY: number = 0;
    protected overrideChat: number = 0;
    protected menuVisible: boolean = false;
    protected menuArea: number = 0;
    protected menuX: number = 0;
    protected menuY: number = 0;
    protected menuWidth: number = 0;
    protected menuHeight: number = 0;
    protected menuSize: number = 0;
    protected menuOption: string[] = [];
    protected sidebarInterfaceId: number = -1;
    protected chatInterfaceId: number = -1;
    protected chatInterface: ComType = new ComType();
    protected chatScrollHeight: number = 78;
    protected chatScrollOffset: number = 0;
    protected ignoreCount: number = 0;
    protected ignoreName37: bigint[] = [];
    protected hintType: number = 0;
    protected hintNpc: number = 0;
    protected hintOffsetX: number = 0;
    protected hintOffsetZ: number = 0;
    protected hintPlayer: number = 0;
    protected hintTileX: number = 0;
    protected hintTileZ: number = 0;
    protected hintHeight: number = 0;
    protected skillExperience: number[] = [];
    protected skillLevel: number[] = [];
    protected skillBaseLevel: number[] = [];
    protected levelExperience: number[] = [];
    protected modalMessage: string | null = null;
    protected flashingTab: number = -1;
    protected selectedTab: number = 3;
    protected tabInterfaceId: number[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    protected publicChatSetting: number = 0;
    protected privateChatSetting: number = 0;
    protected tradeChatSetting: number = 0;
    protected scrollGrabbed: boolean = false;
    protected scrollInputPadding: number = 0;
    protected showSocialInput: boolean = false;
    protected socialMessage: string = '';
    protected socialInput: string = '';
    protected socialAction: number = 0;
    protected chatbackInput: string = '';
    protected chatbackInputOpen: boolean = false;
    protected stickyChatInterfaceId: number = -1;
    protected messageText: (string | null)[] = new TypedArray1d(100, null);
    protected messageSender: (string | null)[] = new TypedArray1d(100, null);
    protected messageType: Int32Array = new Int32Array(100);
    protected messageIds: Int32Array = new Int32Array(100);
    protected privateMessageCount: number = 0;
    protected splitPrivateChat: number = 0;
    protected chatEffects: number = 0;
    protected chatTyped: string = '';
    protected viewportHoveredInterfaceIndex: number = 0;
    protected sidebarHoveredInterfaceIndex: number = 0;
    protected chatHoveredInterfaceIndex: number = 0;
    protected objDragInterfaceId: number = 0;
    protected objDragSlot: number = 0;
    protected objDragArea: number = 0;
    protected objGrabX: number = 0;
    protected objGrabY: number = 0;
    protected objDragCycles: number = 0;
    protected objGrabThreshold: boolean = false;
    protected objSelected: number = 0;
    protected objSelectedSlot: number = 0;
    protected objSelectedInterface: number = 0;
    protected objInterface: number = 0;
    protected objSelectedName: string | null = null;
    protected selectedArea: number = 0;
    protected selectedItem: number = 0;
    protected selectedInterface: number = 0;
    protected selectedCycle: number = 0;
    protected pressedContinueOption: boolean = false;
    protected varps: number[] = [];
    protected varCache: number[] = [];
    protected spellSelected: number = 0;
    protected activeSpellId: number = 0;
    protected activeSpellFlags: number = 0;
    protected spellCaption: string | null = null;
    protected mouseButtonsOption: number = 0;
    protected menuAction: Int32Array = new Int32Array(500);
    protected menuParamA: Int32Array = new Int32Array(500);
    protected menuParamB: Int32Array = new Int32Array(500);
    protected menuParamC: Int32Array = new Int32Array(500);
    protected hoveredSlotParentId: number = 0;
    protected hoveredSlot: number = 0;
    protected lastHoveredInterfaceId: number = 0;
    protected reportAbuseInput: string = '';
    protected reportAbuseMuteOption: boolean = false;
    protected reportAbuseInterfaceID: number = -1;
    protected lastAddress: number = 0;
    protected daysSinceLastLogin: number = 0;
    protected daysSinceRecoveriesChanged: number = 0;
    protected unreadMessages: number = 0;
    protected activeMapFunctionCount: number = 0;
    protected activeMapFunctionX: Int32Array = new Int32Array(1000);
    protected activeMapFunctionZ: Int32Array = new Int32Array(1000);

    // scene
    protected scene: World3D | null = null;
    protected sceneState: number = 0;
    protected sceneDelta: number = 0;
    protected sceneCycle: number = 0;
    protected flagSceneTileX: number = 0;
    protected flagSceneTileZ: number = 0;
    protected cutscene: boolean = false;
    protected cameraOffsetCycle: number = 0;
    protected cameraAnticheatOffsetX: number = 0;
    protected cameraAnticheatOffsetZ: number = 0;
    protected cameraAnticheatAngle: number = 0;
    protected cameraOffsetXModifier: number = 2;
    protected cameraOffsetZModifier: number = 2;
    protected cameraOffsetYawModifier: number = 1;
    protected cameraModifierCycle: Int32Array = new Int32Array(5);
    protected cameraModifierEnabled: boolean[] = new TypedArray1d(5, false);
    protected cameraModifierJitter: Int32Array = new Int32Array(5);
    protected cameraModifierWobbleScale: Int32Array = new Int32Array(5);
    protected cameraModifierWobbleSpeed: Int32Array = new Int32Array(5);
    protected cameraX: number = 0;
    protected cameraY: number = 0;
    protected cameraZ: number = 0;
    protected cameraPitch: number = 0;
    protected cameraYaw: number = 0;
    protected cameraPitchClamp: number = 0;
    protected minimapOffsetCycle: number = 0;
    protected minimapAnticheatAngle: number = 0;
    protected minimapZoom: number = 0;
    protected minimapZoomModifier: number = 1;
    protected minimapAngleModifier: number = 2;
    protected minimapLevel: number = -1;
    protected baseX: number = 0;
    protected baseZ: number = 0;
    protected sceneCenterZoneX: number = 0;
    protected sceneCenterZoneZ: number = 0;
    protected sceneBaseTileX: number = 0;
    protected sceneBaseTileZ: number = 0;
    protected sceneMapLandData: (Int8Array | null)[] | null = null;
    protected sceneMapLocData: (Int8Array | null)[] | null = null;
    protected sceneMapIndex: Int32Array | null = null;
    protected mapLastBaseX: number = 0;
    protected mapLastBaseZ: number = 0;
    protected textureBuffer: Int8Array = new Int8Array(16384);
    protected levelCollisionMap: (CollisionMap | null)[] = new TypedArray1d(CollisionMap.LEVELS, null);
    protected currentLevel: number = 0;
    protected cameraMovedWrite: number = 0;
    protected orbitCameraPitch: number = 128;
    protected orbitCameraYaw: number = 0;
    protected orbitCameraYawVelocity: number = 0;
    protected orbitCameraPitchVelocity: number = 0;
    protected orbitCameraX: number = 0;
    protected orbitCameraZ: number = 0;
    protected levelHeightmap: Int32Array[][] | null = null;
    protected levelTileFlags: Uint8Array[][] | null = null;
    protected tileLastOccupiedCycle: Int32Array[] = new Int32Array2d(CollisionMap.SIZE, CollisionMap.SIZE);
    protected projectX: number = 0;
    protected projectY: number = 0;
    protected cutsceneDstLocalTileX: number = 0;
    protected cutsceneDstLocalTileZ: number = 0;
    protected cutsceneDstHeight: number = 0;
    protected cutsceneRotateSpeed: number = 0;
    protected cutsceneRotateAcceleration: number = 0;
    protected cutsceneSrcLocalTileX: number = 0;
    protected cutsceneSrcLocalTileZ: number = 0;
    protected cutsceneSrcHeight: number = 0;
    protected cutsceneMoveSpeed: number = 0;
    protected cutsceneMoveAcceleration: number = 0;

    // entities
    protected players: (PlayerEntity | null)[] = new TypedArray1d(this.MAX_PLAYER_COUNT, null);
    protected playerCount: number = 0;
    protected playerIds: Int32Array = new Int32Array(this.MAX_PLAYER_COUNT);
    protected entityUpdateCount: number = 0;
    protected entityRemovalCount: number = 0;
    protected entityUpdateIds: Int32Array = new Int32Array(this.MAX_PLAYER_COUNT);
    protected entityRemovalIds: Int32Array = new Int32Array(1000);
    protected playerAppearanceBuffer: (Packet | null)[] = new TypedArray1d(this.MAX_PLAYER_COUNT, null);
    protected npcs: (NpcEntity | null)[] = new TypedArray1d(8192, null);
    protected npcCount: number = 0;
    protected npcIds: Int32Array = new Int32Array(8192);
    protected projectiles: LinkList = new LinkList();
    protected spotanims: LinkList = new LinkList();
    protected locList: LinkList = new LinkList();
    protected temporaryLocs: LinkList = new LinkList();
    protected levelObjStacks: (LinkList | null)[][][] = new TypedArray3d(CollisionMap.LEVELS, CollisionMap.SIZE, CollisionMap.SIZE, null);
    protected spawnedLocations: LinkList = new LinkList();

    // bfs pathfinder
    protected bfsStepX: Int32Array = new Int32Array(4000);
    protected bfsStepZ: Int32Array = new Int32Array(4000);
    protected bfsDirection: Int32Array = new Int32Array(CollisionMap.SIZE * CollisionMap.SIZE);
    protected bfsCost: Int32Array = new Int32Array(CollisionMap.SIZE * CollisionMap.SIZE);
    protected tryMoveNearest: number = 0;

    // player
    protected localPlayer: PlayerEntity | null = null;
    protected energy: number = 0;
    protected inMultizone: number = 0;
    protected localPid: number = -1;
    protected weightCarried: number = 0;
    protected heartbeatTimer: number = 0;
    protected wildernessLevel: number = 0;
    protected worldLocationState: number = 0;
    protected rights: boolean = false;
    protected designGenderMale: boolean = true;
    protected updateDesignModel: boolean = false;
    protected designIdentikits: Int32Array = new Int32Array(7);
    protected designColors: Int32Array = new Int32Array(5);

    // friends/chats
    protected friendCount: number = 0;
    protected chatCount: number = 0;
    static readonly MAX_CHATS: number = 50;
    protected chatX: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatY: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatHeight: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatWidth: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatColors: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatStyles: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chatTimers: Int32Array = new Int32Array(Client.MAX_CHATS);
    protected chats: (string | null)[] = new TypedArray1d(Client.MAX_CHATS, null);
    protected friendName: (string | null)[] = new TypedArray1d(100, null);
    protected friendName37: BigInt64Array = new BigInt64Array(100);
    protected friendWorld: Int32Array = new Int32Array(100);
    protected socialName37: bigint | null = null;

    // audio
    protected waveCount: number = 0;
    protected waveEnabled: boolean = true;
    protected waveIds: Int32Array = new Int32Array(50);
    protected waveLoops: Int32Array = new Int32Array(50);
    protected waveDelay: Int32Array = new Int32Array(50);
    protected waveVolume: number = 192;
    protected lastWaveId: number = -1;
    protected lastWaveLoops: number = -1;
    protected lastWaveLength: number = 0;
    protected lastWaveStartTime: number = 0;
    protected nextMusicDelay: number = 0;
    protected midiActive: boolean = true;
    protected currentMidi: string | null = null;
    protected midiCrc: number = 0;
    protected midiSize: number = 0;
    protected midiVolume: number = 192;

    // debug
    // alt+shift click to add a tile overlay
    protected userTileMarkers: (Tile | null)[] = new TypedArray1d(16, null);
    protected userTileMarkerIndex: number = 0;
    protected lastTickFlag: boolean = false;

    // ---- override functions

    unload = (): void => {
        try {
            if (this.stream) {
                this.stream.close();
            }
        } catch (e) {
            /* empty */
        }
        this.stream = null;
        stopMidi();
        // this.midiThreadActive = false;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.out = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.loginout = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.in = null;
        this.sceneMapIndex = null;
        this.sceneMapLandData = null;
        this.sceneMapLocData = null;
        this.levelHeightmap = null;
        this.levelTileFlags = null;
        this.scene = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.levelCollisionMap = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.bfsDirection = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.bfsCost = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.bfsStepX = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.bfsStepZ = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.textureBuffer = null;
        this.areaSidebar = null;
        this.areaMapback = null;
        this.areaViewport = null;
        this.areaChatback = null;
        this.areaBackbase1 = null;
        this.areaBackbase2 = null;
        this.areaBackhmid1 = null;
        this.areaBackleft1 = null;
        this.areaBackleft2 = null;
        this.areaBackright1 = null;
        this.areaBackright2 = null;
        this.areaBacktop1 = null;
        this.areaBacktop2 = null;
        this.areaBackvmid1 = null;
        this.areaBackvmid2 = null;
        this.areaBackvmid3 = null;
        this.areaBackhmid2 = null;
        this.imageInvback = null;
        this.imageMapback = null;
        this.imageChatback = null;
        this.imageBackbase1 = null;
        this.imageBackbase2 = null;
        this.imageBackhmid1 = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageSideicons = null;
        this.imageRedstone1 = null;
        this.imageRedstone2 = null;
        this.imageRedstone3 = null;
        this.imageRedstone1h = null;
        this.imageRedstone2h = null;
        this.imageRedstone1v = null;
        this.imageRedstone2v = null;
        this.imageRedstone3v = null;
        this.imageRedstone1hv = null;
        this.imageRedstone2hv = null;
        this.imageCompass = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageHitmarks = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageHeadicons = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageCrosses = null;
        this.imageMapdot0 = null;
        this.imageMapdot1 = null;
        this.imageMapdot2 = null;
        this.imageMapdot3 = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageMapscene = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.imageMapfunction = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.tileLastOccupiedCycle = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.players = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.playerIds = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.entityUpdateIds = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.playerAppearanceBuffer = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.entityRemovalIds = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.npcs = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.npcIds = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.levelObjStacks = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.spawnedLocations = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.temporaryLocs = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.projectiles = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.spotanims = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.locList = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.menuParamB = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.menuParamC = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.menuAction = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.menuParamA = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.menuOption = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.varps = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.activeMapFunctionX = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.activeMapFunctionZ = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.activeMapFunctions = null;
        this.imageMinimap = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.friendName = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.friendName37 = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        this.friendWorld = null;
        this.imageTitle0 = null;
        this.imageTitle1 = null;
        this.imageTitle2 = null;
        this.imageTitle3 = null;
        this.imageTitle4 = null;
        this.imageTitle5 = null;
        this.imageTitle6 = null;
        this.imageTitle7 = null;
        this.imageTitle8 = null;
        this.unloadTitle();
        LocType.unload();
        NpcType.unload();
        ObjType.unload();
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        FloType.instances = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        IdkType.instances = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        ComType.instances = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        SeqType.instances = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        SpotAnimType.instances = null;
        SpotAnimType.modelCache = null;
        // @ts-expect-error Force unload. This happens when the browser reloads entirely.
        VarpType.instances = null;
        this.drawArea = null;
        PlayerEntity.modelCache = null;
        Draw3D.unload();
        World3D.unload();
        Model.unload();
        SeqBase.instances = [];
        SeqFrame.instances = [];
    };

    getTitleScreenState(): number {
        return this.titleScreenState;
    }

    isChatBackInputOpen(): boolean {
        return this.chatbackInputOpen;
    }

    isShowSocialInput(): boolean {
        return this.showSocialInput;
    }

    getChatInterfaceId(): number {
        return this.chatInterfaceId;
    }

    getViewportInterfaceId(): number {
        return this.viewportInterfaceId;
    }

    // ---- protected functions can be used by impl classes

    protected unloadTitle = (): void => {
        this.flameActive = false;
        if (this.flamesInterval) {
            clearInterval(this.flamesInterval);
            this.flamesInterval = null;
        }
        this.imageTitlebox = null;
        this.imageTitlebutton = null;
        this.imageRunes = [];
        this.flameGradient = null;
        this.flameGradient0 = null;
        this.flameGradient1 = null;
        this.flameGradient2 = null;
        this.flameBuffer0 = null;
        this.flameBuffer1 = null;
        this.flameBuffer3 = null;
        this.flameBuffer2 = null;
        this.imageFlamesLeft = null;
        this.imageFlamesRight = null;
    };

    protected loadArchive = async (filename: string, displayName: string, crc: number, progress: number): Promise<Jagfile> => {
        let retry: number = 5;
        let data: Int8Array | undefined = await this.db?.cacheload(filename);
        if (data && Packet.crc32(data) !== crc) {
            data = undefined;
        }

        if (data) {
            return new Jagfile(data);
        }

        while (!data) {
            await this.showProgress(progress, `Requesting ${displayName}`);

            try {
                data = await downloadUrl(`${Client.httpAddress}/${filename}${crc}`);
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
        return new Jagfile(data);
    };

    protected setMidi = async (name: string, crc: number, length: number): Promise<void> => {
        let data: Int8Array | undefined = await this.db?.cacheload(name + '.mid');
        if (data && crc !== 12345678 && Packet.crc32(data) !== crc) {
            data = undefined;
        }

        if (!data) {
            try {
                data = await downloadUrl(`${Client.httpAddress}/${name}_${crc}.mid`);
                if (length !== data.length) {
                    data = data.slice(0, length);
                }
            } catch (e) {
                /* empty */
            }
        }

        if (!data) {
            return;
        }
        await this.db?.cachesave(name + '.mid', data);
        const uncompressedLength: number = new Packet(Uint8Array.from(data)).g4;
        const uncompressed: Int8Array = Bzip.read(uncompressedLength, data, length, 4);
        playMidi(uncompressed, this.midiVolume);
    };

    protected drawError = (): void => {
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(0, 0, this.width, this.height);

        this.setFramerate(1);

        if (this.errorLoading) {
            this.flameActive = false;

            canvas2d.font = 'bold 16px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';

            let y: number = 35;
            canvas2d.fillText('Sorry, an error has occured whilst loading RuneScape', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try clearing your web-browsers cache from tools->internet options', 30, y);

            y += 30;
            canvas2d.fillText('3: Try using a different game-world', 30, y);

            y += 30;
            canvas2d.fillText('4: Try rebooting your computer', 30, y);

            y += 30;
            canvas2d.fillText('5: Try selecting a different version of Java from the play-game menu', 30, y);
        }

        if (this.errorHost) {
            this.flameActive = false;

            canvas2d.font = 'bold 20px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'white';

            canvas2d.fillText('Error - unable to load game!', 50, 50);
            canvas2d.fillText('To play RuneScape make sure you play from', 50, 100);
            canvas2d.fillText('https://2004scape.org', 50, 150);
        }

        if (this.errorStarted) {
            this.flameActive = false;

            canvas2d.font = 'bold 13px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';

            let y: number = 35;
            canvas2d.fillText('Error a copy of RuneScape already appears to be loaded', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try rebooting your computer, and reloading', 30, y);
        }
    };

    protected executeInterfaceScript = (com: ComType): boolean => {
        if (!com.scriptComparator) {
            return false;
        }

        for (let i: number = 0; i < com.scriptComparator.length; i++) {
            const value: number = this.executeClientscript1(com, i);
            if (!com.scriptOperand) {
                return false;
            }
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

    protected drawScrollbar = (x: number, y: number, scrollY: number, scrollHeight: number, height: number): void => {
        this.imageScrollbar0?.draw(x, y);
        this.imageScrollbar1?.draw(x, y + height - 16);
        Draw2D.fillRect(x, y + 16, 16, height - 32, Colors.SCROLLBAR_TRACK);

        let gripSize: number = (((height - 32) * height) / scrollHeight) | 0;
        if (gripSize < 8) {
            gripSize = 8;
        }

        const gripY: number = (((height - gripSize - 32) * scrollY) / (scrollHeight - height)) | 0;
        Draw2D.fillRect(x, y + gripY + 16, 16, gripSize, Colors.SCROLLBAR_GRIP_FOREGROUND);

        Draw2D.drawVerticalLine(x, y + gripY + 16, Colors.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);
        Draw2D.drawVerticalLine(x + 1, y + gripY + 16, Colors.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);

        Draw2D.drawHorizontalLine(x, y + gripY + 16, Colors.SCROLLBAR_GRIP_HIGHLIGHT, 16);
        Draw2D.drawHorizontalLine(x, y + gripY + 17, Colors.SCROLLBAR_GRIP_HIGHLIGHT, 16);

        Draw2D.drawVerticalLine(x + 15, y + gripY + 16, Colors.SCROLLBAR_GRIP_LOWLIGHT, gripSize);
        Draw2D.drawVerticalLine(x + 14, y + gripY + 17, Colors.SCROLLBAR_GRIP_LOWLIGHT, gripSize - 1);

        Draw2D.drawHorizontalLine(x, y + gripY + gripSize + 15, Colors.SCROLLBAR_GRIP_LOWLIGHT, 16);
        Draw2D.drawHorizontalLine(x + 1, y + gripY + gripSize + 14, Colors.SCROLLBAR_GRIP_LOWLIGHT, 15);
    };

    protected updateInterfaceAnimation = (id: number, delta: number): boolean => {
        let updated: boolean = false;
        const parent: ComType = ComType.instances[id];
        if (!parent.childId) {
            return false;
        }
        for (let i: number = 0; i < parent.childId.length && parent.childId[i] !== -1; i++) {
            const child: ComType = ComType.instances[parent.childId[i]];
            if (child.type === 1) {
                updated ||= this.updateInterfaceAnimation(child.id, delta);
            }
            if (child.type === 6 && (child.anim !== -1 || child.activeAnim !== -1)) {
                const active: boolean = this.executeInterfaceScript(child);
                let seqId: number;
                if (active) {
                    seqId = child.activeAnim;
                } else {
                    seqId = child.anim;
                }
                if (seqId !== -1) {
                    const type: SeqType = SeqType.instances[seqId];
                    child.seqCycle += delta;
                    if (type.delay) {
                        while (child.seqCycle > type.delay[child.seqFrame]) {
                            child.seqCycle -= type.delay[child.seqFrame] + 1;
                            child.seqFrame++;
                            if (child.seqFrame >= type.frameCount) {
                                child.seqFrame -= type.replayoff;
                                if (child.seqFrame < 0 || child.seqFrame >= type.frameCount) {
                                    child.seqFrame = 0;
                                }
                            }
                            updated = true;
                        }
                    }
                }
            }
        }
        return updated;
    };

    protected drawInterface = (com: ComType, x: number, y: number, scrollY: number, outline: boolean = false): void => {
        if (com.type !== 0 || !com.childId || (com.hide && this.viewportHoveredInterfaceIndex !== com.id && this.sidebarHoveredInterfaceIndex !== com.id && this.chatHoveredInterfaceIndex !== com.id)) {
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

            if (outline) {
                Draw2D.drawRect(childX, childY, child.width, child.height, Colors.WHITE);
            }

            if (child.clientCode > 0) {
                this.updateInterfaceContent(child);
            }

            if (child.type === ComType.TYPE_LAYER) {
                if (child.scrollPosition > child.scroll - child.height) {
                    child.scrollPosition = child.scroll - child.height;
                }

                if (child.scrollPosition < 0) {
                    child.scrollPosition = 0;
                }

                this.drawInterface(child, childX, childY, child.scrollPosition, outline);

                if (child.scroll > child.height) {
                    this.drawScrollbar(childX + child.width, childY, child.scrollPosition, child.scroll, child.height);
                }
            } else if (child.type === ComType.TYPE_INV) {
                let slot: number = 0;

                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (!child.invSlotOffsetX || !child.invSlotOffsetY || !child.invSlotObjId || !child.invSlotObjCount) {
                            continue;
                        }

                        let slotX: number = childX + col * (child.marginX + 32);
                        let slotY: number = childY + row * (child.marginY + 32);

                        if (slot < 20) {
                            slotX += child.invSlotOffsetX[slot];
                            slotY += child.invSlotOffsetY[slot];
                        }

                        if (child.invSlotObjId[slot] > 0) {
                            let dx: number = 0;
                            let dy: number = 0;
                            const id: number = child.invSlotObjId[slot] - 1;

                            if ((slotX >= -32 && slotX <= 512 && slotY >= -32 && slotY <= 334) || (this.objDragArea !== 0 && this.objDragSlot === slot)) {
                                const icon: Pix24 = ObjType.getIcon(id, child.invSlotObjCount[slot]);
                                if (this.objDragArea !== 0 && this.objDragSlot === slot && this.objDragInterfaceId === child.id) {
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
                                } else if (this.selectedArea !== 0 && this.selectedItem === slot && this.selectedInterface === child.id) {
                                    icon.drawAlpha(128, slotX, slotY);
                                } else {
                                    icon.draw(slotX, slotY);
                                }

                                if (icon.cropW === 33 || child.invSlotObjCount[slot] !== 1) {
                                    const count: number = child.invSlotObjCount[slot];
                                    this.fontPlain11?.drawString(slotX + dx + 1, slotY + 10 + dy, this.formatObjCount(count), Colors.BLACK);
                                    this.fontPlain11?.drawString(slotX + dx, slotY + 9 + dy, this.formatObjCount(count), Colors.YELLOW);
                                }
                            }
                        } else if (child.invSlotSprite && slot < 20) {
                            const image: Pix24 | null = child.invSlotSprite[slot];
                            image?.draw(slotX, slotY);
                        }

                        slot++;
                    }
                }
            } else if (child.type === ComType.TYPE_RECT) {
                if (child.fill) {
                    Draw2D.fillRect(childX, childY, child.width, child.height, child.colour);
                } else {
                    Draw2D.drawRect(childX, childY, child.width, child.height, child.colour);
                }
            } else if (child.type === ComType.TYPE_TEXT) {
                const font: PixFont | null = child.font;
                let color: number = child.colour;
                let text: string | null = child.text;

                if ((this.chatHoveredInterfaceIndex === child.id || this.sidebarHoveredInterfaceIndex === child.id || this.viewportHoveredInterfaceIndex === child.id) && child.overColour !== 0) {
                    color = child.overColour;
                }

                if (this.executeInterfaceScript(child)) {
                    color = child.activeColour;

                    if (child.activeText && child.activeText.length > 0) {
                        text = child.activeText;
                    }
                }

                if (child.buttonType === ComType.BUTTON_CONTINUE && this.pressedContinueOption) {
                    text = 'Please wait...';
                    color = child.colour;
                }

                if (!font || !text) {
                    continue;
                }

                for (let lineY: number = childY + font.height; text.length > 0; lineY += font.height) {
                    if (text.indexOf('%') !== -1) {
                        do {
                            const index: number = text.indexOf('%1');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 0)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%2');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 1)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%3');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 2)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%4');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 3)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);

                        do {
                            const index: number = text.indexOf('%5');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.executeClientscript1(child, 4)) + text.substring(index + 2);
                            // eslint-disable-next-line no-constant-condition
                        } while (true);
                    }

                    const newline: number = text.indexOf('\\n');
                    let split: string;
                    if (newline !== -1) {
                        split = text.substring(0, newline);
                        text = text.substring(newline + 2);
                    } else {
                        split = text;
                        text = '';
                    }

                    if (child.center) {
                        font.drawStringTaggableCenter(childX + ((child.width / 2) | 0), lineY, split, color, child.shadowed);
                    } else {
                        font.drawStringTaggable(childX, lineY, split, color, child.shadowed);
                    }
                }
            } else if (child.type === ComType.TYPE_GRAPHIC) {
                let image: Pix24 | null;
                if (this.executeInterfaceScript(child)) {
                    image = child.activeGraphic;
                } else {
                    image = child.graphic;
                }

                image?.draw(childX, childY);
            } else if (child.type === ComType.TYPE_MODEL) {
                const tmpX: number = Draw3D.centerX;
                const tmpY: number = Draw3D.centerY;

                Draw3D.centerX = childX + ((child.width / 2) | 0);
                Draw3D.centerY = childY + ((child.height / 2) | 0);

                const eyeY: number = (Draw3D.sin[child.xan] * child.zoom) >> 16;
                const eyeZ: number = (Draw3D.cos[child.xan] * child.zoom) >> 16;

                const active: boolean = this.executeInterfaceScript(child);
                let seqId: number;
                if (active) {
                    seqId = child.activeAnim;
                } else {
                    seqId = child.anim;
                }

                let model: Model | null = null;
                if (seqId === -1) {
                    model = child.getModel(-1, -1, active);
                } else {
                    const seq: SeqType = SeqType.instances[seqId];
                    if (seq.frames && seq.iframes) {
                        model = child.getModel(seq.frames[child.seqFrame], seq.iframes[child.seqFrame], active);
                    }
                }

                if (model) {
                    model.drawSimple(0, child.yan, 0, child.xan, 0, eyeY, eyeZ);
                }

                Draw3D.centerX = tmpX;
                Draw3D.centerY = tmpY;
            } else if (child.type === ComType.TYPE_INV_TEXT) {
                const font: PixFont | null = child.font;
                if (!font || !child.invSlotObjId || !child.invSlotObjCount) {
                    continue;
                }

                let slot: number = 0;
                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (child.invSlotObjId[slot] > 0) {
                            const obj: ObjType = ObjType.get(child.invSlotObjId[slot] - 1);
                            let text: string | null = obj.name;
                            if (obj.stackable || child.invSlotObjCount[slot] !== 1) {
                                text = text + ' x' + this.formatObjCountTagged(child.invSlotObjCount[slot]);
                            }

                            if (!text) {
                                continue;
                            }

                            const textX: number = childX + col * (child.marginX + 115);
                            const textY: number = childY + row * (child.marginY + 12);

                            if (child.center) {
                                font.drawStringTaggableCenter(textX + ((child.width / 2) | 0), textY, text, child.colour, child.shadowed);
                            } else {
                                font.drawStringTaggable(textX, textY, text, child.colour, child.shadowed);
                            }
                        }

                        slot++;
                    }
                }
            }
        }
        Draw2D.setBounds(left, top, right, bottom);
    };

    private updateInterfaceContent = (component: ComType): void => {
        let clientCode: number = component.clientCode;

        if (clientCode >= ComType.CC_FRIENDS_START && clientCode <= ComType.CC_FRIENDS_END) {
            clientCode--;
            if (clientCode >= this.friendCount) {
                component.text = '';
                component.buttonType = 0;
            } else {
                component.text = this.friendName[clientCode];
                component.buttonType = 1;
            }
        } else if (clientCode >= ComType.CC_FRIENDS_UPDATE_START && clientCode <= ComType.CC_FRIENDS_UPDATE_END) {
            clientCode -= ComType.CC_FRIENDS_UPDATE_START;
            if (clientCode >= this.friendCount) {
                component.text = '';
                component.buttonType = 0;
            } else {
                if (this.friendWorld[clientCode] === 0) {
                    component.text = '@red@Offline';
                } else if (this.friendWorld[clientCode] === Client.nodeId) {
                    component.text = '@gre@World-' + (this.friendWorld[clientCode] - 9);
                } else {
                    component.text = '@yel@World-' + (this.friendWorld[clientCode] - 9);
                }
                component.buttonType = 1;
            }
        } else if (clientCode === ComType.CC_FRIENDS_SIZE) {
            component.scroll = this.friendCount * 15 + 20;
            if (component.scroll <= component.height) {
                component.scroll = component.height + 1;
            }
        } else if (clientCode >= ComType.CC_IGNORES_START && clientCode <= ComType.CC_IGNORES_END) {
            clientCode -= ComType.CC_IGNORES_START;
            if (clientCode >= this.ignoreCount) {
                component.text = '';
                component.buttonType = 0;
            } else {
                component.text = JString.formatName(JString.fromBase37(this.ignoreName37[clientCode]));
                component.buttonType = 1;
            }
        } else if (clientCode === ComType.CC_IGNORES_SIZE) {
            component.scroll = this.ignoreCount * 15 + 20;
            if (component.scroll <= component.height) {
                component.scroll = component.height + 1;
            }
        } else if (clientCode === ComType.CC_DESIGN_PREVIEW) {
            component.xan = 150;
            component.yan = ((Math.sin(this.loopCycle / 40.0) * 256.0) | 0) & 0x7ff;
            if (this.updateDesignModel) {
                this.updateDesignModel = false;

                const models: (Model | null)[] = new TypedArray1d(7, null);
                let modelCount: number = 0;
                for (let part: number = 0; part < 7; part++) {
                    const kit: number = this.designIdentikits[part];
                    if (kit >= 0) {
                        models[modelCount++] = IdkType.instances[kit].getModel();
                    }
                }

                const model: Model = Model.modelFromModels(models, modelCount);
                for (let part: number = 0; part < 5; part++) {
                    if (this.designColors[part] !== 0) {
                        model.recolor(PlayerEntity.DESIGN_IDK_COLORS[part][0], PlayerEntity.DESIGN_IDK_COLORS[part][this.designColors[part]]);
                        if (part === 1) {
                            model.recolor(PlayerEntity.TORSO_RECOLORS[0], PlayerEntity.TORSO_RECOLORS[this.designColors[part]]);
                        }
                    }
                }

                if (this.localPlayer) {
                    const frames: Int16Array | null = SeqType.instances[this.localPlayer.seqStandId].frames;
                    if (frames) {
                        model.createLabelReferences();
                        model.applyTransform(frames[0]);
                        model.calculateNormals(64, 850, -30, -50, -30, true);
                        component.model = model;
                    }
                }
            }
        } else if (clientCode === ComType.CC_SWITCH_TO_MALE) {
            if (!this.genderButtonImage0) {
                this.genderButtonImage0 = component.graphic;
                this.genderButtonImage1 = component.activeGraphic;
            }
            if (this.designGenderMale) {
                component.graphic = this.genderButtonImage1;
            } else {
                component.graphic = this.genderButtonImage0;
            }
        } else if (clientCode === ComType.CC_SWITCH_TO_FEMALE) {
            if (!this.genderButtonImage0) {
                this.genderButtonImage0 = component.graphic;
                this.genderButtonImage1 = component.activeGraphic;
            }
            if (this.designGenderMale) {
                component.graphic = this.genderButtonImage0;
            } else {
                component.graphic = this.genderButtonImage1;
            }
        } else if (clientCode === ComType.CC_REPORT_INPUT) {
            component.text = this.reportAbuseInput;
            if (this.loopCycle % 20 < 10) {
                component.text = component.text + '|';
            } else {
                component.text = component.text + ' ';
            }
        } else if (clientCode === ComType.CC_MOD_MUTE) {
            if (!this.rights) {
                component.text = '';
            } else if (this.reportAbuseMuteOption) {
                component.colour = Colors.RED;
                component.text = 'Moderator option: Mute player for 48 hours: <ON>';
            } else {
                component.colour = Colors.WHITE;
                component.text = 'Moderator option: Mute player for 48 hours: <OFF>';
            }
        } else if (clientCode === ComType.CC_LAST_LOGIN_INFO || clientCode === ComType.CC_LAST_LOGIN_INFO2) {
            if (this.lastAddress === 0) {
                component.text = '';
            } else {
                let text: string;
                if (this.daysSinceLastLogin === 0) {
                    text = 'earlier today';
                } else if (this.daysSinceLastLogin === 1) {
                    text = 'yesterday';
                } else {
                    text = this.daysSinceLastLogin + ' days ago';
                }
                component.text = 'You last logged in ' + text + ' from: ' + JString.formatIPv4(this.lastAddress); // TODO dns lookup??
            }
        } else if (clientCode === ComType.CC_UNREAD_MESSAGES) {
            if (this.unreadMessages === 0) {
                component.text = '0 unread messages';
                component.colour = Colors.YELLOW;
            }
            if (this.unreadMessages === 1) {
                component.text = '1 unread message';
                component.colour = Colors.GREEN;
            }
            if (this.unreadMessages > 1) {
                component.text = this.unreadMessages + ' unread messages';
                component.colour = Colors.GREEN;
            }
        } else if (clientCode === ComType.CC_RECOVERY1) {
            if (this.daysSinceRecoveriesChanged === 201) {
                component.text = '';
            } else if (this.daysSinceRecoveriesChanged === 200) {
                component.text = 'You have not yet set any password recovery questions.';
            } else {
                let text: string;
                if (this.daysSinceRecoveriesChanged === 0) {
                    text = 'Earlier today';
                } else if (this.daysSinceRecoveriesChanged === 1) {
                    text = 'Yesterday';
                } else {
                    text = this.daysSinceRecoveriesChanged + ' days ago';
                }
                component.text = text + ' you changed your recovery questions';
            }
        } else if (clientCode === ComType.CC_RECOVERY2) {
            if (this.daysSinceRecoveriesChanged === 201) {
                component.text = '';
            } else if (this.daysSinceRecoveriesChanged === 200) {
                component.text = 'We strongly recommend you do so now to secure your account.';
            } else {
                component.text = 'If you do not remember making this change then cancel it immediately';
            }
        } else if (clientCode === ComType.CC_RECOVERY3) {
            if (this.daysSinceRecoveriesChanged === 201) {
                component.text = '';
            } else if (this.daysSinceRecoveriesChanged === 200) {
                component.text = "Do this from the 'account management' area on our front webpage";
            } else {
                component.text = "Do this from the 'account management' area on our front webpage";
            }
        }
    };

    private executeClientscript1 = (component: ComType, scriptId: number): number => {
        if (!component.scripts || scriptId >= component.scripts.length) {
            return -2;
        }

        try {
            const script: Uint16Array | null = component.scripts[scriptId];
            if (!script) {
                // -1 is right bcos if an exception happen from array not being initialized in the lower code etc etc
                return -1;
            }
            let register: number = 0;
            let pc: number = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const opcode: number = script[pc++];
                if (opcode === 0) {
                    return register;
                }

                if (opcode === 1) {
                    // load_skill_level {skill}
                    register += this.skillLevel[script[pc++]];
                } else if (opcode === 2) {
                    // load_skill_base_level {skill}
                    register += this.skillBaseLevel[script[pc++]];
                } else if (opcode === 3) {
                    // load_skill_exp {skill}
                    register += this.skillExperience[script[pc++]];
                } else if (opcode === 4) {
                    // load_inv_count {interface id} {obj id}
                    const com: ComType = ComType.instances[script[pc++]];
                    const obj: number = script[pc++] + 1;

                    if (com.invSlotObjId && com.invSlotObjCount) {
                        for (let i: number = 0; i < com.invSlotObjId.length; i++) {
                            if (com.invSlotObjId[i] === obj) {
                                register += com.invSlotObjCount[i];
                            }
                        }
                    } else {
                        register += 0; // TODO this is custom bcos idk if it can fall 'out of sync' if u dont add to register...
                    }
                } else if (opcode === 5) {
                    // load_var {id}
                    register += this.varps[script[pc++]];
                } else if (opcode === 6) {
                    // load_next_level_xp {skill}
                    register += this.levelExperience[this.skillBaseLevel[script[pc++]] - 1];
                } else if (opcode === 7) {
                    register += ((this.varps[script[pc++]] * 100) / 46875) | 0;
                } else if (opcode === 8) {
                    // load_combat_level
                    register += this.localPlayer?.combatLevel || 0;
                } else if (opcode === 9) {
                    // load_total_level
                    for (let i: number = 0; i < 19; i++) {
                        if (i === 18) {
                            // runecrafting
                            i = 20;
                        }

                        register += this.skillBaseLevel[i];
                    }
                } else if (opcode === 10) {
                    // load_inv_contains {interface id} {obj id}
                    const com: ComType = ComType.instances[script[pc++]];
                    const obj: number = script[pc++] + 1;

                    for (let i: number = 0; i < com.invSlotObjId!.length; i++) {
                        if (com.invSlotObjId![i] === obj) {
                            register += 999999999;
                            break;
                        }
                    }
                } else if (opcode === 11) {
                    // load_energy
                    register += this.energy;
                } else if (opcode === 12) {
                    // load_weight
                    register += this.weightCarried;
                } else if (opcode === 13) {
                    // load_bool {varp} {bit: 0..31}
                    const varp: number = this.varps[script[pc++]];
                    const lsb: number = script[pc++];

                    register += (varp & (0x1 << lsb)) === 0 ? 0 : 1;
                }
            }
        } catch (e) {
            return -1;
        }
    };

    // ---- private functions

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
            return ((amount / 1000) | 0) + 'K';
        } else {
            return ((amount / 1000000) | 0) + 'M';
        }
    };
}
