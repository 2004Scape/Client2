// https://gist.github.com/ultraviolet-jordan/2ded15754aee4fa82caacb0c7c77d866

@final
class BZip2State {
    @inline static readonly MTFA_SIZE: i16 = 4096;
    @inline static readonly MTFL_SIZE: i8 = 16;
    @inline static readonly BZ_MAX_ALPHA_SIZE: i16 = 258;
    @inline static readonly BZ_MAX_CODE_LEN: i8 = 23;
    // static readonly anInt732: i32 = 1; // TODO
    @inline static readonly BZ_N_GROUPS: i8 = 6;
    @inline static readonly BZ_G_SIZE: i8 = 50;
    @inline static readonly BZ_MAX_SELECTORS: i16 = 18002; // (2 + (900000 / BZip2State.BZ_G_SIZE));
    // static readonly anInt735: i32 = 4; // TODO

    @inline static readonly BZ_RUNA: i8 = 0;
    @inline static readonly BZ_RUNB: i8 = 1;

    static tt: StaticArray<i32> = new StaticArray<i32>(100_000);

    stream: StaticArray<i8> = new StaticArray(0);
    decompressed: StaticArray<i8> = new StaticArray(0);
    next_in: i32 = 0;
    avail_in: i32 = 0;
    total_in_lo32: i32 = 0;
    total_in_hi32: i32 = 0;
    next_out: i32 = 0;
    avail_out: i32 = 0;
    total_out_lo32: i32 = 0;
    total_out_hi32: i32 = 0;
    state_out_ch: u8 = 0;
    state_out_len: i32 = 0;
    blockRandomized: bool = false;
    bsBuff: i32 = 0;
    bsLive: i32 = 0;
    // blockSize100k: i32 = 0;
    currBlockNo: i32 = 0;
    origPtr: i32 = 0;
    tPos: i32 = 0;
    k0: i32 = 0;
    c_nblock_used: i32 = 0;
    nInUse: i32 = 0;
    save_nblock: i32 = 0;

    readonly unzftab: StaticArray<i32> = new StaticArray<i32>(256);
    readonly cftab: StaticArray<i32> = new StaticArray<i32>(257);
    readonly cftabCopy: StaticArray<i32> = new StaticArray<i32>(257);
    readonly inUse: StaticArray<bool> = new StaticArray<bool>(256);
    readonly inUse16: StaticArray<bool> = new StaticArray<bool>(16);
    readonly seqToUnseq: StaticArray<u8> = new StaticArray<u8>(256);
    readonly mtfa: StaticArray<u8> = new StaticArray<u8>(BZip2State.MTFA_SIZE);
    readonly mtfbase: StaticArray<i32> = new StaticArray<i32>(32); // 256 / BZip2State.MTFL_SIZE
    readonly selector: StaticArray<u8> = new StaticArray<u8>(BZip2State.BZ_MAX_SELECTORS);
    readonly selectorMtf: StaticArray<u8> = new StaticArray<u8>(BZip2State.BZ_MAX_SELECTORS);
    readonly len: StaticArray<u8>[] = new StaticArray<StaticArray<u8>>(BZip2State.BZ_N_GROUPS).map((): StaticArray<u8> => new StaticArray<u8>(BZip2State.BZ_MAX_ALPHA_SIZE));
    readonly limit: StaticArray<i32>[] = new StaticArray<StaticArray<i32>>(BZip2State.BZ_N_GROUPS).map((): StaticArray<i32> => new StaticArray<i32>(BZip2State.BZ_MAX_ALPHA_SIZE));
    readonly base: StaticArray<i32>[] = new StaticArray<StaticArray<i32>>(BZip2State.BZ_N_GROUPS).map((): StaticArray<i32> => new StaticArray<i32>(BZip2State.BZ_MAX_ALPHA_SIZE));
    readonly perm: StaticArray<i32>[] = new StaticArray<StaticArray<i32>>(BZip2State.BZ_N_GROUPS).map((): StaticArray<i32> => new StaticArray<i32>(BZip2State.BZ_MAX_ALPHA_SIZE));
    readonly minLens: StaticArray<i32> = new StaticArray<i32>(BZip2State.BZ_N_GROUPS);
}

