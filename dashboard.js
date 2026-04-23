/* ================================================================
   DASHBOARD.JS — IKYO Vendeur — Données réelles depuis PHP
================================================================ */

/* ── Helpers ── */
function fmtDA(n) { return Number(n).toLocaleString('fr-DZ') + ' DA'; }
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function fmtTime(d) {
    if (!d) return '';
    const now  = new Date();
    const date = new Date(d);
    const diff = Math.floor((now - date) / 60000);
    if (diff < 1)   return 'À l\'instant';
    if (diff < 60)  return `Il y a ${diff} min`;
    if (diff < 1440)return `Il y a ${Math.floor(diff/60)}h`;
    return fmtDate(d);
}
function stars(n) {
    n = Math.round(n);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}
function statusLabel(s) {
    const map = {
        'en_attente':    { label:'En attente',   cls:'pending' },
        'confirmee':     { label:'Confirmée',     cls:'transit' },
        'en_preparation':{ label:'En préparation',cls:'transit' },
        'expediee':      { label:'Expédiée',      cls:'transit' },
        'en_livraison':  { label:'En livraison',  cls:'transit' },
        'livree':        { label:'Livrée',        cls:'delivered' },
        'annulee':       { label:'Annulée',       cls:'cancelled' },
        'remboursee':    { label:'Remboursée',    cls:'cancelled' },
    };
    return map[s] || { label: s, cls: '' };
}

let _toastT;
function dashToast(msg, type = '') {
    const t = document.getElementById('dash-toast');
    t.innerHTML = msg;
    t.className = 'show ' + type;
    clearTimeout(_toastT);
    _toastT = setTimeout(() => t.className = '', 3000);
}

/* ── API call helper ── */
async function api(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    try {
        const res  = await fetch(`api/dashboard.php?${qs}`);
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
    // Charger données selon page
    if (id === 'orders')    loadOrders();
    if (id === 'products')  loadProducts();
    if (id === 'customers') loadClients();
    if (id === 'reviews')   loadAvis();
    if (id === 'analytics') loadAnalytics();
    if (id === 'settings')  loadProfil();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* ══════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════ */
function toggleNotif() {
    document.getElementById('notif-panel').classList.toggle('open');
}

async function loadNotifications() {
    const data = await api('notifications');
    if (!data.success) return;

    const panel = document.getElementById('notif-panel');
    const dot   = document.querySelector('.notif-dot');
    const nb    = data.nb || 0;

    // Badge commandes sidebar
    const nbOrders = document.getElementById('nb-orders');
    if (nbOrders) nbOrders.textContent = nb;

    if (nb > 0 && dot) dot.style.display = 'block';
    else if (dot) dot.style.display = 'none';

    // Rendre notifications
    const list = panel.querySelector('.notif-list') || panel;
    const items = data.notifications.map(n => {
        let icon, title, body;
        if (n.type === 'commande') {
            icon = `<div class="notif-icon order"><i class="fas fa-bag-shopping"></i></div>`;
            title = `Nouvelle commande ${n.ref}`;
            body  = `Montant : ${fmtDA(n.montant)}`;
        } else if (n.type === 'stock') {
            icon = `<div class="notif-icon alert"><i class="fas fa-triangle-exclamation"></i></div>`;
            title = 'Stock faible';
            body  = `${n.ref} — ${n.montant} unités restantes`;
        } else {
            icon = `<div class="notif-icon review"><i class="fas fa-star"></i></div>`;
            title = `Nouvel avis ${n.montant}★`;
            body  = n.ref;
        }
        return `
        <div class="notif-item unread">
            ${icon}
            <div class="notif-body">
                <strong>${title}</strong>
                <p>${body}</p>
                <span>${fmtTime(n.created_at)}</span>
            </div>
        </div>`;
    }).join('');

    // Remplacer le contenu après le header
    const header = panel.querySelector('.notif-header');
    const existing = panel.querySelectorAll('.notif-item');
    existing.forEach(e => e.remove());
    if (items) header.insertAdjacentHTML('afterend', items);
    else header.insertAdjacentHTML('afterend', '<p style="padding:16px;color:#999;font-size:0.8rem;text-align:center">Aucune notification récente</p>');
}

function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = 'none';
    document.getElementById('notif-panel').classList.remove('open');
    dashToast('<i class="fas fa-check"></i> Notifications lues', 'ok');
}

/* ══════════════════════════════════
   OVERVIEW — Stats + Charts
══════════════════════════════════ */
async function loadOverview() {
    const data = await api('stats');
    if (!data.success) {
        dashToast('<i class="fas fa-triangle-exclamation"></i> Erreur chargement — vérifiez XAMPP', 'err');
        return;
    }

    // Animer KPIs
    animateValue('kpi-revenus',   0, data.revenus,      1400, v => fmtDA(Math.floor(v)));
    animateValue('kpi-commandes', 0, data.nb_commandes, 1200, v => Math.floor(v));
    animateValue('kpi-produits',  0, data.nb_produits,  1200, v => Math.floor(v));
    animateValue('kpi-note',      0, data.note_moyenne, 1200, v => v.toFixed(1));

    // Tendance revenus
    const trendEl = document.getElementById('kpi-revenus-trend');
    if (trendEl) {
        const pct = data.revenus_pct;
        trendEl.innerHTML = pct >= 0
            ? `<i class="fas fa-arrow-trend-up"></i> +${pct}% vs mois dernier`
            : `<i class="fas fa-arrow-trend-down"></i> ${pct}% vs mois dernier`;
        trendEl.className = 'kpi-trend ' + (pct >= 0 ? 'up' : 'down');
    }

    // Badge commandes en attente
    const attEl = document.getElementById('nb-orders');
    if (attEl && data.en_attente > 0) attEl.textContent = data.en_attente;

    // Bar chart revenus 12 mois
    renderRevenueChart(data.revenus_12);

    // Donut statuts
    renderDonut(data.statuts);

    // Charger top produits + dernières commandes
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
    }
    requestAnimationFrame(step);
}

