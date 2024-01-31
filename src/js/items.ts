import 'style/items.scss';

import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import ComType from './jagex2/config/ComType';
import MesAnimType from './jagex2/config/MesAnimType';

import Draw2D from './jagex2/graphics/Draw2D';
import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {downloadText, downloadUrl, sleep} from './jagex2/util/JsUtil';
import GameShell from './jagex2/client/GameShell';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import {canvas, canvas2d} from './jagex2/graphics/Canvas';
import Pix8 from './jagex2/graphics/Pix8';
import Bzip from './vendor/bzip';
import Pix24 from './jagex2/graphics/Pix24';
import PixMap from './jagex2/graphics/PixMap';

class Viewer extends GameShell {
    static HOST: string = 'https://w2.225.2004scape.org';
    static REPO: string = 'https://raw.githubusercontent.com/2004scape/Server/main';
    static readonly CHARSET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

    private db: Database | null = null;

    alreadyStarted: boolean = false;
    errorStarted: boolean = false;
    errorLoading: boolean = false;
    errorHost: boolean = false;

    ingame: boolean = false;
    archiveChecksums: number[] = [];

    fontPlain11: PixFont | null = null;
    fontPlain12: PixFont | null = null;
    fontBold12: PixFont | null = null;
    fontQuill8: PixFont | null = null;

    // id -> name for cache files
    packfiles: Map<number, string>[] = [];

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

            const checksums: Packet = new Packet(new Uint8Array(await downloadUrl(`${Viewer.HOST}/crc`)));
            for (let i: number = 0; i < 9; i++) {
                this.archiveChecksums[i] = checksums.g4;
            }

            const title: Jagfile = await this.loadArchive('title', 'title screen', this.archiveChecksums[1], 10);

            this.fontPlain11 = PixFont.fromArchive(title, 'p11');
            this.fontPlain12 = PixFont.fromArchive(title, 'p12');
            this.fontBold12 = PixFont.fromArchive(title, 'b12');
            this.fontQuill8 = PixFont.fromArchive(title, 'q8');

            const config: Jagfile = await this.loadArchive('config', 'config', this.archiveChecksums[2], 15);
            const models: Jagfile = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            const textures: Jagfile = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);

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
            ObjType.unpack(config, true);

            await this.showProgress(100, 'Getting ready to start...');

            await this.populateItems();
        } catch (err) {
            this.errorLoading = true;
            console.error(err);
        }
    };

    update = async (): Promise<void> => {};

    draw = async (): Promise<void> => {};

    //

    showProgress = async (progress: number, str: string): Promise<void> => {
        console.log(`${progress}%: ${str}`);

        await super.showProgress(progress, str);
    };

    async loadArchive(filename: string, displayName: string, crc: number, progress: number): Promise<Jagfile> {
        let retry: number = 5;
        let data: Int8Array | undefined = await this.db?.cacheload(filename);
        if (data) {
            if (Packet.crc32(data) !== crc) {
                data = undefined;
            }
        }

        if (data) {
            return new Jagfile(data);
        }

        while (!data) {
            await this.showProgress(progress, `Requesting ${displayName}`);

            try {
                data = await downloadUrl(`${Viewer.HOST}/${filename}${crc}`);
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
    }

    //

    async populateItems(): Promise<void> {
        const items: HTMLElement | null = document.getElementById('items');
        if (!items) {
            return;
        }

        items.innerHTML = '';

        this.packfiles[1] = await this.loadPack(`${Viewer.REPO}/data/pack/obj.pack`);

        const command: HTMLInputElement = document.createElement('input');
        command.type = 'text';
        command.placeholder = '::give';
        command.tabIndex = -1;
        items.appendChild(command);

        // todo: toggle cert_

        const search: HTMLInputElement = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Search';
        search.tabIndex = 1;
        search.oninput = (): void => {
            const ul: HTMLUListElement | null = document.querySelector('#itemList');
            if (!ul) {
                return;
            }

            const filter: string = search.value.toLowerCase().replaceAll(' ', '_');

            for (let i: number = 0; i < ul.children.length; i++) {
                const child: HTMLElement = ul.children[i] as HTMLElement;

                const rsId: string = child.getAttribute('rs-id') ?? child.id;
                const rsDebugName: string = child.getAttribute('rs-debugname') ?? child.id;
                const rsName: string = child.getAttribute('rs-name') ?? child.id;

                if (child.id.indexOf(filter) > -1 || rsId.indexOf(filter) > -1 || rsDebugName.indexOf(filter) > -1 || rsName.indexOf(filter) > -1) {
                    child.style.display = '';
                } else {
                    child.style.display = 'none';
                }
            }
        };
        items.appendChild(search);

        const ul: HTMLUListElement = document.createElement('ul');
        ul.id = 'itemList';
        ul.className = 'list-group';
        items.appendChild(ul);

        const stackobj: Set<number> = new Set();
        for (const [id, name] of this.packfiles[1]) {
            const type: ObjType = ObjType.get(id);

            if (type.countobj === null || type.countco === null) {
                continue;
            }

            for (let i: number = 0; i < type.countobj.length; i++) {
                if (type.countco[i] === 0) {
                    break;
                }

                stackobj.add(type.countobj[i]);
            }
        }

        for (const [id, name] of this.packfiles[1]) {
            const type: ObjType = ObjType.get(id);

            if (type.certtemplate !== -1 || type.model === 0 || stackobj.has(id)) {
                continue;
            }

            const li: HTMLLIElement = document.createElement('li');
            li.id = name;
            li.setAttribute('rs-id', id.toString());
            li.setAttribute('rs-debugname', name);
            li.setAttribute('rs-name', type.name?.toLowerCase().replaceAll(' ', '_') ?? name);
            li.className = 'list-group-item list-group-item-center';
            if (id === 0) {
                li.className += ' active';
                command.value = `::give ${name} 1`;
            }
            li.onclick = (): void => {
                const last: Element | null = ul.querySelector('.active');
                if (last) {
                    last.className = 'list-group-item list-group-item-center';
                }

                li.className = 'list-group-item list-group-item-center active';
                command.value = `::give ${name} 1`;
            };

            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.className = 'icon';
            canvas.width = 32;
            canvas.height = 32;
            li.appendChild(canvas);

            const p: HTMLParagraphElement = document.createElement('p');
            if (type.name === null) {
                p.innerText = name;
            } else {
                p.innerText = type.name + ' - ' + name;
            }
            li.appendChild(p);

            const temp: PixMap = new PixMap(32, 32, canvas.getContext('2d', {willReadFrequently: true}) ?? canvas2d);
            const icon: Pix24 = ObjType.getIcon(id, 10000);

            temp.bind();
            Draw3D.init2D();
            icon.draw(0, 0);
            temp.draw(0, 0);

            ul.appendChild(li);
        }
    }
}

new Viewer().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
