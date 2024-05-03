import 'style/sounds.scss';

import Jagfile from './jagex2/io/Jagfile';

import {downloadText, downloadUrl, sleep} from './jagex2/util/JsUtil';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import Bzip from './vendor/bzip';

import {playWave} from './jagex2/util/AudioUtil';
import './vendor/midi.js';
import {setupConfiguration} from './configuration';
import {Client} from './client';

class Sounds extends Client {
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

    //

    async populateSounds(): Promise<void> {
        const sounds: HTMLElement | null = document.getElementById('sounds');
        if (!sounds) {
            return;
        }

        sounds.innerHTML = '';

        this.packfiles[1] = await this.loadPack(`${Client.githubRepository}/data/src/pack/sound.pack`);

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

await setupConfiguration();
new Sounds().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