function renderRevenueChart(revenus12) {
    const chart  = document.getElementById('revenue-chart');
    const labels = document.getElementById('revenue-labels');
    if (!chart) return;

    const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    // Créer tableau 12 mois
    const data = Array(12).fill(0);
    (revenus12 || []).forEach(r => { data[r.mois - 1] = parseFloat(r.total); });

    const max = Math.max(...data, 1);
    const currentMonth = new Date().getMonth();

    chart.innerHTML = data.map((val, i) => `
        <div class="bar-col">
            <div class="bar-tooltip">${fmtDA(val)}</div>
            <div class="bar-fill ${i === currentMonth ? 'current-month' : ''}"
                 style="height:0%" data-target="${(val / max) * 100}"></div>
        </div>
    `).join('');

    labels.innerHTML = MOIS.map(m => `<div class="bar-label">${m}</div>`).join('');

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            chart.querySelectorAll('.bar-fill').forEach(bar => {
                bar.style.transition = 'height 1.2s cubic-bezier(0.25,0.46,0.45,0.94)';
                bar.style.height = bar.dataset.target + '%';
            });
        });
    });
}

function renderDonut(statuts) {
    // Calculer totaux
    let livrees = 0, enRoute = 0, attente = 0, total = 0;
    (statuts || []).forEach(s => {
        const n = parseInt(s.nb);
        total += n;
        if (s.statut === 'livree') livrees += n;
        else if (['en_livraison','expediee','en_preparation','confirmee'].includes(s.statut)) enRoute += n;
        else if (s.statut === 'en_attente') attente += n;
    });

    if (total === 0) return;
    const circ = 2 * Math.PI * 46; // circonférence
    const pLiv = (livrees / total) * circ;
    const pRou = (enRoute / total) * circ;
    const pAtt = (attente / total) * circ;

    const segLiv = document.querySelector('.donut-seg.delivered');
    const segTra = document.querySelector('.donut-seg.transit');
    const segPen = document.querySelector('.donut-seg.pending');
    const txtNb  = document.querySelector('.donut-svg text:first-of-type');

    if (segLiv) segLiv.setAttribute('stroke-dasharray', `${pLiv} ${circ - pLiv}`);
    if (segTra) { segTra.setAttribute('stroke-dasharray', `${pRou} ${circ - pRou}`); segTra.setAttribute('stroke-dashoffset', -pLiv); }
    if (segPen) { segPen.setAttribute('stroke-dasharray', `${pAtt} ${circ - pAtt}`); segPen.setAttribute('stroke-dashoffset', -(pLiv + pRou)); }
    if (txtNb)  txtNb.textContent = total;

    // Légende
    const dl = document.querySelector('.donut-legend');
    if (dl) dl.innerHTML = `
        <div class="dl-item"><span class="dl-dot" style="background:#27ae60"></span> Livrées <strong>${total ? Math.round(livrees/total*100) : 0}%</strong></div>
        <div class="dl-item"><span class="dl-dot" style="background:var(--gold)"></span> En route <strong>${total ? Math.round(enRoute/total*100) : 0}%</strong></div>
        <div class="dl-item"><span class="dl-dot" style="background:#e74c3c"></span> En attente <strong>${total ? Math.round(attente/total*100) : 0}%</strong></div>
    `;
}

