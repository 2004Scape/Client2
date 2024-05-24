// noinspection JSSuspiciousNameCombination,DuplicatedCode

import 'style/items.scss';

import Bzip from './vendor/bzip';

import Jagfile from './jagex2/io/Jagfile';

import {downloadUrl, sleep} from './jagex2/util/JsUtil';
import Packet from './jagex2/io/Packet';
import {setupConfiguration} from './configuration';
import GameShell from './jagex2/client/GameShell';
import {TypedArray1d, TypedArray2d} from './jagex2/util/Arrays';
import Pix8 from './jagex2/graphics/Pix8';
import Pix24 from './jagex2/graphics/Pix24';
import PixFont from './jagex2/graphics/PixFont';
import Draw2D from './jagex2/graphics/Draw2D';
import Database from './jagex2/io/Database';
import {Client} from './client';

class MapView extends GameShell {
    static readonly shouldDrawBorders: boolean = false;
    static readonly shouldDrawLabels: boolean = true;

    db: Database | null = null;

    // overworld
    readonly startX: number = 3200;
    readonly startZ: number = 3200;
    readonly sizeX: number = 20 << 6;
    readonly sizeZ: number = 21 << 6;
    readonly originX: number = 35 << 6;
    readonly originZ: number = 43 << 6;

    readonly maxLabelCount: number = 1000;
    labelCount: number = 0;
    labelText: string[] = [];
    labelX: number[] = [];
    labelY: number[] = [];
    labelFont: number[] = [];

    floorcolUnderlay: number[] = [0];
    floorcolOverlay: number[] = [0];

    underlayTiles: number[][] = [];

    overlayTiles: number[][] = [];
    overlayInfo: number[][] = [];

    locWalls: number[][] = [];
    locMapscenes: number[][] = [];
    locMapfunction: number[][] = [];

    objTiles: boolean[][] = [];

    npcTiles: boolean[][] = [];

    imageMapscene: Pix8[] = [];
    imageMapfunction: Pix24[] = [];
    imageMapdot0: Pix24 | null = null;
    imageMapdot1: Pix24 | null = null;
    imageMapdot2: Pix24 | null = null;
    imageMapdot3: Pix24 | null = null;

    b12: PixFont | null = null;

    floormapColors: number[][] = [];

    redraw: boolean = true;
    redrawTimer: number = 0;
    lastMouseClickX: number = -1;
    lastMouseClickY: number = -1;
    lastOffsetX: number = -1;
    lastOffsetZ: number = -1;

    shouldClearEmptyTiles: boolean = false;

    readonly keyNames: string[] = [
        'General Store',
        'Sword Shop',
        'Magic Shop',
        'Axe Shop',
        'Helmet Shop',
        'Bank',
        'Quest Start',
        'Amulet Shop',
        'Mining Site',
        'Furnace',
        'Anvil',
        'Combat Training',
        'Dungeon',
        'Staff Shop',
        'Platebody Shop',
        'Platelegs Shop',
        'Scimitar Shop',
        'Archery Shop',
        'Shield Shop',
        'Altar',
        'Herbalist',
        'Jewelery',
        'Gem Shop',
        'Crafting Shop',
        'Candle Shop',
        'Fishing Shop',
        'Fishing Spot',
        'Clothes Shop',
        'Apothecary',
        'Silk Trader',
        'Kebab Seller',
        'Pub/Bar',
        'Mace Shop',
        'Tannery',
        'Rare Trees',
        'Spinning Wheel',
        'Food Shop',
        'Cookery Shop',
        '???',
        'Water Source',
        'Cooking Range',
        'Skirt Shop',
        'Potters Wheel',
        'Windmill',
        'Mining Shop',
        'Chainmail Shop',
        'Silver Shop',
        'Fur Trader',
        'Spice Shop'
    ];
    keyX: number = 5;
    keyY: number = 13;
    keyWidth: number = 140;
    keyHeight: number = 470;
    showKey: boolean = false;
    keyPage: number = 0;
    lastKeyPage: number = 0;
    currentKeyHover: number = -1;
    lastKeyHover: number = 0;
    currentKey: number = 0;
    flashTimer: number = 0;

    visibleMapFunctionsX: Int32Array = new Int32Array(2000);
    visibleMapFunctionsY: Int32Array = new Int32Array(2000);
    visibleMapFunctions: Int32Array = new Int32Array(2000);
    activeMapFunctionX: Int32Array = new Int32Array(2000);
    activeMapFunctionZ: Int32Array = new Int32Array(2000);
    activeMapFunctions: Int32Array = new Int32Array(2000);
    activeMapFunctionCount: number = 0;

    imageOverview: Pix24 | null = null;
    imageOverviewHeight: number = 200;
    imageOverviewWidth: number = ((this.imageOverviewHeight * this.sizeX) / this.sizeZ) | 0;
    overviewX: number = 635 - this.imageOverviewWidth - 5;
    overviewY: number = 503 - this.imageOverviewHeight - 20;
    showOverview: boolean = false;

    readonly colorInactiveBorderTL: number = 0x887755;
    readonly colorInactive: number = 0x776644;
    readonly colorInactiveBorderBR: number = 0x665533;
    readonly colorActiveBorderTL: number = 0xaa0000;
    readonly colorActive: number = 0x990000;
    readonly colorActiveBorderBR: number = 0x880000;

    zoom: number = 4;
    targetZoom: number = 4;

    offsetX: number = this.startX - this.originX;
    offsetZ: number = this.originZ + this.sizeZ - this.startZ;

