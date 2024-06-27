import GameShell from './jagex2/client/GameShell';

import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import Component from './jagex2/config/Component';

import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import AnimBase from './jagex2/graphics/AnimBase';
import AnimFrame from './jagex2/graphics/AnimFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {downloadUrl, sleep} from './jagex2/util/JsUtil';
import Draw2D from './jagex2/graphics/Draw2D';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import Bzip from './vendor/bzip';
import Colors from './jagex2/graphics/Colors';
import {Client} from './client';
import {setupConfiguration} from './configuration';

// noinspection JSSuspiciousNameCombination
class Playground extends Client {
    lastHistoryRefresh = 0;
    historyRefresh = true;

    private eyeX: number = 0;
    private eyeY: number = 0;
    private eyeZ: number = 0;
    private eyePitch: number = 0;
    private eyeYaw: number = 0;

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

    load = async (): Promise<void> => {
        await this.showProgress(10, 'Connecting to fileserver');

        await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
        this.db = new Database(await Database.openDatabase());

        const checksums: Packet = new Packet(new Uint8Array(await downloadUrl(`${Client.httpAddress}/crc`)));
        const archiveChecksums: number[] = [];
        for (let i: number = 0; i < 9; i++) {
            archiveChecksums[i] = checksums.g4;
        }

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

        await this.showProgress(75, 'Unpacking media');

        await this.showProgress(80, 'Unpacking textures');
        Draw3D.unpackTextures(textures);
        Draw3D.setBrightness(0.8);
        Draw3D.initPool(20);

        await this.showProgress(83, 'Unpacking models');
        Model.unpack(models);
        AnimBase.unpack(models);
        AnimFrame.unpack(models);

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
        Component.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

        await this.showProgress(97, 'Preparing game engine');
        WordFilter.unpack(wordenc);

        // this.setLoopRate(1);
        this.drawArea?.bind();
        Draw3D.init2D();
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

    draw = async (): Promise<void> => {
        Draw2D.clear();
        Draw2D.fillRect(0, 0, this.width, this.height, 0x555555);

        // draw a model
        const model: Model = Model.model(this.model.id);
        model.calculateNormals(64, 850, -30, -50, -30, true);
        model.draw(this.model.yaw, Draw3D.sin[this.eyePitch], Draw3D.cos[this.eyePitch], Draw3D.sin[this.eyeYaw], Draw3D.cos[this.eyeYaw], this.model.x - this.eyeX, this.model.y - this.eyeY, this.model.z - this.eyeZ, 0);

        // debug
        if (this.fontBold12) {
            this.fontBold12.drawStringRight(this.width, this.fontBold12.height, `FPS: ${this.fps}`, Colors.YELLOW);

            // controls
            let leftY: number = this.fontBold12.height;
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
new Playground().run().then((): void => {});
