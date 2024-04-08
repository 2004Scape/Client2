import GameShell from './jagex2/client/GameShell';

import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import ComType from './jagex2/config/ComType';

import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {downloadUrl, sleep} from './jagex2/util/JsUtil';
import Draw2D from './jagex2/graphics/Draw2D';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import Bzip from './vendor/bzip';
import Colors from './jagex2/graphics/Colors';
import {canvas, glCanvas, gl} from './jagex2/graphics/Canvas';
import {Client} from './client';
import {setupConfiguration} from './configuration';
import DrawGL from './jagex2/graphics/DrawGL';
import GLManager from './jagex2/graphics/GLManager';
import {RenderMode} from './jagex2/graphics/RenderMode';

// noinspection JSSuspiciousNameCombination
class Playground2 extends Client {
    lastHistoryRefresh = 0;
    historyRefresh = true;

    private eyeX: number = 0;
    private eyeY: number = 0;
    private eyeZ: number = 0;
    private eyePitch: number = 0;
    private eyeYaw: number = 0;
    private glRenderer: string = '';
    private glVersion: string = '';
    private gpuRender: boolean = true;

    modifier = 2;
    model = {
        id: parseInt(GameShell.getParameter('model')) || 0,
        x: 0,
        y: 0,
        z: 420,
        yaw: 0
    };

    constructor() {
        super(true);
    }

    showProgress = async (progress: number, message: string): Promise<void> => {
        console.log(`${progress}% ov: ${message}`);

        const x: number = 360;
        const y: number = 200;
        const offsetY: number = 20;
        this.fontBold12?.drawStringCenter((x / 2) | 0, ((y / 2) | 0) - offsetY - 26, 'RuneScape is loading - please wait...', Colors.WHITE);
        const midY: number = ((y / 2) | 0) - 18 - offsetY;

        Draw2D.drawRect(((x / 2) | 0) - 152, midY, 304, 34, Colors.PROGRESS_RED);
        Draw2D.drawRect(((x / 2) | 0) - 151, midY + 1, 302, 32, Colors.BLACK);
        Draw2D.fillRect(((x / 2) | 0) - 150, midY + 2, progress * 3, 30, Colors.PROGRESS_RED);
        Draw2D.fillRect(((x / 2) | 0) - 150 + progress * 3, midY + 2, 300 - progress * 3, 30, Colors.BLACK);

        this.fontBold12?.drawStringCenter((x / 2) | 0, ((y / 2) | 0) + 5 - offsetY, message, Colors.WHITE);

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    };

    private modelsLoaded = false;
    load = async (): Promise<void> => {
        if (!gl) {
            this.glVersion = 'WebGL 2.0 not supported';
            this.glRenderer = 'WebGL 2.0 not supported';
        } else {
            this.glVersion = gl.getParameter(gl.VERSION);
            this.glRenderer = gl.getParameter(gl.RENDERER);
        }

        //Draw3D.init2D();
        //DrawGL.init();

        await this.showProgress(10, 'Connecting to fileserver');

        await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
        this.db = new Database(await Database.openDatabase());

        const checksums: Packet = new Packet(new Uint8Array(await downloadUrl(`${Client.httpAddress}/crc`)));
        const archiveChecksums: number[] = [];
        for (let i: number = 0; i < 9; i++) {
            archiveChecksums[i] = checksums.g4;
        }

        await this.showProgress(75, 'Unpacking media');

        const title: Jagfile = await this.loadArchive('title', 'title screen', archiveChecksums[1], 10);

        this.fontPlain11 = PixFont.fromArchive(title, 'p11');
        this.fontPlain12 = PixFont.fromArchive(title, 'p12');
        this.fontBold12 = PixFont.fromArchive(title, 'b12');
        this.fontQuill8 = PixFont.fromArchive(title, 'q8');

        const config: Jagfile = await this.loadArchive('config', 'config', archiveChecksums[2], 15);
        const interfaces: Jagfile = await this.loadArchive('interface', 'interface', archiveChecksums[3], 20);
        const media: Jagfile = await this.loadArchive('media', '2d graphics', archiveChecksums[4], 30);
        const models: Jagfile = await this.loadArchive('models', '3d graphics', archiveChecksums[5], 40);
        const textures: Jagfile = await this.loadArchive('textures', 'textures', archiveChecksums[6], 60);
        const wordenc: Jagfile = await this.loadArchive('wordenc', 'chat system', archiveChecksums[7], 65);
        const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', archiveChecksums[8], 70);

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
        ObjType.unpack(config, true);
        NpcType.unpack(config);
        IdkType.unpack(config);
        SpotAnimType.unpack(config);
        VarpType.unpack(config);

        await this.showProgress(90, 'Unpacking sounds');
        Wave.unpack(sounds);

        await this.showProgress(92, 'Unpacking interfaces');
        ComType.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

        await this.showProgress(97, 'Preparing game engine');
        //await sleep(1000 * 10);
        WordFilter.unpack(wordenc);

        // this.setLoopRate(1);
        //this.drawArea?.bind();

        this.modelsLoaded = true;
    };

    update = async (): Promise<void> => {
        this.updateKeysPressed();
        this.updateKeysHeld();

        this.lastHistoryRefresh++;

        if (this.lastHistoryRefresh > 50) {
            if (this.historyRefresh) {
                GameShell.setParameter('model', this.model.id.toString());

                this.historyRefresh = false;
            }

            this.lastHistoryRefresh = 0;
        }
    };

