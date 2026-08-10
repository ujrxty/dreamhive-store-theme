# DreamHive Store Theme — Agent Guide

Custom Shopify Online Store 2.0 theme for **DreamHive** (US-market premium mattress brand). Store URL: `dreamhive7.myshopify.com`. GitHub repo: `ujrxty/dreamhive-store-theme`.

## Prime directives

1. **Every user-visible thing must be editable in the Shopify theme editor.** Copy, colors, images, links, section order — all live in section `schema {}` blocks or `settings_schema.json`, never hardcoded.
2. **Mattress-only focus.** DreamHive currently sells mattresses (four models: The Original, The Hybrid, The Cooling, The Luxe). Do not add furniture / sofa / dining / room copy. Sizes are Twin, Queen, King, Cal King.
3. **No em-dashes (`—`) or en-dashes (`–`) in copy.** Use commas or periods.
4. **Build vanilla.** No React, no framer-motion, no build step, no npm scripts. Pure Liquid + CSS + vanilla JS.

## Stack & runtime

- **Shopify OS 2.0** — JSON templates, dynamic sections, section groups
- **Shopify CLI 4.6.1** for local dev: `shopify theme dev --store=dreamhive7.myshopify.com` (live-reload on `127.0.0.1:9292`)
- **theme-check** must pass with 0 offenses before committing
- **GitHub ↔ Shopify sync** is live: every push to `main` updates the connected theme
- Merchant edits in the theme editor **write back** to `config/settings_data.json`, so pushes to that file may be ignored on the live store

## Directory map

```
assets/          CSS, JS, SVGs, bundled Unsplash/Pexels demo media (mattress-focused)
config/          settings_schema.json (theme editor controls) + settings_data.json (saved values)
layout/          theme.liquid — global HTML shell
locales/         en.default.json — i18n strings
sections/        Editable page sections + main-* templates
snippets/        Reusable partials (product-card, price, icons, meta-tags, cart-drawer)
templates/       JSON templates + Liquid pages (index, product, collection, cart, page.about, page.contact, page.editorial, customers/*)
.github/workflows/theme-check.yml   Lint on every push
.theme-check.yml Rules: extends :theme, ImgWidthAndHeight disabled (many inline images set aspect via CSS)
```

## Design system

Design tokens live in `layout/theme.liquid`'s `{% style %}` block, populated from `settings_schema.json`. Never hardcode a color or font — always `var(--color-gold)`, `var(--font-heading)`, etc.

