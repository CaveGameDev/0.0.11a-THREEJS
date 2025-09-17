import { Tiles } from "./Tile.js";
import { BlockColorSystem } from "./BlockColorSystem.js";
export function tickBush(e, s, l, t) {
    const u = e.getTile(s, l - 1, t),
        o = Tiles.dirt.id,
        a = Tiles.grass.id;
    (!e.isLit(s, l, t) || (u !== o && u !== a)) && e.setTile(s, l, t, 0);
}
export function renderBush(e, s, l, t, u, o) {
    const { allPositions: a, allNormals: i, allUvs: n, allColors: c, allIndices: h, allIsSunlit: r, allIsSideBoundaryFace: f, allIsBottomBoundaryFace: p, faceGroupInfo: v, vertexCountRef: g } = u,
        d = Tiles.byId[6];
    if (!d) return;
    const B = d.getTextureKey(2) || "bush-block",
        m = o["bush-alpha"] ?? o[B];
    if (void 0 === m) return;
    const y = e.getTile(s, l - 1, t),
        T = Tiles.byId[y],
        k = o[T ? T.getTextureKey(0) : null];
    if (void 0 !== k && 0 !== y) {
        const u = BlockColorSystem.getBlockFaceLighting(e, s, l - 1, t, 0, y),
            o = u.finalBrightness,
            d = u.isSunlit,
            B = l + 0.01,
            m = [0, 0, 1, 0, 0, 1, 1, 1],
            T = [s, B, t + 1, s + 1, B, t + 1, s, B, t, s + 1, B, t],
            I = h.length;
        a.push(...T), i.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0), n.push(...m);
        for (let e = 0; e < 4; e++) c.push(o, o, o), r.push(d ? 1 : 0), f.push(0), p.push(1);
        h.push(g.value, g.value + 2, g.value + 1, g.value + 1, g.value + 2, g.value + 3), v.push({ materialIndex: k, start: I, count: 6 }), (g.value += 4);
    }
    const I = [s, l, t, s + 1, l, t + 1, s, l + 1, t, s + 1, l + 1, t + 1],
        S = [s + 1, l, t, s, l, t + 1, s + 1, l + 1, t, s, l + 1, t + 1],
        x = [0, 0, 1, 0, 0, 1, 1, 1],
        C = BlockColorSystem.getBlockFaceLighting(e, s, l, t, 2, 6),
        b = C.finalBrightness,
        F = C.isSunlit;
    for (const e of [I, S]) {
        const s = h.length;
        a.push(...e), i.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), n.push(...x);
        for (let e = 0; e < 4; e++) c.push(b, b, b), r.push(F ? 1 : 0), f.push(0), p.push(0);
        h.push(g.value, g.value + 2, g.value + 1), h.push(g.value + 1, g.value + 2, g.value + 3), v.push({ materialIndex: m, start: s, count: 6 }), (g.value += 4);
    }
    const q = [
        { face: 5, ofs: -0.001, quad: (e, s, l, t) => [e + t, s, l, e + t, s, l + 1, e + t, s + 1, l, e + t, s + 1, l + 1] },
        { face: 4, ofs: 1.001, quad: (e, s, l, t) => [e + t, s, l + 1, e + t, s, l, e + t, s + 1, l + 1, e + t, s + 1, l] },
        { face: 2, ofs: -0.001, quad: (e, s, l, t) => [e, s, l + t, e + 1, s, l + t, e, s + 1, l + t, e + 1, s + 1, l + t] },
        { face: 3, ofs: 1.001, quad: (e, s, l, t) => [e + 1, s, l + t, e, s, l + t, e + 1, s + 1, l + t, e, s + 1, l + t] },
    ];
    for (const u of q) {
        let d = s,
            B = l,
            m = t;
        5 === u.face && (d = s - 1), 4 === u.face && (d = s + 1), 2 === u.face && (m = t - 1), 3 === u.face && (m = t + 1);
        const y = e.getTile(d, B, m);
        if (y && 0 !== y) {
            const T = Tiles.byId[y],
                k = T ? T.getTextureKey(u.face) : null,
                I = k ? o[k] : void 0;
            if (void 0 !== I) {
                const o = h.length,
                    T = u.quad(s, l, t, u.ofs);
                a.push(...T), i.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), n.push(...x);
                const k = BlockColorSystem.getBlockFaceLighting(e, d, B, m, u.face, y).finalBrightness,
                    S = BlockColorSystem.getBlockFaceLighting(e, d, B, m, u.face, y).isSunlit;
                for (let e = 0; e < 4; e++) c.push(k, k, k), r.push(S ? 1 : 0), f.push(1), p.push(0);
                h.push(g.value, g.value + 2, g.value + 1), h.push(g.value + 1, g.value + 2, g.value + 3), v.push({ materialIndex: I, start: o, count: 6 }), (g.value += 4);
            }
        }
    }
}