    drawGpu = async (): Promise<void> => {
        if (!DrawGL.glInitted) return;

        const model: Model = Model.model(this.model.id);
        model.calculateNormals(64, 850, -30, -50, -30, true);

        DrawGL.targetBufferOffset += model.draw(
            this.model.yaw,
            Draw3D.sin[this.eyePitch],
            Draw3D.cos[this.eyePitch],
            Draw3D.sin[this.eyeYaw],
            Draw3D.cos[this.eyeYaw],
            this.model.x - this.eyeX,
            this.model.y - this.eyeY,
            this.model.z - this.eyeZ,
            0,
            RenderMode.GPU
        );

        if (this.fontBold12) {
            this.fontBold12.drawStringRight(this.width, this.fontBold12.height, `FPS: ${this.fps}`, Colors.YELLOW);

            // controls
            let leftY: number = this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'WebGL Edition', Colors.WHITE);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, `Renderer: ${this.glRenderer}`, Colors.WHITE);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, `Version: ${this.glVersion}`, Colors.WHITE);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, `Model: ${this.model.id}`, Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'Controls:', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'r - reset camera and model rotation + movement speed', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, '1 and 2 - change model', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, '[ and ] - adjust movement speed', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'left and right - adjust model yaw', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'up and down - adjust model pitch', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, '. and / - adjust model roll', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'w and s - move camera along z axis', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'a and d - move camera along x axis', Colors.YELLOW);
            leftY += this.fontBold12.height;
            this.fontBold12.drawString(0, leftY, 'q and e - move camera along y axis', Colors.YELLOW);
        }

        DrawGL.draw();
    };

    draw = async (): Promise<void> => {
        if (this.gpuRender && this.modelsLoaded) {
            await this.drawGpu();
        } else if (!this.gpuRender) {
            Draw2D.clear();

            const startColor: number = 0x555555;
            Draw2D.fillRect(0, 0, this.width, this.height, startColor);
            // draw a model
            const model: Model = Model.model(this.model.id);
            model.calculateNormals(64, 850, -30, -50, -30, true);
            model.draw(this.model.yaw, Draw3D.sin[this.eyePitch], Draw3D.cos[this.eyePitch], Draw3D.sin[this.eyeYaw], Draw3D.cos[this.eyeYaw], this.model.x - this.eyeX, this.model.y - this.eyeY, this.model.z - this.eyeZ, 0);

            // debug
            if (this.fontBold12) {
                this.fontBold12.drawStringRight(this.width, this.fontBold12.height, `FPS: ${this.fps}`, Colors.YELLOW);

                // controls
                let leftY: number = this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'WebGL Edition', Colors.WHITE);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, `Renderer: ${this.glRenderer}`, Colors.WHITE);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, `Version: ${this.glVersion}`, Colors.WHITE);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, `Model: ${this.model.id}`, Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'Controls:', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'r - reset camera and model rotation + movement speed', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, '1 and 2 - change model', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, '[ and ] - adjust movement speed', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'left and right - adjust model yaw', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'up and down - adjust model pitch', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, '. and / - adjust model roll', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'w and s - move camera along z axis', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'a and d - move camera along x axis', Colors.YELLOW);
                leftY += this.fontBold12.height;
                this.fontBold12.drawString(0, leftY, 'q and e - move camera along y axis', Colors.YELLOW);
            }

            this.drawArea?.draw(0, 0);
        }
    };

    // ----

    updateKeysPressed(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const key: number = this.pollKey();
            if (key === -1) {
                break;
            }

            if (key === 'r'.charCodeAt(0)) {
                this.modifier = 2;
                this.historyRefresh = true;
            } else if (key === '1'.charCodeAt(0)) {
                this.model.id--;
                if (this.model.id < 0 && Model.metadata) {
                    this.model.id = Model.metadata.length - 100 - 1;
                }
                this.historyRefresh = true;
            } else if (key === '2'.charCodeAt(0)) {
                this.model.id++;
                if (Model.metadata && this.model.id >= Model.metadata.length - 100) {
                    this.model.id = 0;
                }
                this.historyRefresh = true;
            } else if (key === '.'.charCodeAt(0)) {
                console.log('roll' + this.gpuRender);
                this.gpuRender = !this.gpuRender;
                glCanvas.style.display = this.gpuRender ? 'block' : 'none';
                canvas.style.display = !this.gpuRender ? 'block' : 'none';
                this.historyRefresh = true;
            }
        }
    }

    updateKeysHeld(): void {
        if (this.actionKey['['.charCodeAt(0)]) {
            this.modifier--;
        } else if (this.actionKey[']'.charCodeAt(0)]) {
            this.modifier++;
        }

        if (this.actionKey[1]) {
            // left arrow
            this.model.yaw += this.modifier;
            this.historyRefresh = true;
        } else if (this.actionKey[2]) {
            // right arrow
            this.model.yaw -= this.modifier;
            this.historyRefresh = true;
        }

        if (this.actionKey['w'.charCodeAt(0)]) {
            this.model.z -= this.modifier;
            this.historyRefresh = true;
        } else if (this.actionKey['s'.charCodeAt(0)]) {
            this.model.z += this.modifier;
            this.historyRefresh = true;
        }

        if (this.actionKey['a'.charCodeAt(0)]) {
            this.model.x -= this.modifier;
            this.historyRefresh = true;
        } else if (this.actionKey['d'.charCodeAt(0)]) {
            this.model.x += this.modifier;
            this.historyRefresh = true;
        }

        if (this.actionKey['q'.charCodeAt(0)]) {
            this.model.y += this.modifier;
            this.historyRefresh = true;
        } else if (this.actionKey['e'.charCodeAt(0)]) {
            this.model.y -= this.modifier;
            this.historyRefresh = true;
        }

        this.eyePitch = this.eyePitch & 2047;
        this.eyeYaw = this.eyeYaw & 2047;
        this.model.yaw = this.model.yaw & 2047;
    }
}

await setupConfiguration();
new Playground2().run().then((): void => {});
