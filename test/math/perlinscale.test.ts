import World from '../../src/js/jagex2/dash3d/World';

describe('perlinscale', (): void => {
    it('result 3222 3222 3', (): void => {
        expect(World.perlinScale(3222, 3222, 3)).toBe(104);
    });

    it('result 2147483647 2147483647 5454', (): void => {
        expect(World.perlinScale(2147483647, 2147483647, 5454)).toBe(159);
    });

    it('result 135 137 69', (): void => {
        expect(World.perlinScale(135, 137, 69)).toBe(119);
    });
});
