import FloType from '../../src/js/jagex2/config/FloType';

describe('hsl', (): void => {
    it('result 15 64 32', (): void => {
        expect(FloType.mulHSL(3344, 432)).toBe(3382);
    });

    it('result 32 44 15', (): void => {
        expect(FloType.mulHSL(8327, 44)).toBe(8322);
    });

    it('result 15 64 32', (): void => {
        expect(FloType.hsl24to16(15, 64, 32)).toBe(3344);
    });

    it('result 32 44 15', (): void => {
        expect(FloType.hsl24to16(32, 44, 15)).toBe(8327);
    });
});
