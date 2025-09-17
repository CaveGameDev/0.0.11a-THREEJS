export const BlockFaceColors = {
    BOTTOM_FACE_MULTIPLIER: 0.5,
    TOP_FACE_MULTIPLIER: 1,
    SIDE_FACE_MULTIPLIER: 0.8,
    END_FACE_MULTIPLIER: 0.6,
    getFaceColorMultiplier(e) {
        switch (e) {
            case 0:
                return this.TOP_FACE_MULTIPLIER;
            case 1:
                return this.BOTTOM_FACE_MULTIPLIER;
            case 2:
            case 3:
                return this.SIDE_FACE_MULTIPLIER;
            case 4:
            case 5:
                return this.END_FACE_MULTIPLIER;
            default:
                return 1;
        }
    },
};
export const BlockColorSystem = {
    getBlockFaceLighting(e, t, r, s, a, c) {
        let i = t,
            l = r,
            o = s;
        switch (a) {
            case 0:
                l = r + 1;
                break;
            case 1:
                l = r - 1;
                break;
            case 2:
                o = s - 1;
                break;
            case 3:
                o = s + 1;
                break;
            case 4:
                i = t + 1;
                break;
            case 5:
                i = t - 1;
        }
        if (!e || i < 0 || i >= e.width || l < 0 || l >= e.depth || o < 0 || o >= e.height) return { finalBrightness: 1, isSunlit: !0 };
        let E = !0,
            n = 1;
        try {
            e.getGroundHeight(i, o) > l ? ((n = 0.5), (E = !1)) : ((n = 1), (E = !0));
        } catch (e) {
            (n = 1), (E = !0);
        }
        const I = BlockFaceColors.getFaceColorMultiplier(0 === a ? 0 : 1 === a ? 1 : a);
        return { finalBrightness: Math.max(0, Math.min(1, n * I)), isSunlit: E };
    },
};
