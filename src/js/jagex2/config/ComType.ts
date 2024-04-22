import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import PixFont from '../graphics/PixFont';
import Model from '../graphics/Model';
import LruCache from '../datastruct/LruCache';
import Pix24 from '../graphics/Pix24';
import JString from '../datastruct/JString';
import {TypedArray1d} from '../util/Arrays';
import Draw2D from '../graphics/Draw2D';

export default class ComType {
    static instances: ComType[] = [];
    static imageCache: LruCache | null = null;
    static modelCache: LruCache | null = null;

    // com types
    static readonly TYPE_LAYER: number = 0;
    static readonly TYPE_UNUSED: number = 1; // TODO
    static readonly TYPE_INV: number = 2;
    static readonly TYPE_RECT: number = 3;
    static readonly TYPE_TEXT: number = 4;
    static readonly TYPE_GRAPHIC: number = 5;
    static readonly TYPE_MODEL: number = 6;
    static readonly TYPE_INV_TEXT: number = 7;

    // button types
    static readonly BUTTON_OK: number = 1;
    static readonly BUTTON_TARGET: number = 2;
    static readonly BUTTON_CLOSE: number = 3;
    static readonly BUTTON_TOGGLE: number = 4;
    static readonly BUTTON_SELECT: number = 5;
    static readonly BUTTON_CONTINUE: number = 6;

    // client codes
    //// friends (1-203)
    static readonly CC_FRIENDS_START: number = 1;
    static readonly CC_FRIENDS_END: number = 100;
    static readonly CC_FRIENDS_UPDATE_START: number = 101;
    static readonly CC_FRIENDS_UPDATE_END: number = 200;
    static readonly CC_ADD_FRIEND: number = 201;
    static readonly CC_DEL_FRIEND: number = 202;
    static readonly CC_FRIENDS_SIZE: number = 203;
    //// logout
    static readonly CC_LOGOUT: number = 205;
    //// player design (300-327)
    static readonly CC_CHANGE_HEAD_L: number = 300;
    static readonly CC_CHANGE_HEAD_R: number = 301;
    static readonly CC_CHANGE_JAW_L: number = 302;
    static readonly CC_CHANGE_JAW_R: number = 303;
    static readonly CC_CHANGE_TORSO_L: number = 304;
    static readonly CC_CHANGE_TORSO_R: number = 305;
    static readonly CC_CHANGE_ARMS_L: number = 306;
    static readonly CC_CHANGE_ARMS_R: number = 307;
    static readonly CC_CHANGE_HANDS_L: number = 308;
    static readonly CC_CHANGE_HANDS_R: number = 309;
    static readonly CC_CHANGE_LEGS_L: number = 310;
    static readonly CC_CHANGE_LEGS_R: number = 311;
    static readonly CC_CHANGE_FEET_L: number = 312;
    static readonly CC_CHANGE_FEET_R: number = 313;
    static readonly CC_RECOLOUR_HAIR_L: number = 314;
    static readonly CC_RECOLOUR_HAIR_R: number = 315;
    static readonly CC_RECOLOUR_TORSO_L: number = 316;
    static readonly CC_RECOLOUR_TORSO_R: number = 317;
    static readonly CC_RECOLOUR_LEGS_L: number = 318;
    static readonly CC_RECOLOUR_LEGS_R: number = 319;
    static readonly CC_RECOLOUR_FEET_L: number = 320;
    static readonly CC_RECOLOUR_FEET_R: number = 321;
    static readonly CC_RECOLOUR_SKIN_L: number = 322;
    static readonly CC_RECOLOUR_SKIN_R: number = 323;
    static readonly CC_SWITCH_TO_MALE: number = 324;
    static readonly CC_SWITCH_TO_FEMALE: number = 325;
    static readonly CC_ACCEPT_DESIGN: number = 326;
    static readonly CC_DESIGN_PREVIEW: number = 327;
    //// ignores (401-503)
    static readonly CC_IGNORES_START: number = 401;
    static readonly CC_IGNORES_END: number = 500;
    static readonly CC_ADD_IGNORE: number = 501;
    static readonly CC_DEL_IGNORE: number = 502;
    static readonly CC_IGNORES_SIZE: number = 503;
    //// reportabuse (600-613)
    static readonly CC_REPORT_INPUT: number = 600;
    static readonly CC_REPORT_RULE1: number = 601;
    static readonly CC_REPORT_RULE2: number = 602;
    static readonly CC_REPORT_RULE3: number = 603;
    static readonly CC_REPORT_RULE4: number = 604;
    static readonly CC_REPORT_RULE5: number = 605;
    static readonly CC_REPORT_RULE6: number = 606;
    static readonly CC_REPORT_RULE7: number = 607;
    static readonly CC_REPORT_RULE8: number = 608;
    static readonly CC_REPORT_RULE9: number = 609;
    static readonly CC_REPORT_RULE10: number = 610;
    static readonly CC_REPORT_RULE11: number = 611;
    static readonly CC_REPORT_RULE12: number = 612;
    static readonly CC_MOD_MUTE: number = 613;
    //// welcome_screen/welcome_screen2 (650-655)?
    static readonly CC_LAST_LOGIN_INFO: number = 650; // has recovery questions
    static readonly CC_UNREAD_MESSAGES: number = 651;
    static readonly CC_RECOVERY1: number = 652;
    static readonly CC_RECOVERY2: number = 653;
    static readonly CC_RECOVERY3: number = 654;
    static readonly CC_LAST_LOGIN_INFO2: number = 655; // has no recovery questions