    load = async (): Promise<void> => {
        await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
        this.db = new Database(await Database.openDatabase());

        const worldmap: Jagfile = await this.loadWorldmap();

        await this.showProgress(100, 'Please wait... Rendering Map');

        const labelData: Packet = new Packet(worldmap.read('labels.dat'));
        this.labelCount = labelData.g2;
        for (let i: number = 0; i < this.labelCount; i++) {
            this.labelText[i] = labelData.gjstr;
            this.labelX[i] = labelData.g2;
            this.labelY[i] = labelData.g2;
            this.labelFont[i] = labelData.g1;
        }

        const floorcolData: Packet = new Packet(worldmap.read('floorcol.dat'));
        const floorcolCount: number = floorcolData.g2;
        for (let i: number = 0; i < floorcolCount; i++) {
            this.floorcolUnderlay[i + 1] = floorcolData.g4;
            this.floorcolOverlay[i + 1] = floorcolData.g4;
        }

        const underlayData: Packet = new Packet(worldmap.read('underlay.dat'));
        this.underlayTiles = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.readUnderlayData(underlayData);

        const overlayData: Packet = new Packet(worldmap.read('overlay.dat'));
        this.overlayTiles = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.overlayInfo = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.readOverlayData(overlayData);

        const locData: Packet = new Packet(worldmap.read('loc.dat'));
        this.locWalls = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.locMapscenes = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.locMapfunction = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.readLocData(locData);

        const objData: Packet = new Packet(worldmap.read('obj.dat'));
        this.objTiles = new TypedArray2d(this.sizeX, this.sizeZ, false);
        this.readObjData(objData);

        const npcData: Packet = new Packet(worldmap.read('npc.dat'));
        this.npcTiles = new TypedArray2d(this.sizeX, this.sizeZ, false);
        this.readNpcData(npcData);

        try {
            for (let i: number = 0; i < 50; i++) {
                this.imageMapscene[i] = Pix8.fromArchive(worldmap, 'mapscene', i);
            }
        } catch (ignore) {
            // empty
        }

        try {
            for (let i: number = 0; i < 50; i++) {
                this.imageMapfunction[i] = Pix24.fromArchive(worldmap, 'mapfunction', i);
            }
        } catch (ignore) {
            // empty
        }

        this.imageMapdot0 = Pix24.fromArchive(worldmap, 'mapdots', 0);
        this.imageMapdot1 = Pix24.fromArchive(worldmap, 'mapdots', 1);
        this.imageMapdot2 = Pix24.fromArchive(worldmap, 'mapdots', 2);
        this.imageMapdot3 = Pix24.fromArchive(worldmap, 'mapdots', 3);

        this.b12 = PixFont.fromArchive(worldmap, 'b12');
        // this.f11 = new WorldmapFont(11, true, this);
        // this.f12 = new WorldmapFont(12, true, this);
        // this.f14 = new WorldmapFont(14, true, this);
        // this.f17 = new WorldmapFont(17, true, this);
        // this.f19 = new WorldmapFont(19, true, this);
        // this.f22 = new WorldmapFont(22, true, this);
        // this.f26 = new WorldmapFont(26, true, this);
        // this.f30 = new WorldmapFont(30, true, this);

        this.floormapColors = new TypedArray2d(this.sizeX, this.sizeZ, 0);
        this.averageUnderlayColors();
        if (this.shouldClearEmptyTiles) this.clearEmptyTiles();

        this.imageOverview = new Pix24(this.imageOverviewWidth, this.imageOverviewHeight);
        this.imageOverview.bind();
        this.drawMap(0, 0, this.sizeX, this.sizeZ, 0, 0, this.imageOverviewWidth, this.imageOverviewHeight);
        Draw2D.drawRect(0, 0, this.imageOverviewWidth, this.imageOverviewHeight, 0);
        Draw2D.drawRect(1, 1, this.imageOverviewWidth - 2, this.imageOverviewHeight - 2, this.colorInactiveBorderTL);

        this.drawArea!.bind();
    };

