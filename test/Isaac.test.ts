import Isaac from '../src/js/jagex2/io/Isaac';

describe('Isaac', (): void => {
    describe('seed(0, 0, 0, 0)', (): void => {
        it('result after 1 million iterations', (): void => {
            const isaac: Isaac = new Isaac(Int32Array.from([0, 0, 0, 0]));
            for (let i: number = 0; i < 1_000_000; i++) {
                isaac.nextInt;
            }

            // checks that isaac is shuffling correctly
            expect(isaac.nextInt).toBe(1536048213);
        });
    });

    describe('seed(1, 2, 3, 4)', (): void => {
        it('result after 1 million iterations', (): void => {
            const isaac: Isaac = new Isaac(Int32Array.from([1, 2, 3, 4]));
            for (let i: number = 0; i < 1_000_000; i++) {
                isaac.nextInt;
            }

            // checks that rsl was populated and that isaac is shuffling correctly
            expect(isaac.nextInt).toBe(-107094133);
        });
    });
});
