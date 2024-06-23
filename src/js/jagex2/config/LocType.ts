import Jagfile from '../io/Jagfile';
import {ConfigType} from './ConfigType';
import Packet from '../io/Packet';
import LruCache from '../datastruct/LruCache';
import Model from '../graphics/Model';
import LocShape from '../dash3d/LocShape';
import LocAngle from '../dash3d/LocAngle';
import {TypedArray1d} from '../util/Arrays';

export default class LocType extends ConfigType {
    static count: number = 0;
    static cache: (LocType | null)[] | null = null;
    static dat: Packet | null = null;
    static offsets: Int32Array | null = null;
    static cachePos: number = 0;
    static modelCacheStatic: LruCache | null = new LruCache(500);
    static modelCacheDynamic: LruCache | null = new LruCache(30);

    static unpack = (config: Jagfile): void => {
        this.dat = new Packet(config.read('loc.dat'));
        const idx: Packet = new Packet(config.read('loc.idx'));

        this.count = idx.g2;
        this.offsets = new Int32Array(this.count);

        let offset: number = 2;
        for (let id: number = 0; id < this.count; id++) {
            this.offsets[id] = offset;
            offset += idx.g2;
        }

        this.cache = new TypedArray1d(10, null);
        for (let id: number = 0; id < 10; id++) {
            this.cache[id] = new LocType(-1);
        }
    };

    static get = (id: number): LocType => {
        if (!this.cache || !this.offsets || !this.dat) {
            throw new Error('LocType not loaded!!!');
        }

        for (let i: number = 0; i < 10; i++) {
            const type: LocType | null = this.cache[i];
            if (!type) {
                continue;
            }
            if (type.id === id) {
                return type;
            }
        }

        this.cachePos = (this.cachePos + 1) % 10;
        const loc: LocType = this.cache[this.cachePos]!;
        this.dat.pos = this.offsets[id];
        loc.id = id;
        loc.reset();
        loc.decodeType(this.dat);

        if (!loc.shapes) {
            loc.shapes = new Int32Array(1);
        }

        if (loc.active2 === -1 && loc.shapes) {
            loc.active = loc.shapes.length > 0 && loc.shapes[0] === LocShape.CENTREPIECE_STRAIGHT.id;

            if (loc.op) {
                loc.active = true;
            }
        }
        return loc;
    };

    static unload = (): void => {
        this.modelCacheStatic = null;
        this.modelCacheDynamic = null;
        this.offsets = null;
        this.cache = null;
        this.dat = null;
    };

    // ----

    models: Int32Array | null = null;
    shapes: Int32Array | null = null;
    name: string | null = null;
    desc: string | null = null;
    recol_s: Uint16Array | null = null;
    recol_d: Uint16Array | null = null;
    width: number = 1;
    length: number = 1;
    blockwalk: boolean = true;
    blockrange: boolean = true;
    active: boolean = false;
    active2: number = -1;
    hillskew: boolean = false;
    sharelight: boolean = false;
    occlude: boolean = false;
    anim: number = -1;
    disposeAlpha: boolean = false;
    wallwidth: number = 16;
    ambient: number = 0;
    contrast: number = 0;
    op: (string | null)[] | null = null;
    mapfunction: number = -1;
    mapscene: number = -1;
    mirror: boolean = false;
    shadow: boolean = true;
    resizex: number = 128;
    resizey: number = 128;
    resizez: number = 128;
    forceapproach: number = 0;
    offsetx: number = 0;
    offsety: number = 0;
    offsetz: number = 0;
    forcedecor: boolean = false;

