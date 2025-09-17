export function drawVersionImageToCanvas(t) {
    if (!t) return !1;
    try {
        const o = t.getContext("2d");
        if (!o) return !1;
        o.clearRect(0, 0, t.width, t.height);
        const e = new Image(),
            a = "undefined" != typeof window ? window["zip_img_Version.png"] : null;
        return (e.src = a || "/Version.png"), e.complete ? (n(e, t), !0) : ((e.onload = () => n(e, t)), (e.onerror = () => {}), !0);
    } catch (t) {
        return console.warn("drawVersionImageToCanvas error", t), !1;
    }
    function n(t, n) {
        const o = t.width || 128,
            e = t.height || 32,
            a = document.createElement("canvas");
        (a.width = o), (a.height = e);
        const i = a.getContext("2d");
        (i.imageSmoothingEnabled = !1), i.drawImage(t, 0, 0, o, e);
        const r = i.getImageData(0, 0, o, e),
            h = r.data;
        for (let t = 0; t < h.length; t += 4) {
            const n = h[t],
                o = h[t + 1],
                e = h[t + 2],
                a = h[t + 3];
            if (a > 8 && e > 100 && e > 1.3 * n && e > 1.3 * o) {
                h[t + 3] = 0;
                continue;
            }
            if (a > 8 && n > 100 && n > 1.3 * o && n > 1.3 * e) {
                h[t + 3] = 0;
                continue;
            }
            if (a > 8 && n < 30 && o < 30 && e < 30) {
                h[t + 3] = 0;
                continue;
            }
            const i = 1.06,
                r = 1.06,
                d = 1.02;
            let g = Math.min(255, Math.round(n * i)),
                c = Math.min(255, Math.round(o * r)),
                m = Math.min(255, Math.round(e * d));
            (g = Math.min(255, Math.round(g + 0.06 * g))), (c = Math.min(255, Math.round(c + 0.06 * c))), (m = Math.min(255, Math.round(m + 0.06 * m))), (h[t] = g), (h[t + 1] = c), (h[t + 2] = m);
        }
        i.putImageData(r, 0, 0);
        const d = n.getContext("2d");
        d.clearRect(0, 0, n.width, n.height), (d.imageSmoothingEnabled = !1);
        const g = 0.85 * Math.min((n.width / 2 - 4) / o, (n.height / 2 - 4) / e, 3),
            c = Math.max(16, Math.floor(o * g)),
            m = Math.max(8, Math.floor(e * g)),
            l = 2 - Math.floor(0.02 * c);
        d.drawImage(a, 0, 0, o, e, l, 4, c, m), (d.globalCompositeOperation = "destination-over"), (d.globalAlpha = 0.7), d.drawImage(a, 0, 0, o, e, l + 1, 5, c, m), (d.globalAlpha = 1), (d.globalCompositeOperation = "source-over");
    }
}
