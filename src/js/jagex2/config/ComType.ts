import Jagfile from '../io/Jagfile';
import Packet from '../io/Packet';
import Pix24 from '../graphics/Pix24';

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

    static unpack = (interfaces: Jagfile, media: Jagfile): void => {
        const dat: Packet = new Packet(interfaces.read('data'));
        let parentId = -1;
        dat.pos += 2; // const count = dat.g2;
        while (dat.pos < dat.data.length) {
            let id = dat.g2;
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

            const comparatorCount = dat.g1;
            if (comparatorCount > 0) {
                com.scriptComparator = new Uint8Array(comparatorCount).fill(0);
                com.scriptOperand = new Uint16Array(comparatorCount).fill(0);

                for (let i = 0; i < comparatorCount; i++) {
                    com.scriptComparator[i] = dat.g1;
                    com.scriptOperand[i] = dat.g2;
                }
            }

            const scriptCount = dat.g1;
            if (scriptCount > 0) {
                com.scripts = new Array(scriptCount).fill(null);

                for (let i = 0; i < scriptCount; i++) {
                    const opcodeCount = dat.g2;

                    com.scripts[i] = new Uint16Array(opcodeCount).fill(0);
                    for (let j = 0; j < opcodeCount; j++) {
                        com.scripts[i][j] = dat.g2;
                    }
                }
            }

            switch (com.type) {
                case ComType.TYPE_LAYER: {
                    com.scrollableHeight = dat.g2;
                    com.hide = dat.g1 === 1;

                    const childCount = dat.g1;
                    com.childId = new Uint16Array(childCount).fill(0);
                    com.childX = new Uint16Array(childCount).fill(0);
                    com.childY = new Uint16Array(childCount).fill(0);

                    for (let i = 0; i < childCount; i++) {
                        com.childId[i] = dat.g2;
                        com.childX[i] = dat.g2b;
                        com.childY[i] = dat.g2b;
                    }
                    break;
                }
                case ComType.TYPE_UNUSED:
                    dat.pos += 10;
                    break;
                case ComType.TYPE_INVENTORY: {
                    com.inventoryDraggable = dat.g1 === 1;
                    com.inventoryInteractable = dat.g1 === 1;
                    com.inventoryUsable = dat.g1 === 1;
                    com.inventoryMarginX = dat.g1;
                    com.inventoryMarginY = dat.g1;

                    com.inventorySlotOffsetX = new Uint16Array(20);
                    com.inventorySlotOffsetY = new Uint16Array(20);
                    com.inventorySlotImage = [];

                    for (let i = 0; i < 20; i++) {
                        if (dat.g1 === 1) {
                            com.inventorySlotOffsetX[i] = dat.g2b;
                            com.inventorySlotOffsetY[i] = dat.g2b;
                            // com.inventorySlotImage[i] = dat.gjstr;
                            const sprite = dat.gjstr;
                            if (sprite.length > 0) {
                                const spriteIndex = sprite.lastIndexOf(',');
                                com.inventorySlotImage[i] = Pix24.fromArchive(media, sprite, spriteIndex);
                            }
                        }
                    }

                    for (let i = 0; i < 5; i++) {
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
                    com.colour = dat.g4;
                    com.activeColour = dat.g4;
                    com.overColour = dat.g4;
                    break;
                case ComType.TYPE_TEXT:
                    com.center = dat.g1 === 1;
                    com.font = dat.g1;
                    com.shadowed = dat.g1 === 1;
                    com.text = dat.gjstr;
                    com.activeText = dat.gjstr;
                    com.colour = dat.g4;
                    com.activeColour = dat.g4;
                    com.overColour = dat.g4;
                    break;
                case ComType.TYPE_SPRITE:
                    com.graphic = dat.gjstr;
                    com.activeGraphic = dat.gjstr;
                    break;
                case ComType.TYPE_MODEL: {
                    com.model = dat.g1;
                    if (com.model != 0) {
                        com.model = ((com.model - 1) << 8) + dat.g1;
                    }

                    com.activeModel = dat.g1;
                    if (com.activeModel != 0) {
                        com.activeModel = ((com.activeModel - 1) << 8) + dat.g1;
                    }

                    com.anim = dat.g1;
                    if (com.anim == 0) {
                        com.anim = -1;
                    } else {
                        com.anim = ((com.anim - 1) << 8) + dat.g1;
                    }

                    com.activeAnim = dat.g1;
                    if (com.activeAnim == 0) {
                        com.activeAnim = -1;
                    } else {
                        com.activeAnim = ((com.activeAnim - 1) << 8) + dat.g1;
                    }

                    com.zoom = dat.g2;
                    com.xan = dat.g2;
                    com.yan = dat.g2;
                    break;
                }
                case ComType.TYPE_INVENTORY_TEXT: {
                    com.center = dat.g1 === 1;
                    com.font = dat.g1;
                    com.shadowed = dat.g1 === 1;
                    com.colour = dat.g4;
                    com.inventoryMarginX = dat.g2b;
                    com.inventoryMarginY = dat.g2b;
                    com.inventoryInteractable = dat.g1 === 1;
                    com.inventoryOptions = new Array(5).fill(null);
                    for (let i = 0; i < 5; i++) {
                        com.inventoryOptions[i] = dat.gjstr;
                    }
                    break;
                }
            }

            if (com.optionType == 2 || com.type == 2) {
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

    static get = (id: number): ComType => ComType.instances[id];

    // ----
    id: number = -1;
    parentId: number = -1;
    comName: string | null = null;
    type: number = -1;
    optionType: number = -1;
    contentType: number = 0;
    width: number = 0;
    height: number = 0;
    delegateHover: number = -1;
    scriptComparator: Uint8Array | null = null;
    scriptOperand: Uint16Array | null = null;
    scripts: Array<Uint16Array> | null = null;
    scrollableHeight: number = 0;
    hide = false;
    inventoryDraggable = false;
    inventoryInteractable = false;
    inventoryUsable = false;
    inventoryMarginX: number = 0;
    inventoryMarginY: number = 0;
    inventorySlotOffsetX: Uint16Array | null = null;
    inventorySlotOffsetY: Uint16Array | null = null;
    inventorySlotImage: Pix24[] | null = null;
    // inventoryOptions: (string | null)[] = [];
    inventoryOptions: Array<string | null> = [];
    fill = false;
    center = false;
    font: number = 0;
    shadowed = false;
    text: string | null = null;
    activeText: string | null = null;
    colour: number = 0;
    activeColour: number = 0;
    overColour: number = 0;
    graphic: string | null = null;
    activeGraphic: string | null = null;
    model: number = -1;
    activeModel: number = -1;
    anim: number = -1;
    activeAnim: number = -1;
    zoom: number = 0;
    xan: number = 0;
    yan: number = 0;
    spellAction: string | null = null;
    spellName: string | null = null;
    spellFlags: number = -1;
    option: string | null = null;
    childId: Uint16Array | null = null;
    childX: Uint16Array | null = null;
    childY: Uint16Array | null = null;

    // other
    scrollPosition: number = 0;
}
