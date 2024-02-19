import 'style/JagEd.scss';

import Bzip from './vendor/bzip';
import Gzip from './vendor/gzip';

import GameShell from './jagex2/client/GameShell';

import Database from './jagex2/io/Database';

import Draw2D from './jagex2/graphics/Draw2D';
import Draw3D from './jagex2/graphics/Draw3D';
import DiskStore from './jagex2/io/DiskStore';
import Model from './jagex2/graphics/Model';
import Jagfile from './jagex2/io/Jagfile';

import {Client} from './client';
import Colors from './jagex2/graphics/Colors';
import {canvas} from './jagex2/graphics/Canvas';
import PixMap from './jagex2/graphics/PixMap';

// noinspection JSSuspiciousNameCombination
class JagEd extends Client {
    alreadyStarted: boolean = false;
    errorStarted: boolean = false;
    errorLoading: boolean = false;
    errorHost: boolean = false;

    rightPanel: HTMLElement | null = null;

    jagStore: DiskStore | null = null;
    modelStore: DiskStore | null = null;
    animStore: DiskStore | null = null;
    midiStore: DiskStore | null = null;
    mapStore: DiskStore | null = null;

    private eyeX: number = 0;
    private eyeY: number = 0;
    private eyeZ: number = 0;
    private eyePitch: number = 0;
    private eyeYaw: number = 0;

    modifier = 2;
    model = {
        id: parseInt(GameShell.getParameter('model')) || 0,
        built: null as Model | null,
        x: 0,
        y: 0,
        z: 420,
        yaw: 0
    };

    colorPalette: PixMap | null = null;

    constructor() {
        super(true);
    }

    load = async (): Promise<void> => {
        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        try {
            await Gzip();
            await Bzip.load(await (await fetch('bz2.wasm')).arrayBuffer());
            this.db = new Database(await Database.openDatabase());

            this.rightPanel = document.getElementById('rightPanel');
            const mainPanel: HTMLElement = document.getElementById('mainPanel') as HTMLElement;
            if (mainPanel) {
                mainPanel.ondragover = (event: DragEvent): void => {
                    event.preventDefault();
                    event.stopPropagation();
                };

                mainPanel.ondrop = async (event: DragEvent): Promise<void> => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!event.dataTransfer || !event.dataTransfer.files.length) {
                        return;
                    }

                    const WHITELIST: string[] = ['main_file_cache.dat', 'main_file_cache.idx0', 'main_file_cache.idx1', 'main_file_cache.idx2', 'main_file_cache.idx3', 'main_file_cache.idx4'];

                    const files: File[] = [];
                    for (let i: number = 0; i < event.dataTransfer.files.length; i++) {
                        const file: File = event.dataTransfer.files[i];

                        if (WHITELIST.includes(file.name)) {
                            files.push(file);
                        }
                    }

                    for (let i: number = 0; i < files.length; i++) {
                        const file: File = files[i];

                        const data: ArrayBuffer = await file.arrayBuffer();
                        await this.db?.cachesave(file.name, new Int8Array(data));
                    }

                    await this.init();
                };
            }

