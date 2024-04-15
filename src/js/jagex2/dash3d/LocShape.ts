import LocLayer from './LocLayer';

export default class LocShape {
    static readonly WALL_STRAIGHT: LocShape = new LocShape(0, LocLayer.WALL);
    static readonly WALL_DIAGONAL_CORNER: LocShape = new LocShape(1, LocLayer.WALL);
    static readonly WALL_L: LocShape = new LocShape(2, LocLayer.WALL);
    static readonly WALL_SQUARE_CORNER: LocShape = new LocShape(3, LocLayer.WALL);
    static readonly WALLDECOR_STRAIGHT_NOOFFSET: LocShape = new LocShape(4, LocLayer.WALL_DECOR);
    static readonly WALLDECOR_STRAIGHT_OFFSET: LocShape = new LocShape(5, LocLayer.WALL_DECOR);
    static readonly WALLDECOR_DIAGONAL_OFFSET: LocShape = new LocShape(6, LocLayer.WALL_DECOR);
    static readonly WALLDECOR_DIAGONAL_NOOFFSET: LocShape = new LocShape(7, LocLayer.WALL_DECOR);
    static readonly WALLDECOR_DIAGONAL_BOTH: LocShape = new LocShape(8, LocLayer.WALL_DECOR);
    static readonly WALL_DIAGONAL: LocShape = new LocShape(9, LocLayer.GROUND);
    static readonly CENTREPIECE_STRAIGHT: LocShape = new LocShape(10, LocLayer.GROUND);
    static readonly CENTREPIECE_DIAGONAL: LocShape = new LocShape(11, LocLayer.GROUND);
    static readonly ROOF_STRAIGHT: LocShape = new LocShape(12, LocLayer.GROUND);
    static readonly ROOF_DIAGONAL_WITH_ROOFEDGE: LocShape = new LocShape(13, LocLayer.GROUND);
    static readonly ROOF_DIAGONAL: LocShape = new LocShape(14, LocLayer.GROUND);
    static readonly ROOF_L_CONCAVE: LocShape = new LocShape(15, LocLayer.GROUND);
    static readonly ROOF_L_CONVEX: LocShape = new LocShape(16, LocLayer.GROUND);
    static readonly ROOF_FLAT: LocShape = new LocShape(17, LocLayer.GROUND);
    static readonly ROOFEDGE_STRAIGHT: LocShape = new LocShape(18, LocLayer.GROUND);
    static readonly ROOFEDGE_DIAGONAL_CORNER: LocShape = new LocShape(19, LocLayer.GROUND);
    static readonly ROOFEDGE_L: LocShape = new LocShape(20, LocLayer.GROUND);
    static readonly ROOFEDGE_SQUARE_CORNER: LocShape = new LocShape(21, LocLayer.GROUND);
    static readonly GROUND_DECOR: LocShape = new LocShape(22, LocLayer.GROUND_DECOR);

    static values(): LocShape[] {
        return [
            this.WALL_STRAIGHT,
            this.WALL_DIAGONAL_CORNER,
            this.ROOF_FLAT,
            this.ROOF_L_CONCAVE,
            this.WALL_L,
            this.ROOF_DIAGONAL,
            this.WALL_DIAGONAL,
            this.WALL_SQUARE_CORNER,
            this.GROUND_DECOR,
            this.ROOF_STRAIGHT,
            this.CENTREPIECE_DIAGONAL,
            this.WALLDECOR_DIAGONAL_OFFSET,
            this.ROOFEDGE_L,
            this.CENTREPIECE_STRAIGHT,
            this.WALLDECOR_STRAIGHT_OFFSET,
            this.ROOF_DIAGONAL_WITH_ROOFEDGE,
            this.WALLDECOR_DIAGONAL_NOOFFSET,
            this.WALLDECOR_STRAIGHT_NOOFFSET,
            this.ROOF_L_CONVEX,
            this.WALLDECOR_DIAGONAL_BOTH,
            this.ROOFEDGE_DIAGONAL_CORNER,
            this.ROOFEDGE_SQUARE_CORNER,
            this.ROOFEDGE_STRAIGHT
        ];
    }

    static of(id: number): LocShape {
        const values: LocShape[] = this.values();
        for (let index: number = 0; index < values.length; index++) {
            const shape: LocShape = values[index];
            if (shape.id === id) {
                return shape;
            }
        }
        throw Error('shape not found');
    }

    readonly id: number;
    readonly layer: number;

    private constructor(id: number, layer: number) {
        this.id = id;
        this.layer = layer;
    }
}
