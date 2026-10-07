# ANDAHA — website + admin panel

A luxury textile and family fashion website:

- **Home page** (`/`): the animated portal. Each collection previews with its own background, and clicking one opens it.
- **Collection pages**: `/sarees`, `/women`, `/men`, `/kids`. Every product is listed with filters, search, sorting and a product popup with an **Order on WhatsApp** button. Each collection has its own animation style:
  - **Sarees**: cards open like a pallu unfurling, with a gold sheen on hover
  - **Women**: editorial cards that rise behind a mask, in staggered columns
  - **Men**: sharp straight-cut reveals; photos are black-and-white until hover
  - **Kids**: an animated balloon sky, with bouncy cards and letters
- **Admin panel** (`/admin`): add, edit and delete products and their photos; change each collection's cover photo, background video and text; set your WhatsApp number and contact details.

## Run it

Needs [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
cp .env.example .env        # then open .env and set ADMIN_PASSWORD
npm start                   # → http://localhost:3000   admin → http://localhost:3000/admin
```

On first start the server creates `data/db.json` (your products and settings) from `data/seed.json`, and copies the sample photos into `public/uploads/`.

## Using the admin panel

1. Open `/admin` and log in with your `ADMIN_PASSWORD`.
2. **Shop settings**: enter your WhatsApp number with the country code (e.g. `919876543210`). This switches on the order buttons.
3. **Products → + Add product**: drag in photos (the first one is the cover), then fill in the name, category, price and sizes. Saving puts it live straight away. Tick **Hidden** to take something off the site without deleting it.
4. **Categories & videos**: replace any cover photo or background video. Kids has no video, so it shows the animated balloon scene; uploading a kids video replaces it.

Photos: JPG, PNG or WebP, up to 10 MB each (portrait 4:5 looks best). Videos: MP4, up to 60 MB (5–10 seconds, 720p, no sound works best).

## Putting it online

This site has a server, so it needs a host that runs Node.js. GitHub Pages only serves plain files.

- **Render / Railway**: create a Web Service from this repo, with build command `npm install` and start command `npm start`. Add the environment variables `ADMIN_PASSWORD` and `NODE_ENV=production`. **Attach a persistent disk** mounted at the project's `data/` and `public/uploads/` folders, or your uploads will disappear on each redeploy.
- **Any VPS** (DigitalOcean, Hostinger, AWS Lightsail): `npm install`, then run with `pm2 start server.js`, behind Nginx with HTTPS.

Back up `data/db.json` and `public/uploads/`: together they are your whole catalogue.

## Files

```
server.js              web server, API, admin login, uploads
data/seed.json         starting products/categories (copied to data/db.json on first run)
data/seed-uploads/     sample product photos
public/index.html      home page (portal)
public/collection.html collection page used by /sarees /women /men /kids
public/admin/          admin panel
public/js/             common.js, landing.js, collection.js
public/css/site.css    all public styles (per-collection themes at "COLLECTION — themes")
public/media/          background videos + poster frames
public/images/         collection cover photos
public/vendor/         GSAP, ScrollTrigger, Lenis
```

## Security notes

- The admin password lives only in `.env` (never committed). Logins are rate-limited (8 tries, then a 15-minute lock), and sessions are HttpOnly, SameSite=Strict cookies.
- Every upload is checked by extension, by declared type and by its real file signature. Files get random names and are stored only in `public/uploads/`.
- Pages are sent with a strict Content-Security-Policy, nosniff and no-framing headers.