- **Palette** (from the logo): dark bg `#0E0E10`, surface `#17171A`, gold `#C9A24A`, gold-light `#E5C88A`, silver `#C0C0C0`, text `#EDEAE3`, muted `#8A857C`, border `#2A2A2E`
- **Typography**: heading Playfair Display (`playfair_display_n4`), body Inter (`inter_n4`), both picker-editable
- **Buttons**: pill-shaped default (`button_radius` 40, capped at Shopify's 101-step limit), animated diagonal shine on hover, gold glow lift
- **Shape**: `--radius` 4px cards, `--radius-btn` 40px pill

## Editor-first section pattern

Every section follows:
1. Liquid renders `{{ section.settings.* }}` / `{{ block.settings.* }}` — no hardcoded copy
2. Bundled `fallback_asset` (asset filename string) is rendered via `asset_url` when the merchant hasn't uploaded an image yet
3. `{% schema %}` at bottom declares every editable field with sensible defaults
4. `presets` block seeds one clean preset for the section picker

Example: `sections/hero.liquid` supports `use_default_video` toggle → bundled `hero-video.mp4` → merchant-uploaded video → merchant-uploaded image → `hero-poster.jpg` fallback. All four fallback paths tested.

## Motion system

Three files load in `theme.liquid`: `base.css`, `motion.css`, `responsive.css` — plus `theme.js` + `motion.js`.

- **`[data-reveal]`** — IntersectionObserver adds `.is-visible`, transitions opacity + Y translate over 1400ms. Variants: `fade`, `slide-right`, `slide-left`, `scale`. Stagger with `[data-reveal-delay="1..5"]`
- **`[data-split="words|chars"]`** — motion.js splits text into spans, staggered 140ms/word (55ms/char)
- **`[data-parallax="0.15"]`** — scroll-driven Y translate; requestAnimationFrame-throttled
- **`[data-magnetic="0.25"]`** — mouse-follow translate on hover (desktop only)
- **`[data-image-reveal]`** — clip-path inset reveal
- **`[data-carousel]`** — horizontal scroll-snap; **auto-advances every 4.5s** when in view, pauses on interaction, resumes after 3.5s idle. Toggle with `data-carousel-autoplay="false"`
- **`[data-sticky-scroll]`** — media stays sticky while chapters scroll past; IntersectionObserver switches active image

**Slow the animations, don't speed them up.** User feedback: earlier iterations were too fast. Current defaults (1400ms reveals, 140ms/word) are the tuned baseline.

**Always respect `prefers-reduced-motion`** — motion.css has a media query that neutralizes animations.

## Landing page architecture

`templates/index.json` renders (in order): hero → marquee → big-statement → size-grid → product-carousel → numbered-features → sticky-story → pull-quote → image-banner → lookbook → newsletter.

All 11 sections are mattress-copywritten. The `editorial-grid` section still exists as a reusable section but is **not** used on the landing (it had mobile-empty-space issues). Prefer `size-grid` for room-tile patterns.

## Templates cheat sheet

- `templates/product.json` — main-product + featured-collection (related products)
- `templates/collection.json` — main-collection with filter sidebar (needs Search & Discovery app configured in admin)
- `templates/cart.json` — two-column layout with sticky summary
- `templates/page.about.json` — hero + editorial content + numbered features + pull quote
- `templates/page.contact.json` — split contact form + contact info
- `templates/page.editorial.json` — long-form legal/policy pages (Terms, Privacy, Shipping, Returns)
- `templates/customers/*` — login, register, account, order, addresses, reset_password, activate_account

## SEO

`snippets/meta-tags.liquid` emits:
- Robust meta description (product → collection → article → page → shop fallback, truncated 155)
- Open Graph with image dimensions + locale + Twitter card
- **JSON-LD**: Organization, WebSite (with SearchAction), Product (offers/price/availability), Article, **BreadcrumbList** on every content page

## Checkout constraint

Non-Plus Shopify plans cannot customize checkout via theme code. Only branding (logo, colors, fonts, radius) via Admin → **Settings → Checkout → Customize**. Cart page IS themed (pre-checkout polish).

## Common gotchas hit before

- **`font_face` filter returns raw CSS** — you MUST wrap it in a `<style>` tag or it renders as visible text on the page
- **Shopify range settings max 101 steps** — `(max-min)/step + 1 ≤ 101`. Pill radius uses `max:40 step:1` (41 steps)
- **`settings_data.json`** — the store's saved values are merchant-owned; if you change a schema default, existing dev/live themes may still hold the old value and error. To reset, delete the dev theme in admin and re-run `shopify theme dev`
- **Cart badge** must be `position: absolute` on the cart-open button, not inline margin, or it collides with the icon glyph
- **`main-page-contact.liquid`** — the `.field` class MUST be defined globally in base.css (not inline in login.liquid), or the contact page renders browser-default white inputs
- **Lookbook imagery** — always vet for family-friendly. No people-in-bed shots. Prefer styled bedrooms without subjects
- **Legal pages** — content lives in Shopify Admin → **Settings → Policies** (auto-generator) then paste into a Page using template `page.editorial`

## Committing

Test with `shopify theme check` — must be 0 offenses. Use meaningful multi-line commit messages. GitHub sync is live so every push updates the store. Do not force-push to main. Author `xousman.04@gmail.com`, name `ujrxty`, GitHub user `ujrxty`.

## Bundled demo media

`/assets/`:
- Video: `hero-video.mp4` (Pexels 6195935, HD, ~10.9MB)
- Poster: `hero-poster.jpg`
- Sizes: `size-{twin,queen,king,cal-king}.jpg`
- Products: `prod-{original,hybrid,cooling,luxe}.jpg`
- Lookbook: `mattress-{1,2,3,4}.jpg`
- Story: `mattress-craft.jpg`
- Banner: `sleep-consult.jpg`

Credits + sources: `assets/CREDITS.md`.

Merchant can override any of these via the section's `image_picker` setting — the fallback only renders when nothing is picked.
