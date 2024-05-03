// noinspection JSSuspiciousNameCombination,DuplicatedCode

import 'style/items.scss';

import SeqType from './jagex2/config/SeqType';
import ObjType from './jagex2/config/ObjType';

import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import SeqBase from './jagex2/graphics/SeqBase';
import SeqFrame from './jagex2/graphics/SeqFrame';

import Jagfile from './jagex2/io/Jagfile';

import {downloadText, downloadUrl} from './jagex2/util/JsUtil';
import Packet from './jagex2/io/Packet';
import Database from './jagex2/io/Database';
import {canvas2d} from './jagex2/graphics/Canvas';
import Bzip from './vendor/bzip';
import Pix24 from './jagex2/graphics/Pix24';
import PixMap from './jagex2/graphics/PixMap';
import {Client} from './client';
import {setupConfiguration} from './configuration';

class Items extends Client {
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

    //

    async populateItems(): Promise<void> {
        const items: HTMLElement | null = document.getElementById('items');
        if (!items) {
            return;
        }

        items.innerHTML = '';

        this.packfiles[1] = await this.loadPack(`${Client.githubRepository}/data/src/pack/obj.pack`);

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

await setupConfiguration();
new Items().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
