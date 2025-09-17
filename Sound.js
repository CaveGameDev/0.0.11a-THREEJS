const GRASS_SOUNDS = ["wet_grass1.ogg", "wet_grass2.ogg", "wet_grass3.ogg", "wet_grass4.ogg"],
    STONE_SOUNDS = ["stone1.ogg", "stone2.ogg", "stone3.ogg", "stone4.ogg"];
let audioEnabled = !0,
    masterVolume = 0.9;
const audioPools = { grass: [], stone: [] },
    MAX_CONCURRENT_VOICES = 4,
    activeCounts = { grass: 0, stone: 0 },
    recentPlays = new Map();
function markPlayed(e) {
    recentPlays.set(e, performance.now());
}
function wasRecentlyPlayed(e, t = 120) {
    const o = recentPlays.get(e);
    return !!o && (!(performance.now() - o > t) || (recentPlays.delete(e), !1));
}
try {
    createAudioPool(GRASS_SOUNDS, audioPools.grass), createAudioPool(STONE_SOUNDS, audioPools.stone);
} catch (e) {
    console.warn("[Sound] pool init failed", e);
}
function playPooled(e) {
    if (!audioEnabled) return;
    const t = audioPools[e];
    if (!t || 0 === t.length) return;
    if (activeCounts[e] >= MAX_CONCURRENT_VOICES) return;
    const o = t[Math.floor(Math.random() * t.length)];
    if (o)
        try {
            const t = o.dataset.name,
                n = t && window["zip_audio_" + t],
                a = o.cloneNode(!0);
            (a.src = n || a.src || ""), (a.volume = Math.max(0, Math.min(1, masterVolume * ("grass" === e ? 0.85 : 1))));
            try {
                a.playbackRate = 0.96 + 0.08 * Math.random();
            } catch (e) {}
            activeCounts[e] += 1;
            const s = () => {
                try {
                    activeCounts[e] = Math.max(0, activeCounts[e] - 1);
                } catch (e) {}
            };
            a.addEventListener("ended", s, { once: !0 }),
                a.addEventListener("error", s, { once: !0 }),
                setTimeout(() => {
                    try {
                        a.play().catch(() => {});
                    } catch (e) {}
                }, 0);
        } catch (e) {}
}
function createAudioPool(e, t) {
    for (const o of e) {
        const e = document.createElement("audio");
        (e.preload = "auto"), (e.dataset.name = o);
        const n = window["zip_audio_" + o];
        n && (e.src = n), e.load(), t.push(e);
    }
}
function makeBitcrushShaper() {
    return null;
}
function playBuffer(e, t = {}) {
    if (!audioEnabled) return;
    if (e && e.getChannelData && void 0 !== window.AudioContext)
        try {
            const o = new (window.AudioContext || window.webkitAudioContext)(),
                n = o.createBufferSource();
            n.buffer = e;
            const a = o.createGain();
            return (
                (a.gain.value = masterVolume * (t.volumeMultiplier || 1)),
                n.connect(a),
                a.connect(o.destination),
                n.start(),
                void (n.onended = () => {
                    try {
                        n.disconnect(), a.disconnect(), o.close();
                    } catch (e) {}
                })
            );
        } catch (e) {}
    playPooled("stone" === t.forceType || (t.guess && "stone" === t.guess) ? "stone" : "grass");
}
export function setVolume(e) {
    masterVolume = Math.max(0, Math.min(1, e));
}
export function enableAudio(e) {
    audioEnabled = !!e;
}
export function playBreakSoundForTile(e, t = null) {
    try {
        if (!audioEnabled) return;
        let o = e,
            n = null;
        if (e && "object" == typeof e)
            if (("id" in e && (o = e.id), e.key)) n = String(e.key).toLowerCase();
            else if ("function" == typeof e.getTextureKey)
                try {
                    n = String(e.getTextureKey(0) || "").toLowerCase();
                } catch (e) {}
        const a = t || `tile_${o}_${n || ""}`;
        if (wasRecentlyPlayed(a, 140)) return;
        markPlayed(a);
        const s = (n && (n.includes("grass") || n.includes("dirt") || n.includes("turf"))) || 2 === o || 3 === o || 9 === o,
            r = (n && n.includes("stone")) || 1 === o;
        s ? playPooled("grass") : r && playPooled("stone");
    } catch (e) {}
}
