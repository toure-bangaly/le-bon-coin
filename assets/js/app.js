/* ==========================================================================
   Le Bon Coin — Korhogo · Apsonic
   Comportements du site : liens WhatsApp, panier, questionnaire, newsletter,
   navigation mobile. Aucune dépendance, aucun build.
   ========================================================================== */
(function () {
  'use strict';

  /* — Configuration ——————————————————————————————————————————————— */

  var CONFIG = {
    whatsapp: '0554320555',
    whatsappMessage: 'Bonjour Le Bon Coin, je suis intéressé par une moto vue sur votre site.',
    domain: 'leboncoin.com'
  };

  var STORAGE_CART = 'lbc.cart';
  var STORAGE_NEWS = 'lbc.newsletter';

  var digits = CONFIG.whatsapp.replace(/[^0-9]/g, '');
  var intl = digits.indexOf('225') === 0 ? digits : '225' + digits;
  var localPhone = digits.replace(/^225/, '')
    .replace(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).*$/, '$1 $2 $3 $4 $5');

  function waLink(message) {
    return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(message || CONFIG.whatsappMessage);
  }

  function fcfa(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* localStorage peut lever (mode privé, cookies bloqués) : on dégrade en mémoire. */
  function readStore(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignoré */ }
  }

  /* — Catalogue (source unique pour le panier et le questionnaire) ————— */

  var catalogue = {};
  $$('[data-moto]').forEach(function (el) {
    catalogue[el.dataset.moto] = {
      key: el.dataset.moto,
      name: el.dataset.name,
      amount: parseInt(el.dataset.amount, 10),
      meta: el.dataset.meta,
      el: el
    };
  });

  /* — Liens WhatsApp, téléphone, domaine ——————————————————————————— */

  $$('[data-wa]').forEach(function (a) {
    a.href = waLink(a.getAttribute('data-wa') || CONFIG.whatsappMessage);
  });

  $$('[data-wa-moto]').forEach(function (a) {
    var card = a.closest('[data-moto]');
    if (!card) return;
    var moto = catalogue[card.dataset.moto];
    a.href = waLink('Bonjour Le Bon Coin, je souhaite réserver un essai pour l’' +
      moto.name + ' (' + fcfa(moto.amount) + ').\nMon quartier : ');
  });

  $$('[data-phone]').forEach(function (el) { el.textContent = localPhone; });
  $$('[data-domain]').forEach(function (el) { el.textContent = CONFIG.domain; });

  /* — Navigation mobile ———————————————————————————————————————————— */

  var navToggle = $('#nav-toggle');
  var navLinks = $('#nav-links');

  function setNavOpen(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navLinks.hidden = !open;
  }

  var mqDesktop = window.matchMedia('(min-width: 861px)');
  function syncNav() { setNavOpen(mqDesktop.matches); }
  syncNav();
  mqDesktop.addEventListener('change', syncNav);

  navToggle.addEventListener('click', function () {
    setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A' && !mqDesktop.matches) setNavOpen(false);
  });

  /* — Section active dans la navigation ———————————————————————————— */

  var navAnchors = $$('#nav-links a[href^="#"]');
  var watched = navAnchors
    .map(function (a) { return document.getElementById(a.hash.slice(1)); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    var visible = Object.create(null);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var current = null;
      for (var i = 0; i < watched.length; i++) {
        if (visible[watched[i].id]) { current = watched[i].id; break; }
      }
      navAnchors.forEach(function (a) {
        if (current && a.hash === '#' + current) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-96px 0px -55% 0px' });
    watched.forEach(function (section) { spy.observe(section); });
  }

  /* — Panier ——————————————————————————————————————————————————————— */

  var cartEl = $('#cart');
  var cartToggle = $('#cart-toggle');
  var cartCount = $('#cart-count');
  var cartEmpty = $('#cart-empty');
  var cartFilled = $('#cart-filled');
  var cartItems = $('#cart-items');
  var cartTotal = $('#cart-total');
  var cartOrder = $('#cart-order');
  var lastFocused = null;

  var cart = readStore(STORAGE_CART, []).filter(function (k) { return !!catalogue[k]; });

  function cartSum() {
    return cart.reduce(function (t, k) { return t + catalogue[k].amount; }, 0);
  }

  function orderLink() {
    return waLink(
      'Bonjour Le Bon Coin, je souhaite réserver :\n' +
      cart.map(function (k) {
        return '- ' + catalogue[k].name + ' (' + fcfa(catalogue[k].amount) + ')';
      }).join('\n') +
      '\nTotal indicatif : ' + fcfa(cartSum()) +
      '\nMon quartier : '
    );
  }

  function renderCart() {
    cartCount.textContent = cart.length ? ' (' + cart.length + ')' : '';
    cartToggle.setAttribute('aria-label', cart.length
      ? 'Panier, ' + cart.length + ' moto' + (cart.length > 1 ? 's' : '')
      : 'Panier, vide');

    cartEmpty.hidden = cart.length > 0;
    cartFilled.hidden = cart.length === 0;

    cartItems.textContent = '';
    cart.forEach(function (key) {
      var moto = catalogue[key];

      var row = document.createElement('div');
      row.className = 'cart-item';

      var left = document.createElement('div');
      left.style.minWidth = '0';
      var name = document.createElement('div');
      name.className = 'cart-item-name';
      name.textContent = moto.name;
      var meta = document.createElement('div');
      meta.className = 'cart-item-meta';
      meta.textContent = moto.meta;
      left.appendChild(name);
      left.appendChild(meta);

      var side = document.createElement('div');
      side.className = 'cart-item-side';
      var price = document.createElement('div');
      price.className = 'cart-item-price';
      price.textContent = fcfa(moto.amount);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-ghost cart-item-remove';
      remove.textContent = 'Retirer';
      remove.setAttribute('aria-label', 'Retirer ' + moto.name + ' du panier');
      remove.addEventListener('click', function () { removeFromCart(key); });
      side.appendChild(price);
      side.appendChild(remove);

      row.appendChild(left);
      row.appendChild(side);
      cartItems.appendChild(row);
    });

    cartTotal.textContent = fcfa(cartSum());
    cartOrder.href = orderLink();

    $$('[data-add]').forEach(function (btn) {
      var key = btn.closest('[data-moto]').dataset.moto;
      var inCart = cart.indexOf(key) !== -1;
      btn.textContent = inCart ? 'Dans le panier' : 'Ajouter au panier';
      btn.disabled = inCart;
    });
  }

  function addToCart(key) {
    if (cart.indexOf(key) === -1) {
      cart.push(key);
      writeStore(STORAGE_CART, cart);
    }
    renderCart();
    openCart();
  }

  function removeFromCart(key) {
    cart = cart.filter(function (k) { return k !== key; });
    writeStore(STORAGE_CART, cart);
    renderCart();
  }

  function openCart() {
    if (!cartEl.hidden) return;
    lastFocused = document.activeElement;
    cartEl.hidden = false;
    document.body.classList.add('is-locked');
    cartToggle.setAttribute('aria-expanded', 'true');
    $('#cart-close').focus();
  }

  function closeCart() {
    if (cartEl.hidden) return;
    cartEl.hidden = true;
    document.body.classList.remove('is-locked');
    cartToggle.setAttribute('aria-expanded', 'false');
    if (lastFocused && lastFocused.isConnected) lastFocused.focus();
  }

  cartToggle.addEventListener('click', function () {
    if (cartEl.hidden) openCart(); else closeCart();
  });
  $('#cart-close').addEventListener('click', closeCart);
  $$('[data-cart-dismiss]').forEach(function (el) { el.addEventListener('click', closeCart); });
  cartEl.addEventListener('mousedown', function (e) { if (e.target === cartEl) closeCart(); });

  $$('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addToCart(btn.closest('[data-moto]').dataset.moto);
    });
  });

  /* Escape ferme le panier ; Tab reste enfermé dans le tiroir. */
  document.addEventListener('keydown', function (e) {
    if (cartEl.hidden) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key !== 'Tab') return;

    var focusables = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', cartEl)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  renderCart();

  /* — Questionnaire ———————————————————————————————————————————————— */

  var questions = [
    { q: 'Vous roulez surtout où ?', opts: [
      { label: 'En ville, trajets courts tous les jours', tag: 'ville' },
      { label: 'Ville et piste, un peu de tout', tag: 'mixte' },
      { label: 'Longues routes, charges, hors de Korhogo', tag: 'route' }
    ] },
    { q: 'Votre budget aujourd’hui ?', opts: [
      { label: 'Jusqu’à 280 000 FCFA', tag: 'bas' },
      { label: 'Entre 280 000 et 450 000 FCFA', tag: 'moyen' },
      { label: 'Plus de 450 000 FCFA, je veux du neuf', tag: 'haut' }
    ] },
    { q: 'Ce qui compte le plus pour vous ?', opts: [
      { label: 'Le prix le plus bas possible', tag: 'prix' },
      { label: 'La fiabilité et une garantie longue', tag: 'fiable' },
      { label: 'La puissance et le confort', tag: 'puissance' }
    ] }
  ];

  var motos = {
    ap110: { key: 'm6', why: 'Petite cylindrée sobre et économique : parfaite pour les allers-retours quotidiens en ville, avec une consommation minimale et des pièces qu’on trouve partout à Korhogo.' },
    aloba: { key: 'm2', why: 'La valeur sûre : 125 cm³ increvable, révisée entièrement, papiers en règle. Le bon compromis entre la ville et la piste.' },
    sport: { key: 'm4', why: 'Selle basse et tenue de route agréable en ville, pneus et plaquettes neufs. Le confort sans monter en cylindrée.' },
    tiger: { key: 'm3', why: '150 cm³ avec du couple : elle encaisse les longues routes du Nord, les charges et les passagers sans forcer. Chaîne et transmission déjà remplacées.' },
    f1d: { key: 'm1', why: 'Occasion récente, 150 cm³ souples et allure sport. Révisée entièrement, papiers en règle — la plus agréable du stock sur route.' },
    neuve: { key: 'm7', why: 'Sortie de carton, montée et rodée à l’atelier, carte grise faite avec vous et casque offert. Vous partez tranquille pour des années.' }
  };

  var answers = [];

  function recommend() {
    var usage = answers[0], budget = answers[1], prio = answers[2];
    if (budget === 'haut') return prio === 'puissance' ? motos.f1d : motos.neuve;
    if (usage === 'route' || prio === 'puissance') return budget === 'bas' ? motos.ap110 : motos.tiger;
    if (budget === 'bas') return motos.ap110;
    if (prio === 'fiable') return motos.aloba;
    return usage === 'ville' ? motos.sport : motos.aloba;
  }

  var quizRunning = $('#quiz-running');
  var quizResult = $('#quiz-result');
  var quizStep = $('#quiz-step');
  var quizBar = $('#quiz-bar');
  var quizTrack = quizBar.parentNode;
  var quizQuestion = $('#quiz-question');
  var quizOptions = $('#quiz-options');
  var letters = ['A', 'B', 'C'];

  function renderQuiz() {
    var step = answers.length;
    var done = step >= questions.length;

    quizRunning.hidden = done;
    quizResult.hidden = !done;

    if (done) {
      var pickChoice = recommend();
      var moto = catalogue[pickChoice.key];
      $('#quiz-result-name').textContent = moto.name;
      $('#quiz-result-meta').textContent = moto.meta;
      $('#quiz-result-why').textContent = pickChoice.why;
      $('#quiz-result-price').textContent = fcfa(moto.amount);
      $('#quiz-result-wa').href = waLink(
        'Bonjour Le Bon Coin, le questionnaire me conseille l’' + moto.name +
        ' (' + fcfa(moto.amount) + '). Je souhaite réserver un essai.\nMon quartier : ');
      return;
    }

    var q = questions[step];
    quizStep.textContent = 'Question ' + (step + 1) + ' sur 3';
    quizBar.style.width = Math.round((step / questions.length) * 100) + '%';
    quizTrack.setAttribute('aria-valuenow', String(step));
    quizQuestion.textContent = q.q;

    quizOptions.textContent = '';
    q.opts.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary quiz-option';

      var letter = document.createElement('span');
      letter.className = 'letter';
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = letters[i];

      var label = document.createElement('span');
      label.textContent = opt.label;

      btn.appendChild(letter);
      btn.appendChild(label);
      btn.addEventListener('click', function () {
        answers.push(opt.tag);
        renderQuiz();
        var next = answers.length >= questions.length
          ? $('#quiz-result-name')
          : quizOptions.firstChild;
        if (next && next.focus) next.focus();
      });
      quizOptions.appendChild(btn);
    });
  }

  $$('[data-quiz-restart]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      answers = [];
      renderQuiz();
      var first = quizOptions.firstChild;
      if (first) first.focus();
    });
  });

  $('#quiz-result-name').setAttribute('tabindex', '-1');
  renderQuiz();

  /* — Newsletter ——————————————————————————————————————————————————— */

  var newsForm = $('#newsletter-form');
  var newsDone = $('#newsletter-done');
  var emailInput = $('#bc-email');
  var emailError = $('#bc-email-error');

  function showSubscribed() {
    newsForm.hidden = true;
    newsDone.hidden = false;
  }

  if (readStore(STORAGE_NEWS, null)) showSubscribed();

  newsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = emailInput.value.trim();
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

    if (!valid) {
      emailError.textContent = 'Merci d’entrer une adresse email valide, par exemple votre@email.com.';
      emailError.hidden = false;
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.focus();
      return;
    }

    emailError.hidden = true;
    emailInput.removeAttribute('aria-invalid');
    writeStore(STORAGE_NEWS, { email: value, date: new Date().toISOString() });
    showSubscribed();
    newsDone.setAttribute('tabindex', '-1');
    newsDone.focus();
  });

  emailInput.addEventListener('input', function () {
    if (!emailError.hidden) {
      emailError.hidden = true;
      emailInput.removeAttribute('aria-invalid');
    }
  });

})();