    draw = async (): Promise<void> => {
        if (this.redraw) {
            this.redraw = false;
            this.redrawTimer = 0;

            Draw2D.clear();

            const left: number = this.offsetX - ((635.0 / this.zoom) | 0);
            const top: number = this.offsetZ - ((503.0 / this.zoom) | 0);
            const right: number = this.offsetX + ((635.0 / this.zoom) | 0);
            const bottom: number = this.offsetZ + ((503.0 / this.zoom) | 0);
            this.drawMap(left, top, right, bottom, 0, 0, 635, 503);

            if (this.showOverview) {
                this.imageOverview?.blitOpaque(this.overviewX, this.overviewY);

                Draw2D.fillRectAlpha(
                    (this.overviewX + (this.imageOverviewWidth * left) / this.sizeX) | 0,
                    (this.overviewY + (this.imageOverviewHeight * top) / this.sizeZ) | 0,
                    (((right - left) * this.imageOverviewWidth) / this.sizeX) | 0,
                    (((bottom - top) * this.imageOverviewHeight) / this.sizeZ) | 0,
                    0xff0000,
                    0x80
                );
                Draw2D.drawRect(
                    (this.overviewX + (this.imageOverviewWidth * left) / this.sizeX) | 0,
                    (this.overviewY + (this.imageOverviewHeight * top) / this.sizeZ) | 0,
                    (((right - left) * this.imageOverviewWidth) / this.sizeX) | 0,
                    (((bottom - top) * this.imageOverviewHeight) / this.sizeZ) | 0,
                    0xff0000
                );

                if (this.flashTimer > 0 && this.flashTimer % 10 < 5) {
                    for (let i: number = 0; i < this.activeMapFunctionCount; i++) {
                        if (this.activeMapFunctions[i] == this.currentKey) {
                            const x: number = (this.overviewX + (this.imageOverviewWidth * this.activeMapFunctionX[i]) / this.sizeX) | 0;
                            const y: number = (this.overviewY + (this.imageOverviewHeight * this.activeMapFunctionZ[i]) / this.sizeZ) | 0;
                            Draw2D.fillCircle(x, y, 2, 0xffff00, 256);
                        }
                    }
                }
            }

            if (this.showKey) {
                this.drawString(this.keyX, this.keyY, this.keyWidth, 18, 0x999999, 0x777777, 0x555555, 'Prev page');
                this.drawString(this.keyX, this.keyY + 18, this.keyWidth, this.keyHeight - 36, 0x999999, 0x777777, 0x555555, '');
                this.drawString(this.keyX, this.keyY + this.keyHeight - 18, this.keyWidth, 18, 0x999999, 0x777777, 0x555555, 'Next page');

                let y: number = this.keyY + 3 + 18;
                for (let row: number = 0; row < 25; row++) {
                    if (row + this.lastKeyPage < this.imageMapfunction.length && row + this.lastKeyPage < this.keyNames.length) {
                        if (this.keyNames[row + this.lastKeyPage] === '???') {
                            continue;
                        }

                        this.imageMapfunction[row + this.lastKeyPage].draw(this.keyX + 3, y);
                        this.b12?.drawString(this.keyX + 21, y + 14, this.keyNames[row + this.lastKeyPage], 0);

                        let rgb: number = 0xffffff;
                        if (this.currentKeyHover == row + this.lastKeyPage) {
                            rgb = 0xbbaaaa;
                        }
                        if (this.flashTimer > 0 && this.flashTimer % 10 < 5 && this.currentKey == row + this.lastKeyPage) {
                            rgb = 0xffff00;
                        }

                        this.b12?.drawString(this.keyX + 20, y + 13, this.keyNames[row + this.lastKeyPage], rgb);
                    }

                    y += 17;
                }
            }

            this.drawString(this.overviewX, this.overviewY + this.imageOverviewHeight, this.imageOverviewWidth, 18, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, 'Overview');
            this.drawString(this.keyX, this.keyY + this.keyHeight, this.keyWidth, 18, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, 'Key');

            if (this.targetZoom == 3.0) {
                this.drawString(170, 471, 50, 30, this.colorActiveBorderTL, this.colorActive, this.colorActiveBorderBR, '37%');
            } else {
                this.drawString(170, 471, 50, 30, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, '37%');
            }

            if (this.targetZoom == 4.0) {
                this.drawString(230, 471, 50, 30, this.colorActiveBorderTL, this.colorActive, this.colorActiveBorderBR, '50%');
            } else {
                this.drawString(230, 471, 50, 30, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, '50%');
            }

            if (this.targetZoom == 6.0) {
                this.drawString(290, 471, 50, 30, this.colorActiveBorderTL, this.colorActive, this.colorActiveBorderBR, '75%');
            } else {
                this.drawString(290, 471, 50, 30, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, '75%');
            }

            if (this.targetZoom == 8.0) {
                this.drawString(350, 471, 50, 30, this.colorActiveBorderTL, this.colorActive, this.colorActiveBorderBR, '100%');
            } else {
                this.drawString(350, 471, 50, 30, this.colorInactiveBorderTL, this.colorInactive, this.colorInactiveBorderBR, '100%');
            }
        }

        this.redrawTimer--;
        if (this.redrawTimer <= 0) {
            this.drawArea?.draw(0, 0);
            this.redrawTimer = 50;
        }
    };

    refresh = async (): Promise<void> => {
        this.redrawTimer = 0;
    };

