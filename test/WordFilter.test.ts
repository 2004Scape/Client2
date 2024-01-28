import WordPack from '../src/js/jagex2/wordenc/WordPack';
import Packet from '../src/js/jagex2/io/Packet';

describe('WordPack', (): void => {
    describe('unpack', (): void => {
        it('result after test', (): void => {
            const packet: Packet = new Packet(Uint8Array.from([33, 130]));
            expect(WordPack.unpack(packet, 2)).toBe('Test');
        });
    });

    describe('pack', (): void => {
        it('result after test', (): void => {
            const packet: Packet = new Packet(new Uint8Array(2));
            WordPack.pack(packet, 'Test');
            expect(packet.data).toStrictEqual(Uint8Array.from([33, 130]));
        });
    });
});
