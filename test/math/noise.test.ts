import World from '../../src/js/jagex2/dash3d/World';

describe('noise', (): void => {
    it('result 3222 3222', (): void => {
        expect(World.noise(3222, 3222)).toBe(172);
    });

    it('result 2147483647 2147483647', (): void => {
        expect(World.noise(2147483647, 2147483647)).toBe(202);
    });

    it('result 135 137', (): void => {
        expect(World.noise(135, 137)).toBe(102);
    });
});
