import GameShell from './GameShell.js';

import SoundTrack from './audio/SoundTrack.js';

import SeqType from './config/SeqType.js';
import LocType from './config/LocType.js';
import FloType from './config/FloType.js';
import ObjType from './config/ObjType.js';
import NpcType from './config/NpcType.js';
import IdkType from './config/IdkType.js';
import SpotAnimType from './config/SpotAnimType.js';
import VarpType from './config/VarpType.js';
import IfType from './config/IfType.js';

import Draw3D from './graphics/Draw3D.js';
import Font from './graphics/Font.js';
import Model from './graphics/Model.js';
import SeqBase from './graphics/SeqBase.js';
import SeqFrame from './graphics/SeqFrame.js';

import Archive from './io/Archive.js';

import Censor from './util/Censor.js';
import { downloadUrl } from './util/JsUtil.js';
import Draw2D from './graphics/Draw2D.js';

class Playground extends GameShell {
    static HOST = 'https://world2.runewiki.org';

    p11 = null;
    p12 = null;
    b12 = null;
    q8 = null;

    constructor() {
        super();
    }

    async load() {
        await this.showProgress(10, 'Connecting to fileserver');

        let checksums = await downloadUrl(`${Playground.HOST}/crc`);
        let archiveChecksums = [];
        for (let i = 0; i < checksums.length / 4; i++) {
            archiveChecksums[i] = checksums.g4();
        }

        let title = await this.loadArchive('title', 'title screen', archiveChecksums[1], 10);

        this.p11 = Font.fromArchive(title, 'p11');
        this.p12 = Font.fromArchive(title, 'p12');
        this.b12 = Font.fromArchive(title, 'b12');
        this.q8 = Font.fromArchive(title, 'q8');

        let config = await this.loadArchive('config', 'config', archiveChecksums[2], 15);
        let interfaces = await this.loadArchive('interface', 'interface', archiveChecksums[3], 20);
        let media = await this.loadArchive('media', '2d graphics', archiveChecksums[4], 30);
        let models = await this.loadArchive('models', '3d graphics', archiveChecksums[5], 40);
        let textures = await this.loadArchive('textures', 'textures', archiveChecksums[6], 60);
        let wordenc = await this.loadArchive('wordenc', 'chat system', archiveChecksums[7], 65);
        let sounds = await this.loadArchive('sounds', 'sound effects', archiveChecksums[8], 70);

        await this.showProgress(75, 'Unpacking media');

        await this.showProgress(80, 'Unpacking textures');
        Draw3D.unpackTextures(textures);

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

        // this.setLoopRate(1);
        this.drawArea.bind();
        Draw3D.init2D();
    }

    update() {
    }

    async draw() {
        Draw2D.clear();
        Draw2D.fillRect(0, 0, this.width, this.height, 0x555555);

        /// draw all textures
        // let x = 0;
        // let y = 0;
        // for (let i = 0; i < Draw3D.textureCount; i++) {
        //     if (x > this.width) {
        //         x = 0;
        //         y += 128;
        //     }

        //     Draw3D.textures[i].draw(x, y);
        //     x += 128;
        // }

        /// draw all flotypes
        // let x = 0;
        // let y = this.b12.fontHeight;
        // for (let i = 0; i < FloType.count; i++) {
        //     let flo = FloType.get(i);
        //     this.b12.draw(x, y, `${i}: ${flo.name}`, 0xFFFF00);

        //     let textSize = this.b12.getTextWidth(`${i}: ${flo.name}`);
            
        //     if (flo.texture != -1) {
        //         Draw3D.textures[flo.texture].draw(x + textSize, y - this.b12.fontHeight + 1, this.b12.fontHeight, this.b12.fontHeight);
        //     } else {
        //         Draw2D.fillRect(x + textSize, y - this.b12.fontHeight + 1, this.b12.fontHeight, this.b12.fontHeight, flo.rgb);
        //     }

        //     y += this.b12.fontHeight;
        //     if (y > this.height) {
        //         x += 200;
        //         y = this.b12.fontHeight;
        //     }
        // }

        // draw a model
        let model = new Model(0);
        model.calculateNormals(64, 768, -50, -10, -50, true);
        model.draw(0, 0, 0, 0, 0, 0, 420);

        this.b12.drawRight(this.width, this.b12.fontHeight, `FPS: ${this.fps}`, 0xFFFF00);
        this.drawArea.draw(0, 0);
    }

    // ----

    async loadArchive(filename, displayName, crc, progress) {
        await this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Playground.HOST}/${filename}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }
}

const playground = new Playground();
playground.run();
