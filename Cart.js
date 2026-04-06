

const CART_KEY = 'ikyo_cart';
const SHIPPING  = 500;
const COUPONS   = { 'IKYO10': 10, 'PROMO20': 20, 'SOLDES15': 15 };
let appliedDiscount = 0;
let appliedCode     = '';

/* ══ localStorage ══ */
function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
}
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }

/* ══ AJOUTER AU PANIER ══ */
function addToCart(name, price, store, img) {
    const cart = getCart();
    const idx  = cart.findIndex(i => i.name === name && i.store === store);
    if (idx > -1) {
        cart[idx].qty += 1;
        showToast(`<i class="fas fa-plus"></i> +1 "${name}"`, 'success');
    } else {
        cart.push({ name, price, store, img: img || '', qty: 1 });
        showToast(`<i class="fas fa-bag-shopping"></i> "${name}" ajouté !`, 'success');
    }
    saveCart(cart);
    updateBadge();
}

/* ══ BADGE ══ */
function updateBadge() {
    const total = getCart().reduce((s, i) => s + i.qty, 0);
    ['cart-badge', 'cart-badge-header'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.textContent = total;
        b.classList.remove('pop');
        void b.offsetWidth;
        b.classList.add('pop');
    });
}

/* ══ QTY / REMOVE / CLEAR ══ */
function changeQty(idx, delta) {
    const cart = getCart();
    cart[idx].qty = Math.max(0, cart[idx].qty + delta);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
    updateBadge();
}
function removeItem(idx) {
    const cart = getCart();
    const name = cart[idx].name;
    cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
    updateBadge();
    showToast(`<i class="fas fa-trash-can"></i> "${name}" retiré`, 'err');
}
function clearCart() {
    if (!confirm('Vider tout le panier ?')) return;
    saveCart([]);
    appliedDiscount = 0; appliedCode = '';
    renderCart();
    updateBadge();
    showToast('<i class="fas fa-trash-can"></i> Panier vidé');
}

/* ══ COUPON ══ */
function applyCoupon() {
    const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
    const msg  = document.getElementById('coupon-msg');
    if (!msg) return;
    if (COUPONS[code]) {
        appliedDiscount = COUPONS[code];
        appliedCode     = code;
        msg.textContent = `✔ Code "${code}" — -${appliedDiscount}% appliqué !`;
        msg.className   = 'coupon-msg ok';
        showToast(`<i class="fas fa-tag"></i> Réduction -${appliedDiscount}% !`, 'success');
    } else {
        appliedDiscount = 0; appliedCode = '';
        msg.textContent = '✘ Code promo invalide';
        msg.className   = 'coupon-msg err';
    }
    renderSummary();
}

/* ══ FORMAT ══ */
function fmtDA(n) { return Number(n).toLocaleString('fr-DZ') + ' DA'; }
function parseDA(str) { return parseInt((str || '').replace(/[^\d]/g, ''), 10) || 0; }
function genOrderId() { return 'IKYO-' + Date.now().toString(36).toUpperCase().slice(-6); }

/* ══ SUMMARY ══ */
function renderSummary() {
    const cart     = getCart();
    const count    = cart.reduce((s, i) => s + i.qty, 0);
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = Math.round(subtotal * appliedDiscount / 100);
    const hasItems = subtotal > 0;
    const total    = Math.max(0, subtotal - discount + (hasItems ? SHIPPING : 0));

    const $ = id => document.getElementById(id);
    if (!$('s-count')) return;

    $('s-count').textContent    = count;
    $('s-subtotal').textContent = fmtDA(subtotal);
    $('s-shipping').textContent = hasItems ? fmtDA(SHIPPING) : '0 DA';
    $('s-total').textContent    = fmtDA(total);

    const dRow = $('s-discount-row');
    if (dRow) {
        if (discount > 0) {
            $('s-discount').textContent = '-' + fmtDA(discount);
            dRow.style.display = 'flex';
        } else {
            dRow.style.display = 'none';
        }
    }

    // Header count badge
    const hc = $('header-count');
    if (hc) hc.textContent = count + (count > 1 ? ' articles' : ' article');
}