            await this.init();
        } catch (err) {
            this.errorLoading = true;
            console.error(err);
        }
    };

    update = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        this.updateKeysPressed();
        this.updateKeysHeld();
    };

    draw = async (): Promise<void> => {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawError();
            return;
        }

        Model.checkHoverFace = true;
        Model.mouseX = this.mouseX;
        Model.mouseY = this.mouseY;

        this.drawArea?.bind();
        Draw2D.clear();
        Draw2D.fillRect(0, 0, this.width, this.height, Colors.BLACK);

        if (this.model.built !== null) {
            this.model.built.draw(this.model.yaw, Draw3D.sin[this.eyePitch], Draw3D.cos[this.eyePitch], Draw3D.sin[this.eyeYaw], Draw3D.cos[this.eyeYaw], this.model.x - this.eyeX, this.model.y - this.eyeY, this.model.z - this.eyeZ, 0);

            if (this.model.built.pickedFace !== -1) {
                this.model.built.drawFaceOutline(this.model.built.pickedFace);
            }
        }

        this.drawArea?.draw(0, 0);

        this.colorPalette?.draw(this.mouseX, this.mouseY);
    };

    //

    init = async (): Promise<void> => {
        const dat: Int8Array | undefined = await this.db?.cacheload('main_file_cache.dat');
        if (!dat) {
            const helpMe: HTMLElement = document.getElementById('helpme') as HTMLElement;
            helpMe.style.display = 'block';
            canvas.style.display = 'none';
            return;
        }

        const idx0: Int8Array | undefined = await this.db?.cacheload('main_file_cache.idx0');
        const idx1: Int8Array | undefined = await this.db?.cacheload('main_file_cache.idx1');
        const idx2: Int8Array | undefined = await this.db?.cacheload('main_file_cache.idx2');
        const idx3: Int8Array | undefined = await this.db?.cacheload('main_file_cache.idx3');
        const idx4: Int8Array | undefined = await this.db?.cacheload('main_file_cache.idx4');

        if (!idx0 || !idx1 || !idx2 || !idx3 || !idx4) {
            const helpMe: HTMLElement = document.getElementById('helpme') as HTMLElement;
            helpMe.style.display = 'block';
            canvas.style.display = 'none';
            return;
        }

        const helpMe: HTMLElement = document.getElementById('helpme') as HTMLElement;
        helpMe.style.display = 'none';
        canvas.style.display = 'block';

        this.jagStore = new DiskStore(dat, idx0, 0);
        this.modelStore = new DiskStore(dat, idx1, 1);
        this.animStore = new DiskStore(dat, idx2, 2);
        this.midiStore = new DiskStore(dat, idx3, 3);
        this.mapStore = new DiskStore(dat, idx4, 4);

        await this.showProgress(10, 'Unpacking textures');
        const textures: Jagfile | Uint8Array | null = this.jagStore.read(6);
        Draw3D.unpackTextures(textures as Jagfile);
        Draw3D.setBrightness(0.8);
        Draw3D.initPool(20);

        await this.showProgress(20, 'Loading models...');
        for (let i: number = 0; i < this.modelStore.fileCount; i++) {
            const data: Uint8Array | Jagfile | null = this.modelStore.read(i);

            if (data !== null) {
                Model.unpack317(data as Uint8Array, i);
            }
        }

        this.loadModel(0);

        if (this.rightPanel !== null) {
            const ul: HTMLUListElement = document.createElement('ul');
            ul.id = 'modelList';
            ul.className = 'list-group';
            this.rightPanel.appendChild(ul);

            for (let i: number = 0; i < this.modelStore.fileCount; i++) {
                const li: HTMLLIElement = document.createElement('li');
                li.className = 'list-group-item';
                li.innerText = `Model ${i}`;
                li.onclick = (): void => {
                    this.model.id = i;
                    this.loadModel(i);
                };
                ul.appendChild(li);
            }
        }

        await this.showProgress(80, 'Finishing up...');

        this.colorPalette = new PixMap(512, 128);
        this.colorPalette.bind();
        for (let y: number = 0; y < 512; y++) {
            for (let x: number = 0; x < 128; x++) {
                const drawX: number = y;
                const drawY: number = 127 - x;

                Draw2D.setPixel(drawX, drawY, Draw3D.palette[x + y * 128]);
            }
        }
        this.colorPalette.draw(0, 0);
    };

    loadModel(id: number): void {
        if (this.modelStore === null) {
            return;
        }

        const data: Uint8Array | Jagfile | null = this.modelStore.read(id);
        if (data !== null) {
            this.model.built = Model.model317(data as Uint8Array, id);
            this.model.built.calculateNormals(64, 850, -30, -50, -30, true);
            document.title = `Model ${id} | 2004Scape Tools`;
        } else {
            document.title = `Missing model ${id} | 2004Scape Tools`;
        }
    }

    updateKeysPressed(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const key: number = this.pollKey();
            if (key === -1) {
                break;
            }

            if (key === 'r'.charCodeAt(0)) {
                this.modifier = 2;
                this.eyeX = 0;
                this.eyeY = 0;
                this.eyeZ = 0;
                this.eyePitch = 0;
                this.eyeYaw = 0;
                this.model.x = 0;
                this.model.y = 0;
                this.model.z = 420;
                this.model.yaw = 0;
            } else if (key === '1'.charCodeAt(0)) {
                this.model.id--;
                if (Model.metadata && this.model.id < 0) {
                    this.model.id = Model.metadata.length - 1;
                }
                this.loadModel(this.model.id);
            } else if (key === '2'.charCodeAt(0)) {
                this.model.id++;
                if (Model.metadata && this.model.id >= Model.metadata.length) {
                    this.model.id = 0;
                }
                this.loadModel(this.model.id);
            }
        }
    }

    updateKeysHeld(): void {
        if (this.actionKey['['.charCodeAt(0)]) {
            this.modifier--;
        } else if (this.actionKey[']'.charCodeAt(0)]) {
            this.modifier++;
        }

        if (this.actionKey[1]) {
            // left arrow
            this.model.yaw += this.modifier;
        } else if (this.actionKey[2]) {
            // right arrow
            this.model.yaw -= this.modifier;
        }

        if (this.actionKey['w'.charCodeAt(0)]) {
            this.model.z -= this.modifier;
        } else if (this.actionKey['s'.charCodeAt(0)]) {
            this.model.z += this.modifier;
        }

        if (this.actionKey['a'.charCodeAt(0)]) {
            this.model.x -= this.modifier;
        } else if (this.actionKey['d'.charCodeAt(0)]) {
            this.model.x += this.modifier;
        }

        if (this.actionKey['q'.charCodeAt(0)]) {
            this.model.y -= this.modifier;
        } else if (this.actionKey['e'.charCodeAt(0)]) {
            this.model.y += this.modifier;
        }

        this.eyePitch = this.eyePitch & 2047;
        this.eyeYaw = this.eyeYaw & 2047;
        this.model.yaw = this.model.yaw & 2047;
    }
}

new JagEd().run().then((): void => {});
