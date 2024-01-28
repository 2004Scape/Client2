import JString from '../src/js/jagex2/datastruct/JString';

describe('JString', (): void => {
    describe('toBase37', (): void => {
        it('result after jordan toBase37', (): void => {
            expect(JString.toBase37('jordan')).toBe(722469266n);
        });

        it('result after pazaz toBase37', (): void => {
            expect(JString.toBase37('pazaz')).toBe(30072886n);
        });

        it('result after notpazaz toBase37', (): void => {
            expect(JString.toBase37('notpazaz')).toBe(1368949128023n);
        });

        it('result after ABCDEFGHIJKL toBase37', (): void => {
            expect(JString.toBase37('ABCDEFGHIJKL')).toBe(187939216216112118n);
        });
    });

    describe('fromBase37', (): void => {
        it('result after jordan fromBase37', (): void => {
            expect(JString.fromBase37(722469266n)).toBe('jordan');
        });

        it('result after pazaz fromBase37', (): void => {
            expect(JString.fromBase37(30072886n)).toBe('pazaz');
        });

        it('result after notpazaz fromBase37', (): void => {
            expect(JString.fromBase37(1368949128023n)).toBe('notpazaz');
        });

        it('result after ABCDEFGHIJKL fromBase37', (): void => {
            expect(JString.fromBase37(187939216216112118n)).toBe('abcdefghijkl');
        });
    });

    describe('formatName', (): void => {
        it('result after jordan formatName and fromBase37', (): void => {
            expect(JString.formatName(JString.fromBase37(722469266n))).toBe('Jordan');
        });

        it('result after pazaz formatName and fromBase37', (): void => {
            expect(JString.formatName(JString.fromBase37(30072886n))).toBe('Pazaz');
        });

        it('result after notpazaz formatName and fromBase37', (): void => {
            expect(JString.formatName(JString.fromBase37(1368949128023n))).toBe('Notpazaz');
        });

        it('result after ABCDEFGHIJKL formatName and fromBase37', (): void => {
            expect(JString.formatName(JString.fromBase37(187939216216112118n))).toBe('Abcdefghijkl');
        });
    });
});
