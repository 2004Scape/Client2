import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import PixFont from '../graphics/PixFont';
import Model from '../graphics/Model';

export default class ComType {
    static instances: ComType[] = [];

    static TYPE_LAYER: number = 0;
    static TYPE_UNUSED: number = 1;
    static TYPE_INVENTORY: number = 2;
    static TYPE_RECT: number = 3;
    static TYPE_TEXT: number = 4;
    static TYPE_SPRITE: number = 5;
    static TYPE_MODEL: number = 6;
    static TYPE_INVENTORY_TEXT: number = 7;

    static unpack = (interfaces: Jagfile, fonts: PixFont[]): void => {
        const dat: Packet = new Packet(interfaces.read('data'));
        let parentId: number = -1;
        dat.pos += 2; // const count = dat.g2;
        while (dat.pos < dat.data.length) {
            let id: number = dat.g2;
            if (id === 65535) {
                parentId = dat.g2;
                id = dat.g2;
            }

            const com: ComType = (this.instances[id] = new ComType());
            com.id = id;
            com.parentId = parentId;
            com.type = dat.g1;
            com.optionType = dat.g1;
            com.contentType = dat.g2;
            com.width = dat.g2;
            com.height = dat.g2;

            com.delegateHover = dat.g1;
            if (com.delegateHover == 0) {
                com.delegateHover = -1;
            } else {
                com.delegateHover = ((com.delegateHover - 1) << 8) + dat.g1;
            }

            const comparatorCount: number = dat.g1;
            if (comparatorCount > 0) {
                com.scriptComparator = [];
                com.scriptOperand = [];

                for (let i: number = 0; i < comparatorCount; i++) {
                    com.scriptComparator[i] = dat.g1;
                    com.scriptOperand[i] = dat.g2;
                }
            }

            const scriptCount: number = dat.g1;
            if (scriptCount > 0) {
                com.scripts = [];

                for (let i: number = 0; i < scriptCount; i++) {
                    const opcodeCount: number = dat.g2;

                    com.scripts[i] = [];
                    for (let j: number = 0; j < opcodeCount; j++) {
                        com.scripts[i][j] = dat.g2;
                    }
                }
            }

            switch (com.type) {
                case ComType.TYPE_LAYER: {
                    com.scrollableHeight = dat.g2;
                    com.hide = dat.g1 === 1;

                    const childCount: number = dat.g1;
                    com.childId = [];
                    com.childX = [];
                    com.childY = [];

                    for (let i: number = 0; i < childCount; i++) {
                        com.childId[i] = dat.g2;
                        com.childX[i] = dat.g2b;
                        com.childY[i] = dat.g2b;
                    }
                    break;
                }
                case ComType.TYPE_UNUSED:
                    dat.pos += 3;
                    break;
                case ComType.TYPE_INVENTORY: {
                    com.inventorySlotObjId = [];
                    com.inventorySlotObjCount = [];

                    com.inventoryDraggable = dat.g1 === 1;
                    com.inventoryInteractable = dat.g1 === 1;
                    com.inventoryUsable = dat.g1 === 1;
                    com.inventoryMarginX = dat.g1;
                    com.inventoryMarginY = dat.g1;

                    com.inventorySlotOffsetX = [];
                    com.inventorySlotOffsetY = [];
                    com.inventorySlotImage = [];

                    for (let i: number = 0; i < 20; i++) {
                        if (dat.g1 === 1) {
                            com.inventorySlotOffsetX[i] = dat.g2b;
                            com.inventorySlotOffsetY[i] = dat.g2b;
                            const sprite: string = dat.gjstr;
                            if (sprite.length > 0) {
                                const spriteIndex: number = sprite.lastIndexOf(',');
                                com.inventorySlotImage[i] = {name: sprite.substring(0, spriteIndex), sprite: parseInt(sprite.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, sprite.substring(0, spriteIndex), parseInt(sprite.substring(spriteIndex + 1), 10));
                            }
                        }
                    }

                    for (let i: number = 0; i < 5; i++) {
                        com.inventoryOptions[i] = dat.gjstr;

                        if (com.inventoryOptions[i]?.length === 0) {
                            com.inventoryOptions[i] = null;
                        }
                    }

                    com.spellAction = dat.gjstr;
                    com.spellName = dat.gjstr;
                    com.spellFlags = dat.g2;
                    break;
                }
                case ComType.TYPE_RECT:
                    com.fill = dat.g1 === 1;
                    com.color = dat.g4;
                    com.activeColor = dat.g4;
                    com.hoverColor = dat.g4;
                    break;
                case ComType.TYPE_TEXT:
                    com.center = dat.g1 === 1;
                    com.font = fonts[dat.g1];
                    com.shadow = dat.g1 === 1;
                    com.text = dat.gjstr;
                    com.activeText = dat.gjstr;
                    com.color = dat.g4;
                    com.activeColor = dat.g4;
                    com.hoverColor = dat.g4;
                    break;
                case ComType.TYPE_SPRITE: {
                    const image: string = dat.gjstr;
                    if (image.length > 0) {
                        const spriteIndex: number = image.lastIndexOf(',');
                        com.image = {name: image.substring(0, spriteIndex), sprite: parseInt(image.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, image.substring(0, spriteIndex), parseInt(image.substring(spriteIndex + 1), 10));
                    }
                    const activeImage: string = dat.gjstr;
                    if (activeImage.length > 0) {
                        const spriteIndex: number = activeImage.lastIndexOf(',');
                        com.activeImage = {name: activeImage.substring(0, spriteIndex), sprite: parseInt(activeImage.substring(spriteIndex + 1), 10)}; // Pix24.fromArchive(media, activeImage.substring(0, spriteIndex), parseInt(activeImage.substring(spriteIndex + 1), 10));
                    }
                    break;
                }
                case ComType.TYPE_MODEL: {
                    const model: number = dat.g1;
                    if (model !== 0) {
                        com.model = this.getModel(((model - 1) << 8) + dat.g1);
                    }

                    const activeModel: number = dat.g1;
                    if (activeModel !== 0) {
                        com.activeModel = this.getModel(((activeModel - 1) << 8) + dat.g1);
                    }

                    com.seqId = dat.g1;
                    if (com.seqId == 0) {
                        com.seqId = -1;
                    } else {
                        com.seqId = ((com.seqId - 1) << 8) + dat.g1;
                    }

                    com.activeSeqId = dat.g1;
                    if (com.activeSeqId == 0) {
                        com.activeSeqId = -1;
                    } else {
                        com.activeSeqId = ((com.activeSeqId - 1) << 8) + dat.g1;
                    }

                    com.modelZoom = dat.g2;
                    com.modelPitch = dat.g2;
                    com.modelYaw = dat.g2;
                    break;
                }
                case ComType.TYPE_INVENTORY_TEXT: {
                    com.inventorySlotObjId = [];
                    com.inventorySlotObjCount = [];

                    com.center = dat.g1 === 1;
                    com.font = fonts[dat.g1];
                    com.shadow = dat.g1 === 1;
                    com.color = dat.g4;
                    com.inventoryMarginX = dat.g2b;
                    com.inventoryMarginY = dat.g2b;
                    com.inventoryInteractable = dat.g1 === 1;
                    com.inventoryOptions = new Array(5).fill(null);
                    for (let i: number = 0; i < 5; i++) {
                        com.inventoryOptions[i] = dat.gjstr;
                    }
                    break;
                }
            }

            if (com.optionType == 2) {
                com.spellAction = dat.gjstr;
                com.spellName = dat.gjstr;
                com.spellFlags = dat.g2;
            }

            if (com.optionType == 1 || com.optionType == 4 || com.optionType == 5 || com.optionType == 6) {
                com.option = dat.gjstr;

                if (com.option.length == 0) {
                    if (com.optionType == 1) {
                        com.option = 'Ok';
                    } else if (com.optionType == 4) {
                        com.option = 'Select';
                    } else if (com.optionType == 5) {
                        com.option = 'Select';
                    } else if (com.optionType == 6) {
                        com.option = 'Continue';
                    }
                }
            }
        }
    };

    static getModel = (id: number): Model => {
        // TODO
        return new Model(id);
    };

    // ----
    id: number = -1;
    parentId: number = -1;
    type: number = -1;
    optionType: number = -1;
    contentType: number = 0;
    width: number = 0;
    height: number = 0;
    delegateHover: number = -1;
    scriptComparator: number[] | null = null;
    scriptOperand: number[] | null = null;
    scripts: Array<number[]> | null = null;
    scrollableHeight: number = 0;
    hide = false;
    inventoryDraggable = false;
    inventoryInteractable = false;
    inventoryUsable = false;
    inventoryMarginX: number = 0;
    inventoryMarginY: number = 0;
    inventorySlotOffsetX: number[] | null = null;
    inventorySlotOffsetY: number[] | null = null;
    inventorySlotImage: {name: string; sprite: number}[] | null = null;
    // inventoryOptions: (string | null)[] = [];
    inventoryOptions: Array<string | null> = [];
    fill: boolean = false;
    center: boolean = false;
    font: PixFont | null = null;
    shadow: boolean = false;
    text: string | null = null;
    activeText: string | null = null;
    color: number = 0;
    activeColor: number = 0;
    hoverColor: number = 0;
    image: {name: string; sprite: number} | null = null;
    activeImage: {name: string; sprite: number} | null = null;
    model: Model | null = null;
    activeModel: Model | null = null;
    seqId: number = -1;
    activeSeqId: number = -1;
    modelZoom: number = 0;
    modelPitch: number = 0;
    modelYaw: number = 0;
    spellAction: string | null = null;
    spellName: string | null = null;
    spellFlags: number = -1;
    option: string | null = null;
    childId: number[] | null = null;
    childX: number[] | null = null;
    childY: number[] | null = null;

    // other
    x: number = 0;
    y: number = 0;
    scrollPosition: number = 0;
    inventorySlotObjId: number[] | null = null;
    inventorySlotObjCount: number[] | null = null;
    seqFrame: number = 0;
    seqCycle: number = 0;

    getModel = (primaryFrame: number, secondaryFrame: number, active: boolean): Model | null => {
        let m: Model | null = this.model;
        if (active) {
            m = this.activeModel;
        }

        if (m == null) {
            return null;
        }

        if (primaryFrame == -1 && secondaryFrame == -1 && m.faceColor == null) {
            return m;
        }

        // const tmp = new Model(m, true, true, false);
        // if (primaryFrame != -1 || secondaryFrame != -1) {
        //     tmp.createLabelReferences();
        // }
        //
        // if (primaryFrame != -1) {
        //     tmp.applyTransform(primaryFrame);
        // }
        //
        // if (secondaryFrame != -1) {
        //     tmp.applyTransform(secondaryFrame);
        // }
        //
        // tmp.calculateNormals(64, 768, -50, -10, -50, true);
        // return tmp;
        return null; // TODO
    };
}