const state: BZip2State = new BZip2State();

export function read(length: i32, stream: StaticArray<i8>, avail_in: i32, next_in: i32): StaticArray<i8> {
    state.stream = stream;
    state.next_in = next_in;
    state.decompressed = new StaticArray(length);
    state.next_out = 0;
    state.avail_in = avail_in;
    state.avail_out = length;
    state.bsLive = 0;
    state.bsBuff = 0;
    state.total_in_lo32 = 0;
    state.total_in_hi32 = 0;
    state.total_out_lo32 = 0;
    state.total_out_hi32 = 0;
    state.currBlockNo = 0;
    decompress();
    // return length - state.avail_out;
    return state.decompressed;
}

function decompress(): void {
    let gMinlen: i32 = 0;
    let gLimit: StaticArray<i32> = [];
    let gBase: StaticArray<i32> = [];
    let gPerm: StaticArray<i32> = [];

    /*state.blockSize100k = 1;
    if (BZip2State.tt.length === 0) {
        BZip2State.tt = new StaticArray<i32>(state.blockSize100k * 100_000);
    }*/

    let reading: bool = true;
    while (reading) {
        let uc: u8 = getByte();
        if (uc === 0x17) {
            // 23
            return;
        }

        // uc checks originally broke the loop and returned an error in libbzip2
        uc = getByte();
        uc = getByte();
        uc = getByte();
        uc = getByte();
        uc = getByte();

        state.currBlockNo++;

        uc = getByte();
        uc = getByte();
        uc = getByte();
        uc = getByte();

        uc = getBit();
        state.blockRandomized = uc !== 0;
        if (state.blockRandomized) {
            // console.log('PANIC! RANDOMISED BLOCK!');
        }

        state.origPtr = 0;
        uc = getByte();
        state.origPtr = (state.origPtr << 8) | (uc & 0xff);
        uc = getByte();
        state.origPtr = (state.origPtr << 8) | (uc & 0xff);
        uc = getByte();
        state.origPtr = (state.origPtr << 8) | (uc & 0xff);

        // Receive the mapping table
        for (let i: i32 = 0; i < 16; i++) {
            uc = getBit();
            unchecked((state.inUse16[i] = uc === 1));
        }

        for (let i: i32 = 0; i < 256; i++) {
            unchecked((state.inUse[i] = false));
        }

        for (let i: i32 = 0; i < 16; i++) {
            if (unchecked(state.inUse16[i])) {
                for (let j: i32 = 0; j < 16; j++) {
                    uc = getBit();
                    if (uc === 1) {
                        unchecked((state.inUse[i * 16 + j] = true));
                    }
                }
            }
        }
        makeMaps();
        const alphaSize: i32 = state.nInUse + 2;

        const nGroups: i32 = getBits(3);
        const nSelectors: i32 = getBits(15);
        for (let i: i32 = 0; i < nSelectors; i++) {
            let j: i32 = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                uc = getBit();
                if (uc === 0) {
                    break;
                }
                j++;
            }

            unchecked((state.selectorMtf[i] = <u8>j));
        }

        // Undo the MTF values for the selectors
        const pos: StaticArray<u8> = new StaticArray<u8>(BZip2State.BZ_N_GROUPS);
        for (let v: i32 = 0; v < nGroups; v++) {
            unchecked((pos[v] = <u8>v));
        }

        for (let i: i32 = 0; i < nSelectors; i++) {
            let v: u8 = unchecked(state.selectorMtf[i]);
            const tmp: u8 = unchecked(pos[v]);
            while (v > 0) {
                unchecked((pos[v] = pos[v - 1]));
                v--;
            }
            unchecked((pos[0] = tmp));
            unchecked((state.selector[i] = tmp));
        }

        // Now the coding tables
        for (let t: i32 = 0; t < nGroups; t++) {
            let curr: i32 = getBits(5);

            for (let i: i32 = 0; i < alphaSize; i++) {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    uc = getBit();
                    if (uc === 0) {
                        break;
                    }

                    uc = getBit();
                    if (uc === 0) {
                        curr++;
                    } else {
                        curr--;
                    }
                }

                unchecked((state.len[t][i] = <u8>curr));
            }
        }

        // Create the Huffman decoding tables
        for (let t: i32 = 0; t < nGroups; t++) {
            let minLen: u8 = 32;
            let maxLen: u8 = 0;

            for (let i: i32 = 0; i < alphaSize; i++) {
                if (unchecked(state.len[t][i] > maxLen)) {
                    unchecked((maxLen = state.len[t][i]));
                }

                if (unchecked(state.len[t][i] < minLen)) {
                    unchecked((minLen = state.len[t][i]));
                }
            }

            unchecked(createDecodeTables(state.limit[t], state.base[t], state.perm[t], state.len[t], minLen, maxLen, alphaSize));
            unchecked((state.minLens[t] = minLen));
        }

        // Now the MTF values
        const EOB: i32 = state.nInUse + 1;
        // const nblockMAX: i32 = state.blockSize100k * 100000;
        let groupNo: i32 = -1;
        let groupPos: u8 = 0;

        for (let i: i32 = 0; i <= 255; i++) {
            unchecked((state.unzftab[i] = 0));
        }

        // MTF init
        let kk: i32 = BZip2State.MTFA_SIZE - 1;
        for (let ii: i32 = 256 / BZip2State.MTFL_SIZE - 1; ii >= 0; ii--) {
            for (let jj: i32 = BZip2State.MTFL_SIZE - 1; jj >= 0; jj--) {
                unchecked((state.mtfa[kk] = <u8>(ii * BZip2State.MTFL_SIZE + jj)));
                kk--;
            }

            unchecked((state.mtfbase[ii] = kk + 1));
        }
        // end MTF init

        let nblock: i32 = 0;

        // macro: GET_MTF_VAL
        let gSel: u8;
        if (groupPos === 0) {
            groupNo++;
            groupPos = 50;
            unchecked((gSel = state.selector[groupNo]));
            unchecked((gMinlen = state.minLens[gSel]));
            unchecked((gLimit = state.limit[gSel]));
            unchecked((gPerm = state.perm[gSel]));
            unchecked((gBase = state.base[gSel]));
        }

        let gPos: i32 = groupPos - 1;
        let zn: i32 = gMinlen;
        let zvec: i32;
        let zj: u8 = 0;
        for (zvec = getBits(gMinlen); zvec > unchecked(gLimit[zn]); zvec = (zvec << 1) | zj) {
            zn++;
            zj = getBit();
        }

        let nextSym: i32 = unchecked(gPerm[zvec - unchecked(gBase[zn])]);
        while (nextSym !== EOB) {
            if (nextSym === BZip2State.BZ_RUNA || nextSym === BZip2State.BZ_RUNB) {
                let es: i32 = -1;
                let N: i32 = 1;

                do {
                    if (nextSym === BZip2State.BZ_RUNA) {
                        es += N;
                    } else if (nextSym === BZip2State.BZ_RUNB) {
                        es += N * 2;
                    }

                    N *= 2;
                    if (gPos === 0) {
                        groupNo++;
                        gPos = 50;
                        unchecked((gSel = state.selector[groupNo]));
                        unchecked((gMinlen = state.minLens[gSel]));
                        unchecked((gLimit = state.limit[gSel]));
                        unchecked((gPerm = state.perm[gSel]));
                        unchecked((gBase = state.base[gSel]));
                    }

                    gPos--;
                    zn = gMinlen;
                    for (zvec = getBits(gMinlen); zvec > unchecked(gLimit[zn]); zvec = (zvec << 1) | zj) {
                        zn++;
                        zj = getBit();
                    }

                    nextSym = unchecked(gPerm[zvec - unchecked(gBase[zn])]);
                } while (nextSym === BZip2State.BZ_RUNA || nextSym === BZip2State.BZ_RUNB);

                es++;
                unchecked((uc = state.seqToUnseq[state.mtfa[state.mtfbase[0]] & 0xff]));
                unchecked((state.unzftab[uc & 0xff] += es));

                while (es > 0) {
                    unchecked((BZip2State.tt[nblock] = uc & 0xff));
                    nblock++;
                    es--;
                }
            } else {
                // uc = MTF ( nextSym-1 )
                let nn: i32 = nextSym - 1;
                let pp: i32;

                if (nn < BZip2State.MTFL_SIZE) {
                    // avoid general-case expense
                    unchecked((pp = state.mtfbase[0]));
                    unchecked((uc = state.mtfa[pp + nn]));

                    while (nn > 3) {
                        const z: i32 = pp + nn;
                        unchecked((state.mtfa[z] = state.mtfa[z - 1]));
                        unchecked((state.mtfa[z - 1] = state.mtfa[z - 2]));
                        unchecked((state.mtfa[z - 2] = state.mtfa[z - 3]));
                        unchecked((state.mtfa[z - 3] = state.mtfa[z - 4]));
                        nn -= 4;
                    }

                    while (nn > 0) {
                        unchecked((state.mtfa[pp + nn] = state.mtfa[pp + nn - 1]));
                        nn--;
                    }

                    unchecked((state.mtfa[pp] = uc));
                } else {
                    // general case
                    let lno: i32 = nn / BZip2State.MTFL_SIZE;
                    const off: i32 = nn % BZip2State.MTFL_SIZE;

                    unchecked((pp = state.mtfbase[lno] + off));
                    unchecked((uc = state.mtfa[pp]));

                    while (unchecked(pp > state.mtfbase[lno])) {
                        unchecked((state.mtfa[pp] = state.mtfa[pp - 1]));
                        pp--;
                    }

                    unchecked(state.mtfbase[lno]++);

                    while (lno > 0) {
                        unchecked(state.mtfbase[lno]--);
                        unchecked((state.mtfa[state.mtfbase[lno]] = state.mtfa[state.mtfbase[lno - 1] + 16 - 1]));
                        lno--;
                    }

                    unchecked(state.mtfbase[0]--);
                    unchecked((state.mtfa[state.mtfbase[0]] = uc));

                    if (unchecked(state.mtfbase[0] === 0)) {
                        kk = BZip2State.MTFA_SIZE - 1;
                        for (let ii: i32 = 256 / BZip2State.MTFL_SIZE - 1; ii >= 0; ii--) {
                            for (let jj: i32 = BZip2State.MTFL_SIZE - 1; jj >= 0; jj--) {
                                unchecked((state.mtfa[kk] = state.mtfa[state.mtfbase[ii] + jj]));
                                kk--;
                            }

                            unchecked((state.mtfbase[ii] = kk + 1));
                        }
                    }
                }
                // end uc = MTF ( nextSym-1 )

                unchecked(state.unzftab[state.seqToUnseq[uc & 0xff] & 0xff]++);
                unchecked((BZip2State.tt[nblock] = state.seqToUnseq[uc & 0xff] & 0xff));
                nblock++;

                // macro: GET_MTF_VAL
                if (gPos === 0) {
                    groupNo++;
                    gPos = 50;
                    unchecked((gSel = state.selector[groupNo]));
                    unchecked((gMinlen = state.minLens[gSel]));
                    unchecked((gLimit = state.limit[gSel]));
                    unchecked((gPerm = state.perm[gSel]));
                    unchecked((gBase = state.base[gSel]));
                }

                gPos--;
                zn = gMinlen;
                for (zvec = getBits(gMinlen); zvec > unchecked(gLimit[zn]); zvec = (zvec << 1) | zj) {
                    zn++;
                    zj = getBit();
                }
                nextSym = unchecked(gPerm[zvec - unchecked(gBase[zn])]);
            }
        }

        // Set up cftab to facilitate generation of T^(-1)

        // Actually generate cftab
        unchecked((state.cftab[0] = 0));

        for (let i: i32 = 1; i <= 256; i++) {
            unchecked((state.cftab[i] = unchecked(state.unzftab[i - 1])));
        }

        for (let i: i32 = 1; i <= 256; i++) {
            unchecked((state.cftab[i] += unchecked(state.cftab[i - 1])));
        }

        state.state_out_len = 0;
        state.state_out_ch = 0;

        // compute the T^(-1) vector
        for (let i: i32 = 0; i < nblock; i++) {
            unchecked((uc = <u8>(unchecked(BZip2State.tt[i]) & 0xff)));
            unchecked((BZip2State.tt[unchecked(state.cftab[uc & 0xff])] |= i << 8));
            unchecked(state.cftab[uc & 0xff]++);
        }

        unchecked((state.tPos = unchecked(BZip2State.tt[state.origPtr]) >> 8));
        state.c_nblock_used = 0;

        // macro: BZ_GET_FAST
        state.tPos = unchecked(BZip2State.tt[state.tPos]);
        state.k0 = <u8>(state.tPos & 0xff);
        state.tPos >>= 8;
        state.c_nblock_used++;

        state.save_nblock = nblock;
        finish();
        reading = state.c_nblock_used === state.save_nblock + 1 && state.state_out_len === 0;
    }
}

