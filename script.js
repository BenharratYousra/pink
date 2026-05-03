// ========== REDIRECTION VERS LOGIN ==========
function redirectToLogin() {
    window.location.href = 'login.html';
}


// ========== NAVIGATION ==========
function showPage(page, e) {
    if(e) e.preventDefault();
    var pages = ['home', 'categories', 'shop', 'support', 'recherche', 'cart', 'dashboard', 'boutiques', 'login'];
    for(var i = 0; i < pages.length; i++) {
        var el = document.getElementById(pages[i] + '-page');
        if(el) el.style.display = 'none';
    }
    var target = document.getElementById(page + '-page');
    if(target) target.style.display = 'block';
    window.scrollTo(0, 0);
    if(page === 'home') loadHomeProducts();
    if(page === 'shop') loadShopProducts();
    if(page === 'recherche') lancerRecherche();
    if(page === 'cart') renderCart();
    if(page === 'boutiques') loadBoutiques();
    if(page === 'dashboard') loadDashboardAPI();
    if(page === 'categories') loadCategoriesFromAPI();
}
// ========== SHOP FILTER ==========
function filterShop(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.prod-card').forEach(function(card) {
        var cardCat = card.dataset.cat;
        card.style.display = (cat === 'all' || cardCat === cat) ? 'block' : 'none';
    });
}

// ========== FAQ ACCORDION ==========
function toggleFaq(el) {
    el.classList.toggle('open');
    if(el.nextElementSibling) el.nextElementSibling.classList.toggle('open');
}

// ========== PARTNER FORM MODAL ==========
function openPartnerForm() { alert('Formulaire partenaire - Fonctionnalité à venir'); }
function closePartnerForm() {}

// ========== API CONFIGURATION ==========
const API_URL = 'http://localhost/ikyo/api/';
let cart = JSON.parse(localStorage.getItem('ikyo_cart')) || [];

// ========== LOAD HOME PRODUCTS ==========
async function loadHomeProducts() {
    try {
        const res = await fetch(API_URL + 'products.php');
        const data = await res.json();
        const products = data.data || [];
        const container = document.getElementById('home-products');
        if(container) {
            container.innerHTML = products.slice(0,4).map(p => `
                <div class="pro">
                    <img src="${p.image_url || 'section4.jpg'}" alt="${p.nom}" style="width:100%;height:220px;object-fit:cover;">
                    <div class="des">
                        <span>${p.vendeur_nom || 'IKYO'}</span>
                        <h3>${p.nom.substring(0,30)}</h3>
                        <div class="star"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                        <h4>${parseInt(p.prix).toLocaleString()} DA</h4>
                    </div>
                    <a href="#" onclick="event.preventDefault(); addToCart(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix})">
                        <i class="fas fa-bag-shopping cart"></i>
                    </a>
                </div>
            `).join('');
        }
    } catch(e) { console.error('Erreur home:', e); }
}