/* ══ RENDER CART PAGE ══ */
function renderCart() {
    const cart     = getCart();
    const list     = document.getElementById('cart-items-list');
    const empty    = document.getElementById('cart-empty');
    const right    = document.getElementById('cart-right');
    const thead    = document.getElementById('cart-table-head');
    const tfooter  = document.getElementById('cart-footer-row');
    const btnClear = document.getElementById('btn-clear');
    if (!list) return;

    const hasItems = cart.length > 0;

    if (empty)    empty.classList.toggle('visible', !hasItems);
    if (right)    right.style.display    = hasItems ? 'block' : 'none';
    if (thead)    thead.style.display    = hasItems ? 'grid'  : 'none';
    if (tfooter)  tfooter.style.display  = hasItems ? 'flex'  : 'none';
    if (btnClear) btnClear.style.display = hasItems ? 'flex'  : 'none';

    if (!hasItems) { list.innerHTML = ''; renderSummary(); return; }

    list.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div class="ci-product">
                <img src="${item.img || 'section4.jpg'}" alt="${item.name}"
                     onerror="this.src='section4.jpg'">
                <div class="ci-info">
                    <div class="ci-store">${item.store}</div>
                    <div class="ci-name">${item.name}</div>
                </div>
            </div>
            <div class="ci-price">${fmtDA(item.price)}</div>
            <div class="qty-box">
                <button onclick="changeQty(${i},-1)" aria-label="Moins">−</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${i},+1)" aria-label="Plus">+</button>
            </div>
            <div class="ci-total">${fmtDA(item.price * item.qty)}</div>
            <button class="ci-remove" onclick="removeItem(${i})" aria-label="Supprimer">
                <i class="fas fa-xmark"></i>
            </button>
        </div>
    `).join('');

    renderSummary();
}

/* ══ CHECKOUT MODAL ══ */
function goCheckout() {
    if (getCart().length === 0) return;
    document.getElementById('co-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Populate recap
    renderRecap();
    showCoStep(1);
}
function closeCheckout() {
    document.getElementById('co-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

function showCoStep(n) {
    [1,2,3].forEach(i => {
        const s = document.getElementById('co-step' + i);
        if (s) s.style.display = (i === n) ? 'block' : 'none';
    });
    document.querySelector('.co-modal')?.scrollTo(0,0);
}

function coStep(n) {
    if (n === 2) {
        // Validate step 1
        const fields = [
            { id: 'co-prenom',  err: 'coerr-prenom' },
            { id: 'co-nom',     err: 'coerr-nom' },
            { id: 'co-tel',     err: 'coerr-tel' },
            { id: 'co-wilaya',  err: 'coerr-wilaya' },
            { id: 'co-adresse', err: 'coerr-adresse' },
        ];
        let ok = true;
        fields.forEach(f => {
            const val = document.getElementById(f.id)?.value.trim();
            const err = document.getElementById(f.err);
            if (!val) { if (err) err.classList.add('show'); ok = false; }
            else       { if (err) err.classList.remove('show'); }
        });
        if (!ok) return;
        renderRecap();
    }
    if (n === 3) {
        // Confirm order
        const prenom = document.getElementById('co-prenom')?.value.trim();
        const tel    = document.getElementById('co-tel')?.value.trim();
        document.getElementById('co-name-confirm').textContent = prenom;
        document.getElementById('co-tel-confirm').textContent  = tel;
        document.getElementById('co-order-id').textContent     = genOrderId();
        saveCart([]);
        appliedDiscount = 0; appliedCode = '';
        updateBadge();
    }
    showCoStep(n);
}

function renderRecap() {
    const cart     = getCart();
    const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
    const discount = Math.round(subtotal * appliedDiscount / 100);
    const total    = subtotal - discount + SHIPPING;
    const el = document.getElementById('co-recap');
    if (!el) return;
    el.innerHTML = `
        <div class="co-recap-row"><span>Sous-total</span><span>${fmtDA(subtotal)}</span></div>
        ${discount > 0 ? `<div class="co-recap-row"><span>Réduction (${appliedCode})</span><span style="color:#27ae60">-${fmtDA(discount)}</span></div>` : ''}
        <div class="co-recap-row"><span>Livraison</span><span>${fmtDA(SHIPPING)}</span></div>
        <div class="co-recap-row"><span>Total</span><span>${fmtDA(total)}</span></div>
    `;
}

function finishOrder() {
    closeCheckout();
    renderCart();
    window.location.href = 'index.html';
}

/* ══ TOAST ══ */
let _toastTimer;
function showToast(html, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = html;
    t.className = 'show' + (type ? ' toast-' + type : '');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.className = '', 2800);
}


document.addEventListener('DOMContentLoaded', function () {

  
    if (!document.getElementById('ikyo-cart-style')) {
        const s = document.createElement('style');
        s.id = 'ikyo-cart-style';
        s.textContent = `
            .cart-badge{position:absolute;top:-9px;right:-12px;background:#2ecc71;color:#fff;
            font-size:.6rem;font-weight:900;min-width:18px;height:18px;border-radius:20px;
            display:flex;align-items:center;justify-content:center;padding:0 4px;
            border:2px solid #451d18;line-height:1;transition:transform .2s;z-index:10;}
            .cart-badge.pop{animation:badgePop .3s cubic-bezier(.36,.07,.19,.97);}
            @keyframes badgePop{0%,100%{transform:scale(1)}40%{transform:scale(1.6)}70%{transform:scale(.85)}}
            #toast{position:fixed;bottom:28px;right:28px;background:#222;color:#fff;
            padding:12px 20px;border-radius:12px;font-size:.85rem;font-weight:600;
            box-shadow:0 8px 28px rgba(0,0,0,.22);opacity:0;transform:translateY(16px);
            transition:all .28s;z-index:99999;pointer-events:none;max-width:280px;}
            #toast.show{opacity:1;transform:translateY(0);}
            #toast.toast-success{background:#1e7e48;}
            #toast.toast-err{background:#c0392b;}
        `;
        document.head.appendChild(s);
    }

    /* ── Toast container ── */
    if (!document.getElementById('toast')) {
        const t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }

    /* ── Badge sur le lien panier (navbar) ── */
    document.querySelectorAll('#navbar a[href="cart.html"]').forEach(link => {
        link.style.position = 'relative';
        if (!link.querySelector('.cart-badge')) {
            const b = document.createElement('span');
            b.id        = 'cart-badge';
            b.className = 'cart-badge';
            b.textContent = '0';
            link.appendChild(b);
        }
    });

    /* ── Boutons Featured Products (Home) ── */
    document.querySelectorAll('#product .pro').forEach(card => {
        const anchor = card.querySelector('a');
        if (!anchor) return;
        const name  = card.querySelector('h3')?.textContent?.trim() || 'Article';
        const price = parseDA(card.querySelector('h4')?.textContent);
        const img   = card.querySelector('img')?.src || '';
        const store = card.querySelector('.des span')?.textContent?.trim() || 'Boutique';
        anchor.href = '#';
        anchor.addEventListener('click', e => {
            e.preventDefault();
            addToCart(name, price, store, img);
        });
    });

    /* ── Boutons Shop page (.add-btn) ── */
    document.querySelectorAll('.shop-grid .prod-card').forEach(card => {
        const btn = card.querySelector('.add-btn');
        if (!btn) return;
        const name  = card.querySelector('h4')?.textContent?.trim() || 'Article';
        const price = parseDA(card.querySelector('.price')?.textContent);
        const img   = card.querySelector('img')?.src || '';
        const store = card.querySelector('.store-nm')?.textContent?.trim() || 'Boutique';
        btn.addEventListener('click', e => {
            e.preventDefault();
            // Petit effet visuel sur le bouton
            btn.style.transform = 'scale(0.88)';
            setTimeout(() => btn.style.transform = '', 180);
            addToCart(name, price, store, img);
        });
    });

  
    updateBadge();
    renderCart();
});