// macro: GET_BITS
function getBits(n: i32): i32 {
    while (state.bsLive < n) {
        state.bsBuff = (state.bsBuff << 8) | (unchecked(state.stream[state.next_in]) & 0xff);
        state.bsLive += 8;
        state.next_in++;
        state.avail_in--;
        state.total_in_lo32++;
        if (state.total_in_lo32 === 0) {
            state.total_in_hi32++;
        }
    }

    const value: i32 = state.bsBuff >> state.bsLive - n & (1 << n) - 1;
    state.bsLive -= n;
    return value;
}

// macro: GET_BIT
function getBit(): u8 {
    return <u8>getBits(1);
}

// macro: GET_UCHAR
function getByte(): u8 {
    return <u8>getBits(8);
}

// makeMaps_d
function makeMaps(): void {
    state.nInUse = 0;

    for (let i: i32 = 0; i < 256; i++) {
        if (unchecked(state.inUse[i])) {
            unchecked((state.seqToUnseq[state.nInUse] = <u8>i));
            state.nInUse++;
        }
    }
}

// BZ2_hbCreateDecodeTables
function createDecodeTables(limit: StaticArray<i32>, base: StaticArray<i32>, perm: StaticArray<i32>, length: StaticArray<u8>, minLen: i32, maxLen: i32, alphaSize: i32): void {
    let pp: i32 = 0;

    for (let i: i32 = minLen; i <= maxLen; i++) {
        for (let j: i32 = 0; j < alphaSize; j++) {
            if (unchecked(length[j] === i)) {
                unchecked((perm[pp] = j));
                pp++;
            }
        }
    }

    for (let i: i32 = 0; i < BZip2State.BZ_MAX_CODE_LEN; i++) {
        unchecked((base[i] = 0));
    }

    for (let i: i32 = 0; i < alphaSize; i++) {
        unchecked(base[unchecked(length[i]) + 1]++);
    }

    for (let i: i32 = 1; i < BZip2State.BZ_MAX_CODE_LEN; i++) {
        unchecked((base[i] += unchecked(base[i - 1])));
    }

    for (let i: i32 = 0; i < BZip2State.BZ_MAX_CODE_LEN; i++) {
        unchecked((limit[i] = 0));
    }

    let vec: i32 = 0;
    for (let i: i32 = minLen; i <= maxLen; i++) {
        vec += unchecked(base[i + 1]) - unchecked(base[i]);
        unchecked((limit[i] = vec - 1));
        vec <<= 1;
    }

    for (let i: i32 = minLen + 1; i <= maxLen; i++) {
        unchecked((base[i] = ((unchecked(limit[i - 1]) + 1) << 1) - unchecked(base[i])));
    }
}

