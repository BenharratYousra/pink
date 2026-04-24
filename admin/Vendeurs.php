<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IKYO Admin — Gestion Vendeurs</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --brown:#451d18;--brown-dk:#2e110d;--brown-lt:#f5ede9;
  --green:#27ae60;--err:#e74c3c;--warn:#f39c12;
  --gray-100:#f8f9fa;--gray-200:#e9ecef;--gray-400:#adb5bd;--gray-700:#495057;
}
body{font-family:'DM Sans',sans-serif;background:#f5f5f5;min-height:100vh}

/* ── Admin Header ── */
.admin-header{
  background:linear-gradient(135deg,var(--brown-dk),var(--brown));
  padding:0 32px;display:flex;align-items:center;justify-content:space-between;
  height:64px;box-shadow:0 2px 12px rgba(0,0,0,.2);position:sticky;top:0;z-index:100
}
.admin-logo{font-family:'Playfair Display',serif;font-size:1.4rem;font-style:italic;
  letter-spacing:4px;color:#fff}
.admin-logo span{font-size:.7rem;font-family:'DM Sans',sans-serif;font-style:normal;
  color:rgba(255,255,255,.6);display:block;letter-spacing:2px}
.admin-nav a{color:rgba(255,255,255,.8);text-decoration:none;margin-left:24px;
  font-size:.85rem;font-weight:600;transition:color .2s}
.admin-nav a:hover{color:#fff}
.admin-nav a.active{color:#fff;border-bottom:2px solid #fff;padding-bottom:4px}

/* ── Main ── */
.admin-main{max-width:1100px;margin:0 auto;padding:32px 24px}

.page-title{font-family:'Playfair Display',serif;font-size:1.8rem;font-style:italic;
  color:#1a1a1a;margin-bottom:6px}
.page-sub{color:#999;font-size:.85rem;margin-bottom:28px}

/* ── Stats bar ── */
.stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.stat-card{background:#fff;border-radius:12px;padding:20px;text-align:center;
  box-shadow:0 1px 6px rgba(0,0,0,.06)}
.stat-card strong{display:block;font-size:1.8rem;font-weight:700;color:var(--brown)}
.stat-card span{font-size:.78rem;color:#999;text-transform:uppercase;letter-spacing:.5px}
.stat-card.green strong{color:var(--green)}
.stat-card.warn strong{color:var(--warn)}
.stat-card.err strong{color:var(--err)}

/* ── Filters ── */
.filter-bar{display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap}
.filter-bar input{padding:9px 14px;border:1.5px solid #e8e0de;border-radius:9px;
  font-family:'DM Sans',sans-serif;font-size:.85rem;outline:none;flex:1;min-width:200px}
.filter-bar input:focus{border-color:var(--brown)}
.filter-btn{padding:9px 18px;border:1.5px solid #e8e0de;background:#fff;
  border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.83rem;
  font-weight:700;cursor:pointer;color:#666;transition:all .2s}
.filter-btn.active,.filter-btn:hover{background:var(--brown);color:#fff;border-color:var(--brown)}

/* ── Table ── */
.table-card{background:#fff;border-radius:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);overflow:hidden}
.table-head{display:grid;grid-template-columns:1fr 1fr 120px 100px 90px 140px;
  gap:12px;padding:12px 20px;background:#faf8f6;
  font-size:.72rem;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px}
.vendor-row{display:grid;grid-template-columns:1fr 1fr 120px 100px 90px 140px;
  gap:12px;padding:16px 20px;border-top:1px solid #f5f5f5;align-items:center;
  transition:background .2s}
.vendor-row:hover{background:#fdfcfc}
.v-name strong{display:block;font-size:.9rem;color:#1a1a1a;font-weight:700}
.v-name span{font-size:.78rem;color:#999}
.v-email{font-size:.83rem;color:var(--gray-700)}
.v-date{font-size:.78rem;color:#999}
.v-wilaya{font-size:.83rem;color:#555}
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
  font-size:.72rem;font-weight:700;white-space:nowrap}
.badge-wait{background:#fff8e1;color:#f57f17}
.badge-ok{background:#e8f5e9;color:#2e7d32}
.badge-no{background:#ffebee;color:#c62828}
.badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* ── Actions ── */
.actions{display:flex;gap:6px}
.btn-accept{background:var(--green);color:#fff;border:none;padding:6px 12px;
  border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s}
.btn-accept:hover{background:#219a52}
.btn-reject{background:transparent;color:var(--err);border:1.5px solid var(--err);
  padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s}
.btn-reject:hover{background:var(--err);color:#fff}
.btn-view{background:transparent;color:var(--brown);border:1.5px solid var(--brown);
  padding:6px 10px;border-radius:8px;font-size:.78rem;cursor:pointer;transition:all .2s}
.btn-view:hover{background:var(--brown-lt)}

/* ── Empty state ── */
.empty-state{text-align:center;padding:60px 20px;color:#ccc}
.empty-state i{font-size:2.5rem;margin-bottom:12px;display:block}

/* ── Modal ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);
  display:none;align-items:center;justify-content:center;z-index:9999}
.modal-overlay.open{display:flex}
.modal-box{background:#fff;border-radius:18px;padding:36px;max-width:480px;width:90%;
  animation:fadeUp .3s ease;position:relative}
.modal-box h3{font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:16px}
.modal-close{position:absolute;top:14px;right:16px;background:none;border:none;
  font-size:1.1rem;cursor:pointer;color:#aaa}
.modal-field{margin-bottom:16px}
.modal-field label{display:block;font-size:.75rem;font-weight:700;color:#555;
  text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.modal-field input,.modal-field select,.modal-field textarea{
  width:100%;padding:10px 14px;border:1.5px solid #e8e0de;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:.88rem;outline:none}
.modal-field input:focus,.modal-field select:focus,.modal-field textarea:focus{
  border-color:var(--brown)}
.modal-actions{display:flex;gap:10px;margin-top:20px}
.btn-modal-ok{flex:1;padding:12px;background:var(--green);color:#fff;border:none;
  border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer}
.btn-modal-cancel{flex:1;padding:12px;background:#f5f5f5;color:#555;border:none;
  border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer}
.btn-modal-err{background:var(--err)}

/* ── Toast ── */
#admin-toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:600;color:#fff;
  background:#222;box-shadow:0 8px 28px rgba(0,0,0,.22);opacity:0;transform:translateY(14px);
  transition:all .28s;z-index:99999;pointer-events:none}
#admin-toast.show{opacity:1;transform:translateY(0)}
#admin-toast.ok{background:#1e7e48}
#admin-toast.err{background:var(--err)}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:768px){
  .table-head,.vendor-row{grid-template-columns:1fr 1fr}
  .v-email,.v-date,.v-wilaya{display:none}
  .stats-bar{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- HEADER -->
<header class="admin-header">
  <div class="admin-logo">IKYO <span>ADMIN PANEL</span></div>
  <nav class="admin-nav">
    <a href="vendeurs.php" class="active">Vendeurs</a>
    <a href="../index.html">Site</a>
    <a href="#" onclick="adminLogout()">Déconnexion</a>
  </nav>
</header>

<main class="admin-main">
  <h1 class="page-title">Gestion des vendeurs</h1>
  <p class="page-sub">Approuver, rejeter et gérer les comptes vendeurs</p>

  <!-- Stats -->
  <div class="stats-bar" id="stats-bar">
    <div class="stat-card warn"><strong id="s-attente">—</strong><span>En attente</span></div>
    <div class="stat-card green"><strong id="s-approuves">—</strong><span>Approuvés</span></div>
    <div class="stat-card err"><strong id="s-refuses">—</strong><span>Refusés</span></div>
    <div class="stat-card"><strong id="s-total">—</strong><span>Total</span></div>
  </div>

  <!-- Filters -->
  <div class="filter-bar">
    <input type="text" id="search-input" placeholder="Rechercher par nom, email, magasin…" oninput="filterVendors()">
    <button class="filter-btn active" onclick="setFilter('', this)">Tous</button>
    <button class="filter-btn" onclick="setFilter('en_attente', this)">En attente</button>
    <button class="filter-btn" onclick="setFilter('approuve', this)">Approuvés</button>
    <button class="filter-btn" onclick="setFilter('refuse', this)">Refusés</button>
  </div>

  <!-- Table -->
  <div class="table-card">
    <div class="table-head">
      <span>Vendeur / Magasin</span>
      <span>Email</span>
      <span>Wilaya</span>
      <span>Date</span>
      <span>Statut</span>
      <span>Actions</span>
    </div>
    <div id="vendors-list">
      <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><br>Chargement...</div>
    </div>
  </div>
</main>

<!-- MODAL ACCEPT -->
<div class="modal-overlay" id="modal-accept">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('modal-accept')">✕</button>
    <h3>✅ Approuver ce vendeur</h3>
    <p style="font-size:.85rem;color:#888;margin-bottom:20px">Un email avec les identifiants sera envoyé automatiquement.</p>
    <div class="modal-field">
      <label>Mot de passe temporaire</label>
      <input type="text" id="acc-mdp" value="" placeholder="ex: Ikyo2025!">
    </div>
    <div class="modal-field">
      <label>Nom de la boutique (confirmer)</label>
      <input type="text" id="acc-shop" placeholder="Nom magasin">
    </div>
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal('modal-accept')">Annuler</button>
      <button class="btn-modal-ok" onclick="confirmAccept()">Approuver & envoyer</button>
    </div>
  </div>
</div>

<!-- MODAL REJECT -->
<div class="modal-overlay" id="modal-reject">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('modal-reject')">✕</button>
    <h3>❌ Refuser cette demande</h3>
    <div class="modal-field">
      <label>Raison du refus (optionnel — envoyée au vendeur)</label>
      <textarea id="rej-raison" rows="3" placeholder="Ex: Documents incomplets, activité non conforme..."></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal('modal-reject')">Annuler</button>
      <button class="btn-modal-ok btn-modal-err" onclick="confirmReject()">Confirmer le refus</button>
    </div>
  </div>
</div>

<div id="admin-toast"></div>

<script>
const API = '../api/admin_vendeurs.php';
let allVendors  = [];
let currentFilter = '';
let selectedId    = null;

/* ── Load vendors ── */
async function loadVendors() {
  try {
    const res  = await fetch(API + '?action=liste');
    const data = await res.json();
    if (!data.success) { showToast('Erreur: ' + data.message, 'err'); return; }
    allVendors = data.vendeurs || [];
    updateStats();
    renderVendors();
  } catch(e) {
    document.getElementById('vendors-list').innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Impossible de charger les données.<br><small>Vérifiez que XAMPP est actif.</small></div>';
  }
}

function updateStats() {
  const byStatut = s => allVendors.filter(v => v.statut === s).length;
  document.getElementById('s-attente').textContent  = byStatut('en_attente');
  document.getElementById('s-approuves').textContent = byStatut('approuve');
  document.getElementById('s-refuses').textContent  = byStatut('refuse');
  document.getElementById('s-total').textContent    = allVendors.length;
}

function setFilter(statut, btn) {
  currentFilter = statut;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVendors();
}

function filterVendors() { renderVendors(); }

function renderVendors() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const list   = document.getElementById('vendors-list');
  let vendors  = allVendors;

  if (currentFilter) vendors = vendors.filter(v => v.statut === currentFilter);
  if (q) vendors = vendors.filter(v =>
    (v.prenom + ' ' + v.nom + ' ' + v.nom_magasin + ' ' + v.email).toLowerCase().includes(q)
  );

  if (!vendors.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><br>Aucun vendeur trouvé</div>';
    return;
  }

  list.innerHTML = vendors.map(v => `
    <div class="vendor-row">
      <div class="v-name">
        <strong><i class="fas fa-store" style="color:var(--brown);margin-right:6px;font-size:.75rem"></i>${esc(v.nom_magasin)}</strong>
        <span>${esc(v.prenom)} ${esc(v.nom)}</span>
      </div>
      <div class="v-email">${esc(v.email)}<br><small style="color:#bbb">${esc(v.telephone || '')}</small></div>
      <div class="v-wilaya">${esc(v.wilaya_nom || 'N/A')}</div>
      <div class="v-date">${formatDate(v.created_at)}</div>
      <div>${badgeHtml(v.statut)}</div>
      <div class="actions">${actionsHtml(v)}</div>
    </div>
  `).join('');
}

function badgeHtml(statut) {
  const map = {
    'en_attente': ['badge-wait', 'En attente'],
    'approuve':   ['badge-ok',   'Approuvé'],
    'refuse':     ['badge-no',   'Refusé']
  };
  const [cls, label] = map[statut] || ['', statut];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function actionsHtml(v) {
  if (v.statut === 'en_attente') return `
    <button class="btn-accept" onclick="openAccept(${v.id}, '${esc(v.nom_magasin)}')">✓ Accepter</button>
    <button class="btn-reject" onclick="openReject(${v.id})">✗</button>
  `;
  if (v.statut === 'approuve') return `
    <button class="btn-view" onclick="showToast('Vendeur connecté - ID ${v.id}')"><i class="fas fa-eye"></i></button>
    <button class="btn-reject" onclick="openReject(${v.id})" title="Suspendre">✗</button>
  `;
  return `<button class="btn-accept" onclick="openAccept(${v.id}, '${esc(v.nom_magasin)}')">Réactiver</button>`;
}

/* ── Modals ── */
function openAccept(id, shopName) {
  selectedId = id;
  const mdp = 'Ikyo' + Math.random().toString(36).slice(-6).toUpperCase() + '!';
  document.getElementById('acc-mdp').value  = mdp;
  document.getElementById('acc-shop').value = shopName;
  document.getElementById('modal-accept').classList.add('open');
}
function openReject(id) {
  selectedId = id;
  document.getElementById('rej-raison').value = '';
  document.getElementById('modal-reject').classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  selectedId = null;
}

async function confirmAccept() {
  const mdp   = document.getElementById('acc-mdp').value.trim();
  const shop  = document.getElementById('acc-shop').value.trim();
  if (!mdp) { showToast('Entrez un mot de passe', 'err'); return; }

  const btn = document.querySelector('#modal-accept .btn-modal-ok');
  btn.textContent = 'Envoi…'; btn.disabled = true;

  const res  = await fetch(API + '?action=approuver', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ vendeur_id: selectedId, mot_de_passe: mdp, nom_magasin: shop })
  });
  const data = await res.json();
  btn.textContent = 'Approuver & envoyer'; btn.disabled = false;

  if (data.success) {
    showToast('✅ Vendeur approuvé — email envoyé !', 'ok');
    closeModal('modal-accept');
    loadVendors();
  } else {
    showToast('Erreur: ' + data.message, 'err');
  }
}

async function confirmReject() {
  const raison = document.getElementById('rej-raison').value.trim();
  const btn    = document.querySelector('#modal-reject .btn-modal-ok');
  btn.textContent = 'Envoi…'; btn.disabled = true;

  const res  = await fetch(API + '?action=refuser', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ vendeur_id: selectedId, raison: raison })
  });
  const data = await res.json();
  btn.textContent = 'Confirmer le refus'; btn.disabled = false;

  if (data.success) {
    showToast('Demande refusée — email envoyé', 'ok');
    closeModal('modal-reject');
    loadVendors();
  } else {
    showToast('Erreur: ' + data.message, 'err');
  }
}

/* ── Helpers ── */
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-DZ',{day:'2-digit',month:'short',year:'numeric'}); }

let _t;
function showToast(msg, type='') {
  const t = document.getElementById('admin-toast');
  t.innerHTML = msg; t.className = 'show ' + type;
  clearTimeout(_t); _t = setTimeout(() => t.className = '', 3200);
}

function adminLogout() {
  if (!confirm('Se déconnecter ?')) return;
  fetch('../api/auth.php?action=logout', { method: 'POST' }).finally(() => {
    window.location.href = '../login.html';
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', loadVendors);
document.querySelectorAll('.modal-overlay').forEach(el =>
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); })
);
</script>
</body>
</html>