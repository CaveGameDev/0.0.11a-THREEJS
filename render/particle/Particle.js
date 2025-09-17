import { THREE } from "../../LibHandler.js";
export class Particle {
    constructor(t, i, h, s, e, o, a, r) {
        (this.scene = t), (this.removed = !1), (this.x = h), (this.y = s), (this.z = e), (this.xo = h), (this.yo = s), (this.zo = e);
        const n = Math.acos(2 * Math.random() - 1),
            d = 2 * Math.PI * Math.random(),
            m = Math.sin(n) * Math.cos(d),
            c = Math.cos(n),
            M = Math.sin(n) * Math.sin(d),
            l = (0.45 * (0.9 + 0.2 * Math.random())) / 3;
        (this.xd = o + m * l),
            (this.yd = a + c * l * 0.8),
            (this.zd = r + M * l),
            (this.size = 0.2 * (0.5 * Math.random() + 0.5)),
            (this.birth = performance.now()),
            (this.lifetimeMs = 3e3 + Math.floor(500 * Math.random())),
            (this.grounded = !1),
            (this.groundContactStart = 0);
        const p = new THREE.SpriteMaterial({ map: i, color: 16777215, transparent: !0, alphaTest: 0.01 });
        try {
            const t = i && i.image;
            if (t && "undefined" != typeof document) {
                const i = Math.max(1, t.width || 4),
                    h = Math.max(1, t.height || 4),
                    s = document.createElement("canvas");
                (s.width = i), (s.height = h);
                const e = s.getContext("2d");
                (e.imageSmoothingEnabled = !1), e.drawImage(t, 0, 0, i, h);
                const o = Math.max(0, Math.floor(0.4 * i)),
                    a = Math.max(0, Math.floor(0.4 * h)),
                    r = Math.max(1, Math.min(4, i - o)),
                    n = Math.max(1, Math.min(4, h - a)),
                    d = e.getImageData(o, a, r, n).data;
                let m = 0,
                    c = 0,
                    M = 0,
                    l = 0;
                for (let t = 0; t < d.length; t += 4) {
                    d[t + 3] < 8 || ((m += d[t]), (c += d[t + 1]), (M += d[t + 2]), l++);
                }
                l > 0 && ((m = Math.round(m / l)), (c = Math.round(c / l)), (M = Math.round(M / l)), (p.color = new THREE.Color(m / 255, c / 255, M / 255)));
            }
        } catch (t) {}
        (this.sprite = new THREE.Sprite(p)), (this.sprite.material.toneMapped = !1), this.sprite.scale.set(this.size, this.size, this.size), this.sprite.position.set(this.x, this.y, this.z), this.scene.add(this.sprite);
    }
    tick(t) {
        (this.xo = this.x), (this.yo = this.y), (this.zo = this.z);
        const i = performance.now();
        if (i - this.birth >= this.lifetimeMs) return void this.remove();
        this.yd -= 0.06;
        let h = this.x + this.xd,
            s = this.y + this.yd,
            e = this.z + this.zd;
        const o = Math.floor(h),
            a = Math.floor(s),
            r = Math.floor(e),
            n = (i, h, s) => !(!t || i < 0 || h < 0 || s < 0 || i >= t.width || s >= t.height || h >= t.depth) && 0 !== t.getTile(i, h, s);
        if (
            (n(o, Math.floor(this.y), r) && ((h = this.x), (e = this.z), (this.xd *= -0.3), (this.zd *= -0.3)),
            n(o, a, r) && ((s = Math.ceil(s) + 0.001), (this.yd = 0), (this.xd *= 0.4), (this.zd *= 0.4), this.grounded || ((this.grounded = !0), (this.groundContactStart = performance.now()))),
            (this.x = h),
            (this.y = s),
            (this.z = e),
            (this.xd *= 0.96),
            (this.yd *= 0.995),
            (this.zd *= 0.96),
            this.sprite)
        ) {
            this.sprite.position.set(this.x, this.y, this.z);
            const t = (i - this.birth) / this.lifetimeMs;
            this.sprite.material.opacity = 1 - t;
        }
        this.grounded && i - (this.groundContactStart || 0) >= 500 && this.remove();
    }
    remove() {
        this.removed || ((this.removed = !0), this.sprite && this.scene && this.scene.remove(this.sprite));
    }
}
