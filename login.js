// ========== SWITCH ROLES ==========
function switchRole(role) {
    const isClient = role === 'client';
    const formClient = document.getElementById('form-client');
    const formSeller = document.getElementById('form-seller');
    const pillClient = document.getElementById('pill-client');
    const pillSeller = document.getElementById('pill-seller');
    
    if(formClient) formClient.style.display = isClient ? 'block' : 'none';
    if(formSeller) formSeller.style.display = isClient ? 'none' : 'block';
    if(pillClient) pillClient.classList.toggle('active', isClient);
    if(pillSeller) pillSeller.classList.toggle('seller-active', !isClient);
}

// ========== SWITCH TABS ==========
function switchTab(role, tab) {
    const isLogin = tab === 'login';
    const loginDiv = document.getElementById(role + '-login');
    const registerDiv = document.getElementById(role + '-register');
    if(loginDiv) loginDiv.style.display = isLogin ? 'block' : 'none';
    if(registerDiv) registerDiv.style.display = isLogin ? 'none' : 'block';
    
    const tabLogin = document.getElementById((role === 'client' ? 'ctab' : 'stab') + '-login');
    const tabRegister = document.getElementById((role === 'client' ? 'ctab' : 'stab') + '-register');
    if(tabLogin) tabLogin.classList.toggle('active', isLogin);
    if(tabRegister) tabRegister.classList.toggle('active', !isLogin);
}

// ========== TOGGLE PASSWORD ==========
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ========== HELPERS ==========
function val(id) { return (document.getElementById(id)?.value || '').trim(); }
function isEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function setErr(errId, msg) {
    const el = document.getElementById(errId);
    if(el) { el.textContent = msg; el.classList.toggle('show', !!msg); }
}
function clearErr(errId) { setErr(errId, ''); }

let _toastT;
function toast(msg, type = '') {
    const t = document.getElementById('toast-login');
    if(t) {
        t.innerHTML = msg;
        t.className = 'show ' + type;
        clearTimeout(_toastT);
        _toastT = setTimeout(() => t.className = '', 3000);
    }
}

function btnLoading(btn, loading) {
    if(!btn) return;
    if(loading) {
        btn.dataset.orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.orig || 'Se connecter';
        btn.disabled = false;
    }
}