/* ── Dernières commandes (overview) ── */
async function loadRecentOrders() {
    const data = await api('commandes', { limite: 6 });
    if (!data.success) return;
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;

    if (!data.commandes.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Aucune commande pour l\'instant</td></tr>';
        return;
    }

    tbody.innerHTML = data.commandes.map(c => {
        const st = statusLabel(c.statut);
        return `
        <tr>
            <td><strong style="color:var(--brown)">${c.numero_commande}</strong></td>
            <td>${c.client_nom}</td>
            <td style="color:var(--text-muted);font-size:.78rem">${c.nb_articles} article(s)</td>
            <td><strong>${fmtDA(c.total_final)}</strong></td>
            <td><span class="status-badge ${st.cls}">${st.label}</span></td>
        </tr>`;
    }).join('');
}

/* ── Top produits ── */
async function loadTopProduits() {
    const data = await api('top_produits');
    if (!data.success) return;
    const list = document.getElementById('top-products-list');
    if (!list) return;

    if (!data.produits.length) {
        list.innerHTML = '<p style="padding:20px;color:#999;text-align:center;font-size:0.8rem">Aucun produit vendu pour l\'instant</p>';
        return;
    }

    const rankClass = ['gold', 'silver', 'bronze', '', ''];
    list.innerHTML = data.produits.map((p, i) => `
        <div class="tp-item">
            <div class="tp-rank ${rankClass[i] || ''}">${i + 1}</div>
            <img class="tp-img" src="${p.image ? 'uploads/products/' + p.image : 'section4.jpg'}"
                 alt="${p.nom}" onerror="this.src='section4.jpg'">
            <div class="tp-info">
                <div class="tp-name">${p.nom}</div>
                <div class="tp-sold">${p.nb_ventes} vendus</div>
            </div>
            <div class="tp-rev">${fmtDA(p.revenus)}</div>
        </div>
    `).join('');
}

/* ══════════════════════════════════
   PAGE COMMANDES
══════════════════════════════════ */
let ordersData = [];

async function loadOrders(statut = '', q = '') {
    const params = { limite: 50 };
    if (statut) params.statut = statut;
    if (q)      params.q      = q;

    const data = await api('commandes', params);
    if (!data.success) return;
    ordersData = data.commandes;
    renderOrdersTable(ordersData);
}

function renderOrdersTable(commandes) {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    if (!commandes.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#999">Aucune commande trouvée</td></tr>';
        return;
    }

    tbody.innerHTML = commandes.map(c => {
        const st = statusLabel(c.statut);
        return `
        <tr>
            <td><strong style="color:var(--brown)">${c.numero_commande}</strong></td>
            <td>${c.client_nom}<br><small style="color:#999">${c.client_tel || ''}</small></td>
            <td style="font-size:.78rem">${c.nb_articles} article(s)</td>
            <td>${c.wilaya_nom || '—'}</td>
            <td><strong>${fmtDA(c.total_final)}</strong></td>
            <td style="color:var(--text-muted)">${fmtDate(c.created_at)}</td>
            <td><span class="status-badge ${st.cls}">${st.label}</span></td>
            <td>
                <select class="sf-select" style="font-size:0.72rem;padding:4px 8px;"
                    onchange="changerStatut(${c.id}, this.value)">
                    <option value="">Changer...</option>
                    <option value="confirmee">Confirmer</option>
                    <option value="en_preparation">En préparation</option>
                    <option value="expediee">Expédier</option>
                    <option value="en_livraison">En livraison</option>
                    <option value="livree">Livrée</option>
                    <option value="annulee">Annuler</option>
                </select>
            </td>
        </tr>`;
    }).join('');
}

function filterOrders(val) { loadOrders('', val); }
function filterOrderStatus(val) { loadOrders(val, ''); }

async function changerStatut(commandeId, statut) {
    if (!statut) return;
    const res = await fetch('api/dashboard.php?action=changer_statut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commande_id: commandeId, statut })
    });
    const data = await res.json();
    if (data.success) {
        dashToast('<i class="fas fa-check"></i> Statut mis à jour !', 'ok');
        loadOrders();
    } else {
        dashToast('<i class="fas fa-x"></i> Erreur : ' + data.message, 'err');
    }
}