    update = async (): Promise<void> => {
        if (this.actionKey[1] == 1) {
            this.offsetX = (this.offsetX - 16.0 / this.zoom) | 0;
            this.redraw = true;
        }
        if (this.actionKey[2] == 1) {
            this.offsetX = (this.offsetX + 16.0 / this.zoom) | 0;
            this.redraw = true;
        }
        if (this.actionKey[3] == 1) {
            this.offsetZ = (this.offsetZ - 16.0 / this.zoom) | 0;
            this.redraw = true;
        }
        if (this.actionKey[4] == 1) {
            this.offsetZ = (this.offsetZ + 16.0 / this.zoom) | 0;
            this.redraw = true;
        }

        let key: number = 1;
        while (key > 0) {
            key = this.pollKey();

            if (key == 49) {
                this.targetZoom = 3.0;
                this.redraw = true;
            } else if (key == 50) {
                this.targetZoom = 4.0;
                this.redraw = true;
            } else if (key == 51) {
                this.targetZoom = 6.0;
                this.redraw = true;
            } else if (key == 52) {
                this.targetZoom = 8.0;
                this.redraw = true;
            } else if (key == 107 || key == 75) {
                this.showKey = !this.showKey;
                this.redraw = true;
            } else if (key == 111 || key == 79) {
                this.showOverview = !this.showOverview;
                this.redraw = true;
            } else if (key == 101) {
                // todo: export as png and prompt user to download file
            }
        }

        if (this.mouseClickButton == 1) {
            this.lastMouseClickX = this.mouseClickX;
            this.lastMouseClickY = this.mouseClickY;
            this.lastOffsetX = this.offsetX;
            this.lastOffsetZ = this.offsetZ;

            if (this.mouseClickX > 170 && this.mouseClickX < 220 && this.mouseClickY > 471 && this.mouseClickY < 503) {
                this.targetZoom = 3.0;
                this.lastMouseClickX = -1;
            } else if (this.mouseClickX > 230 && this.mouseClickX < 280 && this.mouseClickY > 471 && this.mouseClickY < 503) {
                this.targetZoom = 4.0;
                this.lastMouseClickX = -1;
            } else if (this.mouseClickX > 290 && this.mouseClickX < 340 && this.mouseClickY > 471 && this.mouseClickY < 503) {
                this.targetZoom = 6.0;
                this.lastMouseClickX = -1;
            } else if (this.mouseClickX > 350 && this.mouseClickX < 400 && this.mouseClickY > 471 && this.mouseClickY < 503) {
                this.targetZoom = 8.0;
                this.lastMouseClickX = -1;
            } else if (this.mouseClickX > this.keyX && this.mouseClickY > this.keyY + this.keyHeight && this.mouseClickX < this.keyX + this.keyWidth && this.mouseClickY < 503) {
                this.showKey = !this.showKey;
                this.lastMouseClickX = -1;
            } else if (this.mouseClickX > this.overviewX && this.mouseClickY > this.overviewY + this.imageOverviewHeight && this.mouseClickX < this.overviewX + this.imageOverviewWidth && this.mouseClickY < 503) {
                this.showOverview = !this.showOverview;
                this.lastMouseClickX = -1;
            }

            if (this.showKey) {
                if (this.mouseClickX > this.keyX && this.mouseClickY > this.keyY && this.mouseClickX < this.keyX + this.keyWidth && this.mouseClickY < this.keyY + this.keyHeight) {
                    this.lastMouseClickX = -1;
                }

                if (this.mouseClickX > this.keyX && this.mouseClickY > this.keyY && this.mouseClickX < this.keyX + this.keyWidth && this.mouseClickY < this.keyY + 18) {
                    this.keyPage = 0;
                } else if (this.mouseClickX > this.keyX && this.mouseClickY > this.keyY + this.keyHeight - 18 && this.mouseClickX < this.keyX + this.keyWidth && this.mouseClickY < this.keyY + this.keyHeight) {
                    this.keyPage = 25;
                }
            }

            this.redraw = true;
        }

        if (this.showKey) {
            this.currentKeyHover = -1;

            if (this.mouseX > this.keyX && this.mouseX < this.keyX + this.keyWidth) {
                let y: number = this.keyY + 21 + 5;

                for (let row: number = 0; row < 25; row++) {
                    if (row + this.lastKeyPage < this.keyNames.length && this.keyNames[row + this.lastKeyPage] !== '???') {
                        if (this.mouseY >= y && this.mouseY < y + 17) {
                            this.currentKeyHover = row + this.lastKeyPage;

                            if (this.mouseClickButton == 1) {
                                this.currentKey = row + this.lastKeyPage;
                                this.flashTimer = 50;
                            }
                        }

                        y += 17;
                    }
                }
            }

            if (this.currentKeyHover != this.lastKeyHover) {
                this.lastKeyHover = this.currentKeyHover;
                this.redraw = true;
            }
        }

        if ((this.mouseButton == 1 || this.mouseClickButton == 1) && this.showOverview) {
            let mouseClickX: number = this.mouseClickX;
            let mouseClickY: number = this.mouseClickY;
            if (this.mouseButton == 1) {
                mouseClickX = this.mouseX;
                mouseClickY = this.mouseY;
            }

            if (mouseClickX > this.overviewX && mouseClickY > this.overviewY && mouseClickX < this.overviewX + this.imageOverviewWidth && mouseClickY < this.overviewY + this.imageOverviewHeight) {
                this.offsetX = (((mouseClickX - this.overviewX) * this.sizeX) / this.imageOverviewWidth) | 0;
                this.offsetZ = (((mouseClickY - this.overviewY) * this.sizeZ) / this.imageOverviewHeight) | 0;
                this.lastMouseClickX = -1;
                this.redraw = true;
            }
        }

        if (this.mouseButton == 1 && this.lastMouseClickX != -1) {
            this.offsetX = this.lastOffsetX + ((((this.lastMouseClickX - this.mouseX) * 2.0) / this.targetZoom) | 0);
            this.offsetZ = this.lastOffsetZ + ((((this.lastMouseClickY - this.mouseY) * 2.0) / this.targetZoom) | 0);
            this.redraw = true;
        }

        if (this.zoom < this.targetZoom) {
            this.redraw = true;
            this.zoom += this.zoom / 30.0;
            if (this.zoom > this.targetZoom) {
                this.zoom = this.targetZoom;
            }
        }

        if (this.zoom > this.targetZoom) {
            this.redraw = true;
            this.zoom -= this.zoom / 30.0;
            if (this.zoom < this.targetZoom) {
                this.zoom = this.targetZoom;
            }
        }

        if (this.lastKeyPage < this.keyPage) {
            this.redraw = true;
            this.lastKeyPage++;
        }

        if (this.lastKeyPage > this.keyPage) {
            this.redraw = true;
            this.lastKeyPage--;
        }

        if (this.flashTimer > 0) {
            this.redraw = true;
            this.flashTimer--;
        }

        const left: number = this.offsetX - ((635.0 / this.zoom) | 0);
        const top: number = this.offsetZ - ((503.0 / this.zoom) | 0);
        const right: number = this.offsetX + ((635.0 / this.zoom) | 0);
        const bottom: number = this.offsetZ + ((503.0 / this.zoom) | 0);
        if (left < 48) {
            this.offsetX = ((635.0 / this.zoom) | 0) + 48;
        }
        if (top < 48) {
            this.offsetZ = ((503.0 / this.zoom) | 0) + 48;
        }
        if (right > this.sizeX - 48) {
            this.offsetX = this.sizeX - 48 - ((635.0 / this.zoom) | 0);
        }
        if (bottom > this.sizeZ - 48) {
            this.offsetZ = this.sizeZ - 48 - ((503.0 / this.zoom) | 0);
        }
    };

    // ----

