(function () {
  'use strict';
  var root = document.getElementById('verify-app'), pending = null;
  if (!root) return;
  function load() {
    if (!pending) pending = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = root.getAttribute('data-module');
      script.onload = function () { root.setAttribute('data-ready', 'true'); resolve(); };
      script.onerror = function () { pending = null; reject(new Error('Verify tool could not load')); };
      (document.head || document.documentElement).appendChild(script);
    });
    return pending;
  }
  root.addEventListener('pointerdown', load, {passive:true});
  root.addEventListener('focusin', load);
  root.addEventListener('keydown', load);
  root.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('button');
    if (!button || root.getAttribute('data-ready') === 'true') return;
    event.preventDefault(); event.stopImmediatePropagation();
    load().then(function () { button.click(); });
  }, true);
  root.addEventListener('submit', function (event) {
    if (root.getAttribute('data-ready') === 'true') return;
    event.preventDefault(); event.stopImmediatePropagation();
    var form = event.target;
    load().then(function () { form.requestSubmit(); });
  }, true);
  function loadEntryLink() {
    if (location.hash === '#saved-copy') {
      document.getElementById('saved-copy').open = true;
      load().then(function () { document.getElementById('saved-record').focus(); });
    } else if (/^#entry-\d{4}$/.test(location.hash)) load();
  }
  root.addEventListener('click', function (event) { if (event.target.closest('a[href="#saved-copy"]')) { if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (location.hash !== '#saved-copy') location.hash = '#saved-copy'; document.getElementById('saved-copy').open = true; load().then(function () { document.getElementById('saved-record').focus(); }); } });
  loadEntryLink();
  window.addEventListener('hashchange', loadEntryLink);
})();