function exportOrders() {
    let csv = 'Numéro,Client,Articles,Wilaya,Montant,Date,Statut\n';
    ordersData.forEach(c => {
        csv += `${c.numero_commande},"${c.client_nom}",${c.nb_articles},"${c.wilaya_nom || ''}",${c.total_final},"${fmtDate(c.created_at)}","${statusLabel(c.statut).label}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'commandes_ikyo.csv'; a.click();
    dashToast('<i class="fas fa-check"></i> Export téléchargé !', 'ok');
}

/* ══════════════════════════════════
   PAGE PRODUITS
══════════════════════════════════ */
let produitsData = [];

async function loadProducts() {
    const data = await api('produits');
    if (!data.success) return;
    produitsData = data.produits;
    renderProductsGrid(produitsData);
}

function renderProductsGrid(produits) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (!produits.length) {
        grid.innerHTML = '<div style="text-align:center;padding:60px;color:#999;grid-column:1/-1"><i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:16px"></i>Aucun produit — ajoutez votre premier produit !</div>';
        return;
    }

    grid.innerHTML = produits.map((p, i) => {
        const img     = p.image ? 'uploads/products/' + p.image : 'section4.jpg';
        const stockCls = p.stock == 0 ? 'low' : p.stock <= 5 ? 'low' : '';
        const stockTxt = p.stock == 0 ? '⚠ Rupture' : p.stock + ' en stock';
        return `
        <div class="prod-dash-card" style="animation-delay:${i * 0.06}s">
            <img class="pdc-img" src="${img}" alt="${p.nom}" onerror="this.src='section4.jpg'">
            <div class="pdc-body">
                <div class="pdc-store">${p.categorie || 'Autre'}</div>
                <div class="pdc-name">${p.nom}</div>
                <div class="pdc-meta">
                    <div class="pdc-price">${fmtDA(p.prix_promo || p.prix)}</div>
                    <div class="pdc-stock ${stockCls}">${stockTxt}</div>
                </div>
                <div style="font-size:0.7rem;color:#f39c12;margin-top:4px;">${'★'.repeat(Math.round(p.note_moyenne))} (${p.nb_avis})</div>
            </div>
            <div class="pdc-actions">
                <button class="pdc-btn edit" onclick="openEditProduct(${p.id})"><i class="fas fa-pen"></i> Modifier</button>
                <button class="pdc-btn delete" onclick="supprimerProduit(${p.id},'${p.nom.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

function filterProducts(val) {
    const f = produitsData.filter(p =>
        p.nom.toLowerCase().includes(val.toLowerCase()) ||
        (p.categorie || '').toLowerCase().includes(val.toLowerCase())
    );
    renderProductsGrid(f);
}

async function supprimerProduit(id, nom) {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    const res  = await fetch('api/dashboard.php?action=supprimer_produit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produit_id: id })
    });
    const data = await res.json();
    if (data.success) {
        dashToast('<i class="fas fa-trash"></i> Produit supprimé', 'err');
        loadProducts();
    }
}

function openEditProduct(id) {
    dashToast('<i class="fas fa-pen"></i> Modification bientôt disponible', '');
}

/* ── ADD PRODUCT MODAL ── */
function openAddProduct() {
    document.getElementById('add-product-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeAddProduct() {
    document.getElementById('add-product-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

async function saveProduct() {
    const nom         = document.getElementById('np-name')?.value.trim();
    const prix        = document.getElementById('np-price')?.value;
    const stock       = document.getElementById('np-stock')?.value;
    const description = document.getElementById('np-desc')?.value.trim();
    const categorieId = document.getElementById('np-cat')?.value;

    if (!nom || !prix || !stock) {
        dashToast('<i class="fas fa-triangle-exclamation"></i> Remplissez tous les champs', 'err');
        return;
    }

    const res  = await fetch('api/produits.php?action=ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nom, prix: parseFloat(prix), stock: parseInt(stock),
            description, categorie_id: parseInt(categorieId) || 1
        })
    });
    const data = await res.json();

    if (data.success) {
        closeAddProduct();
        dashToast('<i class="fas fa-check"></i> Produit publié !', 'ok');
        loadProducts();
    } else {
        dashToast('<i class="fas fa-x"></i> ' + data.message, 'err');
    }
}

function previewImgs(input) {
    const container = document.getElementById('img-previews');
    container.innerHTML = '';
    Array.from(input.files).slice(0, 5).forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        container.appendChild(img);
    });
}