    static unpack = (interfaces: Jagfile, media: Jagfile, fonts: PixFont[]): void => {
        this.imageCache = new LruCache(50000);
        this.modelCache = new LruCache(50000);

        const dat: Packet = new Packet(interfaces.read('data'));
        let layer: number = -1;

        dat.pos += 2; // const count = dat.g2;

        while (dat.pos < dat.length) {
            let id: number = dat.g2;
            if (id === 65535) {
                layer = dat.g2;
                id = dat.g2;
            }

            const com: ComType = (this.instances[id] = new ComType());
            com.id = id;
            com.layer = layer;
            com.type = dat.g1;
            com.buttonType = dat.g1;
            com.clientCode = dat.g2;
            com.width = dat.g2;
            com.height = dat.g2;

            com.overLayer = dat.g1;
            if (com.overLayer === 0) {
                com.overLayer = -1;
            } else {
                com.overLayer = ((com.overLayer - 1) << 8) + dat.g1;
            }

            const comparatorCount: number = dat.g1;
            if (comparatorCount > 0) {
                com.scriptComparator = new Uint8Array(comparatorCount);
                com.scriptOperand = new Uint16Array(comparatorCount);

                for (let i: number = 0; i < comparatorCount; i++) {
                    com.scriptComparator[i] = dat.g1;
                    com.scriptOperand[i] = dat.g2;
                }
            }

            const scriptCount: number = dat.g1;
            if (scriptCount > 0) {
                com.scripts = new TypedArray1d(scriptCount, null);

                for (let i: number = 0; i < scriptCount; i++) {
                    const opcodeCount: number = dat.g2;

                    const scripts: Uint16Array = new Uint16Array(opcodeCount);
                    com.scripts[i] = scripts;
                    for (let j: number = 0; j < opcodeCount; j++) {
                        scripts[j] = dat.g2;
                    }
                }
            }

            if (com.type === ComType.TYPE_LAYER) {
                com.scroll = dat.g2;
                com.hide = dat.g1 === 1;

                const childCount: number = dat.g1;
                com.childId = new Array(childCount);
                com.childX = new Array(childCount);
                com.childY = new Array(childCount);

                for (let i: number = 0; i < childCount; i++) {
                    com.childId[i] = dat.g2;
                    com.childX[i] = dat.g2b;
                    com.childY[i] = dat.g2b;
                }
            }

            if (com.type === ComType.TYPE_UNUSED) {
                dat.pos += 3;
            }

            if (com.type === ComType.TYPE_INV) {
                com.invSlotObjId = new Int32Array(com.width * com.height);
                com.invSlotObjCount = new Int32Array(com.width * com.height);

                com.draggable = dat.g1 === 1;
                com.interactable = dat.g1 === 1;
                com.usable = dat.g1 === 1;
                com.marginX = dat.g1;
                com.marginY = dat.g1;

                com.invSlotOffsetX = new Int16Array(20);
                com.invSlotOffsetY = new Int16Array(20);
                com.invSlotSprite = new TypedArray1d(20, null);

                for (let i: number = 0; i < 20; i++) {
                    if (dat.g1 === 1) {
                        com.invSlotOffsetX[i] = dat.g2b;
                        com.invSlotOffsetY[i] = dat.g2b;
                        const sprite: string = dat.gjstr;
                        if (sprite.length > 0) {
                            const spriteIndex: number = sprite.lastIndexOf(',');
                            // com.inventorySlotImage[i] = {name: sprite.substring(0, spriteIndex), sprite: parseInt(sprite.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, sprite.substring(0, spriteIndex), parseInt(sprite.substring(spriteIndex + 1), 10));
                            com.invSlotSprite[i] = this.getImage(media, sprite.substring(0, spriteIndex), parseInt(sprite.substring(spriteIndex + 1), 10));
                        }
                    }
                }

                com.iops = new TypedArray1d(5, null);
                for (let i: number = 0; i < 5; i++) {
                    const iop: string = dat.gjstr;
                    com.iops[i] = iop;

                    if (iop.length === 0) {
                        com.iops[i] = null;
                    }
                }
            }

            if (com.type === ComType.TYPE_RECT) {
                com.fill = dat.g1 === 1;
            }

            if (com.type === ComType.TYPE_TEXT || com.type === ComType.TYPE_UNUSED) {
                com.center = dat.g1 === 1;
                const fontId: number = dat.g1;
                if (fonts) {
                    com.font = fonts[fontId];
                }
                com.shadowed = dat.g1 === 1;
            }

            if (com.type === ComType.TYPE_TEXT) {
                com.text = dat.gjstr;
                com.activeText = dat.gjstr;
            }

            if (com.type === ComType.TYPE_UNUSED || com.type === ComType.TYPE_RECT || com.type === ComType.TYPE_TEXT) {
                com.colour = dat.g4;
            }

            if (com.type === ComType.TYPE_RECT || com.type === ComType.TYPE_TEXT) {
                com.activeColour = dat.g4;
                com.overColour = dat.g4;
            }

            if (com.type === ComType.TYPE_GRAPHIC) {
                const graphic: string = dat.gjstr;
                if (graphic.length > 0) {
                    const index: number = graphic.lastIndexOf(',');
                    // com.image = {name: image.substring(0, spriteIndex), sprite: parseInt(image.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, image.substring(0, spriteIndex), parseInt(image.substring(spriteIndex + 1), 10));
                    com.graphic = this.getImage(media, graphic.substring(0, index), parseInt(graphic.substring(index + 1), 10));
                }
                const activeGraphic: string = dat.gjstr;
                if (activeGraphic.length > 0) {
                    const index: number = activeGraphic.lastIndexOf(',');
                    // com.activeImage = {name: activeImage.substring(0, spriteIndex), sprite: parseInt(activeImage.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, activeImage.substring(0, spriteIndex), parseInt(activeImage.substring(spriteIndex + 1), 10));
                    com.activeGraphic = this.getImage(media, activeGraphic.substring(0, index), parseInt(activeGraphic.substring(index + 1), 10));
                }
            }

            if (com.type === ComType.TYPE_MODEL) {
                const model: number = dat.g1;
                if (model !== 0) {
                    com.model = this.getModel(((model - 1) << 8) + dat.g1);
                }

                const activeModel: number = dat.g1;
                if (activeModel !== 0) {
                    com.activeModel = this.getModel(((activeModel - 1) << 8) + dat.g1);
                }

                com.anim = dat.g1;
                if (com.anim === 0) {
                    com.anim = -1;
                } else {
                    com.anim = ((com.anim - 1) << 8) + dat.g1;
                }

                com.activeAnim = dat.g1;
                if (com.activeAnim === 0) {
                    com.activeAnim = -1;
                } else {
                    com.activeAnim = ((com.activeAnim - 1) << 8) + dat.g1;
                }

                com.zoom = dat.g2;
                com.xan = dat.g2;
                com.yan = dat.g2;
            }

            if (com.type === ComType.TYPE_INV_TEXT) {
                com.invSlotObjId = new Int32Array(com.width * com.height);
                com.invSlotObjCount = new Int32Array(com.width * com.height);

                com.center = dat.g1 === 1;
                const fontId: number = dat.g1;
                if (fonts) {
                    com.font = fonts[fontId];
                }

                com.shadowed = dat.g1 === 1;
                com.colour = dat.g4;
                com.marginX = dat.g2b;
                com.marginY = dat.g2b;
                com.interactable = dat.g1 === 1;

                com.iops = new TypedArray1d(5, null);
                for (let i: number = 0; i < 5; i++) {
                    const iop: string = dat.gjstr;
                    com.iops[i] = iop;

                    if (iop.length === 0) {
                        com.iops[i] = null;
                    }
                }
            }

            if (com.buttonType === ComType.BUTTON_TARGET || com.type === ComType.TYPE_INV) {
                com.actionVerb = dat.gjstr;
                com.action = dat.gjstr;
                com.actionTarget = dat.g2;
            }

            if (com.buttonType === ComType.BUTTON_OK || com.buttonType === ComType.BUTTON_TOGGLE || com.buttonType === ComType.BUTTON_SELECT || com.buttonType === ComType.BUTTON_CONTINUE) {
                com.option = dat.gjstr;

                if (com.option.length === 0) {
                    if (com.buttonType === ComType.BUTTON_OK) {
                        com.option = 'Ok';
                    } else if (com.buttonType === ComType.BUTTON_TOGGLE) {
                        com.option = 'Select';
                    } else if (com.buttonType === ComType.BUTTON_SELECT) {
                        com.option = 'Select';
                    } else if (com.buttonType === ComType.BUTTON_CONTINUE) {
                        com.option = 'Continue';
                    }
                }
            }
        }

        this.imageCache = null;
        this.modelCache = null;
    };

