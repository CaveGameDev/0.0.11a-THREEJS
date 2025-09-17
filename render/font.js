export class Font {
    constructor(t = "/default.gif") {
        (this.charWidths = new Uint8Array(256)),
            (this.image = new Image()),
            (this.ready = !1),
            (this.image.onload = () => {
                try {
                    this._processImage();
                } finally {
                    this.ready = !0;
                }
            }),
            (this.image.onerror = () => {
                console.warn("Font image failed to load:", t), (this.ready = !0);
            }),
            (this.image.src = t);
    }
    _processImage() {
        const t = this.image,
            e = t.width,
            a = t.height,
            o = document.createElement("canvas");
        (o.width = e), (o.height = a);
        const i = o.getContext("2d", { willReadFrequently: !0 });
        (i.imageSmoothingEnabled = !1), i.drawImage(t, 0, 0, e, a);
        const r = i.getImageData(0, 0, e, a).data,
            h = Math.floor(e / 16) || 8,
            s = Math.floor(a / 16) || 8;
        for (let t = 0; t < 128; t++) {
            const a = t % 16,
                o = Math.floor(t / 16);
            let i, n;
            for (i = 0; i < h; i++) {
                n = !0;
                const t = a * h + i;
                for (let a = 0; a < s && n; a++) {
                    r[4 * ((o * s + a) * e + t) + 3] > 128 && (n = !1);
                }
                if (!n) break;
            }
            32 === t && (i = Math.floor(h / 2)), (this.charWidths[t] = i);
        }
    }
    drawShadow(t, e, a, o, i = "#ffffff") {
        t && this.ready && (this.draw(t, e, a + 1, o + 1, "rgba(63,63,63,1)", !0), this.draw(t, e, a, o, i, !1));
    }
    draw(t, e, a, o, i = "#ffffff", r = !1) {
        if (!t || !this.ready) return;
        if (!this.image || !this.image.width) return;
        t.imageSmoothingEnabled = !1;
        let h = 0;
        const s = r ? 0.92 : 1,
            n = Math.floor(this.image.width / 16) || 8,
            l = Math.floor(this.image.height / 16) || 8;
        t.save(), (t.globalAlpha = s);
        const g = document.createElement("canvas");
        (g.width = n), (g.height = l);
        const d = g.getContext("2d");
        d.imageSmoothingEnabled = !1;
        for (let r = 0; r < e.length; r++) {
            const s = e.charCodeAt(r);
            if (38 === s && r + 1 < e.length) {
                r++;
                continue;
            }
            const c = (s % 16) * n,
                f = Math.floor(s / 16) * l;
            try {
                d.clearRect(0, 0, n, l),
                    d.drawImage(this.image, c, f, n, l, 0, 0, n, l),
                    i && ((d.globalCompositeOperation = "source-in"), (d.fillStyle = i), d.fillRect(0, 0, n, l), (d.globalCompositeOperation = "source-over")),
                    t.drawImage(g, 0, 0, n, l, a + h, o, n, l);
            } catch (t) {}
            h += this.charWidths[s] || n;
        }
        t.restore();
    }
    width(t) {
        if (!t) return 0;
        let e = 0;
        for (let a = 0; a < t.length; a++) {
            const o = t.charCodeAt(a);
            38 === o && a + 1 < t.length ? a++ : (e += this.charWidths[o] || Math.floor(this.image.width / 16 || 8));
        }
        return e;
    }
}
export default Font;