// unRLE_obuf_to_output_FAST
function finish(): void {
    let c_state_out_ch: u8 = <u8>state.state_out_ch;
    let c_state_out_len: i32 = state.state_out_len;
    let c_nblock_used: i32 = state.c_nblock_used;
    let c_k0: i32 = state.k0;
    const c_tt: StaticArray<i32> = BZip2State.tt;
    let c_tPos: i32 = state.tPos;
    const cs_decompressed: StaticArray<i8> = state.decompressed;
    let cs_next_out: i32 = state.next_out;
    let cs_avail_out: i32 = state.avail_out;
    const avail_out_INIT: i32 = cs_avail_out;
    const s_save_nblockPP: i32 = state.save_nblock + 1;

    let outer: bool = true;
    do {
        if (c_state_out_len > 0) {
            let inner: bool = true;
            do {
                if (cs_avail_out === 0) {
                    outer = false;
                    inner = false;
                } else {
                    unchecked((cs_decompressed[cs_next_out] = c_state_out_ch));
                    if (c_state_out_len === 1) {
                        cs_next_out++;
                        cs_avail_out--;
                        inner = false;
                    } else {
                        c_state_out_len--;
                        cs_next_out++;
                        cs_avail_out--;
                    }
                }
            } while (inner);
        }

        let next: bool = true;
        let k1: u8;
        while (next) {
            next = false;
            if (c_nblock_used === s_save_nblockPP) {
                c_state_out_len = 0;
                outer = false;
            } else {
                // macro: BZ_GET_FAST_C
                c_state_out_ch = <u8>c_k0;
                c_tPos = unchecked(c_tt[c_tPos]);
                k1 = <u8>(c_tPos & 0xff);
                c_tPos >>= 0x8;
                c_nblock_used++;

                if (k1 !== c_k0) {
                    c_k0 = k1;
                    if (cs_avail_out === 0) {
                        c_state_out_len = 1;
                        outer = false;
                    } else {
                        unchecked((cs_decompressed[cs_next_out] = c_state_out_ch));
                        cs_next_out++;
                        cs_avail_out--;
                        next = true;
                    }
                } else if (c_nblock_used === s_save_nblockPP) {
                    if (cs_avail_out === 0) {
                        c_state_out_len = 1;
                        outer = false;
                    } else {
                        unchecked((cs_decompressed[cs_next_out] = c_state_out_ch));
                        cs_next_out++;
                        cs_avail_out--;
                        next = true;
                    }
                }
            }
        }

        if (outer) {
            // macro: BZ_GET_FAST_C
            c_state_out_len = 2;
            c_tPos = unchecked(c_tt[c_tPos]);
            k1 = <u8>(c_tPos & 0xff);
            c_tPos >>= 0x8;
            c_nblock_used++;

            if (c_nblock_used !== s_save_nblockPP) {
                if (k1 === c_k0) {
                    // macro: BZ_GET_FAST_C
                    c_state_out_len = 3;
                    c_tPos = unchecked(c_tt[c_tPos]);
                    k1 = <u8>(c_tPos & 0xff);
                    c_tPos >>= 0x8;
                    c_nblock_used++;

                    if (c_nblock_used !== s_save_nblockPP) {
                        if (k1 === c_k0) {
                            // macro: BZ_GET_FAST_C
                            c_tPos = unchecked(c_tt[c_tPos]);
                            k1 = <u8>(c_tPos & 0xff);
                            c_tPos >>= 0x8;
                            c_nblock_used++;

                            // macro: BZ_GET_FAST_C
                            c_state_out_len = (k1 & 0xff) + 4;
                            c_tPos = unchecked(c_tt[c_tPos]);
                            c_k0 = <u8>(c_tPos & 0xff);
                            c_tPos >>= 0x8;
                            c_nblock_used++;
                        } else {
                            c_k0 = k1;
                        }
                    }
                } else {
                    c_k0 = k1;
                }
            }
        }
    } while (outer);

    const total_out_lo32_old: i32 = state.total_out_lo32;
    state.total_out_lo32 += avail_out_INIT - cs_avail_out;
    if (state.total_out_lo32 < total_out_lo32_old) {
        state.total_out_hi32++;
    }

    // save
    state.state_out_ch = c_state_out_ch;
    state.state_out_len = c_state_out_len;
    state.c_nblock_used = c_nblock_used;
    state.k0 = c_k0;
    // BZip2State.tt = c_tt;
    state.tPos = c_tPos;
    // s.decompressed = cs_decompressed;
    state.next_out = cs_next_out;
    state.avail_out = cs_avail_out;
    // end save
}