    private static getImage = (media: Jagfile, sprite: string, spriteId: number): Pix24 | null => {
        const uid: bigint = (JString.hashCode(sprite) << 8n) | BigInt(spriteId);
        if (this.imageCache) {
            const image: Pix24 | null = this.imageCache.get(uid) as Pix24 | null;
            if (image) {
                return image;
            }
        }

        let image: Pix24;
        try {
            image = Pix24.fromArchive(media, sprite, spriteId);
            this.imageCache?.put(uid, image);
        } catch (e) {
            return null;
        }
        return image;
    };

    private static getModel = (id: number): Model => {
        if (this.modelCache) {
            const model: Model | null = this.modelCache.get(BigInt(id)) as Model | null;
            if (model) {
                return model;
            }
        }
        const model: Model = Model.model(id);
        this.modelCache?.put(BigInt(id), model);
        return model;
    };

    /* Client codes:
     * ---- friends
     * 1-200: friends list
     * 201: add friend
     * 202: delete friend
     * 203: friends list scrollbar size
     * ---- logout
     * 205: logout
     * ---- player_design
     * 300: change head (left)
     * 301: change head (right)
     * 302: change jaw (left)
     * 303: change jaw (right)
     * 304: change torso (left)
     * 305: change torso (right)
     * 306: change arms (left)
     * 307: change arms (right)
     * 308: change hands (left)
     * 309: change hands (right)
     * 310: change legs (left)
     * 311: change legs (right)
     * 312: change feet (left)
     * 313: change feet (right)
     * 314: recolour hair (left)
     * 315: recolour hair (right)
     * 316: recolour torso (left)
     * 317: recolour torso (right)
     * 318: recolour legs (left)
     * 319: recolour legs (right)
     * 320: recolour feet (left)
     * 321: recolour feet (right)
     * 322: recolour skin (left)
     * 323: recolour skin (right)
     * 324: switch to male
     * 325: switch to female
     * 326: accept design
     * 327: design preview
     * ---- ignore
     * 401-500: ignore list
     * 501: add ignore
     * 502: delete ignore
     * 503: ignore list scrollbar size
     * ---- reportabuse
     * 601: rule 1
     * 602: rule 2
     * 603: rule 3
     * 604: rule 4
     * 605: rule 5
     * 606: rule 6
     * 607: rule 7
     * 608: rule 8
     * 609: rule 9
     * 610: rule 10
     * 611: rule 11
     * 612: rule 12
     * 613: moderator mute
     * ---- welcome_screen / welcome_screen2
     * 650: last login info (has recovery questions set)
     * 651: unread messages
     * 655: last login info (no recovery questions set)
     */

