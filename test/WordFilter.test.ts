import WordPack from '../src/js/jagex2/wordenc/WordPack';
import Packet from '../src/js/jagex2/io/Packet';
import WordFilter from '../src/js/jagex2/wordenc/WordFilter';
import Jagfile from '../src/js/jagex2/io/Jagfile';
import * as fs from 'fs';
import Bzip from '../src/js/vendor/bzip';

beforeAll(async (): Promise<void> => {
    await Bzip.load(fs.readFileSync('./test/resources/bz2.wasm'));
    const wordenc: Jagfile = new Jagfile(Int8Array.from(fs.readFileSync('./test/resources/wordenc')));
    WordFilter.unpack(wordenc);
});

describe('WordFilter', (): void => {
    describe('unpack and filter', (): void => {
        it('result after test', (): void => {
            const packet: Packet = new Packet(Uint8Array.from([33, 130]));
            expect(WordFilter.filter(WordPack.unpack(packet, 2))).toBe('Test');
        });
    });

    describe('filter', (): void => {
        it('result after shit', (): void => {
            expect(WordFilter.filter('shit')).toBe('****');
        });

        it('result after sheet', (): void => {
            expect(WordFilter.filter('sheet')).toBe('sheet');
        });

        it('result after fuck', (): void => {
            expect(WordFilter.filter('fuck')).toBe('****');
        });

        it('result after runescape dot com', (): void => {
            expect(WordFilter.filter('runescape dot com')).toBe('*****************');
        });

        it('result after gold sites', (): void => {
            expect(WordFilter.filter('----vv vv vv rswalmart  c - 0 - nn sell cheap gold 1000k "="2.1(.u.s\'d)')).toBe('----******** rswalmart c - 0 - nn sell cheap gold 1000k "="2.1(.*****)');
            expect(WordFilter.filter('Web:---4 r s_gold_c"..0..""\'|\\/|""cheap rs gold -20 \'m\'=18.3\'$')).toBe('Web:---4 r s_gold_********************* rs gold -20 \'m\'=18.3\'$');
            expect(WordFilter.filter('Cheap sell gold>google open:___\'fzf\'__c"..0..\'|\\/|"">20m=17.23$')).toBe('Cheap sell gold>google open:___\'fzf\'__******************=17.23$');
            expect(WordFilter.filter('..:::.4 r s g 0 l d..:::c:::0:::/y\\>>>20""m = 18.3----usd.')).toBe('..:::.4 r s g 0 l ****************\\>>>***** = 18.3----usd.');
        });
    });
});
