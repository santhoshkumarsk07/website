/* =========================================================
   Saree storefront — animations & interactions
   GSAP + ScrollTrigger + Lenis (all in /vendor, no build step)
========================================================= */
(() => {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rupee = n => "₹" + n.toLocaleString("en-IN");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const icon = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
  };

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- brand ---------- */
  $$("[data-brand]").forEach(el => (el.textContent = S.brand));
  $$("[data-tagline]").forEach(el => (el.textContent = S.tagline));
  document.title = `${S.brand} — ${S.tagline}`;

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ lerp: 0.085, smoothWheel: !reduce });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a =>
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      $("#mobileNav").classList.remove("is-open");
      lenis.scrollTo(id, { offset: -60, duration: 1.6 });
    })
  );

  /* ---------- cart + toast ---------- */
  let cart = 0;
  const toast = $("#toast");
  function addToCart(name) {
    cart++;
    const c = $("#cartCount");
    c.textContent = cart;
    c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
    toast.textContent = name ? `${name.replace(/<br>/g, " ")} — added to cart` : "Added to cart";
    toast.classList.add("is-on");
    clearTimeout(addToCart.t);
    addToCart.t = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if (b) { e.preventDefault(); addToCart(b.dataset.add); }
    const h = e.target.closest(".heart");
    if (h) { e.preventDefault(); h.classList.toggle("is-on"); gsap.fromTo(h, { scale: .6 }, { scale: 1, duration: .6, ease: "elastic.out(1,.4)" }); }
    const sz = e.target.closest(".sizes button");
    if (sz) { $$("button", sz.parentElement).forEach(x => x.classList.toggle("is-active", x === sz)); }
  });

  /* ---------- render product lists ---------- */
  const badgeClass = b => (b?.startsWith("-") ? "badge badge--sale" : b === "Bestseller" ? "badge badge--best" : "badge");
  const stars = r => `<span class="stars">${"★".repeat(Math.round(r))} <small>${r.toFixed(1)}</small></span>`;
  const priceHtml = p => `${rupee(p.price)}${p.was ? `<s>${rupee(p.was)}</s>` : ""}`;

  const card = p => `
    <article class="p-card">
      <div class="p-card__img">
        ${p.badge ? `<span class="${badgeClass(p.badge)}">${p.badge}</span>` : ""}
        <button class="heart" aria-label="Wishlist">${icon.heart}</button>
        <img src="images/product-${p.img}.jpg" alt="${p.name}" loading="lazy">
        <button class="quick" data-add="${p.name}">Quick add</button>
      </div>
      <div class="p-card__meta">
        ${p.rating ? stars(p.rating) : ""}
        <h3>${p.name}</h3><p>${p.tag}</p><p class="price">${priceHtml(p)}</p>
      </div>
    </article>`;
  const bridalCard = p => `
    <article class="b-card">
      <div class="p-card__img"><img src="images/product-${p.img}.jpg" alt="${p.name}" loading="lazy"></div>
      <div class="p-card__meta"><h3>${p.name}</h3><p>${p.tag}</p><p class="price">${priceHtml(p)}</p></div>
      <button class="add-gold" data-add="${p.name}">Add to cart</button>
    </article>`;
  const miniCard = p => `
    <article class="m-card">
      <div class="m-card__img"><img src="images/product-${p.img}.jpg" alt="${p.name}" loading="lazy"><span class="m-card__rate">★ ${p.rating}</span></div>
      <div>
        <h4>${p.name}</h4><p>${p.tag}</p>
        <div class="sizes"><button>S</button><button class="is-active">M</button><button>L</button><button>XL</button></div>
        <div class="m-card__foot"><b>${rupee(p.price)}</b><button class="cart-dot" data-add="${p.name}" aria-label="Add to cart">${icon.bag}</button></div>
      </div>
    </article>`;

  $$("[data-products]").forEach(el => {
    const key = el.dataset.products;
    const list = S.products[key];
    if (key === "bridal") el.innerHTML = list.map(bridalCard).join("");
    else if (key === "trend" || key === "seasonal") el.innerHTML = [...list, ...list].map(miniCard).join("");
    else el.innerHTML = list.map(card).join("");
  });

  /* =========================================================
     1. Intro curtain → hero
  ========================================================= */
  const intro = $("#intro");
  const heroLines = $$(".hero__title .line > span");
  const heroBits = $$(".hero .reveal-line");
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(heroBits, { y: 30, opacity: 0 });
  gsap.set(".hero__badges", { yPercent: 100 });
  gsap.set(".hero__caption", { opacity: 0 });

  function playHeroIn(delay = 0) {
    const tl = gsap.timeline({ delay });
    tl.fromTo(".hero__slide.is-active img", { scale: 1.35 }, { scale: 1, duration: 2.2, ease: "expo.out", clearProps: "transform" }, 0)
      .to(heroLines, { yPercent: 0, duration: 1.2, stagger: .12, ease: "expo.out" }, .25)
      .to(heroBits, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "expo.out" }, .5)
      .to(".hero__badges", { yPercent: 0, duration: 1, ease: "expo.out" }, .8)
      .to(".hero__caption", { opacity: 1, duration: 1.2 }, 1);
    return tl;
  }

  if (reduce) {
    intro.remove();
    gsap.set([heroLines, heroBits, ".hero__badges", ".hero__caption"], { clearProps: "all" });
  } else {
    document.body.classList.add("is-loading");
    lenis.stop();
    const tl = gsap.timeline({
      onComplete: () => { intro.remove(); document.body.classList.remove("is-loading"); lenis.start(); }
    });
    tl.fromTo(".intro__pattern", { scale: 1.35, rotate: -4 }, { scale: 1, rotate: 0, duration: 2.2, ease: "power3.out" }, 0)
      .fromTo(".intro__brand", { opacity: 0, y: 40, letterSpacing: ".4em" }, { opacity: 1, y: 0, letterSpacing: ".08em", duration: 1.4, ease: "expo.out" }, .3)
      .to(".intro__brand", { opacity: 0, y: -30, duration: .6, ease: "power2.in" }, 1.9)
      .to(intro, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "power4.inOut" }, 2.2)
      .to(".intro__pattern", { yPercent: -20, duration: 1.2, ease: "power4.inOut" }, 2.2)
      .add(playHeroIn(), 2.55);
    intro.addEventListener("click", () => tl.progress(.95));
  }

  /* ---------- hero slideshow ---------- */
  const slides = $$(".hero__slide");
  const caption = $("#heroCaption");
  let heroIdx = 0;
  setInterval(() => {
    if (document.hidden) return;
    slides[heroIdx].classList.remove("is-active");
    heroIdx = (heroIdx + 1) % slides.length;
    slides[heroIdx].classList.add("is-active");
    gsap.to(caption, {
      opacity: 0, y: -10, duration: .5, onComplete: () => {
        caption.innerHTML = S.heroCaptions[heroIdx % S.heroCaptions.length];
        caption.classList.toggle("left", heroIdx % 2 === 1);
        gsap.fromTo(caption, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, ease: "expo.out" });
      }
    });
  }, 5500);

  /* hero parallax out */
  gsap.to(".hero__slides", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__content", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true } });

  /* ---------- header states ---------- */
  const header = $("#header");
  let lastY = 0;
  lenis.on("scroll", ({ scroll }) => {
    document.body.classList.toggle("is-scrolled", scroll > 40);
    header.classList.toggle("is-solid", scroll > innerHeight * .8);
    header.classList.toggle("is-hidden", scroll > innerHeight && scroll > lastY + 2);
    if (scroll < lastY - 2) header.classList.remove("is-hidden");
    lastY = scroll;
  });
  $("#menuBtn").addEventListener("click", () => $("#mobileNav").classList.toggle("is-open"));

  /* =========================================================
     2. Velocity-aware marquee
  ========================================================= */
  $$("[data-marquee]").forEach(m => {
    const track = $(".marquee__track", m);
    track.innerHTML += track.innerHTML + track.innerHTML;
    let x = 0, dir = 1;
    gsap.ticker.add(() => {
      const v = lenis.velocity || 0;
      if (v > .2) dir = 1; else if (v < -.2) dir = -1;
      const half = track.scrollWidth / 3;
      x -= (0.6 + Math.min(Math.abs(v) * .25, 12)) * dir;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });

  /* =========================================================
     3. Section reveals
  ========================================================= */
  $$(".section__head").forEach(h =>
    gsap.from(h.children, { y: 40, opacity: 0, duration: 1.1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 85%" } })
  );

  // six moods: arches rise one by one, then the row eases smaller as you leave
  gsap.from(".moods .arch", {
    y: 120, opacity: 0, rotate: i => (i - 2.5) * 3, duration: 1.3, stagger: .08, ease: "expo.out",
    scrollTrigger: { trigger: ".moods__row", start: "top 85%" }
  });
  gsap.to(".moods__row", {
    scale: .82, yPercent: 8, transformOrigin: "50% 0%", ease: "none",
    scrollTrigger: { trigger: ".moods", start: "center center", end: "bottom top", scrub: true }
  });

  // product cards
  ScrollTrigger.batch(".p-card, .b-card", {
    start: "top 92%",
    onEnter: els => gsap.from(els, { y: 70, opacity: 0, duration: 1.1, stagger: .07, ease: "expo.out", overwrite: true })
  });

  // new arrivals sheet "bends" flat as it slides over the carousel
  const sheet = $(".sheet__inner");
  gsap.fromTo(sheet,
    { scaleX: .92, borderRadius: "50% 50% 0 0 / 160px 160px 0 0" },
    { scaleX: 1, borderRadius: "50% 50% 0 0 / 0px 0px 0 0", ease: "none",
      scrollTrigger: { trigger: ".sheet", start: "top bottom", end: "top 15%", scrub: true } }
  );

  // forecast arches open like doors
  gsap.from(".forecast__arches .arch__img", {
    clipPath: "inset(100% 0 0 0)", duration: 1.4, stagger: .15, ease: "expo.inOut",
    scrollTrigger: { trigger: ".forecast__arches", start: "top 80%" }
  });
  gsap.from(".forecast__arches img", {
    scale: 1.4, duration: 1.8, stagger: .15, ease: "expo.out",
    scrollTrigger: { trigger: ".forecast__arches", start: "top 80%" }
  });

  // edits cards
  gsap.from(".edit-card", {
    y: 100, opacity: 0, clipPath: "inset(20% 0 0 0)", duration: 1.3, stagger: .1, ease: "expo.out",
    scrollTrigger: { trigger: ".edits__grid", start: "top 85%" }
  });

  // footer image parallax
  gsap.fromTo(".footer__image img", { yPercent: -18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer__image", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* =========================================================
     4. Curved 3D carousel (Woven to Be Remembered)
  ========================================================= */
  (() => {
    const stage = $("#curveStage"), wrap = $("#curve");
    stage.innerHTML = S.signatures.map((p, i) => `
      <figure class="sig-card">
        <img src="images/signature-${i + 1}.jpg" alt="${p.name}" draggable="false">
        <figcaption><small>${p.tag}</small><h3>${p.name}</h3><b>${rupee(p.price)}</b>${p.was ? `<s>${rupee(p.was)}</s>` : ""}</figcaption>
      </figure>`).join("");
    const cards = $$(".sig-card", stage);
    let offset = 0, vel = 0, drag = null, hover = false;

    wrap.addEventListener("pointerdown", e => { drag = { x: e.clientX, o: offset, last: e.clientX }; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener("pointermove", e => { if (!drag) return; vel = drag.last - e.clientX; drag.last = e.clientX; offset = drag.o - (e.clientX - drag.x); });
    const end = () => (drag = null);
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);
    wrap.addEventListener("pointerenter", () => (hover = true));
    wrap.addEventListener("pointerleave", () => (hover = false));

    gsap.ticker.add(() => {
      const w = wrap.clientWidth;
      const cw = cards[0].offsetWidth;
      const spacing = cw * 1.04;
      const total = spacing * cards.length;
      const R = Math.max(w * .55, 520);
      if (!drag) {
        offset += vel + (hover ? .15 : .7) + (lenis.velocity || 0) * .35;
        vel *= .94;
      }
      cards.forEach((c, i) => {
        let x = (((i * spacing - offset) % total) + total) % total;
        if (x > total / 2) x -= total;
        const a = x / R;                       // angle on the cylinder
        const tx = Math.sin(a) * R;
        const tz = (1 - Math.cos(a)) * R * .55; // edges come toward you (concave)
        const ry = -a * 57.3 * .85;
        const vis = Math.abs(a) < 1.35;
        c.style.transform = `translate(-50%,-50%) translate3d(${tx}px,0,${tz}px) rotateY(${ry}deg)`;
        c.style.opacity = vis ? Math.min(1, (1.35 - Math.abs(a)) * 3) : 0;
        c.style.zIndex = Math.round(1000 - Math.abs(x));
      });
    });

    gsap.from(stage, { opacity: 0, y: 80, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: wrap, start: "top 85%" } });
  })();

  /* =========================================================
     5. Wavy edges that ripple while you scroll (bridal)
  ========================================================= */
  (() => {
    const waves = $$("[data-wave]");
    const build = (amp, phase, top) => {
      const W = 1440, H = 120, mid = 60, n = 6, seg = W / n;
      let d = top ? `M0 0 H${W} V${mid}` : `M0 ${H} H${W} V${mid}`;
      for (let i = n; i > 0; i--) {
        const x0 = i * seg, x1 = x0 - seg;
        const s = (i % 2 ? 1 : -1) * (top ? 1 : -1);
        const y1 = mid - amp * s * Math.cos(phase), y2 = mid + amp * s * Math.cos(phase);
        d += ` C${x0 - seg / 3} ${y1} ${x1 + seg / 3} ${y2} ${x1} ${mid}`;
      }
      return d + " Z";
    };
    const st = { p: 0 };
    gsap.to(st, {
      p: Math.PI * 2, ease: "none",
      scrollTrigger: { trigger: ".bridal", start: "top bottom", end: "bottom top", scrub: .6 },
      onUpdate: () => waves.forEach((w, i) => w.setAttribute("d", build(40, st.p + i, i === 0)))
    });
    waves.forEach((w, i) => w.setAttribute("d", build(40, i, i === 0)));
  })();

  gsap.fromTo(".bridal__feature img", { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".bridal", start: "top bottom", end: "bottom top", scrub: true } });

  /* draggable strip with inertia (bridal cards) */
  $$("[data-drag]").forEach(track => {
    const inner = track.firstElementChild;
    let x = 0, target = 0, start = null;
    const min = () => Math.min(0, track.clientWidth - inner.scrollWidth);
    track.addEventListener("pointerdown", e => { start = { x: e.clientX, t: target }; track.setPointerCapture(e.pointerId); });
    track.addEventListener("pointermove", e => { if (start) target = gsap.utils.clamp(min() - 80, 80, start.t + e.clientX - start.x); });
    const up = () => { start = null; target = gsap.utils.clamp(min(), 0, target); };
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    gsap.ticker.add(() => { x += (target - x) * .12; inner.style.transform = `translate3d(${x}px,0,0)`; });
    // also drift with page scroll
    ScrollTrigger.create({
      trigger: track, start: "top bottom", end: "bottom top",
      onUpdate: self => { if (!start) target = gsap.utils.clamp(min(), 0, min() * self.progress); }
    });
  });

  /* =========================================================
     6. Trend / seasonal rows slide in opposite directions
  ========================================================= */
  $$(".mini-row").forEach(row => {
    const track = row.firstElementChild, dir = +row.dataset.row;
    const dist = () => track.scrollWidth / 2;
    gsap.fromTo(track,
      { x: () => (dir > 0 ? 0 : -dist() * .6) },
      { x: () => (dir > 0 ? -dist() * .6 : 0), ease: "none", scrollTrigger: { trigger: ".rows", start: "top bottom", end: "bottom top", scrub: .8, invalidateOnRefresh: true } }
    );
  });

  /* =========================================================
     7. "Change look" spotlight
  ========================================================= */
  (() => {
    const fig = $("#lookFigure img"), ghost = $("#lookGhost"), info = $("#lookInfo");
    let cur = 0, busy = false;
    const field = n => $(`[data-look-field="${n}"]`, info);
    function setLook(i, dir = 1) {
      i = (i + S.looks.length) % S.looks.length;
      if (i === cur || busy) return;
      busy = true;
      const L = S.looks[i];
      $$(".look__thumb").forEach(t => t.classList.toggle("is-active", +t.dataset.look === i));
      $$(".swatch").forEach(t => t.classList.toggle("is-active", +t.dataset.look === i));
      const parts = $$("[data-look-field]", info);
      const tl = gsap.timeline({ onComplete: () => (busy = false) });
      tl.to(fig, { x: -120 * dir, opacity: 0, filter: "blur(14px)", scale: .96, duration: .55, ease: "power3.in" }, 0)
        .to(ghost, { opacity: 0, x: -60 * dir, duration: .5 }, 0)
        .to(parts, { y: -16, opacity: 0, duration: .35, stagger: .03 }, 0)
        .to(".look__orbit", { rotate: `+=${70 * dir}`, duration: 1.2, ease: "expo.inOut" }, 0)
        .add(() => {
          fig.src = `images/look-${i + 1}.png`;
          ghost.textContent = L.ghost;
          field("name").innerHTML = L.name;
          field("price").textContent = rupee(L.price);
          field("desc").textContent = L.desc;
          field("rating").innerHTML = `★★★★★ ${L.rating} <small>(${L.reviews} Reviews)</small>`;
          field("colour").textContent = L.colour;
          field("feats").innerHTML = L.feats.map(f => `<li>${f}</li>`).join("");
          cur = i;
        })
        .fromTo(fig, { x: 120 * dir, opacity: 0, filter: "blur(14px)", scale: .96 }, { x: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: .9, ease: "expo.out" })
        .fromTo(ghost, { opacity: 0, x: 60 * dir }, { opacity: 1, x: 0, duration: .9, ease: "expo.out" }, "<")
        .fromTo(parts, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .05, ease: "expo.out" }, "<.1");
    }
    $$("[data-look]").forEach(b => b.addEventListener("click", () => setLook(+b.dataset.look, +b.dataset.look > cur ? 1 : -1)));
    $$("[data-look-step]").forEach(b => b.addEventListener("click", () => setLook(cur + +b.dataset.lookStep, +b.dataset.lookStep)));

    const ctaText = $("#ctaText");
    $("#lookCart").addEventListener("click", () => {
      addToCart(S.looks[cur].name);
      ctaText.textContent = "ADDED TO CART ✓";
      gsap.fromTo("#lookCart svg", { rotate: -3 }, { rotate: 0, duration: .8, ease: "elastic.out(1,.35)", transformOrigin: "100% 100%" });
      setTimeout(() => (ctaText.textContent = "ADD TO CART"), 2200);
    });

    gsap.from(".look__figure", { y: 140, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".look", start: "top 70%" } });
    gsap.from(".look__thumb", { x: -60, opacity: 0, duration: 1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: ".look", start: "top 70%" } });
    gsap.from(".curved-cta", { xPercent: 60, yPercent: 60, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".look", start: "top 50%" } });
    gsap.to(".look__ghost", { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".look", start: "top bottom", end: "bottom top", scrub: true } });
  })();

  /* =========================================================
     8. Offers accordion (hover / tap, auto-cycles)
  ========================================================= */
  (() => {
    const offers = $$(".offer");
    let idx = offers.findIndex(o => o.classList.contains("is-active")), paused = false;
    const set = i => { idx = i; offers.forEach((o, k) => o.classList.toggle("is-active", k === i)); };
    offers.forEach((o, i) => {
      o.addEventListener("mouseenter", () => { paused = true; set(i); });
      o.addEventListener("click", () => set(i));
    });
    $("#offersRow").addEventListener("mouseleave", () => (paused = false));
    let visible = false;
    ScrollTrigger.create({ trigger: "#offersRow", start: "top bottom", end: "bottom top", onToggle: s => (visible = s.isActive) });
    setInterval(() => { if (visible && !paused && !document.hidden) set((idx + 1) % offers.length); }, 3800);
    gsap.from(offers, { y: 80, opacity: 0, duration: 1.2, stagger: .06, ease: "expo.out", scrollTrigger: { trigger: "#offersRow", start: "top 85%" } });
  })();

  /* =========================================================
     9. Pinned story scroller
  ========================================================= */
  (() => {
    const holder = $(".stories__slides");
    holder.innerHTML = S.stories.map((s, i) => `
      <div class="story" style="--tint:${s.tint}">
        <div class="story__bg"><img src="images/story-${i + 1}.jpg" alt=""></div>
        <h2 class="story__title">${s.title.split("<br>").map(t => `<span class="line"><span>${t}</span></span>`).join("")}</h2>
        <p class="story__sub">${s.sub}</p>
        <button class="story__add" data-add="${s.title}">${icon.bag.replace("<svg", '<svg style="width:11px;display:inline;vertical-align:-1px;fill:none;stroke:currentColor;stroke-width:2"')} Add to cart</button>
        <div class="story__thumbs">${s.thumbs.map(t => `<a class="story__thumb" href="#"><img src="images/product-${t}.jpg" alt=""><i>⊕</i></a>`).join("")}</div>
      </div>`).join("");
    const stories = $$(".story");
    const n = stories.length;
    $("#storyTotal").textContent = String(n).padStart(2, "0");

    const tl = gsap.timeline({ defaults: { ease: "none" } });
    stories.forEach((s, i) => {
      if (i === 0) return;
      const prev = stories[i - 1];
      tl.addLabel(`s${i}`)
        .to($$(".story__title .line > span", prev), { yPercent: -110, duration: .4 }, `s${i}`)
        .to($$(".story__thumbs, .story__sub, .story__add", prev), { opacity: 0, y: -30, duration: .3 }, `s${i}`)
        .to(s, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power2.inOut" }, `s${i}`)
        .fromTo($(".story__bg img", s), { scale: 1.35 }, { scale: 1.15, duration: 1 }, `s${i}`)
        .to($(".story__bg img", prev), { scale: 1.05, yPercent: -8, duration: 1 }, `s${i}`)
        .fromTo($$(".story__title .line > span", s), { yPercent: 105 }, { yPercent: 0, duration: .5, stagger: .08, ease: "power3.out" }, `s${i}+=.5`)
        .from($$(".story__thumb", s), { y: 60, opacity: 0, duration: .4, stagger: .05 }, `s${i}+=.55`)
        .from($$(".story__sub, .story__add", s), { opacity: 0, duration: .3 }, `s${i}+=.6`);
    });
    tl.addLabel("end");

    const st = ScrollTrigger.create({
      trigger: ".stories", start: "top top", end: () => `+=${innerHeight * (n - 1) * 1.1}`,
      pin: true, scrub: .8, animation: tl, invalidateOnRefresh: true,
      snap: { snapTo: 1 / (n - 1), directional: false, duration: { min: .3, max: .9 }, ease: "power2.inOut" },
      onUpdate: self => {
        const k = Math.min(n - 1, Math.round(self.progress * (n - 1)));
        $("#storyNow").textContent = String(k + 1).padStart(2, "0");
        $("#storyBar").style.transform = `scaleX(${self.progress})`;
      }
    });
    const goTo = k => {
      k = gsap.utils.clamp(0, n - 1, k);
      lenis.scrollTo(st.start + (st.end - st.start) * (k / (n - 1)), { duration: 1.2 });
    };
    const current = () => Math.round(st.progress * (n - 1));
    addEventListener("keydown", e => {
      if (!st.isActive) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goTo(current() + 1); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goTo(current() - 1); }
    });
    const pin = $(".stories__pin");
    let sx = null;
    pin.addEventListener("pointerdown", e => (sx = e.clientX));
    pin.addEventListener("pointerup", e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 60) goTo(current() + (dx < 0 ? 1 : -1));
    });
  })();

  /* =========================================================
     10. LATEST TRENDS — sliced glitch reveal + card deck
  ========================================================= */
  (() => {
    const title = $("#trendsTitle");
    ScrollTrigger.create({
      trigger: title, start: "top 80%", once: true,
      onEnter: () => {
        const bands = 7, clones = [];
        title.style.color = "transparent";
        for (let b = 0; b < bands; b++) {
          const c = document.createElement("span");
          c.innerHTML = title.innerHTML;
          Object.assign(c.style, {
            position: "absolute", inset: "0", color: "var(--ink)",
            clipPath: `inset(${(b / bands) * 100}% 0 ${100 - ((b + 1) / bands) * 100}% 0)`
          });
          title.appendChild(c); clones.push(c);
        }
        gsap.fromTo(clones,
          { x: () => gsap.utils.random(-140, 140), opacity: 0 },
          { x: 0, opacity: 1, duration: 1.1, stagger: { each: .05, from: "random" }, ease: "expo.out",
            onComplete: () => { clones.forEach(c => c.remove()); title.style.color = ""; } }
        );
      }
    });

    const deck = $("#deck");
    let cards = $$(".deck__card", deck);
    const count = $("#deckCount");
    let top = 0;
    const layout = (instant = false) => {
      cards.forEach((c, k) => {
        const pos = (k - top + cards.length) % cards.length;
        gsap.to(c, {
          x: pos * 18, y: -pos * 12, rotate: pos * 4, scale: 1 - pos * .05, zIndex: cards.length - pos,
          opacity: pos > 2 ? 0 : 1, duration: instant ? 0 : .8, ease: "expo.out"
        });
      });
      count.textContent = `${top + 1} / ${cards.length}`;
    };
    const step = dir => {
      const leaving = cards[top];
      top = (top + dir + cards.length) % cards.length;
      if (dir > 0) {
        gsap.timeline()
          .to(leaving, { x: -260, rotate: -18, duration: .45, ease: "power2.in" })
          .add(() => layout());
      } else layout();
    };
    layout(true);
    $$("[data-deck]").forEach(b => b.addEventListener("click", () => step(+b.dataset.deck)));
    let sx = null;
    deck.addEventListener("pointerdown", e => { sx = e.clientX; deck.setPointerCapture(e.pointerId); });
    deck.addEventListener("pointermove", e => { if (sx !== null) gsap.set(cards[top], { x: e.clientX - sx, rotate: (e.clientX - sx) / 14 }); });
    deck.addEventListener("pointerup", e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 80) step(dx < 0 ? 1 : -1); else layout();
    });
    gsap.from(".deck", { y: 120, rotate: 8, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".trends", start: "top 75%" } });
    gsap.from(".trends__range li", { x: 40, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".trends__range", start: "top 85%" } });
  })();

  /* refresh once images have sizes */
  addEventListener("load", () => ScrollTrigger.refresh());
})();
