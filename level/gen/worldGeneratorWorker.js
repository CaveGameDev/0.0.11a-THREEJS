import { Tiles } from "../../render/Tile.js";
0 === Object.keys(Tiles.byId).length && Tiles.init(),
    Math.seedrandom ||
        (Math.seedrandom = function (t) {
            let o = 2147483647;
            return (
                (t = t || 1),
                function () {
                    return (t = (16807 * t + 0) % o) / o;
                }
            );
        });
class NoiseMap {
    constructor(t) {
        (this.levels = t), (this.fuzz = 16), (this.seed = Math.floor(2147483647 * Math.random()));
    }
    read(t, o) {
        const e = new Math.seedrandom(this.seed),
            r = new Int32Array(t * o);
        let a = this.levels,
            l = t >> a;
        for (let a = 0; a < o; a += l) for (let o = 0; o < t; o += l) r[o + a * t] = (Math.floor(256 * e()) - 128) * this.fuzz;
        for (; l > 1; ) {
            const s = 256 * (l << a),
                f = Math.floor(l / 2);
            for (let a = 0; a < o; a += l)
                for (let i = 0; i < t; i += l) {
                    const n = r[((i + 0) % t) + ((a + 0) % o) * t],
                        h = r[((i + l) % t) + ((a + 0) % o) * t],
                        M = r[((i + 0) % t) + ((a + l) % o) * t],
                        d = r[((i + l) % t) + ((a + l) % o) * t],
                        c = Math.floor((n + M + h + d) / 4) + Math.floor(e() * s * 2) - s;
                    r[i + f + (a + f) * t] = c;
                }
            for (let a = 0; a < o; a += l)
                for (let i = 0; i < t; i += l) {
                    const n = r[i + a * t],
                        h = r[((i + l) % t) + a * t],
                        M = r[i + ((a + l) % o) * t],
                        d = r[((i + f) & (t - 1)) + ((a + f - l) & (o - 1)) * t],
                        c = r[((i + f - l) & (t - 1)) + ((a + f) & (o - 1)) * t],
                        T = r[((i + f) % t) + ((a + f) % o) * t],
                        m = Math.floor((n + h + T + d) / 4) + Math.floor(e() * s * 2) - s,
                        w = Math.floor((n + M + T + c) / 4) + Math.floor(e() * s * 2) - s;
                    (r[i + f + a * t] = m), (r[i + (a + f) * t] = w);
                }
            l = Math.floor(l / 2);
        }
        const s = new Int32Array(t * o);
        for (let e = 0; e < o; e++) for (let a = 0; a < t; a++) s[a + e * t] = Math.floor(r[(a % t) + (e % o) * t] / 512) + 128;
        return s;
    }
}
onmessage = function (t) {
    const o = t.data.width || 256,
        e = t.data.height || 256,
        r = t.data.depth || 64,
        a = new Uint8Array(o * r * e),
        l = new Uint8Array(o * e),
        s = new NoiseMap(0).read(o, e),
        f = new NoiseMap(0).read(o, e),
        i = new NoiseMap(1).read(o, e),
        n = new NoiseMap(1).read(o, e),
        h = Tiles.grass && Tiles.grass.id ? Tiles.grass.id : 9,
        M = Tiles.dirt && Tiles.dirt.id ? Tiles.dirt.id : 2,
        d = Tiles.water && Tiles.water.id ? Tiles.water.id : 5,
        c = Tiles.stone && Tiles.stone.id ? Tiles.stone.id : 1,
        T = Tiles.bedrock && Tiles.bedrock.id ? Tiles.bedrock.id : 8;
    for (let t = 0; t < o; t++)
        for (let l = 0; l < e; l++) {
            let e = s[t + l * o],
                d = f[t + l * o];
            i[t + l * o] < 128 && (d = e);
            let m = Math.max(e, d),
                w = Math.min(r - 1, Math.floor(m / 8) + Math.floor(r / 3)),
                b = Math.floor(n[t + l * o] / 8) + Math.floor(r / 3);
            b > w - 2 && (b = w - 2);
            const u = 30,
                p = Math.min(Math.floor(r / 3), u);
            w <= p && (w = p + 1);
            for (let e = 0; e < r; e++) {
                const s = r - 1 - e,
                    f = t + e * o + l * (o * r);
                let i = 0;
                0 !== s ? (s === w && s > p ? (i = h) : s < w && s >= b ? (i = M) : s < b && (i = c), (a[f] = i)) : ((i = T), (a[f] = i));
            }
        }
    for (let t = 1; t < o - 1; t++)
        for (let l = 1; l < e - 1; l++) {
            let e = -1;
            for (let s = r - 1; s >= 0; s--) {
                if (0 !== a[t + s * o + l * (o * r)]) {
                    e = r - 1 - s;
                    break;
                }
            }
            if (e < 0) continue;
            let s = -1;
            const f = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ];
            for (const e of f) {
                let f = t + e[0],
                    i = l + e[1];
                for (let t = 0; t < r; t++) {
                    const e = r - 1 - t;
                    if (a[f + t * o + i * (o * r)] === d) {
                        s = Math.max(s, e);
                        break;
                    }
                }
            }
            if (s > e + 0) {
                const f = Math.min(s, e + 2, seaLevel);
                for (let e = 0; e <= f; e++) {
                    const s = t + (r - 1 - e) * o + l * (o * r);
                    (0 !== a[s] && a[s] !== M) || (a[s] = d);
                }
            }
        }
    const m = Tiles.calmLava && Tiles.calmLava.id ? Tiles.calmLava.id : null;
    if (m)
        for (let t = 0; t < Math.floor((o * e) / 2e3); t++) {
            const t = Math.floor(Math.random() * o),
                l = Math.floor(Math.random() * e);
            let s = -1;
            for (let e = r - 1; e >= 0; e--) {
                if (0 !== a[t + e * o + l * (o * r)]) {
                    s = r - 1 - e;
                    break;
                }
            }
            if (s <= seaLevel - 4 && s > 0) {
                const f = 1 + Math.floor(2 * Math.random());
                for (let i = -f; i <= f; i++)
                    for (let n = -f; n <= f; n++) {
                        const h = t + i,
                            M = l + n;
                        if (!(h <= 0 || M <= 0 || h >= o - 1 || M >= e - 1))
                            for (let t = 0; t <= s; t++) {
                                const e = h + (r - 1 - t) * o + M * (o * r);
                                Math.abs(i) + Math.abs(n) <= f && a[e] === c && (a[e] = m);
                            }
                    }
            }
        }
    const w = Math.floor((o * e * r) / 256 / 64),
        b = new Math.seedrandom(Date.now());
    for (let t = 0; t < w; t++) {
        let t = b() * o,
            l = b() * r,
            s = b() * e;
        const f = Math.floor(b() + 150 * b());
        let i = b() * Math.PI * 2,
            n = 0,
            h = b() * Math.PI * 2,
            M = 0;
        for (let d = 0; d < f; d++) {
            (t += Math.sin(i) * Math.cos(h)), (s += Math.cos(i) * Math.cos(h)), (l += Math.sin(h)), (i += 0.2 * n), (n *= 0.9), (n += b() - b()), (h += 0.5 * M), (h *= 0.5), (M *= 0.9), (M += b() - b());
            const T = 2.5 * Math.sin((d * Math.PI) / f) + 1;
            for (let f = Math.floor(t - T); f <= Math.floor(t + T); f++)
                for (let i = Math.floor(l - T); i <= Math.floor(l + T); i++)
                    for (let n = Math.floor(s - T); n <= Math.floor(s + T); n++) {
                        const h = f - t,
                            M = i - l,
                            d = n - s;
                        if (h * h + M * M * 2 + d * d < T * T && f >= 1 && i >= 1 && n >= 1 && f < o - 1 && i < r - 1 && n < e - 1) {
                            const t = f + i * o + n * (o * r);
                            a[t] === c && (a[t] = 0);
                        }
                    }
        }
    }
    for (let t = 0; t < o; ++t)
        for (let s = 0; s < e; ++s) {
            let e;
            for (e = r - 1; e >= 0 && 0 === a[t + e * o + s * (o * r)]; --e);
            l[t + s * o] = e < 0 ? -1 : r - 1 - e;
        }
    postMessage({ blocks: a.buffer, lightDepths: l.buffer, width: o, height: e, depth: r }, [a.buffer, l.buffer]);
};
