/* DreamHive theme JS — vanilla, no dependencies */
(function () {
  'use strict';

  // ---- Mobile drawer ----
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileDrawer = document.querySelector('[data-mobile-drawer]');
  if (mobileToggle && mobileDrawer) {
    const closeBtn = mobileDrawer.querySelector('[data-mobile-close]');
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
    closeBtn && closeBtn.addEventListener('click', () => {
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  }

  // ---- Cart drawer ----
  const cartDrawer = document.querySelector('[data-cart-drawer]');
  const cartOpenBtns = document.querySelectorAll('[data-cart-open]');
  const cartCloseBtn = cartDrawer && cartDrawer.querySelector('[data-cart-close]');
  const backdrop = document.querySelector('[data-cart-backdrop]');

  const openCart = () => {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    refreshCart();
  };
  const closeCart = () => {
    if (!cartDrawer) return;
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  cartOpenBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));
  cartCloseBtn && cartCloseBtn.addEventListener('click', closeCart);
  backdrop && backdrop.addEventListener('click', closeCart);

  // ---- Fetch and render cart ----
  async function fetchCart() {
    const res = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
    return res.json();
  }

  function money(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' });
  }

  async function refreshCart() {
    if (!cartDrawer) return;
    const cart = await fetchCart();
    const itemsEl = cartDrawer.querySelector('[data-cart-items]');
    const subtotalEl = cartDrawer.querySelector('[data-cart-subtotal]');
    const emptyEl = cartDrawer.querySelector('[data-cart-empty]');
    const footerEl = cartDrawer.querySelector('[data-cart-footer]');
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = cart.item_count; el.hidden = cart.item_count === 0; });

    if (!cart.items.length) {
      itemsEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      footerEl && (footerEl.hidden = true);
      return;
    }
    emptyEl && (emptyEl.hidden = true);
    footerEl && (footerEl.hidden = false);

    itemsEl.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-line="${item.key}">
        <a href="${item.url}"><img src="${item.image || ''}" alt="${escapeHtml(item.product_title)}"></a>
        <div>
          <div style="font-family:var(--font-heading);font-size:1rem;">${escapeHtml(item.product_title)}</div>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<div style="color:var(--color-muted);font-size:0.82rem;margin-top:4px;">${escapeHtml(item.variant_title)}</div>` : ''}
          <div style="margin-top:8px;">${money(item.final_line_price)}</div>
          <div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
            <button data-line-decrement style="width:28px;height:28px;border:1px solid var(--color-border);border-radius:var(--radius-btn);">−</button>
            <span>${item.quantity}</span>
            <button data-line-increment style="width:28px;height:28px;border:1px solid var(--color-border);border-radius:var(--radius-btn);">+</button>
          </div>
        </div>
        <button data-line-remove aria-label="Remove" style="color:var(--color-muted);align-self:start;">✕</button>
      </div>
    `).join('');

    if (subtotalEl) subtotalEl.textContent = money(cart.total_price);

    itemsEl.querySelectorAll('[data-line]').forEach(row => {
      const key = row.getAttribute('data-line');
      row.querySelector('[data-line-remove]').addEventListener('click', () => updateLine(key, 0));
      row.querySelector('[data-line-increment]').addEventListener('click', () => {
        const q = parseInt(row.querySelector('span').textContent, 10) + 1;
        updateLine(key, q);
      });
      row.querySelector('[data-line-decrement]').addEventListener('click', () => {
        const q = Math.max(0, parseInt(row.querySelector('span').textContent, 10) - 1);
        updateLine(key, q);
      });
    });
  }

  async function updateLine(id, quantity) {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity })
    });
    refreshCart();
  }

  // ---- Add to cart forms ----
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[action*="/cart/add"]');
    if (!form) return;
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = 'Adding…'; }
    try {
      const formData = new FormData(form);
      const res = await fetch('/cart/add.js', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Add to cart failed');
      toast('Added to cart');
      openCart();
    } catch (err) {
      toast('Could not add to cart', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    }
  });

  // ---- Quantity control on PDP ----
  document.querySelectorAll('[data-qty-wrap]').forEach(wrap => {
    const input = wrap.querySelector('input[type=number]');
    wrap.querySelector('[data-qty-inc]').addEventListener('click', () => { input.value = parseInt(input.value || 1, 10) + 1; });
    wrap.querySelector('[data-qty-dec]').addEventListener('click', () => { input.value = Math.max(1, parseInt(input.value || 1, 10) - 1); });
  });

  // ---- Variant selector on PDP ----
  const variantForm = document.querySelector('[data-variant-form]');
  if (variantForm) {
    const variants = JSON.parse(variantForm.getAttribute('data-variants') || '[]');
    variantForm.addEventListener('change', () => {
      const selected = [];
      variantForm.querySelectorAll('[data-option-index]').forEach(group => {
        const checked = group.querySelector('input:checked');
        if (checked) selected.push(checked.value);
      });
      const match = variants.find(v => JSON.stringify(v.options) === JSON.stringify(selected));
      if (match) {
        const idInput = variantForm.querySelector('input[name="id"]');
        if (idInput) idInput.value = match.id;
        const priceEl = document.querySelector('[data-pdp-price]');
        if (priceEl && match.price_html) priceEl.innerHTML = match.price_html;
        const atc = variantForm.querySelector('[data-pdp-atc]');
        if (atc) {
          atc.disabled = !match.available;
          atc.textContent = match.available ? 'Add to cart' : 'Sold out';
        }
      }
    });
  }

  // ---- PDP gallery ----
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const main = gallery.querySelector('[data-gallery-main] img');
    const thumbs = gallery.querySelectorAll('[data-gallery-thumb]');
    thumbs.forEach(t => t.addEventListener('click', () => {
      thumbs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      if (!main) return;
      main.src = t.getAttribute('data-src');
      main.srcset = '';
      const zoom = t.getAttribute('data-zoom');
      if (zoom) main.setAttribute('data-zoom-src', zoom);
    }));
  });

  // ---- Variant selected value display ----
  document.querySelectorAll('[data-variant-form]').forEach(form => {
    form.addEventListener('change', (e) => {
      const group = e.target.closest('.pdp__variant-group');
      if (!group) return;
      const label = group.querySelector('[data-selected-value]');
      if (label && e.target.value) label.textContent = e.target.value;
    });
  });

  // ---- Toast ----
  function toast(msg, type) {
    const root = document.getElementById('ToastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${type==='error'?'#8b1a1a':'var(--color-gold)'};color:var(--color-bg);padding:12px 20px;border-radius:var(--radius-btn);z-index:9999;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
