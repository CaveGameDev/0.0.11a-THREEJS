import { THREE } from "./LibHandler.js";
import { AABB } from "./AABB/AABB.js";
export class Entity {
    constructor(i) {
        (this.level = i),
            (this.x = 0),
            (this.y = 0),
            (this.z = 0),
            (this.xo = 0),
            (this.yo = 0),
            (this.zo = 0),
            (this.xd = 0),
            (this.yd = 0),
            (this.zd = 0),
            (this.onGround = !1),
            (this.removed = !1),
            (this.width = 0),
            (this.height = 0),
            (this.boundingBox = null);
    }
    setPos(i, t, o) {
        (this.x = i), (this.y = t), (this.z = o);
        const s = 0.3;
        (this.width = s), (this.height = 0.9), (this.boundingBox = new AABB(i - s, t - 0.9, o - s, i + s, t + 0.9, o + s));
    }
    moveRelative(i, t, o) {
        let s = Math.sqrt(i * i + t * t);
        s < 0.01 || ((s = o / s), (i *= s), (t *= s), (this.xd += i), (this.zd += t));
    }
    move(i, t, o) {
        const s = i,
            h = t,
            n = o,
            d = this.boundingBox.expand(i, t, o),
            e = this.level.getCubes(d);
        for (const i of e) t = i.clipYCollide(this.boundingBox, t);
        this.boundingBox.move(0, t, 0);
        for (const t of e) i = t.clipXCollide(this.boundingBox, i);
        this.boundingBox.move(i, 0, 0);
        for (const i of e) o = i.clipZCollide(this.boundingBox, o);
        this.boundingBox.move(0, 0, o),
            (this.onGround = h !== t && h < 0),
            s !== i && (this.xd = 0),
            h !== t && (this.yd = 0),
            n !== o && (this.zd = 0),
            (this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2),
            (this.y = this.boundingBox.minY),
            (this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2);
    }
    remove() {
        this.removed = !0;
    }
    tick() {}
    render(i) {}
}
