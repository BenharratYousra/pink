/* ================================================================
   DASHBOARD.JS — IKYO Vendeur
================================================================ */

/* ── Helpers ── */
function fmtDA(n) { return Number(n).toLocaleString('fr-DZ') + ' DA'; }
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function statusLabel(s) {
    const map = {
        'en_attente':    { label:'En attente',   cls:'pending' },
        'confirmee':     { label:'Confirmée',    cls:'transit' },
        'en_preparation':{ label:'En préparation',cls:'transit' },
        'expediee':      { label:'Expédiée',     cls:'transit' },
        'en_livraison':  { label:'En livraison', cls:'transit' },
        'livree':        { label:'Livrée',       cls:'delivered' },
        'annulee':       { label:'Annulée',      cls:'cancelled' }
    };
    return map[s] || { label: s, cls: '' };
}

let _toastT;
function dashToast(msg, type = '') {
    const t = document.getElementById('dash-toast');
    if(!t) return;
    t.innerHTML = msg;
    t.className = 'show ' + type;
    clearTimeout(_toastT);
    _toastT = setTimeout(() => t.className = '', 3000);
}

/* ── Vérifier session vendeur ── */
function checkVendeurSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'vendeur') {
        window.location.href = 'login.html';
        return false;
    }
    return user;
}

