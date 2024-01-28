import World from '../../src/js/jagex2/dash3d/World';

describe('smoothNoise', (): void => {
    it('result 3222 3222', (): void => {
        expect(World.smoothNoise(3222, 3222)).toBe(172);
    });

    it('result 2147483647 2147483647', (): void => {
        expect(World.smoothNoise(2147483647, 2147483647)).toBe(148);
    });

    it('result 135 137', (): void => {
        expect(World.smoothNoise(135, 137)).toBe(147);
    });
});
