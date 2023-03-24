import GameShell from './GameShell.js';

import Font from './graphics/Font.js';
import Model from './graphics/Model.js';

import Archive from './io/Archive.js';

import { downloadUrl } from './util/JsUtil.js';

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

        await this.showProgress(83, 'Unpacking models');
        Model.unpack(models);

        await this.showProgress(86, 'Unpacking config');

        await this.showProgress(90, 'Unpacking sounds');

        await this.showProgress(92, 'Unpacking interfaces');

        await this.showProgress(97, 'Preparing game engine');
    }

    update() {
    }

    async draw() {
        this.drawArea.clear();
        this.b12.draw(50, 50, `FPS: ${this.fps}`, 0xFFFFFF);
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
