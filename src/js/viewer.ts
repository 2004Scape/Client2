import 'style/viewer.scss';

import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import ComType from './jagex2/config/ComType';

import Draw2D from './jagex2/graphics/Draw2D';
import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {downloadText, downloadUrl} from './jagex2/util/JsUtil';
import GameShell from './jagex2/client/GameShell';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import Bzip from './vendor/bzip';
import Colors from './jagex2/graphics/Colors';
import {Client} from './client';
import {setupConfiguration} from './configuration';

// noinspection JSSuspiciousNameCombination
class Viewer extends Client {
    // id -> name for cache files
    packfiles: Map<number, string>[] = [];

    inputSpeedMultiplier = 2;
    model = {
        id: parseInt(GameShell.getParameter('model')) || 0,
        pitch: parseInt(GameShell.getParameter('x')) || 0,
        yaw: parseInt(GameShell.getParameter('y')) || 0,
        roll: parseInt(GameShell.getParameter('z')) || 0,
        built: null as Model | null
    };
    camera = {
        x: parseInt(GameShell.getParameter('eyeX')) || 0,
        y: parseInt(GameShell.getParameter('eyeY')) || 0,
        z: parseInt(GameShell.getParameter('eyeZ')) || 420,
        pitch: parseInt(GameShell.getParameter('eyePitch')) || 0
    };

    async loadPack(url: string): Promise<Map<number, string>> {
        const map: Map<number, string> = new Map();

        const pack: string = await downloadText(url);
        const lines: string[] = pack.split('\n');
        for (let i: number = 0; i < lines.length; i++) {
            const line: string = lines[i];
            const idx: number = line.indexOf('=');
            if (idx === -1) {
                continue;
            }

            const id: number = parseInt(line.substring(0, idx));
            const name: string = line.substring(idx + 1);
            map.set(id, name);
        }

        return map;
    }

    load = async (): Promise<void> => {
        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        try {
            await this.showProgress(10, 'Connecting to fileserver');

            await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
            this.db = new Database(await Database.openDatabase());

            const checksums: Packet = new Packet(new Uint8Array(await downloadUrl(`${Client.httpAddress}/crc`)));
            for (let i: number = 0; i < 9; i++) {
                this.archiveChecksums[i] = checksums.g4;
            }

            const title: Jagfile = await this.loadArchive('title', 'title screen', this.archiveChecksums[1], 10);

            this.fontPlain11 = PixFont.fromArchive(title, 'p11');
            this.fontPlain12 = PixFont.fromArchive(title, 'p12');
            this.fontBold12 = PixFont.fromArchive(title, 'b12');
            this.fontQuill8 = PixFont.fromArchive(title, 'q8');

            const config: Jagfile = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            const interfaces: Jagfile = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            const media: Jagfile = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            const models: Jagfile = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            const textures: Jagfile = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            const wordenc: Jagfile = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

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
            WordFilter.unpack(wordenc);

            await this.showProgress(100, 'Getting ready to start...');

            this.drawArea?.bind();
            Draw3D.init2D();

            await this.showModels();
        } catch (err) {
            this.errorLoading = true;
            console.error(err);
        }
    };

    update = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        this.loopCycle++;
    };

    draw = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawError();
            return;
        }

        Draw2D.clear();
        Draw2D.fillRect(0, 0, this.width, this.height, Colors.BLACK);

        if (this.model.built === null) {
            this.model.built = Model.model(this.model.id);
        }

        this.model.built.calculateNormals(64, 850, -30, -50, -30, true);
        this.model.built.drawSimple(this.model.pitch, this.model.yaw, this.model.roll, this.camera.pitch, this.camera.x, this.camera.y, this.camera.z);

        // debug
        this.fontBold12?.drawStringRight(this.width - 1, this.fontBold12.height, `FPS: ${this.fps}`, Colors.YELLOW);
        this.fontBold12?.drawString(1, this.fontBold12.height, `ID: ${this.model.id}`, Colors.YELLOW);

        this.drawArea?.draw(0, 0);
    };

    async showModels(): Promise<void> {
        this.packfiles[0] = await this.loadPack(`${Client.githubRepository}/data/pack/model.pack`);

        const leftPanel: HTMLElement | null = document.getElementById('leftPanel');
        if (leftPanel) {
            leftPanel.innerHTML = '';

            {
                const input: HTMLInputElement = document.createElement('input');
                input.type = 'search';
                input.placeholder = 'Search';
                input.oninput = (): void => {
                    const filter: string = input.value.toLowerCase().replaceAll(' ', '_');

                    for (let i: number = 0; i < ul.children.length; i++) {
                        const child: HTMLElement = ul.children[i] as HTMLElement;

                        if (child.id.indexOf(filter) > -1) {
                            child.style.display = '';
                        } else {
                            child.style.display = 'none';
                        }
                    }
                };
                leftPanel.appendChild(input);
            }

            // create a clickable list of all the files in the pack, that sets this.model.id on click
            const ul: HTMLUListElement = document.createElement('ul');
            ul.className = 'list-group';
            leftPanel.appendChild(ul);

            for (const [id, name] of this.packfiles[0]) {
                const li: HTMLLIElement = document.createElement('li');
                li.id = name;
                li.className = 'list-group-item';
                if (id === 0) {
                    li.className += ' active';
                }
                li.innerText = name;
                li.onclick = (): void => {
                    // unmark the last selected item have fun :)
                    const last: Element | null = ul.querySelector('.active');
                    if (last) {
                        last.className = 'list-group-item';
                    }

                    // mark the new selected item
                    li.className = 'list-group-item active';

                    this.model.id = id;
                    this.model.built = Model.model(this.model.id);
                };
                ul.appendChild(li);
            }
        }
    }
}

await setupConfiguration();
new Viewer().run().then((): void => {});
