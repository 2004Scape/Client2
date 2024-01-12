export default class TileUnderlay {
    southwestColor: number = 0;
    southeastColor: number = 0;
    northteastColor: number = 0;
    northwestColor: number = 0;
    textureId: number = 0;
    flat: boolean = true;
    rgb: number = 0;

    constructor(southwestColor: number, southeastColor: number, northeastColor: number, northwestColor: number, textureId: number, rgb: number, flat: boolean) {
        this.southwestColor = southwestColor;
        this.southeastColor = southeastColor;
        this.northteastColor = northeastColor;
        this.northwestColor = northeastColor;
        this.textureId = textureId;
        this.rgb = rgb;
        this.flat = flat;
    }
}
