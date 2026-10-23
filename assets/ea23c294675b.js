(function () {
'use strict';
var d = document.documentElement;
var C = JSON.parse(document.getElementById('copy-base').textContent);
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
var mb = document.getElementById('menubtn'), bb = document.getElementById('barmenubtn');
var sheet = document.getElementById('sheet'), bar = document.querySelector('[data-status-bar]'), opener = null;
var menuButtons = [mb, bb].filter(Boolean);
function isPinned() { return !!(bar && bar.classList.contains('is-pinned')); }
function setMenu(open, trigger, unpin) {
var hadFocus = sheet && sheet.contains(document.activeElement);
if (open) opener = trigger;
d.classList.toggle('menu-open', open);
d.classList.toggle('bar-menu-open', open && isPinned());
if (sheet) sheet.hidden = !open;
menuButtons.forEach(function (button) {
button.setAttribute('aria-expanded', open ? 'true' : 'false');
var menuLabel = button.querySelector && button.querySelector('[data-menu-label]');
if (menuLabel) menuLabel.textContent = open ? C.menu_close : C.menu_open;
else button.textContent = open ? C.menu_close : C.menu_open;
});
if (open && trigger === bb && sheet) {
var firstLink = sheet.querySelector('a[href]');
if (firstLink) firstLink.focus({preventScroll:true});
}
if (!open && opener) {
var target = unpin ? (hadFocus ? mb : null) : opener;
if (target && (!target.getClientRects().length || getComputedStyle(target).visibility === 'hidden')) target = hadFocus ? tb : null;
if (target) target.focus({preventScroll:true});
opener = null;
}
}
menuButtons.forEach(function (button) { button.addEventListener('click', function () { setMenu(!d.classList.contains('menu-open'), button); }); });
if (mb && sheet) sheet.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setMenu(false); });
var swallowUntil = 0;
document.addEventListener('pointerdown', function (e) {
if (sheet && d.classList.contains('menu-open') && !sheet.contains(e.target) && !menuButtons.some(function (button) { return button.contains(e.target); })) {
swallowUntil = d.classList.contains('bar-menu-open') ? e.timeStamp + 800 : 0;
setMenu(false);
}
});
document.addEventListener('click', function (e) { if (e.timeStamp < swallowUntil) { swallowUntil = 0; e.preventDefault(); e.stopPropagation(); } }, true);
var wideMenu = window.matchMedia('(min-width:60em)');
wideMenu.addEventListener('change', function (e) { if (e.matches && !isPinned()) setMenu(false); });
if (bar) bar.addEventListener('statuspinchange', function (e) {
if (!e.detail.pinned) setMenu(false, null, true);
else if (d.classList.contains('menu-open')) d.classList.add('bar-menu-open');
});
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape' && d.classList.contains('menu-open')) setMenu(false);
});
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
function syncActionGroups() {
document.querySelectorAll('.all-or-stack').forEach(function (group) {
var buttons = Array.from(group.children), gap = parseFloat(getComputedStyle(group).columnGap) || 0;
var widest = 0;
buttons.forEach(function (button) {
var saved = button.style.cssText;
button.style.cssText += ';width:max-content;flex:none;white-space:nowrap';
widest = Math.max(widest, button.getBoundingClientRect().width);
button.style.cssText = saved;
});
var width = widest * buttons.length + gap * Math.max(0, buttons.length - 1);
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
if (el.closest('.i-plot,.plotwrap,.stripwrap,.i-weeks,summary,pre,.btn,.iconbtn,.menubtn,.i-stats,.stats')) return;
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

(function () {
'use strict';
if (!('IntersectionObserver' in window)) return;
var bar = document.querySelector('[data-status-bar]');
var sentinel = document.querySelector('[data-status-sentinel]');
if (!bar || !sentinel) return;
var pinned = false;
var first = true;
var controls = bar.querySelector('.i-status-controls');
function measure() {
document.documentElement.style.setProperty('--status-bar-height', bar.getBoundingClientRect().height + 'px');
}
measure();
if ('ResizeObserver' in window) new ResizeObserver(measure).observe(bar);
else window.addEventListener('resize', measure);
bar.classList.add('no-anim');
var observer = new window.IntersectionObserver(function (entries) {
entries.forEach(function (entry) {
if (entry.target !== sentinel) return;
var edge = entry.boundingClientRect.bottom;
if (!pinned && edge <= 0) pinned = true;
else if (pinned && edge >= 8) pinned = false;
var changed = bar.classList.contains('is-pinned') !== pinned;
bar.classList.toggle('is-pinned', pinned);
if (controls) controls.inert = !pinned;
if (changed) bar.dispatchEvent(new CustomEvent('statuspinchange', {detail: {pinned: pinned}}));
if (first) { first = false; requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.remove('no-anim'); }); }); }
});
}, {threshold: [0, 1]});
observer.observe(sentinel);
bar.classList.add('status-ready');
})();
(function () {
'use strict';
var seal = document.querySelector('[data-end-seal]');
if (!seal || !('IntersectionObserver' in window)) return;
var first = true;
new window.IntersectionObserver(function (entries) {
var e = entries[entries.length - 1], r = e.isIntersecting ? e.intersectionRatio : 0;
if (first) { first = false; if (r === 0) seal.classList.add('seal-ready'); return; }
if (r === 0) { seal.classList.remove('is-sealed'); seal.classList.add('seal-ready'); }
else if (r >= 0.98 && seal.classList.contains('seal-ready')) seal.classList.add('is-sealed');
}, {threshold: [0, 0.98]}).observe(seal);
})();
(function () {
'use strict';
var main = document.querySelector('body>main'), footer = document.querySelector('.ftr-seal');
if (!main || !footer) return;
var bands = document.querySelectorAll('body>.hdr,body>.i-status,body>.review,body>section>.review,body>.sheet,body>.ftr,body>.ftr-seal');
function fit() {
var h = 0;
bands.forEach(function (b) { if (getComputedStyle(b).position !== 'fixed') h += b.getBoundingClientRect().height; });
main.style.setProperty('--shell-height', h + 'px');
}
fit();
if ('ResizeObserver' in window) { var observer = new ResizeObserver(fit); bands.forEach(function (b) { observer.observe(b); }); }
else window.addEventListener('resize', fit);
})();