// ========== CLIENT REGISTER ==========
async function clientRegister() {
    const prenom = val('cr-prenom');
    const nom = val('cr-nom');
    const email = val('cr-email');
    const tel = val('cr-tel');
    const pw = val('cr-pw');
    const pw2 = val('cr-pw2');
    const terms = document.getElementById('cr-terms')?.checked;
    let ok = true;
    
    ['cr-prenom-err','cr-nom-err','cr-email-err','cr-tel-err','cr-pw-err','cr-pw2-err'].forEach(clearErr);
    
    if (!prenom) { setErr('cr-prenom-err', 'Requis'); ok = false; }
    if (!nom) { setErr('cr-nom-err', 'Requis'); ok = false; }
    if (!email) { setErr('cr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cr-email-err', 'Email invalide'); ok = false; }
    if (!tel) { setErr('cr-tel-err', 'Téléphone requis'); ok = false; }
    if (!pw) { setErr('cr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6) { setErr('cr-pw-err', 'Minimum 6 caractères'); ok = false; }
    if (pw !== pw2) { setErr('cr-pw2-err', 'Mots de passe différents'); ok = false; }
    if (!terms) { toast('Acceptez les conditions', 'err'); ok = false; }
    if (!ok) return;
    
    const btn = document.querySelector('#client-register .btn-submit');
    btnLoading(btn, true);
    
    try {
        const formData = new FormData();
        formData.append('prenom', prenom);
        formData.append('nom', nom);
        formData.append('email', email);
        formData.append('telephone', tel);
        formData.append('mot_de_passe', pw);
        formData.append('confirmer', pw2);
        
        const res = await fetch('api/auth.php?action=client_register', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        btnLoading(btn, false);
        
        if (data.success) {
            localStorage.setItem('user', JSON.stringify({ email: email, role: 'client', name: prenom + ' ' + nom }));
            toast('Compte créé avec succès !', 'ok');
            setTimeout(() => window.location.href = 'index.html', 1600);
        } else {
            setErr('cr-email-err', data.message);
        }
    } catch(err) { 
        btnLoading(btn, false); 
        console.error('Erreur:', err);
        toast('Erreur serveur: ' + err.message, 'err'); 
    }
}

// ========== CLIENT LOGIN ==========
async function clientLogin() {
    const email = val('cl-email');
    const pw = val('cl-pw');
    let ok = true;
    clearErr('cl-email-err'); clearErr('cl-pw-err');
    
    if (!email) { setErr('cl-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('cl-email-err', 'Email invalide'); ok = false; }
    if (!pw) { setErr('cl-pw-err', 'Mot de passe requis'); ok = false; }
    if (!ok) return;
    
    const btn = document.querySelector('#client-login .btn-submit');
    btnLoading(btn, true);
    
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('mot_de_passe', pw);
        
        const res = await fetch('api/auth.php?action=client_login', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        btnLoading(btn, false);
        
        if (data.success) {
            localStorage.setItem('user', JSON.stringify({ id: data.client?.id, email: email, role: 'client', name: data.client?.prenom }));
            toast('Connexion réussie !', 'ok');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            setErr('cl-email-err', data.message);
        }
    } catch(err) { 
        btnLoading(btn, false); 
        console.error('Erreur:', err);
        toast('Erreur serveur: ' + err.message, 'err'); 
    }
}

// ========== SELLER REGISTER ==========
async function sellerRegister() {
    const prenom = val('sr-prenom');
    const nom = val('sr-nom');
    const shop = val('sr-shop');
    const email = val('sr-email');
    const tel = val('sr-tel');
    const wilaya = document.getElementById('sr-wilaya')?.value || '';
    const pw = val('sr-pw');
    let ok = true;
    
    ['sr-prenom-err','sr-nom-err','sr-shop-err','sr-email-err','sr-tel-err','sr-wilaya-err','sr-pw-err'].forEach(clearErr);
    
    if (!prenom) { setErr('sr-prenom-err', 'Requis'); ok = false; }
    if (!nom) { setErr('sr-nom-err', 'Requis'); ok = false; }
    if (!shop) { setErr('sr-shop-err', 'Nom du magasin requis'); ok = false; }
    if (!email) { setErr('sr-email-err', 'Email requis'); ok = false; }
    else if (!isEmail(email)) { setErr('sr-email-err', 'Email invalide'); ok = false; }
    if (!tel) { setErr('sr-tel-err', 'Téléphone requis'); ok = false; }
    if (!wilaya) { setErr('sr-wilaya-err', 'Sélectionnez une wilaya'); ok = false; }
    if (!pw) { setErr('sr-pw-err', 'Requis'); ok = false; }
    else if (pw.length < 6) { setErr('sr-pw-err', 'Minimum 6 caractères'); ok = false; }
    if (!ok) return;
    
    const btn = document.querySelector('#seller-register .btn-submit');
    btnLoading(btn, true);
    
    try {
        const formData = new FormData();
        formData.append('prenom', prenom);
        formData.append('nom', nom);
        formData.append('nom_magasin', shop);
        formData.append('email', email);
        formData.append('telephone', tel);
        formData.append('wilaya_id', '0');
        formData.append('mot_de_passe', pw);
        
        const res = await fetch('api/auth.php?action=vendeur_register', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        btnLoading(btn, false);
        
        if (data.success) {
            toast('Demande envoyée ! Réponse sous 48h.', 'info');
            document.getElementById('sr-prenom').value = '';
            document.getElementById('sr-nom').value = '';
            document.getElementById('sr-shop').value = '';
            document.getElementById('sr-email').value = '';
            document.getElementById('sr-tel').value = '';
            document.getElementById('sr-wilaya').value = '';
            document.getElementById('sr-pw').value = '';
            switchTab('seller', 'login');
        } else {
            setErr('sr-email-err', data.message);
        }
    } catch(err) { 
        btnLoading(btn, false); 
        console.error('Erreur:', err);
        toast('Erreur serveur: ' + err.message, 'err'); 
    }
}

async function sellerLogin() {
    const email = document.getElementById('sl-email').value.trim();
    const pw = document.getElementById('sl-pw').value;
    
    if (!email || !pw) {
        alert('Email et mot de passe requis');
        return;
    }
    
    const btn = document.querySelector('#seller-login .btn-submit');
    btn.innerHTML = 'Chargement...';
    btn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('mot_de_passe', pw);
        
        const res = await fetch('api/auth.php?action=vendeur_login', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        console.log('Réponse API:', data);
        
        if (data.success && data.vendeur) {
            // Stocker dans localStorage
            localStorage.setItem('vendeur', JSON.stringify(data.vendeur));
            localStorage.setItem('vendeur_id', data.vendeur.id);
            
            console.log('Vendeur stocké:', localStorage.getItem('vendeur'));
            
            alert('Connexion réussie !');
            window.location.href = 'dashboard.html';
        } else {
            alert('Erreur: ' + (data.message || 'Identifiants incorrects'));
        }
    } catch(error) {
        console.error('Erreur:', error);
        alert('Erreur serveur: ' + error.message);
    } finally {
        btn.innerHTML = 'Se connecter';
        btn.disabled = false;
    }
}

// ========== FORGOT PASSWORD ==========
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
        toast('Entrez un email valide', 'err');
        return;
    }
    toast('Lien envoyé à ' + email, 'ok');
    closeForgot();
}

// ========== SOCIAL LOGIN ==========
function socialLogin(provider) {
    toast(`Connexion via ${provider}...`, 'info');
    setTimeout(() => {
        toast(`Connecté via ${provider} !`, 'ok');
        setTimeout(() => window.location.href = 'index.html', 1500);
    }, 1500);
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    switchRole('client');
    const forgotOverlay = document.getElementById('forgot-overlay');
    if(forgotOverlay) {
        forgotOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeForgot();
        });
    }
});