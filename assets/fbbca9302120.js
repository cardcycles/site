var CCSeal = (function () {
  'use strict';
  var DAY = 86400000;
  var GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function utf8Encode(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  }
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256Bytes(bytes) {
    var len = bytes.length;
    var padLen = ((len + 9 + 63) >> 6) << 6;
    var msg = new Uint8Array(padLen);
    msg.set(bytes);
    msg[len] = 0x80;
    var bitHi = Math.floor(len / 0x20000000);
    var bitLo = (len << 3) >>> 0;
    msg[padLen - 8] = (bitHi >>> 24) & 255; msg[padLen - 7] = (bitHi >>> 16) & 255;
    msg[padLen - 6] = (bitHi >>> 8) & 255; msg[padLen - 5] = bitHi & 255;
    msg[padLen - 4] = (bitLo >>> 24) & 255; msg[padLen - 3] = (bitLo >>> 16) & 255;
    msg[padLen - 2] = (bitLo >>> 8) & 255; msg[padLen - 1] = bitLo & 255;
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var W = new Array(64);
    for (var off = 0; off < padLen; off += 64) {
      var t;
      for (t = 0; t < 16; t++) {
        var j = off + t * 4;
        W[t] = (msg[j] << 24) | (msg[j + 1] << 16) | (msg[j + 2] << 8) | msg[j + 3];
      }
      for (t = 16; t < 64; t++) {
        var w15 = W[t - 15], w2 = W[t - 2];
        var s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
        var s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + W[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (var i = 0; i < 8; i++) hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }
  function sha256(input) {
    if (typeof input === 'string') return sha256Bytes(utf8Encode(input));
    if (input instanceof Uint8Array) return sha256Bytes(input);
    if (Array.isArray(input)) return sha256Bytes(new Uint8Array(input));
    throw new Error('sha256: input must be a string, Uint8Array or byte array');
  }
  function bytesToHex(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += ('0' + bytes[i].toString(16)).slice(-2);
    return s;
  }
  function nfc(s) { return (typeof s.normalize === 'function') ? s.normalize('NFC') : s; }
  function cmpCodePoints(a, b) {
    var i = 0, j = 0;
    while (i < a.length && j < b.length) {
      var ca = a.codePointAt(i), cb = b.codePointAt(j);
      if (ca !== cb) return ca < cb ? -1 : 1;
      i += ca > 0xffff ? 2 : 1; j += cb > 0xffff ? 2 : 1;
    }
    if (i < a.length) return 1;
    if (j < b.length) return -1;
    return 0;
  }
  function canonicalJSON(v) {
    if (v === null) return 'null';
    var t = typeof v;
    if (t === 'boolean') return v ? 'true' : 'false';
    if (t === 'number') {
      if (!isFinite(v)) throw new Error('canonicalJSON: non-finite number');
      return JSON.stringify(v);
    }
    if (t === 'string') return JSON.stringify(nfc(v));
    if (t === 'undefined') throw new Error('canonicalJSON: undefined is not allowed');
    if (Array.isArray(v)) {
      var parts = [];
      for (var i = 0; i < v.length; i++) parts.push(canonicalJSON(v[i]));
      return '[' + parts.join(',') + ']';
    }
    if (t === 'object') {
      var ks = Object.keys(v), pairs = [], seen = {};
      for (var k = 0; k < ks.length; k++) {
        var nk = nfc(ks[k]);
        if (Object.prototype.hasOwnProperty.call(seen, nk)) throw new Error('canonicalJSON: duplicate key after NFC: ' + nk);
        seen[nk] = true;
        if (typeof v[ks[k]] === 'undefined') throw new Error('canonicalJSON: undefined value for key ' + nk);
        pairs.push({ k: nk, v: v[ks[k]] });
      }
      pairs.sort(function (a, b) { return cmpCodePoints(a.k, b.k); });
      var out = [];
      for (var q = 0; q < pairs.length; q++) out.push(JSON.stringify(pairs[q].k) + ':' + canonicalJSON(pairs[q].v));
      return '{' + out.join(',') + '}';
    }
    throw new Error('canonicalJSON: unsupported type ' + t);
  }
  function toMs(x) {
    if (x instanceof Date) return x.getTime();
    if (typeof x === 'number') return x;
    if (typeof x === 'string') { var m = Date.parse(x); return isNaN(m) ? NaN : m; }
    return NaN;
  }
  return { DAY: DAY, GENESIS: GENESIS, sha256: sha256, canonicalJSON: canonicalJSON, toMs: toMs };
})();