/* ══════════════════════════════════
   PAGE CLIENTS
══════════════════════════════════ */
async function loadClients() {
    const data = await api('clients');
    if (!data.success) return;
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    if (!data.clients.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#999">Aucun client pour l\'instant</td></tr>';
        return;
    }

    tbody.innerHTML = data.clients.map(c => {
        const initials   = c.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const totalDepense = parseFloat(c.total_depense);
        const statusCls  = totalDepense > 50000 ? 'var(--gold-dk)' : totalDepense > 20000 ? 'var(--green)' : 'var(--text-muted)';
        const statusLbl  = totalDepense > 50000 ? 'VIP' : totalDepense > 20000 ? 'Fidèle' : 'Client';
        return `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--brown-lt),var(--gold-lt));color:var(--brown);font-size:.72rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials}</div>
                    <strong>${c.nom}</strong>
                </div>
            </td>
            <td style="color:var(--text-muted);font-size:.78rem">${c.email}</td>
            <td>${c.wilaya || '—'}</td>
            <td><strong>${c.nb_commandes}</strong></td>
            <td><strong style="color:var(--brown)">${fmtDA(totalDepense)}</strong></td>
            <td style="color:var(--text-muted)">${fmtDate(c.dernier_achat)}</td>
            <td><span style="font-size:.72rem;font-weight:800;color:${statusCls}">${statusLbl}</span></td>
        </tr>`;
    }).join('');
}

/* ══════════════════════════════════
   PAGE AVIS
══════════════════════════════════ */
async function loadAvis() {
    const data = await api('avis');
    if (!data.success) return;

    // Stats
    const s = data.stats;
    const total = parseInt(s?.total || 0);
    const moy   = parseFloat(s?.moyenne || 0);

    const bigEl = document.querySelector('.rs-big');
    if (bigEl) bigEl.textContent = moy.toFixed(1);
    const pEl = document.querySelector('.rs-score p');
    if (pEl) pEl.textContent = `Sur ${total} avis`;

    // Barres %
    const rbs = document.querySelectorAll('.rb-fill');
    const nbs = [s?.n5, s?.n4, s?.n3, s?.n2, s?.n1];
    rbs.forEach((rb, i) => {
        const pct = total > 0 ? Math.round((nbs[i] / total) * 100) : 0;
        rb.style.width = pct + '%';
        const span = rb.closest('.rb-row')?.querySelector('span:last-child');
        if (span) span.textContent = pct + '%';
    });

    // Liste avis
    const list = document.getElementById('reviews-list');
    if (!list) return;

    if (!data.avis.length) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:#999">Aucun avis pour l\'instant</div>';
        return;
    }

    list.innerHTML = data.avis.map(a => {
        const initials = a.auteur.split(' ').map(w => w[0]).join('').toUpperCase();
        const isNew = new Date() - new Date(a.created_at) < 48 * 3600000;
        return `
        <div class="review-card">
            <div class="rc-header">
                <div class="rc-user">
                    <div class="rc-avatar">${initials}</div>
                    <div><div class="rc-name">${a.auteur}</div><div class="rc-date">${fmtDate(a.created_at)}</div></div>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                    <div class="rc-stars" style="color:#f39c12">${stars(a.note)}</div>
                    ${isNew ? '<span class="rc-badge new-badge">Nouveau</span>' : ''}
                </div>
            </div>
            <div class="rc-text">${a.commentaire || '<em style="color:#ccc">Aucun commentaire</em>'}</div>
            <div class="rc-product">Produit : <span>${a.produit_nom}</span></div>
        </div>`;
    }).join('');
}

