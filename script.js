
/* ===== PAGE NAVIGATION ===== */
function showPage(page, e) {
    if (e) e.preventDefault();
    ['home', 'categories', 'shop', 'support', 'recherche'].forEach(function (p) {
        document.getElementById(p + '-page').style.display = 'none';
    });
    document.getElementById(page + '-page').style.display = 'block';
    window.scrollTo(0, 0);
}

/* ===== SHOP FILTER ===== */
function filterShop(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    document.querySelectorAll('.prod-card').forEach(function (card) {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'block' : 'none';
    });
}

/* ===== FAQ ACCORDION ===== */
function toggleFaq(el) {
    el.classList.toggle('open');
    el.nextElementSibling.classList.toggle('open');
}

/* =====================================================
   PARTNER FORM MODAL
===================================================== */
var pCurrentStep = 1;

function openPartnerForm() {
    document.getElementById('partner-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePartnerForm() {
    document.getElementById('partner-overlay').classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(pResetForm, 300);
}

function pResetForm() {
    pCurrentStep = 1;
    pGoStep(1, true);
    document.getElementById('p-success-screen').classList.remove('show');
    document.getElementById('p-form-body').style.display = 'block';
    document.getElementById('p-steps-bar').style.display = 'flex';
    document.querySelectorAll('#p-main-modal input:not([type=file]), #p-main-modal select, #p-main-modal textarea')
        .forEach(function (el) {
            el.value = el.tagName === 'SELECT' ? (el.options[0] ? el.options[0].value : '') : '';
        });
    document.getElementById('pf-count').textContent = '';
    document.querySelectorAll('.p-err').forEach(function (e) { e.style.display = 'none'; });
    var btn = document.getElementById('p-submit-btn');
    btn.disabled = false;
    btn.innerHTML = 'Envoyer la demande &nbsp;<i class="fas fa-paper-plane"></i>';
}

function pGoStep(n, silent) {
    if (!silent && !pValidateStep(pCurrentStep)) return;
    pCurrentStep = n;
    document.querySelectorAll('.p-step-page').forEach(function (p, i) {
        p.classList.toggle('active', i + 1 === n);
    });
    [1, 2, 3].forEach(function (i) {
        var dot = document.getElementById('pdot' + i);
        dot.className = 'p-dot';
        if (i < n) dot.classList.add('done');
        else if (i === n) dot.classList.add('active');
    });
    [1, 2].forEach(function (i) {
        var line = document.getElementById('pline' + i);
        line.className = 'p-line';
        if (i < n) line.classList.add('done');
    });
    document.getElementById('p-main-modal').scrollTop = 0;
}

function pValidateStep(step) {
    var ok = true;
    function pReq(id, errId) {
        var val = document.getElementById(id).value.trim();
        var err = document.getElementById(errId);
        if (!val) { err.style.display = 'block'; ok = false; }
        else       { err.style.display = 'none'; }
    }
    if (step === 1) {
        pReq('p-prenom', 'perr-prenom');
        pReq('p-nom', 'perr-nom');
        pReq('p-tel', 'perr-tel');
        pReq('p-wilaya', 'perr-wilaya');
        var email = document.getElementById('p-email').value.trim();
        var errEmail = document.getElementById('perr-email');
        if (!email || !email.includes('@') || !email.includes('.')) {
            errEmail.style.display = 'block'; ok = false;
        } else {
            errEmail.style.display = 'none';
        }
    }
    if (step === 2) {
        pReq('p-magasin', 'perr-magasin');
        pReq('p-categorie', 'perr-categorie');
        pReq('p-adresse', 'perr-adresse');
    }
    return ok;
}

function pCountFiles(input) {
    var n = input.files.length;
    var el = document.getElementById('pf-count');
    if (n > 10) {
        el.textContent = '⚠ Maximum 10 photos autorisées.';
        el.style.color = '#c0392b';
    } else {
        el.textContent = n + ' photo(s) sélectionnée(s) ✔';
        el.style.color = '#451d18';
    }
}

function pSubmitForm() {
    if (!pValidateStep(3)) return;
    var btn = document.getElementById('p-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> &nbsp;Envoi en cours...';
    setTimeout(function () {
        document.getElementById('p-form-body').style.display = 'none';
        document.getElementById('p-steps-bar').style.display = 'none';
        document.getElementById('p-success-screen').classList.add('show');
    }, 1500);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function () {
    /* Close partner modal on overlay click */
    document.getElementById('partner-overlay').addEventListener('click', function (e) {
        if (e.target === this) closePartnerForm();
    });
    
});
// Scroll vers promos
function scrollToPromos(e) {
    if (e) e.preventDefault();
    showPage('home', e);
    setTimeout(function() {
        document.getElementById('promos-section').scrollIntoView({behavior:'smooth'});
    }, 100);
}


/* ── Variables globales recherche ── */
var rchGenre   = '';
var rchCouleur = '';
var rchTaille  = '';
var rchNote    = 0;
var rchPage    = 1;

/* ── Setters filtres ── */
function setGenre(v, btn) {
    rchGenre = v;
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function setCouleur(v, btn) {
    rchCouleur = v;
    document.querySelectorAll('.clr-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function setTaille(v, btn) {
    rchTaille = v;
    document.querySelectorAll('.taille-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function setNote(v, btn) {
    rchNote = v;
    document.querySelectorAll('.note-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function setPrix(min, max) {
    document.getElementById('rch-prix-min').value = min || '';
    document.getElementById('rch-prix-max').value = max || '';
}

/* ── Reset tous les filtres ── */
function resetFiltres() {
    document.getElementById('rch-q').value = '';
    document.getElementById('rch-wilaya').value = '';
    document.getElementById('rch-categorie').value = '';
    document.getElementById('rch-prix-min').value = '';
    document.getElementById('rch-prix-max').value = '';
    document.getElementById('rch-promo').checked = false;
    document.getElementById('rch-stock').checked = false;
    document.getElementById('rch-tri').value = 'pertinence';
    rchGenre = ''; rchCouleur = ''; rchTaille = ''; rchNote = 0; rchPage = 1;
    document.querySelectorAll('.genre-btn, .taille-btn, .note-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.genre-btn, .taille-btn, .note-btn').forEach((b,i) => { if(i===0||b.textContent==='Tous'||b.textContent==='Toutes') b.classList.add('active'); });
    document.querySelectorAll('.clr-btn')[0].classList.add('active');
    document.getElementById('rch-grid').innerHTML = '';
    document.getElementById('rch-count').textContent = '';
    document.getElementById('rch-tags').innerHTML = '';
    document.getElementById('rch-vide').style.display = 'none';
    document.getElementById('rch-pagination').innerHTML = '';
}

/* ── Lancer la recherche ── */
async function lancerRecherche(page) {
    if (page) rchPage = page;
    else rchPage = 1;

    const q         = document.getElementById('rch-q').value.trim();
    const wilaya    = document.getElementById('rch-wilaya').value;
    const categorie = document.getElementById('rch-categorie').value;
    const prixMin   = document.getElementById('rch-prix-min').value;
    const prixMax   = document.getElementById('rch-prix-max').value;
    const promo     = document.getElementById('rch-promo').checked;
    const stock     = document.getElementById('rch-stock').checked;
    const tri       = document.getElementById('rch-tri').value;

    /* Construire URL */
    let url = 'api/recherche.php?page=' + rchPage;
    if (q)         url += '&q='         + encodeURIComponent(q);
    if (wilaya)    url += '&wilaya='    + wilaya;
    if (categorie) url += '&categorie=' + categorie;
    if (prixMin)   url += '&prix_min='  + prixMin;
    if (prixMax)   url += '&prix_max='  + prixMax;
    if (rchGenre)  url += '&genre='     + rchGenre;
    if (rchCouleur)url += '&couleur='   + encodeURIComponent(rchCouleur);
    if (rchTaille) url += '&taille='    + rchTaille;
    if (rchNote)   url += '&note_min='  + rchNote;
    if (promo)     url += '&promo=1';
    if (stock)     url += '&stock=1';
    url += '&tri=' + tri;

    /* Afficher loading */
    document.getElementById('rch-loading').style.display = 'block';
    document.getElementById('rch-grid').innerHTML = '';
    document.getElementById('rch-vide').style.display = 'none';
    document.getElementById('rch-pagination').innerHTML = '';

    try {
        const res  = await fetch(url);
        const data = await res.json();

        document.getElementById('rch-loading').style.display = 'none';

        if (!data.success || data.produits.length === 0) {
            document.getElementById('rch-vide').style.display = 'block';
            document.getElementById('rch-count').textContent = '0 résultat trouvé';
            afficherTags(q, wilaya, categorie, prixMin, prixMax);
            return;
        }

        /* Résultats */
        document.getElementById('rch-count').textContent =
            data.pagination.total + ' résultat(s) trouvé(s)';

        afficherTags(q, wilaya, categorie, prixMin, prixMax);
        afficherProduits(data.produits);
        afficherPagination(data.pagination);

    } catch (e) {
        document.getElementById('rch-loading').style.display = 'none';
        document.getElementById('rch-count').textContent = '⚠ Erreur serveur — vérifiez XAMPP';
    }
}

/* ── Afficher les produits ── */
function afficherProduits(produits) {
    const grid = document.getElementById('rch-grid');
    grid.innerHTML = produits.map(p => {
        const etoiles = '★'.repeat(Math.round(p.note_moyenne || 0)) + '☆'.repeat(5 - Math.round(p.note_moyenne || 0));
        const prixAff = p.prix_promo
            ? `<span class="prix-new">${Number(p.prix_promo).toLocaleString()} DA</span>
               <span class="prix-old">${Number(p.prix).toLocaleString()} DA</span>
               <span class="remise">-${p.remise_pct}%</span>`
            : `<span class="prix-new">${Number(p.prix).toLocaleString()} DA</span>`;

        const img = p.image_url || 'section4.jpg';

        return `
        <div class="rch-card">
            <div style="position:relative;overflow:hidden;">
                <img src="${img}" alt="${p.nom}" onerror="this.src='section4.jpg'">
                ${p.prix_promo ? `<span style="position:absolute;top:10px;left:10px;background:#c0392b;color:white;font-size:0.68rem;font-weight:800;padding:3px 8px;border-radius:10px;">-${p.remise_pct}%</span>` : ''}
                ${p.stock === 0 ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="background:white;color:#333;padding:6px 14px;border-radius:20px;font-weight:800;font-size:0.8rem;">Rupture de stock</span></div>` : ''}
            </div>
            <div class="rch-card-info">
                <span class="store-nm">${p.nom_magasin || ''}</span>
                <h4>${p.nom}</h4>
                <div class="stars">${etoiles} <span style="color:#999;">(${p.nb_avis || 0})</span></div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${prixAff}</div>
                ${p.wilaya_nom ? `<div style="font-size:0.72rem;color:#888;margin-top:4px;"><i class="fas fa-location-dot"></i> ${p.wilaya_nom}</div>` : ''}
                <div style="display:flex;gap:6px;margin-top:10px;">
                    <button onclick="ajouterPanierRch(${p.id},'${p.nom}')"
                        style="flex:1;background:#451d18;color:white;border:none;padding:8px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;">
                        <i class="fas fa-cart-plus"></i> Panier
                    </button>
                    <button onclick="toggleFavoriRch(${p.id})"
                        style="background:#f5ede9;color:#451d18;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ── Tags filtres actifs ── */
function afficherTags(q, wilaya, categorie, prixMin, prixMax) {
    const tags = document.getElementById('rch-tags');
    let html = '';
    if (q)         html += `<span class="rch-tag">"${q}" <button onclick="document.getElementById('rch-q').value='';lancerRecherche()">✕</button></span>`;
    if (wilaya)    html += `<span class="rch-tag">Wilaya <button onclick="document.getElementById('rch-wilaya').value='';lancerRecherche()">✕</button></span>`;
    if (categorie) html += `<span class="rch-tag">Catégorie <button onclick="document.getElementById('rch-categorie').value='';lancerRecherche()">✕</button></span>`;
    if (prixMin)   html += `<span class="rch-tag">Min: ${prixMin} DA <button onclick="document.getElementById('rch-prix-min').value='';lancerRecherche()">✕</button></span>`;
    if (prixMax)   html += `<span class="rch-tag">Max: ${prixMax} DA <button onclick="document.getElementById('rch-prix-max').value='';lancerRecherche()">✕</button></span>`;
    if (rchGenre)  html += `<span class="rch-tag">${rchGenre} <button onclick="setGenre('',document.querySelector('.genre-btn'));lancerRecherche()">✕</button></span>`;
    if (rchCouleur)html += `<span class="rch-tag">${rchCouleur} <button onclick="setCouleur('',document.querySelector('.clr-btn'));lancerRecherche()">✕</button></span>`;
    if (rchTaille) html += `<span class="rch-tag">Taille ${rchTaille} <button onclick="setTaille('',document.querySelector('.taille-btn'));lancerRecherche()">✕</button></span>`;
    tags.innerHTML = html;
}

/* ── Pagination ── */
function afficherPagination(pag) {
    if (pag.nb_pages <= 1) return;
    const div = document.getElementById('rch-pagination');
    let html = '';
    for (let i = 1; i <= pag.nb_pages; i++) {
        html += `<button class="pag-btn ${i === pag.page ? 'active' : ''}" onclick="lancerRecherche(${i})">${i}</button>`;
    }
    div.innerHTML = html;
}

/* ── Ajouter au panier depuis recherche ── */
async function ajouterPanierRch(produitId, nom) {
    try {
        const res  = await fetch('api/panier.php?action=ajouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produit_id: produitId, quantite: 1 })
        });
        const data = await res.json();
        if (data.success) {
            alert('"' + nom + '" ajouté au panier !');
        } else {
            alert(data.message);
        }
    } catch(e) {
        alert('Connectez-vous pour ajouter au panier');
    }
}

/* ── Favoris depuis recherche ── */
async function toggleFavoriRch(produitId) {
    try {
        const res  = await fetch('api/panier.php?action=toggle_favori', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produit_id: produitId })
        });
        const data = await res.json();
        alert(data.message);
    } catch(e) {
        alert('Connectez-vous pour ajouter aux favoris');
    }
}

/* ── Lancer recherche automatiquement quand on ouvre la page ── */
document.addEventListener('DOMContentLoaded', function() {
    /* Si l'utilisateur clique sur Recherche dans le menu */
});
