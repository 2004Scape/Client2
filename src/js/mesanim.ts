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
import {canvas2d} from './jagex2/graphics/Canvas';
import NpcEntity from './jagex2/dash3d/entity/NpcEntity';
import Pix8 from './jagex2/graphics/Pix8';

class Viewer extends GameShell {
    static HOST: string = 'https://w2.225.2004scape.org';
    static REPO: string = 'https://raw.githubusercontent.com/2004scape/Server/main';

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

    imageChatback: Pix8 | null = null;

    npc: NpcEntity = new NpcEntity();

    load = async (): Promise<void> => {
        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        try {
            await this.showProgress(10, 'Connecting to fileserver');

            this.db = new Database(await Database.openDatabase());

            const checksums: Packet = new Packet(Uint8Array.from(await downloadUrl(`${Viewer.HOST}/crc`)));
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

            const mesanim: Packet = new Packet(await downloadUrl(`${Viewer.HOST}/server/mesanim.dat`));

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

            await this.showProgress(90, 'Unpacking sounds');
            Wave.unpack(sounds);

            await this.showProgress(92, 'Unpacking interfaces');
            ComType.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.showProgress(97, 'Preparing game engine');
            WordFilter.unpack(wordenc);

            await this.showProgress(100, 'Getting ready to start...');

            this.drawArea?.bind();
            Draw3D.init2D();

            this.npc.type = NpcType.get(0);
            this.npc.primarySeqId = 567;

            ComType.instances[4883].model = this.npc.type?.getHeadModel();
            ComType.instances[4883].seqId = this.npc.primarySeqId;

            ComType.instances[4884].text = this.npc.type?.name ?? 'Name';
            ComType.instances[4885].text = 'Testing';
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
            this.drawErrorScreen();
            return;
        }

        Draw2D.clear();
        this.imageChatback?.draw(0, 0);

        if (this.npc.primarySeqId != -1 && this.npc.primarySeqDelay == 0) {
            const com: ComType = ComType.instances[4883];
            const seq: SeqType = SeqType.instances[this.npc.primarySeqId];

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
        }

        this.drawInterface(ComType.instances[4882], 0, 0, 0);

        this.drawArea?.draw(0, 0);
    };

    //

    showProgress = async (progress: number, str: string): Promise<void> => {
        console.log(`${progress}%: ${str}`);

        await super.showProgress(progress, str);
    };

    //

    async loadArchive(filename: string, displayName: string, crc: number, progress: number): Promise<Jagfile> {
        let retry: number = 5;
        let data: Int8Array | undefined = await this.db?.cacheload(filename);
        if (data) {
            if (Packet.crc32(data) !== crc) {
                data = undefined;
            }
        }

        if (data) {
            return new Jagfile(Uint8Array.from(data));
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
        return new Jagfile(Uint8Array.from(data));
    }

    drawErrorScreen(): void {
        canvas2d.fillStyle = 'black';
        canvas2d.clearRect(0, 0, this.width, this.height);

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
}

new Viewer().run().then((): void => {});
