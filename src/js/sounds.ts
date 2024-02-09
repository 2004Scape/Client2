import 'style/sounds.scss';

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

import {playWave} from './jagex2/util/AudioUtil';
import './vendor/midi.js';

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

            const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

            await this.showProgress(50, 'Unpacking sounds');
            Wave.unpack(sounds);

            await this.showProgress(100, 'Getting ready to start...');

            await this.populateSounds();
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

    async populateSounds(): Promise<void> {
        const sounds: HTMLElement | null = document.getElementById('sounds');
        if (!sounds) {
            return;
        }

        sounds.innerHTML = '';

        this.packfiles[1] = await this.loadPack(`${Viewer.REPO}/data/pack/sound.pack`);

        const search: HTMLInputElement = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Search';
        search.tabIndex = 1;
        search.oninput = (): void => {
            const ul: HTMLUListElement | null = document.querySelector('#soundList');
            if (!ul) {
                return;
            }

            const filter: string = search.value.toLowerCase().replaceAll(' ', '_');

            for (let i: number = 0; i < ul.children.length; i++) {
                const child: HTMLElement = ul.children[i] as HTMLElement;

                const rsId: string = child.getAttribute('rs-id') ?? child.id;
                const rsDebugName: string = child.getAttribute('rs-debugname') ?? child.id;

                if (child.id.indexOf(filter) > -1 || rsId.indexOf(filter) > -1 || rsDebugName.indexOf(filter) > -1) {
                    child.style.display = '';
                } else {
                    child.style.display = 'none';
                }
            }
        };
        sounds.appendChild(search);

        const ul: HTMLUListElement = document.createElement('ul');
        ul.id = 'soundList';
        ul.className = 'list-group';
        sounds.appendChild(ul);

        for (const [id, name] of this.packfiles[1]) {
            const li: HTMLLIElement = document.createElement('li');
            li.id = name;
            li.setAttribute('rs-id', id.toString());
            li.setAttribute('rs-debugname', name);
            li.className = 'list-group-item list-group-item-center';
            li.innerText = name + ' - ' + id;
            if (id === 0) {
                li.className += ' active';
            }
            li.onclick = async (): Promise<void> => {
                const last: Element | null = ul.querySelector('.active');
                if (last) {
                    last.className = 'list-group-item list-group-item-center';
                }

                li.className = 'list-group-item list-group-item-center active';

                const buf: Packet | null = Wave.generate(id, 0);
                if (!buf) {
                    return;
                }

                await playWave(buf.data.slice(0, buf.pos), 128);
            };
            ul.appendChild(li);
        }
    }
}

new Viewer().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