    // todo: SHA check and redownload
    async loadWorldmap(): Promise<Jagfile> {
        let data: Int8Array | undefined = await this.db?.cacheload('worldmap.dat');
        if (data) {
            return new Jagfile(data);
        }

        let retry: number = 5;
        while (!data) {
            await this.showProgress(0, 'Requesting map');

            try {
                console.log(`${Client.httpAddress}/worldmap.jag`);
                data = await downloadUrl(`${Client.httpAddress}/worldmap.jag`);
            } catch (e) {
                data = undefined;
                for (let i: number = retry; i > 0; i--) {
                    await this.showProgress(0, `Error loading - Will retry in ${i} secs.`);
                    await sleep(1000);
                }

                retry *= 2;
                if (retry > 60) {
                    retry = 60;
                }
            }
        }

        await this.db?.cachesave('worldmap.dat', data);
        return new Jagfile(data);
    }

    // ----

    drawString(x: number, y: number, width: number, height: number, colorBorderTL: number, fillColor: number, colorBorderBR: number, str: string): void {
        x = Math.trunc(x);
        y = Math.trunc(y);
        width = Math.trunc(width);
        height = Math.trunc(height);

        Draw2D.drawRect(x, y, width, height, 0);

        const xPad: number = x + 1;
        const yPad: number = y + 1;
        const widthPad: number = width - 2;
        const heightPad: number = height - 2;

        Draw2D.fillRect(xPad, yPad, widthPad, heightPad, fillColor);
        Draw2D.drawHorizontalLine(xPad, yPad, colorBorderTL, widthPad);
        Draw2D.drawVerticalLine(xPad, yPad, colorBorderTL, heightPad);
        Draw2D.drawHorizontalLine(xPad, yPad + heightPad - 1, colorBorderBR, widthPad);
        Draw2D.drawVerticalLine(xPad + widthPad - 1, yPad, colorBorderBR, heightPad);

        this.b12?.drawStringCenter(xPad + widthPad / 2 + 1, yPad + heightPad / 2 + 1 + 4, str, 0);
        this.b12?.drawStringCenter(xPad + widthPad / 2, yPad + heightPad / 2 + 4, str, 0xffffff);
    }

    clearEmptyTiles(): void {
        for (let x: number = 0; x < this.sizeX; x++) {
            for (let z: number = 0; z < this.sizeZ; z++) {
                if (this.underlayTiles[x][z] == 0 && this.overlayTiles[x][z] == 0) {
                    this.floormapColors[x][z] = 0;
                }
            }
        }
    }

    averageUnderlayColors(): void {
        const maxX: number = this.sizeX;
        const maxZ: number = this.sizeZ;

        const average: number[] = new TypedArray1d(maxZ, 0);

        for (let x: number = 5; x < maxX - 5; x++) {
            for (let z: number = 0; z < maxZ; z++) {
                average[z] += this.floorcolUnderlay[this.underlayTiles[x + 5][z]] - this.floorcolUnderlay[this.underlayTiles[x - 5][z]];
            }

            if (x > 10 && x < maxX - 10) {
                let r: number = 0;
                let g: number = 0;
                let b: number = 0;

                for (let z: number = 5; z < maxZ - 5; z++) {
                    const tileNorth: number = average[z + 5];
                    const tileSouth: number = average[z - 5];

                    r += (tileNorth >> 20) - (tileSouth >> 20);
                    g += ((tileNorth >> 10) & 0x3ff) - ((tileSouth >> 10) & 0x3ff);
                    b += (tileNorth & 0x3ff) - (tileSouth & 0x3ff);

                    if (b > 0) {
                        this.floormapColors[x][z] = this.convertHsl(r / 8533.0, g / 8533.0, b / 8533.0);
                    }
                }
            }
        }
    }

    // ----

    readUnderlayData(data: Packet): void {
        while (data.available > 0) {
            const mx: number = data.g1 * 64 - this.originX;
            const mz: number = data.g1 * 64 - this.originZ;

            if (mx > 0 && mz > 0 && mx + 64 < this.sizeX && mz + 64 < this.sizeZ) {
                for (let x: number = 0; x < 64; x++) {
                    let zIndex: number = this.sizeZ - mz - 1;

                    for (let z: number = -64; z < 0; z++) {
                        this.underlayTiles[mx + x][zIndex--] = data.g1;
                    }
                }
            } else {
                data.pos += 4096;
            }
        }
    }

    readOverlayData(data: Packet): void {
        while (data.available > 0) {
            const mx: number = data.g1 * 64 - this.originX;
            const mz: number = data.g1 * 64 - this.originZ;

            if (mx > 0 && mz > 0 && mx + 64 < this.sizeX && mz + 64 < this.sizeZ) {
                for (let x: number = 0; x < 64; x++) {
                    let zIndex: number = this.sizeZ - mz - 1;

                    for (let z: number = -64; z < 0; z++) {
                        const opcode: number = data.g1;
                        if (opcode === 0) {
                            this.overlayTiles[x + mx][zIndex--] = 0;
                        } else {
                            this.overlayInfo[x + mx][zIndex] = data.g1;
                            this.overlayTiles[x + mx][zIndex--] = this.floorcolOverlay[opcode];
                        }
                    }
                }
            } else {
                for (let i: number = -4096; i < 0; i++) {
                    const opcode: number = data.g1;
                    if (opcode != 0) {
                        data.g1;
                    }
                }
            }
        }
    }

