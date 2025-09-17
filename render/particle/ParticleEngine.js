import { THREE } from "../../LibHandler.js";
import { Particle } from "./Particle.js";
export class ParticleEngine {
    constructor(t, e, s) {
        (this.scene = t), (this.level = e), (this.texture = s), (this.particles = []), (this.MAX_PARTICLES = 20);
    }
    add(t, e, s, i = 0, r = 0, a = 0, h = null) {
        if (this.particles.length >= this.MAX_PARTICLES) {
            const t = this.particles.shift();
            try {
                t && "function" == typeof t.remove && t.remove();
            } catch (t) {}
        }
        const c = new Particle(this.scene, h || this.texture, t, e, s, i, r, a);
        this.particles.push(c);
    }
    burst(t, e, s, i = 8, r = 0.35, a = null) {
        const h = Math.max(0, this.MAX_PARTICLES - this.particles.length),
            c = Math.min(i, Math.max(1, h));
        for (let i = 0; i < c; i++) {
            const i = (2 * Math.random() - 1) * r,
                h = (2 * Math.random() - 1) * r,
                c = (2 * Math.random() - 1) * r;
            this.add(t + 0.3 * (Math.random() - 0.5), e + 0.3 * (Math.random() - 0.5), s + 0.3 * (Math.random() - 0.5), i, h + 0.1, c, a);
        }
    }
    tick() {
        for (let t = this.particles.length - 1; t >= 0; t--) {
            const e = this.particles[t];
            e.tick(this.level), e.removed && this.particles.splice(t, 1);
        }
    }
}
