import World from '../../src/js/jagex2/dash3d/World';

describe('perlin', (): void => {
    it('result 3222 3222', (): void => {
        expect(World.perlin(3222, 3222)).toBe(42);
    });

    it('result 135 137', (): void => {
        expect(World.perlin(135, 137)).toBe(34);
    });
});
