/* Collection page: /sarees, /women, /men, /kids */
(async () => {
  const { $, $$, esc, money, getJSON, orderLink, icons, emblem, heroMedia, reduceMotion } = window.ANDAHA;
  $$("[data-emblem]").forEach(el => (el.outerHTML = emblem));
  $$("[data-icon]").forEach(el => (el.outerHTML = icons[el.dataset.icon]));
  gsap.registerPlugin(ScrollTrigger);

  const key = location.pathname.replace(/^\/|\/$/g, "") || new URLSearchParams(location.search).get("c");
  let site, products;
  try {
    [site, products] = await Promise.all([getJSON("/api/site"), getJSON(`/api/products?category=${encodeURIComponent(key)}`)]);
  } catch {
    document.body.innerHTML = '<p class="fatal">Sorry, the shop could not load. Please refresh.</p>';
    return;
  }
  const cat = site.categories.find(c => c.key === key);
  if (!cat) { location.replace("/"); return; }
  const S = site.settings;
  document.body.dataset.theme = key;
  document.title = `${cat.name} — ${S.brand}`;

  /* ---------- smooth scroll ---------- */
  const lenis = reduceMotion ? null : new Lenis({ lerp: .09 });
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = target => (lenis ? lenis.scrollTo(target, { offset: -70, duration: 1.2 }) : document.querySelector(target).scrollIntoView());

  /* ---------- header, hero, footer ---------- */
  $("#cNav").innerHTML = site.categories.map(c =>
    `<a href="/${esc(c.key)}"${c.key === key ? ' class="is-active" aria-current="page"' : ""}>${esc(c.name)}</a>`).join("");
  const wa = orderLink(S, `Hello ${S.brand}, I'd like to know more about your ${cat.name} collection.`);
  if (wa) { $("#cWa").href = wa; $("#cWa").hidden = false; }

  heroMedia($("#heroMedia"), cat);
  $("#crumb").textContent = cat.name;
  $("#cBadge").textContent = cat.badge;
  $("#cTitle").innerHTML = [...cat.name].map(ch => `<span class="ch">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
  $("#cIntro").textContent = cat.intro;
  $("#cCount").textContent = `${products.length} ${products.length === 1 ? "piece" : "pieces"}`;
  $("#cScroll").addEventListener("click", e => { e.preventDefault(); scrollTo("#shop"); });

  $("#moreGrid").innerHTML = site.categories.filter(c => c.key !== key).map(c => `
    <a class="more__card" href="/${esc(c.key)}">
      <img src="${esc(c.cover)}" alt="" loading="lazy">
      <span><small>${esc(c.label)}</small>${esc(c.name)} ${icons.arrow}</span>
    </a>`).join("");

  const contact = [
    S.phone && `<a href="tel:${esc(S.phone.replace(/[^\d+]/g, ""))}">${esc(S.phone)}</a>`,
    S.email && `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`,
    S.address && `<span>${esc(S.address)}</span>`,
    S.instagram && `<a href="${esc(S.instagram)}" target="_blank" rel="noopener">Instagram</a>`
  ].filter(Boolean).join("");
  $("#footer").innerHTML = `
    <div class="footer__brand">${emblem}<div><p class="footer__name">${esc(S.brand)}</p><p>${esc(S.tagline)}</p></div></div>
    <nav>${site.categories.map(c => `<a href="/${esc(c.key)}">${esc(c.name)}</a>`).join("")}</nav>
    <div class="footer__contact">${contact}</div>
    <p class="footer__copy">© ${new Date().getFullYear()} ${esc(S.brand)}</p>`;

  /* =========================================================
     Each collection has its own signature motion
  ========================================================= */
  const MOTION = {
    sarees: {   // the pallu unfurls: a soft wipe opens each card, the photo settles, gold sheen on hover
      title: chars => gsap.from(chars, { yPercent: 110, rotate: 6, opacity: 0, duration: 1.2, stagger: .05, ease: "expo.out", delay: .2 }),
      from: { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
      to: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.4, stagger: .09, ease: "power3.inOut" },
      extra: els => gsap.fromTo(els.map(e => e.querySelector(".card__img img")), { scale: 1.25 }, { scale: 1, duration: 1.8, stagger: .09, ease: "expo.out" })
    },
    women: {    // editorial: each card rises behind a mask
      title: chars => gsap.from(chars, { yPercent: 100, duration: 1.1, stagger: .03, ease: "expo.out", delay: .2 }),
      from: { clipPath: "inset(100% 0% 0% 0%)", y: 60 },
      to: { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.3, stagger: .1, ease: "expo.out" }
    },
    men: {      // tailoring: sharp straight cuts, monochrome until you hover
      title: chars => gsap.from(chars, { clipPath: "inset(0% 100% 0% 0%)", x: -20, duration: .8, stagger: .04, ease: "power4.out", delay: .2 }),
      from: { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
      to: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1, stagger: .08, ease: "power4.inOut" }
    },
    kids: {     // playful: letters and cards bounce in
      title: chars => gsap.from(chars, { y: -120, scale: .4, rotate: () => gsap.utils.random(-30, 30), opacity: 0, duration: 1.2, stagger: .07, ease: "elastic.out(1, .45)", delay: .2 }),
      from: { scale: .6, rotate: () => gsap.utils.random(-8, 8), opacity: 0, y: 60 },
      to: { scale: 1, rotate: 0, opacity: 1, y: 0, duration: 1.1, stagger: .07, ease: "elastic.out(1, .55)" }
    }
  };
  const motion = MOTION[key] || MOTION.women;

  if (!reduceMotion) {
    const entered = sessionStorage.getItem("andaha:entered");
    sessionStorage.removeItem("andaha:entered");
    if (entered) gsap.from("#heroMedia", { scale: 1.12, duration: 1.6, ease: "expo.out" });
    motion.title($$("#cTitle .ch"));
    gsap.from(["#cBadge", "#cIntro", "#cScroll", ".crumbs"], { y: 24, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", delay: .6 });
    gsap.to("#heroMedia", { yPercent: 18, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".c-hero__copy", { yPercent: -25, opacity: 0, ease: "none", scrollTrigger: { trigger: "#hero", start: "30% top", end: "bottom top", scrub: true } });
  }
  ScrollTrigger.create({ start: 80, onToggle: s => $("#cHeader").classList.toggle("is-solid", s.isActive) });

  /* =========================================================
     Filters, search, sort, grid
  ========================================================= */
  const state = { type: "All", q: "", sort: "featured" };
  const types = ["All", ...cat.filters.filter(f => products.some(p => p.type === f))];
  $("#chips").innerHTML = types.map(t => `<button role="tab" class="chip${t === "All" ? " is-active" : ""}" data-type="${esc(t)}">${esc(t)}</button>`).join("");
  if (types.length < 3) $("#chips").hidden = true;

  $("#chips").addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state.type = b.dataset.type;
    $$(".chip").forEach(c => c.classList.toggle("is-active", c === b));
    render();
  });
  let qTimer;
  $("#q").addEventListener("input", e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); render(); }, 180); });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });

  function visible() {
    let list = products.filter(p =>
      (state.type === "All" || p.type === state.type) &&
      (!state.q || `${p.name} ${p.type} ${p.fabric} ${p.description}`.toLowerCase().includes(state.q)));
    const by = {
      featured: (a, b) => (b.featured - a.featured) || (b.createdAt - a.createdAt),
      new: (a, b) => b.createdAt - a.createdAt,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price
    }[state.sort];
    return list.sort(by);
  }

  const card = p => `
    <article class="card">
      <a href="?p=${esc(p.id)}" class="card__link" data-id="${esc(p.id)}" aria-label="${esc(p.name)}">
        <div class="card__img">
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
          <img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy">
          ${p.images[1] ? `<img class="card__alt" src="${esc(p.images[1])}" alt="" loading="lazy">` : ""}
          <span class="card__view">View</span>
        </div>
        <div class="card__meta">
          <p class="card__type">${esc(p.type)}</p>
          <h3>${esc(p.name)}</h3>
          <p class="card__price">${money(p.price)}${p.mrp ? ` <s>${money(p.mrp)}</s>` : ""}</p>
        </div>
      </a>
    </article>`;

  let firstRender = true;
  function render() {
    const list = visible();
    $("#grid").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    $("#resultCount").textContent = `${list.length} of ${products.length} ${products.length === 1 ? "piece" : "pieces"}`;
    const cards = $$("#grid .card");
    if (reduceMotion || !cards.length) return;
    const reveal = els => { gsap.to(els, { ...motion.to, clearProps: "clipPath,transform" }); motion.extra?.(els); };
    gsap.set(cards, motion.from);
    if (firstRender) {
      firstRender = false;
      ScrollTrigger.batch(cards, { start: "top 92%", once: true, onEnter: reveal });
    } else {
      reveal(cards);
    }
    ScrollTrigger.refresh();
  }
  render();

  if (!reduceMotion) {
    gsap.from(".more__card", { y: 60, opacity: 0, duration: 1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: "#more", start: "top 85%" } });
  }

  /* =========================================================
     Quick view (deep-linkable with ?p=<id>)
  ========================================================= */
  const qv = $("#qv");
  let lastFocus = null, chosenSize = "", current = null;

  function openQV(id, push = true) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    lastFocus = document.activeElement;
    chosenSize = "";
    current = p;
    $("#qvImg").src = p.images[0];
    $("#qvImg").alt = p.name;
    $("#qvThumbs").innerHTML = p.images.length > 1
      ? p.images.map((src, i) => `<button class="${i ? "" : "is-active"}" data-src="${esc(src)}" aria-label="Photo ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join("")
      : "";
    $("#qvType").textContent = p.type || cat.name;
    $("#qvName").textContent = p.name;
    $("#qvPrice").innerHTML = `${money(p.price)}${p.mrp ? ` <s>${money(p.mrp)}</s> <span class="off">${Math.round((1 - p.price / p.mrp) * 100)}% off</span>` : ""}`;
    $("#qvFabric").textContent = p.fabric || "";
    $("#qvDesc").textContent = p.description || "";
    $("#qvSizesWrap").hidden = !p.sizes.length;
    $("#qvSizes").innerHTML = p.sizes.map(s => `<button type="button">${esc(s)}</button>`).join("");
    if (p.sizes.length === 1) { chosenSize = p.sizes[0]; $("#qvSizes button").classList.add("is-active"); }
    updateOrder(p);

    qv.hidden = false;
    document.documentElement.classList.add("no-scroll");
    lenis?.stop();
    if (push) history.pushState({ p: id }, "", `?p=${encodeURIComponent(id)}`);
    if (!reduceMotion) {
      gsap.fromTo(".qv__backdrop", { opacity: 0 }, { opacity: 1, duration: .4 });
      gsap.fromTo(".qv__panel", { y: 40, opacity: 0, scale: .97 }, { y: 0, opacity: 1, scale: 1, duration: .6, ease: "expo.out" });
    }
    $(".qv__close").focus();
  }

  function updateOrder(p) {
    const url = `${location.origin}/${key}?p=${p.id}`;
    const msg = `Hello ${S.brand}, I'd like to order:\n${p.name} — ${money(p.price)}${chosenSize ? `\nSize: ${chosenSize}` : ""}\n${url}`;
    const link = orderLink(S, msg);
    $("#qvOrder").hidden = !link;
    if (link) {
      $("#qvOrder").href = link;
      $("#qvOrder span").textContent = S.whatsapp ? "Order on WhatsApp" : "Enquire to order";
    }
    $("#qvNote").textContent = link ? (p.sizes.length > 1 && !chosenSize ? "Pick a size, then tap order — we'll confirm stock and delivery." : "We'll confirm stock and delivery on chat.") : "";
  }

  function closeQV(pop = false) {
    if (qv.hidden) return;
    const done = () => {
      qv.hidden = true;
      document.documentElement.classList.remove("no-scroll");
      lenis?.start();
      lastFocus?.focus?.();
    };
    if (!pop) history.pushState({}, "", location.pathname);
    reduceMotion ? done() : gsap.to(".qv__panel", { y: 30, opacity: 0, duration: .25, onComplete: done });
  }

  $("#grid").addEventListener("click", e => {
    const a = e.target.closest(".card__link");
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    openQV(a.dataset.id);
  });
  qv.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) closeQV();
    const t = e.target.closest("#qvThumbs button");
    if (t) {
      $("#qvImg").src = t.dataset.src;
      $$("#qvThumbs button").forEach(b => b.classList.toggle("is-active", b === t));
    }
    const s = e.target.closest("#qvSizes button");
    if (s) {
      chosenSize = s.textContent;
      $$("#qvSizes button").forEach(b => b.classList.toggle("is-active", b === s));
      updateOrder(current);
    }
  });
  addEventListener("keydown", e => { if (e.key === "Escape") closeQV(); });
  addEventListener("popstate", () => {
    const id = new URLSearchParams(location.search).get("p");
    id ? openQV(id, false) : closeQV(true);
  });
  const deep = new URLSearchParams(location.search).get("p");
  if (deep) openQV(deep, false);
})();
