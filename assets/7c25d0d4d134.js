(function () {
  'use strict';
  function each(sel, fn) { var n = document.querySelectorAll(sel); for (var i = 0; i < n.length; i++) fn(n[i]); }
  /* keyboard moves are spoken through the page's one live region, in words written at build time */
  var live = document.getElementById('live');
  function say(t) { if (live && t) { live.textContent = ''; live.textContent = t; } }
  function tipFill(tip, v, l) {
    tip.textContent = '';
    var s = document.createElement('strong'); s.textContent = v; tip.appendChild(s);
    var t = document.createElement('span'); t.textContent = l; tip.appendChild(t);
  }
  each('.plot[data-points]', function (plot) {
    var pts = JSON.parse(plot.getAttribute('data-points'));
    var hit = plot.querySelector('.hit'), xh = plot.querySelector('.xh'), tip = plot.querySelector('.tip'), hd = plot.querySelector('.hdot');
    if (!hit || !pts.length) return;
    var cur = pts.length - 1;
    function show(i) {
      cur = Math.max(0, Math.min(pts.length - 1, i));
      var p = pts[cur];
      xh.style.left = p[0] + '%'; xh.hidden = false;
      hd.style.left = p[0] + '%'; hd.style.top = p[1] + '%'; hd.hidden = false;
      tipFill(tip, p[2], p[3]);
      tip.hidden = false;
      var w = plot.clientWidth, x = p[0] / 100 * w, tw = tip.offsetWidth;
      var left = Math.max(tw / 2, Math.min(w - tw / 2, x));
      tip.style.left = left + 'px';
    }
    function hide() { xh.hidden = true; tip.hidden = true; hd.hidden = true; }
    function nearest(clientX) {
      var r = plot.getBoundingClientRect(), f = (clientX - r.left) / r.width * 100, best = 0, bd = 1e9;
      for (var i = 0; i < pts.length; i++) { var dd = Math.abs(pts[i][0] - f); if (dd < bd) { bd = dd; best = i; } }
      return best;
    }
    hit.addEventListener('pointermove', function (e) { show(nearest(e.clientX)); });
    hit.addEventListener('pointerdown', function (e) { show(nearest(e.clientX)); });
    hit.addEventListener('pointerleave', function () { if (document.activeElement !== hit) hide(); });
    hit.addEventListener('focus', function () { show(cur); });
    hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', function (e) {
      var k = e.key, t = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') t = cur - 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') t = cur + 1;
      else if (k === 'Home') t = 0;
      else if (k === 'End') t = pts.length - 1;
      else if (k === 'Escape') { hide(); return; }
      if (t === null) return;
      e.preventDefault(); show(t); say(pts[cur][4]);
    });
  });
  /* bar charts and the full dot strip: the plot is one tab stop; arrows move from year to year; the bands under the
     pointer are pointer targets only */
  each('.plot[data-bars]', function (plot) {
    var tip = plot.querySelector('.tip'), bands = plot.querySelectorAll('.band-hit');
    if (!bands.length) return;
    var cur = bands.length - 1;
    function show(i) {
      cur = Math.max(0, Math.min(bands.length - 1, i));
      for (var j = 0; j < bands.length; j++) bands[j].classList.toggle('on', j === cur);
      var b = bands[cur];
      tipFill(tip, b.getAttribute('data-v'), b.getAttribute('data-l'));
      tip.hidden = false;
      var w = plot.clientWidth, x = b.offsetLeft + b.offsetWidth / 2, tw = tip.offsetWidth;
      tip.style.left = Math.max(tw / 2, Math.min(w - tw / 2, x)) + 'px';
    }
    function hide() { tip.hidden = true; for (var j = 0; j < bands.length; j++) bands[j].classList.remove('on'); }
    for (var i = 0; i < bands.length; i++) (function (i) {
      bands[i].addEventListener('pointerenter', function () { show(i); });
    })(i);
    plot.addEventListener('pointerleave', function () { if (document.activeElement !== plot) hide(); });
    plot.addEventListener('focus', function () { show(cur); });
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', function (e) {
      var k = e.key, t = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') t = cur - 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') t = cur + 1;
      else if (k === 'Home') t = 0;
      else if (k === 'End') t = bands.length - 1;
      else if (k === 'Escape') { hide(); return; }
      if (t === null) return;
      e.preventDefault(); show(t); say(bands[cur].getAttribute('data-say'));
    });
  });
  each('[data-history]', function (btn) {
    var region = btn.closest('.tbl-view').querySelector('[data-history-recent]'), text = region.getAttribute('data-history-recent');
    region.setAttribute('aria-label', text); region.querySelector('caption').textContent = text;
    btn.addEventListener('click', function () { var view = btn.closest('.tbl-view'), full = view.querySelector('.history-full'), recent = view.querySelector('.history-recent'); var open = full.hidden; full.hidden = !open; recent.hidden = open; btn.textContent = btn.getAttribute(open ? 'data-off' : 'data-on'); var region = view.querySelector('[data-history-recent]'), text = region.getAttribute(open ? 'data-history-full' : 'data-history-recent'); region.setAttribute('aria-label', text); region.querySelector('caption').textContent = text; });
  });
  each('[data-tview]', function (btn) {
    var fig = document.getElementById(btn.getAttribute('data-tview'));
    var on = btn.getAttribute('data-on'), off = btn.getAttribute('data-off');
    btn.addEventListener('click', function () {
      var tbl = fig.querySelector('.tbl-view');
      var plot = fig.querySelector('.plotset') || fig.querySelector('.plotwrap') || fig.querySelector('.stripwrap');
      var showTable = tbl.hidden;
      tbl.hidden = !showTable; plot.hidden = showTable;
      btn.textContent = showTable ? off : on;
    });
  });
  /* compact dot strips: one image with every value in its label; the tooltip follows the pointer, no tab stops */
  each('.plot[data-dots]', function (plot) {
    var pts = JSON.parse(plot.getAttribute('data-dots')), tip = plot.querySelector('.tip');
    function near(clientX) {
      var r = plot.getBoundingClientRect(), f = (clientX - r.left) / r.width * 100, best = 0, bd = 1e9;
      for (var i = 0; i < pts.length; i++) { var dd = Math.abs(pts[i][0] - f); if (dd < bd) { bd = dd; best = i; } }
      return best;
    }
    var selectedDot = null;
    function showDot(e) {
      selectedDot = near(e.clientX);
      var p = pts[selectedDot];
      tipFill(tip, p[1], p[2]); tip.hidden = false;
      var w = plot.clientWidth, x = p[0] / 100 * w, tw = tip.offsetWidth;
      tip.style.left = Math.max(tw / 2, Math.min(w - tw / 2, x)) + 'px';
    }
    plot.addEventListener('pointermove',showDot);
    plot.addEventListener('pointerdown',function (e) { if (e.pointerType === 'touch' && !tip.hidden && selectedDot === near(e.clientX)) tip.hidden=true; else showDot(e); });
    plot.addEventListener('blur',function () {tip.hidden=true;});
    plot.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') tip.hidden = true; });
  });
  var pick = document.getElementById('year-pick');
  if (pick) {
    var out = document.getElementById('year-out');
    var map = JSON.parse(document.getElementById('year-sentences').textContent);
    pick.addEventListener('change', function () { out.textContent = map[pick.value] || ''; });
  }
})();
