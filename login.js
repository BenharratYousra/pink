


function switchRole(role) {
    const isClient = role === 'client';

    document.getElementById('form-client').style.display = isClient ? 'block' : 'none';
    document.getElementById('form-seller').style.display = isClient ? 'none'  : 'block';

    document.getElementById('pill-client').classList.toggle('active',       isClient);
    document.getElementById('pill-client').classList.toggle('seller-active', false);
    document.getElementById('pill-seller').classList.toggle('active',        false);
    document.getElementById('pill-seller').classList.toggle('seller-active', !isClient);
}


function switchTab(role, tab) {
    const prefix = role === 'client' ? 'c' : 's';
    const tabPrefix = role === 'client' ? 'ctab' : 'stab';

    document.getElementById(role + '-login').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById(role + '-register').style.display = tab === 'register' ? 'block' : 'none';

    document.getElementById(tabPrefix + '-login').classList.toggle('active',    tab === 'login');
    document.getElementById(tabPrefix + '-register').classList.toggle('active', tab === 'register');
}

/* ══ TOGGLE PASSWORD VISIBILITY ══ */
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

/* ══ SESSION SIMULATION (localStorage) ══ */
function setSession(data) {
    localStorage.setItem('ikyo_user', JSON.stringify(data));
}
function getSession() {
    try { return JSON.parse(localStorage.getItem('ikyo_user')); }
    catch { return null; }
}

