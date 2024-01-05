import GameShell from './jagex2/client/GameShell.js';
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
import Draw3D from './jagex2/graphics/Draw3D.js';
import Font from './jagex2/graphics/Font.js';
import Model from './jagex2/graphics/Model.js';
import SeqBase from './jagex2/graphics/SeqBase.js';
import SeqFrame from './jagex2/graphics/SeqFrame.js';
import Archive from './jagex2/io/Archive.js';
import Censor from './jagex2/util/Censor.js';
import { downloadUrl } from './jagex2/util/JsUtil.js';
import Draw2D from './jagex2/graphics/Draw2D.js';
class Playground extends GameShell {
    static HOST = 'https://w2.225.2004scape.org';
    p11 = null;
    p12 = null;
    b12 = null;
    q8 = null;
    constructor() {
        super(true);
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
        this.updateKeysPressed();
        this.updateKeysHeld();
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
        let model = new Model(this.model.id);
        model.calculateNormals(64, 768, -50, -10, -50, true);
        model.draw(this.model.pitch, this.model.yaw, this.model.roll, this.camera.pitch, this.camera.x, this.camera.y, this.camera.z);
        // debug
        this.b12.drawRight(this.width, this.b12.fontHeight, `FPS: ${this.fps}`, 0xFFFF00);
        this.b12.drawRight(this.width, this.height, `${this.model.pitch},${this.model.yaw},${this.model.roll},${this.camera.pitch},${this.camera.x},${this.camera.z},${this.camera.y}`, 0xFFFF00);
        // controls
        let leftY = this.b12.fontHeight;
        this.b12.draw(0, leftY, `Model: ${this.model.id}`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `Controls:`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `r - reset camera and model rotation + movement speed`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `1 and 2 - change model`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `[ and ] - adjust movement speed`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `left and right - adjust model yaw`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `up and down - adjust model pitch`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `. and / - adjust model roll`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `w and s - move camera along z axis`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `a and d - move camera along x axis`, 0xFFFF00);
        leftY += this.b12.fontHeight;
        this.b12.draw(0, leftY, `q and e - move camera along y axis`, 0xFFFF00);
        this.drawArea.draw(0, 0);
    }
    // ----
    async loadArchive(filename, displayName, crc, progress) {
        await this.showProgress(progress, `Requesting ${displayName}`);
        let data = await Archive.loadUrl(`${Playground.HOST}/${filename}${crc}`);
        await this.showProgress(progress, `Loading ${displayName} - 100%`);
        return data;
    }
    modifier = 2;
    model = {
        id: 0,
        pitch: 0,
        yaw: 0,
        roll: 0
    };
    camera = {
        x: 0,
        y: 0,
        z: 420,
        pitch: 0
    };
    updateKeysPressed() {
        while (true) {
            let key = this.pollKey();
            if (key === -1) {
                break;
            }
            if (key === 'r'.charCodeAt(0)) {
                this.modifier = 2;
                this.model = {
                    id: this.model.id,
                    pitch: 0,
                    yaw: 0,
                    roll: 0
                };
                this.camera = {
                    x: 0,
                    y: 0,
                    z: 420,
                    pitch: 0
                };
            }
            else if (key === '1'.charCodeAt(0)) {
                this.model.id--;
                if (this.model.id < 0) {
                    this.model.id = Model.count - 1;
                }
            }
            else if (key === '2'.charCodeAt(0)) {
                this.model.id++;
                if (this.model.id >= Model.count) {
                    this.model.id = 0;
                }
            }
        }
    }
    updateKeysHeld() {
        if (this.actionKey['['.charCodeAt(0)]) {
            this.modifier--;
        }
        else if (this.actionKey[']'.charCodeAt(0)]) {
            this.modifier++;
        }
        if (this.actionKey[1]) {
            // left arrow
            this.model.yaw += this.modifier;
        }
        else if (this.actionKey[2]) {
            // right arrow
            this.model.yaw -= this.modifier;
        }
        if (this.actionKey[3]) {
            // up arrow
            this.model.pitch -= this.modifier;
        }
        else if (this.actionKey[4]) {
            // down arrow
            this.model.pitch += this.modifier;
        }
        if (this.actionKey['.'.charCodeAt(0)]) {
            this.model.roll += this.modifier;
        }
        else if (this.actionKey['/'.charCodeAt(0)]) {
            this.model.roll -= this.modifier;
        }
        if (this.actionKey['w'.charCodeAt(0)]) {
            this.camera.z -= this.modifier;
        }
        else if (this.actionKey['s'.charCodeAt(0)]) {
            this.camera.z += this.modifier;
        }
        if (this.actionKey['a'.charCodeAt(0)]) {
            this.camera.x -= this.modifier;
        }
        else if (this.actionKey['d'.charCodeAt(0)]) {
            this.camera.x += this.modifier;
        }
        if (this.actionKey['q'.charCodeAt(0)]) {
            this.camera.y -= this.modifier;
        }
        else if (this.actionKey['e'.charCodeAt(0)]) {
            this.camera.y += this.modifier;
        }
        this.model.pitch = this.model.pitch & 2047;
        this.model.yaw = this.model.yaw & 2047;
        this.model.roll = this.model.roll & 2047;
    }
}
const playground = new Playground();
playground.run().then(() => { });
//# sourceMappingURL=playground.js.map