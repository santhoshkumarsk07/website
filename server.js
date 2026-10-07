/* =========================================================
   ANDAHA — website + admin server
   Run:  npm install && npm start      (http://localhost:3000)
   Admin: http://localhost:3000/admin  (password = ADMIN_PASSWORD in .env)
========================================================= */
"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

loadEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT) || 3000;
const PROD = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const IS_VERCEL = !!process.env.VERCEL;
const UPLOADS = IS_VERCEL ? path.join("/tmp", "uploads") : path.join(PUBLIC, "uploads");
const DATA = IS_VERCEL ? path.join("/tmp", "data") : path.join(ROOT, "data");
const DB_FILE = path.join(DATA, "db.json");
const SEED_FILE = path.join(ROOT, "data", "seed.json");
const SEED_UPLOADS = path.join(ROOT, "data", "seed-uploads");

const CATEGORY_KEYS = ["sarees", "women", "men", "kids"];
const IMAGE_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const VIDEO_TYPES = { ".mp4": "video/mp4", ".webm": "video/webm" };
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 60 * 1024 * 1024;

/* ---------- admin password ---------- */
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "andaha2026";
const PASSWORD_DIGEST = sha256(ADMIN_PASSWORD);

/* =========================================================
   Data store (JSON file, atomic writes, serialized)
========================================================= */
let db;
let writeChain = Promise.resolve();

async function initStore() {
  try {
    await fsp.mkdir(UPLOADS, { recursive: true });
    await fsp.mkdir(DATA, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      let seed = { products: [], settings: { tagline: "ANDAHA", whatsapp: "", phone: "", email: "", address: "", instagram: "" } };
      if (fs.existsSync(SEED_FILE)) {
        seed = JSON.parse(await fsp.readFile(SEED_FILE, "utf8"));
      }
      if (fs.existsSync(SEED_UPLOADS)) {
        for (const f of await fsp.readdir(SEED_UPLOADS)) {
          const dest = path.join(UPLOADS, f);
          if (!fs.existsSync(dest)) await fsp.copyFile(path.join(SEED_UPLOADS, f), dest);
        }
      }
      const now = Date.now();
      if (seed.products) {
        seed.products.forEach((p, i) => {
          p.id = p.id || newId();
          p.createdAt = p.createdAt || now - i * 60000;
        });
      }
      await fsp.writeFile(DB_FILE, JSON.stringify(seed, null, 2));
    }
    db = JSON.parse(await fsp.readFile(DB_FILE, "utf8"));
  } catch (err) {
    console.error("initStore error:", err);
    db = db || { products: [], settings: {} };
  }
}

function save() {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain.then(async () => {
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, snapshot);
    await fsp.rename(tmp, DB_FILE);
  });
  return writeChain;
}

/* =========================================================
   App + security headers
========================================================= */
const app = express();
app.disable("x-powered-by");
if (PROD) app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  });
  next();
});
app.use(express.json({ limit: "100kb" }));

/* =========================================================
   Public API
========================================================= */
app.get("/api/site", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.json({ settings: db.settings, categories: db.categories });
});

app.get("/api/products", (req, res) => {
  res.set("Cache-Control", "no-cache");
  const { category } = req.query;
  let list = db.products.filter(p => !p.hidden);
  if (category) list = list.filter(p => p.category === category);
  res.json(list);
});

