(function () {
  'use strict';
  var d = document.documentElement;
  var C = JSON.parse(document.getElementById('copy-base').textContent);
  /* Native restoration preserves back, forward and reload positions. */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; } catch (e) {}
  function dark() {
    var t = d.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  var tb = document.getElementById('theme');
  function label() { if (tb) tb.setAttribute('aria-label', dark() ? C.to_light : C.to_dark); if (tb) tb.title = tb.getAttribute('aria-label'); }
  label();
  if (tb) tb.addEventListener('click', function () {
    var next = dark() ? 'light' : 'dark';
    d.setAttribute('data-theme', next);
    try { localStorage.setItem('cardcycles_theme', next); } catch (e) {}
    label();
  });
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label); } catch (e) {} }
  var mb = document.getElementById('menubtn'), sheet = document.getElementById('sheet');
  function setMenu(open) {
    d.classList.toggle('menu-open', open);
    if (sheet) sheet.hidden = !open;
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    var menuLabel = mb.querySelector && mb.querySelector('[data-menu-label]');
    if (menuLabel) menuLabel.textContent = open ? C.menu_close : C.menu_open;
    else mb.textContent = open ? C.menu_close : C.menu_open;
  }
  if (mb) mb.addEventListener('click', function () { setMenu(!d.classList.contains('menu-open')); });
  if (mb && sheet) sheet.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setMenu(false); });
  document.addEventListener('pointerdown', function (e) {
    if (mb && sheet && d.classList.contains('menu-open') && !sheet.contains(e.target) && !mb.contains(e.target)) setMenu(false);
  });
  var wideMenu = window.matchMedia('(min-width:60em)');
  wideMenu.addEventListener('change', function (e) { if (e.matches && mb) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && d.classList.contains('menu-open') && mb) { setMenu(false); mb.focus(); }
  });
  /* controls that need this script (copy as text, the week card, the ring stepper) render hidden; show them now */
  var rv = document.querySelectorAll('[data-reveal]');
  for (var ri = 0; ri < rv.length; ri++) rv[ri].hidden = false;
  function syncScrollerTargets() {
    document.querySelectorAll('.tscroll,pre,.cmds').forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) el.setAttribute('tabindex','0');
      else el.removeAttribute('tabindex');
    });
  }
  function syncStickyRails() {
    document.querySelectorAll('.read>.rail').forEach(function (el) {
      el.style.position = window.matchMedia('(min-width:60em)').matches && el.getBoundingClientRect().height + 48 <= window.innerHeight ? 'sticky' : 'static';
    });
  }
  window.addEventListener('load',syncStickyRails);
  window.addEventListener('resize',syncStickyRails);
  if (typeof ResizeObserver !== 'undefined') {
    var layoutObserver = new ResizeObserver(function () { syncScrollerTargets(); syncStickyRails(); });
    document.querySelectorAll('.read>.rail,.tscroll,pre,.cmds').forEach(function (el) {layoutObserver.observe(el);});
  }
  window.addEventListener('load',syncScrollerTargets);
  window.addEventListener('resize',syncScrollerTargets);
  document.addEventListener('toggle',syncScrollerTargets,true);
  /* All actions fit on one row, or all three stack. Measure natural control widths
     so enlarged text and font changes never produce a 1+2 or 2+1 arrangement. */
  function syncActionGroups() {
    document.querySelectorAll('.all-or-stack').forEach(function (group) {
      var buttons = Array.from(group.children), gap = parseFloat(getComputedStyle(group).columnGap) || 0;
      var width = gap * Math.max(0, buttons.length - 1);
      buttons.forEach(function (button) {
        var saved = button.style.cssText;
        button.style.cssText += ';width:max-content;flex:none;white-space:nowrap';
        width += button.getBoundingClientRect().width;
        button.style.cssText = saved;
      });
      group.classList.toggle('actions-row', width <= group.clientWidth + .5);
    });
  }
  syncActionGroups();
  window.addEventListener('load',syncActionGroups);
  window.addEventListener('resize',syncActionGroups);
  if (document.fonts) document.fonts.ready.then(syncActionGroups);
  if (typeof ResizeObserver !== 'undefined') {
    var actionObserver = new ResizeObserver(syncActionGroups);
    document.querySelectorAll('.all-or-stack,.all-or-stack>.btn').forEach(function (el) { actionObserver.observe(el); });
  }
  function syncHeadRows() {
    if (!C.eyebrows || !document.createRange) return;
    var column = document.querySelector('main.wrap');
    if (!column) return;
    var probe = document.createElement('p');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;margin:0;padding:0;min-height:0;font:600 var(--fs-14)/1.5 var(--sans);letter-spacing:.06em;text-transform:uppercase';
    probe.style.width = column.clientWidth + 'px';
    document.body.appendChild(probe);
    var height = 0;
    C.eyebrows.forEach(function (text) { probe.textContent = text; height = Math.max(height,probe.getBoundingClientRect().height); });
    probe.remove();
    d.style.setProperty('--eyebrow-row-height',height+'px');
  }
  function syncScaleLabels() {
    if (!document.createRange) return;
    document.querySelectorAll('.i-scale,.i-years').forEach(function (scale) {
      var labels = Array.from(scale.children);
      labels.forEach(function (el) { el.style.visibility = ''; });
      var boxes = labels.map(function (el) {
        var r = document.createRange(); r.selectNodeContents(el);
        return r.getBoundingClientRect();
      });
      if (boxes.length < 3) return;
      var end = boxes[0].bottom, last = boxes[boxes.length - 1].top;
      for (var i = 1; i < boxes.length - 1; i++) {
        if (boxes[i].top < end + .5 || boxes[i].bottom > last - .5) labels[i].style.visibility = 'hidden';
        else end = boxes[i].bottom;
      }
    });
  }
  window.addEventListener('load',syncScaleLabels);
  window.addEventListener('resize',syncScaleLabels);
  if (document.fonts) document.fonts.ready.then(syncScaleLabels);
  function syncNoteTypes() {
    if (!document.createRange) return;
    syncHeadRows();
    syncScaleLabels();
    var small = parseFloat(getComputedStyle(d).fontSize) * .875;
    var graphite = getComputedStyle(d).getPropertyValue('--graphite').trim();
    var colorProbe = document.createElement('span');
    colorProbe.style.color = graphite;
    document.body.appendChild(colorProbe);
    graphite = getComputedStyle(colorProbe).color;
    colorProbe.remove();
    document.querySelectorAll('main p,main li,main dt,main dd,main .i-caption,.ftr .priv,.ftr .built,.field .help,.fpblock .k,.rv-full').forEach(function (el) {
      if (el.closest('.i-plot,.plotwrap,.stripwrap,.i-weeks,summary,pre,.btn,.iconbtn,.menubtn,.i-stats,.stats')) return;  /* stat labels are labels, not notes */
      el.classList.remove('note-long');
      var style = getComputedStyle(el);
      if ((Math.abs(parseFloat(style.fontSize) - small) > .1 && style.color !== graphite) || !el.getClientRects().length || el.matches('.eyebrow,.i-mini-unit')) return;
      var range = document.createRange(); range.selectNodeContents(el);
      var lines = [];
      Array.from(range.getClientRects()).forEach(function (r) {
        if (r.width > .1 && r.height > .1 && !lines.some(function (top) { return Math.abs(top - r.top) < 1; })) lines.push(r.top);
      });
      if (lines.length > 2) el.classList.add('note-long');
    });
  }
  syncNoteTypes();
  window.addEventListener('load',syncNoteTypes);
  window.addEventListener('resize',syncNoteTypes);
  document.addEventListener('toggle',syncNoteTypes,true);
  if (document.fonts) document.fonts.ready.then(syncNoteTypes);
  if (typeof ResizeObserver !== 'undefined') {
    var noteObserver = new ResizeObserver(syncNoteTypes);
    var readingColumn = document.querySelector('main');
    if (readingColumn) noteObserver.observe(readingColumn);
  }
  var live = document.getElementById('live');
  function copyText(text, btn) {
    function done(ok) {
      var said = btn && btn.getAttribute('data-copied');
      if (live) { live.textContent = ''; live.textContent = ok ? (said || C.copied_live) : C.copy_failed; }
      if (btn) { var was = btn.getAttribute('data-label') || btn.textContent; btn.setAttribute('data-label', was);
        btn.textContent = ok ? C.copied : was; setTimeout(function () { btn.textContent = was; }, 1600); }
    }
    function fallback() {
      try {
        var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.top = '-1000px'; document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); document.body.removeChild(ta); done(ok);
      } catch (e) { done(false); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else fallback();
  }
  window.CCCopy = copyText;
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (b) { e.preventDefault(); copyText(b.getAttribute('data-copy'), b); }
    var p = e.target.closest ? e.target.closest('[data-print]') : null;
    if (p) { e.preventDefault(); window.print(); }
  });
})();
