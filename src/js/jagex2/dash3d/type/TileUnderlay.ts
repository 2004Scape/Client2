export default class TileUnderlay {
    // constructor
    readonly southwestColor: number;
    readonly southeastColor: number;
    readonly northeastColor: number;
    readonly northwestColor: number;
    readonly textureId: number;
    readonly color: number;
    readonly flat: boolean;

    constructor(southwestColor: number, southeastColor: number, northeastColor: number, northwestColor: number, textureId: number, color: number, flat: boolean) {
        this.southwestColor = southwestColor;
        this.southeastColor = southeastColor;
        this.northeastColor = northeastColor;
        this.northwestColor = northwestColor;
        this.textureId = textureId;
        this.color = color;
        this.flat = flat;
    }
}