app.get("/api/products/:id", (req, res) => {
  const p = db.products.find(x => x.id === req.params.id && !x.hidden);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

/* =========================================================
   Admin auth (cookie session, rate-limited login, CSRF header)
========================================================= */
const SESSION_COOKIE = "andaha_admin";
const SESSION_TTL = 12 * 60 * 60 * 1000;
const sessions = new Map(); // token -> expiry
const attempts = new Map(); // ip -> { n, until }

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function isAuthed(req) {
  const t = readCookie(req, SESSION_COOKIE);
  if (!t) return false;
  const exp = sessions.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(t); return false; }
  return true;
}

function requireAdmin(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Please log in again." });
  if (req.method !== "GET" && req.get("X-Requested-With") !== "andaha-admin") {
    return res.status(403).json({ error: "Blocked request." });
  }
  next();
}

function setSessionCookie(res, token, maxAgeMs) {
  const parts = [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${Math.floor(maxAgeMs / 1000)}`];
  if (PROD) parts.push("Secure");
  res.set("Set-Cookie", parts.join("; "));
}

app.post("/api/admin/login", (req, res) => {
  const ip = req.ip;
  const a = attempts.get(ip) || { n: 0, until: 0 };
  if (a.until > Date.now()) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });

  const given = typeof req.body?.password === "string" ? req.body.password : "";
  const ok = crypto.timingSafeEqual(sha256(given), PASSWORD_DIGEST);
  if (!ok) {
    a.n += 1;
    if (a.n >= 8) { a.n = 0; a.until = Date.now() + 15 * 60 * 1000; }
    attempts.set(ip, a);
    return res.status(401).json({ error: "Wrong password." });
  }
  attempts.delete(ip);
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL);
  setSessionCookie(res, token, SESSION_TTL);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  const t = readCookie(req, SESSION_COOKIE);
  if (t) sessions.delete(t);
  setSessionCookie(res, "", 0);
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => res.json({ authed: isAuthed(req) }));

/* forget expired sessions and old failed-login records */
setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of sessions) if (exp < now) sessions.delete(t);
  for (const [ip, a] of attempts) if (a.until < now) attempts.delete(ip);
}, 60 * 60 * 1000).unref();

/* =========================================================
   Uploads
========================================================= */
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (req, file, cb) => cb(null, newId(12) + path.extname(file.originalname).toLowerCase().replace(".jpeg", ".jpg"))
  }),
  limits: { fileSize: MAX_VIDEO, files: 12, fields: 40 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isVideoField = file.fieldname === "video";
    const table = isVideoField ? VIDEO_TYPES : IMAGE_TYPES;
    // some phones/PCs send a generic type; the real file signature is checked after upload
    const type = file.mimetype.replace("image/jpg", "image/jpeg");
    if (table[ext] && (type === table[ext] || type === "application/octet-stream")) return cb(null, true);
    cb(new UploadError(isVideoField ? "Video must be .mp4 or .webm" : "Images must be .jpg, .png or .webp"));
  }
});

class UploadError extends Error {}

/* check real file signatures + per-type size, delete anything bad */
async function verifyFiles(files) {
  for (const f of files) {
    const isVideo = f.fieldname === "video";
    const fd = await fsp.open(f.path, "r");
    const head = Buffer.alloc(16);
    await fd.read(head, 0, 16, 0);
    await fd.close();
    const hex = head.toString("hex");
    const ok = isVideo
      ? head.slice(4, 8).toString("latin1") === "ftyp" || hex.startsWith("1a45dfa3")
      : hex.startsWith("ffd8ff") || hex.startsWith("89504e47") ||
        (head.slice(0, 4).toString("latin1") === "RIFF" && head.slice(8, 12).toString("latin1") === "WEBP");
    if (!ok || (!isVideo && f.size > MAX_IMAGE)) {
      await removeFiles(files);
      throw new UploadError(!ok ? `"${f.originalname}" is not a valid ${isVideo ? "video" : "image"} file.` : `"${f.originalname}" is larger than 10 MB.`);
    }
  }
}

async function removeFiles(files) {
  await Promise.all((files || []).map(f => fsp.unlink(f.path).catch(() => {})));
}

/* only ever delete inside /public/uploads */
async function deleteUpload(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
  const abs = path.resolve(PUBLIC, "." + url);
  if (!abs.startsWith(UPLOADS + path.sep)) return;
  await fsp.unlink(abs).catch(() => {});
}

const filesOf = (req, field) => (Array.isArray(req.files) ? req.files : (req.files?.[field] || [])).filter(f => f.fieldname === field);
const allFiles = req => (Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat());
const toUrl = f => "/uploads/" + f.filename;

/* =========================================================
   Admin: products
========================================================= */
function cleanProduct(body, existing = {}) {
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const money = v => {
    const n = Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")));
    return Number.isFinite(n) && n >= 0 && n <= 10000000 ? n : 0;
  };
  const list = (v, maxItems, maxLen) =>
    str(v, 400).split(",").map(s => s.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems);

  const p = {
    ...existing,
    name: str(body.name, 120),
    category: body.category,
    type: str(body.type, 60),
    price: money(body.price),
    mrp: money(body.mrp),
    fabric: str(body.fabric, 120),
    description: str(body.description, 2000),
    sizes: list(body.sizes, 20, 12),
    colours: list(body.colours, 12, 24),
    badge: str(body.badge, 24),
    featured: body.featured === "true" || body.featured === true,
    hidden: body.hidden === "true" || body.hidden === true
  };
  if (!p.name) throw new UploadError("Product name is required.");
  if (!CATEGORY_KEYS.includes(p.category)) throw new UploadError("Choose a valid category.");
  if (!p.price) throw new UploadError("Price is required.");
  if (p.mrp && p.mrp <= p.price) p.mrp = 0;
  return p;
}

/* order = JSON list of existing image URLs and "new:<n>" placeholders, in display order */
function orderImages(orderJson, existing, added) {
  let order = [];
  try { order = JSON.parse(orderJson || "[]"); } catch { order = []; }
  if (!Array.isArray(order)) order = [];
  const out = [];
  for (const item of order) {
    if (typeof item !== "string") continue;
    const m = item.match(/^new:(\d+)$/);
    const url = m ? added[Number(m[1])] : (existing.includes(item) ? item : null);
    if (url && !out.includes(url)) out.push(url);
  }
  for (const url of added) if (!out.includes(url)) out.push(url);
  return out.slice(0, 12);
}

const productUpload = upload.array("images", 10);

app.get("/api/admin/products", requireAdmin, (req, res) => res.json(db.products));

app.post("/api/admin/products", requireAdmin, productUpload, async (req, res, next) => {
  try {
    await verifyFiles(allFiles(req));
    const p = cleanProduct(req.body);
    p.id = newId();
    p.createdAt = Date.now();
    p.images = orderImages(req.body.order, [], filesOf(req, "images").map(toUrl));
    if (!p.images.length) throw new UploadError("Add at least one photo.");
    await Promise.all(filesOf(req, "images").map(toUrl).filter(u => !p.images.includes(u)).map(deleteUpload));
    db.products.unshift(p);
    await save();
    res.json(p);
  } catch (e) { await removeFiles(allFiles(req)); next(e); }
});

app.put("/api/admin/products/:id", requireAdmin, productUpload, async (req, res, next) => {
  try {
    await verifyFiles(allFiles(req));
    const i = db.products.findIndex(x => x.id === req.params.id);
    if (i < 0) { await removeFiles(allFiles(req)); return res.status(404).json({ error: "Product not found." }); }
    const old = db.products[i];
    const p = cleanProduct(req.body, old);

    p.images = orderImages(req.body.order, old.images, filesOf(req, "images").map(toUrl));
    if (!p.images.length) throw new UploadError("A product needs at least one photo.");

    const removed = [...old.images, ...filesOf(req, "images").map(toUrl)].filter(u => !p.images.includes(u));
    db.products[i] = p;
    await save();
    await Promise.all(removed.map(deleteUpload));
    res.json(p);
  } catch (e) { await removeFiles(allFiles(req)); next(e); }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const i = db.products.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Product not found." });
  const [p] = db.products.splice(i, 1);
  await save();
  await Promise.all(p.images.map(deleteUpload));
  res.json({ ok: true });
});

/* =========================================================
   Admin: categories (cover photo, hero video, text)
========================================================= */
const categoryUpload = upload.fields([{ name: "cover", maxCount: 1 }, { name: "video", maxCount: 1 }]);

app.put("/api/admin/categories/:key", requireAdmin, categoryUpload, async (req, res, next) => {
  try {
    await verifyFiles(allFiles(req));
    const c = db.categories.find(x => x.key === req.params.key);
    if (!c) { await removeFiles(allFiles(req)); return res.status(404).json({ error: "Category not found." }); }
    const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
    const toDelete = [];

    for (const [field, max] of [["name", 40], ["badge", 60], ["intro", 400]]) {
      const v = str(req.body[field], max);
      if (v) c[field] = v;
    }
    if (typeof req.body.facts === "string") {
      c.facts = req.body.facts.split("\n").map(l => l.split(":")).filter(x => x.length >= 2)
        .map(([k, ...v]) => [k.trim().slice(0, 40), v.join(":").trim().slice(0, 120)]).filter(([k, v]) => k && v).slice(0, 6);
    }
    if (typeof req.body.filters === "string") {
      c.filters = req.body.filters.split(",").map(s => s.trim().slice(0, 30)).filter(Boolean).slice(0, 12);
    }
    const cover = filesOf(req, "cover")[0];
    if (cover) { toDelete.push(c.cover); c.cover = toUrl(cover); }
    const video = filesOf(req, "video")[0];
    if (video) { toDelete.push(c.video); c.video = toUrl(video); c.poster = ""; }
    if (req.body.removeVideo === "true" && !video) { toDelete.push(c.video); c.video = ""; c.poster = ""; }

    await save();
    await Promise.all(toDelete.map(deleteUpload));
    res.json(c);
  } catch (e) { await removeFiles(allFiles(req)); next(e); }
});

/* =========================================================
   Admin: site settings
========================================================= */
app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const s = db.settings;
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  s.tagline = str(req.body.tagline, 80) || s.tagline;
  s.whatsapp = str(req.body.whatsapp, 20).replace(/\D/g, "");
  s.phone = str(req.body.phone, 30);
  s.email = str(req.body.email, 80);
  s.address = str(req.body.address, 200);
  s.instagram = /^https:\/\/(www\.)?instagram\.com\//.test(str(req.body.instagram, 200)) ? str(req.body.instagram, 200) : "";
  await save();
  res.json(s);
});

/* =========================================================
   Pages + static files
========================================================= */
for (const key of CATEGORY_KEYS) {
  app.get(`/${key}`, (req, res) => res.sendFile(path.join(PUBLIC, "collection.html")));
}
app.use("/uploads", express.static(UPLOADS, {
  setHeaders: (res, file) => {
    if (/\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(file)) res.set("Cache-Control", "public, max-age=604800");
  }
}));

app.use(express.static(PUBLIC, {
  extensions: ["html"],
  setHeaders: (res, file) => {
    if (/\.(mp4|webm|jpg|jpeg|png|webp|woff2?)$/i.test(file)) res.set("Cache-Control", "public, max-age=604800");
  }
}));

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC, "404.html")));

/* errors → friendly JSON */
app.use((err, req, res, next) => {
  if (err instanceof UploadError) return res.status(400).json({ error: err.message });
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "File is too large (videos up to 60 MB, photos up to 10 MB)." : "Upload failed: " + err.message;
    return res.status(400).json({ error: msg });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

/* =========================================================
   Helpers + start
========================================================= */
function sha256(s) { return crypto.createHash("sha256").update(String(s)).digest(); }
function newId(bytes = 8) { return crypto.randomBytes(bytes).toString("hex"); }

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const initPromise = initStore();

app.use(async (req, res, next) => {
  await initPromise;
  next();
});

if (require.main === module) {
  initPromise.then(() => {
    app.listen(PORT, () => console.log(`ANDAHA running at http://localhost:${PORT}  (admin: /admin)`));
  });
}

module.exports = app;
