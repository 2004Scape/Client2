import 'style/mesanim.scss';

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

class Viewer extends GameShell {
    static HOST: string = 'https://w2.225.2004scape.org';
    static REPO: string = 'https://raw.githubusercontent.com/2004scape/Server/main';
    static readonly CHARSET: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

    private db: Database | null = null;

    alreadyStarted: boolean = false;
    errorStarted: boolean = false;
    errorLoading: boolean = false;
    errorHost: boolean = false;

    loopCycle: number = 0;
    ingame: boolean = false;
    archiveChecksums: number[] = [];

    fontPlain11: PixFont | null = null;
    fontPlain12: PixFont | null = null;
    fontBold12: PixFont | null = null;
    fontQuill8: PixFont | null = null;

    // id -> name for cache files
    packfiles: Map<number, string>[] = [];

    imageChatback: Pix8 | null = null;

    splitPages: string[][] = [];
    splitMesanimId: number = -1;

    chatInterfaceId: number = -1;
    activeNpc: NpcType = new NpcType();
    inputMesanimId: number = -1;
    input: string = '';

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
            const interfaces: Jagfile = await this.loadArchive('interface', 'interface', this.archiveChecksums[3], 20);
            const media: Jagfile = await this.loadArchive('media', '2d graphics', this.archiveChecksums[4], 30);
            const models: Jagfile = await this.loadArchive('models', '3d graphics', this.archiveChecksums[5], 40);
            const textures: Jagfile = await this.loadArchive('textures', 'textures', this.archiveChecksums[6], 60);
            const wordenc: Jagfile = await this.loadArchive('wordenc', 'chat system', this.archiveChecksums[7], 65);
            const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', this.archiveChecksums[8], 70);

            // this.packfiles[1] = await this.loadPack(`${Viewer.REPO}/data/pack/npc.pack`);
            // this.packfiles[2] = await this.loadPack(`${Viewer.REPO}/data/pack/mesanim.pack`);
            // this.packfiles[3] = await this.loadPack(`${Viewer.REPO}/data/pack/seq.pack`);

            const mesanim: Packet = new Packet(new Uint8Array(await downloadUrl(`${Viewer.HOST}/server/mesanim.dat`)));

            await this.showProgress(75, 'Unpacking media');
            this.imageChatback = Pix8.fromArchive(media, 'chatback', 0);

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
            MesAnimType.unpack(mesanim);

            await this.populateNpcSelector();
            await this.populateMesanimSelector();

            await this.showProgress(90, 'Unpacking sounds');
            Wave.unpack(sounds);

            await this.showProgress(92, 'Unpacking interfaces');
            ComType.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.showProgress(97, 'Preparing game engine');
            WordFilter.unpack(wordenc);

            await this.showProgress(100, 'Getting ready to start...');

            this.drawArea?.bind();
            Draw3D.init2D();

            const authentic: HTMLInputElement | null = document.querySelector('#authentic');
            if (authentic !== null) {
                authentic.onchange = (): void => {
                    this.exportChat();
                };
            }

            const newline: HTMLInputElement | null = document.querySelector('#newline');
            if (newline !== null) {
                newline.onclick = (): void => {
                    this.input += '|';
                    this.exportChat();
                };
            }

            const clear: HTMLInputElement | null = document.querySelector('#clear');
            if (clear !== null) {
                clear.onclick = (): void => {
                    this.input = '';
                    this.exportChat();
                };
            }

            this.registerColorHandler('bla');
            this.registerColorHandler('red');
            this.registerColorHandler('gre');
            this.registerColorHandler('blu');
            this.registerColorHandler('yel');
            this.registerColorHandler('cya');
            this.registerColorHandler('mag');
            this.registerColorHandler('whi');
            this.registerColorHandler('lre');
            this.registerColorHandler('dre');
            this.registerColorHandler('dbl');
            this.registerColorHandler('or1');
            this.registerColorHandler('or2');
            this.registerColorHandler('or3');
            this.registerColorHandler('gr1');
            this.registerColorHandler('gr2');
            this.registerColorHandler('gr3');

            this.activeNpc = NpcType.get(0);
            this.inputMesanimId = 0;
            this.exportChat();
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

