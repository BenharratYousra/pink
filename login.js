/* ================================================================
   LOGIN.JS — IKYO Shop — Connecté au backend PHP
================================================================ */

function switchRole(role) {
    const isClient = role === 'client';
    document.getElementById('form-client').style.display = isClient ? 'block' : 'none';
    document.getElementById('form-seller').style.display = isClient ? 'none'  : 'block';
    document.getElementById('pill-client').classList.toggle('active', isClient);
    document.getElementById('pill-client').classList.toggle('seller-active', false);
    document.getElementById('pill-seller').classList.toggle('active', false);
    document.getElementById('pill-seller').classList.toggle('seller-active', !isClient);
}

function switchTab(role, tab) {
    const tabPrefix = role === 'client' ? 'ctab' : 'stab';
    document.getElementById(role + '-login').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById(role + '-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById(tabPrefix + '-login').classList.toggle('active',    tab === 'login');
    document.getElementById(tabPrefix + '-register').classList.toggle('active', tab === 'register');
}

/* ══ TOGGLE PASSWORD ══ */
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

/* ══ VALIDATION HELPERS ══ */
function val(id) { return (document.getElementById(id)?.value || '').trim(); }
function isEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function setErr(errId, msg) {
    const el = document.getElementById(errId);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
    const input = el.previousElementSibling?.tagName === 'INPUT'
        ? el.previousElementSibling
        : el.previousElementSibling?.querySelector('input');
    if (input) input.classList.toggle('has-err', !!msg);
}
function clearErr(errId) { setErr(errId, ''); }

/* ══ TOAST ══ */
let _toastT;
function toast(msg, type = '') {
    const t = document.getElementById('toast-login');
    t.innerHTML = msg;
    t.className = 'show ' + type;
    clearTimeout(_toastT);
    _toastT = setTimeout(() => t.className = '', 3000);
}

/* ══ BUTTON LOADING ══ */
function btnLoading(btn, loading, type) {
    if (!btn) return;
    if (loading) {
        btn.dataset.orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> &nbsp;Chargement...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.orig || btn.innerHTML;
        btn.disabled = false;
    }
}

/* ══════════════════════════════════════════
   CLIENT LOGIN  →  api/auth.php
══════════════════════════════════════════ */
async function clientLogin() {
    const email = val('cl-email');
    const pw    = val('cl-pw');
    let ok = true;

    clearErr('cl-email-err'); clearErr('cl-pw-err');

    if (!email)               { setErr('cl-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cl-email-err', 'Email invalide'); ok = false; }
    if (!pw)                  { setErr('cl-pw-err', 'Mot de passe requis'); ok = false; }
    else if (pw.length < 6)   { setErr('cl-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#client-login .btn-submit');
    btnLoading(btn, true);

    try {
        const res  = await fetch('api/auth.php?action=client_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, mot_de_passe: pw })
        });
        const data = await res.json();
        btnLoading(btn, false);

        if (data.success) {
            toast('<i class="fas fa-circle-check"></i> Connexion réussie !', 'ok');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            setErr('cl-email-err', data.message);
        }
    } catch (err) {
        btnLoading(btn, false);
        toast('<i class="fas fa-triangle-exclamation"></i> Erreur serveur, vérifiez XAMPP', 'err');
    }
}

/* ══════════════════════════════════════════
   CLIENT REGISTER  →  api/auth.php
══════════════════════════════════════════ */
async function clientRegister() {
    const prenom = val('cr-prenom');
    const nom    = val('cr-nom');
    const email  = val('cr-email');
    const tel    = val('cr-tel');
    const pw     = val('cr-pw');
    const pw2    = val('cr-pw2');
    const terms  = document.getElementById('cr-terms')?.checked;
    let ok = true;

    ['cr-prenom-err','cr-nom-err','cr-email-err','cr-tel-err','cr-pw-err','cr-pw2-err'].forEach(clearErr);

    if (!prenom)              { setErr('cr-prenom-err', 'Requis'); ok = false; }
    if (!nom)                 { setErr('cr-nom-err', 'Requis'); ok = false; }
    if (!email)               { setErr('cr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cr-email-err', 'Email invalide'); ok = false; }
    if (!tel)                 { setErr('cr-tel-err', 'Téléphone requis'); ok = false; }
    if (!pw)                  { setErr('cr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6)   { setErr('cr-pw-err', 'Minimum 6 caractères'); ok = false; }
    if (pw !== pw2)           { setErr('cr-pw2-err', 'Mots de passe différents'); ok = false; }
    if (!terms)               { toast('<i class="fas fa-triangle-exclamation"></i> Acceptez les conditions', 'err'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#client-register .btn-submit');
    btnLoading(btn, true);

    try {
        const res  = await fetch('api/auth.php?action=client_register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prenom:      prenom,
                nom:         nom,
                email:       email,
                telephone:   tel,
                mot_de_passe: pw,
                confirmer:   pw2
            })
        });
        const data = await res.json();
        btnLoading(btn, false);

        if (data.success) {
            toast('<i class="fas fa-circle-check"></i> Compte créé avec succès !', 'ok');
            setTimeout(() => window.location.href = 'index.html', 1600);
        } else {
            setErr('cr-email-err', data.message);
        }
    } catch (err) {
        btnLoading(btn, false);
        toast('<i class="fas fa-triangle-exclamation"></i> Erreur serveur, vérifiez XAMPP', 'err');
    }
}

/* ══════════════════════════════════════════
   SELLER LOGIN  →  api/auth.php
══════════════════════════════════════════ */
async function sellerLogin() {
    const email = val('sl-email');
    const pw    = val('sl-pw');
    let ok = true;

    clearErr('sl-email-err'); clearErr('sl-pw-err');

    if (!email)               { setErr('sl-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('sl-email-err', 'Email invalide'); ok = false; }
    if (!pw)                  { setErr('sl-pw-err', 'Mot de passe requis'); ok = false; }
    else if (pw.length < 6)   { setErr('sl-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#seller-login .btn-submit');
    btnLoading(btn, true, 'seller');

    try {
        const res  = await fetch('api/auth.php?action=vendeur_login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, mot_de_passe: pw })
        });
        const data = await res.json();
        btnLoading(btn, false, 'seller');

        if (data.success) {
            toast('<i class="fas fa-store"></i> Bienvenue sur votre tableau de bord !', 'info');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
        } else {
            setErr('sl-email-err', data.message);
        }
    } catch (err) {
        btnLoading(btn, false, 'seller');
        toast('<i class="fas fa-triangle-exclamation"></i> Erreur serveur, vérifiez XAMPP', 'err');
    }
}

/* ══════════════════════════════════════════
   SELLER REGISTER  →  api/auth.php
══════════════════════════════════════════ */
async function sellerRegister() {
    const prenom = val('sr-prenom');
    const nom    = val('sr-nom');
    const shop   = val('sr-shop');
    const email  = val('sr-email');
    const tel    = val('sr-tel');
    const wilaya = val('sr-wilaya');
    const pw     = val('sr-pw');
    let ok = true;

    ['sr-prenom-err','sr-nom-err','sr-shop-err','sr-email-err','sr-tel-err','sr-wilaya-err','sr-pw-err'].forEach(clearErr);

    if (!prenom)              { setErr('sr-prenom-err', 'Requis'); ok = false; }
    if (!nom)                 { setErr('sr-nom-err', 'Requis'); ok = false; }
    if (!shop)                { setErr('sr-shop-err', 'Nom du magasin requis'); ok = false; }
    if (!email)               { setErr('sr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('sr-email-err', 'Email invalide'); ok = false; }
    if (!tel)                 { setErr('sr-tel-err', 'Téléphone requis'); ok = false; }
    if (!wilaya)              { setErr('sr-wilaya-err', 'Sélectionnez une wilaya'); ok = false; }
    if (!pw)                  { setErr('sr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6)   { setErr('sr-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#seller-register .btn-submit');
    btnLoading(btn, true, 'seller');

    try {
        const res  = await fetch('api/auth.php?action=vendeur_register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prenom:       prenom,
                nom:          nom,
                nom_magasin:  shop,
                email:        email,
                telephone:    tel,
                wilaya_id:    0,
                mot_de_passe: pw
            })
        });
        const data = await res.json();
        btnLoading(btn, false, 'seller');

        if (data.success) {
            toast('<i class="fas fa-clock"></i> Demande envoyée ! Réponse sous 48h.', 'info');
        } else {
            setErr('sr-email-err', data.message);
        }
    } catch (err) {
        btnLoading(btn, false, 'seller');
        toast('<i class="fas fa-triangle-exclamation"></i> Erreur serveur, vérifiez XAMPP', 'err');
    }
}

/* ══ SOCIAL LOGIN ══ */
function socialLogin(provider) {
    toast(`<i class="fas fa-spinner fa-spin"></i> Connexion via ${provider}...`);
    setTimeout(() => {
        toast(`<i class="fas fa-circle-check"></i> Connecté via ${provider} !`, 'ok');
        setTimeout(() => window.location.href = 'index.html', 1400);
    }, 1500);
}

/* ══ FORGOT PASSWORD ══ */
function showForgot(e) {
    e.preventDefault();
    document.getElementById('forgot-overlay').classList.add('open');
}
function closeForgot() {
    document.getElementById('forgot-overlay').classList.remove('open');
}
async function sendReset() {
    const email = val('forgot-email');
    if (!email || !isEmail(email)) {
        toast('<i class="fas fa-triangle-exclamation"></i> Entrez un email valide', 'err');
        return;
    }
    try {
        await fetch('api/auth.php?action=forgot_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
    } catch(e) {}
    closeForgot();
    toast('<i class="fas fa-envelope"></i> Lien envoyé à ' + email, 'ok');
}

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('forgot-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeForgot();
    });
});