/* ================================================================
   DASHBOARD.JS — IKYO Seller Dashboard
   Charts · Tables · Filters · Modals · Toasts
================================================================ */

/* ── DATA ── */
const ORDERS_DATA = [
  { id:'IK-2847', client:'Amira B.', products:'Robe d\'été × 2', wilaya:'Oran', amount:14000, date:'09/04/2026', status:'En transit' },
  { id:'IK-2846', client:'Youssef M.', products:'Jeans slim × 1', wilaya:'Alger', amount:5500, date:'09/04/2026', status:'Livrée' },
  { id:'IK-2845', client:'Sara K.', products:'Sac cuir × 1', wilaya:'Constantine', amount:8900, date:'08/04/2026', status:'Livrée' },
  { id:'IK-2844', client:'Karim D.', products:'Chemise × 3', wilaya:'Oran', amount:9600, date:'08/04/2026', status:'En attente' },
  { id:'IK-2843', client:'Nadia H.', products:'Manteau × 1', wilaya:'Béjaïa', amount:12500, date:'07/04/2026', status:'Livrée' },
  { id:'IK-2842', client:'Omar F.', products:'Sneakers × 1', wilaya:'Tlemcen', amount:7200, date:'07/04/2026', status:'Annulée' },
  { id:'IK-2841', client:'Fatima Z.', products:'Robe × 2, Foulard × 1', wilaya:'Blida', amount:18400, date:'06/04/2026', status:'Livrée' },
  { id:'IK-2840', client:'Ahmed B.', products:'Costume × 1', wilaya:'Annaba', amount:22000, date:'06/04/2026', status:'En transit' },
  { id:'IK-2839', client:'Leila M.', products:'Hijab × 4', wilaya:'Sétif', amount:6400, date:'05/04/2026', status:'Livrée' },
  { id:'IK-2838', client:'Hani S.', products:'Pantalon × 2', wilaya:'Oran', amount:8800, date:'05/04/2026', status:'En attente' },
  { id:'IK-2837', client:'Rania T.', products:'Tunique × 1', wilaya:'Alger', amount:4900, date:'04/04/2026', status:'Livrée' },
  { id:'IK-2836', client:'Walid C.', products:'Polo × 2', wilaya:'Mostaganem', amount:5600, date:'04/04/2026', status:'Livrée' },
];

const PRODUCTS_DATA = [
  { name:'Robe d\'été fleurie', cat:'Mode Femme', price:7000, stock:24, sold:88, img:'section4.jpg', status:'active' },
  { name:'Jeans slim moderne', cat:'Mode Homme', price:5500, stock:3, sold:145, img:'section5.jpg', status:'active' },
  { name:'Sac cuir artisanal', cat:'Accessoires', price:8900, stock:12, sold:62, img:'section6.jpg', status:'active' },
  { name:'Manteau d\'hiver', cat:'Mode Femme', price:12500, stock:8, sold:41, img:'section7.jpg', status:'active' },
  { name:'Chemise à rayures', cat:'Mode Homme', price:3200, stock:0, sold:210, img:'section4.jpg', status:'sold_out' },
  { name:'Sneakers casual', cat:'Chaussures', price:7200, stock:18, sold:79, img:'section5.jpg', status:'active' },
  { name:'Hijab premium', cat:'Accessoires', price:1600, stock:50, sold:320, img:'section6.jpg', status:'active' },
  { name:'Costume formel', cat:'Mode Homme', price:22000, stock:5, sold:28, img:'section7.jpg', status:'active' },
];

const CUSTOMERS_DATA = [
  { name:'Amira Boumediene', email:'amira@email.com', wilaya:'Oran', orders:7, total:58000, last:'09/04/2026', status:'VIP' },
  { name:'Youssef Mansouri', email:'youssef@email.com', wilaya:'Alger', orders:4, total:32000, last:'09/04/2026', status:'Actif' },
  { name:'Sara Keddari', email:'sara@email.com', wilaya:'Constantine', orders:2, total:18000, last:'08/04/2026', status:'Actif' },
  { name:'Karim Djahnine', email:'karim@email.com', wilaya:'Oran', orders:9, total:74500, last:'08/04/2026', status:'VIP' },
  { name:'Nadia Hadj', email:'nadia@email.com', wilaya:'Béjaïa', orders:3, total:28000, last:'07/04/2026', status:'Actif' },
  { name:'Omar Ferhat', email:'omar@email.com', wilaya:'Tlemcen', orders:1, total:7200, last:'07/04/2026', status:'Inactif' },
  { name:'Fatima Zahra', email:'fatima@email.com', wilaya:'Blida', orders:12, total:124000, last:'06/04/2026', status:'VIP' },
  { name:'Ahmed Benali', email:'ahmed@email.com', wilaya:'Annaba', orders:5, total:66000, last:'06/04/2026', status:'Actif' },
];