// ========== LOAD SHOP PRODUCTS ==========
async function loadShopProducts() {
    try {
        const res = await fetch(API_URL + 'products.php');
        const data = await res.json();
        const products = data.data || [];
        const container = document.getElementById('shop-products');
        if(container) {
            container.innerHTML = products.map(p => `
                <div class="prod-card" data-cat="${p.categorie_nom ? p.categorie_nom.toLowerCase() : 'all'}">
                    <img src="${p.image_url || 'section4.jpg'}" alt="${p.nom}" style="width:100%;height:200px;object-fit:cover;">
                    <div class="prod-info">
                        <span class="store-nm">${p.vendeur_nom || 'IKYO'}</span>
                        <h4>${p.nom.substring(0,35)}</h4>
                        <div class="stars">★★★★★ <span>(${Math.floor(Math.random()*200)})</span></div>
                        <div class="price-row">
                            <div><span class="price">${parseInt(p.prix).toLocaleString()} DA</span></div>
                            <button class="add-btn" onclick="addToCart(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix})">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { console.error('Erreur shop:', e); }
}

// ========== SEARCH ==========
async function lancerRecherche() {
    const q = document.getElementById('rch-q') ? document.getElementById('rch-q').value.trim() : '';
    if(!q) {
        document.getElementById('search-results').innerHTML = '<div class="loading">Entrez un terme de recherche</div>';
        return;
    }
    document.getElementById('search-results').innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Recherche...</div>';
    try {
        const res = await fetch(API_URL + 'recherche.php?q=' + encodeURIComponent(q));
        const data = await res.json();
        const products = data.data || [];
        const container = document.getElementById('search-results');
        if(products.length === 0) container.innerHTML = '<div class="loading">🔍 Aucun résultat trouvé</div>';
        else {
            container.innerHTML = products.map(p => `
                <div class="product-card" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                    <img src="${p.image_url || 'section4.jpg'}" style="width:100%;height:180px;object-fit:cover;">
                    <div style="padding:15px;">
                        <h3>${p.nom}</h3>
                        <div class="product-price" style="font-size:1.2rem;font-weight:bold;color:#451d18;">${parseInt(p.prix).toLocaleString()} DA</div>
                        <button onclick="addToCart(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix})" style="background:#451d18;color:white;border:none;padding:10px;width:100%;border-radius:8px;">🛒 Ajouter</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) { container.innerHTML = '<div class="loading">❌ Erreur serveur</div>'; }
}

// ========== CART FUNCTIONS ==========
const CART_KEY = 'ikyo_cart';
const SHIPPING = 500;
const COUPONS = { 'IKYO10': 10, 'PROMO20': 20, 'SOLDES15': 15 };
let appliedDiscount = 0;
let appliedCode = '';

function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
}
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }

function updateCartBadge() {
    const total = getCart().reduce((s, i) => s + i.qty, 0);
    var badge = document.getElementById('cart-count-badge');
    if(badge) {
        if(total > 0) { badge.textContent = total; badge.style.display = 'inline-block'; }
        else { badge.style.display = 'none'; }
    }
}

function addToCart(id, name, price) {
    let existing = getCart().find(i => i.id === id);
    if(existing) existing.qty++;
    else getCart().push({ id, name, price, qty: 1, store: 'IKYO', img: 'section4.jpg' });
    saveCart(getCart());
    updateCartBadge();
    alert(name + ' ajouté au panier !');
}