/* ── API call helper ── */
async function api(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    try {
        const res = await fetch(`api/dashboard.php?${qs}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('API error:', e);
        return { success: false, message: 'Erreur serveur' };
    }
}

/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
function dashPage(id, el) {
    if (event) event.preventDefault();
    document.querySelectorAll('.dash-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    if (page) page.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = el || document.querySelector(`[data-page="${id}"]`);
    if (navEl) navEl.classList.add('active');
    
    const titles = {
        overview: 'Vue d\'ensemble', orders: 'Commandes',
        products: 'Produits', analytics: 'Analytiques',
        customers: 'Clients', reviews: 'Avis Clients', settings: 'Paramètres'
    };
    document.getElementById('page-title').textContent = titles[id] || id;
    if (window.innerWidth <= 860) document.getElementById('sidebar').classList.remove('open');
    
    if (id === 'overview') loadOverview();
    if (id === 'orders') loadOrders();
    if (id === 'products') loadProducts();
    if (id === 'customers') loadClients();
    if (id === 'reviews') loadAvis();
    if (id === 'analytics') loadAnalytics();
    if (id === 'settings') loadProfil();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* ══════════════════════════════════
   OVERVIEW — Stats + Charts
══════════════════════════════════ */
async function loadOverview() {
    const user = checkVendeurSession();
    if (!user) return;
    
    // Afficher les stats avec valeur 0 par défaut
    animateValue('kpi-revenus', 0, 0, 1000, v => fmtDA(v));
    animateValue('kpi-commandes', 0, 0, 1000, v => Math.floor(v));
    animateValue('kpi-produits', 0, 0, 1000, v => Math.floor(v));
    animateValue('kpi-note', 0, 0, 1000, v => v.toFixed(1));
    
    // Tendance neutre
    const trendEl = document.getElementById('kpi-revenus-trend');
    if(trendEl) {
        trendEl.innerHTML = '<i class="fas fa-minus"></i> 0% vs mois dernier';
        trendEl.className = 'kpi-trend neutral';
    }
    
    // Donut vide
    renderDonut([]);
    
    // Charger top produits et dernières commandes
    loadTopProduits();
    loadRecentOrders();
}

function animateValue(id, from, to, duration, formatter) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = null;
    function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatter(from + (to - from) * ease);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = formatter(to);
    }
    requestAnimationFrame(step);
}

function renderDonut(statuts) {
    const total = 0;
    const segLiv = document.querySelector('.donut-seg.delivered');
    const segTra = document.querySelector('.donut-seg.transit');
    const segPen = document.querySelector('.donut-seg.pending');
    const txtNb = document.querySelector('.donut-svg text:first-of-type');
    
    if(segLiv) segLiv.setAttribute('stroke-dasharray', '0 289');
    if(segTra) segTra.setAttribute('stroke-dasharray', '0 289');
    if(segPen) segPen.setAttribute('stroke-dasharray', '289 289');
    if(txtNb) txtNb.textContent = '0';
    
    const dl = document.querySelector('.donut-legend');
    if(dl) dl.innerHTML = `
        <div class="dl-item"><span class="dl-dot" style="background:#27ae60"></span> Livrées <strong>0%</strong></div>
        <div class="dl-item"><span class="dl-dot" style="background:var(--gold)"></span> En route <strong>0%</strong></div>
        <div class="dl-item"><span class="dl-dot" style="background:#e74c3c"></span> En attente <strong>0%</strong></div>
    `;
}

async function loadRecentOrders() {
    const tbody = document.getElementById('recent-orders-tbody');
    if(tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Aucune commande pour l\'instant</td></tr>';
    }
}

async function loadTopProduits() {
    const list = document.getElementById('top-products-list');
    if(list) {
        list.innerHTML = '<p style="padding:20px;color:#999;text-align:center;font-size:0.8rem">Aucun produit vendu pour l\'instant</p>';
    }
}

/* ══════════════════════════════════
   PAGE COMMANDES
══════════════════════════════════ */
let ordersData = [];

async function loadOrders(statut = '', q = '') {
    const tbody = document.getElementById('orders-tbody');
    if(tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#999">Aucune commande trouvée</td></tr>';
    }
    ordersData = [];
}

function filterOrders(val) { loadOrders('', val); }
function filterOrderStatus(val) { loadOrders(val, ''); }
async function changerStatut(commandeId, statut) { dashToast('Statut mis à jour (démo)', 'ok'); }
function exportOrders() { dashToast('Export CSV (démo)', 'ok'); }

/* ══════════════════════════════════
   PAGE PRODUITS
══════════════════════════════════ */
let produitsData = [];

async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if(grid) {
        grid.innerHTML = '<div style="text-align:center;padding:60px;color:#999;grid-column:1/-1"><i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:16px"></i>Aucun produit — ajoutez votre premier produit !</div>';
    }
    produitsData = [];
}

function filterProducts(val) { renderProductsGrid(produitsData.filter(p => p.nom.toLowerCase().includes(val.toLowerCase()))); }
function renderProductsGrid(produits) { }

function openAddProduct() {
    document.getElementById('add-product-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeAddProduct() {
    document.getElementById('add-product-overlay').classList.remove('open');
    document.body.style.overflow = '';
}
async function saveProduct() {
    dashToast('✅ Produit ajouté (démo)', 'ok');
    closeAddProduct();
}
function previewImgs(input) { }
function openEditProduct(id) { dashToast('Modification bientôt disponible', ''); }
async function supprimerProduit(id, nom) { dashToast('Produit supprimé (démo)', 'err'); }

/* ══════════════════════════════════
   PAGE CLIENTS
══════════════════════════════════ */
async function loadClients() {
    const tbody = document.getElementById('customers-tbody');
    if(tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#999">Aucun client pour l\'instant</td></tr>';
    }
}

/* ══════════════════════════════════
   PAGE AVIS
══════════════════════════════════ */
async function loadAvis() {
    const bigEl = document.querySelector('.rs-big');
    if(bigEl) bigEl.textContent = '0.0';
    const pEl = document.querySelector('.rs-score p');
    if(pEl) pEl.textContent = 'Sur 0 avis';
    
    const rbs = document.querySelectorAll('.rb-fill');
    rbs.forEach(rb => rb.style.width = '0%');
    const spans = document.querySelectorAll('.rb-row span:last-child');
    spans.forEach(span => span.textContent = '0%');
    
    const list = document.getElementById('reviews-list');
    if(list) list.innerHTML = '<div style="text-align:center;padding:40px;color:#999">Aucun avis pour l\'instant</div>';
}

/* ══════════════════════════════════
   PAGE ANALYTICS
══════════════════════════════════ */
async function loadAnalytics() {
    const wbars = document.getElementById('wilaya-bars');
    if(wbars) wbars.innerHTML = '<p style="padding:20px;color:#999;text-align:center">Aucune vente encore</p>';
    
    const linePath = document.getElementById('line-path');
    const areaPath = document.getElementById('area-path');
    const pointsG = document.getElementById('line-points');
    const labelsG = document.getElementById('line-labels');
    
    if(linePath && areaPath && pointsG && labelsG) {
        const w = 550, h = 130, padL = 40, padT = 20;
        const pts = [];
        for(let i=0; i<12; i++) {
            pts.push({ x: padL + (i/11)*w, y: padT + h });
        }
        const d = pts.map((p,i) => (i===0?'M':'L') + p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
        linePath.setAttribute('d', d);
        areaPath.setAttribute('d', d + ` L${pts[11].x},${padT+h} L${padL},${padT+h} Z`);
        pointsG.innerHTML = '';
        labelsG.innerHTML = '';
    }
}

/* ══════════════════════════════════
   PAGE SETTINGS
══════════════════════════════════ */
async function loadProfil() {
    const user = JSON.parse(localStorage.getItem('user'));
    const nomMagasin = document.getElementById('set-nom-magasin');
    const telephone = document.getElementById('set-telephone');
    const description = document.getElementById('set-description');
    const email = document.getElementById('set-email');
    
    if(nomMagasin) nomMagasin.value = user?.nom || '';
    if(email) email.value = user?.email || '';
    
    const sidebarName = document.querySelector('.sp-info strong');
    const sidebarSub = document.querySelector('.sp-info span');
    const topbarAvatar = document.querySelector('.topbar-avatar');
    const sidebarAvatar = document.querySelector('.sp-avatar');
    
    if(sidebarName) sidebarName.textContent = user?.nom || 'Boutique';
    if(sidebarSub) sidebarSub.textContent = 'Algérie';
    const initials = (user?.prenom?.charAt(0) || 'V') + (user?.nom?.charAt(0) || 'B');
    if(topbarAvatar) topbarAvatar.textContent = initials;
    if(sidebarAvatar) sidebarAvatar.textContent = initials;
}

async function saveSettings() {
    dashToast('Paramètres sauvegardés', 'ok');
}

function vendeurLogout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/* ══════════════════════════════════
   NOTIFICATIONS (simplifiées)
══════════════════════════════════ */
function toggleNotif() {
    document.getElementById('notif-panel').classList.toggle('open');
}
function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
    document.getElementById('notif-panel').classList.remove('open');
    dashToast('Notifications lues', 'ok');
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
function initDate() {
    const el = document.getElementById('page-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

document.addEventListener('DOMContentLoaded', async function () {
    const user = checkVendeurSession();
    if (!user) return;
    
    initDate();
    loadOverview();
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.chart-period').querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('notif-panel');
        const btn = document.querySelector('.topbar-notif');
        if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
    
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        if (window.innerWidth <= 860 && sidebar && toggle) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    const addProductOverlay = document.getElementById('add-product-overlay');
    if(addProductOverlay) {
        addProductOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeAddProduct();
        });
    }
});

// Exporter les fonctions globales
window.dashPage = dashPage;
window.toggleSidebar = toggleSidebar;
window.toggleNotif = toggleNotif;
window.markAllRead = markAllRead;
window.filterOrders = filterOrders;
window.filterOrderStatus = filterOrderStatus;
window.changerStatut = changerStatut;
window.exportOrders = exportOrders;
window.filterProducts = filterProducts;
window.openAddProduct = openAddProduct;
window.closeAddProduct = closeAddProduct;
window.saveProduct = saveProduct;
window.previewImgs = previewImgs;
window.openEditProduct = openEditProduct;
window.supprimerProduit = supprimerProduit;
window.saveSettings = saveSettings;
window.vendeurLogout = vendeurLogout;