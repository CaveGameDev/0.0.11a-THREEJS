import { THREE } from "./LibHandler.js";
import { AABB } from "./AABB/AABB.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { config } from "./config.js";
const MINIFY_EXPORT_NAMES = !0;
export class Player {
  constructor(t, i, o) {
    (this.scene = t),
      (this.camera = i),
      (this.world = o),
      (this.invertMouseY = !1),
      (this.leanEnabled = !1),
      (this.x = 0),
      (this.y = 0),
      (this.z = 0),
      (this.prevX = 0),
      (this.prevY = 0),
      (this.prevZ = 0),
      (this.motionX = 0),
      (this.motionY = 0),
      (this.motionZ = 0),
      (this.walkSpeed = config.player.walkSpeed),
      (this.jumpSpeed = config.player.jumpSpeed),
      (this.xRotation = 0),
      (this.yRotation = 0),
      (this.onGround = !1),
      (this.width = 0.3),
      (this.height = 0.9),
      (this.boundingBox = new AABB(0, 0, 0, 0, 0, 0)),
      (this.controls = { forward: !1, backward: !1, left: !1, right: !1, jump: !1 }),
      (this.onMouseMove = this.onMouseMove.bind(this)),
      (this.group = new THREE.Group()),
      (this.modelGroup = null),
      (this.headNode = null),
      (this.headSnapInterval = 0.7),
      (this._headSnapTimer = 0),
      (this._headTargetPitch = 0),
      (this._headTargetYaw = 0),
      (this._mixer = null),
      (this._actions = []),
      (this._mixerBaseSpeed = 1 / 12),
      (this._crawlState = !1),
      (this.lockCamToHeadForMovement = !1),
      (this.cameraPitch = 0),
      (this.triplePressWindowMs = 1e3),
      (this.overlayAutoHideMs = 4e3),
      (this._digit5Count = 0),
      (this._digit5StartTs = 0),
      t.add(this.group),
      this.initControls(),
      this.initPointerLock(),
      this.resetPosition(),
      this.initPlayerModel();
  }
  initControls() {
    document.addEventListener("keydown", (t) => {
      if (!window.chatTyping)
        switch (t.code) {
          case "KeyW":
          case "ArrowUp":
            this.controls.forward = !0;
            break;
          case "KeyS":
          case "ArrowDown":
            this.controls.backward = !0;
            break;
          case "KeyA":
          case "ArrowLeft":
            this.controls.left = !0;
            break;
          case "KeyD":
          case "ArrowRight":
            this.controls.right = !0;
            break;
          case "KeyG":
            (async () => {
              try {
                const t = (await import("./character/Zombie.js")).Zombie,
                  i = this.y - 1.62,
                  o = new t(this.world, this.x, i + 1, this.z, null);
                window.game && Array.isArray(window.game.zombies) && window.game.zombies.push(o),
                  (window.entities = window.entities || []),
                  window.entities.push(o),
                  o.addToScene && o.addToScene(this.scene),
                  "function" == typeof o.setPathVisibility && o.setPathVisibility(!!window.showZombiePaths);
              } catch (t) {
                console.warn("Spawn zombie failed", t);
              }
            })();
            break;
          case "Space":
            this.controls.jump = !0;
            break;
          case "KeyR":
            this.resetPosition();
            break;
          case "Digit5": {
            const t = performance.now();
            if ((!this._digit5StartTs || t - this._digit5StartTs > this.triplePressWindowMs ? ((this._digit5StartTs = t), (this._digit5Count = 1)) : this._digit5Count++, this._digit5Count >= 3)) {
              const t = document.getElementById("js-overlay");
              t &&
                ((t.style.display = "flex"),
                setTimeout(() => {
                  t.style.display = "none";
                }, this.overlayAutoHideMs)),
                (this._digit5Count = 0),
                (this._digit5StartTs = 0);
            }
            break;
          }
          case "Digit7":
            if (((window.showZombiePaths = !window.showZombiePaths), window.game && Array.isArray(window.game.zombies)))
              for (const i of window.game.zombies)
                try {
                  i && "function" == typeof i.setPathVisibility && i.setPathVisibility(window.showZombiePaths);
                } catch (t) {}
            if (window.entities && Array.isArray(window.entities))
              for (const i of window.entities)
                try {
                  i && "function" == typeof i.setPathVisibility && i.setPathVisibility(window.showZombiePaths);
                } catch (t) {}
            break;
          case "Digit8":
            this.thirdPerson && (this.thirdPersonFront = !this.thirdPersonFront);
            break;
          case "Digit1":
            this.thirdPerson = !1;
            try {
              const t = document.getElementById("crosshair");
              t && (t.style.display = "");
            } catch (t) {}
            break;
          case "Digit9":
            (this.leanEnabled = !this.leanEnabled), this.leanEnabled || (this.xRotation = Math.max(-90, Math.min(90, this.xRotation)));
        }
    }),
      document.addEventListener("keyup", (t) => {
        if (!window.chatTyping)
          switch (t.code) {
            case "KeyW":
            case "ArrowUp":
              this.controls.forward = !1;
              break;
            case "KeyS":
            case "ArrowDown":
              this.controls.backward = !1;
              break;
            case "KeyA":
            case "ArrowLeft":
              this.controls.left = !1;
              break;
            case "KeyD":
            case "ArrowRight":
              this.controls.right = !1;
              break;
            case "Space":
              this.controls.jump = !1;
          }
      });
  }
  initPointerLock() {
    const t = document.getElementById("canvas");
    t &&
      (t.addEventListener("click", () => {
        t.requestPointerLock();
      }),
      document.addEventListener("pointerlockchange", () => {
        document.pointerLockElement === t ? document.addEventListener("mousemove", this.onMouseMove, !1) : document.removeEventListener("mousemove", this.onMouseMove, !1);
      }));
  }
  initPlayerModel() {
    try {
      new GLTFLoader().load(
        "./steve.glb",
        (t) => {
          this.modelGroup = t.scene || t.scenes?.[0] || null;
          try {
            window._steveGLTF = t;
          } catch (t) {}
          if (
            (this.modelGroup &&
              ((this.headNode = this.modelGroup.getObjectByName("head") || this.modelGroup.getObjectByName("Head") || null),
              this.headNode ||
                this.modelGroup.traverse((t) => {
                  !this.headNode && t.name && /head/i.test(t.name) && (this.headNode = t);
                })),
            this.modelGroup)
          ) {
            if (this.modelGroup) {
              const t = new THREE.AmbientLight(16777215, 0.3);
              this.modelGroup.add(t);
            }
            if (
              (this.modelGroup.traverse((t) => {
                t.isMesh && ((t.castShadow = !1), (t.receiveShadow = !1));
              }),
              this.modelGroup.traverse((t) => {
                if (!t.isMesh) return;
                const i = (t) => {
                  try {
                    t.color && t.color.lerp(new THREE.Color(16777215), 0.08),
                      t.emissive && t.emissive.setHex(0),
                      "metalness" in t && (t.metalness = 0),
                      "metalnessMap" in t && (t.metalnessMap = null),
                      "roughness" in t && (t.roughness = Math.max(0.9, t.roughness || 1)),
                      "roughnessMap" in t && (t.roughnessMap = null),
                      "envMap" in t && (t.envMap = null),
                      "envMapIntensity" in t && (t.envMapIntensity = 0),
                      "clearcoat" in t && (t.clearcoat = 0),
                      "clearcoatMap" in t && (t.clearcoatMap = null);
                    try {
                      const i = Math.floor(this.x || 0),
                        o = Math.floor(this.z || 0),
                        e = Math.max(0, Math.floor((this.y || 0) - 1)),
                        s = this.world && "function" == typeof this.world.getBrightness ? this.world.getBrightness(i, e, o, 0).finalBrightness : 1;
                      t.color && t.color.setScalar(1), t.color && t.color.multiplyScalar(s), (t.needsUpdate = !0);
                    } catch (t) {}
                  } catch (t) {}
                };
                Array.isArray(t.material) ? t.material.forEach(i) : t.material && i(t.material);
              }),
              this.modelGroup.traverse((t) => {
                if (!t || !t.name) return;
                const i = t.name.toLowerCase();
                try {
                  /arm|hand/.test(i)
                    ? (t.rotation.z = (t.rotation.z || 0) + 0.45 * (/left/.test(i) ? -1 : 1))
                    : /leg|thigh|foot/.test(i)
                    ? (t.rotation.x = (t.rotation.x || 0) + (/(left|right)/.test(i), 0.15))
                    : /head|skull/.test(i) && (t.rotation.x = (t.rotation.x || 0) + 0.08);
                } catch (t) {}
              }),
              this.modelGroup.scale.setScalar(0.95),
              (this.modelGroup.rotation.x = Math.PI),
              (this.modelGroup.visible = !1),
              t.animations && t.animations.length > 0)
            )
              try {
                (this._mixer = new THREE.AnimationMixer(this.modelGroup)), (this._actionsByName = {});
                for (let i = 0; i < t.animations.length; i++) {
                  const o = t.animations[i],
                    e = this._mixer.clipAction(o);
                  e.play(), e.setEffectiveWeight(0), this._actions.push(e), o && o.name && (this._actionsByName[o.name] = e);
                }
                if (!this._actionsByName["animation.steve.idle"])
                  for (const t in this._actionsByName)
                    if (/idle/i.test(t)) {
                      this._actionsByName["animation.steve.idle"] = this._actionsByName[t];
                      break;
                    }
              } catch (t) {}
          }
        },
        void 0,
        () => {}
      );
    } catch (t) {}
  }
  onMouseMove(t) {
    if (!t) return;
    const i = t.movementX || 0,
      o = (t.movementY || 0) * (this.invertMouseY ? -1 : 1);
    this.yRotation -= i * config.player.mouseSensitivity.x;
    const e = config.player.mouseSensitivity.y;
    this.thirdPerson ? (this.cameraPitch -= o * e) : (this.xRotation -= o * e);
    const s = config.camera.maxFirstPitch;
    (this.xRotation = Math.max(-s, Math.min(s, this.xRotation))),
      (this.cameraPitch = Math.max(-config.camera.maxThirdPitch, Math.min(config.camera.maxThirdPitch, this.cameraPitch))),
      this.thirdPerson,
      (this.camera.rotation.order = "YXZ"),
      this.camera.rotation.set(THREE.MathUtils.degToRad(this.xRotation), THREE.MathUtils.degToRad(this.yRotation), 0);
  }
  resetPosition() {
    const t = Math.random() * this.world.width,
      i = Math.random() * this.world.height,
      o = this.world.getGroundHeight(Math.floor(t), Math.floor(i)) + 2;
    this.setPosition(t, o, i);
  }
  update(t) {
    this.tick(t);
  }
  tick(t = 1 / 60) {
    (this.prevX = this.x), (this.prevY = this.y), (this.prevZ = this.z), this.modelGroup && (this.modelGroup.visible = !!this.thirdPerson);
    Math.abs(this.xRotation);
    const i = this.leanEnabled && this.xRotation < -50;
    i !== this._crawlState && ((this._crawlState = i), this._crawlState ? ((this.width = 0.18), (this.height = 0.45)) : ((this.width = 0.3), (this.height = 0.9)), this._updateBoundingBoxDims());
    let o = 0,
      e = 0;
    this.controls.forward && (o += this.thirdPerson ? 1 : -1), this.controls.backward && (o -= this.thirdPerson ? 1 : -1);
    const s = this.thirdPerson ? -1 : 1;
    if ((this.controls.left && (e -= 1 * s), this.controls.right && (e += 1 * s), this.controls.jump && this.onGround)) {
      const t = 60 * config.player.gravityPerTick,
        i = Math.sqrt(2 * t * config.player.maxJumpHeightBlocks),
        o = window.game && "number" == typeof window.game.lastDisplayedFPS ? window.game.lastDisplayedFPS : null;
      let e = 1;
      null !== o && (o < 40 ? (e = 3) : o < 50 ? (e = 2) : o < 70 && (e = 1.5));
      const s = Math.min(this.jumpSpeed * e, i);
      this.motionY = s;
    }
    const a = this.onGround ? this.walkSpeed : 0.2 * this.walkSpeed;
    this.moveRelative(e, o, a, t);
    const h = 60 * config.player.gravityPerTick;
    (this.motionY -= h * t), this.move(this.motionX, this.motionY, this.motionZ);
    const n = 60 * t,
      r = Math.pow(0.91, n),
      c = Math.pow(0.98, n);
    if (((this.motionX *= r), (this.motionY *= c), (this.motionZ *= r), this.onGround)) {
      const t = Math.pow(0.8, n);
      (this.motionX *= t), (this.motionZ *= t);
    }
    if (this._mixer) {
      const i = Math.sqrt(this.motionX * this.motionX + this.motionZ * this.motionZ);
      if (i > 0.01) {
        const o = 1 + Math.min(4, 30 * i);
        this._mixer.timeScale = this._mixerBaseSpeed * o;
        const e = Math.min(1, 6 * i);
        for (let t = 0; t < this._actions.length; t++) {
          this._actions[t].setEffectiveWeight(0 === t ? e : 0.6 * e);
        }
        try {
          this._mixer.update(t);
        } catch (t) {}
      } else {
        const t = (this._actionsByName && (this._actionsByName["animation.steve.idle"] || this._actionsByName.idle)) || null;
        if (t)
          for (let i = 0; i < this._actions.length; i++) {
            const o = this._actions[i];
            o.setEffectiveWeight(o === t ? 1 : 0);
          }
        else for (let t of this._actions) t.setEffectiveWeight(0);
      }
    }
    this.modelGroup && ((this.modelGroup.rotation.x = Math.PI), (this.modelGroup.rotation.z = this.thirdPerson ? Math.PI : 0));
    try {
      if (this.modelGroup) {
        const t = Math.floor(this.x || 0),
          i = Math.floor(this.z || 0),
          o = Math.max(0, Math.floor((this.y || 0) - 1)),
          e = this.world && "function" == typeof this.world.getBrightness ? this.world.getBrightness(t, o, i, 0).finalBrightness : 1;
        this.modelGroup.traverse((t) => {
          if (!t.isMesh || !t.material) return;
          const i = Array.isArray(t.material) ? t.material : [t.material];
          for (const t of i)
            try {
              t.color && (t.color.setScalar(1), t.color.multiplyScalar(e), (t.needsUpdate = !0));
            } catch (t) {}
        });
      }
    } catch (t) {}
    if (this.thirdPerson) {
      const t = config.camera.thirdPersonDistance,
        i = config.camera.heightOffset;
      if (this.modelGroup && this.headNode) {
        if (this.thirdPerson && this.xRotation > 85) {
          this.thirdPersonTopDown = !0;
          const t = 10;
          this.camera.position.set(this.x, this.y + t, this.z), this.camera.lookAt(new THREE.Vector3(this.x, this.y, this.z)), this.lockCamToHeadForMovement && (this.yRotation = this.yRotation);
        } else this.thirdPersonTopDown && this.xRotation <= 85 && (this.thirdPersonTopDown = !1);
        if (this.thirdPersonTopDown);
        else {
          this.headNode.updateWorldMatrix(!0, !1);
          const o = new THREE.Vector3();
          this.headNode.getWorldPosition(o);
          const e = THREE.MathUtils.degToRad(this.yRotation),
            s = this.thirdPersonFront ? 1 : -1,
            a = s * Math.sin(e) * t,
            h = s * Math.cos(e) * t;
          this.camera.position.set(o.x + a, o.y + i, o.z + h);
          const n = THREE.MathUtils.degToRad(this.cameraPitch || 0),
            r = o.clone();
          (r.y += Math.tan(n) * Math.max(0.001, t)), this.camera.lookAt(r), this.lockCamToHeadForMovement && (this.yRotation = headYawDeg);
        }
      } else {
        const i = THREE.MathUtils.degToRad(this.yRotation),
          o = -Math.sin(i) * t,
          e = -Math.cos(i) * t;
        this.camera.position.set(this.x + o, this.y + 1.5, this.z + e), this.camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));
      }
    } else this.camera.position.set(this.x, this.y, this.z);
    this.group && (this.group.position.set(this.x, this.y - 1.62 + 0.05, this.z), (this.group.rotation.y = THREE.MathUtils.degToRad(this.yRotation + 180)));
  }
  _updateBoundingBoxDims() {
    const t = this.width,
      i = this.height;
    this.boundingBox = new AABB(this.x - t, this.y - i, this.z - t, this.x + t, this.y + i, this.z + t);
  }
  moveRelative(t, i, o, e) {
    e = Math.max(0, e || 1 / 60);
    let s = t * t + i * i;
    if (s >= 0.01) {
      const a = (o * e) / Math.sqrt(s),
        h = t * a,
        n = i * a,
        r = THREE.MathUtils.degToRad(this.yRotation),
        c = Math.sin(r),
        l = Math.cos(r);
      (this.motionX += n * c + h * l), (this.motionZ += n * l - h * c);
    }
  }
  move(t, i, o) {
    let e = t,
      s = i,
      a = o;
    const h = this.boundingBox.expand(t, i, o),
      n = this.world.getCubes(h);
    for (const t of n) i = t.clipYCollide(this.boundingBox, i);
    this.boundingBox.move(0, i, 0);
    for (const i of n) t = i.clipXCollide(this.boundingBox, t);
    this.boundingBox.move(t, 0, 0);
    for (const t of n) o = t.clipZCollide(this.boundingBox, o);
    this.boundingBox.move(0, 0, o),
      (this.onGround = s !== i && s < 0),
      e !== t && (this.motionX = 0),
      s !== i && (this.motionY = 0),
      a !== o && (this.motionZ = 0),
      (this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2),
      (this.y = this.boundingBox.minY + 1.62),
      (this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2);
  }
  setPosition(t, i, o) {
    (this.x = t), (this.y = i), (this.z = o);
    const e = this.width,
      s = this.height;
    (this.boundingBox = new AABB(t - e, i - s, o - e, t + e, i + s, o + e)), this.camera.position.set(this.x, this.y, this.z);
  }
}
(Player.prototype.a = Player.prototype.initControls),
  (Player.prototype.b = Player.prototype.initPointerLock),
  (Player.prototype.c = Player.prototype.initPlayerModel),
  (Player.prototype.d = Player.prototype.onMouseMove),
  (Player.prototype.e = Player.prototype.resetPosition),
  (Player.prototype.f = Player.prototype.update),
  (Player.prototype.g = Player.prototype.tick),
  (Player.prototype.h = Player.prototype._updateBoundingBoxDims),
  (Player.prototype.i = Player.prototype.moveRelative),
  (Player.prototype.j = Player.prototype.move),
  (Player.prototype.k = Player.prototype.setPosition);
export { Player as P };