const REVIEWS_DATA = [
  { user:'Amira B.', rating:5, text:'Boutique excellente ! Les vêtements sont de très bonne qualité et la livraison était ultra rapide. Je recommande vivement.', product:'Robe d\'été fleurie', date:'09/04/2026', isNew:true },
  { user:'Karim D.', rating:4, text:'Bonne qualité globalement, la chemise est exactement comme sur la photo. Juste un peu de retard pour la livraison.', product:'Chemise à rayures', date:'08/04/2026', isNew:true },
  { user:'Sara K.', rating:5, text:'Le sac en cuir est magnifique, très bien fini. Exactement comme décrit. Merci IKYO !', product:'Sac cuir artisanal', date:'07/04/2026', isNew:true },
  { user:'Nadia H.', rating:5, text:'Très satisfaite de mon achat, le manteau est chaud et élégant. Service client réactif.', product:'Manteau d\'hiver', date:'06/04/2026', isNew:false },
  { user:'Walid C.', rating:4, text:'Le polo est de bonne qualité, tissu agréable. Taille conforme au guide.', product:'Polo × 2', date:'04/04/2026', isNew:false },
  { user:'Leila M.', rating:5, text:'Hijab de qualité, tissu doux. Couleurs exactes. Je reviendrai.', product:'Hijab premium', date:'03/04/2026', isNew:false },
];

const REVENUE_DATA = [18500,22000,19800,31000,28500,35200,42000,38000,44500,52000,49000,62000];
const MONTHS      = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const WILAYA_DATA = [
  { name:'Oran',       val:42000, pct:82 },
  { name:'Alger',      val:38000, pct:74 },
  { name:'Constantine',val:24000, pct:47 },
  { name:'Annaba',     val:18000, pct:35 },
  { name:'Blida',      val:14500, pct:28 },
  { name:'Béjaïa',     val:12000, pct:23 },
  { name:'Sétif',      val:9500,  pct:18 },
  { name:'Tlemcen',    val:7200,  pct:14 },
];

/* ── Helpers ── */
function fmtDA(n){ return Number(n).toLocaleString('fr-DZ') + ' DA'; }
function statusClass(s){
  if(s==='Livrée')    return 'delivered';
  if(s==='En transit')return 'transit';
  if(s==='En attente')return 'pending';
  if(s==='Annulée')   return 'cancelled';
  return '';
}
function stars(n){
  return Array.from({length:5},(_,i)=>`<i class="fa${i<n?'s':'r'} fa-star" style="font-size:.7rem;color:#f39c12"></i>`).join('');
}

let _toastT;
function dashToast(msg, type=''){
  const t = document.getElementById('dash-toast');
  t.innerHTML = msg;
  t.className = 'show ' + type;
  clearTimeout(_toastT);
  _toastT = setTimeout(()=>t.className='', 3000);
}

/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
function dashPage(id, el){
  event && event.preventDefault && event.preventDefault();
  // Hide all pages
  document.querySelectorAll('.dash-page').forEach(p => p.classList.remove('active'));
  // Show target
  const page = document.getElementById('page-' + id);
  if(page) page.classList.add('active');
  // Nav highlight
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = el || document.querySelector('[data-page="' + id + '"]');
  if(navEl) navEl.classList.add('active');
  // Update title
  const titles = { overview:'Vue d\'ensemble', orders:'Commandes', products:'Produits', analytics:'Analytiques', customers:'Clients', reviews:'Avis Clients', settings:'Paramètres' };
  document.getElementById('page-title').textContent = titles[id] || id;
  // Close sidebar on mobile
  if(window.innerWidth <= 860) document.getElementById('sidebar').classList.remove('open');
  // Init page-specific content
  if(id === 'analytics') initAnalytics();
}

/* ══════════════════════════════════
   SIDEBAR MOBILE
══════════════════════════════════ */
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}

/* ══════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════ */
function toggleNotif(){
  document.getElementById('notif-panel').classList.toggle('open');
}
function markAllRead(){
  document.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
  document.querySelector('.notif-dot').style.display = 'none';
  document.getElementById('notif-panel').classList.remove('open');
  dashToast('<i class="fas fa-check"></i> Toutes les notifications lues', 'ok');
}
document.addEventListener('click', function(e){
  const panel = document.getElementById('notif-panel');
  const btn = document.querySelector('.topbar-notif');
  if(panel && btn && !panel.contains(e.target) && !btn.contains(e.target)){
    panel.classList.remove('open');
  }
});

