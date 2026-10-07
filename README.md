# Saree storefront — animated website

A luxury saree shop homepage with scroll animations: a paisley intro curtain, a hero slideshow, a curved 3D carousel, bending sections, wavy edges, a "change look" product spotlight, an offers accordion, a pinned story scroller and a card deck.

Plain HTML, CSS and JavaScript. There's no build step and nothing to install. GSAP, ScrollTrigger and Lenis are bundled in `vendor/`.

## Run it

Open `index.html` in a browser, or serve the folder (recommended):

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Put in your photos

Every picture is in `images/`. Each placeholder shows its own filename and size. Replace a file with your photo **using the same name** and it appears everywhere that image is used.

| Files | Where they show | Best size |
|---|---|---|
| `hero-1.jpg` … `hero-3.jpg` | Top slideshow | 1920×1080 landscape |
| `mood-1.jpg` … `mood-6.jpg` | "Six Moods" arches | 600×800 portrait |
| `signature-1.jpg` … `signature-8.jpg` | Curved 3D carousel | 600×900 portrait |
| `product-1.jpg` … `product-16.jpg` | New Arrivals, Best Sellers, Bridal, Trend rows, story thumbnails | 600×750 portrait |
| `bridal-feature.jpg` | Large Bridal Collection photo | 900×1200 portrait |
| `forecast-1.jpg` … `forecast-3.jpg` | Autumn–Winter arches | 600×750 portrait |
| `look-1.png` … `look-3.png` | "Change look" model (PNG with **transparent background** looks best) | 800×1200 |
| `edit-1.jpg` … `edit-4.jpg` | "Edits for every occasion" | 600×720 |
| `offer-1.jpg` … `offer-6.jpg` | "Worth your attention" panels | 900×900 |
| `story-1.jpg` … `story-4.jpg` | Full-screen story scroller (shown in a colour wash) | 1920×1080 |
| `trend-1.jpg` … `trend-4.jpg` | "Latest Trends" card deck | 600×800 |
| `footer.jpg` | Wide strip at the bottom | 1800×560 |

Keep photos under about 400 KB each (export as JPG at ~80% quality) so the site stays fast.

## Change the brand, products and prices

Edit **`js/data.js`**. It holds the brand name, tagline, every product name, price, badge and rating, the three "Change look" outfits, and the story slides with their colour tints. Headings and section text are in `index.html`.

Colours and fonts are at the top of `css/style.css` under `:root`.

## Put it online (free)

- **Netlify**: drag the folder onto https://app.netlify.com/drop
- **GitHub Pages**: repo Settings → Pages → Deploy from branch → `main` / root
- **Vercel**: import the repo; no settings needed

## Files

```
index.html        page structure
css/style.css     all styling + responsive rules
js/data.js        brand, products, prices, looks, stories  ← edit this
js/main.js        animations and interactions
images/           your photos (same names)
vendor/           GSAP, ScrollTrigger, Lenis
```
