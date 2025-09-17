import { THREE, loadRGBELoader } from "./LibHandler.js";
import { World } from "./level/World.js";
import { Player } from "./Player.js";
import { Tiles } from "./render/Tile.js";
import Font from "./render/font.js";
import { Zombie } from "./character/Zombie.js";
import { ParticleEngine } from "./render/particle/ParticleEngine.js";
import { placeOnTop, placeOnBottom, breakBottom, _playBreakSoundForTile, computeBlockTargetFromRay } from "./PlaceHandler.js";
class RubyDung {
    constructor() {
        (this.scene = new THREE.Scene()), (this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e3));
        const e = document.querySelector("#canvas"),
            t = e.getContext && e.getContext("webgl2");
        (this.renderer = new THREE.WebGLRenderer({ canvas: e, antialias: !0, context: t || void 0, powerPreference: "high-performance" })),
            (this.renderer.shadowMap.enabled = !1),
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)),
            this.renderer.setSize(window.innerWidth, window.innerHeight),
            (this.player = null),
            (this.world = null),
            (this.textureCache = {}),
            (this.worldInitialized = !1),
            (this.lastTime = performance.now()),
            (this.frameCount = 0),
            (this.startTime = 0),
            (this.worldRevealStartTime = 0),
            (this.layerRevealDuration = 100),
            (this.blockMaterials = []),
            (this.materialIndexMap = {}),
            (this.renderDistance = 3),
            (this.currentLoadedChunkCount = 0),
            (this.selectedTileId = 1),
            (this.previewCanvas = null),
            (this.raycaster = new THREE.Raycaster()),
            (this.mouse = new THREE.Vector2(0, 0)),
            (this.userSelectedBlock = !1),
            (this.grassTimers = new Map()),
            (this.coveredGrassTimers = new Map()),
            (this.chunkUpdateCount = 0),
            (this._initiallyLoadedChunks = new Set()),
            (this._chunkEditCounts = new Map()),
            (this._accumFrameDeltaMs = 0),
            (this._accumFrameCount = 0),
            (this.font = new Font("/default.gif")),
            (this._versionOverlayCanvas = null),
            (this._versionNeedsRedraw = !0),
            (this.highlightMesh = null),
            (this.highlightPulseSpeed = 0.08),
            (this.isPlacementMode = !1),
            (this.placementPreviewMesh = null),
            (this._currentPreviewTarget = null),
            (this.zombies = []),
            (this.charTexture = null),
            (this.particles = null),
            (this.interactionsLocked = !1),
            (this.peer = null),
            (this.peerId = null),
            (this.joinTarget = null),
            (this.remotePlayers = new Map()),
            (this._playerJoinCounter = 0);
        const i = /JOIN(\w+)/.exec(location.href);
        i && (this.joinTarget = i[1]), (window.game = this), (window.showZombiePaths = !!window.showZombiePaths), this.init();
    }
    async loadTexture(e) {
        if (this.textureCache[e]) return this.textureCache[e];
        try {
            let t = e;
            t = t.replace(/^\.+\/+/, "").replace(/^\//, "");
            const i = "zip_img_" + t,
                s = "undefined" != typeof window && window[i] ? window[i] : e,
                r = await new THREE.TextureLoader().loadAsync(s);
            return (r.magFilter = THREE.NearestFilter), (r.minFilter = THREE.NearestFilter), (this.textureCache[e] = r), r;
        } catch (t) {
            try {
                const t = await new THREE.TextureLoader().loadAsync(e);
                return (t.magFilter = THREE.NearestFilter), (t.minFilter = THREE.NearestFilter), (this.textureCache[e] = t), t;
            } catch (i) {
                return console.warn("[loadTexture] failed to load", e, t), null;
            }
        }
    }
    async _ensureUnz() {
        try {
            if (window._zip_inited) return;
            void 0 === window.JSZip &&
                (await new Promise((e, t) => {
                    const i = document.createElement("script");
                    (i.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"), (i.onload = () => e()), (i.onerror = (e) => t(e)), document.head.appendChild(i);
                }));
            const e = await fetch("/ASSETS.zip");
            if (!e.ok) throw new Error("ASSETS.zip fetch failed");
            const t = await e.arrayBuffer(),
                i = await window.JSZip.loadAsync(t),
                s = Object.keys(i.files);
            for (const e of s)
                try {
                    const t = i.file(e);
                    if (!t) continue;
                    const s = e.toLowerCase();
                    if (s.endsWith(".mp3") || s.endsWith(".ogg") || s.endsWith(".wav")) {
                        const i = await t.async("uint8array"),
                            r = s.endsWith(".ogg") ? "audio/ogg" : s.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
                        window["zip_audio_" + e] = URL.createObjectURL(new Blob([i], { type: r }));
                    } else if (/\.(png|webp|jpg|jpeg|gif)$/.test(s)) {
                        const i = await t.async("blob");
                        window["zip_img_" + e] = URL.createObjectURL(i);
                    } else {
                        const i = await t.async("blob");
                        window["zip_blob_" + e] = i;
                    }
                } catch (e) {}
            window._zip_inited = !0;
        } catch (e) {
            console.warn("zip init failed", e);
        }
    }
    async init() {
        await this._ensureUnz(), this.setupScene(), this.setupControls(), this.setupBlockPreviewUI();
        const e = new THREE.BoxGeometry(1, 1, 1);
        (this.highlightMaterial = new THREE.MeshBasicMaterial({ color: 16777215, transparent: !0, opacity: 0, depthTest: !1, depthWrite: !1, side: THREE.DoubleSide })),
            (this.highlightMesh = new THREE.Mesh(e, this.highlightMaterial)),
            (this.highlightMesh.visible = !1),
            (this.highlightMesh.renderOrder = 999),
            this.scene.add(this.highlightMesh);
        const t = new THREE.BoxGeometry(1, 1, 1);
        (this.placementPreviewMaterial = new THREE.MeshBasicMaterial({ color: 16777215, transparent: !0, opacity: 0, depthTest: !1, depthWrite: !1, side: THREE.DoubleSide, alphaTest: 0.01 })),
            (this.placementPreviewMesh = new THREE.Mesh(t, this.placementPreviewMaterial)),
            (this.placementPreviewMesh.visible = !1),
            (this.placementPreviewMesh.renderOrder = 998),
            this.scene.add(this.placementPreviewMesh),
            (this.bushPreviewGroup = new THREE.Group());
        const i = new THREE.PlaneGeometry(1, 1),
            s = new THREE.PlaneGeometry(1, 1);
        (this.bushPreviewMatA = new THREE.MeshBasicMaterial({ map: null, transparent: !0, depthTest: !1, depthWrite: !1, side: THREE.DoubleSide, alphaTest: 0.01 })), (this.bushPreviewMatB = this.bushPreviewMatA.clone());
        const r = new THREE.Mesh(i, this.bushPreviewMatA),
            a = new THREE.Mesh(s, this.bushPreviewMatB);
        (r.rotation.y = Math.PI / 4), (a.rotation.y = -Math.PI / 4), this.bushPreviewGroup.add(r, a), (this.bushPreviewGroup.visible = !1), (this.bushPreviewGroup.renderOrder = 997), this.scene.add(this.bushPreviewGroup);
        const o = await this.loadTexture("1.png"),
            n = await this.loadTexture("water.png"),
            h = await this.loadTexture("grass_side.png"),
            l = await this.loadTexture("2.png"),
            d = await this.loadTexture("stone.png"),
            c = await this.loadTexture("dirt.png"),
            u = await this.loadTexture("rock.png"),
            p = await this.loadTexture("cobble3.png"),
            w = await this.loadTexture("wood.png"),
            m = await this.loadTexture("bush-block.png"),
            f = await this.loadTexture("wood4.png"),
            v = await this.loadTexture("stone1.png"),
            g = await this.loadTexture("dirt2.png"),
            y = (e, t = {}) => {
                if (!e || !e.image) return e;
                const i = e.image,
                    s = i.width || 64,
                    r = i.height || 64,
                    a = document.createElement("canvas");
                (a.width = s), (a.height = r);
                const o = a.getContext("2d");
                try {
                    (o.imageSmoothingEnabled = !1), o.drawImage(i, 0, 0, s, r);
                } catch (t) {
                    return e;
                }
                const n = o.getImageData(0, 0, s, r),
                    h = n.data;
                for (let e = 0; e < h.length; e += 4) {
                    const i = h[e],
                        s = h[e + 1],
                        r = h[e + 2],
                        a = h[e + 3];
                    a > 10 && i > 100 && i > 1.5 * s + 20 && i > 1.5 * r + 20 ? (h[e + 3] = 0) : ((a > 10 && i < 30 && s < 30 && r < 30) || (t.removeWhite && a > 10 && i > 220 && s > 220 && r > 220)) && (h[e + 3] = 0);
                }
                o.putImageData(n, 0, 0);
                const l = new THREE.CanvasTexture(a);
                return (l.magFilter = THREE.NearestFilter), (l.minFilter = THREE.NearestFilter), l;
            },
            b = y(d),
            T = y(c),
            M = y(p),
            x = y(w),
            k = y(m, { removeWhite: !0 }),
            _ = y(u),
            C = y(f),
            E = y(v),
            P = y(g);
        (this.charTexture = await this.loadTexture("char.png")), (this.scene.background = new THREE.Color(8441084));
        const I = { 1: o, grass_side: h, water: n, 2: l, stone: b, bedrock: _, dirt: T, cobble3: M, wood: x, bush: k, stone_preview: E, dirt_preview: P };
        this.previewTextures = { stone_preview: E, dirt_preview: P, cobble_preview: M, wood4_preview: C, bush_preview: k };
        let R = 0;
        for (const e in I) {
            const t = "1" === e || "grass_side" === e ? new THREE.Vector3(1.06, 1.06, 1.02) : new THREE.Vector3(1, 1, 1);
            "water" === e && t.set(0.75, 0.9, 1.06);
            const i = new THREE.ShaderMaterial({
                uniforms: {
                    tDiffuse: { value: I[e] },
                    uMaxVisibleY: { value: 0 },
                    uCurrentLayerXProgress: { value: 0 },
                    uWorldWidth: { value: 1 },
                    uCameraPosition: { value: new THREE.Vector3() },
                    uMinDarknessDistance: { value: 5 },
                    uMaxDarknessDistance: { value: 20 },
                    uIsWorldRevealing: { value: 0 },
                    uSpecialRevealFinished: { value: 1 },
                    uTint: { value: t },
                    uAlpha: { value: "water" === e || "bush" === e ? 0.9 : 1 },
                },
                vertexShader:
                    "\n            attribute float isSunlit; \n            attribute float isSideBoundaryFace; // NEW: Declare side boundary face attribute\n            attribute float isBottomBoundaryFace; // NEW: Declare bottom boundary face attribute\n            varying vec2 vUv;\n            varying vec3 vColor;\n            varying vec3 vWorldPosition; \n            varying float vIsSunlit; \n            varying float vIsSideBoundaryFace; // NEW\n            varying float vIsBottomBoundaryFace; // NEW\n\n            void main() {\n                vUv = uv;\n                vColor = color;\n                vWorldPosition = position; \n                vIsSunlit = isSunlit; \n                vIsSideBoundaryFace = isSideBoundaryFace; // NEW\n                vIsBottomBoundaryFace = isBottomBoundaryFace; // NEW\n                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n            }\n        ",
                fragmentShader:
                    "\n            uniform sampler2D tDiffuse;\n            uniform float uAlpha; // NEW: per-material alpha control\n            uniform float uMaxVisibleY; \n            uniform float uCurrentLayerXProgress; \n            uniform float uWorldWidth; \n            uniform vec3 uCameraPosition; \n            uniform float uMinDarknessDistance; \n            uniform float uMaxDarknessDistance; \n            uniform float uIsWorldRevealing; // Flag to indicate if world reveal animation is active\n            uniform float uSpecialRevealFinished; // NEW: Flag for when special faces (walls/bottom) should be revealed\n            uniform vec3 uTint; // NEW: per-material RGB tint\n\n            varying vec2 vUv;\n            varying vec3 vColor;\n            varying vec3 vWorldPosition; \n            varying float vIsSunlit; \n            varying float vIsSideBoundaryFace; // NEW\n            varying float vIsBottomBoundaryFace; // NEW\n\n            void main() {\n                // Check if this fragment belongs to a \"special\" face (inner side wall or world bottom face)\n                bool isSpecialFace = (vIsSideBoundaryFace > 0.5) || (vIsBottomBoundaryFace > 0.5);\n\n                if (uIsWorldRevealing > 0.5) { // If world reveal animation is active\n                    if (isSpecialFace) {\n                        // If it's a special face, discard it UNLESS the special reveal phase has started\n                        if (uSpecialRevealFinished < 0.5) {\n                            discard;\n                        }\n                    } else { // Not a special face, apply regular reveal animation\n                        // Initial reveal: Discard fragments that are clearly above the currently revealing Y level\n                        // Adding a small epsilon for float precision\n                        if (vWorldPosition.y > uMaxVisibleY + 0.001) {\n                            discard;\n                        }\n\n                        // If this fragment is on the exact Y layer currently being revealed horizontally\n                        // We use floor(uMaxVisibleY) to get the integer Y layer currently animated.\n                        // vWorldPosition.y might not be exactly equal to uMaxVisibleY due to interpolation across faces.\n                        // So we check if floor(vWorldPosition.y) is the current revealing layer.\n                        if (floor(vWorldPosition.y) == floor(uMaxVisibleY)) {\n                            // Normalize the fragment's X position to 0-1 range based on world width\n                            float normalizedX = vWorldPosition.x / uWorldWidth;\n                            \n                            // Discard if the normalized X is beyond the current horizontal progress\n                            // Adding a small epsilon for float precision\n                            if (normalizedX > uCurrentLayerXProgress + 0.001) {\n                                discard;\n                            }\n                        }\n                    }\n                }\n                \n                vec4 texColor = texture2D(tDiffuse, vUv);\n                vec3 finalColor = texColor.rgb * vColor; // Apply brightness from vertex color\n\n                // Apply per-material tint (brighten/darken colors slightly)\n                finalColor *= uTint; // NEW: tint multiply\n\n                // Calculate distance to camera\n                float dist = distance(vWorldPosition, uCameraPosition);\n\n                // Apply distance-based darkness: mix original color with black based on distance\n                // Only apply darkness if the surface is *not* sunlit (vIsSunlit is 0.0 for shadowed, 1.0 for sunlit)\n                if (vIsSunlit < 0.5) { \n                    float darkness_amount = smoothstep(uMinDarknessDistance, uMaxDarknessDistance, dist);\n                    finalColor = mix(finalColor, vec3(0.0), darkness_amount); // Mix with black\n                }\n\n                gl_FragColor = vec4(finalColor, texColor.a * uAlpha);\n            }\n        ",
                vertexColors: !0,
                side: THREE.DoubleSide,
                transparent: "water" === e || "bush" === e,
                alphaTest: 0.01,
            });
            this.blockMaterials.push(i), (this.materialIndexMap[e] = R++);
        }
        (this.world = new World(this.blockMaterials, this.materialIndexMap)), await this.world.init(), (this.worldInitialized = !0), (this.worldRevealStartTime = 0), (this.p2p = window.P2PNetwork || null);
        try {
            this.p2p &&
                "function" == typeof this.p2p.onIncoming &&
                this.p2p.onIncoming(async (e, t) => {
                    try {
                        if (!t || "object" != typeof t) return;
                        if ("request_world" === t.type || "request_world_dat" === t.type) {
                            if (window.SaveSystem && "function" == typeof window.SaveSystem.exportDat)
                                try {
                                    const t = await window.SaveSystem.exportDat();
                                    return void (await this.p2p.sendTo(e, { type: "world_dat", width: this.world.width, height: this.world.height, depth: this.world.depth, buffer: t }));
                                } catch (e) {}
                            const t = { type: "world_state", width: this.world.width, height: this.world.height, depth: this.world.depth, blocks: Array.from(this.world.blocks || []), lightDepths: Array.from(this.world.lightDepths || []) };
                            try {
                                await this.p2p.sendTo(e, t);
                            } catch (i) {
                                try {
                                    await this.p2p.sendTo(e, JSON.stringify(t));
                                } catch (e) {}
                            }
                            return;
                        }
                        if ("request_minimap" === t.type) {
                            try {
                                const t = await this._generateMinimapDataURL();
                                await this.p2p.sendTo(e, { type: "asset_png", purpose: "minimap", dataUrl: t });
                            } catch (e) {}
                            return;
                        }
                        if ("request_zombies" === t.type) {
                            const t = this.zombies.map((e) => ({ id: e._id || null, x: e.x, y: e.y, z: e.z, removed: !!e.removed }));
                            return void (await this.p2p.sendTo(e, { type: "zombie_snapshot", zombies: t }));
                        }
                        if ("block_update" === t.type && Number.isInteger(t.x)) {
                            return void (this.world.getTile(t.x, t.y, t.z) !== t.tileId && (this.world.setTile(t.x, t.y, t.z, t.tileId), this.refreshChunkForBlock(t.x, t.y, t.z)));
                        }
                        if ("player_update" === t.type && t.id)
                            return (window.peersLive = window.peersLive || {}), void (window.peersLive[t.id] = { id: t.id, x: t.pos?.x, y: t.pos?.y, z: t.pos?.z, yaw: t.yaw, pitch: t.pitch || 0, model: t.model || null });
                    } catch (e) {
                        console.warn("[P2P] onIncoming handler error", e);
                    }
                });
        } catch (e) {
            console.warn("P2P handler registration failed", e);
        }
        try {
            this.p2p &&
                "function" == typeof this.p2p.onIncoming &&
                this.p2p.onIncoming((e, t) => {
                    try {
                        if (t instanceof ArrayBuffer)
                            try {
                                const e = new DataView(t),
                                    i = e.getUint32(0, !0),
                                    s = e.getUint32(4, !0),
                                    r = e.getUint32(8, !0),
                                    a = 12,
                                    o = (new Uint8Array(t.slice(a, a + (i * s * r) / r)), i * r * s ? i * r * s : this.world.width * this.world.height * this.world.depth),
                                    n = new Uint8Array(t, a, o),
                                    h = new Uint8Array(t, a + o);
                                return (
                                    (this.world.width = i),
                                    (this.world.height = s),
                                    (this.world.depth = r),
                                    (this.world.blocks = new Uint8Array(n)),
                                    (this.world.lightDepths = new Uint8Array(h)),
                                    void ("function" == typeof this.world.onReady && this.world.onReady())
                                );
                            } catch (e) {}
                        if (!t || "object" != typeof t) return;
                        if ("asset_png" === t.type && "minimap" === t.purpose && t.dataUrl) {
                            try {
                                const i = document.createElement("a");
                                (i.href = t.dataUrl), (i.target = "_blank"), (i.textContent = `Minimap from ${e}`), (i.style.color = "#4ea3ff"), window.gameChat && window.gameChat.push("[SERVER] Received minimap: " + i.textContent);
                            } catch (e) {}
                            return;
                        }
                        if ("zombie_update" === t.type && Array.isArray(t.zombies)) {
                            (window.remoteZombies = window.remoteZombies || {}), (window.remoteZombies[e] = t.zombies);
                            try {
                                (window._remoteZombieGroup = window._remoteZombieGroup || new THREE.Group()),
                                    this.scene.getObjectByName("_remoteZombieGroup") || ((window._remoteZombieGroup.name = "_remoteZombieGroup"), this.scene.add(window._remoteZombieGroup));
                                const i = `rz_${e}_`;
                                for (let e = 0; e < t.zombies.length; e++) {
                                    const s = t.zombies[e],
                                        r = i + e;
                                    let a = window._remoteZombieGroup.getObjectByName(r);
                                    if (!a) {
                                        const e = document.createElement("canvas");
                                        (e.width = 32), (e.height = 32);
                                        const t = e.getContext("2d");
                                        (t.fillStyle = "rgba(120,20,20,1)"), t.fillRect(0, 0, 32, 32);
                                        const i = new THREE.CanvasTexture(e),
                                            s = new THREE.SpriteMaterial({ map: i });
                                        (a = new THREE.Sprite(s)), (a.name = r), a.scale.set(0.6, 0.6, 0.6), window._remoteZombieGroup.add(a);
                                    }
                                    s && "number" == typeof s.x && a.position.set(s.x, s.y || 0, s.z || 0), (a.visible = !s.removed);
                                }
                            } catch (e) {}
                            return;
                        }
                        if ("zombie_snapshot" === t.type && Array.isArray(t.zombies)) return (window.remoteZombieSnapshots = window.remoteZombieSnapshots || {}), void (window.remoteZombieSnapshots[e] = t.zombies);
                    } catch (e) {
                        console.warn("[P2P] incoming asset handler failed", e);
                    }
                });
        } catch (e) {
            console.warn("P2P incoming registration failed", e);
        }
        (this.player = new Player(this.scene, this.camera, this.world)),
            this.player.resetPosition(),
            (this.particles = new ParticleEngine(this.scene, this.world, T)),
            window.addEventListener("mousedown", (e) => {
                if (this.worldInitialized && !this.interactionsLocked) {
                    if (0 === e.button) {
                        if (this.isPlacementMode) {
                            if (this._currentPreviewTarget) {
                                const { x: e, y: t, z: i } = this._currentPreviewTarget;
                                0 === this.world.getTile(e, t, i) && (this.world.setTile(e, t, i, this.selectedTileId), this.refreshChunkForBlock(e, t, i), this.particles && this.particles.burst(e + 0.5, t + 0.5, i + 0.5, 4, 0.12));
                            }
                            return;
                        }
                        this.attemptEditBlock("break", e);
                    }
                    2 === e.button && this.attemptEditBlock("place", e);
                }
            }),
            window.addEventListener("contextmenu", (e) => e.preventDefault()),
            window.addEventListener("keydown", async (e) => {
                try {
                    if ("n" === e.key || "N" === e.key) return void window.location.reload();
                    if ((("y" !== e.key && "Y" !== e.key) || (this.player && ((this.player.invertMouseY = !this.player.invertMouseY), console.log("invertMouseY:", this.player.invertMouseY))), "KeyF" === e.code)) {
                        const e = [2, 3, 5],
                            t = e.indexOf(this.renderDistance);
                        (this.renderDistance = e[(t + 1) % e.length]), console.log("renderDistance ->", this.renderDistance), (this._versionNeedsRedraw = !0);
                    }
                } catch (e) {
                    console.warn("global key handler error", e);
                }
            }),
            window.addEventListener("keydown", (e) => {
                "Digit1" === e.code && (this.selectedTileId = 1),
                    "Digit2" === e.code && (this.selectedTileId = 2),
                    "Digit3" === e.code && (this.selectedTileId = 3),
                    "Digit4" === e.code && (this.selectedTileId = 4),
                    "Digit6" === e.code && (this.selectedTileId = 6),
                    (this.userSelectedBlock = !0),
                    this.updateBlockPreview();
                const t = this._resolveTextureForSelected();
                t && (this.placementPreviewMaterial.map = t);
            }),
            window.addEventListener("keydown", (e) => {
                if (
                    "Digit8" === e.code &&
                    this.player &&
                    this.player.thirdPerson &&
                    ((this.interactionsLocked = !this.interactionsLocked),
                    this.interactionsLocked &&
                        ((this.isPlacementMode = !1),
                        this.placementPreviewMesh && (this.placementPreviewMesh.visible = !1),
                        this.bushPreviewGroup && (this.bushPreviewGroup.visible = !1),
                        this.highlightMesh && (this.highlightMesh.visible = !1),
                        this.highlightMaterial && (this.highlightMaterial.opacity = 0),
                        this.placementPreviewMaterial && (this.placementPreviewMaterial.opacity = 0),
                        this.particles && Array.isArray(this.particles.particles)))
                ) {
                    for (const e of this.particles.particles)
                        try {
                            e.remove();
                        } catch (e) {}
                    this.particles.particles.length = 0;
                }
            }),
            this.spawnZombies(5),
            this.animate(),
            this.startFPSTimer(),
            this._drawVersionText(),
            (this._raycastIntervalMs = 33),
            (this._uniformIntervalMs = 33),
            (this._logicIntervalMs = 200),
            (this._lastRaycastAt = 0),
            (this._lastUniformAt = 0),
            (this._lastLogicAt = 0);
    }
    spawnZombies(e) {
        for (let t = 0; t < e; t++) {
            const e = Math.random() * (this.world.width - 20) + 10,
                t = Math.random() * (this.world.height - 20) + 10,
                i = this.world.getGroundHeight(Math.floor(e), Math.floor(t)) + 2,
                s = new Zombie(this.world, e, i, t, this.charTexture);
            s.addToScene(this.scene), this.zombies.push(s), (window.entities = window.entities || []), window.entities.push(s), "function" == typeof s.setPathVisibility && s.setPathVisibility(!!window.showZombiePaths);
        }
    }
    setupScene() {
        const e = new THREE.AmbientLight(16777215, 1);
        this.scene.add(e),
            (this.renderer.toneMappingExposure = -0.39),
            (async () => {
                try {
                    const e = await loadRGBELoader(),
                        t = new THREE.PMREMGenerator(this.renderer);
                    t.compileEquirectangularShader();
                    const i = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/footprint_court_1k.hdr",
                        s = await new e().setDataType(THREE.UnsignedByteType).loadAsync(i),
                        r = t.fromEquirectangular(s).texture;
                    (this.scene.environment = r), (this.scene.background = r), s.dispose(), t.dispose();
                } catch (e) {
                    console.warn("HDR load failed", e);
                }
            })(),
            window.addEventListener("resize", this.onWindowResize.bind(this), !1);
        const t = document.getElementById("ui");
        if (t) {
            const e = document.createElement("canvas");
            (e.width = 480),
                (e.height = 128),
                (e.style.width = "480px"),
                (e.style.height = "128px"),
                (e.style.imageRendering = "pixelated"),
                (e.style.pointerEvents = "none"),
                t.appendChild(e),
                (this._versionOverlayCanvas = e),
                this._drawVersionText();
        }
    }
    setupControls() {}
    setupBlockPreviewUI() {
        (this.previewCanvas = document.getElementById("block-preview-canvas")), this.updateBlockPreview();
    }
    updateBlockPreview() {
        if (!this.previewCanvas) return;
        const e = this.previewCanvas.getContext("2d");
        e.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        const t = this.previewTextures || {},
            i = (e) => {
                if (!e) return null;
                const t = e.width || 64,
                    i = e.height || 64,
                    s = document.createElement("canvas");
                (s.width = t), (s.height = i);
                const r = s.getContext("2d");
                r.imageSmoothingEnabled = !1;
                try {
                    r.drawImage(e, 0, 0, t, i);
                } catch (t) {
                    return e;
                }
                const a = r.getImageData(0, 0, t, i),
                    o = a.data;
                for (let e = 0; e < o.length; e += 4) {
                    const t = o[e],
                        i = o[e + 1],
                        s = o[e + 2];
                    o[e + 3] > 10 && t > 100 && t > 1.5 * i + 20 && t > 1.5 * s + 20 && (o[e + 3] = 0);
                }
                return r.putImageData(a, 0, 0), s;
            };
        let s = null;
        try {
            if (this.userSelectedBlock)
                if (1 === this.selectedTileId) {
                    const e = this.textureCache["./stone1.png"]?.image || t.stone_preview?.image || null;
                    s = i(e) || e;
                } else if (2 === this.selectedTileId) {
                    const e = this.textureCache["./dirt2.png"]?.image || t.dirt_preview?.image || null;
                    s = i(e) || e;
                } else if (3 === this.selectedTileId) {
                    const e = this.textureCache["./cobble3.png"]?.image || t.cobble_preview?.image || null;
                    s = i(e) || e;
                } else if (6 === this.selectedTileId) {
                    const e = this.textureCache["./bush-block.png"]?.image || t.bush_preview?.image || null;
                    s = i(e) || e;
                } else if (4 === this.selectedTileId) {
                    const e = t.wood4_preview?.image || this.textureCache["./wood4.png"]?.image || null;
                    s = i(e) || e;
                } else {
                    const e = Tiles.byId?.[this.selectedTileId],
                        r = e && e.getTextureKey ? e.getTextureKey(0) : "2",
                        a = this.materialIndexMap ? this.materialIndexMap[r] : void 0,
                        o = Number.isInteger(a) ? this.blockMaterials[a] : void 0,
                        n = o && o.uniforms ? o.uniforms.tDiffuse.value : void 0,
                        h = this.textureCache[`./${r}.png`]?.image || n?.image || t.cobble_preview?.image || null;
                    s = i(h) || h;
                }
            else {
                const e = this.materialIndexMap && (this.materialIndexMap.stone ?? this.materialIndexMap[1]),
                    r = Number.isInteger(e) ? this.blockMaterials[e] : void 0,
                    a = r && r.uniforms ? r.uniforms.tDiffuse?.value : void 0,
                    o = a?.image || this.textureCache["./stone1.png"]?.image || t.stone_preview?.image || null;
                s = i(o) || o;
            }
        } catch (e) {
            s = null;
        }
        const r = (t) => {
            try {
                (e.imageSmoothingEnabled = !1),
                    (e.fillStyle = "rgba(0,0,0,0)"),
                    e.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height),
                    e.drawImage(t, 0, 0, t.width, t.height, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
            } catch (t) {
                (e.fillStyle = "#666"), e.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            }
        };
        if (s) return void r(s);
        const a = "./stone1.png",
            o = this.textureCache[a];
        if (o && o.image) return void r(i(o.image) || o.image);
        const n = new Image();
        (n.onload = () => {
            (this.textureCache[a] = { image: n }), r(i(n) || n);
        }),
            (n.onerror = () => {
                (e.fillStyle = "#666"), e.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            }),
            (n.src = a);
    }
    _resolveTextureForSelected() {
        const e = Tiles.byId?.[this.selectedTileId];
        if (6 === this.selectedTileId) return this.previewTextures?.bush_preview || null;
        const t = e && e.getTextureKey ? e.getTextureKey(4) : "stone",
            i = this.materialIndexMap?.[t],
            s = Number.isInteger(i) ? this.blockMaterials[i] : null;
        return s && s.uniforms ? s.uniforms.tDiffuse.value : (this.textureCache[`./${t}.png`] || {}).image ? new THREE.TextureLoader().load(`./${t}.png`) : null;
    }
    _drawVersionText() {
        if (!this._versionOverlayCanvas) return;
        if ("function" == typeof drawVersionImageToCanvas)
            try {
                drawVersionImageToCanvas(this._versionOverlayCanvas);
            } catch (e) {}
        const e = this._versionOverlayCanvas.getContext("2d");
        if (!e) return;
        if (!this.font.ready) return void setTimeout(() => this._drawVersionText(), 100);
        e.clearRect(0, 0, this._versionOverlayCanvas.width, this._versionOverlayCanvas.height), (e.imageSmoothingEnabled = !1), e.save(), e.scale(2, 2);
        const t = `${"number" == typeof this.lastDisplayedFPS ? this.lastDisplayedFPS : 0} fps, ${"number" == typeof this.lastDisplayedChunkCount ? this.lastDisplayedChunkCount : this.chunkUpdateCount} chunk updates`;
        let i = 0;
        for (let s = 0; s < t.length; s++) {
            if ("updates" === t.substr(s, 7).toLowerCase()) {
                const r = 6;
                for (let a = 0; a < 7; a++) {
                    const o = t[s + a];
                    this.font.draw(e, o, i + 1, 13, "rgba(63,63,63,1)", !0), this.font.draw(e, o, i, 12, "#ffffff", !1), (i += r), 4 === a && (i -= 1);
                }
                s += 6;
                continue;
            }
            const r = t[s],
                a = r.charCodeAt(0),
                o = this.font.charWidths && this.font.charWidths[a] ? this.font.charWidths[a] : Math.floor(this.font.image.width / 16 || 8);
            let n = Math.max(1, o - 1);
            "d" === r && (n = Math.max(1, n - 2)), ("t" !== r && "e" !== r) || (n = Math.max(1, n - 4)), "a" === r && (n += 1);
            const h = t[s + 1] || "",
                l = t[s - 1] || "";
            /(f|p|s)/i.test(r) && (/(f|p|s)/i.test(h) || /(f|p|s)/i.test(l)) && (n = Math.max(1, o - 2)),
                "e" === r && "s" === h && (n = Math.max(1, o - 5)),
                "s" === r && "e" === l && (n = Math.max(1, o - 4)),
                "a" === r && "t" === h && (n = Math.max(1, o - 1)),
                "t" === r && "a" === l && (n = Math.max(1, o - 4)),
                "p" === l ? (n = Math.max(1, o - 3)) : "a" === h && (n = Math.max(1, o - 2));
            const d = t.substr(s).toLowerCase(),
                c = /\d/.test(r),
                u = d.startsWith("fps"),
                p = d.startsWith("chunk"),
                w = "rgba(63,63,63,1)",
                m = c || u || p;
            this.font.draw(e, r, i + 1, 13, w, m), this.font.draw(e, r, i, 12, "#ffffff", !1), (i += n);
        }
        e.restore();
    }
    attemptEditBlock(e, t = null) {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const i = Array.from(this.world.loadedChunkMeshes.values()),
            s = this.raycaster.intersectObjects(i, !0);
        if (0 === s.length) {
            if ("break" === e && this.player) {
                const e = Math.floor(this.player.x),
                    t = this.player.boundingBox ? this.player.boundingBox.minY : this.player.y - 1.62,
                    i = Math.floor(t - 0.01),
                    s = Math.floor(this.player.z),
                    r = [1, 0, -1, -2, -3, -4, -5];
                for (const t of r) {
                    const r = i + t;
                    if (r < 0 || r >= this.world.depth) continue;
                    const a = this.world.getTile(e, r, s);
                    if (0 !== a) {
                        const t = a;
                        if (t === (Tiles.bedrock && Tiles.bedrock.id)) break;
                        this.world.setTile(e, r, s, 0);
                        const i = this._textureForTileId(t);
                        this.particles && this.particles.burst(e + 0.5, r + 0.5, s + 0.5, 8, 0.2, i);
                        try {
                            _playBreakSoundForTile(t);
                        } catch (e) {}
                        break;
                    }
                }
            }
            return;
        }
        const r = s[0],
            a = r.point.clone(),
            o = r.face.normal.clone(),
            n = new THREE.Matrix3().getNormalMatrix(r.object.matrixWorld),
            h = o.applyMatrix3(n).normalize(),
            l = 0.01;
        if ("break" === e) {
            const e = 0.01;
            let t = !1;
            const i = 8;
            let s = null;
            for (let r = 0; r <= i && !t; r++) {
                const i = 0 === r ? e : e + 0.02 * r,
                    o = a.clone().sub(h.clone().multiplyScalar(i)),
                    n = Math.floor(o.x),
                    l = Math.floor(o.y),
                    d = Math.floor(o.z);
                if (n < 0 || d < 0 || l < 0 || n >= this.world.width || d >= this.world.height || l >= this.world.depth) continue;
                const c = this.world.getTile(n, l, d);
                if (0 !== c) {
                    (s = { x: n, y: l, z: d, id: c }), (t = !0);
                    break;
                }
            }
            for (let r = 1; !t && r <= i; r++) {
                const i = e + 0.02 * r,
                    o = a.clone().add(h.clone().multiplyScalar(i)),
                    n = Math.floor(o.x),
                    l = Math.floor(o.y),
                    d = Math.floor(o.z);
                if (n < 0 || d < 0 || l < 0 || n >= this.world.width || d >= this.world.height || l >= this.world.depth) continue;
                const c = this.world.getTile(n, l, d);
                if (0 !== c) {
                    (s = { x: n, y: l, z: d, id: c }), (t = !0);
                    break;
                }
            }
            if (s && s.id !== (Tiles.bedrock && Tiles.bedrock.id)) {
                this.world.setTile(s.x, s.y, s.z, 0), this.refreshChunkForBlock(s.x, s.y, s.z);
                const e = this._textureForTileId(s.id);
                this.particles && this.particles.burst(s.x + 0.5, s.y + 0.5, s.z + 0.5, 8, 0.2, e);
                try {
                    _playBreakSoundForTile(s.id);
                } catch (e) {}
            }
        } else if ("place" === e) {
            const e = r.face.normal.clone(),
                i = new THREE.Matrix3().getNormalMatrix(r.object.matrixWorld),
                s = e.applyMatrix3(i).normalize();
            let a, o, n;
            const h = (this.camera ? this.camera.position.y : this.player ? this.player.y : 0) > r.point.y + 0.1;
            if (s.y > 0.5) (a = Math.floor(r.point.x)), (n = Math.floor(r.point.z)), (o = h ? Math.floor(r.point.y) + 1 : Math.floor(r.point.y) - 1);
            else if (s.y < -0.5) (a = Math.floor(r.point.x)), (o = Math.floor(r.point.y) - 1), (n = Math.floor(r.point.z));
            else {
                const e = Math.floor(r.point.x - s.x * l),
                    t = Math.floor(r.point.y - s.y * l),
                    i = Math.floor(r.point.z - s.z * l);
                (a = e + Math.sign(Math.round(s.x))), (o = t + Math.sign(Math.round(s.y))), (n = i + Math.sign(Math.round(s.z)));
            }
            if (a >= 0 && n >= 0 && a < this.world.width && n < this.world.height) {
                const e = this.world.getTile(a, o, n),
                    i = Tiles.bedrock && Tiles.bedrock.id ? Tiles.bedrock.id : 8;
                if (0 === e)
                    o >= 0 &&
                        o < this.world.depth &&
                        this.selectedTileId !== i &&
                        (this.world.setTile(a, o, n, this.selectedTileId), this.refreshChunkForBlock(a, o, n), this.particles && this.particles.burst(a + 0.5, o + 0.5, n + 0.5, 6, 0.14, this._textureForTileId(this.selectedTileId)));
                else {
                    const e = !(!t || !t.altKey);
                    !(e ? placeOnBottom : placeOnTop)(this.world, a, n, this.selectedTileId, {
                        maxAbove: 8,
                        forbidBedrock: !0,
                        particles: this.particles,
                        particleTexture: this._textureForTileId(this.selectedTileId),
                        refreshCallback: (e, t, i) => this.refreshChunkForBlock(e, t, i),
                    }) &&
                        e &&
                        placeOnTop(this.world, a, n, this.selectedTileId, {
                            maxAbove: 8,
                            forbidBedrock: !0,
                            particles: this.particles,
                            particleTexture: this._textureForTileId(this.selectedTileId),
                            refreshCallback: (e, t, i) => this.refreshChunkForBlock(e, t, i),
                        });
                }
            }
        }
    }
    refreshChunkForBlock(e, t, i) {
        const s = new Set();
        s.add(`${Math.floor(e / this.world.chunkSizeX)}_${Math.floor(i / this.world.chunkSizeZ)}`);
        const r = [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
        ];
        for (const [a, o, n] of r) {
            const r = e + a,
                h = t + o,
                l = i + n;
            if (r < 0 || r >= this.world.width || l < 0 || l >= this.world.height || h < 0 || h >= this.world.depth) continue;
            const d = Math.floor(r / this.world.chunkSizeX),
                c = Math.floor(l / this.world.chunkSizeZ);
            s.add(`${d}_${c}`);
        }
        for (const e of s)
            if (this.world.loadedChunkMeshes.has(e)) {
                const [t, i] = e.split("_").map(Number);
                this.world.unloadChunk(t, i, this.scene), this.world.loadChunk(t, i, this.scene);
                const s = performance.now();
                this._lastChunkUpdateTime = this._lastChunkUpdateTime || new Map();
                s - (this._lastChunkUpdateTime.get(e) || 0) > 1e3 && (this.chunkUpdateCount++, this._lastChunkUpdateTime.set(e, s));
            }
    }
    onWindowResize() {
        (this.camera.aspect = window.innerWidth / window.innerHeight), this.camera.updateProjectionMatrix(), this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    startFPSTimer() {
        setInterval(() => {
            if (this._accumFrameCount > 0 && this._accumFrameDeltaMs > 0) {
                const e = Math.round(this._accumFrameCount / (this._accumFrameDeltaMs / 1e3));
                console.log(`${e} fps, ${this.chunkUpdateCount} chunk updates`),
                    (this.lastDisplayedFPS = e),
                    (this.lastDisplayedChunkCount = this.chunkUpdateCount),
                    (this._versionNeedsRedraw = !0),
                    (this._accumFrameCount = 0),
                    (this._accumFrameDeltaMs = 0),
                    this._drawVersionText();
            }
        }, 1e3),
            setInterval(() => {
                (this.chunkUpdateCount = 0), (this.lastDisplayedChunkCount = 0), (this._versionNeedsRedraw = !0);
            }, 3e3);
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        const e = performance.now();
        this.frameCount++;
        const t = Math.max(0, e - (this.lastTime || e));
        if (((this._accumFrameDeltaMs += t), (this._accumFrameCount += 1), this.startTime || (this.startTime = e), this.worldInitialized)) {
            const t = this.world.depth * this.layerRevealDuration,
                i = t + 500;
            let s = !1,
                r = 0,
                a = 0,
                o = 1,
                n = 0;
            if (this.worldRevealStartTime > 0) {
                const h = e - this.worldRevealStartTime;
                if (h < t) {
                    (s = !0), (o = 1), (n = 0);
                    let e = h / t;
                    (r = Math.min(this.world.depth, Math.floor(e * this.world.depth))), (a = e * this.world.depth - r);
                } else h < i ? ((s = !0), (o = 1), (n = 1), (r = this.world.depth), (a = 1)) : ((this.worldRevealStartTime = 0), (s = !1), (o = 0), (n = 1), (r = this.world.depth), (a = 1));
            } else (o = 0), (n = 1), (r = this.world.depth), (a = 1);
            if (e - this._lastUniformAt >= this._uniformIntervalMs) {
                const t = this.camera.position;
                this.blockMaterials.forEach((e) => {
                    (e.uniforms.uMaxVisibleY.value = r),
                        (e.uniforms.uCurrentLayerXProgress.value = a),
                        (e.uniforms.uWorldWidth.value = this.world.width),
                        e.uniforms.uCameraPosition.value.copy(t),
                        (e.uniforms.uIsWorldRevealing.value = o),
                        (e.uniforms.uSpecialRevealFinished.value = n);
                }),
                    (this._lastUniformAt = e);
            }
            if (e - this._lastLogicAt >= this._logicIntervalMs) {
                const t = Math.min(0.1, (e - this.lastTime) / 1e3);
                t > 0 && this.world.processGrassGrowth(this.grassTimers, t, this.coveredGrassTimers), this.processBushTicks(), (this._lastLogicAt = e);
            }
            this.processBushTicks();
            const h = performance.now(),
                l = 1;
            for (let e = this.zombies.length - 1; e >= 0; e--) {
                const t = this.zombies[e];
                t.tick(), t.render(l), t.removed && (t.removeFromScene(this.scene), this.zombies.splice(e, 1));
            }
            if (this.p2p && "function" == typeof this.p2p.shareAssetToPeers && h - (this._lastZombieBroadcast || 0) > 200) {
                const e = this.zombies.map((e) => ({ id: e._id || null, x: e.x, y: e.y, z: e.z, removed: !!e.removed }));
                this.p2p.shareAssetToPeers({ type: "zombie_update", zombies: e }).catch(() => {}), (this._lastZombieBroadcast = h);
            }
            if ((this.particles && this.particles.tick(), this.peer && this._peerConns && this._peerConns.size > 0 && this.player)) {
                this._lastPeerBroadcastTime || (this._lastPeerBroadcastTime = 0);
                const e = performance.now();
                if (e - this._lastPeerBroadcastTime > 100) {
                    const t = { type: "update", id: this.peerId, pos: { x: this.player.x, y: this.player.y, z: this.player.z }, yaw: this.player.yRotation };
                    for (const [e, i] of (this._peerConns || []).entries())
                        try {
                            i.open && i.send(t);
                        } catch (e) {}
                    this._lastPeerBroadcastTime = e;
                }
            }
            this.p2p &&
                "function" == typeof this.p2p.broadcast &&
                (this._poseBroadcastInit ||
                    ((this._poseBroadcastInit = !0),
                    setInterval(() => {
                        try {
                            if (!this.player) return;
                            const e = {
                                type: "player_update",
                                id: this.p2p && this.p2p.peerId ? this.p2p.peerId : this.peerId || "peer_" + Math.random().toString(36).slice(2, 8),
                                pos: { x: this.player.x, y: this.player.y, z: this.player.z },
                                yaw: this.player.yRotation,
                                pitch: this.player.xRotation,
                                model: !!window._steveGLTF || null,
                            };
                            this.p2p.broadcast(e).catch(() => {});
                        } catch (e) {}
                    }, 100)));
        }
        if (this.player) {
            this.player.tick((e - this.lastTime) / 1e3);
            try {
                if (e - this._lastRaycastAt < this._raycastIntervalMs) throw "skipRaycast";
                this._lastRaycastAt = e;
                const t = Array.from(this.world.loadedChunkMeshes.values()),
                    i = computeBlockTargetFromRay(this.world, this.raycaster, t);
                if (i) {
                    const e = i.x,
                        t = i.y,
                        s = i.z;
                    this.highlightMesh.position.set(e + 0.5, t + 0.5, s + 0.5), this.highlightMesh.scale.set(1, 1, 1), (this.highlightMesh.visible = !this.isPlacementMode && !this.interactionsLocked);
                    const r = performance.now() / 1e3,
                        a = Math.max(1, this.lastDisplayedFPS || 60),
                        o = r * (20 / a);
                    if (((this.highlightMaterial.opacity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * this.highlightPulseSpeed * o))), this.isPlacementMode)) {
                        const i = e,
                            r = t,
                            o = s,
                            n = i >= 0 && o >= 0 && i < this.world.width && o < this.world.height && r >= 0 && r < this.world.depth;
                        if (n && 0 === this.world.getTile(i, r, o)) {
                            this._currentPreviewTarget = { x: i, y: r, z: o };
                            const e = this._resolveTextureForSelected();
                            if ((e && this.placementPreviewMaterial.map !== e && (this.placementPreviewMaterial.map = e), 6 === this.selectedTileId)) {
                                const t = this.previewTextures?.bush_preview || e;
                                t && ((this.bushPreviewMatA.map = t), (this.bushPreviewMatB.map = t), (this.bushPreviewMatA.map.needsUpdate = !0), (this.bushPreviewMatB.map.needsUpdate = !0)),
                                    this.bushPreviewGroup.position.set(i + 0.5, r + 0.5, o + 0.5),
                                    (this.bushPreviewGroup.visible = !this.interactionsLocked),
                                    (this.placementPreviewMesh.visible = !1);
                                const s = (performance.now() / 1e3) * (20 / a),
                                    n = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * this.highlightPulseSpeed * s));
                                (this.bushPreviewMatA.opacity = n), (this.bushPreviewMatB.opacity = n);
                            } else {
                                (this.bushPreviewGroup.visible = !1),
                                    this.placementPreviewMesh.position.set(i + 0.5, r + 0.5, o + 0.5),
                                    (this.placementPreviewMesh.visible = !this.interactionsLocked),
                                    this.placementPreviewMesh.scale.set(1, 1, 1);
                                const e = (performance.now() / 1e3) * (20 / a);
                                (this.placementPreviewMaterial.opacity = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * this.highlightPulseSpeed * e))),
                                    this.placementPreviewMaterial.map && (this.placementPreviewMaterial.map.needsUpdate = !0);
                            }
                        } else (this._currentPreviewTarget = null), (this.placementPreviewMesh.visible = !1), (this.bushPreviewGroup.visible = !1);
                    } else (this._currentPreviewTarget = null), (this.placementPreviewMesh.visible = !1);
                } else (this.highlightMesh.visible = !1), (this._currentPreviewTarget = null), (this.placementPreviewMesh.visible = !1);
            } catch (e) {
                (this.highlightMesh.visible = !1), (this._currentPreviewTarget = null), (this.placementPreviewMesh.visible = !1);
            }
            if (
                (this.blockMaterials.forEach((e) => {
                    e.uniforms.uCameraPosition.value.copy(this.camera.position);
                }),
                this.worldInitialized)
            ) {
                const e = Math.floor(this.player.x),
                    t = Math.floor(this.player.z),
                    i = Math.floor(e / this.world.chunkSizeX),
                    s = Math.floor(t / this.world.chunkSizeZ),
                    r = new Set(),
                    a = Math.ceil(this.world.width / this.world.chunkSizeX),
                    o = Math.ceil(this.world.height / this.world.chunkSizeZ);
                for (let e = -this.renderDistance; e <= this.renderDistance; e++)
                    for (let t = -this.renderDistance; t <= this.renderDistance; t++) {
                        const n = i + e,
                            h = s + t;
                        n >= 0 && n < a && h >= 0 && h < o && r.add(`${n}_${h}`);
                    }
                for (const e of r)
                    if (!this.world.loadedChunkMeshes.has(e)) {
                        const [t, i] = e.split("_").map(Number);
                        this.world.loadChunk(t, i, this.scene), this._initiallyLoadedChunks.has(e) || this._initiallyLoadedChunks.add(e);
                    }
                this.currentLoadedChunkCount = this.world.loadedChunkMeshes.size;
                for (const e of Array.from(this.world.loadedChunkMeshes.keys()))
                    if (!r.has(e)) {
                        const [t, i] = e.split("_").map(Number);
                        this.world.unloadChunk(t, i, this.scene);
                    }
                for (const [e, t] of this.world.loadedChunkMeshes.entries())
                    if (t.userData && t.userData._needsRebuild) {
                        const [i, s] = e.split("_").map(Number);
                        if ((this.world.unloadChunk(i, s, this.scene), this.world.loadChunk(i, s, this.scene), t.userData._doubleRebuild)) {
                            t.userData._doubleRebuild = !1;
                            try {
                                this.world.unloadChunk(i, s, this.scene), this.world.loadChunk(i, s, this.scene);
                            } catch (e) {}
                        }
                    }
            }
        }
        this._versionNeedsRedraw && (this._drawVersionText(), (this._versionNeedsRedraw = !1)), this.renderer.render(this.scene, this.camera), (this.lastTime = e);
    }
    processBushTicks() {
        Tiles.dirt.id, Tiles.grass.id;
        for (const e of this.world.loadedChunkMeshes.keys()) {
            const [t, i] = e.split("_").map(Number),
                s = t * this.world.chunkSizeX,
                r = Math.min((t + 1) * this.world.chunkSizeX, this.world.width),
                a = i * this.world.chunkSizeZ,
                o = Math.min((i + 1) * this.world.chunkSizeZ, this.world.height);
            for (let e = s; e < r; e++)
                for (let s = a; s < o; s++)
                    for (let r = 0; r < this.world.depth; r++)
                        if (6 === this.world.getTile(e, r, s) && !this.world.isLit(e, r, s)) {
                            this.world.setTile(e, r, s, 0), this.world.updateBlockAndLight(e, r, s);
                            const a = `${t}_${i}`;
                            if (this.world.loadedChunkMeshes.has(a)) {
                                this.world.loadedChunkMeshes.get(a).userData._needsRebuild = !0;
                            }
                        }
        }
    }
    _textureForTileId(e) {
        const t = Tiles.byId?.[e];
        if (!t) return null;
        const i = t.getTextureKey(4) || t.getTextureKey(2) || "stone",
            s = this.materialIndexMap?.[i],
            r = Number.isInteger(s) ? this.blockMaterials[s] : null;
        return r && r.uniforms ? r.uniforms.tDiffuse.value : null;
    }
    async _generateMinimapDataURL() {
        try {
            const e = this.world.width,
                t = this.world.height,
                i = document.createElement("canvas"),
                s = 1024,
                r = Math.min(e, s),
                a = Math.min(t, s);
            (i.width = r), (i.height = a);
            const o = i.getContext("2d"),
                n = o.createImageData(r, a),
                h = (e) => {
                    switch (e) {
                        case Tiles.stone && Tiles.stone.id:
                            return [120, 120, 120, 255];
                        case Tiles.dirt && Tiles.dirt.id:
                            return [120, 70, 20, 255];
                        case Tiles.cobble && Tiles.cobble.id:
                            return [100, 100, 100, 255];
                        case Tiles.wood && Tiles.wood.id:
                            return [180, 140, 80, 255];
                        case Tiles.grass && Tiles.grass.id:
                            return [86, 150, 44, 255];
                        case Tiles.water && Tiles.water.id:
                            return [50, 130, 200, 220];
                        case Tiles.bush && Tiles.bush.id:
                            return [50, 160, 60, 200];
                        case Tiles.bedrock && Tiles.bedrock.id:
                            return [40, 40, 40, 255];
                        default:
                            return e && 0 !== e ? [200, 50, 50, 255] : [0, 0, 0, 0];
                    }
                };
            for (let e = 0; e < r; e++)
                for (let t = 0; t < a; t++) {
                    let i = 0;
                    for (let s = this.world.depth - 1; s >= 0; s--) {
                        const r = this.world.getTile(e, s, t);
                        if (0 !== r) {
                            i = r;
                            break;
                        }
                    }
                    const s = h(i),
                        a = 4 * (t * r + e);
                    (n.data[a + 0] = s[0]), (n.data[a + 1] = s[1]), (n.data[a + 2] = s[2]), (n.data[a + 3] = s[3]);
                }
            o.putImageData(n, 0, 0);
            const l = document.createElement("canvas");
            (l.width = Math.min(512, Math.max(128, r))), (l.height = Math.min(512, Math.max(128, a)));
            const d = l.getContext("2d");
            return (d.imageSmoothingEnabled = !1), d.drawImage(i, 0, 0, l.width, l.height), l.toDataURL("image/png");
        } catch (e) {
            return console.warn("minimap generation failed", e), null;
        }
    }
}
new RubyDung();
