/* Landing portal: preview each collection, click to enter it */
(async () => {
  const { $, $$, esc, getJSON, icons, emblem, heroMedia, reduceMotion } = window.ANDAHA;
  $$("[data-emblem]").forEach(el => (el.outerHTML = emblem));
  $$("[data-icon]").forEach(el => (el.outerHTML = icons[el.dataset.icon]));

  let site;
  try { site = await getJSON("/api/site"); }
  catch { document.body.classList.remove("is-loading"); $("#loader").remove(); return; }

  const cats = site.categories;
  let idx = 0, media = null, timer = 0, busy = false;
  const stage = $("#stage"), mediaBox = $("#media"), portal = $("#portal");

  /* nav + side list (both are real links to the collection pages) */
  $("#lNav").innerHTML = cats.map((c, i) => `<a href="/${esc(c.key)}" data-i="${i}">${esc(c.name)}</a>`).join("");
  $("#lList").innerHTML = cats.map((c, i) =>
    `<li><a href="/${esc(c.key)}" data-i="${i}"><span class="num">0${i + 1}</span>${esc(c.label)}</a></li>`).join("");
  $("#lProgress").innerHTML = cats.map(() => "<i><b></b></i>").join("");

  /* hovering or focusing a link previews that collection */
  $$("[data-i]").forEach(a => {
    a.addEventListener("pointerenter", () => show(+a.dataset.i, true));
    a.addEventListener("focus", () => show(+a.dataset.i, true));
  });

  /* fit the big title on one line whatever its length */
  function fitTitle() {
    const h = $("#lTitle"), span = h.firstElementChild;
    h.style.fontSize = "";
    const max = h.parentElement.clientWidth;
    const w = span.scrollWidth;
    if (w > max) h.style.fontSize = parseFloat(getComputedStyle(h).fontSize) * (max / w) * .98 + "px";
  }

  function show(i, user = false) {
    if (i === idx && media) return;
    idx = (i + cats.length) % cats.length;
    const c = cats[idx];
    clearTimeout(timer);

    // media crossfade
    const old = mediaBox.firstElementChild;
    const layer = document.createElement("div");
    layer.className = "stage__layer";
    mediaBox.appendChild(layer);
    const prevMedia = media;
    media = heroMedia(layer, c);
    gsap.fromTo(layer, { opacity: 0, scale: 1.06 }, {
      opacity: 1, scale: 1, duration: reduceMotion ? 0 : 1.1, ease: "power2.out",
      onComplete: () => { if (old) { prevMedia?.stop(); old.remove(); } }
    });

    // text + portal
    stage.dataset.cat = c.key;
    portal.href = `/${c.key}`;
    $("#portalLabel").textContent = `Enter ${c.name}`;
    $$("[data-i]").forEach(a => a.classList.toggle("is-active", +a.dataset.i === idx));
    $$("#lProgress i").forEach((el, k) => el.classList.toggle("is-active", k === idx));

    const tl = gsap.timeline();
    tl.to(["#lTitle span", "#lBadge", "#lFacts .fact"], { y: -24, opacity: 0, duration: .3, stagger: .02, ease: "power2.in" })
      .to("#portalImg", { scale: 1.15, opacity: 0, duration: .35, ease: "power2.in" }, 0)
      .add(() => {
        $("#lTitle").innerHTML = `<span>${esc(c.name)}</span>`;
        $("#lBadge").textContent = c.badge;
        $("#lFacts").innerHTML = c.facts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
        $("#portalImg").src = c.cover;
        fitTitle();
      })
      .fromTo("#lTitle span", { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: "expo.out" })
      .fromTo("#lBadge", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: "expo.out" }, "<.1")
      .fromTo("#lFacts .fact", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: "expo.out" }, "<.1")
      .fromTo("#portalImg", { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: "expo.out" }, "<");

    // auto-advance; pauses longer after the visitor interacts
    if (!reduceMotion) timer = setTimeout(() => show(idx + 1), user ? 12000 : 7000);
    $$("#lProgress b").forEach((b, k) => {
      gsap.killTweensOf(b);
      gsap.set(b, { scaleX: k < idx ? 1 : 0 });
      if (k === idx && !reduceMotion) gsap.to(b, { scaleX: 1, duration: user ? 12 : 7, ease: "none" });
    });
  }

  /* 3D tilt */
  let rx = 0, ry = 0, tx = 0, ty = 0;
  const fine = matchMedia("(pointer: fine)").matches;
  if (fine && !reduceMotion) {
    addEventListener("pointermove", e => {
      ty = (e.clientX / innerWidth - .5) * 22;
      tx = (e.clientY / innerHeight - .5) * -18;
    });
    gsap.ticker.add(() => {
      rx += (tx - rx) * .08; ry += (ty - ry) * .08;
      portal.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }

  /* click the portal → it grows to fill the screen, then the collection page opens */
  function enter(e, href) {
    if (busy || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    busy = true;
    clearTimeout(timer);
    const frame = portal.querySelector(".portal__frame").getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "portal-ghost";
    ghost.style.backgroundImage = `url("${cats[idx].cover}")`;
    Object.assign(ghost.style, { left: frame.left + "px", top: frame.top + "px", width: frame.width + "px", height: frame.height + "px" });
    document.body.appendChild(ghost);
    sessionStorage.setItem("andaha:entered", "1");
    gsap.timeline({ onComplete: () => (location.href = href) })
      .to(".l-info, .l-list, .l-header, .l-progress, .portal", { opacity: 0, duration: .35 }, 0)
      .to(ghost, { left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: 0, duration: reduceMotion ? .01 : .9, ease: "expo.inOut" }, 0);
  }
  portal.addEventListener("click", e => enter(e, portal.getAttribute("href")));
  $$(".l-list a").forEach(a => a.addEventListener("click", e => { show(+a.dataset.i, true); enter(e, a.getAttribute("href")); }));

  /* swipe on phones */
  let sx = null;
  stage.addEventListener("touchstart", e => (sx = e.touches[0].clientX), { passive: true });
  stage.addEventListener("touchend", e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), true);
  });
  addEventListener("keydown", e => {
    if (e.key === "ArrowRight") show(idx + 1, true);
    if (e.key === "ArrowLeft") show(idx - 1, true);
  });
  addEventListener("resize", fitTitle);

  /* intro: short loader (≤1.4s), real wait for the first video frame */
  media = null;
  idx = -1;
  show(0);
  const firstVideo = mediaBox.querySelector("video");
  await Promise.race([
    new Promise(r => firstVideo ? firstVideo.addEventListener("loadeddata", r, { once: true }) : r()),
    new Promise(r => setTimeout(r, 1400))
  ]);
  await document.fonts.ready;
  fitTitle();
  document.body.classList.remove("is-loading");
  gsap.timeline()
    .to("#loader", { opacity: 0, duration: reduceMotion ? 0 : .6, ease: "power2.inOut", onComplete: () => $("#loader").remove() })
    .from(".l-header", { y: -20, opacity: 0, duration: .8, ease: "expo.out" }, .2)
    .from(".l-list li", { x: -20, opacity: 0, duration: .7, stagger: .06, ease: "expo.out" }, .3)
    .from(".portal", { y: 40, opacity: 0, scale: .92, duration: 1.1, ease: "expo.out" }, .3);
})();
