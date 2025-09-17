import { THREE } from "../LibHandler.js";
import { Entity } from "../Entity.js";
import { GLTFLoader } from "../GLTFLoader.js";
import { config } from "../config.js";
import { c as computeZombiePose } from "./animation.js";
export class Zombie extends Entity {
    constructor(t, i, e, s, h) {
        super(t),
            this.setPos(i, e, s),
            (this.rot = Math.random() * Math.PI * 2),
            (this.timeOffs = 1239813 * Math.random()),
            (this.speed = config.zombie.baseSpeed),
            (this.rotA = 0.0015 * (Math.random() + 1)),
            (this.walkSpeedFactor = config.zombie.walkSpeedFactor),
            (this._stuckTimer = 0),
            (this._lastStuckCheck = performance.now()),
            (this._lastPos = { x: this.x, z: this.z }),
            (this._unstickCooldown = 0),
            (this.group = new THREE.Group()),
            (this.modelGroup = null),
            (this._gltfReady = !1),
            (this._mixer = null),
            (this._mixerTimeScale = 1 / 12),
            (this._lastMixerTime = performance.now()),
            (this._actions = []),
            (this.headNode = null),
            (this._headSnapTimer = 0),
            (this._headSnapInterval = 0.7),
            (this._headTargetPitch = 0),
            (this._headTargetYaw = 0),
            (this._mixerBaseSpeed = 1 / 12);
        try {
            new GLTFLoader().load(
                "./steve.glb",
                (t) => {
                    if (
                        ((this.modelGroup = t.scene || t.scenes?.[0] || null),
                        this.modelGroup &&
                            (this.modelGroup.traverse((t) => {
                                t.isMesh && ((t.castShadow = !1), (t.receiveShadow = !1));
                            }),
                            this.modelGroup.traverse((t) => {
                                if (!t.isMesh || !t.material) return;
                                const i = Array.isArray(t.material) ? t.material : [t.material];
                                for (const t of i)
                                    try {
                                        "metalness" in t && (t.metalness = 0),
                                            "roughness" in t && (t.roughness = 1),
                                            "envMap" in t && (t.envMap = null),
                                            "envMapIntensity" in t && (t.envMapIntensity = 0),
                                            t.color && t.color.setScalar(1),
                                            (t.needsUpdate = !0);
                                    } catch (t) {}
                            }),
                            this.modelGroup.scale.setScalar(1.16666668),
                            (this.modelGroup.rotation.x = Math.PI),
                            this.group.add(this.modelGroup),
                            (this._gltfReady = !0)),
                        t.animations && t.animations.length > 0)
                    ) {
                        this._gltfClips = t.animations;
                        try {
                            this._mixer = new THREE.AnimationMixer(this.modelGroup);
                            for (let t = 0; t < this._gltfClips.length; t++) {
                                const i = this._gltfClips[t],
                                    e = this._mixer.clipAction(i);
                                e.reset(), e.play(), e.setEffectiveWeight(0), this._actions.push(e);
                            }
                            (this._mixer.timeScale = this._mixerTimeScale), (this._lastMixerTime = performance.now());
                        } catch (t) {}
                    }
                },
                void 0,
                () => {}
            );
        } catch (t) {}
        this.group.add(new THREE.Group()),
            (this.jumpIntervalMs = 500),
            (this.nextJumpAt = Date.now() + this.jumpIntervalMs),
            (this.jumpSpeed = config.player.jumpSpeed),
            (this._wasOnGround = !1),
            (this.path = []),
            (this.pathIndex = 0),
            (this._pathRegenCooldown = 0),
            (this._pathLine = null),
            (this._pathVisible = !1);
    }
    tick() {
        (this.xo = this.x), (this.yo = this.y), (this.zo = this.z);
        const t = performance.now(),
            i = Math.min(0.1, (t - (this._lastTickAt || t)) / 1e3);
        if (((this._lastTickAt = t), this.y < -100)) return void this.remove();
        (this.rot += this.rotA), (this.rotA *= 0.985), (this.rotA += 0.0018 * (Math.random() - Math.random())), (this.rotA = Math.max(Math.min(this.rotA, 0.02), -0.02));
        const e = Math.sin(this.rot),
            s = Math.cos(this.rot);
        this.onGround && Date.now() >= this.nextJumpAt && ((this.yd = this._playerLikeJump()), (this.nextJumpAt += this.jumpIntervalMs)), (this._wasOnGround = !!this.onGround);
        const h = performance.now();
        if (h - this._lastStuckCheck > 400) {
            const t = this.x - this._lastPos.x,
                i = this.z - this._lastPos.z,
                e = t * t + i * i;
            (this._lastPos.x = this.x), (this._lastPos.z = this.z), (this._lastStuckCheck = h), e < 9e-4 ? (this._stuckTimer += 1) : (this._stuckTimer = 0);
        }
        if (this._stuckTimer > 3 && h > this._unstickCooldown) {
            const t = this._findOpenDirection();
            if (null !== t) {
                (this.rot = t.angle), (this.rotA += 0.01 * (Math.random() > 0.5 ? 1 : -1)), (this.xd += 0.07 * Math.sin(this.rot)), (this.zd += 0.07 * Math.cos(this.rot));
                const i = this.level && this.level.getGroundHeight ? this.level.getGroundHeight(Math.floor(this.x), Math.floor(this.z)) : Math.floor(this.y);
                t.targetY > i &&
                    this.onGround &&
                    Date.now() >= this.nextJumpAt &&
                    ((this.yd = this._playerLikeJump()), (this.nextJumpAt = Date.now() + this.jumpIntervalMs), (this.xd += 0.04 * Math.sin(this.rot)), (this.zd += 0.04 * Math.cos(this.rot)));
            } else this.rotA += 0.02 * (Math.random() - 0.5);
            (this._unstickCooldown = h + 600), (this._stuckTimer = 0);
        }
        if (this.path && this.path.length > 0) {
            const t = this.path[this.pathIndex];
            if (t) {
                const i = t.x + 0.5,
                    e = t.z + 0.5,
                    s = i - this.x,
                    h = e - this.z,
                    o = ((Math.atan2(s, h) - this.rot + Math.PI) % (2 * Math.PI)) - Math.PI;
                (this.rotA += Math.max(-0.02, Math.min(0.02, 0.15 * o))), Math.abs(o) < 0.4 && ((this.xd += 0.06 * Math.sin(this.rot)), (this.zd += 0.06 * Math.cos(this.rot)));
                const a = this.level && this.level.getGroundHeight ? this.level.getGroundHeight(Math.floor(this.x), Math.floor(this.z)) : Math.floor(this.y);
                t.y > a &&
                    this.onGround &&
                    Date.now() >= this.nextJumpAt &&
                    ((this.yd = this._playerLikeJump()), (this.nextJumpAt = Date.now() + this.jumpIntervalMs), (this.xd += 0.03 * Math.sin(this.rot)), (this.zd += 0.03 * Math.cos(this.rot)));
                (s * s + h * h < 0.16 || this._stuckTimer > 6) && (this.pathIndex++, this.pathIndex >= this.path.length && ((this.path = []), (this.pathIndex = 0), this._updatePathLine(!0), this._generatePath()));
            }
        } else performance.now() > this._pathRegenCooldown && performance.now() > (this._lastPathGenTime || 0) && this._generatePath();
        if (0 === this._stuckTimer && h > (this._idleRotateUntil || 0)) {
            const t = window.player && "number" == typeof window.player.walkSpeed ? window.player.walkSpeed : 1;
            (this.rotA += 0.002 * (Math.random() - 0.5) * t), (this.rotA = Math.max(Math.min(this.rotA, 0.02), -0.02)), Math.random() < 0.01 && (this._idleRotateUntil = h + 400 + 800 * Math.random());
        }
        this.moveRelative(e, s, (this.onGround ? 0.1 : 0.02) * this.walkSpeedFactor);
        const o = 60 * config.player.gravityPerTick;
        this.yd -= o * i;
        const a = this.xd,
            n = this.zd,
            r = this.x,
            l = this.z;
        if ((this.move(this.xd, this.yd, this.zd), (Math.abs(a) > 1e-4 || Math.abs(n) > 1e-4) && Math.hypot(this.x - r, this.z - l) < 9e-4)) {
            const t = this._findOpenDirection();
            t && ((this.rot = t.angle), (this.rotA += 0.02 * (Math.random() > 0.5 ? 1 : -1)), (this.xd += 0.08 * Math.sin(this.rot)), (this.zd += 0.08 * Math.cos(this.rot)), (this._unstickCooldown = performance.now() + 500)),
                this.onGround && Date.now() >= this.nextJumpAt && ((this.yd = this._playerLikeJump()), (this.nextJumpAt = Date.now() + this.jumpIntervalMs));
        }
        if (((this.xd *= 0.91), (this.yd *= 0.96), (this.zd *= 0.91), this.onGround && ((this.xd *= 0.7), (this.zd *= 0.7)), this._mixer)) {
            const t = Math.sqrt(this.xd * this.xd + this.zd * this.zd),
                i = 1 + Math.min(4, 30 * t);
            this._mixer.timeScale = this._mixerBaseSpeed * i;
            const e = performance.now(),
                s = Math.min(0.1, (e - (this._lastMixerTime || e)) / 1e3);
            try {
                this._mixer.update(s);
            } catch (t) {}
            this._lastMixerTime = e;
            const h = Math.min(1, 6 * t);
            if (this._actions && this._actions.length > 0)
                for (let t = 0; t < this._actions.length; t++) {
                    this._actions[t].setEffectiveWeight(0 === t ? h : 0.6 * h);
                }
        }
        if (this.modelGroup && this.headNode) {
            const t = (performance.now() - (this._lastHeadTick || performance.now())) / 1e3;
            (this._lastHeadTick = performance.now()),
                (this._headSnapTimer += t),
                this._headSnapTimer >= this._headSnapInterval && ((this._headSnapTimer = 0), (this._headTargetPitch = 90 * Math.random() - 45), (this._headTargetYaw = 90 * Math.random() - 45));
        }
    }
    render(t) {
        if (this.removed) return;
        const i = (Date.now() / 100) * Math.max(0.5, this.speed) + this.timeOffs,
            e = 5 * -Math.abs(Math.sin(0.6662 * i)) - 23,
            s = this.xo + (this.x - this.xo) * t,
            h = this.yo + (this.y - this.yo) * t,
            o = this.zo + (this.z - this.zo) * t;
        if ((this.group.position.set(s, h - 0.05, o), this.group.scale.set(1, 1, 1), this.group.rotation.set(Math.PI, this.rot + Math.PI, 0), this._mixer)) {
            const t = performance.now(),
                i = (t - (this._lastMixerTime || t)) / 1e3,
                e = Math.min(i, 0.1);
            try {
                this._mixer.update(e);
            } catch (t) {}
            this._lastMixerTime = t;
        }
        if (this._gltfReady && this.modelGroup) {
            this.modelGroup.position.y = 0.01 * e + 0;
            const t = (Date.now() / 1e3) * 4.285714 + this.timeOffs,
                i = this.c(t);
            this.modelGroup.traverse((t) => {
                if (!t || !t.name) return;
                const e = t.name.toLowerCase();
                if (e.includes("head") || e.includes("skull")) return (t.rotation.x = i.headPitchRad), (t.rotation.y = i.headYawRad), void (this.headNode || (this.headNode = t));
                if (e.includes("arm") || e.includes("hand")) {
                    const s = /left|_l|\.l|arm0|arm_l/.test(e),
                        h = s ? i.arm0 : i.arm1;
                    h ? ((t.rotation.x = h.xRot || 0), (t.rotation.y = 0), (t.rotation.z = (s ? -1 : 1) * (h.zRot || 0))) : ((t.rotation.x = 0), (t.rotation.y = 0), (t.rotation.z = 0));
                } else if (e.includes("leg") || e.includes("foot")) {
                    const s = /left|_l|\.l|leg0|leg_l/.test(e) ? i.leg0Rad : i.leg1Rad;
                    (t.rotation.x = s || 0), (t.rotation.y = 0), (t.rotation.z = 0);
                }
            });
        } else this.group.children[0] && (this.group.children[0].position.y = 0.01 * e);
        try {
            if (this.modelGroup) {
                const t = Math.floor(this.x || 0),
                    i = Math.floor(this.z || 0),
                    e = Math.max(0, Math.floor((this.y || 0) - 1)),
                    s = this.level && "function" == typeof this.level.getBrightness ? this.level.getBrightness(t, e, i, 0).finalBrightness : 1;
                this.modelGroup.traverse((t) => {
                    if (!t.isMesh || !t.material) return;
                    const i = Array.isArray(t.material) ? t.material : [t.material];
                    for (const t of i)
                        try {
                            t.color && (t.color.setScalar(Math.max(0.95, 1.1 * s)), (t.needsUpdate = !0));
                        } catch (t) {}
                });
            }
        } catch (t) {}
    }
    addToScene(t) {
        t.add(this.group), this._pathLine && !this._pathLine.parent && t.add(this._pathLine), this._pathLine && (this._pathLine.visible = !!window.showZombiePaths);
    }
    removeFromScene(t) {
        if ((t.remove(this.group), this._pathLine && t)) {
            t.remove(this._pathLine);
            try {
                this._pathLine.geometry.dispose(), this._pathLine.material.dispose();
            } catch (t) {}
            this._pathLine = null;
        }
    }
    setPathVisibility(t) {
        (window.showZombiePaths = !!t), this._pathLine && (this._pathLine.visible = !!t);
    }
    _generatePath() {
        if (!this.level) return;
        const t = config.pathfinding.maxSteps,
            i = Math.floor(this.x),
            e = Math.floor(this.z);
        this.level.getGroundHeight(i, e);
        let s = i,
            h = e;
        const o = Math.random() * Math.PI * 2;
        for (let i = 0; i < t; i++) {
            const t = o + 0.6 * (Math.random() - 0.5),
                e = i < 4 ? 1 : 2,
                a = s + Math.round(Math.cos(t) * e),
                n = h + Math.round(Math.sin(t) * e);
            if (a < 0 || n < 0 || a >= (this.level ? this.level.width : 0) || n >= (this.level ? this.level.height : 0)) break;
            const r = this.level.getGroundHeight ? this.level.getGroundHeight(a, n) : -1,
                l = r + 1;
            if (l >= 0 && l < (this.level ? this.level.depth : 0) && 0 === this.level.getTile(a, l, n)) return { angle: Math.atan2(Math.cos(t), Math.sin(t)), targetY: r };
        }
        return null;
    }
    _updatePathLine(t = !1) {
        try {
            const i = !!window.showZombiePaths;
            if (((this._pathVisible = i), !this.group)) return;
            if ((this._pathLine && this._pathLine.parent && (this._pathLine.visible = i), !this._pathLine && this.path && this.path.length > 0)) {
                const e = [];
                t && e.push(new THREE.Vector3(this.x, this.y + 0.5, this.z));
                for (let t = this.pathIndex; t < this.path.length; t++) {
                    const i = this.path[t];
                    e.push(new THREE.Vector3(i.x + 0.5, i.y + 0.5, i.z + 0.5));
                }
                const s = new THREE.BufferGeometry().setFromPoints(e),
                    h = new THREE.LineBasicMaterial({ color: 16724787, linewidth: 2 }),
                    o = new THREE.Line(s, h);
                return (o.frustumCulled = !1), (o.visible = i), (this._pathLine = o), void (this.group && this.group.parent ? this.group.parent.add(o) : this.group && this.group.add(o));
            }
            if (this._pathLine && this.path && this.path.length > 0) {
                const e = [];
                t && e.push(new THREE.Vector3(this.x, this.y + 0.5, this.z));
                for (let t = this.pathIndex; t < this.path.length; t++) {
                    const i = this.path[t];
                    e.push(new THREE.Vector3(i.x + 0.5, i.y + 0.5, i.z + 0.5));
                }
                this._pathLine.geometry.setFromPoints(e), (this._pathLine.visible = i), this._pathLine.geometry.computeBoundingSphere();
            }
            (this.path && 0 !== this.path.length) || (this._pathLine && (this._pathLine.visible = i));
        } catch (t) {}
    }
    _findOpenDirection() {
        if (!this.level) return null;
        const t = Math.floor(this.x),
            i = Math.floor(this.z);
        Math.floor(this.y);
        for (let e = 1; e <= 3; e++)
            for (let s = 0; s < 16; s++) {
                const h = (s / 16) * Math.PI * 2,
                    o = Math.floor(t + Math.round(Math.cos(h) * e)),
                    a = Math.floor(i + Math.round(Math.sin(h) * e));
                if (o < 0 || a < 0 || o >= (this.level ? this.level.width : 0) || a >= (this.level ? this.level.height : 0)) continue;
                const n = this.level.getGroundHeight ? this.level.getGroundHeight(o, a) : -1,
                    r = n + 1;
                if (r >= 0 && r < (this.level ? this.level.depth : 0) && 0 === this.level.getTile(o, r, a)) return { angle: Math.atan2(Math.cos(h), Math.sin(h)), targetY: n };
            }
        return null;
    }
}
(Zombie.prototype._playerLikeJump = function () {
    const t = 60 * config.player.gravityPerTick,
        i = Math.sqrt(2 * t * config.player.maxJumpHeightBlocks),
        e = window.game && "number" == typeof window.game.lastDisplayedFPS ? window.game.lastDisplayedFPS : null;
    let s = 1;
    return null !== e && (e < 40 ? (s = 3) : e < 50 ? (s = 2) : e < 70 && (s = 1.5)), Math.min(this.jumpSpeed * s, i);
}),
    (Zombie.prototype.c = computeZombiePose);
const MINIFY_EXPORT_METHODS = !0;
export { Zombie as Z };
