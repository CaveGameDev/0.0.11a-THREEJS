import { THREE } from "../LibHandler.js";
export class Cube {
    constructor(t = 0, s = 0) {
        (this.xTexOffs = t), (this.yTexOffs = s), (this.group = new THREE.Group()), (this.mesh = null), (this.x = 0), (this.y = 0), (this.z = 0), (this.xRot = 0), (this.yRot = 0), (this.zRot = 0);
    }
    setPos(t, s, i) {
        (this.x = t), (this.y = s), (this.z = i), this.mesh && this.group.position.set(t, s, i);
    }
    addBox(t, s, i, e, h, o) {
        const r = new THREE.BoxGeometry(e, h, o);
        r.translate(t + e / 2, s + h / 2, i + o / 2);
        const n = this.xTexOffs,
            a = this.yTexOffs,
            x = e,
            E = h,
            R = o,
            u = (t) => t / 64,
            c = (t) => 1 - t / 32,
            f = r.attributes.uv,
            p = f.array;
        function T(t, s, i, e, h) {
            const o = 12 * t,
                r = u(s),
                n = c(i),
                a = u(e),
                x = c(h);
            (p[o + 0] = r), (p[o + 1] = n), (p[o + 2] = a), (p[o + 3] = n), (p[o + 4] = a), (p[o + 5] = x), (p[o + 6] = a), (p[o + 7] = x), (p[o + 8] = r), (p[o + 9] = x), (p[o + 10] = r), (p[o + 11] = n);
        }
        T(0, n + R, a + R, n + R + R, a + R + E),
            T(1, n + R + x + R, a + R, n + R + x + R + R, a + R + E),
            T(2, n + R, a, n + R + x, a + R),
            T(3, n + R + x, a, n + R + x + x, a + R),
            T(4, n + R, a + R, n + R + x, a + R + E),
            T(5, n + R + x + R, a + R, n + R + x + R + x, a + R + E),
            (f.needsUpdate = !0);
        const d = new THREE.MeshBasicMaterial({ color: 16777215, transparent: !0, side: THREE.DoubleSide }),
            y = new THREE.Mesh(r, d);
        y.position.set(0, 0, 0), (this.mesh = y), this.group.add(y), this.setPos(this.x, this.y, this.z);
    }
    render() {
        this.mesh && this.mesh.rotation.set(this.xRot, this.yRot, this.zRot);
    }
}
