/* ANDAHA admin panel */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const IMAGE_OK = ["image/jpeg", "image/png", "image/webp"];
  const MAX_IMAGE = 10 * 1024 * 1024, MAX_VIDEO = 60 * 1024 * 1024;

  let site = null, products = [], catFilter = "all", search = "";

  /* ---------- network ---------- */
  async function api(method, url, body) {
    const opts = { method, headers: { "X-Requested-With": "andaha-admin", Accept: "application/json" } };
    if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    const r = await fetch(url, opts);
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && url !== "/api/admin/login") showLogin();
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  }

  /* multipart upload with a progress bar */
  function upload(method, url, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open(method, url);
      x.setRequestHeader("X-Requested-With", "andaha-admin");
      x.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
      x.onload = () => {
        let data = {};
        try { data = JSON.parse(x.responseText); } catch {}
        if (x.status === 401) showLogin();
        x.status >= 200 && x.status < 300 ? resolve(data) : reject(new Error(data.error || `Upload failed (${x.status})`));
      };
      x.onerror = () => reject(new Error("Network error — check your connection."));
      x.send(formData);
    });
  }

  let toastT;
  function toast(msg, error = false) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("is-error", error);
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), error ? 5000 : 2600);
  }

  /* ---------- auth ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; $("#password").focus(); }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("#loginError").textContent = "";
    try {
      await api("POST", "/api/admin/login", { password: $("#password").value });
      $("#password").value = "";
      start();
    } catch (err) { $("#loginError").textContent = err.message; }
  });

  $("#logout").addEventListener("click", async () => { await api("POST", "/api/admin/logout").catch(() => {}); showLogin(); });

  async function start() {
    try {
      [site, products] = await Promise.all([fetch("/api/site").then(r => r.json()), api("GET", "/api/admin/products")]);
    } catch { return; }
    $("#login").hidden = true;
    $("#app").hidden = false;
    renderFilter();
    renderProducts();
    renderCategories();
    fillSettings();
  }

  /* ---------- tabs ---------- */
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.toggle("is-active", x === t));
    $$(".panel").forEach(p => (p.hidden = p.id !== `panel-${t.dataset.tab}`));
  }));

  /* =========================================================
     Products
  ========================================================= */
  const catName = k => site.categories.find(c => c.key === k)?.name || k;

  function renderFilter() {
    const opts = [["all", "All"], ...site.categories.map(c => [c.key, c.name])];
    $("#catFilter").innerHTML = opts.map(([k, n]) => `<button data-k="${esc(k)}" class="${k === catFilter ? "is-active" : ""}">${esc(n)}</button>`).join("");
    $("#pCategory").innerHTML = site.categories.map(c => `<option value="${esc(c.key)}">${esc(c.name)}</option>`).join("");
  }
  $("#catFilter").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    catFilter = b.dataset.k;
    $$("#catFilter button").forEach(x => x.classList.toggle("is-active", x === b));
    renderProducts();
  });
  $("#productSearch").addEventListener("input", e => { search = e.target.value.trim().toLowerCase(); renderProducts(); });

  function renderProducts() {
    const list = products.filter(p => (catFilter === "all" || p.category === catFilter) && (!search || p.name.toLowerCase().includes(search)));
    const live = products.filter(p => !p.hidden).length;
    $("#productStats").textContent = `${products.length} products · ${live} live on the website`;
    $("#plist").innerHTML = list.length ? list.map(p => `
      <div class="prow">
        <img src="${esc(p.images[0])}" alt="">
        <div><h3>${esc(p.name)}</h3><p class="meta">${esc(catName(p.category))}${p.type ? " · " + esc(p.type) : ""}${p.badge ? " · " + esc(p.badge) : ""}</p></div>
        <span class="price">${money(p.price)}</span>
        <span class="status"><span class="pill ${p.hidden ? "pill--off" : ""}">${p.hidden ? "Hidden" : "Live"}</span></span>
        <span class="actions">
          <button class="btn btn--sm" data-edit="${esc(p.id)}">Edit</button>
          <a class="btn btn--sm" href="/${esc(p.category)}?p=${esc(p.id)}" target="_blank" rel="noopener" title="View on website">↗</a>
        </span>
      </div>`).join("") : `<div class="empty-list">No products here yet. Click “+ Add product”.</div>`;
  }
  $("#plist").addEventListener("click", e => {
    const b = e.target.closest("[data-edit]");
    if (b) openEditor(products.find(p => p.id === b.dataset.edit));
  });
  $("#addProduct").addEventListener("click", () => openEditor(null));

  /* ---------- editor ---------- */
  const form = $("#productForm");
  let editing = null;   // product being edited (null = new)
  let photos = [];      // [{ url } | { file, preview }]

  function openEditor(p) {
    editing = p;
    form.reset();
    $("#formError").textContent = "";
    $("#drawerTitle").textContent = p ? "Edit product" : "Add product";
    $("#deleteProduct").hidden = !p;
    photos.forEach(ph => ph.preview && URL.revokeObjectURL(ph.preview));
    photos = p ? p.images.map(url => ({ url })) : [];
    const f = form.elements;
    if (p) {
      for (const k of ["name", "category", "type", "badge", "fabric", "description"]) f[k].value = p[k] || "";
      f.price.value = p.price || "";
      f.mrp.value = p.mrp || "";
      f.sizes.value = (p.sizes || []).join(", ");
      f.colours.value = (p.colours || []).join(", ");
      f.featured.checked = !!p.featured;
      f.hidden.checked = !!p.hidden;
    } else if (catFilter !== "all") {
      f.category.value = catFilter;
    }
    updateTypeList();
    renderPhotos();
    $("#drawer").hidden = false;
    f.name.focus();
  }
  function closeEditor() {
    $("#drawer").hidden = true;
    photos.forEach(ph => ph.preview && URL.revokeObjectURL(ph.preview));
    photos = [];
  }
  $("#drawer").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeEditor(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !$("#drawer").hidden) closeEditor(); });

  function updateTypeList() {
    const c = site.categories.find(x => x.key === form.elements.category.value);
    $("#typeList").innerHTML = (c?.filters || []).map(t => `<option value="${esc(t)}">`).join("");
  }
  form.elements.category.addEventListener("change", updateTypeList);

  function renderPhotos() {
    $("#photos").innerHTML = photos.map((ph, i) => `
      <div class="photo">
        <img src="${esc(ph.url || ph.preview)}" alt="">
        ${i === 0 ? '<span class="tag">Cover</span>' : ph.file ? '<span class="tag">New</span>' : ""}
        <span class="ctl">
          ${i > 0 ? `<button type="button" data-move="${i}" title="Move left">‹</button>` : ""}
          <button type="button" data-remove="${i}" title="Remove">×</button>
        </span>
      </div>`).join("");
  }
  $("#photos").addEventListener("click", e => {
    const m = e.target.closest("[data-move]"), r = e.target.closest("[data-remove]");
    if (m) { const i = +m.dataset.move; [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]]; renderPhotos(); }
    if (r) { const [gone] = photos.splice(+r.dataset.remove, 1); gone.preview && URL.revokeObjectURL(gone.preview); renderPhotos(); }
  });

  function addFiles(files) {
    const errors = [];
    for (const file of files) {
      if (!IMAGE_OK.includes(file.type)) { errors.push(`${file.name}: use JPG, PNG or WebP`); continue; }
      if (file.size > MAX_IMAGE) { errors.push(`${file.name}: larger than 10 MB`); continue; }
      if (photos.length >= 12) { errors.push("Maximum 12 photos per product"); break; }
      photos.push({ file, preview: URL.createObjectURL(file) });
    }
    renderPhotos();
    $("#formError").textContent = errors.join(" · ");
  }
  $("#photoInput").addEventListener("change", e => { addFiles([...e.target.files]); e.target.value = ""; });
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("is-over"); }));
  drop.addEventListener("drop", e => addFiles([...e.dataTransfer.files]));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const f = form.elements;
    $("#formError").textContent = "";
    if (!f.name.value.trim()) return ($("#formError").textContent = "Please enter a product name.");
    if (!(Number(f.price.value.replace(/[^\d.]/g, "")) > 0)) return ($("#formError").textContent = "Please enter a price.");
    if (!photos.length) return ($("#formError").textContent = "Please add at least one photo.");

    const fd = new FormData();
    for (const k of ["name", "category", "type", "badge", "price", "mrp", "fabric", "description", "sizes", "colours"]) fd.append(k, f[k].value);
    fd.append("featured", f.featured.checked);
    fd.append("hidden", f.hidden.checked);
    let n = 0;
    const order = photos.map(ph => (ph.file ? `new:${n++}` : ph.url));
    photos.filter(ph => ph.file).forEach(ph => fd.append("images", ph.file));
    fd.append("order", JSON.stringify(order));

    const btn = $("#saveProduct");
    btn.disabled = true;
    $("#progress").hidden = false;
    try {
      const saved = await upload(editing ? "PUT" : "POST", editing ? `/api/admin/products/${encodeURIComponent(editing.id)}` : "/api/admin/products", fd,
        p => ($("#progress i").style.width = Math.round(p * 100) + "%"));
      const i = products.findIndex(p => p.id === saved.id);
      i >= 0 ? (products[i] = saved) : products.unshift(saved);
      renderProducts();
      closeEditor();
      toast(editing ? "Product updated" : "Product added — it's live on the website");
    } catch (err) {
      $("#formError").textContent = err.message;
    } finally {
      btn.disabled = false;
      $("#progress").hidden = true;
      $("#progress i").style.width = "0";
    }
  });

  $("#deleteProduct").addEventListener("click", async () => {
    if (!editing || !confirm(`Delete “${editing.name}”? This also deletes its photos and cannot be undone.`)) return;
    try {
      await api("DELETE", `/api/admin/products/${encodeURIComponent(editing.id)}`);
      products = products.filter(p => p.id !== editing.id);
      renderProducts();
      closeEditor();
      toast("Product deleted");
    } catch (err) { $("#formError").textContent = err.message; }
  });

  /* =========================================================
     Categories: cover photo, background video, text
  ========================================================= */
  function renderCategories() {
    $("#cats").innerHTML = site.categories.map(c => `
      <form class="card cat form" data-key="${esc(c.key)}">
        <div class="cat__media">
          <figure><img src="${esc(c.cover)}" alt="" data-cover-preview><figcaption>Cover photo</figcaption></figure>
          <label class="btn btn--sm file-btn">Change cover photo<input type="file" name="cover" accept="image/jpeg,image/png,image/webp"></label>
          <figure class="video">${c.video
            ? `<video src="${esc(c.video)}"${c.poster ? ` poster="${esc(c.poster)}"` : ""} muted loop playsinline autoplay data-video-preview></video>`
            : `<div class="none" data-video-preview>No video — ${c.key === "kids" ? "the animated balloon scene is shown" : "the cover photo is shown"}</div>`}<figcaption>Background video</figcaption></figure>
          <label class="btn btn--sm file-btn">Upload video (MP4, max 60 MB)<input type="file" name="video" accept="video/mp4,video/webm"></label>
          ${c.video ? `<label class="check"><input type="checkbox" name="removeVideo" value="true"> Remove video</label>` : ""}
        </div>
        <div class="form">
          <div class="row">
            <label>Name<input name="name" value="${esc(c.name)}" maxlength="40"></label>
            <label>Small heading<input name="badge" value="${esc(c.badge)}" maxlength="60"></label>
          </div>
          <label>Intro text<textarea name="intro" rows="2" maxlength="400">${esc(c.intro)}</textarea></label>
          <label>Highlights <small>one per line, as “Label: text” — shown on the home page</small>
            <textarea name="facts" rows="4">${esc(c.facts.map(([k, v]) => `${k}: ${v}`).join("\n"))}</textarea></label>
          <label>Filter buttons <small>comma separated — match each product's “Type”</small><input name="filters" value="${esc(c.filters.join(", "))}"></label>
          <div class="progress" hidden><i></i></div>
          <p class="error" role="alert"></p>
          <div><button class="btn btn--primary" type="submit">Save ${esc(c.name)}</button> <a class="btn btn--sm" href="/${esc(c.key)}" target="_blank" rel="noopener">View page ↗</a></div>
        </div>
      </form>`).join("");
  }

  $("#cats").addEventListener("change", e => {
    const input = e.target;
    if (input.type !== "file" || !input.files[0]) return;
    const file = input.files[0], card = input.closest(".cat"), err = $(".error", card);
    err.textContent = "";
    if (input.name === "cover") {
      if (!IMAGE_OK.includes(file.type) || file.size > MAX_IMAGE) { err.textContent = "Cover must be JPG, PNG or WebP under 10 MB."; input.value = ""; return; }
      $("[data-cover-preview]", card).src = URL.createObjectURL(file);
    } else {
      if (!/^video\/(mp4|webm)$/.test(file.type) || file.size > MAX_VIDEO) { err.textContent = "Video must be MP4 or WebM under 60 MB."; input.value = ""; return; }
      const v = document.createElement("video");
      Object.assign(v, { src: URL.createObjectURL(file), muted: true, loop: true, autoplay: true, playsInline: true });
      $("[data-video-preview]", card).replaceWith(v);
      v.dataset.videoPreview = "";
    }
  });

  $("#cats").addEventListener("submit", async e => {
    e.preventDefault();
    const card = e.target, key = card.dataset.key, err = $(".error", card), bar = $(".progress", card);
    const btn = $("button[type=submit]", card);
    err.textContent = "";
    btn.disabled = true;
    bar.hidden = false;
    try {
      const fd = new FormData(card);
      for (const [k, v] of [...fd.entries()]) if (v instanceof File && !v.size) fd.delete(k);
      const saved = await upload("PUT", `/api/admin/categories/${encodeURIComponent(key)}`, fd, p => ($("i", bar).style.width = Math.round(p * 100) + "%"));
      site.categories = site.categories.map(c => (c.key === key ? saved : c));
      renderCategories();
      renderFilter();
      toast(`${saved.name} saved`);
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false;
      bar.hidden = true;
    }
  });

  /* =========================================================
     Settings
  ========================================================= */
  function fillSettings() {
    const f = $("#settingsForm").elements;
    for (const k of ["tagline", "whatsapp", "phone", "email", "address", "instagram"]) f[k].value = site.settings[k] || "";
  }
  $("#settingsForm").addEventListener("submit", async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      site.settings = await api("PUT", "/api/admin/settings", body);
      fillSettings();
      toast(site.settings.whatsapp ? "Settings saved — WhatsApp ordering is on" : "Settings saved");
    } catch (err) { toast(err.message, true); }
  });

  /* ---------- boot ---------- */
  fetch("/api/admin/me").then(r => r.json()).then(d => (d.authed ? start() : showLogin())).catch(showLogin);
})();