/* ══════════════════════════════════
   REVENUE BAR CHART
══════════════════════════════════ */
function renderRevenueChart(){
  const chart  = document.getElementById('revenue-chart');
  const labels = document.getElementById('revenue-labels');
  if(!chart) return;
  const max = Math.max(...REVENUE_DATA);
  const currentMonth = 3; // April index

  chart.innerHTML = REVENUE_DATA.map((val, i) => `
    <div class="bar-col">
      <div class="bar-tooltip">${fmtDA(val)}</div>
      <div class="bar-fill ${i===currentMonth?'current-month':''}" style="height:0%" data-target="${(val/max)*100}"></div>
    </div>
  `).join('');

  labels.innerHTML = MONTHS.map(m => `<div class="bar-label">${m}</div>`).join('');

  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      chart.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.transition = 'height 1.2s cubic-bezier(0.25,0.46,0.45,0.94)';
        bar.style.height = bar.dataset.target + '%';
      });
    });
  });
}

/* ══════════════════════════════════
   KPI COUNTERS
══════════════════════════════════ */
function animateKPIs(){
  document.querySelectorAll('.kpi-value').forEach(el => {
    const target = parseFloat(el.dataset.target);
    if(isNaN(target)) return;
    const isCurrency = target > 100;
    const isDecimal  = String(target).includes('.');
    let start = null;
    const duration = 1400;
    function step(ts){
      if(!start) start = ts;
      const progress = Math.min((ts - start)/duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = ease * target;
      if(isDecimal)      el.textContent = val.toFixed(1);
      else if(isCurrency) el.textContent = Math.floor(val).toLocaleString('fr-DZ') + ' DA';
      else                el.textContent = Math.floor(val);
      if(progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ══════════════════════════════════
   RECENT ORDERS TABLE (overview)
══════════════════════════════════ */
function renderRecentOrders(){
  const tbody = document.getElementById('recent-orders-tbody');
  if(!tbody) return;
  tbody.innerHTML = ORDERS_DATA.slice(0,6).map(o => `
    <tr>
      <td><strong style="color:var(--brown)">${o.id}</strong></td>
      <td>${o.client}</td>
      <td style="color:var(--text-muted);font-size:.78rem">${o.products}</td>
      <td><strong>${fmtDA(o.amount)}</strong></td>
      <td><span class="status-badge ${statusClass(o.status)}">${o.status}</span></td>
    </tr>
  `).join('');
}

/* ══════════════════════════════════
   TOP PRODUCTS LIST
══════════════════════════════════ */
function renderTopProducts(){
  const list = document.getElementById('top-products-list');
  if(!list) return;
  const sorted = [...PRODUCTS_DATA].sort((a,b)=>b.sold-a.sold).slice(0,5);
  const rankClass = ['gold','silver','bronze','',''];
  list.innerHTML = sorted.map((p,i) => `
    <div class="tp-item">
      <div class="tp-rank ${rankClass[i]}">${i+1}</div>
      <img class="tp-img" src="${p.img}" alt="${p.name}" onerror="this.src='section4.jpg'">
      <div class="tp-info">
        <div class="tp-name">${p.name}</div>
        <div class="tp-sold">${p.sold} vendus</div>
      </div>
      <div class="tp-rev">${fmtDA(p.price * p.sold)}</div>
    </div>
  `).join('');
}

/* ══════════════════════════════════
   FULL ORDERS TABLE
══════════════════════════════════ */
let ordersFilter = { text: '', status: '' };

function renderOrdersTable(data = ORDERS_DATA){
  const tbody = document.getElementById('orders-tbody');
  if(!tbody) return;
  const filtered = data.filter(o => {
    const matchText   = o.id.includes(ordersFilter.text.toUpperCase()) || o.client.toLowerCase().includes(ordersFilter.text.toLowerCase());
    const matchStatus = !ordersFilter.status || o.status === ordersFilter.status;
    return matchText && matchStatus;
  });
  tbody.innerHTML = filtered.length ? filtered.map(o => `
    <tr>
      <td><strong style="color:var(--brown)">${o.id}</strong></td>
      <td>${o.client}</td>
      <td style="font-size:.78rem">${o.products}</td>
      <td>${o.wilaya}</td>
      <td><strong>${fmtDA(o.amount)}</strong></td>
      <td style="color:var(--text-muted)">${o.date}</td>
      <td><span class="status-badge ${statusClass(o.status)}">${o.status}</span></td>
      <td>
        <button class="tbl-action" onclick="viewOrder('${o.id}')"><i class="fas fa-eye"></i></button>
        <button class="tbl-action" onclick="updateStatus('${o.id}')"><i class="fas fa-truck"></i></button>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">Aucune commande trouvée</td></tr>`;
}

function filterOrders(val){ ordersFilter.text = val; renderOrdersTable(); }
function filterOrderStatus(val){ ordersFilter.status = val; renderOrdersTable(); }
function viewOrder(id){ dashToast(`<i class="fas fa-eye"></i> Commande ${id}`, ''); }
function updateStatus(id){ dashToast(`<i class="fas fa-truck"></i> Statut de ${id} mis à jour`, 'ok'); }
function exportOrders(){
  dashToast('<i class="fas fa-download"></i> Export Excel en cours...', 'ok');
  setTimeout(()=> dashToast('<i class="fas fa-check"></i> Fichier téléchargé !', 'ok'), 1500);
}

/* ══════════════════════════════════
   PRODUCTS GRID
══════════════════════════════════ */
function renderProductsGrid(data = PRODUCTS_DATA){
  const grid = document.getElementById('products-grid');
  if(!grid) return;
  grid.innerHTML = data.map((p, i) => `
    <div class="prod-dash-card" style="animation-delay:${i*0.07}s">
      <img class="pdc-img" src="${p.img}" alt="${p.name}" onerror="this.src='section4.jpg'">
      <div class="pdc-body">
        <div class="pdc-store">${p.cat}</div>
        <div class="pdc-name">${p.name}</div>
        <div class="pdc-meta">
          <div class="pdc-price">${fmtDA(p.price)}</div>
          <div class="pdc-stock ${p.stock <= 5 ? 'low' : ''}">${p.stock === 0 ? '⚠ Rupture' : p.stock + ' en stock'}</div>
        </div>
      </div>
      <div class="pdc-actions">
        <button class="pdc-btn edit" onclick="editProduct(${i})"><i class="fas fa-pen"></i> Modifier</button>
        <button class="pdc-btn delete" onclick="deleteProduct(${i})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function filterProducts(val){
  const filtered = PRODUCTS_DATA.filter(p => p.name.toLowerCase().includes(val.toLowerCase()) || p.cat.toLowerCase().includes(val.toLowerCase()));
  renderProductsGrid(filtered);
}
function editProduct(i){ dashToast(`<i class="fas fa-pen"></i> Modification de "${PRODUCTS_DATA[i].name}"`, ''); }
function deleteProduct(i){
  if(confirm(`Supprimer "${PRODUCTS_DATA[i].name}" ?`)){
    PRODUCTS_DATA.splice(i, 1);
    renderProductsGrid();
    dashToast('<i class="fas fa-trash"></i> Produit supprimé', 'err');
  }
}

/* ══════════════════════════════════
   ADD PRODUCT MODAL
══════════════════════════════════ */
function openAddProduct(){
  document.getElementById('add-product-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAddProduct(){
  document.getElementById('add-product-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function saveProduct(){
  const name = document.getElementById('np-name')?.value.trim();
  const price = document.getElementById('np-price')?.value;
  const stock = document.getElementById('np-stock')?.value;
  if(!name || !price || !stock){
    dashToast('<i class="fas fa-triangle-exclamation"></i> Remplissez tous les champs obligatoires', 'err');
    return;
  }
  PRODUCTS_DATA.unshift({
    name, price: parseInt(price), stock: parseInt(stock),
    cat: document.getElementById('np-cat')?.value || 'Autre',
    sold: 0, img: 'section4.jpg', status: document.getElementById('np-status')?.value || 'active'
  });
  closeAddProduct();
  renderProductsGrid();
  dashToast('<i class="fas fa-check"></i> Produit publié avec succès !', 'ok');
}
function previewImgs(input){
  const container = document.getElementById('img-previews');
  container.innerHTML = '';
  Array.from(input.files).slice(0,5).forEach(file => {
    const url = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.src = url;
    container.appendChild(img);
  });
}
document.addEventListener('click', function(e){
  const overlay = document.getElementById('add-product-overlay');
  if(e.target === overlay) closeAddProduct();
});

/* ══════════════════════════════════
   CUSTOMERS TABLE
══════════════════════════════════ */
function renderCustomersTable(){
  const tbody = document.getElementById('customers-tbody');
  if(!tbody) return;
  tbody.innerHTML = CUSTOMERS_DATA.map(c => {
    const initials = c.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const statusColor = c.status==='VIP'?'var(--gold-dk)':c.status==='Actif'?'var(--green)':'var(--text-muted)';
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--brown-lt),var(--gold-lt));color:var(--brown);font-size:.72rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initials}</div>
            <strong>${c.name}</strong>
          </div>
        </td>
        <td style="color:var(--text-muted);font-size:.78rem">${c.email}</td>
        <td>${c.wilaya}</td>
        <td><strong>${c.orders}</strong></td>
        <td><strong style="color:var(--brown)">${fmtDA(c.total)}</strong></td>
        <td style="color:var(--text-muted)">${c.last}</td>
        <td><span style="font-size:.72rem;font-weight:800;color:${statusColor}">${c.status}</span></td>
      </tr>
    `;
  }).join('');
}

/* ══════════════════════════════════
   REVIEWS
══════════════════════════════════ */
function renderReviews(){
  const list = document.getElementById('reviews-list');
  if(!list) return;
  list.innerHTML = REVIEWS_DATA.map(r => {
    const initials = r.user.split(' ').map(w=>w[0]).join('').toUpperCase();
    return `
      <div class="review-card">
        <div class="rc-header">
          <div class="rc-user">
            <div class="rc-avatar">${initials}</div>
            <div><div class="rc-name">${r.user}</div><div class="rc-date">${r.date}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="rc-stars">${stars(r.rating)}</div>
            ${r.isNew ? '<span class="rc-badge new-badge">Nouveau</span>' : ''}
          </div>
        </div>
        <div class="rc-text">${r.text}</div>
        <div class="rc-product">Produit : <span>${r.product}</span></div>
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════
   ANALYTICS PAGE
══════════════════════════════════ */
function initAnalytics(){
  // Wilaya bars
  const wbars = document.getElementById('wilaya-bars');
  if(wbars && !wbars._rendered){
    wbars._rendered = true;
    wbars.innerHTML = WILAYA_DATA.map(w => `
      <div class="wb-row">
        <div class="wb-name">${w.name}</div>
        <div class="wb-bar"><div class="wb-fill" style="width:0%" data-target="${w.pct}%"></div></div>
        <div class="wb-val">${fmtDA(w.val)}</div>
      </div>
    `).join('');
    setTimeout(() => {
      wbars.querySelectorAll('.wb-fill').forEach(f => {
        f.style.width = f.dataset.target;
      });
    }, 100);
  }

  // Line chart
  renderLineChart();
}

function renderLineChart(){
  const linePath  = document.getElementById('line-path');
  const areaPath  = document.getElementById('area-path');
  const points    = document.getElementById('line-points');
  const labelsG   = document.getElementById('line-labels');
  if(!linePath) return;

  const maxVal = Math.max(...REVENUE_DATA);
  const w = 550, h = 130, padL = 40, padT = 20;
  const pts = REVENUE_DATA.map((v, i) => ({
    x: padL + (i / 11) * w,
    y: padT + h - (v / maxVal) * h
  }));

  const d = pts.map((p,i) => (i===0?'M':'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  linePath.setAttribute('d', d);
  areaPath.setAttribute('d', d + ' L' + pts[pts.length-1].x + ',' + (padT+h) + ' L' + padL + ',' + (padT+h) + ' Z');

  points.innerHTML = pts.map((p,i) => `
    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="var(--gold)" stroke="#fff" stroke-width="2"/>
  `).join('');
  labelsG.innerHTML = pts.map((p,i) => `
    <text x="${p.x.toFixed(1)}" y="${padT + h + 16}">${MONTHS[i]}</text>
  `).join('');
}

/* ══════════════════════════════════
   SETTINGS
══════════════════════════════════ */
function saveSettings(){
  dashToast('<i class="fas fa-check"></i> Paramètres sauvegardés', 'ok');
}

/* ══════════════════════════════════
   INIT DATE
══════════════════════════════════ */
function initDate(){
  const el = document.getElementById('page-date');
  if(!el) return;
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  el.textContent = new Date().toLocaleDateString('fr-FR', opts);
}

/* ══════════════════════════════════
   SCROLL REVEAL (dashboard)
══════════════════════════════════ */
function initDashReveal(){
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ══════════════════════════════════
   DOMContentLoaded
══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function(){
  initDate();
  renderRevenueChart();
  animateKPIs();
  renderRecentOrders();
  renderTopProducts();
  renderOrdersTable();
  renderProductsGrid();
  renderCustomersTable();
  renderReviews();
  initDashReveal();

  // Period buttons
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function(){
      this.closest('.chart-period').querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Close overlay on outside click
  document.addEventListener('click', function(e){
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.getElementById('sidebar-toggle');
    if(window.innerWidth <= 860 && sidebar && toggle){
      if(!sidebar.contains(e.target) && !toggle.contains(e.target)){
        sidebar.classList.remove('open');
      }
    }
  });
});