    // ----

    id: number = -1;
    layer: number = -1;
    type: number = -1;
    buttonType: number = -1;
    clientCode: number = 0;
    width: number = 0;
    height: number = 0;
    overLayer: number = -1;
    scriptComparator: Uint8Array | null = null;
    scriptOperand: Uint16Array | null = null;
    scripts: (Uint16Array | null)[] | null = null;
    scroll: number = 0;
    hide: boolean = false;
    draggable: boolean = false;
    interactable: boolean = false;
    usable: boolean = false;
    marginX: number = 0;
    marginY: number = 0;
    invSlotOffsetX: Int16Array | null = null;
    invSlotOffsetY: Int16Array | null = null;
    invSlotSprite: (Pix24 | null)[] | null = null;
    iops: (string | null)[] | null = null;
    fill: boolean = false;
    center: boolean = false;
    font: PixFont | null = null;
    shadowed: boolean = false;
    text: string | null = null;
    activeText: string | null = null;
    colour: number = 0;
    activeColour: number = 0;
    overColour: number = 0;
    graphic: Pix24 | null = null;
    activeGraphic: Pix24 | null = null;
    model: Model | null = null;
    activeModel: Model | null = null;
    anim: number = -1;
    activeAnim: number = -1;
    zoom: number = 0;
    xan: number = 0;
    yan: number = 0;
    actionVerb: string | null = null;
    action: string | null = null;
    actionTarget: number = -1;
    option: string | null = null;
    childId: number[] | null = null;
    childX: number[] | null = null;
    childY: number[] | null = null;

