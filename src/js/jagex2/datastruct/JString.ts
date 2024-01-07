export default class JString {
    // prettier-ignore
    private static BASE37_LOOKUP: string[] = [
        '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
        'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
        't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];

    static toBase37 = (string: string): bigint => {
        string = string.trim();
        let l: bigint = 0n;

        for (let i = 0; i < string.length && i < 12; i++) {
            const c = string.charCodeAt(i);
            l *= 37n;

            if (c >= 0x41 && c <= 0x5a) {
                // A-Z
                l += BigInt(c + 1 - 0x41);
            } else if (c >= 0x61 && c <= 0x7a) {
                // a-z
                l += BigInt(c + 1 - 0x61);
            } else if (c >= 0x30 && c <= 0x39) {
                // 0-9
                l += BigInt(c + 27 - 0x30);
            }
        }

        return l;
    };

    static fromBase37 = (value: bigint): string => {
        // >= 37 to the 12th power
        if (value < 0n || value >= 6582952005840035281n) {
            return 'invalid_name';
        }

        if (value % 37n == 0n) {
            return 'invalid_name';
        }

        let len: number = 0;
        const chars: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        while (value != 0n) {
            const l1: bigint = value;
            value /= 37n;
            chars[11 - len++] = Number(this.BASE37_LOOKUP[Number(l1 - value * 37n)]);
        }

        return chars.slice(12 - len).join('');
    };

    static toSentenceCase = (input: string): string => {
        const chars: string[] = [...input.toLowerCase()];
        let punctuation = true;
        for (let index = 0; index < chars.length; index++) {
            const char = chars[index];
            if (punctuation && char >= 'a' && char <= 'z') {
                chars[index] = char.toUpperCase();
                punctuation = false;
            }
            if (char === '.' || char === '!') {
                punctuation = true;
            }
        }
        return chars.join('');
    };

    static toAsterisks = (str: string): string => {
        let temp = '';
        for (let i = 0; i < str.length; i++) {
            temp = temp + '*';
        }
        return temp;
    };

    static formatName = (str: string): string => {
        if (str.length == 0) {
            return str;
        }

        const chars: string[] = [...str];
        for (let i = 0; i < chars.length; i++) {
            if (chars[i] == '_') {
                chars[i] = ' ';

                if (i + 1 < chars.length && chars[i + 1] >= 'a' && chars[i + 1] <= 'z') {
                    chars[i + 1] = String.fromCharCode(chars[i + 1].charCodeAt(0) + 'A'.charCodeAt(0) - 97);
                }
            }
        }

        if (chars[0] >= 'a' && chars[0] <= 'z') {
            chars[0] = String.fromCharCode(chars[0].charCodeAt(0) + 'A'.charCodeAt(0) - 97);
        }

        return chars.join('');
    };
}