        this.updateChat();
    };

    draw = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawErrorScreen();
            return;
        }

        Draw2D.clear();

        this.drawChat();

        this.drawArea?.draw(0, 0);
    };

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

    drawErrorScreen(): void {
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(0, 0, this.width, this.height);

        this.setFramerate(1);

        if (this.errorLoading) {
            canvas2d.font = 'bold 16px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';

            let y: number = 35;
            canvas2d.fillText('Sorry, an error has occured whilst loading RuneScape', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try clearing your web-browsers cache from tools->internet options', 30, y);

            y += 30;
            canvas2d.fillText('3: Try using a different game-world', 30, y);

            y += 30;
            canvas2d.fillText('4: Try rebooting your computer', 30, y);

            y += 30;
            canvas2d.fillText('5: Try selecting a different version of Java from the play-game menu', 30, y);
        }

        if (this.errorHost) {
            canvas2d.font = 'bold 20px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'white';

            canvas2d.fillText('Error - unable to load game!', 50, 50);
            canvas2d.fillText('To play RuneScape make sure you play from', 50, 100);
            canvas2d.fillText('https://2004scape.org', 50, 150);
        }

        if (this.errorStarted) {
            canvas2d.font = 'bold 13px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';

            let y: number = 35;
            canvas2d.fillText('Error a copy of RuneScape already appears to be loaded', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try rebooting your computer, and reloading', 30, y);
        }
    }

    //

    private drawInterface = (com: ComType, x: number, y: number, scrollY: number): void => {
        if (com.type !== 0 || com.childId === null || com.hide) {
            return;
        }

        const left: number = Draw2D.left;
        const top: number = Draw2D.top;
        const right: number = Draw2D.right;
        const bottom: number = Draw2D.bottom;

        Draw2D.setBounds(x, y, x + com.width, y + com.height);
        const children: number = com.childId.length;

        for (let i: number = 0; i < children; i++) {
            if (!com.childX || !com.childY) {
                continue;
            }

            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollY;

            const child: ComType = ComType.instances[com.childId[i]];
            childX += child.x;
            childY += child.y;

            if (child.type === 0) {
                if (child.scrollPosition > child.scrollableHeight - child.height) {
                    child.scrollPosition = child.scrollableHeight - child.height;
                }

                if (child.scrollPosition < 0) {
                    child.scrollPosition = 0;
                }

                this.drawInterface(child, childX, childY, child.scrollPosition);
            } else if (child.type === 2) {
                /* todo */
            } else if (child.type === 3) {
                if (child.fill) {
                    Draw2D.fillRect(childX, childY, child.width, child.height, child.color);
                } else {
                    Draw2D.drawRect(childX, childY, child.width, child.height, child.color);
                }
            } else if (child.type === 4) {
                const font: PixFont | null = child.font;
                const color: number = child.color;
                let text: string | null = child.text;

                if (!font || !text) {
                    continue;
                }

                for (let lineY: number = childY + font.fontHeight; text.length > 0; lineY += font.fontHeight) {
                    const newline: number = text.indexOf('\\n');
                    let split: string;
                    if (newline !== -1) {
                        split = text.substring(0, newline);
                        text = text.substring(newline + 2);
                    } else {
                        split = text;
                        text = '';
                    }

                    if (child.center) {
                        font.drawStringTaggableCenter(childX + child.width / 2, lineY, split, color, child.shadow);
                    } else {
                        font.drawStringTaggable(childX, lineY, split, color, child.shadow);
                    }
                }
            } else if (child.type === 5) {
                /* todo */
            } else if (child.type === 6) {
                const tmpX: number = Draw3D.centerX;
                const tmpY: number = Draw3D.centerY;

                Draw3D.centerX = childX + child.width / 2;
                Draw3D.centerY = childY + child.height / 2;

                const eyeY: number = (Draw3D.sin[child.modelPitch] * child.modelZoom) >> 16;
                const eyeZ: number = (Draw3D.cos[child.modelPitch] * child.modelZoom) >> 16;

                const active: boolean = false;
                let seqId: number;
                if (active) {
                    seqId = child.activeSeqId;
                } else {
                    seqId = child.seqId;
                }

                let model: Model | null = null;
                if (seqId === -1) {
                    model = child.getModel(-1, -1, active);
                } else {
                    const seq: SeqType = SeqType.instances[seqId];
                    if (seq.frames && seq.iframes) {
                        model = child.getModel(seq.frames[child.seqFrame], seq.iframes[child.seqFrame], active);
                    }
                }

                if (model) {
                    model.drawSimple(0, child.modelYaw, 0, child.modelPitch, 0, eyeY, eyeZ);
                }

                Draw3D.centerX = tmpX;
                Draw3D.centerY = tmpY;
            } else if (child.type === 7) {
                /* todo */
            }
        }

        Draw2D.setBounds(left, top, right, bottom);
    };

    //

    async populateNpcSelector(): Promise<void> {
        this.packfiles[1] = await this.loadPack(`${Viewer.REPO}/data/pack/npc.pack`);

        const npcs: HTMLSelectElement | null = document.querySelector('#npcs');
        if (!npcs) {
            return;
        }

        npcs.innerHTML = '';

        const search: HTMLInputElement = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Search';
        search.tabIndex = 1;
        search.oninput = (): void => {
            const filter: string = search.value.toLowerCase().replaceAll(' ', '_');

            const ul: HTMLUListElement | null = document.querySelector('#npcList');
            if (!ul) {
                return;
            }

            for (let i: number = 0; i < ul.children.length; i++) {
                const child: HTMLElement = ul.children[i] as HTMLElement;

                if (child.id.indexOf(filter) > -1) {
                    child.style.display = '';
                } else {
                    child.style.display = 'none';
                }
            }
        };
        npcs.appendChild(search);

        const ul: HTMLUListElement = document.createElement('ul');
        ul.id = 'npcList';
        ul.className = 'list-group';
        npcs.appendChild(ul);

        for (const [id, name] of this.packfiles[1]) {
            const type: NpcType = NpcType.get(id);
            if (type.heads === null || type.heads.length === 0) {
                continue;
            }

            const li: HTMLLIElement = document.createElement('li');
            li.id = name;
            li.className = 'list-group-item';
            if (id === 0) {
                li.className += ' active';
            }
            li.innerText = name + ' (' + id + ')';
            li.onclick = (): void => {
                const last: Element | null = ul.querySelector('.active');
                if (last) {
                    last.className = 'list-group-item';
                }

                li.className = 'list-group-item active';

                this.activeNpc = NpcType.get(id);
                this.chatNpc(this.activeNpc, this.inputMesanimId, this.input);
            };
            ul.appendChild(li);
        }
    }

    async populateMesanimSelector(): Promise<void> {
        const anims: HTMLSelectElement | null = document.querySelector('#mesanims');
        if (!anims) {
            return;
        }

        anims.innerHTML = '';

        const search: HTMLInputElement = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Search';
        search.tabIndex = 2;
        search.oninput = (): void => {
            const filter: string = search.value.toLowerCase().replaceAll(' ', '_');

            const ul: HTMLUListElement | null = document.querySelector('#mesanimList');
            if (!ul) {
                return;
            }

            for (let i: number = 0; i < ul.children.length; i++) {
                const child: HTMLElement = ul.children[i] as HTMLElement;

                if (child.id.indexOf(filter) > -1) {
                    child.style.display = '';
                } else {
                    child.style.display = 'none';
                }
            }
        };
        anims.appendChild(search);

        const ul: HTMLUListElement = document.createElement('ul');
        ul.id = 'mesanimList';
        ul.className = 'list-group';
        anims.appendChild(ul);

        for (const mesanim of MesAnimType.instances) {
            const id: number = mesanim.id;
            const name: string = mesanim.debugname ?? `mesanim_${mesanim.id}`;

            const li: HTMLLIElement = document.createElement('li');
            li.id = name;
            li.className = 'list-group-item';
            if (id === 0) {
                li.className += ' active';
            }
            li.innerText = name + ' (' + id + ')';
            li.onclick = (): void => {
                const last: Element | null = ul.querySelector('.active');
                if (last) {
                    last.className = 'list-group-item';
                }

                li.className = 'list-group-item active';

                this.inputMesanimId = id;
                this.exportChat();
            };
            ul.appendChild(li);
        }
    }

    registerColorHandler(tag: string): void {
        const el: HTMLInputElement | null = document.querySelector(`#${tag}`);
        if (el === null) {
            return;
        }

        el.onclick = (): void => {
            this.input += `@${tag}@`;
            this.exportChat();
        };
    }

    updateChat(): void {
        let changed: boolean = false;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const key: number = this.pollKey();
            if (key === -1) {
                break;
            }

            if (document.activeElement !== canvas) {
                continue;
            }

            const valid: boolean = Viewer.CHARSET.indexOf(String.fromCharCode(key)) !== -1;
            if (valid) {
                this.input += String.fromCharCode(key);
                changed = true;
            } else if (key === 8 && this.input.length > 0) {
                this.input = this.input.substring(0, this.input.length - 1);
                changed = true;
            } else if (key === 10 || key === 13) {
                this.input += '|';
                changed = true;
            }
        }

        if (changed && this.input.indexOf('\\n') !== -1) {
            // we want split to take over and there's hardcoded draw logic around \n
            this.input = this.input.replaceAll('\\n', '|');
        }

        if (changed) {
            this.exportChat();
        }
    }

    drawChat(): void {
        this.imageChatback?.draw(0, 0);

        if (this.chatInterfaceId !== -1) {
            const com: ComType = ComType.instances[this.chatInterfaceId + 1];
            const seq: SeqType = SeqType.instances[com.seqId];

            com.seqCycle += 1;

            while (com.seqCycle > seq.delay![com.seqFrame]) {
                com.seqCycle -= seq.delay![com.seqFrame] + 1;
                com.seqFrame++;

                if (com.seqFrame >= seq.frameCount) {
                    com.seqFrame -= seq.replayoff;

                    if (com.seqFrame < 0 || com.seqFrame >= seq.frameCount) {
                        com.seqFrame = 0;
                    }
                }
            }

            try {
                this.drawInterface(ComType.instances[this.chatInterfaceId], 0, 0, 0);
            } catch (err) {
                console.error(err);
            }
        }
    }

    exportChat(): void {
        if (this.inputMesanimId === -1 || !this.fontQuill8) {
            return;
        }

        this.splitInit(this.input, 380, 4, this.fontQuill8, this.inputMesanimId); // so we can early-paginate
        if (this.splitPageCount() > 1) {
            this.input = '';
        }
        this.chatNpc(this.activeNpc, this.inputMesanimId, this.input);

        const el: HTMLInputElement | null = document.querySelector('#export');
        if (el) {
            const mesanim: MesAnimType = MesAnimType.instances[this.inputMesanimId];
            const authentic: HTMLInputElement | null = document.querySelector('#authentic');

            if (authentic === null || authentic.checked === false) {
                const mesanimName: string = mesanim.debugname === 'default' ? '"default"' : mesanim.debugname ?? `mesanim_${mesanim.id}`;
                el.value = `~chatnpc(${mesanimName}, "${this.input}");`;
            } else {
                el.value = `~chatnpc("<p,${mesanim.debugname}>${this.input}");`;
            }
        }
    }

    // runescript engine

    splitInit(text: string, maxWidth: number, linesPerPage: number, font: PixFont, mesanimId: number): void {
        const lines: string[] = font.split(text, maxWidth);

        this.splitPages = [];
        this.splitMesanimId = mesanimId;
        while (lines.length > 0) {
            this.splitPages.push(lines.splice(0, linesPerPage));
        }
    }

    splitGet(page: number, line: number): string {
        return this.splitPages[page][line];
    }

    splitPageCount(): number {
        return this.splitPages.length;
    }

    splitLineCount(page: number): number {
        return this.splitPages[page].length;
    }

    splitGetAnim(page: number): number {
        if (this.splitMesanimId === -1) {
            return -1;
        }

        const type: MesAnimType = MesAnimType.instances[this.splitMesanimId];
        const lines: number = this.splitLineCount(page);
        return type.len[lines - 1];
    }

    // runescript procs

    chatNpc(npc: NpcType, mesanimId: number, message: string): void {
        if (!this.fontQuill8 || mesanimId === -1) {
            return;
        }

        this.splitInit(message, 380, 4, this.fontQuill8, mesanimId);

        const pageTotal: number = this.splitPageCount();
        for (let page: number = 0; page < pageTotal; page++) {
            this.chatNpcPage(npc, page);
        }
    }

    chatNpcPage(npc: NpcType, page: number): void {
        const lines: number = this.splitLineCount(page);

        if (lines === 0) {
            return;
        } else if (lines === 1) {
            this.chatInterfaceId = 4882;

            ComType.instances[4883].model = npc.getHeadModel();
            ComType.instances[4883].seqId = this.splitGetAnim(page);
            ComType.instances[4883].seqFrame = 0;
            ComType.instances[4883].seqCycle = 0;

            ComType.instances[4884].text = npc.name;

            ComType.instances[4885].text = this.splitGet(page, 0);
        } else if (lines === 2) {
            this.chatInterfaceId = 4887;

            ComType.instances[4888].model = npc.getHeadModel();
            ComType.instances[4888].seqId = this.splitGetAnim(page);
            ComType.instances[4888].seqFrame = 0;
            ComType.instances[4888].seqCycle = 0;

            ComType.instances[4889].text = npc.name;

            ComType.instances[4890].text = this.splitGet(page, 0);
            ComType.instances[4891].text = this.splitGet(page, 1);
        } else if (lines === 3) {
            this.chatInterfaceId = 4893;

            ComType.instances[4894].model = npc.getHeadModel();
            ComType.instances[4894].seqId = this.splitGetAnim(page);
            ComType.instances[4894].seqFrame = 0;
            ComType.instances[4894].seqCycle = 0;

            ComType.instances[4895].text = npc.name;

            ComType.instances[4896].text = this.splitGet(page, 0);
            ComType.instances[4897].text = this.splitGet(page, 1);
            ComType.instances[4898].text = this.splitGet(page, 2);
        } else if (lines === 4) {
            this.chatInterfaceId = 4900;

            ComType.instances[4901].model = npc.getHeadModel();
            ComType.instances[4901].seqId = this.splitGetAnim(page);
            ComType.instances[4901].seqFrame = 0;
            ComType.instances[4901].seqCycle = 0;

            ComType.instances[4902].text = npc.name;

            ComType.instances[4903].text = this.splitGet(page, 0);
            ComType.instances[4904].text = this.splitGet(page, 1);
            ComType.instances[4905].text = this.splitGet(page, 2);
            ComType.instances[4906].text = this.splitGet(page, 3);
        }
    }
}

new Viewer().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