    // other
    x: number = 0;
    y: number = 0;
    scrollPosition: number = 0;
    invSlotObjId: Int32Array | null = null;
    invSlotObjCount: Int32Array | null = null;
    seqFrame: number = 0;
    seqCycle: number = 0;

    getModel(primaryFrame: number, secondaryFrame: number, active: boolean): Model | null {
        let model: Model | null = this.model;
        if (active) {
            model = this.activeModel;
        }

        if (!model) {
            return null;
        }

        if (primaryFrame === -1 && secondaryFrame === -1 && !model.faceColor) {
            return model;
        }

        const tmp: Model = Model.modelShareColored(model, true, true, false);
        if (primaryFrame !== -1 || secondaryFrame !== -1) {
            tmp.createLabelReferences();
        }

        if (primaryFrame !== -1) {
            tmp.applyTransform(primaryFrame);
        }

        if (secondaryFrame !== -1) {
            tmp.applyTransform(secondaryFrame);
        }

        tmp.calculateNormals(64, 768, -50, -10, -50, true);
        return tmp;
    }

    getAbsoluteX(): number {
        if (this.layer === this.id) {
            return this.x;
        }

        let parent: ComType = ComType.instances[this.layer];
        if (!parent.childId || !parent.childX || !parent.childY) {
            return this.x;
        }

        let childIndex: number = parent.childId.indexOf(this.id);
        if (childIndex === -1) {
            return this.x;
        }

        let x: number = parent.childX[childIndex];
        while (parent.layer !== parent.id) {
            const grandParent: ComType = ComType.instances[parent.layer];
            if (grandParent.childId && grandParent.childX && grandParent.childY) {
                childIndex = grandParent.childId.indexOf(parent.id);
                if (childIndex !== -1) {
                    x += grandParent.childX[childIndex];
                }
            }
            parent = grandParent;
        }

        return x;
    }

    getAbsoluteY(): number {
        if (this.layer === this.id) {
            return this.y;
        }

        let parent: ComType = ComType.instances[this.layer];
        if (!parent.childId || !parent.childX || !parent.childY) {
            return this.y;
        }

        let childIndex: number = parent.childId.indexOf(this.id);
        if (childIndex === -1) {
            return this.y;
        }

        let y: number = parent.childY[childIndex];
        while (parent.layer !== parent.id) {
            const grandParent: ComType = ComType.instances[parent.layer];
            if (grandParent.childId && grandParent.childX && grandParent.childY) {
                childIndex = grandParent.childId.indexOf(parent.id);
                if (childIndex !== -1) {
                    y += grandParent.childY[childIndex];
                }
            }
            parent = grandParent;
        }

        return y;
    }

    outline(color: number): void {
        const x: number = this.getAbsoluteX();
        const y: number = this.getAbsoluteY();
        Draw2D.drawRect(x, y, this.width, this.height, color);
    }

    move(x: number, y: number): void {
        if (this.layer === this.id) {
            return;
        }

        this.x = 0;
        this.y = 0;

        const parent: ComType = ComType.instances[this.layer];

        if (parent.childId && parent.childX && parent.childY) {
            const childIndex: number = parent.childId.indexOf(this.id);

            if (childIndex !== -1) {
                parent.childX[childIndex] = x;
                parent.childY[childIndex] = y;
            }
        }
    }

    delete(): void {
        if (this.layer === this.id) {
            return;
        }

        const parent: ComType = ComType.instances[this.layer];

        if (parent.childId && parent.childX && parent.childY) {
            const childIndex: number = parent.childId.indexOf(this.id);

            if (childIndex !== -1) {
                parent.childId.splice(childIndex, 1);
                parent.childX.splice(childIndex, 1);
                parent.childY.splice(childIndex, 1);
            }
        }
    }
}
