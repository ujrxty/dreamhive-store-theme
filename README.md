# DreamHive Store Theme

Custom Shopify Online Store 2.0 theme for **DreamHive** — premium furniture, US market.

## Stack
- Shopify OS 2.0 (JSON templates, dynamic sections everywhere)
- Vanilla Liquid, CSS, JS (zero build step)
- Every color / text / image / link is editable in the Shopify theme editor

## Local development

```bash
# From this folder
shopify theme dev --store=dreamhive7.myshopify.com
```

This opens a live-reload preview on http://127.0.0.1:9292. Edits to any file hot-reload in the browser.

## Push to store manually (optional)

```bash
shopify theme push --store=dreamhive7.myshopify.com --unpublished
```

## GitHub → Shopify auto-sync

1. Push this repo to GitHub
2. Shopify Admin → Online Store → Themes → **Add theme** → **Connect from GitHub**
3. Pick this repo and the `main` branch
4. Every push to `main` updates the theme on the store

## Structure

```
assets/     CSS, JS, SVGs
config/     Theme editor schema (settings_schema.json) + saved values
layout/     theme.liquid — global HTML shell
locales/    i18n strings
sections/   Editable page sections
snippets/   Reusable partials
templates/  JSON templates (index, product, collection, cart, page, blog…)
```

## Editing content

Anything visible on the storefront is editable in **Online Store → Themes → Customize**. No code needed to change copy, colors, imagery, or section order.
