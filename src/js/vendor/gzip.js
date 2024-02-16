let e;
function n() {
    const e = {wbg: {}};
    return e;
}
function t(n, t) {
    return (e = n.exports), (r.__wbindgen_wasm_module = t), e;
}
async function r(e) {
    void 0 === e && (e = new URL('gzip.wasm', import.meta.url));
    const r = n();
    ('string' == typeof e || ('function' == typeof Request && e instanceof Request) || ('function' == typeof URL && e instanceof URL)) && (e = fetch(e));
    const {instance: o, module: s} = await (async function (e, n) {
        if ('function' == typeof Response && e instanceof Response) {
            if ('function' == typeof WebAssembly.instantiateStreaming)
                try {
                    return await WebAssembly.instantiateStreaming(e, n);
                } catch (n) {
                    if ('application/wasm' == e.headers.get('Content-Type')) throw n;
                    console.warn('`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n', n);
                }
            const t = await e.arrayBuffer();
            return await WebAssembly.instantiate(t, n);
        }
        {
            const t = await WebAssembly.instantiate(e, n);
            return t instanceof WebAssembly.Instance ? {instance: t, module: e} : t;
        }
    })(await e, r);
    return t(o, s);
}
let o = null,
    s = !1;
async function i(e) {
    if (s || o) return;
    s = !0;
    const n = await r(e);
    o || (o = n);
}
function a(e) {
    o ||
        (o = (function (e) {
            const r = n();
            return e instanceof WebAssembly.Module || (e = new WebAssembly.Module(e)), t(new WebAssembly.Instance(e, r), e);
        })(e));
}
class c extends Error {
    constructor(e) {
        super(e), (this.name = 'DecompressionError');
    }
}
let f = 0,
    u = null,
    l = null;
function m(e, n, t) {
    let r;
    if (t) {
        const o = n;
        r = e.malloc_u8(o);
        const s = new Uint8Array(e.memory.buffer, r, o);
        try {
            t(s);
        } catch (n) {
            throw (e.free_u8(r, o), n);
        }
        return (f = o), r;
    }
    if ('string' == typeof n) {
        const t = (f = (function (e) {
            let n = 0,
                t = 0,
                r = 0;
            const o = e.length;
            for (; n < o; ) (t = e.codePointAt(n)), t <= 127 ? ((r += 1), n++) : t <= 2047 ? ((r += 2), n++) : t <= 65535 ? ((r += 3), n++) : ((r += 4), (n += 2));
            return r;
        })(n));
        r = e.malloc_u8(t);
        const o = new Uint8Array(e.memory.buffer, r, t);
        return u || (u = new TextEncoder()), u.encodeInto(n, o), r;
    }
    const o = n;
    return (r = e.malloc_u8((f = o.length))), (l && l.length) || (l = new Uint8Array(e.memory.buffer)), l.set(o, r), r;
}
function y(e, n) {
    p(o);
    const t = m(o, e, n),
        r = o.gzip_compress(t, f) >>> 0;
    o.free_u8(t, f);
    const s = o.buffer() >>> 0;
    return new Uint8Array(o.memory.buffer, s, r);
}
function w(e, n) {
    p(o);
    const t = m(o, e, n),
        r = o.gzip_decompress(t, f) >>> 0;
    if ((o.free_u8(t, f), 4294967295 === r)) {
        const e = o.error_message(),
            n = o.error_message_len(),
            t = new Uint8Array(o.memory.buffer, e, n),
            r = new TextDecoder().decode(t);
        throw new c(r);
    }
    const s = o.buffer() >>> 0;
    return new Uint8Array(o.memory.buffer, s, r);
}
function b() {
    p(o), o.deallocate_buffer();
}
function p(e) {
    if (!e) throw new Error('WASM not initialized');
}
export {c as DecompressionError, y as compress, w as decompress, i as default, b as freeBuffer, a as initSync};
//# sourceMappingURL=wasm_gzip.js.map
