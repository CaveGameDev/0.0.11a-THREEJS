export const ANIM_DEBUG_LOG = !1;
export const ARM_IN_DEG = 100;
export const LEG_LIMIT_DEG = 35;
export const ARM_SWING_SPEED = 0.9;
export const JITTER_MAG = 3;
export const JITTER_TIME_SCALE = 0.35;
export const HEAD_JITTER_MAG = 6;
const KEEP_MIN_API = !0;
export function q(t) {
    const a = 2 * Math.PI;
    let o = ((t % a) + a) % a;
    const n = Math.floor(o / (a / 3));
    return 0 === n ? -1 : 1 === n ? 0 : 1;
}
function jitter(t = 0, a = JITTER_MAG) {
    return (0.5 * Math.sin((t || 0) * JITTER_TIME_SCALE) + 0.2 * (Math.random() - 0.5)) * a * (Math.PI / 180);
}
export function u(t) {
    return { arm0: { xRot: 2 * Math.sin(0.6662 * t * 9 + Math.PI), zRot: 1 * (Math.sin(0.2312 * t * 9) + 1) }, arm1: { xRot: 2 * Math.sin(0.6662 * t * 9), zRot: 1 * (Math.sin(0.2812 * t * 9) - 1) } };
}
export function c(t) {
    const a = (100 * Math.PI) / 180,
        o = (35 * Math.PI) / 180,
        n = 0.9 * t,
        r = q(n),
        M = q(n + Math.PI),
        e = { xRot: 1.2 * r + jitter(t), zRot: -Math.abs(r) * a + jitter(t) },
        h = { xRot: 1.2 * M + jitter(t), zRot: +Math.abs(M) * a + jitter(t) };
    let i = r * o + jitter(t),
        s = M * o + jitter(t);
    (i = Math.max(-o, Math.min(o, i))), (s = Math.max(-o, Math.min(o, s)));
    const I = 1 * Math.sin(0.83 * t) + 0.5 * jitter(t, 6);
    return { arm0: e, arm1: h, leg0Rad: i, leg1Rad: s, headPitchRad: 0.8 * Math.sin(t) + 0.5 * jitter(t, 6), headYawRad: I };
}