/* ══════════════════════════════════════════
   CLIENT LOGIN
══════════════════════════════════════════ */
function clientLogin() {
    const email = val('cl-email');
    const pw    = val('cl-pw');
    let ok = true;

    clearErr('cl-email-err'); clearErr('cl-pw-err');

    if (!email)          { setErr('cl-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cl-email-err', 'Email invalide'); ok = false; }
    if (!pw)             { setErr('cl-pw-err', 'Mot de passe requis'); ok = false; }
    else if (pw.length < 6) { setErr('cl-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    // Simulation connexion
    const btn = document.querySelector('#client-login .btn-submit');
    btnLoading(btn, true);
    setTimeout(() => {
        btnLoading(btn, false);
        setSession({ role: 'client', email, name: email.split('@')[0] });
        toast('<i class="fas fa-circle-check"></i> Connexion réussie ! Redirection...', 'ok');
        setTimeout(() => window.location.href = 'index.html', 1500);
    }, 1200);
}

/* ══════════════════════════════════════════
   CLIENT REGISTER
══════════════════════════════════════════ */
function clientRegister() {
    const prenom = val('cr-prenom');
    const nom    = val('cr-nom');
    const email  = val('cr-email');
    const tel    = val('cr-tel');
    const pw     = val('cr-pw');
    const pw2    = val('cr-pw2');
    const terms  = document.getElementById('cr-terms')?.checked;
    let ok = true;

    ['cr-prenom-err','cr-nom-err','cr-email-err','cr-tel-err','cr-pw-err','cr-pw2-err'].forEach(clearErr);

    if (!prenom)         { setErr('cr-prenom-err', 'Requis'); ok = false; }
    if (!nom)            { setErr('cr-nom-err', 'Requis'); ok = false; }
    if (!email)          { setErr('cr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cr-email-err', 'Email invalide'); ok = false; }
    if (!tel)            { setErr('cr-tel-err', 'Téléphone requis'); ok = false; }
    if (!pw)             { setErr('cr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6) { setErr('cr-pw-err', 'Minimum 6 caractères'); ok = false; }
    if (pw !== pw2)      { setErr('cr-pw2-err', 'Mots de passe différents'); ok = false; }
    if (!terms)          { toast('<i class="fas fa-triangle-exclamation"></i> Acceptez les conditions', 'err'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#client-register .btn-submit');
    btnLoading(btn, true);
    setTimeout(() => {
        btnLoading(btn, false);
        setSession({ role: 'client', email, name: prenom + ' ' + nom });
        toast('<i class="fas fa-party-horn"></i> Compte créé avec succès !', 'ok');
        setTimeout(() => window.location.href = 'index.html', 1600);
    }, 1400);
}

/* ══════════════════════════════════════════
   SELLER LOGIN
══════════════════════════════════════════ */
function sellerLogin() {
    const email = val('sl-email');
    const pw    = val('sl-pw');
    let ok = true;

    clearErr('sl-email-err'); clearErr('sl-pw-err');

    if (!email)          { setErr('sl-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('sl-email-err', 'Email invalide'); ok = false; }
    if (!pw)             { setErr('sl-pw-err', 'Mot de passe requis'); ok = false; }
    else if (pw.length < 6) { setErr('sl-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#seller-login .btn-submit');
    btnLoading(btn, true, 'seller');
    setTimeout(() => {
        btnLoading(btn, false, 'seller');
        setSession({ role: 'seller', email, name: email.split('@')[0] });
        toast('<i class="fas fa-store"></i> Bienvenue sur votre tableau de bord !', 'info');
        setTimeout(() => {
            // Rediriger vers le dashboard vendeur (à créer) ou index
            window.location.href = 'index.html';
        }, 1500);
    }, 1200);
}

/* ══════════════════════════════════════════
   SELLER REGISTER
══════════════════════════════════════════ */
function sellerRegister() {
    const prenom = val('sr-prenom');
    const nom    = val('sr-nom');
    const shop   = val('sr-shop');
    const email  = val('sr-email');
    const tel    = val('sr-tel');
    const wilaya = val('sr-wilaya');
    const pw     = val('sr-pw');
    let ok = true;

    ['sr-prenom-err','sr-nom-err','sr-shop-err','sr-email-err','sr-tel-err','sr-wilaya-err','sr-pw-err'].forEach(clearErr);

    if (!prenom)         { setErr('sr-prenom-err', 'Requis'); ok = false; }
    if (!nom)            { setErr('sr-nom-err', 'Requis'); ok = false; }
    if (!shop)           { setErr('sr-shop-err', 'Nom du magasin requis'); ok = false; }
    if (!email)          { setErr('sr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('sr-email-err', 'Email invalide'); ok = false; }
    if (!tel)            { setErr('sr-tel-err', 'Téléphone requis'); ok = false; }
    if (!wilaya)         { setErr('sr-wilaya-err', 'Sélectionnez une wilaya'); ok = false; }
    if (!pw)             { setErr('sr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6) { setErr('sr-pw-err', 'Minimum 6 caractères'); ok = false; }

    if (!ok) return;

    const btn = document.querySelector('#seller-register .btn-submit');
    btnLoading(btn, true, 'seller');
    setTimeout(() => {
        btnLoading(btn, false, 'seller');
        toast('<i class="fas fa-clock"></i> Demande envoyée ! Réponse sous 48h.', 'info');
    }, 1400);
}

/* ══ SOCIAL LOGIN ══ */
function socialLogin(provider) {
    toast(`<i class="fas fa-spinner fa-spin"></i> Connexion via ${provider}...`);
    setTimeout(() => {
        setSession({ role: 'client', name: 'Utilisateur', provider });
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
function sendReset() {
    const email = val('forgot-email');
    if (!email || !isEmail(email)) {
        toast('<i class="fas fa-triangle-exclamation"></i> Entrez un email valide', 'err');
        return;
    }
    closeForgot();
    toast('<i class="fas fa-envelope"></i> Lien envoyé à ' + email, 'ok');
}

/* ══ BUTTON LOADING STATE ══ */
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

/* ══ CLOSE MODAL ON OVERLAY CLICK ══ */
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('forgot-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeForgot();
    });

    /* Afficher le nom de l'utilisateur si déjà connecté */
    const session = getSession();
    if (session) {
        toast(`<i class="fas fa-user"></i> Déjà connecté en tant que ${session.name}`, 'ok');
    }
});