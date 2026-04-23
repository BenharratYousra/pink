
(function () {
  'use strict';

  /* ══════════════════════════════════════════
     1. PRELOADER
  ══════════════════════════════════════════ */
  function initPreloader() {
    var pre = document.getElementById('lux-preloader');
    if (!pre) return;
    window.addEventListener('load', function () {
      setTimeout(function () {
        pre.classList.add('hidden');
        setTimeout(function () { pre.remove(); }, 800);
      }, 950);
    });
  }

 
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var s = document.documentElement;
      var pct = (s.scrollTop / (s.scrollHeight - s.clientHeight)) * 100;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  
  function initNavbar() {
    var header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }, { passive: true });
  }

  
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ══════════════════════════════════════════
     5. AUTO-INJECT REVEAL CLASSES
  ══════════════════════════════════════════ */
  function injectRevealClasses() {
    document.querySelectorAll('#product .pro').forEach(function (el, i) {
      el.classList.add('reveal');
      el.setAttribute('data-delay', String(i + 1));
    });
    document.querySelectorAll('.prod-card').forEach(function (el, i) {
      el.classList.add('reveal');
      el.setAttribute('data-delay', String((i % 4) + 1));
    });
    document.querySelectorAll('.cat-block').forEach(function (el, i) {
      el.classList.add('reveal', 'from-left');
      el.setAttribute('data-delay', String((i % 3) + 1));
    });
    document.querySelectorAll('#product h2, .cat-hero h2').forEach(function (el) {
      el.classList.add('reveal', 'scale-in');
    });
    document.querySelectorAll('.faq-item').forEach(function (el, i) {
      el.classList.add('reveal');
      el.setAttribute('data-delay', String((i % 5) + 1));
    });
    document.querySelectorAll('.stat-box').forEach(function (el, i) {
      el.classList.add('reveal');
      el.setAttribute('data-delay', String(i + 1));
    });
  }

  /* 
     6. 3D CARD TILT
   */
  function initTilt() {
    function applyTilt(cards) {
      cards.forEach(function (card) {
        if (card._tilt) return; card._tilt = true;
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width  - 0.5;
          var y = (e.clientY - rect.top)  / rect.height - 0.5;
          card.style.transform = 'perspective(900px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) scale(1.025)';
          card.style.transition = 'transform 0.08s ease';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
          card.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
        });
      });
    }
    applyTilt(document.querySelectorAll('.pro, .prod-card'));
    new MutationObserver(function () {
      applyTilt(document.querySelectorAll('.pro, .prod-card'));
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ══════════════════════════════════════════
     7. HERO PARALLAX
  ══════════════════════════════════════════ */
  function initParallax() {
    var heroImg = document.querySelector('#hero img');
    if (!heroImg) return;
    heroImg.style.transform = 'scale(1.06)';
    window.addEventListener('scroll', function () {
      heroImg.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px) scale(1.06)';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════
     8. ANIMATED COUNTERS
  ══════════════════════════════════════════ */
  function initCounters() {
    var counters = document.querySelectorAll('.h-stat strong, .stat-num');
    if (!counters.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var text = el.textContent;
        var num = parseFloat(text.replace(/[^0-9.]/g, ''));
        var suffix = text.replace(/[0-9.]/g, '');
        if (isNaN(num)) return;
        var start = null, duration = 1300;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var ease = 1 - Math.pow(1 - p, 3);
          el.textContent = (num < 10 ? (ease * num).toFixed(0) : Math.floor(ease * num)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ══════════════════════════════════════════
     9. MAGNETIC BUTTONS
  ══════════════════════════════════════════ */
  function initMagnetic() {
    document.querySelectorAll('#hero button, .btn-send').forEach(function (btn) {
      btn.classList.add('btn-magnetic');
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width  / 2) * 0.28;
        var y = (e.clientY - rect.top  - rect.height / 2) * 0.28;
        btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ══════════════════════════════════════════
     10. HERO SPLIT TEXT
  ══════════════════════════════════════════ */
  function initHeroText() {
    var h1 = document.querySelector('#hero h1');
    if (!h1) return;
    var words = h1.innerText.split(/\s+/);
    h1.innerHTML = words.map(function (w, i) {
      return '<span class="hero-word" style="animation-delay:' + (0.08 + i * 0.13) + 's">' + w + '</span> ';
    }).join('');
  }

  /* ══════════════════════════════════════════
     11. FLOATING PARTICLES (gold + subtle)
  ══════════════════════════════════════════ */
  function initParticles() {
    var count = 10;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      var size = 1.5 + Math.random() * 2;
      p.style.cssText = [
        'left:'    + (Math.random() * 100) + 'vw',
        'width:'   + size + 'px',
        'height:'  + size + 'px',
        'background:' + (Math.random() > 0.5 ? 'var(--gold)' : 'rgba(201,169,110,0.4)'),
        '--dur:'   + (6 + Math.random() * 9) + 's',
        '--delay:' + (Math.random() * 7) + 's',
        'opacity:0'
      ].join(';');
      document.body.appendChild(p);
    }
  }

  /* ══════════════════════════════════════════
     12. PAGE TRANSITIONS (5 panels)
  ══════════════════════════════════════════ */
  function initPageTransitions() {
    var overlay = document.getElementById('page-transition-overlay');
    if (!overlay) return;
    var _orig = window.showPage;
    window.showPage = function (page, e) {
      if (e) e.preventDefault();
      overlay.classList.add('entering');
      overlay.style.pointerEvents = 'all';
      setTimeout(function () {
        _orig(page, null);
        overlay.classList.remove('entering');
        overlay.classList.add('leaving');
        overlay.style.pointerEvents = 'none';
        setTimeout(function () {
          overlay.classList.remove('leaving');
          injectRevealClasses();
          initScrollReveal();
          initTilt();
          initMagnetic();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 550);
      }, 440);
    };
  }

  /* ══════════════════════════════════════════
     13. LAZY IMAGE REVEAL
  ══════════════════════════════════════════ */
  function initLazyImages() {
    document.querySelectorAll('img').forEach(function (img) {
      if (!img.complete) {
        img.classList.add('loading');
        img.addEventListener('load', function () {
          img.classList.remove('loading');
          img.classList.add('loaded');
        });
      }
    });
  }

  /* ══════════════════════════════════════════
     14. HERO BADGE INJECT
  ══════════════════════════════════════════ */
  function injectHeroEnhancements() {
    var heroContent = document.querySelector('#hero > div > div');
    if (!heroContent || document.querySelector('.lux-badge')) return;
    var badge = document.createElement('div');
    badge.className = 'lux-badge';
    badge.innerHTML = '<i class="fas fa-star" style="font-size:.5rem"></i>&nbsp; Marketplace Premium Algérienne';
    heroContent.insertBefore(badge, heroContent.firstChild);
  }

  /* ══════════════════════════════════════════
     15. INJECT DOM ELEMENTS
  ══════════════════════════════════════════ */
  function injectDOMElements() {
    /* Preloader */
    if (!document.getElementById('lux-preloader')) {
      var pre = document.createElement('div');
      pre.id = 'lux-preloader';
      pre.innerHTML = '<div class="preloader-logo">IKYO</div>'
                    + '<div class="preloader-bar"><div class="preloader-bar-fill"></div></div>';
      document.body.insertBefore(pre, document.body.firstChild);
    }
    /* Scroll progress */
    if (!document.getElementById('scroll-progress')) {
      var sp = document.createElement('div');
      sp.id = 'scroll-progress';
      document.body.insertBefore(sp, document.body.firstChild);
    }
    /* Page transition overlay — 5 panels */
    if (!document.getElementById('page-transition-overlay')) {
      var pto = document.createElement('div');
      pto.id = 'page-transition-overlay';
      pto.innerHTML = '<div class="pto-panel"></div>'
                    + '<div class="pto-panel"></div>'
                    + '<div class="pto-panel"></div>'
                    + '<div class="pto-panel"></div>'
                    + '<div class="pto-panel"></div>';
      document.body.appendChild(pto);
    }
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    injectDOMElements();
    initPreloader();
    initScrollProgress();
    initNavbar();
    injectRevealClasses();
    initScrollReveal();
    initTilt();
    initParallax();
    initCounters();
    initMagnetic();
    initHeroText();
    initParticles();
    initPageTransitions();
    initLazyImages();
    injectHeroEnhancements();
  });

})();