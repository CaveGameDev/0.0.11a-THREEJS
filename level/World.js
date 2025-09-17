import { THREE } from "../LibHandler.js";
import { AABB } from "../AABB/AABB.js";
import { Tiles } from "../render/Tile.js";
import { BlockColorSystem } from "../render/BlockColorSystem.js";
import { renderBush } from "../render/Bush.js";
import { _playBreakSoundForTile } from "../PlaceHandler.js";
export class World {
    constructor(t, e) {
        (this.width = 256),
            (this.height = 256),
            (this.depth = 64),
            (this.blocks = null),
            (this.lightDepths = null),
            (this.blockMaterials = t),
            (this.materialIndexMap = e),
            (this._grassDirty = new Set()),
            window.worldInstance || (window.worldInstance = this),
            (this.chunkSizeX = 16),
            (this.chunkSizeY = this.depth),
            (this.chunkSizeZ = 16),
            (this.loadedChunkMeshes = new Map());
    }
    worldIndex(t, e, i) {
        if (t < 0 || t >= this.width || i < 0 || i >= this.height || e < 0 || e >= this.depth) return -1;
        return t + (this.depth - 1 - e) * this.width + i * this.width * this.depth;
    }
    async init() {
        try {
            if (window._preventLocalGeneration && this.blocks && this.blocks.length === this.width * this.height * this.depth) return void ("function" == typeof this.onReady && this.onReady());
            try {
                const t = (location.hash || "").slice(1);
                if (t && (t.startsWith("JOIN") || t.length > 0)) {
                    const e = t.replace(/^JOIN/, "").trim();
                    if (e && window.P2PNetwork && "function" == typeof window.P2PNetwork.connectTo) {
                        await window.P2PNetwork.init();
                        const t = e.startsWith("minecraft4k-") ? e : `minecraft4k-${e}`;
                        try {
                            await window.P2PNetwork.connectTo(t);
                        } catch (t) {
                            console.warn("[World] connectTo host failed", t);
                        }
                        window.P2PNetwork.onIncoming((t, e) => {
                            try {
                                if (!e || "object" != typeof e) return;
                                if ("world_state" === e.type && e.blocks)
                                    (this.width = e.width || this.width),
                                        (this.height = e.height || this.height),
                                        (this.depth = e.depth || this.depth),
                                        (this.blocks = e.blocks instanceof Uint8Array ? e.blocks : new Uint8Array(e.blocks)),
                                        (this.lightDepths = e.lightDepths ? (e.lightDepths instanceof Uint8Array ? e.lightDepths : new Uint8Array(e.lightDepths)) : new Uint8Array(this.width * this.height)),
                                        console.log("[World] received world_state from host", t),
                                        "function" == typeof this.onReady && this.onReady();
                                else if ("player_update" === e.type && e.players) {
                                    window.peersLive = window.peersLive || {};
                                    for (const t of e.players) t && t.id && (window.peersLive[t.id] = t);
                                } else "player_model" === e.type && e.id && e.model && ((window.peersLive = window.peersLive || {}), (window.peersLive[e.id] = window.peersLive[e.id] || {}), (window.peersLive[e.id].model = e.model));
                            } catch (t) {
                                console.warn("[World] error processing incoming p2p payload", t);
                            }
                        });
                        const i = this.width * this.height * this.depth;
                        this.blocks || (this.blocks = new Uint8Array(i)), this.lightDepths || (this.lightDepths = new Uint8Array(this.width * this.height));
                        try {
                            await window.P2PNetwork.sendTo(t, { type: "request_world" });
                        } catch (t) {}
                        return;
                    }
                }
            } catch (t) {}
            if (window.websimRoom && "function" == typeof window.websimRoom.collection) {
                const t = window.websimRoom.collection("world_master");
                if (t)
                    try {
                        const e = t.getList ? t.getList() : [];
                        if (Array.isArray(e) && e.length > 0 && e[0].blocks) {
                            const t = e[0];
                            return (
                                (this.width = t.width || this.width),
                                (this.height = t.height || this.height),
                                (this.depth = t.depth || this.depth),
                                (this.blocks = new Uint8Array(t.blocks)),
                                (this.lightDepths = new Uint8Array(t.lightDepths || new Array(this.width * this.height).fill(0))),
                                void console.log("Loaded shared master world from Websim.")
                            );
                        }
                        {
                            const t = this.width * this.height * this.depth;
                            return (
                                (this.blocks = new Uint8Array(t)), (this.lightDepths = new Uint8Array(this.width * this.height)), void console.log("No shared master world found; initialized empty world and awaiting server-side generation.")
                            );
                        }
                    } catch (t) {
                        console.warn("Failed to read world_master collection; falling back to empty world", t);
                        const e = this.width * this.height * this.depth;
                        return (this.blocks = new Uint8Array(e)), void (this.lightDepths = new Uint8Array(this.width * this.height));
                    }
            }
        } catch (t) {}
        return new Promise((t, e) => {
            const i = new Worker("level/gen/worldGeneratorWorker.js", { type: "module" });
            i.postMessage({ width: this.width, height: this.height, depth: this.depth }),
                (i.onmessage = (e) => {
                    (this.blocks = new Uint8Array(e.data.blocks)), (this.lightDepths = new Uint8Array(e.data.lightDepths)), i.terminate(), t();
                }),
                (i.onerror = (t) => {
                    console.error("World generation worker encountered an error:", t), e(t);
                });
        });
    }
    getBrightness(t, e, i, s) {
        let h,
            o = t,
            r = e,
            n = i;
        switch (s) {
            case 0:
                r += 1;
                break;
            case 1:
                r -= 1;
                break;
            case 2:
                n -= 1;
                break;
            case 3:
                n += 1;
                break;
            case 4:
                o += 1;
                break;
            case 5:
                o -= 1;
                break;
            default:
                return { finalBrightness: 1, isSunlit: !0 };
        }
        if (o < 0 || o >= this.width || r < 0 || r >= this.depth || n < 0 || n >= this.height) return { finalBrightness: 1, isSunlit: !0 };
        let a = !0;
        if (o < 0 || o >= this.width || n < 0 || n >= this.height) (h = 1), (a = !0);
        else {
            this.getGroundHeight(o, n) > r ? ((h = 0.5), (a = !1)) : ((h = 1), (a = !0));
        }
        let l = h;
        switch (s) {
            case 0:
            case 1:
                l *= 1;
                break;
            case 2:
            case 3:
                l *= 0.8;
                break;
            case 4:
            case 5:
                l *= 0.6;
        }
        return { finalBrightness: Math.max(0, Math.min(1, l)), isSunlit: a };
    }
    buildChunkMesh(t, e) {
        const i = [],
            s = [],
            h = [],
            o = [],
            r = [],
            n = [],
            a = [],
            l = [],
            d = [];
        let c = 0;
        const u = (t, e, i) => (2 === i && 0 === e) || (3 === i && e === this.height - 1) || (4 === i && t === this.width - 1) || (5 === i && 0 === t),
            w = (t, e, w, f, p) => {
                let g, k;
                const m = Tiles.byId[p];
                if (!m) return;
                if (6 === m.id) {
                    const u = m.getTextureKey(2) || "bush-block";
                    if (void 0 === this.materialIndexMap[u]) return;
                    const f = { value: c };
                    return (
                        renderBush(
                            this,
                            t,
                            e,
                            w,
                            { allPositions: i, allNormals: s, allUvs: h, allColors: o, allIndices: r, allIsSunlit: n, allIsSideBoundaryFace: a, allIsBottomBoundaryFace: l, faceGroupInfo: d, vertexCountRef: f },
                            this.materialIndexMap
                        ),
                        void (c = f.value)
                    );
                }
                let y = m.getTextureKey(f);
                if (null == y) {
                    const i = this.getTile(t, e - 1, w),
                        s = Tiles.byId[i];
                    y = s ? s.getTextureKey(f) : null;
                }
                const b = this.materialIndexMap[y];
                if (void 0 === b) return void console.warn(`No material found for texture key: ${y}`);
                switch (f) {
                    case 0:
                        (g = [t, e + 1, w + 1, t + 1, e + 1, w + 1, t, e + 1, w, t + 1, e + 1, w]), (k = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
                        break;
                    case 1:
                        (g = [t, e, w, t + 1, e, w, t, e, w + 1, t + 1, e, w + 1]), (k = [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0]);
                        break;
                    case 2:
                        (g = [t, e, w, t + 1, e, w, t, e + 1, w, t + 1, e + 1, w]), (k = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);
                        break;
                    case 3:
                        (g = [t + 1, e, w + 1, t, e, w + 1, t + 1, e + 1, w + 1, t, e + 1, w + 1]), (k = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
                        break;
                    case 4:
                        (g = [t + 1, e, w, t + 1, e, w + 1, t + 1, e + 1, w, t + 1, e + 1, w + 1]), (k = [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);
                        break;
                    case 5:
                        (g = [t, e, w + 1, t, e, w, t, e + 1, w + 1, t, e + 1, w]), (k = [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0]);
                }
                const T = [],
                    _ = [],
                    M = [],
                    A = [],
                    B = u(t, w, f),
                    $ = 0 === e && 1 === f,
                    S = BlockColorSystem.getBlockFaceLighting(this, t, e, w, f, p),
                    D = S.finalBrightness,
                    x = S.isSunlit;
                for (let t = 0; t < 4; t++) T.push(D, D, D), _.push(x ? 1 : 0), M.push(B ? 1 : 0), A.push($ ? 1 : 0);
                const C = r.length;
                i.push(...g),
                    s.push(...k),
                    h.push(0, 0, 1, 0, 0, 1, 1, 1),
                    o.push(...T),
                    n.push(..._),
                    a.push(...M),
                    l.push(...A),
                    r.push(c, c + 2, c + 1),
                    r.push(c + 1, c + 2, c + 3),
                    d.push({ materialIndex: b, start: C, count: 6 }),
                    (c += 4);
            },
            f = t * this.chunkSizeX,
            p = Math.min((t + 1) * this.chunkSizeX, this.width),
            g = e * this.chunkSizeZ,
            k = Math.min((e + 1) * this.chunkSizeZ, this.height);
        for (let t = f; t < p; t++)
            for (let e = 0; e < this.depth; e++)
                for (let f = g; f < k; f++) {
                    const p = this.getTile(t, e, f);
                    if (0 !== p)
                        if (6 !== p)
                            0 === this.getTile(t, e + 1, f) && w(t, e, f, 0, p),
                                (0 === this.getTile(t, e - 1, f) || (0 === e && 0 === this.getTile(t, e - 1, f))) && w(t, e, f, 1, p),
                                (0 === this.getTile(t, e, f - 1) || u(t, f, 2)) && w(t, e, f, 2, p),
                                (0 === this.getTile(t, e, f + 1) || u(t, f, 3)) && w(t, e, f, 3, p),
                                (0 === this.getTile(t + 1, e, f) || u(t, f, 4)) && w(t, e, f, 4, p),
                                (0 === this.getTile(t - 1, e, f) || u(t, f, 5)) && w(t, e, f, 5, p);
                        else {
                            const u = { value: c };
                            renderBush(
                                this,
                                t,
                                e,
                                f,
                                { allPositions: i, allNormals: s, allUvs: h, allColors: o, allIndices: r, allIsSunlit: n, allIsSideBoundaryFace: a, allIsBottomBoundaryFace: l, faceGroupInfo: d, vertexCountRef: u },
                                this.materialIndexMap
                            ),
                                (c = u.value);
                        }
                }
        const m = new THREE.BufferGeometry();
        m.setAttribute("position", new THREE.Float32BufferAttribute(i, 3)),
            m.setAttribute("normal", new THREE.Float32BufferAttribute(s, 3)),
            m.setAttribute("uv", new THREE.Float32BufferAttribute(h, 2)),
            m.setAttribute("color", new THREE.Float32BufferAttribute(o, 3)),
            m.setAttribute("isSunlit", new THREE.Float32BufferAttribute(n, 1)),
            m.setAttribute("isSideBoundaryFace", new THREE.Float32BufferAttribute(a, 1)),
            m.setAttribute("isBottomBoundaryFace", new THREE.Float32BufferAttribute(l, 1)),
            m.setIndex(r);
        let y = -1,
            b = 0,
            T = 0;
        for (const t of d) t.materialIndex !== y ? (T > 0 && m.addGroup(b, T, y), (y = t.materialIndex), (b = t.start), (T = t.count)) : (T += t.count);
        T > 0 && m.addGroup(b, T, y);
        return new THREE.Mesh(m, this.blockMaterials);
    }
    loadChunk(t, e, i) {
        const s = `${t}_${e}`;
        if (this.loadedChunkMeshes.has(s)) return;
        const h = this.buildChunkMesh(t, e);
        i.add(h), this.loadedChunkMeshes.set(s, h);
    }
    unloadChunk(t, e, i) {
        const s = `${t}_${e}`,
            h = this.loadedChunkMeshes.get(s);
        h && (i.remove(h), h.geometry.dispose(), this.loadedChunkMeshes.delete(s));
    }
    getTile(t, e, i) {
        const s = this.worldIndex(t, e, i);
        if (-1 === s) {
            return Tiles.bedrock && Tiles.bedrock.id ? Tiles.bedrock.id : 8;
        }
        return this.blocks[s];
    }
    setTile(t, e, i, s) {
        const h = this.worldIndex(t, e, i);
        if (-1 === h) return;
        if (s === (Tiles.bedrock && Tiles.bedrock.id ? Tiles.bedrock.id : 8)) return;
        (this.blocks[h] = s), this.updateBlockAndLight(t, e, i);
        const o = `${Math.floor(t / this.chunkSizeX)}_${Math.floor(i / this.chunkSizeZ)}`;
        if (this.loadedChunkMeshes.has(o)) {
            this.loadedChunkMeshes.get(o).userData._needsRebuild = !0;
        }
        try {
            if (window.P2PNetwork && "function" == typeof window.P2PNetwork.broadcast) {
                const h = { type: "block_update", x: t, y: e, z: i, tileId: s };
                window.P2PNetwork.broadcast(h).catch(() => {});
            }
        } catch (t) {}
    }
    isLit(t, e, i) {
        if (t < 0 || t >= this.width || i < 0 || i >= this.height || e < 0 || e >= this.depth) return !0;
        return e >= this.lightDepths[t + i * this.width];
    }
    updateBlockAndLight(t, e, i) {
        let s;
        for (s = this.depth - 1; s >= 0 && 0 === this.getTile(t, s, i); --s);
        this.lightDepths[t + i * this.width] = s;
        try {
            this._grassDirty.add(`${t}_${i}`);
        } catch (t) {}
        try {
            const e = Math.floor(t / this.chunkSizeX),
                s = `${e}_${Math.floor(i / this.chunkSizeZ)}`;
            if (this.loadedChunkMeshes.has(s)) {
                const t = this.loadedChunkMeshes.get(s);
                (t.userData._needsRebuild = !0), (t.userData._doubleRebuild = !0);
            }
        } catch (t) {}
    }
    getGroundHeight(t, e) {
        for (let i = this.depth - 1; i >= 0; i--) if (0 !== this.getTile(t, i, e)) return i;
        return -1;
    }
    getCubes(t) {
        const e = [],
            i = Math.max(0, Math.floor(t.minX) - 1),
            s = Math.min(this.width, Math.ceil(t.maxX) + 1),
            h = Math.max(0, Math.floor(t.minY) - 1),
            o = Math.min(this.depth, Math.ceil(t.maxY) + 1),
            r = Math.max(0, Math.floor(t.minZ) - 1),
            n = Math.min(this.height, Math.ceil(t.maxZ) + 1);
        for (let t = i; t < s; ++t) for (let i = h; i < o; ++i) for (let s = r; s < n; ++s) 0 !== this.getTile(t, i, s) && e.push(new AABB(t, i, s, t + 1, i + 1, s + 1));
        return e;
    }
    processBushTicks() {
        const t = Tiles.dirt.id,
            e = Tiles.grass.id;
        for (const i of this.loadedChunkMeshes.keys()) {
            const [s, h] = i.split("_").map(Number),
                o = s * this.chunkSizeX,
                r = Math.min((s + 1) * this.chunkSizeX, this.width),
                n = h * this.chunkSizeZ,
                a = Math.min((h + 1) * this.chunkSizeZ, this.height);
            for (let i = o; i < r; i++)
                for (let o = n; o < a; o++)
                    for (let r = 0; r < this.depth; r++) {
                        if (6 !== this.getTile(i, r, o)) continue;
                        const n = this.getTile(i, r - 1, o);
                        if (!this.isLit(i, r, o) || (n !== t && n !== e)) {
                            this.setTile(i, r, o, 0), this.updateBlockAndLight(i, r, o);
                            const t = `${s}_${h}`;
                            if (this.loadedChunkMeshes.has(t)) {
                                this.loadedChunkMeshes.get(t).userData._needsRebuild = !0;
                            }
                            try {
                                this._bushProtected && this._bushProtected.delete(`${i}_${r - 1}_${o}`);
                            } catch (t) {}
                        }
                    }
        }
    }
    processGrassGrowth(t, e, i) {
        const s = Tiles.dirt && Tiles.dirt.id ? Tiles.dirt.id : 2,
            h = Tiles.grass && Tiles.grass.id ? Tiles.grass.id : 4,
            o = [];
        if (this._grassDirty && this._grassDirty.size > 0) {
            for (const t of this._grassDirty) {
                const [e, i] = t.split("_").map(Number);
                Number.isFinite(e) && Number.isFinite(i) && o.push([e, i]);
            }
            this._grassDirty.clear();
        } else
            for (const t of this.loadedChunkMeshes.keys()) {
                const [e, i] = t.split("_").map(Number);
                o.push([e, i]);
            }
        for (const [r, n] of o) {
            const o = r * this.chunkSizeX,
                a = Math.min((r + 1) * this.chunkSizeX, this.width),
                l = n * this.chunkSizeZ,
                d = Math.min((n + 1) * this.chunkSizeZ, this.height);
            for (let c = o; c < a; c++)
                for (let o = l; o < d; o++) {
                    const a = this.getGroundHeight(c, o);
                    if (!(a < 0))
                        for (let l = a; l >= Math.max(0, a - 2); l--) {
                            if (this.getTile(c, l, o) !== s) continue;
                            if (0 !== this.getTile(c, l + 1, o)) continue;
                            if (!(l + 1 >= this.lightDepths[c + o * this.width])) {
                                const e = `${c}_${l}_${o}`;
                                t.has(e) && t.delete(e);
                                continue;
                            }
                            const a = `${c}_${l}_${o}`,
                                d = (t.get(a) || 0) + e;
                            if (d >= 0.5) {
                                this.setTile(c, l, o, h), this.updateBlockAndLight(c, l, o), t.delete(a);
                                const e = `${r}_${n}`;
                                if (this.loadedChunkMeshes.has(e)) {
                                    const t = this.loadedChunkMeshes.get(e);
                                    (t.userData._needsRebuild = !0), (t.userData._doubleRebuild = !0);
                                }
                                i && i.has(`${c}_${l}_${o}`) && i.delete(`${c}_${l}_${o}`);
                            } else t.set(a, d);
                        }
                }
        }
        for (const [e, i] of t.entries()) {
            const [i, h, o] = e.split("_").map(Number);
            (this.getTile(i, h, o) === s && 0 === this.getTile(i, h + 1, o)) || t.delete(e);
        }
        if (!i) return;
        for (const t of this.loadedChunkMeshes.keys()) {
            const [o, r] = t.split("_").map(Number),
                n = o * this.chunkSizeX,
                a = Math.min((o + 1) * this.chunkSizeX, this.width),
                l = r * this.chunkSizeZ,
                d = Math.min((r + 1) * this.chunkSizeZ, this.height);
            for (let t = n; t < a; t++)
                for (let n = l; n < d; n++) {
                    const a = this.getGroundHeight(t, n);
                    if (!(a < 0))
                        for (let l = a; l >= Math.max(0, a - 3); l--) {
                            if (this.getTile(t, l, n) !== h) {
                                const e = `${t}_${l}_${n}`;
                                i.has(e) && i.delete(e);
                                continue;
                            }
                            let a = !1;
                            for (let e = l + 1; e < this.depth; e++)
                                if (0 !== this.getTile(t, e, n)) {
                                    a = !0;
                                    break;
                                }
                            const d = `${t}_${l}_${n}`;
                            if (a) {
                                const h = (i.get(d) || 0) + e;
                                if (h >= 2.5) {
                                    const e = `${t}_${l}_${n}`;
                                    if (this._bushProtected && this._bushProtected.has(e)) {
                                        i.delete(d);
                                        continue;
                                    }
                                    this.setTile(t, l, n, s), this.updateBlockAndLight(t, l, n), i.delete(d);
                                    const h = `${o}_${r}`;
                                    if (this.loadedChunkMeshes.has(h)) {
                                        const t = this.loadedChunkMeshes.get(h);
                                        (t.userData._needsRebuild = !0), (t.userData._doubleRebuild = !0);
                                    }
                                } else i.set(d, h);
                            } else i.has(d) && i.delete(d);
                        }
                }
        }
    }
    async saveToDB() {
        try {
            if (!window.websimRoom || !window.websim) return !1;
            const t = await window.websim.getCurrentUser();
            if (!t || !t.username) return !1;
            const e = window.websimRoom.collection("world");
            if (!e) return !1;
            const i =
                    window.player && "number" == typeof window.player.x ? { player_x: window.player.x, player_y: window.player.y, player_z: window.player.z, player_yaw: window.player.yRotation, player_pitch: window.player.xRotation } : {},
                s = { username: t.username, width: this.width, height: this.height, depth: this.depth, blocks: Array.from(this.blocks || []), lightDepths: Array.from(this.lightDepths || []), created_at: new Date().toISOString(), ...i };
            let h = [];
            try {
                h = e.filter({ username: t.username }).getList();
            } catch (t) {}
            return (
                Array.isArray(h) && h.length > 0
                    ? await e.update(h[0].id, s).catch(async () => {
                          await e.create(s).catch(() => {});
                      })
                    : await e.create(s).catch(() => {}),
                !0
            );
        } catch (t) {
            return !1;
        }
    }
}
