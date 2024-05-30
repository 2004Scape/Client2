import 'style/interface-editor.scss';

import SeqType from './jagex2/config/SeqType';
import LocType from './jagex2/config/LocType';
import FloType from './jagex2/config/FloType';
import ObjType from './jagex2/config/ObjType';
import NpcType from './jagex2/config/NpcType';
import IdkType from './jagex2/config/IdkType';
import SpotAnimType from './jagex2/config/SpotAnimType';
import VarpType from './jagex2/config/VarpType';
import Component from './jagex2/config/Component';

import Draw3D from './jagex2/graphics/Draw3D';
import PixFont from './jagex2/graphics/PixFont';
import Model from './jagex2/graphics/Model';
import AnimBase from './jagex2/graphics/AnimBase';
import AnimFrame from './jagex2/graphics/AnimFrame';

import Jagfile from './jagex2/io/Jagfile';

import WordFilter from './jagex2/wordenc/WordFilter';
import {downloadUrl, sleep} from './jagex2/util/JsUtil';
import Draw2D from './jagex2/graphics/Draw2D';
import Packet from './jagex2/io/Packet';
import Wave from './jagex2/sound/Wave';
import Database from './jagex2/io/Database';
import Bzip from './vendor/bzip';
import Colors from './jagex2/graphics/Colors';
import {Client} from './client';
import {setupConfiguration} from './configuration';
import Pix8 from './jagex2/graphics/Pix8';

// noinspection JSSuspiciousNameCombination
class InterfaceEditor extends Client {
    constructor() {
        super(false);
    }

    activeInterface: Component | null = null;
    activeComponent: Component | null = null;
    stickyComponent: boolean = false;
    movingComponent: boolean = false;
    movingRelativeX: number = 0;
    movingRelativeY: number = 0;
    tooltip: string = '';

    load = async (): Promise<void> => {
        try {
            await this.showProgress(10, 'Connecting to fileserver');

            await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
            this.db = new Database(await Database.openDatabase());

            const checksums: Packet = new Packet(new Uint8Array(await downloadUrl(`${Client.httpAddress}/crc`)));
            const archiveChecksums: number[] = [];
            for (let i: number = 0; i < 9; i++) {
                archiveChecksums[i] = checksums.g4;
            }

            const title: Jagfile = await this.loadArchive('title', 'title screen', archiveChecksums[1], 10);

            this.fontPlain11 = PixFont.fromArchive(title, 'p11');
            this.fontPlain12 = PixFont.fromArchive(title, 'p12');
            this.fontBold12 = PixFont.fromArchive(title, 'b12');
            this.fontQuill8 = PixFont.fromArchive(title, 'q8');

            const config: Jagfile = await this.loadArchive('config', 'config', archiveChecksums[2], 15);
            const interfaces: Jagfile = await this.loadArchive('interface', 'interface', archiveChecksums[3], 20);
            const media: Jagfile = await this.loadArchive('media', '2d graphics', archiveChecksums[4], 30);
            const models: Jagfile = await this.loadArchive('models', '3d graphics', archiveChecksums[5], 40);
            const textures: Jagfile = await this.loadArchive('textures', 'textures', archiveChecksums[6], 60);
            const wordenc: Jagfile = await this.loadArchive('wordenc', 'chat system', archiveChecksums[7], 65);
            const sounds: Jagfile = await this.loadArchive('sounds', 'sound effects', archiveChecksums[8], 70);

            await this.showProgress(75, 'Unpacking media');
            this.imageScrollbar0 = Pix8.fromArchive(media, 'scrollbar', 0);
            this.imageScrollbar1 = Pix8.fromArchive(media, 'scrollbar', 1);

            await this.showProgress(80, 'Unpacking textures');
            Draw3D.unpackTextures(textures);
            Draw3D.setBrightness(0.8);
            Draw3D.initPool(20);

            await this.showProgress(83, 'Unpacking models');
            Model.unpack(models);
            AnimBase.unpack(models);
            AnimFrame.unpack(models);

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
            Component.unpack(interfaces, media, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.showProgress(97, 'Preparing game engine');
            WordFilter.unpack(wordenc);
            for (let i: number = 0; i < VarpType.count; i++) {
                this.varps[i] = 0;
            }

            this.drawArea?.bind();
            Draw3D.init2D();

            this.activeInterface = Component.instances[0];
        } catch (err) {
            this.errorLoading = true;
            console.error(err);
        }
    };

    update = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        if (!this.movingComponent && this.activeInterface) {
            this.tooltip = '';
            this.simulateClientInput(this.activeInterface, this.mouseX, this.mouseY, 0, 0, 0);
            this.viewportHoveredInterfaceIndex = this.lastHoveredInterfaceId;
            this.lastHoveredInterfaceId = -1;

            if (!this.stickyComponent) {
                this.activeComponent = this.getActiveComponent(this.activeInterface, this.mouseX, this.mouseY, 0, 0, 0);
            }
        }

        if (this.activeComponent) {
            if (this.mouseButton === 1) {
                if (!this.movingComponent) {
                    // this.stickyComponent = !this.stickyComponent;

                    // first time we start moving we want to preserve where the designer clicked on the component and move relative to that
                    this.movingRelativeX = this.activeComponent.getAbsoluteX() - this.mouseX;
                    this.movingRelativeY = this.activeComponent.getAbsoluteY() - this.mouseY;
                }

                this.movingComponent = true;
            } else {
                this.movingComponent = false;
            }

            if (this.movingComponent) {
                this.activeComponent.move(this.mouseX + this.movingRelativeX, this.mouseY + this.movingRelativeY);
            }
        }

        this.updateKeysPressed();
        this.updateKeysHeld();

        this.mouseClickX = -1;
        this.mouseClickY = -1;
        this.mouseClickButton = 0;
    };

