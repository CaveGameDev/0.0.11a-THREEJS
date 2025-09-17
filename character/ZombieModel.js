import { THREE } from "../LibHandler.js";
import { Cube } from "../render/Cube.js";
export class ZombieModel {
    constructor() {
        (this.head = new Cube(0, 0)),
            this.head.addBox(-4, -8, -4, 8, 8, 8),
            (this.body = new Cube(16, 16)),
            this.body.addBox(-4, 0, -2, 8, 12, 4),
            (this.arm0 = new Cube(40, 16)),
            this.arm0.addBox(-3, -2, -2, 4, 12, 4),
            this.arm0.setPos(-5, 2, 0),
            (this.arm1 = new Cube(40, 16)),
            this.arm1.addBox(-1, -2, -2, 4, 12, 4),
            this.arm1.setPos(5, 2, 0),
            (this.leg0 = new Cube(0, 16)),
            this.leg0.addBox(-2, 0, -2, 4, 12, 4),
            this.leg0.setPos(-2, 12, 0),
            (this.leg1 = new Cube(0, 16)),
            this.leg1.addBox(-2, 0, -2, 4, 12, 4),
            this.leg1.setPos(2, 12, 0),
            (this.group = new THREE.Group()),
            this.group.add(this.head.group),
            this.group.add(this.body.group),
            this.group.add(this.arm0.group),
            this.group.add(this.arm1.group),
            this.group.add(this.leg0.group),
            this.group.add(this.leg1.group),
            this.group.scale.set(2, 2, 2);
    }
    setTexture(e, t, a) {
        const s = a || null;
        if (
            (e &&
                ((e.magFilter = THREE.NearestFilter),
                (e.minFilter = THREE.NearestFilter),
                (e.wrapS = THREE.ClampToEdgeWrapping),
                (e.wrapT = THREE.ClampToEdgeWrapping),
                e.offset && e.offset.set(0, 0),
                e.repeat && e.repeat.set(1, 1),
                (e.flipY = !1)),
            t &&
                ((t.magFilter = THREE.NearestFilter),
                (t.minFilter = THREE.NearestFilter),
                (t.wrapS = THREE.ClampToEdgeWrapping),
                (t.wrapT = THREE.ClampToEdgeWrapping),
                t.offset && t.offset.set(0, 0),
                t.repeat && t.repeat.set(1, 1),
                (t.flipY = !1)),
            s &&
                ((s.magFilter = THREE.NearestFilter),
                (s.minFilter = THREE.NearestFilter),
                (s.wrapS = THREE.ClampToEdgeWrapping),
                (s.wrapT = THREE.ClampToEdgeWrapping),
                s.offset && s.offset.set(0, 0),
                s.repeat && s.repeat.set(1, 1),
                (s.flipY = !1)),
            this.head && this.head.mesh)
        ) {
            const t = new THREE.MeshBasicMaterial({ map: e || null, transparent: !0, side: THREE.DoubleSide }),
                a = (new THREE.MeshBasicMaterial({ map: e || null, transparent: !0, side: THREE.DoubleSide }), [t, t, t, t, new THREE.MeshBasicMaterial({ map: s || e || null, transparent: !0, side: THREE.DoubleSide }), t]);
            (this.head.mesh.material = a),
                a.forEach((e) => {
                    e && e.color && e.color.setScalar(0.6), e && (e.needsUpdate = !0);
                });
        }
        [this.arm0, this.arm1].forEach((a) => {
            a.mesh && ((a.mesh.material.map = t || e || null), a.mesh.material.color.setScalar(0.6), (a.mesh.material.needsUpdate = !0));
        }),
            [this.body, this.leg0, this.leg1].forEach((t) => {
                t.mesh && ((t.mesh.material.map = e || null), t.mesh.material.color.setScalar(0.6), (t.mesh.material.needsUpdate = !0));
            });
    }
    render(e) {
        const t = 12 * e,
            a =
                (Math.PI,
                Math.PI,
                (e) => {
                    const t = 2 * Math.PI;
                    let a = ((e % t) + t) % t;
                    const s = Math.floor(a / (t / 3));
                    return 0 === s ? -1 : 1 === s ? 0 : 1;
                }),
            s = e;
        a(s), a(s + Math.PI);
        (this.head.yRot = a(0.9 * t) * ((20 * Math.PI) / 180)), (this.head.xRot = a(1.1 * t) * ((20 * Math.PI) / 180));
        const r = (20 * Math.PI) / 180,
            i = (15 * Math.PI) / 180,
            h = 2 * ((45 * Math.PI) / 180 + r + Math.PI + (45 * Math.PI) / 180) - i;
        (this.arm0.xRot = 0),
            (this.arm0.yRot = 0),
            (this.arm0.zRot = 1 * h),
            (this.arm1.xRot = 0),
            (this.arm1.yRot = 0),
            (this.arm1.zRot = 1 * -h),
            (this.leg0.xRot = 0),
            (this.leg1.xRot = 0),
            [this.head, this.body, this.arm0, this.arm1, this.leg0, this.leg1].forEach((e) => {
                e.render();
            });
    }
}
const MINIFY_ZM_EXPORT = !0;
export { ZombieModel as ZM };
