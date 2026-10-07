/* ------------------------------------------------------------------
   EDIT THIS FILE to change the brand, products and prices.
   Images live in /images — replace a file with your own photo
   using the SAME file name and it shows up everywhere.
------------------------------------------------------------------- */
window.SITE = {
  brand: "DRIFT",
  tagline: "Draped in Stories",

  /* Hero captions, one per hero image (hero-1.jpg, hero-2.jpg, …) */
  heroCaptions: [
    "Six weavers, one thread —<br>months of patient hands.",
    "Zari catches the light the way<br>memory catches a moment.",
    "Heritage woven slowly,<br>worn for a lifetime."
  ],

  /* Curved carousel — "Woven to Be Remembered" (signature-1.jpg …) */
  signatures: [
    { name: "Leela Courtyard Silk", tag: "Pure silk · Courtyard border", price: 18600 },
    { name: "Tara Peacock Paithani", tag: "Paithani · Peacock pallu", price: 23900, was: 26500 },
    { name: "Aarunya Emerald Kanjivaram", tag: "Pure silk · Temple border", price: 18900 },
    { name: "Ruhani Temple Silk", tag: "Handwoven silk · Oxblood", price: 16400 },
    { name: "Saanjh Maroon Banarasi", tag: "Banarasi · Zari buti", price: 24500 },
    { name: "Prerna Festive Silk", tag: "Soft silk · Contrast border", price: 12800, was: 15000 },
    { name: "Vasudha Brocade", tag: "Brocade · Gold weave", price: 22400 },
    { name: "Padma Wedding Silk", tag: "Ceremonial silk · Zari", price: 26800 }
  ],

  /* Product lists. img = number of images/product-N.jpg */
  products: {
    arrivals: [
      { name: "Reva Temple Red Silk", tag: "Occasion silk · Temple jewellery drape", price: 21200, badge: "New", img: 1 },
      { name: "Prerna Festive Silk", tag: "Silk blend · Contrast border", price: 12800, was: 15000, badge: "-20%", img: 2 },
      { name: "Nayana Coral Kanjivaram", tag: "Kanjivaram · Gold border", price: 25600, img: 3 },
      { name: "Suhana Ceremony Edit", tag: "Pure silk · Ceremony drape", price: 29500, was: 33000, badge: "-10%", img: 4 },
      { name: "Devasena Wedding Silk", tag: "Wedding silk · Heavy zari", price: 26500, badge: "Bestseller", img: 5 },
      { name: "Ira Evening Saree", tag: "Georgette · Sequin edge", price: 21900, badge: "New", img: 6 }
    ],
    bestsellers: [
      { name: "Tara Peacock Paithani", tag: "Paithani · Peacock pallu", price: 20800, rating: 4.9, img: 7 },
      { name: "Maya Jewel-Tone Silk", tag: "Silk · Hand-finished border", price: 23700, rating: 4.7, img: 8 },
      { name: "Nila Jewel Silk", tag: "Lightweight silk · Colour border", price: 17900, rating: 4.5, img: 9 },
      { name: "Devika Temple Weave", tag: "Temple weave · Zari", price: 24200, rating: 4.8, badge: "Bestseller", img: 10 },
      { name: "Noor Wedding Silk", tag: "Ceremonial silk · Pastel", price: 19600, rating: 5.0, badge: "Bestseller", img: 11 },
      { name: "Vasudha Brocade", tag: "Brocade · Gold weave", price: 22400, rating: 4.6, img: 12 }
    ],
    bridal: [
      { name: "Kesar Temple Weave", tag: "Bridal silk · Rich pallu", price: 27800, img: 13 },
      { name: "Anvika Muhurtham Silk", tag: "Traditional silk · Gold border", price: 25600, img: 14 },
      { name: "Reva Temple Red Silk", tag: "Occasion silk · Temple jewellery drape", price: 21200, img: 1 },
      { name: "Vidhya Violet Silk", tag: "Silk · Silver zari", price: 19800, img: 15 },
      { name: "Kumudini Festive Drape", tag: "Festive silk · Jewel tones", price: 14900, img: 16 },
      { name: "Devasena Wedding Silk", tag: "Wedding silk · Heavy zari", price: 26500, img: 5 }
    ],
    trend: [
      { name: "Aarunya Emerald Kanjivaram", tag: "Pure silk · Temple border", price: 18900, rating: 4.9, img: 3 },
      { name: "Saanjh Maroon Banarasi", tag: "Banarasi · Zari", price: 24500, rating: 4.8, img: 8 },
      { name: "Padma Wedding Silk", tag: "Ceremonial silk · Pastel", price: 26800, rating: 4.7, img: 11 },
      { name: "Ira Evening Saree", tag: "Georgette · Sequin edge", price: 21900, rating: 4.6, img: 6 },
      { name: "Nila Jewel Silk", tag: "Lightweight silk", price: 17900, rating: 4.5, img: 9 },
      { name: "Kesar Temple Weave", tag: "Bridal silk", price: 27800, rating: 4.9, img: 13 }
    ],
    seasonal: [
      { name: "Ruhani Temple Silk", tag: "Handwoven silk · Oxblood", price: 16400, rating: 4.8, img: 4 },
      { name: "Leela Courtyard Silk", tag: "Soft silk · Celebration pastels", price: 18600, rating: 4.6, img: 2 },
      { name: "Kaveri Oxblood Drape", tag: "Pure silk · Fluid drape", price: 21200, rating: 4.8, img: 16 },
      { name: "Maya Jewel-Tone Silk", tag: "Silk · Hand-finished", price: 23700, rating: 4.7, img: 10 },
      { name: "Vidhya Violet Silk", tag: "Silk · Silver zari", price: 19800, rating: 4.5, img: 15 },
      { name: "Tara Peacock Paithani", tag: "Paithani", price: 20800, rating: 4.9, img: 7 }
    ]
  },

  /* "Change look" spotlight — images/look-1.png, look-2.png, look-3.png
     (PNG with transparent background looks best) */
  looks: [
    { name: "Ivory Organza<br>Bloom", ghost: "Organza", price: 18400, rating: "4.8", reviews: 212, colour: "Ivory",
      desc: "Featherlight organza in warm ivory, hand-embroidered with rose and sage blossoms along a gilded border. It falls in long, quiet folds and catches the light at every turn.",
      feats: ["Pure organza silk", "Airy &amp; lightweight", "Hand-embroidered border", "Blouse piece included"] },
    { name: "Rosé Net<br>Embroidered", ghost: "Net", price: 21600, rating: "4.7", reviews: 168, colour: "Rose",
      desc: "A sheer rose net scattered with tonal floral embroidery and a slim scalloped edge, worn over a fitted sequin blouse. It is made for evenings that begin late.",
      feats: ["Soft French net", "Sheer &amp; fluid drape", "Scalloped edge", "Modern evening fit"] },
    { name: "Crimson Silk<br>Heirloom", ghost: "Silk", price: 24900, rating: "4.9", reviews: 301, colour: "Crimson",
      desc: "Deep crimson pure silk with a heavy antique-gold zari border, woven over six weeks on a traditional pit loom. A saree to hand down.",
      feats: ["Pure mulberry silk", "Antique zari border", "Handloom woven", "Blouse piece included"] }
  ],

  /* Pinned story scroller — images/story-1.jpg … ; tint = colour wash */
  stories: [
    { title: "First<br>Light", sub: "The ceremony study", tint: "#c9821f", thumbs: [1, 2, 3, 4, 5] },
    { title: "Courtyard<br>Air", sub: "The courtyard study", tint: "#5a1030", thumbs: [6, 7, 8, 9, 10] },
    { title: "Wedding<br>Circle", sub: "The wedding study", tint: "#3c4a2a", thumbs: [11, 12, 13, 14, 15] },
    { title: "Temple<br>Steps", sub: "The architecture study", tint: "#a3283f", thumbs: [16, 1, 3, 5, 7] }
  ]
};