    readLocData(data: Packet): void {
        while (data.available > 0) {
            const mx: number = data.g1 * 64 - this.originX;
            const mz: number = data.g1 * 64 - this.originZ;

            if (mx > 0 && mz > 0 && mx + 64 < this.sizeX && mz + 64 < this.sizeZ) {
                for (let x: number = 0; x < 64; x++) {
                    let zIndex: number = this.sizeZ - mz - 1;

                    for (let z: number = -64; z < 0; z++) {
                        // eslint-disable-next-line no-constant-condition
                        while (true) {
                            const opcode: number = data.g1;
                            if (opcode === 0) {
                                zIndex--;
                                break;
                            }

                            if (opcode < 29) {
                                this.locWalls[x + mx][zIndex] = opcode;
                            } else if (opcode < 160) {
                                this.locMapscenes[x + mx][zIndex] = opcode - 28;
                            } else {
                                this.locMapfunction[x + mx][zIndex] = opcode - 159;

                                this.activeMapFunctions[this.activeMapFunctionCount] = opcode - 160;
                                this.activeMapFunctionX[this.activeMapFunctionCount] = x + mx;
                                this.activeMapFunctionZ[this.activeMapFunctionCount] = zIndex;
                                this.activeMapFunctionCount++;
                            }
                        }
                    }
                }
            } else {
                for (let x: number = 0; x < 64; x++) {
                    let opcode: number = 0;
                    for (let z: number = -64; z < 0; z++) {
                        do {
                            opcode = data.g1;
                        } while (opcode != 0);
                    }
                }
            }
        }
    }

    readObjData(data: Packet): void {
        while (data.available > 0) {
            const mx: number = data.g1 * 64 - this.originX;
            const mz: number = data.g1 * 64 - this.originZ;

            if (mx > 0 && mz > 0 && mx + 64 < this.sizeX && mz + 64 < this.sizeZ) {
                for (let x: number = 0; x < 64; x++) {
                    let zIndex: number = this.sizeZ - mz - 1;

                    for (let z: number = -64; z < 0; z++) {
                        this.objTiles[x + mx][zIndex--] = data.g1 == 1;
                    }
                }
            } else {
                data.pos += 4096;
            }
        }
    }

    readNpcData(data: Packet): void {
        while (data.available > 0) {
            const mx: number = data.g1 * 64 - this.originX;
            const mz: number = data.g1 * 64 - this.originZ;

            if (mx > 0 && mz > 0 && mx + 64 < this.sizeX && mz + 64 < this.sizeZ) {
                for (let x: number = 0; x < 64; x++) {
                    let zIndex: number = this.sizeZ - mz - 1;

                    for (let z: number = -64; z < 0; z++) {
                        this.npcTiles[x + mx][zIndex--] = data.g1 == 1;
                    }
                }
            } else {
                data.pos += 4096;
            }
        }
    }

    // ----

    convertHsl(hue: number, saturation: number, lightness: number): number {
        let r: number = lightness;
        let g: number = lightness;
        let b: number = lightness;

        if (saturation !== 0.0) {
            let q: number;
            if (lightness < 0.5) {
                q = lightness * (saturation + 1.0);
            } else {
                q = lightness + saturation - lightness * saturation;
            }

            const p: number = lightness * 2.0 - q;
            let t: number = hue + 0.3333333333333333;
            if (t > 1.0) {
                t--;
            }

            let d11: number = hue - 0.3333333333333333;
            if (d11 < 0.0) {
                d11++;
            }

            if (t * 6.0 < 1.0) {
                r = p + (q - p) * 6.0 * t;
            } else if (t * 2.0 < 1.0) {
                r = q;
            } else if (t * 3.0 < 2.0) {
                r = p + (q - p) * (0.6666666666666666 - t) * 6.0;
            } else {
                r = p;
            }

            if (hue * 6.0 < 1.0) {
                g = p + (q - p) * 6.0 * hue;
            } else if (hue * 2.0 < 1.0) {
                g = q;
            } else if (hue * 3.0 < 2.0) {
                g = p + (q - p) * (0.6666666666666666 - hue) * 6.0;
            } else {
                g = p;
            }

            if (d11 * 6.0 < 1.0) {
                b = p + (q - p) * 6.0 * d11;
            } else if (d11 * 2.0 < 1.0) {
                b = q;
            } else if (d11 * 3.0 < 2.0) {
                b = p + (q - p) * (0.6666666666666666 - d11) * 6.0;
            } else {
                b = p;
            }
        }

        const intR: number = (r * 256.0) | 0;
        const intG: number = (g * 256.0) | 0;
        const intB: number = (b * 256.0) | 0;
        return (intR << 16) + (intG << 8) + intB;
    }

