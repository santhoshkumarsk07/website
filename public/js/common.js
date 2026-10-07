/* Shared helpers for the public pages */
window.ANDAHA = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

  async function getJSON(url) {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`${url} → ${r.status}`);
    return r.json();
  }

  /* WhatsApp order link (falls back to phone / email when no number is set) */
  function orderLink(settings, text) {
    if (settings.whatsapp) return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
    if (settings.phone) return `tel:${settings.phone.replace(/[^\d+]/g, "")}`;
    if (settings.email) return `mailto:${settings.email}?subject=${encodeURIComponent("Order enquiry")}&body=${encodeURIComponent(text)}`;
    return "";
  }

  const icons = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const emblem = `
    <svg class="emblem" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="50" cy="50" r="40.5" fill="none" stroke="currentColor" stroke-width=".8" stroke-dasharray="2 3"/>
      <path d="M50 20 31 74h8l4.6-13.5h12.8L61 74h8zM46.2 53 50 41.5 53.8 53z" fill="currentColor"/>
    </svg>`;

  /* =========================================================
     Kids scene: balloons, clouds and stars on a pastel sky
  ========================================================= */
  function kidsScene(canvas) {
    const ctx = canvas.getContext("2d");
    const palette = ["#ff9a8b", "#ffd166", "#7bdcb5", "#8ec5ff", "#c3a6ff", "#ffb3d1"];
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = performance.now(), px = 0, py = 0, visible = true;
    let balloons = [], clouds = [], stars = [];

    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.max(8, Math.min(18, w / 90)));
      balloons = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: h + Math.random() * h, r: 18 + Math.random() * 26,
        c: palette[i % palette.length], v: 12 + Math.random() * 22, ph: Math.random() * 6.3, z: .5 + Math.random() * .7
      }));
      clouds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * w, y: 40 + i * h / 6, s: .6 + Math.random() * .8, v: 6 + Math.random() * 10 }));
      stars = Array.from({ length: 26 }, () => ({ x: Math.random() * w, y: Math.random() * h * .7, r: 1.5 + Math.random() * 3, ph: Math.random() * 6.3 }));
    }

    function cloud(x, y, s) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      for (const [dx, dy, r] of [[0, 0, 28], [30, -14, 34], [64, 0, 26], [32, 8, 30]]) ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }

    function balloon(b, t) {
      const sway = Math.sin(t * 1.2 + b.ph) * 10 * b.z;
      const x = b.x + sway + px * 18 * b.z, y = b.y + py * 10 * b.z, r = b.r * b.z;
      ctx.strokeStyle = "rgba(90,80,110,.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y + r * 1.15);
      ctx.bezierCurveTo(x - 8, y + r * 2, x + 8, y + r * 2.6, x - 2, y + r * 3.4); ctx.stroke();
      const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.2);
      g.addColorStop(0, "#fff"); g.addColorStop(.25, b.c); g.addColorStop(1, b.c);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 4, y + r * 1.15); ctx.lineTo(x + 4, y + r * 1.15); ctx.lineTo(x, y + r * 1.02); ctx.fill();
    }

    function frame(now) {
      const t = (now - t0) / 1000, dt = 1 / 60;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#fde8ef"); sky.addColorStop(.55, "#fdf3e1"); sky.addColorStop(1, "#e3f6ee");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = .35 + .35 * Math.sin(t * 2 + s.ph);
        ctx.fillStyle = "#ffc94d"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const c of clouds) {
        if (!reduceMotion) c.x += c.v * dt;
        if (c.x > w + 120) c.x = -140;
        cloud(c.x + px * 8, c.y, c.s);
      }
      for (const b of balloons) {
        if (!reduceMotion) b.y -= b.v * dt;
        if (b.y < -b.r * 4) { b.y = h + b.r * 2; b.x = Math.random() * w; }
        balloon(b, t);
      }
      if (!reduceMotion && visible) raf = requestAnimationFrame(frame);
    }

    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    }).observe(canvas);
    raf = requestAnimationFrame(frame);
    return { stop: () => { visible = false; cancelAnimationFrame(raf); } };
  }

  /* Hero media: video when the category has one, otherwise the kids scene */
  function heroMedia(container, cat, { eager = true } = {}) {
    container.innerHTML = "";
    if (cat.video) {
      const v = document.createElement("video");
      Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: eager ? "auto" : "metadata" });
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      if (cat.poster) v.poster = cat.poster;
      v.src = cat.video;
      container.appendChild(v);
      if (reduceMotion) v.removeAttribute("autoplay");
      else v.play().catch(() => {});
      return { el: v, stop: () => v.pause() };
    }
    const c = document.createElement("canvas");
    container.appendChild(c);
    const scene = kidsScene(c);
    return { el: c, stop: scene.stop };
  }

  return { $, $$, esc, money, getJSON, orderLink, icons, emblem, kidsScene, heroMedia, reduceMotion };
})();
