
/* ===== PAGE NAVIGATION ===== */
function showPage(page, e) {
    if (e) e.preventDefault();
    ['home', 'categories', 'shop', 'support'].forEach(function (p) {
        document.getElementById(p + '-page').style.display = 'none';
    });
    document.getElementById(page + '-page').style.display = 'block';
    window.scrollTo(0, 0);ii
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

    /* Reset all inputs */
    document.querySelectorAll('#p-main-modal input:not([type=file]), #p-main-modal select, #p-main-modal textarea')
        .forEach(function (el) {
            el.value = el.tagName === 'SELECT' ? (el.options[0] ? el.options[0].value : '') : '';
        });

    document.getElementById('pf-count').textContent = '';
    document.querySelectorAll('.p-err').forEach(function (e) {
        e.style.display = 'none';
    });

    var btn = document.getElementById('p-submit-btn');
    btn.disabled = false;
    btn.innerHTML = 'Envoyer la demande &nbsp;<i class="fas fa-paper-plane"></i>';
}

/* Navigate between wizard steps */
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

/* Validate required fields per step */
function pValidateStep(step) {
    var ok = true;

    function pReq(id, errId) {
        var val = document.getElementById(id).value.trim();
        var err = document.getElementById(errId);
        if (!val) {
            err.style.display = 'block';
            ok = false;
        } else {
            err.style.display = 'none';
        }
    }

    if (step === 1) {
        pReq('p-prenom', 'perr-prenom');
        pReq('p-nom', 'perr-nom');
        pReq('p-tel', 'perr-tel');
        pReq('p-wilaya', 'perr-wilaya');
        var email = document.getElementById('p-email').value.trim();
        var errEmail = document.getElementById('perr-email');
        if (!email || !email.includes('@') || !email.includes('.')) {
            errEmail.style.display = 'block';
            ok = false;
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

/* Count selected files */
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

/* Submit the partner form */
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

/* Close modal on overlay click */
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('partner-overlay').addEventListener('click', function (e) {
        if (e.target === this) closePartnerForm();
    });
});