(function () {
  'use strict';
  var E = JSON.parse(document.getElementById('entry-data').textContent);
  var C = JSON.parse(document.getElementById('copy-entry').textContent);
  function line(box, text) { var p = document.createElement('p'); p.textContent = text; box.appendChild(p); }
  var b = document.getElementById('check-entry');
  if (b) b.addEventListener('click', function () {
    var box = document.getElementById('check-entry-out'); box.textContent = '';
    var fp = CCSeal.sha256(E.text);
    box.className = 'result ' + (fp === E.entry_hash ? 'ok' : 'no');
    if (fp === E.entry_hash) {
      line(box, C.match); box.firstChild.className = 'head';
      var ch = CCSeal.sha256(E.prev + ':' + fp);
      if (ch === E.chain_hash) line(box, E.seq === 1 ? C.chain_first : C.chain);
    } else {
      line(box, C.nomatch); box.firstChild.className = 'head'; line(box, C.hint);
    }
    box.hidden = false;
  });
  /* print: the receipt prints open, then returns to how the reader left it */
  var rc = document.querySelector('details.receipt'), wasOpen = null;
  window.addEventListener('beforeprint', function () { if (rc) { wasOpen = rc.open; rc.open = true; } });
  window.addEventListener('afterprint', function () { if (rc && wasOpen !== null) { rc.open = wasOpen; wasOpen = null; } });
  /* one check button per opened item in the desktop table (data-check-item) and in the phone cards
     (data-check-item-m); each writes its result beside itself (check-item-X or check-item-m-X) */
  var bs = document.querySelectorAll('[data-check-item],[data-check-item-m]');
  for (var i = 0; i < bs.length; i++) (function (btn) {
    btn.addEventListener('click', function () {
      var mob = btn.hasAttribute('data-check-item-m');
      var k = btn.getAttribute(mob ? 'data-check-item-m' : 'data-check-item');
      var item = E.items[k]; if (item.base64 && !item.text) item.text = new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(atob(item.base64), function(c){return c.charCodeAt(0);}));
      var fp = CCSeal.sha256(item.text);
      var out = document.getElementById((mob ? 'check-item-m-' : 'check-item-') + k);
      out.textContent = fp === item.sha256 ? C.matches : C.nomatch;
      out.hidden = false;
    });
  })(bs[i]);
})();
