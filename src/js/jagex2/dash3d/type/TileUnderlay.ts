export default class TileUnderlay {
    // constructor
    readonly southwestColor: number;
    readonly southeastColor: number;
    readonly northeastColor: number;
    readonly northwestColor: number;
    readonly textureId: number;
    readonly flat: boolean;
    readonly color: number;

    constructor(southwestColor: number, southeastColor: number, northeastColor: number, northwestColor: number, textureId: number, flat: boolean, color: number) {
        this.southwestColor = southwestColor;
        this.southeastColor = southeastColor;
        this.northeastColor = northeastColor;
        this.northwestColor = northwestColor;
        this.textureId = textureId;
        this.flat = flat;
        this.color = color;
    }
}