    decode(code: number, dat: Packet): void {
        if (code === 1) {
            const count: number = dat.g1;
            this.models = new Int32Array(count);
            this.shapes = new Int32Array(count);

            for (let i: number = 0; i < count; i++) {
                this.models[i] = dat.g2;
                this.shapes[i] = dat.g1;
            }
        } else if (code === 2) {
            this.name = dat.gjstr;
        } else if (code === 3) {
            this.desc = dat.gjstr;
        } else if (code === 14) {
            this.width = dat.g1;
        } else if (code === 15) {
            this.length = dat.g1;
        } else if (code === 17) {
            this.blockwalk = false;
        } else if (code === 18) {
            this.blockrange = false;
        } else if (code === 19) {
            this.active2 = dat.g1;
            if (this.active2 === 1) {
                this.active = true;
            }
        } else if (code === 21) {
            this.hillskew = true;
        } else if (code === 22) {
            this.sharelight = true;
        } else if (code === 23) {
            this.occlude = true;
        } else if (code === 24) {
            this.anim = dat.g2;

            if (this.anim === 65535) {
                this.anim = -1;
            }
        } else if (code === 25) {
            this.disposeAlpha = true;
        } else if (code === 28) {
            this.wallwidth = dat.g1;
        } else if (code === 29) {
            this.ambient = dat.g1b;
        } else if (code === 39) {
            this.contrast = dat.g1b;
        } else if (code >= 30 && code < 39) {
            if (!this.op) {
                this.op = new TypedArray1d(5, null);
            }

            this.op[code - 30] = dat.gjstr;
            if (this.op[code - 30]?.toLowerCase() === 'hidden') {
                this.op[code - 30] = null;
            }
        } else if (code === 40) {
            const count: number = dat.g1;
            this.recol_s = new Uint16Array(count);
            this.recol_d = new Uint16Array(count);

            for (let i: number = 0; i < count; i++) {
                this.recol_s[i] = dat.g2;
                this.recol_d[i] = dat.g2;
            }
        } else if (code === 60) {
            this.mapfunction = dat.g2;
        } else if (code === 62) {
            this.mirror = true;
        } else if (code === 64) {
            this.shadow = false;
        } else if (code === 65) {
            this.resizex = dat.g2;
        } else if (code === 66) {
            this.resizey = dat.g2;
        } else if (code === 67) {
            this.resizez = dat.g2;
        } else if (code === 68) {
            this.mapscene = dat.g2;
        } else if (code === 69) {
            this.forceapproach = dat.g1;
        } else if (code === 70) {
            this.offsetx = dat.g2b;
        } else if (code === 71) {
            this.offsety = dat.g2b;
        } else if (code === 72) {
            this.offsetz = dat.g2b;
        } else if (code === 73) {
            this.forcedecor = true;
        }
    }