    drawMap(left: number, top: number, right: number, bottom: number, widthOffset: number, heightOffset: number, width: number, height: number): void {
        const visibleX: number = right - left;
        const visibleY: number = bottom - top;
        const widthRatio: number = (((width - widthOffset) << 16) / visibleX) | 0;
        const heightRatio: number = (((height - heightOffset) << 16) / visibleY) | 0;

        for (let x: number = 0; x < visibleX; x++) {
            let startX: number = (widthRatio * x) >> 16;
            let endX: number = (widthRatio * (x + 1)) >> 16;
            const lengthX: number = endX - startX;
            if (lengthX <= 0) {
                continue;
            }

            startX += widthOffset;
            endX += widthOffset;

            for (let y: number = 0; y < visibleY; y++) {
                let startY: number = (heightRatio * y) >> 16;
                let endY: number = (heightRatio * (y + 1)) >> 16;
                const lengthY: number = endY - startY;
                if (lengthY <= 0) {
                    continue;
                }

                startY += heightOffset;
                endY += heightOffset;

                const overlay: number = this.overlayTiles[x + left][y + top];
                if (overlay === 0) {
                    Draw2D.fillRect(startX, startY, endX - startX, endY - startY, this.floormapColors[x + left][y + top]);
                } else {
                    const info: number = this.overlayInfo[x + left][y + top];
                    const shape: number = info & 0xfc;
                    if (shape == 0 || lengthX <= 1 || lengthY <= 1) {
                        Draw2D.fillRect(startX, startY, lengthX, lengthY, overlay);
                    } else {
                        this.drawSmoothEdges(Draw2D.pixels, startY * Draw2D.width2d + startX, this.floormapColors[x + left][y + top], overlay, lengthX, lengthY, shape >> 2, info & 0x3);
                    }
                }
            }
        }

        if (right - left > width - widthOffset) {
            return;
        }

        let visibleMapFunctionCount: number = 0;
        for (let x: number = 0; x < visibleX; x++) {
            let startX: number = (widthRatio * x) >> 16;
            let endX: number = (widthRatio * (x + 1)) >> 16;
            const lengthX: number = endX - startX;
            if (lengthX <= 0) {
                continue;
            }

            startX += widthOffset;
            endX += widthOffset;

            for (let y: number = 0; y < visibleY; y++) {
                let startY: number = (heightRatio * y) >> 16;
                let endY: number = (heightRatio * (y + 1)) >> 16;
                const lengthY: number = endY - startY;
                if (lengthY <= 0) {
                    continue;
                }

                startY += heightOffset;
                endY += heightOffset;

                let wall: number = this.locWalls[x + left][y + top] & 0xff;
                if (wall != 0) {
                    let edgeX: number;
                    if (lengthX == 1) {
                        edgeX = startX;
                    } else {
                        edgeX = endX - 1;
                    }

                    let edgeY: number;
                    if (lengthY == 1) {
                        edgeY = startY;
                    } else {
                        edgeY = endY - 1;
                    }

                    let rgb: number = 0xcccccc;
                    if ((wall >= 5 && wall <= 8) || (wall >= 13 && wall <= 16) || (wall >= 21 && wall <= 24)) {
                        rgb = 0xcc0000;
                        wall -= 4;
                    }
                    if (wall == 27 || wall == 28) {
                        // bugfix: drawing diagonal doors
                        rgb = 0xcc0000;
                        wall -= 2;
                    }

                    if (wall == 1) {
                        Draw2D.drawVerticalLine(startX, startY, rgb, lengthY);
                    } else if (wall == 2) {
                        Draw2D.drawHorizontalLine(startX, startY, rgb, lengthX);
                    } else if (wall == 3) {
                        Draw2D.drawVerticalLine(edgeX, startY, rgb, lengthY);
                    } else if (wall == 4) {
                        Draw2D.drawHorizontalLine(startX, edgeY, rgb, lengthX);
                    } else if (wall == 9) {
                        Draw2D.drawVerticalLine(startX, startY, 0xffffff, lengthY);
                        Draw2D.drawHorizontalLine(startX, startY, rgb, lengthX);
                    } else if (wall == 10) {
                        Draw2D.drawVerticalLine(edgeX, startY, 0xffffff, lengthY);
                        Draw2D.drawHorizontalLine(startX, startY, rgb, lengthX);
                    } else if (wall == 11) {
                        Draw2D.drawVerticalLine(edgeX, startY, 0xffffff, lengthY);
                        Draw2D.drawHorizontalLine(startX, edgeY, rgb, lengthX);
                    } else if (wall == 12) {
                        Draw2D.drawVerticalLine(startX, startY, 0xffffff, lengthY);
                        Draw2D.drawHorizontalLine(startX, edgeY, rgb, lengthX);
                    } else if (wall == 17) {
                        Draw2D.drawHorizontalLine(startX, startY, rgb, 1);
                    } else if (wall == 18) {
                        Draw2D.drawHorizontalLine(edgeX, startY, rgb, 1);
                    } else if (wall == 19) {
                        Draw2D.drawHorizontalLine(edgeX, edgeY, rgb, 1);
                    } else if (wall == 20) {
                        Draw2D.drawHorizontalLine(startX, edgeY, rgb, 1);
                    } else if (wall == 25) {
                        for (let i: number = 0; i < lengthY; i++) {
                            Draw2D.drawHorizontalLine(startX + i, edgeY - i, rgb, 1);
                        }
                    } else if (wall == 26) {
                        for (let i: number = 0; i < lengthY; i++) {
                            Draw2D.drawHorizontalLine(startX + i, startY + i, rgb, 1);
                        }
                    }
                }

                const mapscene: number = this.locMapscenes[x + left][y + top];
                if (mapscene != 0) {
                    this.imageMapscene[mapscene - 1].clip(startX - lengthX / 2, startY - lengthY / 2, lengthX * 2, lengthY * 2);
                }

                const mapfunction: number = this.locMapfunction[x + left][y + top];
                if (mapfunction != 0) {
                    this.visibleMapFunctions[visibleMapFunctionCount] = mapfunction - 1;
                    this.visibleMapFunctionsX[visibleMapFunctionCount] = startX + lengthX / 2;
                    this.visibleMapFunctionsY[visibleMapFunctionCount] = startY + lengthY / 2;
                    visibleMapFunctionCount++;
                }
            }
        }

        for (let x: number = 0; x < visibleX; x++) {
            let startX: number = (widthRatio * x) >> 16;
            let endX: number = (widthRatio * (x + 1)) >> 16;
            const lengthX: number = endX - startX;
            if (lengthX <= 0) {
                continue;
            }

            startX += widthOffset;
            endX += widthOffset;

            for (let y: number = 0; y < visibleY; y++) {
                let startY: number = (heightRatio * y) >> 16;
                let endY: number = (heightRatio * (y + 1)) >> 16;
                const lengthY: number = endY - startY;
                if (lengthY <= 0) {
                    continue;
                }

                startY += heightOffset;
                endY += heightOffset;

                if (this.objTiles[x + left][y + top]) {
                    this.imageMapdot0?.draw(startX, startY);
                }
            }
        }

        for (let x: number = 0; x < visibleX; x++) {
            let startX: number = (widthRatio * x) >> 16;
            let endX: number = (widthRatio * (x + 1)) >> 16;
            const lengthX: number = endX - startX;
            if (lengthX <= 0) {
                continue;
            }

            startX += widthOffset;
            endX += widthOffset;

            for (let y: number = 0; y < visibleY; y++) {
                let startY: number = (heightRatio * y) >> 16;
                let endY: number = (heightRatio * (y + 1)) >> 16;
                const lengthY: number = endY - startY;
                if (lengthY <= 0) {
                    continue;
                }

                startY += heightOffset;
                endY += heightOffset;

                if (this.npcTiles[x + left][y + top]) {
                    this.imageMapdot1?.draw(startX, startY);
                }
            }
        }

        for (let i: number = 0; i < visibleMapFunctionCount; i++) {
            this.imageMapfunction[this.visibleMapFunctions[i]].draw(this.visibleMapFunctionsX[i] - 7, this.visibleMapFunctionsY[i] - 7);
        }

        if (this.flashTimer > 0) {
            for (let i: number = 0; i < visibleMapFunctionCount; i++) {
                if (this.visibleMapFunctions[i] == this.currentKey) {
                    this.imageMapfunction[this.visibleMapFunctions[i]].draw(this.visibleMapFunctionsX[i] - 7, this.visibleMapFunctionsY[i] - 7);

                    if (this.flashTimer % 10 < 5) {
                        Draw2D.fillCircle(this.visibleMapFunctionsX[i], this.visibleMapFunctionsY[i], 15, 0xffff00, 128);
                        Draw2D.fillCircle(this.visibleMapFunctionsX[i], this.visibleMapFunctionsY[i], 7, 0xffffff, 256);
                    }
                }
            }
        }

        if (this.zoom == this.targetZoom && MapView.shouldDrawLabels) {
            // todo: port WorldmapFont
        }

        if (MapView.shouldDrawBorders) {
            for (let mx: number = this.originX / 64; mx < (this.originX + this.sizeX) / 64; mx++) {
                for (let mz: number = this.originZ / 64; mz < (this.originZ + this.sizeZ) / 64; mz++) {
                    let x: number = mx * 64;
                    let z: number = mz * 64;
                    x -= this.originX;
                    z = this.originZ + this.sizeZ - z;

                    const drawLeft: number = (widthOffset + ((width - widthOffset) * (x - left)) / (right - left)) | 0;
                    const drawTop: number = (heightOffset + ((height - heightOffset) * (z - 64 - top)) / (bottom - top)) | 0;
                    const drawRight: number = (widthOffset + ((width - widthOffset) * (x + 64 - left)) / (right - left)) | 0;
                    const drawBottom: number = (heightOffset + ((height - heightOffset) * (z - top)) / (bottom - top)) | 0;

                    Draw2D.drawRect(drawLeft, drawTop, 0xffffff, drawRight - drawLeft, drawBottom - drawTop);
                    this.b12?.drawStringRight(drawRight - 5, drawBottom - 5, mx + '_' + mz, 0xffffff, false);

                    if (mx == 33 && mz >= 71 && mz <= 73) {
                        this.b12?.drawStringCenter((drawRight + drawLeft) / 2, (drawBottom + drawTop) / 2, 'u_pass', 0xff0000);
                    } else if (mx >= 32 && mx <= 34 && mz >= 70 && mz <= 74) {
                        this.b12?.drawStringCenter((drawRight + drawLeft) / 2, (drawBottom + drawTop) / 2, 'u_pass', 0xffff00);
                    }
                }
            }
        }
    }

