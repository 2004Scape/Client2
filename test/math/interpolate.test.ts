import World from '../../src/js/jagex2/dash3d/World';

describe('interpolate', (): void => {
    it('result 3222 3222, 7, 6', (): void => {
        expect(World.interpolate(3222, 3222, 7, 6)).toBe(3221);
    });

    it('result 2147483647 2147483647, 2147483647, 69', (): void => {
        expect(World.interpolate(2147483647, 2147483647, 7, 6)).toBe(65534);
    });

    it('result 135 137, 5453, 5454', (): void => {
        expect(World.interpolate(135, 137, 5453, 5454)).toBe(136);
    });
});
