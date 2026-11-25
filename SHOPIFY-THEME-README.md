# Shurmble — Shopify Theme

A real, uploadable Shopify theme converted from the Shurmble cookie-store demo
(Baloo 2 ExtraBold display + Archivo body, Cloud Dancer `#F0EEE9` background,
bright blue `#0057d9` accent, always-light). Same look and feel as the demo —
hero flavour switcher 01–08, Build Your Own Box, marquee, trust row, search,
wishlist, filters/sort, cart drawer — but with a **real Shopify cart and real
Shopify checkout** instead of the demo's fake checkout.

> **Not tested on a live store.** The theme was validated structurally only
> (see "What was validated" below). The user has no Shopify store connected
> to Muse, so no live-store test was possible. Upload it to a trial store and
> check the homepage, a product page, the cart drawer and checkout before
> showing it to a customer.

## 1. How to upload

1. Create a Shopify store if you don't have one (a free trial works).
2. In Shopify Admin go to **Online Store → Themes → Add theme → Upload ZIP**.
3. Choose `shurmble-shopify-theme.zip` and wait for the upload.
4. Click **Publish** on the uploaded theme (or preview it first with **Actions → Preview**).

## 2. What to set up first (before the theme looks right)

### Currency — Settings → Store details → Currency → **PKR (Pakistani Rupee)**
The theme's prices are formatted as `Rs. 1,950.00 PKR` (theme settings let you
change the symbol/code). All 8 demo prices are in PKR.

### Products — Products → Add product (create these 8)
| Product | Variants (Pack size → price Rs) |
|---|---|
| Oreo Cheesecake Overload Cookie | Box of 4 → 1950, Box of 6 → 2750, Box of 12 → 5200 |
| S'Mores Cookies | Box of 4 → 1850, Box of 6 → 2600, Box of 12 → 4950 |
| Classic Chocolate Chip | Box of 4 → 1650, Box of 6 → 2350, Box of 12 → 4450 |
| Chocolate Lovers' Assortment | Box of 6 → 2450, Box of 12 → 4650, Box of 24 → 8900 |
| Nutella Stuffed Cookie | Box of 4 → 1750, Box of 6 → 2500, Box of 12 → 4750 |
| Red Velvet Cookie | Box of 4 → 1750, Box of 6 → 2500, Box of 12 → 4750 |
| Lotus Biscoff Blast | Box of 4 → 1850, Box of 6 → 2600, Box of 12 → 4950 |
| The Shurmble Gift Box | Gift Box of 10 → 3950, Gift Box of 20 → 7450 |

Use the demo cookie photos (they are inside the theme as assets) or upload
your own product photos. Give each product a description — the theme shows
the first ~18 words on cards and the full text in Quick View.