    drawSmoothEdges(data: Int32Array, off: number, color: number, overlay: number, width: number, height: number, shape: number, rotation: number): void {
        const step: number = Draw2D.width2d - width;
        if (shape == 9) {
            shape = 1;
            rotation = (rotation + 1) & 0x3;
        } else if (shape == 10) {
            shape = 1;
            rotation = (rotation + 3) & 0x3;
        } else if (shape == 11) {
            shape = 8;
            rotation = (rotation + 3) & 0x3;
        }

        if (shape == 1) {
            if (rotation == 0) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 2) {
            if (rotation == 0) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 3) {
            if (rotation == 0) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 4) {
            if (rotation == 0) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 5) {
            if (rotation == 0) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y >> 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y << 1) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 6) {
            if (rotation == 0) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= width / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (y <= height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= width / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (y >= height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 7) {
            if (rotation == 0) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x <= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x <= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        } else if (shape == 8) {
            if (rotation == 0) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 1) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = 0; x < width; x++) {
                        if (x >= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 2) {
                for (let y: number = height - 1; y >= 0; y--) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            } else if (rotation == 3) {
                for (let y: number = 0; y < height; y++) {
                    for (let x: number = width - 1; x >= 0; x--) {
                        if (x >= y - height / 2) {
                            data[off++] = overlay;
                        } else {
                            data[off++] = color;
                        }
                    }
                    off += step;
                }
            }
        }
    }

    // ----

    getTitleScreenState(): number {
        return 0;
    }

    isChatBackInputOpen(): boolean {
        return false;
    }

    isShowSocialInput(): boolean {
        return false;
    }

    getChatInterfaceId(): number {
        return -1;
    }

    getViewportInterfaceId(): number {
        return -1;
    }
}

await setupConfiguration();
new MapView().run().then((): void => {});

// prevent space from scrolling page
window.onkeydown = function (e): boolean {
    return !(e.key === ' ' && e.target === document.body);
};