function renderCart() {
    const cart = getCart();
    const list = document.getElementById('cart-items-list');
    const empty = document.getElementById('cart-empty');
    const right = document.getElementById('cart-right');
    const thead = document.getElementById('cart-table-head');
    const tfooter = document.getElementById('cart-footer-row');
    const btnClear = document.getElementById('btn-clear');
    const headerCount = document.getElementById('header-count');
    
    if(!list) return;
    const hasItems = cart.length > 0;
    
    if(empty) empty.classList.toggle('visible', !hasItems);
    if(right) right.style.display = hasItems ? 'block' : 'none';
    if(thead) thead.style.display = hasItems ? 'grid' : 'none';
    if(tfooter) tfooter.style.display = hasItems ? 'flex' : 'none';
    if(btnClear) btnClear.style.display = hasItems ? 'flex' : 'none';
    if(headerCount) headerCount.textContent = cart.reduce((s,i) => s + i.qty, 0) + (cart.length > 1 ? ' articles' : ' article');
    
    if(!hasItems) { list.innerHTML = ''; renderSummary(); return; }
    
    list.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div class="ci-product">
                <img src="${item.img || 'section4.jpg'}" onerror="this.src='section4.jpg'">
                <div class="ci-info"><div class="ci-store">${item.store || 'IKYO'}</div><div class="ci-name">${item.name}</div></div>
            </div>
            <div class="ci-price">${fmtDA(item.price)}</div>
            <div class="qty-box">
                <button onclick="changeQty(${i},-1)">−</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${i},+1)">+</button>
            </div>
            <div class="ci-total">${fmtDA(item.price * item.qty)}</div>
            <button class="ci-remove" onclick="removeItem(${i})"><i class="fas fa-xmark"></i></button>
        </div>
    `).join('');
    renderSummary();
}

function changeQty(idx, delta) {
    const cart = getCart();
    cart[idx].qty = Math.max(0, cart[idx].qty + delta);
    if(cart[idx].qty === 0) cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
    updateCartBadge();
}

function removeItem(idx) {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
    updateCartBadge();
    showToast('Article retiré', 'err');
}

function clearCart() {
    if(!confirm('Vider tout le panier ?')) return;
    saveCart([]);
    appliedDiscount = 0; appliedCode = '';
    renderCart();
    updateCartBadge();
    showToast('Panier vidé', 'err');
}

function applyCoupon() {
    const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    if(COUPONS[code]) {
        appliedDiscount = COUPONS[code];
        appliedCode = code;
        msg.textContent = `✔ Code "${code}" — -${appliedDiscount}% appliqué !`;
        msg.className = 'coupon-msg ok';
        showToast(`Réduction -${appliedDiscount}%`, 'success');
    } else {
        appliedDiscount = 0; appliedCode = '';
        msg.textContent = '✘ Code promo invalide';
        msg.className = 'coupon-msg err';
    }
    renderSummary();
}

function fmtDA(n) { return Number(n).toLocaleString('fr-DZ') + ' DA'; }

function renderSummary() {
    const cart = getCart();
    const count = cart.reduce((s,i) => s + i.qty, 0);
    const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
    const discount = Math.round(subtotal * appliedDiscount / 100);
    const hasItems = subtotal > 0;
    const total = Math.max(0, subtotal - discount + (hasItems ? SHIPPING : 0));
    
    const sCount = document.getElementById('s-count');
    const sSubtotal = document.getElementById('s-subtotal');
    const sShipping = document.getElementById('s-shipping');
    const sTotal = document.getElementById('s-total');
    const sDiscountRow = document.getElementById('s-discount-row');
    const sDiscount = document.getElementById('s-discount');
    
    if(sCount) sCount.textContent = count;
    if(sSubtotal) sSubtotal.textContent = fmtDA(subtotal);
    if(sShipping) sShipping.textContent = hasItems ? fmtDA(SHIPPING) : '0 DA';
    if(sTotal) sTotal.textContent = fmtDA(total);
    if(sDiscountRow && sDiscount) {
        if(discount > 0) { sDiscount.textContent = '-' + fmtDA(discount); sDiscountRow.style.display = 'flex'; }
        else { sDiscountRow.style.display = 'none'; }
    }
}

function goCheckout() {
    if(getCart().length === 0) return;
    document.getElementById('co-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderRecap();
    showCoStep(1);
}

function closeCheckout() {
    document.getElementById('co-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

function showCoStep(n) {
    for(let i=1; i<=3; i++) { const s = document.getElementById('co-step' + i); if(s) s.style.display = i === n ? 'block' : 'none'; }
}

function coStep(n) {
    if(n === 2) {
        const fields = ['co-prenom', 'co-nom', 'co-tel', 'co-wilaya', 'co-adresse'];
        let ok = true;
        fields.forEach(f => {
            const val = document.getElementById(f)?.value.trim();
            const err = document.getElementById('coerr-' + f.replace('co-',''));
            if(!val) { if(err) err.classList.add('show'); ok = false; }
            else { if(err) err.classList.remove('show'); }
        });
        if(!ok) return;
        renderRecap();
    }
    if(n === 3) {
        document.getElementById('co-name-confirm').textContent = document.getElementById('co-prenom')?.value.trim() || '';
        document.getElementById('co-tel-confirm').textContent = document.getElementById('co-tel')?.value.trim() || '';
        document.getElementById('co-order-id').textContent = 'IKYO-' + Date.now().toString(36).toUpperCase().slice(-6);
        saveCart([]);
        appliedDiscount = 0; appliedCode = '';
        updateCartBadge();
    }
    showCoStep(n);
}

function renderRecap() {
    const cart = getCart();
    const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
    const discount = Math.round(subtotal * appliedDiscount / 100);
    const total = subtotal - discount + SHIPPING;
    const el = document.getElementById('co-recap');
    if(el) {
        el.innerHTML = `<div class="co-recap-row"><span>Sous-total</span><span>${fmtDA(subtotal)}</span></div>
            ${discount > 0 ? `<div class="co-recap-row"><span>Réduction (${appliedCode})</span><span style="color:#27ae60">-${fmtDA(discount)}</span></div>` : ''}
            <div class="co-recap-row"><span>Livraison</span><span>${fmtDA(SHIPPING)}</span></div>
            <div class="co-recap-row"><span>Total</span><span>${fmtDA(total)}</span></div>`;
    }
}

function finishOrder() { closeCheckout(); renderCart(); showPage('home'); }

let _toastTimer;
function showToast(msg, type) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.innerHTML = msg;
    t.className = 'show' + (type === 'success' ? ' toast-success' : (type === 'err' ? ' toast-err' : ''));
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.className = '', 2800);
}

// ========== SUPPORT ==========
function sendSupportMessage() {
    const prenom = document.getElementById('support-prenom')?.value.trim() || '';
    const nom = document.getElementById('support-nom')?.value.trim() || '';
    const email = document.getElementById('support-email')?.value.trim() || '';
    const message = document.getElementById('support-message')?.value.trim() || '';
    if(!prenom || !nom || !email || !message) { alert('Veuillez remplir tous les champs'); return; }
    alert('✅ Message envoyé ! Nous vous répondrons sous 24h.');
    document.querySelectorAll('#support-page input, #support-page textarea').forEach(el => el.value = '');
}

// ========== LOAD BOUTIQUES ==========
async function loadBoutiques() {
    try {
        const res = await fetch(API_URL + 'boutique.php?action=liste');
        const data = await res.json();
        const boutiques = data.boutiques || [];
        const container = document.getElementById('boutiques-list');
        
        if(container) {
            if(boutiques.length === 0) {
                container.innerHTML = '<div class="loading">Aucune boutique pour le moment</div>';
            } else {
                container.innerHTML = boutiques.map(b => `
                    <div class="product-card" style="cursor:pointer;text-align:center;" onclick="window.location.href='boutique.html?id=${b.id}'">
                        <div style="background:#451d18;color:white;width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:20px auto;font-size:2rem;font-weight:bold;">
                            ${(b.nom_magasin?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div class="product-info">
                            <h3>${b.nom_magasin || 'Sans nom'}</h3>
                            <p style="color:#888;font-size:0.8rem;">${b.wilaya || 'Algérie'}</p>
                            <div class="product-price" style="font-size:0.9rem;">${b.nb_produits || 0} produits</div>
                            <div style="color:#f39c12;margin:5px 0;">${'★'.repeat(Math.round(b.note_moyenne || 0))}${'☆'.repeat(5-Math.round(b.note_moyenne || 0))}</div>
                            <button onclick="event.stopPropagation();window.location.href='boutique.html?id=${b.id}'" style="background:#451d18;color:white;border:none;padding:8px;width:100%;border-radius:8px;cursor:pointer;margin-top:10px;">
                                Voir la boutique →
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch(e) {
        console.error('Erreur chargement boutiques:', e);
        const container = document.getElementById('boutiques-list');
        if(container) container.innerHTML = '<div class="loading">❌ Erreur de chargement des boutiques</div>';
    }
}

// ========== CATEGORIES DYNAMIQUES ==========
async function loadCategoriesFromAPI() {
    try {
        const res = await fetch(API_URL + 'categories.php');
        const data = await res.json();
        const categories = data.data || [];
        const container = document.getElementById('categories-container');
        
        if(container && categories.length) {
            let html = '';
            for(let cat of categories) {
                if(cat.parent_id === null) {
                    html += `<div class="cat-block">
                        <h3><i class="fas ${cat.icone || 'fa-tag'}"></i> ${cat.nom}</h3>
                        <div class="cat-sub-grid">`;
                    if(cat.children && cat.children.length) {
                        for(let child of cat.children) {
                            html += `<a href="#" class="cat-sub-item" onclick="showPage('shop',event); return false;">
                                        <span>${child.nom}</span>
                                    </a>`;
                        }
                    } else {
                        html += `<a href="#" class="cat-sub-item" onclick="showPage('shop',event); return false;">
                                    <span>Tous les produits</span>
                                </a>`;
                    }
                    html += `</div></div>`;
                }
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="loading">Aucune catégorie trouvée</div>';
        }
    } catch(e) { 
        console.error('Erreur catégories:', e);
        document.getElementById('categories-container').innerHTML = '<div class="loading">❌ Erreur de chargement</div>';
    }
}

// ========== LOGIN AVEC API ==========
async function doLoginAPI() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if(!email || !password) { 
        alert('Email et mot de passe requis'); 
        return; 
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('mot_de_passe', password);
        
        const res = await fetch(API_URL + 'auth.php?action=client_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        const data = await res.json();
        
        if(data.success) {
            localStorage.setItem('user', JSON.stringify(data.client));
            alert('Connecté avec succès !');
            showPage('home');
        } else { 
            alert(data.message); 
        }
    } catch(e) { 
        console.error(e);
        alert('Erreur serveur, vérifiez XAMPP'); 
    }
}

// ========== DASHBOARD AVEC API ==========
async function loadDashboardAPI() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if(!user || user.role !== 'vendeur') {
        document.getElementById('dashboard-stats').innerHTML = `
            <div class="stat-card" style="background:white;padding:20px;border-radius:12px;text-align:center;">
                <h3 style="font-size:28px;color:#451d18;">🔒</h3>
                <p>Connectez-vous en tant que vendeur</p>
                <button onclick="redirectToLogin()" style="background:#451d18;color:white;border:none;padding:8px 20px;border-radius:8px;margin-top:10px;">
                    Se connecter
                </button>
            </div>
        `;
        return;
    }
    
    try {
        const res = await fetch(API_URL + 'dashboard.php?action=stats');
        const data = await res.json();
        
        if(data.success) {
            document.getElementById('dashboard-stats').innerHTML = `
                <div class="stat-card" style="background:white;padding:20px;border-radius:12px;text-align:center;">
                    <h3 style="font-size:28px;color:#451d18;">${(data.revenus || 0).toLocaleString()}</h3>
                    <p>Revenus (DA)</p>
                    <small style="color:${(data.revenus_pct || 0) >= 0 ? '#27ae60' : '#e74c3c'}">
                        ${(data.revenus_pct || 0) >= 0 ? '+' : ''}${data.revenus_pct || 0}%
                    </small>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:12px;text-align:center;">
                    <h3 style="font-size:28px;color:#451d18;">${data.nb_commandes || 0}</h3>
                    <p>Commandes</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:12px;text-align:center;">
                    <h3 style="font-size:28px;color:#451d18;">${data.nb_produits || 0}</h3>
                    <p>Produits</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:12px;text-align:center;">
                    <h3 style="font-size:28px;color:#451d18;">${(data.note_moyenne || 0).toFixed(1)}</h3>
                    <p>Note moyenne</p>
                </div>
            `;
        }
    } catch(e) { 
        console.error(e);
        document.getElementById('dashboard-stats').innerHTML = '<div class="loading">❌ Erreur de chargement</div>';
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    showPage('home');
    updateCartBadge();
    renderCart();
});
// ========== LOGIN AVEC API ==========
async function doLoginAPI() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if(!email || !password) { 
        alert('Email et mot de passe requis'); 
        return; 
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('mot_de_passe', password);
        
        const res = await fetch(API_URL + 'auth.php?action=client_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        const data = await res.json();
        
        if(data.success) {
            localStorage.setItem('user', JSON.stringify(data.client));
            alert('Connecté avec succès !');
            showPage('home');
            location.reload();
        } else { 
            alert(data.message); 
        }
    } catch(e) { 
        console.error(e);
        alert('Erreur serveur, vérifiez XAMPP'); 
    }
}
// ========== EXPORT GLOBAL FUNCTIONS ==========
window.showPage = showPage;
window.filterShop = filterShop;
window.lancerRecherche = lancerRecherche;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.applyCoupon = applyCoupon;
window.goCheckout = goCheckout;
window.closeCheckout = closeCheckout;
window.coStep = coStep;
window.finishOrder = finishOrder;
window.sendSupportMessage = sendSupportMessage;
window.openPartnerForm = openPartnerForm;
window.toggleFaq = toggleFaq;
window.redirectToLogin = redirectToLogin;
window.doLoginAPI = doLoginAPI;
window.loadCategoriesFromAPI = loadCategoriesFromAPI;
window.loadDashboardAPI = loadDashboardAPI;