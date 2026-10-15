(function () {
  'use strict';
  /* The week card (DESIGN_V2 7.2): a 1200 x 630 PNG drawn on this device from the card-data blob (public fields
     only: the entry, its seal time by our clock, the proof sentence, the market line, the full fingerprint, the
     check address and the verbatim disclaimer), downloaded through a data: link. Light palette always. */
  var blob = document.getElementById('card-data');
  if (!blob) return;
  var D = JSON.parse(blob.textContent);
  var proofLabel = document.getElementById('card-proof');
  if (proofLabel) D.proof = proofLabel.textContent;
  var SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  var MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
  var INK = '#15171B', GRAPHITE = '#5A5F66', HAIR = '#D9D6CF', INDIGO = '#2E3F73';
  function wrap(g, text, maxW) {
    var words = text.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (line && g.measureText(t).width > maxW) { lines.push(line); line = words[i]; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function fit(g, text, weight, size, floor, family, maxW, maxLines) {
    var lines;
    for (;;) {
      g.font = weight + size + 'px ' + family;
      lines = wrap(g, text, maxW);
      if (lines.length <= maxLines || size <= floor) return { lines: lines, size: size };
      size -= 1;
    }
  }
  function text(g, t, x, y, weight, size, color, family) {
    g.font = weight + size + 'px ' + (family || SANS); g.fillStyle = color; g.fillText(t, x, y);
  }
  function draw() {
    var W = 1200, H = 630, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    g.fillStyle = '#F5F3EE'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#FBFAF7'; g.fillRect(64, 72, 340, 438);
    g.fillStyle = INDIGO; g.fillRect(64, 72, 8, 438);
    g.fillStyle = INDIGO; g.fillRect(64, 72, 24, 2); g.fillRect(64, 72, 2, 24); g.fillRect(380, 508, 24, 2); g.fillRect(402, 486, 2, 24);
    text(g, D.kicker, 96, 132, '600 ', 18, GRAPHITE);
    text(g, 'ENTRY', 96, 224, '600 ', 26, INK);
    text(g, D.seq4, 96, 324, '600 ', 76, INDIGO, MONO);
    text(g, D.pos, 96, 380, '', 22, GRAPHITE);
    g.fillStyle = HAIR; g.fillRect(96, 420, 244, 1);
    /* The seal sentence is printed once, in the reading column. */
    var X = 472, MW = 1136 - 472;
    text(g, D.kicker, X, 96, '', 22, GRAPHITE);
    var t = fit(g, D.title, '600 ', 40, 30, SANS, MW, 1);
    text(g, t.lines[0], X, 148, '600 ', t.size, INK);
    /* The week position belongs to the entry panel. */
    text(g, D.sealed, X, 232, '', 22, INK);
    var pf = fit(g, D.proof, '', 22, 18, SANS, MW, 1);
    text(g, pf.lines[0], X, 268, '', pf.size, GRAPHITE);
    var mk = fit(g, D.market, '600 ', 26, 20, SANS, MW, 2), y = 318;
    for (var l = 0; l < mk.lines.length; l++) { text(g, mk.lines[l], X, y, '600 ', mk.size, INK); y += 34; }
    if (D.interest) {
      var it = fit(g, D.interest, '', 22, 18, SANS, MW, 2);
      y += 4;
      for (var j = 0; j < it.lines.length; j++) { text(g, it.lines[j], X, y, '', it.size, INK); y += 30; }
    }
    var fpY = !D.market && !D.interest ? 332 : 444;
    text(g, D.fp, X, fpY, '', 18, GRAPHITE);
    text(g, D.hash.slice(0, 32), X, fpY + 32, '', 24, INK, MONO);
    text(g, D.hash.slice(32), X, fpY + 64, '', 24, INK, MONO);
    text(g, D.check_url, X, 540, '600 ', 15, INDIGO, SANS);
    g.fillStyle = HAIR; g.fillRect(64, 558, 1072, 1);
    var dc = fit(g, D.disclaimer, '', 15, 13, SANS, 1072, 3), yd = 582;
    for (var d = 0; d < dc.lines.length; d++) { text(g, dc.lines[d], 64, yd, '', dc.size, GRAPHITE); yd += 20; }
    if (D.preview) {
      g.font = '18px ' + SANS;
      var pw = g.measureText(D.preview).width + 24;
      g.strokeStyle = GRAPHITE; g.lineWidth = 1; g.strokeRect(1136 - pw + 0.5, 32.5, pw, 32);
      text(g, D.preview, 1136 - pw + 12, 55, '', 18, GRAPHITE);
    }
    var a = document.createElement('a');
    a.href = cv.toDataURL('image/png'); a.download = 'cycle-record-entry-' + D.seq4 + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  var bs = document.querySelectorAll('[data-card]');
  for (var q = 0; q < bs.length; q++) bs[q].addEventListener('click', function (e) { e.preventDefault(); draw(); });
})();
