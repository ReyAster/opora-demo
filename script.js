(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return n.toLocaleString('ru-RU'); };

  /* Тема: светлая по умолчанию, выбор запоминается */
  var themeBtn = $('themeBtn');
  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    themeBtn.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark');
  themeBtn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') !== 'dark';
    applyTheme(dark);
    try { localStorage.setItem('opora-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  /* Бургер */
  var burger = $('burger'), nav = $('nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); } });

  /* Квиз */
  var Q = [
    { q: 'Что нужно сделать?', key: 'type', opts: [
      { label: 'Ремонт квартиры', r: 18000 }, { label: 'Построить дом', r: 42000 }, { label: 'Коммерческое помещение', r: 15000 } ] },
    { q: 'Какая площадь?', key: 'area', opts: [
      { label: 'до 60 м²', v: 50 }, { label: '60-120 м²', v: 90 }, { label: '120-200 м²', v: 160 }, { label: 'больше 200 м²', v: 240 } ] },
    { q: 'Какой объём работ?', key: 'scope', opts: [
      { label: 'Под ключ, с отделкой', v: 1 }, { label: 'Без чистовой отделки', v: 0.72 }, { label: 'Только черновые работы', v: 0.5 } ] }
  ];
  var quiz = $('quiz'), resultPanel = $('qResult'), thanksPanel = $('qThanks');
  var answers = {}, panels = [];

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  Q.forEach(function (item, i) {
    var p = el('div', 'q-panel'); p.setAttribute('role', 'group');
    var top = el('div', 'q-top');
    top.appendChild(el('span', 'q-step', 'Вопрос ' + (i + 1) + ' из 3'));
    if (i > 0) {
      var back = el('button', 'link-btn', 'Назад'); back.type = 'button';
      back.addEventListener('click', function () { show(i - 1); });
      top.appendChild(back);
    }
    var title = el('h2', 'q-title', item.q); title.id = 'qt' + i; title.tabIndex = -1;
    p.setAttribute('aria-labelledby', title.id);
    var opts = el('div', 'opts');
    item.opts.forEach(function (o) {
      var b = el('button', 'opt', o.label); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        answers[item.key] = o;
        Array.prototype.forEach.call(opts.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        show(i + 1);
      });
      opts.appendChild(b);
    });
    p.appendChild(top); p.appendChild(title); p.appendChild(opts);
    quiz.insertBefore(p, resultPanel);
    panels.push(p);
  });

  var all = panels.concat([resultPanel, thanksPanel]);
  function show(idx, focus) {
    if (idx === 3) fillResult();
    all.forEach(function (p, k) { if (k === idx) p.removeAttribute('inert'); else p.setAttribute('inert', ''); });
    if (focus !== false) {
      var f = idx < 3 ? panels[idx].querySelector('.q-title') : idx === 3 ? $('qtg') : thanksPanel.querySelector('.thanks-title');
      if (f) f.focus({ preventScroll: true });
    }
  }
  function fillResult() {
    var t = answers.type, a = answers.area, s = answers.scope;
    var mid = t.r * a.v * s.v;
    var lo = Math.round(mid * 0.85 / 10000) * 10000, hi = Math.round(mid * 1.15 / 10000) * 10000;
    $('qRange').textContent = fmt(lo) + ' - ' + fmt(hi) + ' ₽';
    $('qSummary').textContent = t.label + ', ' + a.label + ', ' + s.label.toLowerCase();
  }
  function restart() {
    answers = {};
    $('qtg').value = ''; setErr($('qtg'), $('qtgErr'), '');
    quiz.querySelectorAll('.opt').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    show(0);
  }
  $('qRestart').addEventListener('click', restart);
  $('qRestart2').addEventListener('click', restart);

  function setErr(input, box, msg) {
    box.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function validContact(v) {
    v = v.trim();
    if (/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v) && (v[0] === '@' || /[A-Za-z]/.test(v))) return true;
    return v.replace(/\D/g, '').length >= 10 && /^[+\d\s()\-]+$/.test(v);
  }
  $('qForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('qtg'), v = input.value.trim();
    if (!v) { setErr(input, $('qtgErr'), 'Укажите Telegram или телефон'); input.focus(); return; }
    if (!validContact(v)) { setErr(input, $('qtgErr'), 'Проверьте: ник вида @name или телефон из 10-11 цифр'); input.focus(); return; }
    setErr(input, $('qtgErr'), '');
    $('qThanksTo').textContent = v;
    show(4);
  });
  $('qtg').addEventListener('input', function () { setErr(this, $('qtgErr'), ''); });
  show(0, false);

  /* Смета на дом (демо-расчёт) */
  var floors = 1, area = 140;
  var parts = [
    { name: 'Фундамент', k: function () { return 0.16; } },
    { name: 'Стены и перекрытия', k: function (f) { return f === 2 ? 0.38 : 0.34; } },
    { name: 'Кровля и окна', k: function (f) { return f === 2 ? 0.20 : 0.24; } },
    { name: 'Инженерия и отделка', k: function () { return 0.26; } }
  ];
  function calc() {
    var base = area * (floors === 2 ? 39000 : 43000), total = 0;
    var lines = $('lines'); lines.textContent = '';
    parts.forEach(function (p) {
      var sum = Math.round(base * p.k(floors) / 1000) * 1000; total += sum;
      var row = document.createElement('div');
      var n = document.createElement('span'); n.textContent = p.name;
      var b = document.createElement('b'); b.textContent = fmt(sum) + ' ₽';
      row.appendChild(n); row.appendChild(b); lines.appendChild(row);
    });
    $('total').textContent = fmt(total) + ' ₽';
    $('areaOut').textContent = area;
    $('floor1').setAttribute('aria-pressed', floors === 1 ? 'true' : 'false');
    $('floor2').setAttribute('aria-pressed', floors === 2 ? 'true' : 'false');
  }
  $('floor1').addEventListener('click', function () { floors = 1; calc(); });
  $('floor2').addEventListener('click', function () { floors = 2; calc(); });
  $('carea').addEventListener('input', function () { area = Number(this.value); calc(); });
  calc();

  /* Было и стало: ползунок и перетаскивание по фото */
  var baView = $('baView'), baRange = $('baRange');
  function setBa(v) {
    v = Math.max(0, Math.min(100, v));
    $('baBefore').style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
    $('baLine').style.left = v + '%'; $('baKnob').style.left = v + '%';
    baRange.value = v;
  }
  baRange.addEventListener('input', function () { setBa(Number(this.value)); });
  var dragging = false;
  function fromPointer(e) { var r = baView.getBoundingClientRect(); setBa((e.clientX - r.left) / r.width * 100); }
  baView.addEventListener('pointerdown', function (e) { dragging = true; try { baView.setPointerCapture(e.pointerId); } catch (x) {} fromPointer(e); });
  baView.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
  ['pointerup', 'pointercancel'].forEach(function (t) { baView.addEventListener(t, function () { dragging = false; }); });
  setBa(50);

  /* Форма «Обсудим проект» (демо: ничего не отправляет) */
  $('mForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('mname'), t = $('mtel'), ok = true;
    if (n.value.trim().length < 2) { setErr(n, $('mnameErr'), 'Введите имя'); ok = false; } else setErr(n, $('mnameErr'), '');
    var digits = t.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) { setErr(t, $('mtelErr'), 'Введите телефон: 10-11 цифр'); ok = false; } else setErr(t, $('mtelErr'), '');
    if (!ok) { (n.getAttribute('aria-invalid') ? n : t).focus(); return; }
    this.style.display = 'none';
    var done = $('mOk'); done.classList.add('on'); done.focus();
  });
  ['mname', 'mtel'].forEach(function (id) {
    $(id).addEventListener('input', function () { setErr(this, $(id + 'Err'), ''); });
  });


  /* Команда: стрелки и счётчик для карусели на телефоне */
  var team = document.querySelector('.team'), figs = team.children;
  function teamStep() { return figs[0].getBoundingClientRect().width + 14; }
  function teamIndex() { return Math.min(figs.length - 1, Math.round(team.scrollLeft / teamStep())); }
  function teamUpdate() { $('teamCount').textContent = (teamIndex() + 1) + ' / ' + figs.length; }
  $('teamPrev').addEventListener('click', function () { team.scrollBy({ left: -teamStep(), behavior: 'smooth' }); });
  $('teamNext').addEventListener('click', function () { team.scrollBy({ left: teamStep(), behavior: 'smooth' }); });
  team.addEventListener('scroll', teamUpdate, { passive: true });
  teamUpdate();

  /* Плавное появление блоков при прокрутке */
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (i) { i.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (i) { io.observe(i); });
  }
})();