    draw = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawError();
            return;
        }

        Draw2D.clear();
        Draw2D.fillRect(0, 0, this.width, this.height, 0);

        this.drawGrid(8, 8, 16, 16, 0x505050);

        if (this.activeInterface) {
            this.drawInterface(this.activeInterface, 0, 0, 0, false);
            this.fontBold12?.drawStringTooltip(4, 15, this.tooltip, Colors.WHITE, true, 0);
        }

        if (this.activeComponent) {
            this.activeComponent.outline(0x00ffff);
        }

        this.drawArea?.draw(0, 0);
    };

    // ----

    updateKeysPressed(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const key: number = this.pollKey();
            if (key === -1) {
                break;
            }

            if (this.activeComponent) {
                if (key === 8) {
                    // delete key
                    this.activeComponent.delete();
                    this.activeComponent = null;
                    this.stickyComponent = false;
                } else if (key === 9) {
                    // tab key
                    this.stickyComponent = false;
                }
            }
        }
    }

    updateKeysHeld(): void {
        if (this.activeComponent) {
            if (this.actionKey[1]) {
                // left
                const x: number = this.activeComponent.getAbsoluteX();
                this.activeComponent.move(x - 1, this.activeComponent.getAbsoluteY());
            } else if (this.actionKey[2]) {
                // right
                const x: number = this.activeComponent.getAbsoluteX();
                this.activeComponent.move(x + 1, this.activeComponent.getAbsoluteY());
            }

            if (this.actionKey[3]) {
                // up
                const y: number = this.activeComponent.getAbsoluteY();
                this.activeComponent.move(this.activeComponent.getAbsoluteX(), y - 1);
            } else if (this.actionKey[4]) {
                // down
                const y: number = this.activeComponent.getAbsoluteY();
                this.activeComponent.move(this.activeComponent.getAbsoluteX(), y + 1);
            }
        }
    }

    // 8, 8, 16, 16, 0x505050: used in a real interface!
    drawGrid = (x: number, y: number, width: number, height: number, color: number): void => {
        const cellsX: number = (this.width + x) / width;
        const cellsY: number = (this.height + y) / height;

        // we're inverting these because this is a negative offset and the purpose is so lines don't begin at 0, 0
        x = -x;
        y = -y;

        for (let i: number = 0; i < cellsX; i++) {
            Draw2D.drawLine(x + i * width, y, x + i * width, y + cellsY * height, color);
        }

        for (let i: number = 0; i < cellsY; i++) {
            Draw2D.drawLine(x, y + i * height, x + cellsX * width, y + i * height, color);
        }
    };

    simulateClientInput = (com: Component, mouseX: number, mouseY: number, x: number, y: number, scrollPosition: number): void => {
        if (com.type !== 0 || !com.childId || !com.childX || !com.childY || mouseX < x || mouseY < y || mouseX > x + com.width || mouseY > y + com.height) {
            return;
        }

        const children: number = com.childId.length;
        for (let i: number = 0; i < children; i++) {
            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollPosition;
            const child: Component = Component.instances[com.childId[i]];

            childX += child.x;
            childY += child.y;

            if ((child.overLayer >= 0 || child.overColour !== 0) && mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
                if (child.overLayer >= 0) {
                    this.lastHoveredInterfaceId = child.overLayer;
                } else {
                    this.lastHoveredInterfaceId = child.id;
                }
            }

            if (child.type === 0) {
                this.simulateClientInput(child, mouseX, mouseY, childX, childY, child.scrollPosition);
            } else if (mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
                if (child.buttonType !== 0 && child.option && child.option.length) {
                    this.tooltip = child.option;
                } else if (child.buttonType === Component.BUTTON_CLOSE) {
                    this.tooltip = 'Close';
                }
            }
        }
    };

    getActiveComponent = (com: Component, mouseX: number, mouseY: number, x: number, y: number, scrollPosition: number): Component | null => {
        if (com.type !== 0 || !com.childId || !com.childX || !com.childY || mouseX < x || mouseY < y || mouseX > x + com.width || mouseY > y + com.height) {
            return null;
        }

        let active: Component | null = null;

        const children: number = com.childId.length;
        for (let i: number = 0; i < children; i++) {
            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollPosition;
            const child: Component = Component.instances[com.childId[i]];

            childX += child.x;
            childY += child.y;

            if (child.type === 0) {
                const childActive: Component | null = this.getActiveComponent(child, mouseX, mouseY, childX, childY, child.scrollPosition);

                if (childActive) {
                    active = childActive;
                }
            }

            if (mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
                active = child;
            }
        }

        return active;
    };
}

await setupConfiguration();
new InterfaceEditor().run().then((): void => {});