**Tags (optional, drive the demo's extras):**
- `badge:Best Seller` / `badge:Monthly Drop` / `badge:New` / `badge:Gift Pick` — the coloured badge on the card and hero.
- `cat:stuffed` / `cat:classics` / `cat:boxes` — the Shop All filter chips. Without a tag, a product counts as `classics`.
- `tint:#e9edf6` — the soft background tint behind the hero cookie photo.
- `note:Cheesecake core` — one tag per tasting note (shown as chips under the hero). Example notes for Oreo Cheesecake: `note:Cheesecake core`, `note:Crushed Oreo crunch`, `note:White choc chunks`.
- Ratings: create product metafields `reviews.rating` (number) and
  `reviews.count` (integer) to show stars; without them the theme shows
  "Fresh batch — be the first to review".

### Collection — Products → Collections → Create "Cookies"
Add all 8 cookie products to it. Then in **Online Store → Themes →
Customize**, open the Hero / Best Sellers / Shop All / Build Your Own Box
sections and pick the Cookies collection (if you leave it empty the theme
uses all products, which is fine for a cookie-only store).

### Build Your Own Box product — Products → Add product
Create a product named **"Build Your Own Box"** with three variants:
`Box of 4`, `Box of 6`, `Box of 8` — set each variant's price to your bundle
price (e.g. Box of 6 = sum of 6 average cookies minus 5%). Then in the
theme editor, open the **Build Your Own Box** section and pick this product.
How it works: the customer fills the box with flavours, and Add Box to Cart
adds that box variant with the chosen flavours as line-item properties
("Box size" + "Flavours"). The total shown is the variant price you set.
Without this product, the builder still renders (using the demo's
sum-minus-discount maths) but Add shows a setup message.

### Shipping — Settings → Shipping and delivery
The demo promised "Free shipping over Rs. 3,000" and Rs. 250 otherwise.
Shopify calculates shipping at checkout, so set it up there:
- Create a shipping zone for Pakistan with a **Rs. 250** flat rate.
- Add a **free-shipping rate for orders over Rs. 3,000** (same zone).
The cart drawer shows a progress bar toward free shipping and says
"Shipping calculated at checkout" — the actual charge comes from your
shipping settings.

### Payments — Settings → Payments
Enable the payment methods you want (Cash on Delivery is set up under
"Manual payment methods"). The theme sends customers to Shopify's real
checkout — no payment is handled by the theme itself.

## 3. What works out of the box

- Homepage: announcement bar, header, hero flavour switcher (numbered
  01–08, arrows + keyboard arrows), marquee, trust row, Build Your Own Box,
  Best Sellers, 4-step How-it-works, Shop All with filters + sorting,
  Corporate Gifting promos, Our Story, Reviews, footer with a **real**
  newsletter signup (Shopify customer form).
- Product pages (`/products/...`): photo, price, pack-size selector,
  quantity, Add to Box (opens the cart drawer).
- Collection pages, search results page (`/search`), cart page (`/cart`),
  404 page.
- Cart drawer: real Shopify cart (add / change quantity / remove), free-
  shipping progress bar, subtotal, and a Checkout button to Shopify checkout.
- Wishlist: hearts on cards + Quick View, saved in the browser
  (localStorage).
- Search: header search filters the catalogue live and links to `/search`.
- All sections are editable in the theme editor (Online Store → Themes →
  Customize): headings, texts, collections, trust/step/review blocks.

## 4. What is still demo / placeholder

- **If the store has no products yet**, the theme shows the 8 demo cookies
  with the demo's names, prices, tasting notes and photos (they are bundled
  as theme assets). They look exactly like the demo. Add buttons on demo
  products show a setup message instead of adding to cart. Turn this off in
  **Theme settings → Demo content** ("Show the 8 demo cookies…") once your
  real products exist.
- The 3 reviews ("Ayesha K.", "Bilal R.", "Mahnoor S.") are the demo's
  sample reviews — replace them in the Reviews section (or delete the
  blocks) before going live.
- The story text, address (Shop 12, Jinnah Super Market, F-7 Markaz,
  Islamabad), hours and `hello@shurmble.pk` are the demo's copy — edit them
  in the Story / Footer sections.
- The social icons in the footer link to `#` until you add your Facebook /
  Instagram / TikTok URLs in the Footer section.
- Footer credit "Developed by Mudasir Hussain" (linking to his LinkedIn)
  is kept, as requested.
- Product photos in the demo fallback are the demo's AI/stock cookie
  photos; upload real product photos when you create the products.

## 5. What was validated (and what was NOT)

Validated on this machine (no live store available):
- Theme structure: `layout/theme.liquid`, `templates/index.json` (+ product,
  collection, cart, search, page, list-collections, 404), 18 sections,
  2 snippets, `config/settings_schema.json` + `settings_data.json`,
  `locales/en.default.json`, `assets/theme.css` + `theme.js` + 9 real image
  files (no base64 blobs left in any Liquid file).
- All JSON files parse; all Liquid files parse with a Liquid parser
  (Shopify-only tags stripped for the parse check); `theme.js` passes
  `node --check` (if node was available).
- The Shopify CLI (`shopify theme check`) is **not** installed on this
  machine, so that check could not be run — run it yourself if you have the
  CLI: `shopify theme check` inside the unzipped theme folder.

NOT validated: rendering on a live store, checkout flow end-to-end, or
payment/shipping settings (those live in the store admin, not the theme).
