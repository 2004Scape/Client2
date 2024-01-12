import Packet from '../src/js/jagex2/io/Packet';

describe('Packet', (): void => {
    describe('test 1', (): void => {
        test('unsigned', (): void => {
            const expected: Packet = Packet.alloc(1);
            expected.p1(255);
            const result: Packet = new Packet(expected.data);
            expect(result.g1).toBe(255);
        });

        test('signed a', (): void => {
            const expected: Packet = Packet.alloc(1);
            expected.p1(69);
            const result: Packet = new Packet(expected.data);
            expect(result.g1b).toBe(69);
        });

        test('signed b', (): void => {
            const expected: Packet = Packet.alloc(1);
            expected.p1(169);
            const result: Packet = new Packet(expected.data);
            expect(result.g1b).toBe(-87);
        });

        test('signed c', (): void => {
            const expected: Packet = Packet.alloc(1);
            expected.p1(-169);
            const result: Packet = new Packet(expected.data);
            expect(result.g1b).toBe(87);
        });

        test('signed d', (): void => {
            const expected: Packet = Packet.alloc(1);
            expected.p1(-69);
            const result: Packet = new Packet(expected.data);
            expect(result.g1b).toBe(-69);
        });
    });

    describe('test 2', (): void => {
        test('unsigned', (): void => {
            const expected: Packet = Packet.alloc(2);
            expected.p2(65535);
            const result: Packet = new Packet(expected.data);
            expect(result.g2).toBe(65535);
        });

        test('signed a', (): void => {
            const expected: Packet = Packet.alloc(2);
            expected.p2(32767);
            const result: Packet = new Packet(expected.data);
            expect(result.g2b).toBe(32767);
        });

        test('signed b', (): void => {
            const expected: Packet = Packet.alloc(2);
            expected.p2(32768);
            const result: Packet = new Packet(expected.data);
            expect(result.g2b).toBe(-32768);
        });
    });

    describe('test 3', (): void => {
        test('unsigned', (): void => {
            const expected: Packet = Packet.alloc(3);
            expected.p3(16777215);
            const result: Packet = new Packet(expected.data);
            expect(result.g3).toBe(16777215);
        });
    });

    describe('test 4', (): void => {
        test('unsigned', (): void => {
            const expected: Packet = Packet.alloc(4);
            expected.p4(2147483647);
            const result: Packet = new Packet(expected.data);
            expect(result.g4).toBe(2147483647);
        });

        test('unsigned a', (): void => {
            const expected: Packet = Packet.alloc(4);
            expected.p4(-2147483647);
            const result: Packet = new Packet(expected.data);
            expect(result.g4).toBe(-2147483647);
        });
    });

    describe('test 8', (): void => {
        test('unsigned', (): void => {
            const expected: Packet = Packet.alloc(4);
            expected.p8(BigInt(9007199254740991));
            const result: Packet = new Packet(expected.data);
            expect(result.g8).toBe(BigInt(9007199254740991));
        });
    });

    describe('test string', (): void => {
        test('jstr', (): void => {
            const string: string = 'Hello World!';
            const expected: Packet = Packet.alloc(string.length + 1);
            expected.pjstr(string);
            const result: Packet = new Packet(expected.data);
            expect(result.gjstr).toBe(string);
        });
    });
});