/* ══════════════════════════════════
   PAGE ANALYTICS
══════════════════════════════════ */
async function loadAnalytics() {
    const [statsData, wilayaData] = await Promise.all([
        api('stats'),
        api('ventes_wilaya')
    ]);

    // Barres wilaya
    if (wilayaData.success && wilayaData.wilayas.length) {
        const wbars = document.getElementById('wilaya-bars');
        if (wbars) {
            const max = Math.max(...wilayaData.wilayas.map(w => parseFloat(w.total)));
            wbars.innerHTML = wilayaData.wilayas.map(w => {
                const pct = max > 0 ? Math.round((parseFloat(w.total) / max) * 100) : 0;
                return `
                <div class="wb-row">
                    <div class="wb-name">${w.wilaya}</div>
                    <div class="wb-bar"><div class="wb-fill" style="width:0%" data-target="${pct}%"></div></div>
                    <div class="wb-val">${fmtDA(w.total)}</div>
                </div>`;
            }).join('');
            setTimeout(() => {
                wbars.querySelectorAll('.wb-fill').forEach(f => f.style.width = f.dataset.target);
            }, 100);
        }
    } else {
        const wbars = document.getElementById('wilaya-bars');
        if (wbars) wbars.innerHTML = '<p style="padding:20px;color:#999;text-align:center">Aucune vente encore</p>';
    }

    // Graphique ligne
    if (statsData.success) renderLineChart(statsData.revenus_12);
}

function renderLineChart(revenus12) {
    const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const data = Array(12).fill(0);
    (revenus12 || []).forEach(r => { data[r.mois - 1] = parseFloat(r.total); });

    const linePath = document.getElementById('line-path');
    const areaPath = document.getElementById('area-path');
    const pointsG  = document.getElementById('line-points');
    const labelsG  = document.getElementById('line-labels');
    if (!linePath) return;

    const maxVal = Math.max(...data, 1);
    const w = 550, h = 130, padL = 40, padT = 20;
    const pts = data.map((v, i) => ({
        x: padL + (i / 11) * w,
        y: padT + h - (v / maxVal) * h
    }));

    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    linePath.setAttribute('d', d);
    areaPath.setAttribute('d', d + ` L${pts[pts.length-1].x},${padT + h} L${padL},${padT + h} Z`);
    pointsG.innerHTML  = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="var(--gold)" stroke="#fff" stroke-width="2"/>`).join('');
    labelsG.innerHTML  = pts.map((p, i) => `<text x="${p.x.toFixed(1)}" y="${padT + h + 16}">${MOIS[i]}</text>`).join('');
}

/* ══════════════════════════════════
   PAGE SETTINGS
══════════════════════════════════ */
async function loadProfil() {
    const data = await api('mon_profil');
    if (!data.success) return;
    const v = data.vendeur;

    const fields = {
        'set-nom-magasin': v.nom_magasin,
        'set-telephone':   v.telephone,
        'set-description': v.description,
        'set-email':       v.email,
    };
    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    });

    // Mettre à jour sidebar
    const sidebarName = document.querySelector('.sp-info strong');
    const sidebarSub  = document.querySelector('.sp-info span');
    const topbarAvatar = document.querySelector('.topbar-avatar');
    const sidebarAvatar = document.querySelector('.sp-avatar');
    if (sidebarName) sidebarName.textContent = v.nom_magasin;
    if (sidebarSub)  sidebarSub.textContent  = v.wilaya_nom || 'Algérie';
    const initials = (v.prenom[0] + v.nom[0]).toUpperCase();
    if (topbarAvatar)  topbarAvatar.textContent  = initials;
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
}

async function saveSettings() {
    const nomMagasin  = document.getElementById('set-nom-magasin')?.value.trim();
    const telephone   = document.getElementById('set-telephone')?.value.trim();
    const description = document.getElementById('set-description')?.value.trim();

    const res  = await fetch('api/dashboard.php?action=modifier_profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_magasin: nomMagasin, telephone, description })
    });
    const data = await res.json();
    if (data.success) dashToast('<i class="fas fa-check"></i> Paramètres sauvegardés', 'ok');
    else dashToast('<i class="fas fa-x"></i> ' + data.message, 'err');
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
function initDate() {
    const el = document.getElementById('page-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

document.addEventListener('DOMContentLoaded', function () {
    initDate();
    loadOverview();
    loadNotifications();

    // Rafraîchir notifications toutes les 60 secondes
    setInterval(loadNotifications, 60000);

    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.chart-period').querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Fermer notif panel en dehors
    document.addEventListener('click', function (e) {
        const panel = document.getElementById('notif-panel');
        const btn   = document.querySelector('.topbar-notif');
        if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });

    // Fermer sidebar mobile
    document.addEventListener('click', function (e) {
        const sidebar = document.getElementById('sidebar');
        const toggle  = document.getElementById('sidebar-toggle');
        if (window.innerWidth <= 860 && sidebar && toggle) {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Fermer modal produit
    document.getElementById('add-product-overlay')?.addEventListener('click', function (e) {
        if (e.target === this) closeAddProduct();
    });
});