    getModel(shape: number, angle: number, heightmapSW: number, heightmapSE: number, heightmapNE: number, heightmapNW: number, transformId: number): Model | null {
        if (!this.shapes) {
            return null;
        }

        let shapeIndex: number = -1;
        for (let i: number = 0; i < this.shapes.length; i++) {
            if (this.shapes[i] === shape) {
                shapeIndex = i;
                break;
            }
        }

        if (shapeIndex === -1) {
            return null;
        }

        const bitset: bigint = BigInt(BigInt(this.id) << 6n) + BigInt(BigInt(shapeIndex) << 3n) + BigInt(angle) + BigInt((BigInt(transformId) + 1n) << 32n);
        /*if (reset) {
            bitset = 0L;
        }*/

        let cached: Model | null = LocType.modelCacheDynamic?.get(bitset) as Model | null;
        if (cached) {
            /*if (reset) {
                return cached;
            }*/

            if (this.hillskew || this.sharelight) {
                cached = Model.modelCopyFaces(cached, this.hillskew, this.sharelight);
            }

            if (this.hillskew) {
                const groundY: number = ((heightmapSW + heightmapSE + heightmapNE + heightmapNW) / 4) | 0;

                for (let i: number = 0; i < cached.vertexCount; i++) {
                    const x: number = cached.vertexX[i];
                    const z: number = cached.vertexZ[i];

                    const heightS: number = heightmapSW + ((((heightmapSE - heightmapSW) * (x + 64)) / 128) | 0);
                    const heightN: number = heightmapNW + ((((heightmapNE - heightmapNW) * (x + 64)) / 128) | 0);
                    const y: number = heightS + ((((heightN - heightS) * (z + 64)) / 128) | 0);

                    cached.vertexY[i] += y - groundY;
                }

                cached.calculateBoundsY();
            }

            return cached;
        }

        if (!this.models) {
            return null;
        }

        if (shapeIndex >= this.models.length) {
            return null;
        }

        let modelId: number = this.models[shapeIndex];
        if (modelId === -1) {
            return null;
        }

        const flipped: boolean = this.mirror !== angle > 3;
        if (flipped) {
            modelId += 65536;
        }

        let model: Model | null = LocType.modelCacheStatic?.get(BigInt(modelId)) as Model | null;
        if (!model) {
            model = Model.model(modelId & 0xffff);
            if (flipped) {
                model.rotateY180();
            }
            LocType.modelCacheStatic?.put(BigInt(modelId), model);
        }

        const scaled: boolean = this.resizex !== 128 || this.resizey !== 128 || this.resizez !== 128;
        const translated: boolean = this.offsetx !== 0 || this.offsety !== 0 || this.offsetz !== 0;

        let modified: Model = Model.modelShareColored(model, !this.recol_s, !this.disposeAlpha, angle === LocAngle.WEST && transformId === -1 && !scaled && !translated);
        if (transformId !== -1) {
            modified.createLabelReferences();
            modified.applyTransform(transformId);
            modified.labelFaces = null;
            modified.labelVertices = null;
        }

        while (angle-- > 0) {
            modified.rotateY90();
        }

        if (this.recol_s && this.recol_d) {
            for (let i: number = 0; i < this.recol_s.length; i++) {
                modified.recolor(this.recol_s[i], this.recol_d[i]);
            }
        }

        if (scaled) {
            modified.scale(this.resizex, this.resizey, this.resizez);
        }

        if (translated) {
            modified.translate(this.offsety, this.offsetx, this.offsetz);
        }

        modified.calculateNormals((this.ambient & 0xff) + 64, (this.contrast & 0xff) * 5 + 768, -50, -10, -50, !this.sharelight);

        if (this.blockwalk) {
            modified.objRaise = modified.maxY;
        }

        LocType.modelCacheDynamic?.put(bitset, modified);

        if (this.hillskew || this.sharelight) {
            modified = Model.modelCopyFaces(modified, this.hillskew, this.sharelight);
        }

        if (this.hillskew) {
            const groundY: number = ((heightmapSW + heightmapSE + heightmapNE + heightmapNW) / 4) | 0;

            for (let i: number = 0; i < modified.vertexCount; i++) {
                const x: number = modified.vertexX[i];
                const z: number = modified.vertexZ[i];

                const heightS: number = heightmapSW + ((((heightmapSE - heightmapSW) * (x + 64)) / 128) | 0);
                const heightN: number = heightmapNW + ((((heightmapNE - heightmapNW) * (x + 64)) / 128) | 0);
                const y: number = heightS + ((((heightN - heightS) * (z + 64)) / 128) | 0);

                modified.vertexY[i] += y - groundY;
            }

            modified.calculateBoundsY();
        }

        return modified;
    }

    private reset(): void {
        this.models = null;
        this.shapes = null;
        this.name = null;
        this.desc = null;
        this.recol_s = null;
        this.recol_d = null;
        this.width = 1;
        this.length = 1;
        this.blockwalk = true;
        this.blockrange = true;
        this.active = false;
        this.active2 = -1;
        this.hillskew = false;
        this.sharelight = false;
        this.occlude = false;
        this.anim = -1;
        this.wallwidth = 16;
        this.ambient = 0;
        this.contrast = 0;
        this.op = null;
        this.disposeAlpha = false;
        this.mapfunction = -1;
        this.mapscene = -1;
        this.mirror = false;
        this.shadow = true;
        this.resizex = 128;
        this.resizey = 128;
        this.resizez = 128;
        this.forceapproach = 0;
        this.offsetx = 0;
        this.offsety = 0;
        this.offsetz = 0;
        this.forcedecor = false;
    }
}
