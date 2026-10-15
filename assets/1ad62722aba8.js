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

var CCToolGuard = (function () {
  'use strict';
  var MAX_BYTES = 5 * 1024 * 1024, MAX_DEPTH = 24, MAX_NODES = 20000;
  var MAX_STRING = 4096, MAX_ITEMS = 5000, MAX_HORIZON = 3650, MAX_NUMBER_CHARS = 80;
  var HEX32 = /^[0-9a-f]{32}$/, HEX64 = /^[0-9a-f]{64}$/;
  var UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3})?Z$/;
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function plain(o) { if (!o || Object.prototype.toString.call(o) !== '[object Object]') return false; var p = Object.getPrototypeOf(o); return p === Object.prototype || p === null; }
  function utf8Length(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
    return unescape(encodeURIComponent(s)).length;
  }
  function nfc(s) { return String(s).normalize ? String(s).normalize('NFC') : String(s); }
  function normalizedText(value, max, allowEmpty) {
    if (typeof value !== 'string') return { ok: false, code: 'text_type' };
    var out = nfc(value.trim());
    if (out !== value.trim()) return { ok: false, code: 'text_nfc' };
    if ((!allowEmpty && !out) || out.length > max) return { ok: false, code: 'text_length' };
    return { ok: true, value: out };
  }
  function exactKeys(o, keys) {
    if (!plain(o)) return false;
    var got = Object.keys(o).sort(), want = keys.slice().sort();
    if (got.length !== want.length) return false;
    for (var i = 0; i < got.length; i++) if (got[i] !== want[i]) return false;
    return true;
  }
  var selftestPromise = null;
  function strictUtc(s) {
    if (typeof s !== 'string' || !UTC.test(s)) return null;
    var ms = Date.parse(s); if (!Number.isFinite(ms)) return null;
    var full = new Date(ms).toISOString();
    if (s !== full && s !== full.replace('.000Z', 'Z')) return null;
    return ms;
  }
  function scanJSON(text, byteLimit) {
    if (typeof text !== 'string') return { ok: false, code: 'json_type' };
    if (utf8Length(text) > (byteLimit || MAX_BYTES)) return { ok: false, code: 'json_bytes' };
    var depth = 0, nodes = 0, inString = false, escaped = false, stringLength = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = false; continue; }
        stringLength++; if (stringLength > MAX_STRING * 6) return { ok: false, code: 'json_string' };
        continue;
      }
      if (ch === '"') { inString = true; stringLength = 0; nodes++; }
      else if (ch === '{' || ch === '[') { depth++; nodes++; if (depth > MAX_DEPTH) return { ok: false, code: 'json_depth' }; }
      else if (ch === '}' || ch === ']') { depth--; if (depth < 0) return { ok: false, code: 'json_syntax' }; }
      else if (ch === '-' || /[0-9]/.test(ch)) {
        var m = text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (!m) return { ok: false, code: 'json_number' };
        var token = m[0], next = text.charAt(i + token.length);
        if (next && !/[\s,}\]]/.test(next)) return { ok: false, code: 'json_number' };
        if (/[.eE]/.test(token) || token === '-0') return { ok: false, code: 'json_number' };
        if (!Number.isSafeInteger(Number(token))) return { ok: false, code: 'json_number' };
        nodes++; i += token.length - 1;
      } else if (ch === 't' || ch === 'f' || ch === 'n') nodes++;
      if (nodes > MAX_NODES) return { ok: false, code: 'json_nodes' };
    }
    return !inString && depth === 0 ? { ok: true } : { ok: false, code: 'json_syntax' };
  }
  function validateTree(root) {
    var stack = [{ value: root, depth: 0 }], nodes = 0;
    while (stack.length) {
      var cur = stack.pop(), v = cur.value; nodes++;
      if (nodes > MAX_NODES || cur.depth > MAX_DEPTH) return { ok: false, code: 'json_complex' };
      if (typeof v === 'string') {
        if (v.length > MAX_STRING || nfc(v) !== v) return { ok: false, code: 'json_string' };
      } else if (typeof v === 'number') {
        if (!Number.isSafeInteger(v) || Object.is(v, -0)) return { ok: false, code: 'json_number' };
      } else if (Array.isArray(v)) {
        if (v.length > MAX_ITEMS) return { ok: false, code: 'json_items' };
        for (var i = 0; i < v.length; i++) stack.push({ value: v[i], depth: cur.depth + 1 });
      } else if (v !== null && typeof v === 'object') {
        if (!plain(v)) return { ok: false, code: 'json_object' };
        var keys = Object.keys(v); if (keys.length > MAX_ITEMS) return { ok: false, code: 'json_items' };
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].length > 128 || nfc(keys[k]) !== keys[k]) return { ok: false, code: 'json_key' };
          stack.push({ value: v[keys[k]], depth: cur.depth + 1 });
        }
      } else if (typeof v !== 'boolean' && v !== null) return { ok: false, code: 'json_value' };
    }
    return { ok: true };
  }
  function parseBounded(text, byteLimit) {
    var before = scanJSON(text, byteLimit); if (!before.ok) return before;
    var value; try { value = JSON.parse(text); } catch (e) { return { ok: false, code: 'json_syntax' }; }
    var after = validateTree(value); if (!after.ok) return after;
    return { ok: true, value: value };
  }
  function selftestVectors() {
    if (selftestPromise) return selftestPromise;
    try {
      var value = typeof CCSelftestVectors === 'undefined' ? null : CCSelftestVectors;
      if (!plain(value) || !exactKeys(value, ['core', 'tool']) || !Array.isArray(value.core) ||
          !Array.isArray(value.tool) || value.core.length > 256 || value.tool.length > 256) {
        throw new Error('self-test vectors');
      }
      selftestPromise = Promise.resolve(value);
    } catch (error) {
      selftestPromise = Promise.reject(error);
      selftestPromise.catch(function () { selftestPromise = null; });
    }
    return selftestPromise;
  }
  return {MAX_BYTES: MAX_BYTES, MAX_ITEMS: MAX_ITEMS, plain: plain, exactKeys: exactKeys, hex64: function(s){return typeof s === 'string' && HEX64.test(s);}, strictUtc: strictUtc, parseBounded: parseBounded, selftestVectors: selftestVectors};
})();

var CCSelftestVectors = {"core":[{"name":"canonical: non-BMP keys in Unicode code point order","kind":"canonical","input":{"":1,"𐀀":2},"bytes":"{\"\":1,\"𐀀\":2}","sha256":"8706b5798a29d65739b3d1bbb1d009f87d005c71c8130c5353c4990c15ddfec8"},{"name":"canonical: sorted keys, NFC, no spaces","kind":"canonical","input":{"seq":1,"b":"Pokémon","a":[2,"x"]},"bytes":"{\"a\":[2,\"x\"],\"b\":\"Pokémon\",\"seq\":1}","sha256":"e161cd42a3ae7666bf140226d762488d303d0c047231975fc558c529e82dba5a"},{"name":"canonical: salted item","kind":"canonical","input":{"content":{"reading":"example","value":"+25.3"},"salt":"0000000000000000000000000000000000000000000000000000000000000000"},"bytes":"{\"content\":{\"reading\":\"example\",\"value\":\"+25.3\"},\"salt\":\"0000000000000000000000000000000000000000000000000000000000000000\"}","sha256":"f11c7fbff92603b51b816aa68b1aee2fd525eb6b6378f9044912dbfe8631204e"},{"name":"chain step from sixty-four zeros","kind":"text","input":"0000000000000000000000000000000000000000000000000000000000000000:e161cd42a3ae7666bf140226d762488d303d0c047231975fc558c529e82dba5a","sha256":"3c5d96f9d5a830231024bdf644d67bb0051dddc27fdaf62469290f4df9ef0668"},{"name":"SHA-256 of the empty string","kind":"text","input":"","sha256":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"name":"SHA-256 of abc","kind":"text","input":"abc","sha256":"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"},{"name":"SHA-256 quick brown fox","kind":"text","input":"The quick brown fox jumps over the lazy dog","sha256":"d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"},{"name":"SHA-256 two-block message","kind":"text","input":"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq","sha256":"248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"},{"name":"SHA-256 exactly one block","kind":"text","input":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sha256":"ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb"},{"name":"SHA-256 multibyte UTF-8","kind":"text","input":"café","sha256":"850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e"},{"name":"SHA-256 one million a","kind":"repeat","input":["a",1000000],"sha256":"cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0"}],"tool":[]};
var CCVerifyData = {"copy-check":{"_r10.verify.saved.diverged":"The first divergent entry is Entry {check.seq4}.","_r10.verify.saved.extended":"Today\u2019s record matches your saved entries.","_r10.verify.saved.head_mismatch":"Today\u2019s record does not extend that chain fingerprint.","_r10.verify.saved.invalid":"Paste a full chain fingerprint or a valid saved record.json.","_r10.verify.saved.same":"Your saved chain fingerprint is today\u2019s chain head.","_r12.verify.meaning":"The entry and the fingerprint on this site agree.","_r23.verify.quick.item":"Matches the sealed fingerprint for {check.item_label} in Entry {check.seq4}.","_r8.verify.canonical":"Canonical-object SHA-256","_r8.verify.canonical.note":"This checks the same JSON object after the record\u2019s canonical formatting rules.","_r8.verify.quick.date":"Sealed {check.sealed_human}, by our clock.","_r8.verify.quick.match":"Matches the fingerprint this site publishes for Entry {check.seq4}.","_r8.verify.quick.nomatch":"Does not match. The text and fingerprint do not belong together.","_r8.verify.raw":"Raw-file SHA-256","_r8.verify.raw.note":"This checks the exact bytes in the file.","check.selftest.fail":"{selftest.failed} of {selftest.n} checks failed. Don\u2019t rely on this copy of the page.","check.selftest.pass":"All {selftest.n} checks passed.","global.disclaimer":"CardCycles provides educational market analytics and risk intelligence, not financial, investment, tax, or legal advice. CardCycles is unofficial and is not affiliated with The Pok\u00e9mon Company, Nintendo, Creatures, or Game Freak.","verify.chain.fail":"The full chain through this entry did not validate.","verify.chain.pass":"Every canonical entry and chain link through this entry validates.","verify.content.match":"The recomputed fingerprint exactly matches all 64 expected characters.","verify.content.mismatch":"The recomputed fingerprint does not match the expected fingerprint.","verify.expected.invalid":"Enter exactly 64 lowercase hexadecimal characters for the expected fingerprint.","verify.input.empty":"Paste or choose one JSON object to check.","verify.input.invalid":"This JSON is malformed, too complex, or outside the canonical bounds.","verify.input.too_large":"This file is larger than the local safety limit.","verify.input.unsupported":"This object cannot be represented by the canonical integer-or-text rules.","verify.membership.correction":"This entry corrects Entry {check.corrects_seq4}; the earlier entry remains in the record.","verify.membership.entry":"Exact public entry match: Entry {check.seq4}.","verify.membership.item":"Exact sealed-item match: {check.item_label} in Entry {check.seq4}.","verify.membership.none":"No exact public-record membership was found.","verify.opening.fail":"The opening-event record did not validate.","verify.opening.none":"No opening event is recorded for this sealed item.","verify.opening.pass":"The append-only opening event matches this commitment; first published {opening.first_published_at}.","verify.prefilled":"Filled in from Entry {check.seq4}.","verify.proof.not_verified":"Independent timestamp not verified for this entry.","verify.trace.chain":"Chain relationship","verify.trace.content":"Content fingerprint","verify.trace.membership":"Record membership","verify.trace.opening":"Opening event","verify.trace.proof":"Proof state","verify.trace.title":"Verification trace"},"opening-events":[{"entry_seq":1,"event_fingerprint":"ab2714da3c3809bb129a9798df04399a63a1068fb6169dde48a47ca1aaa66bf4","event_seq":1,"first_published_at":"2026-10-15T16:02:09Z","item_label":"Sealed item A","prior_event_fingerprint":"0000000000000000000000000000000000000000000000000000000000000000","reveal_fingerprint":"8e64f1c2c6a3c3e898cbbf084792079694ec8d0432508beb93273a6163ed4d8c","schema":"cycle-record-opening/1"},{"entry_seq":2,"event_fingerprint":"bb18bf1ad3c7558c456e6fcecd0454f3204da9317f4bb42457a3fe87a485864a","event_seq":2,"first_published_at":"2026-10-15T16:02:09Z","item_label":"Sealed item A","prior_event_fingerprint":"ab2714da3c3809bb129a9798df04399a63a1068fb6169dde48a47ca1aaa66bf4","reveal_fingerprint":"5a873132c262552edae9fe9a5386cc9a5e12fcd8c30064e35eb6f3637830a9e8","schema":"cycle-record-opening/1"}],"openings-meta":{"count":2,"head_fingerprint":"bb18bf1ad3c7558c456e6fcecd0454f3204da9317f4bb42457a3fe87a485864a","schema":"cycle-record-opening-list/1"},"record-index":[{"chain_hash":"e92ca30642fe61edc7937ac8ff898393127169dd6170257ff1f2fa86a7e859ca","entry_hash":"59b3f4701f1de341bc0e50365e61bdf2fc36d77486db71a449a357c83b739267","prev_chain_hash":"0000000000000000000000000000000000000000000000000000000000000000","proof":{"attested_at":"2026-10-15T07:36:21Z","completed_on":"2026-10-15","entry_sha256":"59b3f4701f1de341bc0e50365e61bdf2fc36d77486db71a449a357c83b739267","ots":true,"pending_reason":null,"proof_sha256":"d46c3908dde1b461383731539d567570aa58a23b5088246fa91fe1ef5a5e0c1b","requested_on":"2026-10-15","state":"complete","verification":"verified","verified":true,"verified_on":"2026-10-15","verifier":"explorers"},"sealed_human":"October 10, 2026, 04:38 UTC","seq":1,"seq4":"0001","text":"{\"corrects\":null,\"missed_weeks\":[],\"notes\":[\"INSUFFICIENT_DATA\"],\"prev_chain_hash\":\"0000000000000000000000000000000000000000000000000000000000000000\",\"schema\":\"cycle-record/1\",\"sealed_at\":\"2026-10-10T04:38:06Z\",\"sealed_items\":[{\"label\":\"Sealed item A\",\"sha256\":\"8e64f1c2c6a3c3e898cbbf084792079694ec8d0432508beb93273a6163ed4d8c\"},{\"label\":\"Sealed item B\",\"sha256\":\"84301ff75bf97bb41db7dbd22210eaaca0537d81415ff0b273316ed6f2341f1c\"},{\"label\":\"Sealed item C\",\"sha256\":\"82d9bc64d85e2c1e5864a6a624c016760728ebd614f2cb252cffafd3ab8162d6\"},{\"label\":\"Private seal\",\"sha256\":\"75cbd80630d304373eec5b7ebedbfccf03fecac1dc8bb91e2d2276078c35b51a\"}],\"seq\":1,\"week_start\":\"2026-10-05\"}"},{"chain_hash":"62bac39e300ef04cd69efe4ac9a2da80d58191d60eb5d0f87b7a8dd004372904","entry_hash":"946d1b678290f0a15f74ef232e7c5e36395bda66901f118af7fcc98cce5de122","prev_chain_hash":"e92ca30642fe61edc7937ac8ff898393127169dd6170257ff1f2fa86a7e859ca","proof":{"attested_at":"2026-10-15T07:36:21Z","completed_on":"2026-10-15","entry_sha256":"946d1b678290f0a15f74ef232e7c5e36395bda66901f118af7fcc98cce5de122","ots":true,"pending_reason":null,"proof_sha256":"05e23724b8aa4263d282e0debded769920577cae7b388b2dcf6651cf4c5a6150","requested_on":"2026-10-15","state":"complete","verification":"verified","verified":true,"verified_on":"2026-10-15","verifier":"explorers"},"sealed_human":"October 12, 2026, 23:49 UTC","seq":2,"seq4":"0002","text":"{\"corrects\":null,\"missed_weeks\":[],\"notes\":[\"INSUFFICIENT_DATA\"],\"prev_chain_hash\":\"e92ca30642fe61edc7937ac8ff898393127169dd6170257ff1f2fa86a7e859ca\",\"schema\":\"cycle-record/1\",\"sealed_at\":\"2026-10-12T23:49:56Z\",\"sealed_items\":[{\"label\":\"Sealed item A\",\"sha256\":\"5a873132c262552edae9fe9a5386cc9a5e12fcd8c30064e35eb6f3637830a9e8\"},{\"label\":\"Sealed item B\",\"sha256\":\"84e7ce2672b37d5dac79de3965e0e8b3b5c22c9598781c3cd5a17613fef06e37\"},{\"label\":\"Sealed item C\",\"sha256\":\"29abf4118e58aff85bc693cbcd91a30fd5dcb8ff6dfd2c641b4347698cc7c0ca\"},{\"label\":\"Private seal\",\"sha256\":\"1807fcdfd105f56ba0a2bf295c23df976798a83d097a54ab7c52fc052d54e36f\"}],\"seq\":2,\"week_start\":\"2026-10-12\"}"}]};
/* verify-runtime */
(function () {
  'use strict';
  var S = CCSeal, G = CCToolGuard;
  var C = CCVerifyData['copy-check'];
  var proofLabel = document.getElementById('verify-proof-complete');
  C['verify.proof.verified'] = proofLabel ? proofLabel.textContent : '';
  var R = CCVerifyData['record-index'];
  var O = CCVerifyData['opening-events'];
  var OM = CCVerifyData['openings-meta'];
  var ta = document.getElementById('paste'), exp = document.getElementById('expected');
  var out = document.getElementById('result'), quick = document.getElementById('quick-result'), pre = document.getElementById('prefilled');
  var followup = document.getElementById('quick-followup');
  function fill(t, m) { return t.replace(/\{([a-z0-9_.]+)\}/g, function (all, k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : all; }); }
  function groups(h) { return h.replace(/(.{4})(?=.)/g, '$&\u2009'); }
  var quickMode = false;
  function reveal() { out.hidden = false; quick.hidden = !quickMode; followup.hidden = !quickMode; var target = quickMode ? quick : out; try { target.scrollIntoView({block:'center'}); } catch (e) {} try { target.focus({preventScroll:true}); } catch (e) { target.focus(); } }
  function quickResult(key, values, date) {
    quick.textContent = ''; quick.className = 'result ' + (key === '_r8.verify.quick.nomatch' ? 'no' : 'ok');
    var p = document.createElement('p'); p.className = 'head'; p.textContent = fill(C[key], values || {}); quick.appendChild(p);
    if (date) { var d = document.createElement('p'); d.textContent = fill(C['_r8.verify.quick.date'], { 'check.sealed_human': date }); quick.appendChild(d); }
  }
  function error(key) { out.textContent = ''; out.className = 'result no'; var p = document.createElement('p'); p.className = 'head'; p.textContent = C[key]; out.appendChild(p); quickResult('_r8.verify.quick.nomatch'); reveal(); }
  function row(list, label, text, pass) {
    var li = document.createElement('li'), b = document.createElement('b'), p = document.createElement('p');
    b.textContent = label; p.textContent = text; if (pass) p.className = 'pass'; li.appendChild(b); li.appendChild(p); list.appendChild(li);
  }
  var ITEM_LABELS = ['Sealed item A', 'Sealed item B', 'Sealed item C', 'Private seal'];
  function recordEntry(r) {
    var parsed = G.parseBounded(r.text, 256 * 1024), e = parsed.ok ? parsed.value : null;
    if (!G.plain(e) || !G.exactKeys(e, ['corrects', 'missed_weeks', 'notes', 'prev_chain_hash', 'schema',
        'sealed_at', 'sealed_items', 'seq', 'week_start']) || e.schema !== 'cycle-record/1' || e.seq !== r.seq ||
        e.prev_chain_hash !== r.prev_chain_hash || !Array.isArray(e.sealed_items) || e.sealed_items.length !== 4 ||
        !G.hex64(r.entry_hash) || !G.hex64(r.chain_hash) || !G.hex64(r.prev_chain_hash)) return null;
    for (var j = 0; j < e.sealed_items.length; j++) {
      var item = e.sealed_items[j];
      if (!G.exactKeys(item, ['label', 'sha256']) || item.label !== ITEM_LABELS[j] || !G.hex64(item.sha256)) return null;
    }
    var canonical;
    try { canonical = S.canonicalJSON(e); } catch (err) { return null; }
    return canonical === r.text && S.sha256(canonical) === r.entry_hash ? e : null;
  }
  function find(fp) {
    for (var i = 0; i < R.length; i++) {
      var entry = recordEntry(R[i]); if (!entry) continue;
      if (R[i].entry_hash === fp) return { kind: 'entry', record: R[i], entry: entry };
      for (var j = 0; j < entry.sealed_items.length; j++) if (entry.sealed_items[j].sha256 === fp) {
        return { kind: 'item', record: R[i], entry: entry, item: entry.sealed_items[j] };
      }
    }
    return null;
  }
  function chainThrough(target) {
    var prev = S.GENESIS;
    for (var i = 0; i < R.length; i++) {
      var r = R[i], entry = recordEntry(r);
      if (!entry || r.seq !== i + 1 || entry.seq !== i + 1 || r.prev_chain_hash !== prev ||
          entry.prev_chain_hash !== prev) return false;
      var ch = S.sha256(prev + ':' + r.entry_hash);
      if (ch !== r.chain_hash) return false;
      prev = ch; if (r.seq === target.seq) return true;
    }
    return false;
  }
  function proofComplete(r) {
    var p = r && r.proof;
    return !!(p && p.state === 'complete' && p.verified === true && p.verification === 'verified' &&
      p.entry_sha256 === r.entry_hash && G.hex64(p.proof_sha256));
  }
  function openingState(hit) {
    var prior = S.GENESIS, seen = {}, target = null;
    if (!Array.isArray(O) || O.length > G.MAX_ITEMS || !G.exactKeys(OM, ['schema', 'count', 'head_fingerprint']) || OM.schema !== 'cycle-record-opening-list/1' ||
        !Number.isSafeInteger(OM.count) || OM.count !== O.length || !G.hex64(OM.head_fingerprint)) return { ok: false };
    for (var i = 0; i < O.length; i++) {
      var e = O[i];
      if (!G.exactKeys(e, ['schema', 'event_seq', 'entry_seq', 'item_label', 'reveal_fingerprint', 'first_published_at', 'prior_event_fingerprint', 'event_fingerprint']) ||
          e.schema !== 'cycle-record-opening/1' || e.event_seq !== i + 1 || !Number.isSafeInteger(e.entry_seq) ||
          ['Sealed item A', 'Sealed item B', 'Sealed item C'].indexOf(e.item_label) < 0 || !G.hex64(e.reveal_fingerprint) ||
          G.strictUtc(e.first_published_at) === null || e.prior_event_fingerprint !== prior || !G.hex64(e.event_fingerprint)) return { ok: false };
      var event = { schema: e.schema, event_seq: e.event_seq, entry_seq: e.entry_seq, item_label: e.item_label,
        reveal_fingerprint: e.reveal_fingerprint, first_published_at: e.first_published_at,
        prior_event_fingerprint: e.prior_event_fingerprint };
      var efp = S.sha256(S.canonicalJSON(event)); if (efp !== e.event_fingerprint) return { ok: false };
      var key = e.entry_seq + ':' + e.item_label; if (seen[key]) return { ok: false }; seen[key] = true;
      var rec = null, recEntry = null; for (var q = 0; q < R.length; q++) if (R[q].seq === e.entry_seq) { rec = R[q]; recEntry = recordEntry(rec); }
      var item = null; if (recEntry) for (var z = 0; z < recEntry.sealed_items.length; z++) if (recEntry.sealed_items[z].label === e.item_label) item = recEntry.sealed_items[z];
      if (!item || item.sha256 !== e.reveal_fingerprint) return { ok: false };
      if (hit && hit.record.seq === e.entry_seq && hit.item.label === e.item_label && hit.item.sha256 === e.reveal_fingerprint) target = e;
      prior = efp;
    }
    if (OM.head_fingerprint !== prior) return { ok: false };
    return { ok: true, event: target };
  }
  function expected() { var want = exp.value.trim(); return !want || G.hex64(want) ? want : null; }
  function renderTrace(rawFp, fp, want, obj, hit, wrapper) {
    out.textContent = ''; out.className = 'result';
    var title = document.createElement('p'); title.className = 'head'; title.textContent = C['verify.trace.title']; out.appendChild(title);
    var code = document.createElement('p'); code.className = 'fp'; code.textContent = groups(fp); out.appendChild(code);
    var list = document.createElement('ol'); list.className = 'trace'; out.appendChild(list);
    var publicFp = hit && (hit.kind === 'entry' ? hit.record.entry_hash : hit.item.sha256);
    var comparison = want || publicFp;
    var contentOK = !!comparison && fp === comparison, rawOK = !!comparison && rawFp === comparison;
    row(list, C['_r8.verify.raw'], groups(rawFp) + ' — ' + C['_r8.verify.raw.note'], rawOK);
    row(list, C['_r8.verify.canonical'], groups(fp) + ' — ' + C['_r8.verify.canonical.note'], contentOK);
    var rec = hit && hit.record, memberOK = !!hit, membership = C['verify.membership.none'];
    if (hit && hit.kind === 'entry') membership = fill(C['verify.membership.entry'], { 'check.seq4': hit.record.seq4 });
    else if (hit && hit.kind === 'item') membership = fill(C['verify.membership.item'], { 'check.item_label': hit.item.label, 'check.seq4': hit.record.seq4 });
    if (rec && hit.entry.corrects !== null && hit.entry.corrects !== undefined) membership += ' ' + fill(C['verify.membership.correction'], { 'check.corrects_seq4': String(hit.entry.corrects).padStart(4, '0') });
    row(list, C['verify.trace.membership'], membership, memberOK);
    var chainOK = rec ? chainThrough(rec) : false;
    row(list, C['verify.trace.chain'], rec ? (chainOK ? C['verify.chain.pass'] : C['verify.chain.fail']) : C['verify.membership.none'], chainOK);
    var proofOK = rec ? proofComplete(rec) : false;
    row(list, C['verify.trace.proof'], proofOK ? C['verify.proof.verified'] : C['verify.proof.not_verified'], proofOK);
    if (hit && hit.kind === 'item') {
      var os = openingState(hit);
      row(list, C['verify.trace.opening'], !os.ok ? C['verify.opening.fail'] : (os.event ? fill(C['verify.opening.pass'], { 'opening.first_published_at': os.event.first_published_at }) : C['verify.opening.none']), !!(os.ok && os.event));
      if (!os.ok) chainOK = false;
    }
    var ok = contentOK && memberOK && chainOK;
    var verdictKey = '_r8.verify.quick.nomatch', verdictValues = {}, verdictDate = null;
    if (ok && hit && hit.kind === 'entry') { verdictKey = '_r8.verify.quick.match'; verdictValues = {'check.seq4':hit.record.seq4}; verdictDate = hit.record.sealed_human; }
    else if (ok && hit && hit.kind === 'item') { verdictKey = '_r23.verify.quick.item'; verdictValues = {'check.seq4':hit.record.seq4,'check.item_label':hit.item.label}; }
    var verdict = document.createElement('p'); verdict.className = 'head'; verdict.textContent = fill(C[verdictKey],verdictValues);
    out.insertBefore(verdict,out.firstChild);
    out.className = 'result ' + (ok ? 'ok' : 'no');
    quickResult(verdictKey,verdictValues,verdictDate);
    reveal();
  }
  function check() {
    var want = expected(); if (want === null) { error('verify.expected.invalid'); exp.focus(); return; }
    var text = ta.value; if (!text.trim()) { error('verify.input.empty'); ta.focus(); return; }
    var parsed = G.parseBounded(text);
    if (!parsed.ok) { error(parsed.code === 'json_bytes' ? 'verify.input.too_large' : 'verify.input.invalid'); return; }
    var obj = parsed.value, reveal = obj, wrapper = false;
    var fp, rawFp;
    try { rawFp = S.sha256(text); fp = S.sha256(S.canonicalJSON(reveal)); } catch (e) { error('verify.input.unsupported'); return; }
    if (reveal && reveal.type === 'call') { error('verify.input.invalid'); return; }
    renderTrace(rawFp, fp, want, reveal, find(fp), wrapper);
  }
  document.getElementById('check').addEventListener('click', function () { quickMode = false; check(); });
  document.getElementById('clear').addEventListener('click', function () { quickMode = false; ta.value = ''; exp.value = ''; out.textContent = ''; out.hidden = true; quick.textContent = ''; quick.hidden = true; followup.hidden = true; pre.hidden = true; ta.focus(); });
  ta.addEventListener('input', function () { pre.hidden = true; });
  function loadFile(file) {
    quickMode = false;
    if (!file) return; if (file.size > G.MAX_BYTES) { error('verify.input.too_large'); return; }
    var reader = new FileReader(); reader.onload = function () { ta.value = String(reader.result); pre.hidden = true; check(); }; reader.readAsText(file);
  }
  var fi = document.getElementById('file'), dz = document.getElementById('drop');
  fi.addEventListener('change', function () { loadFile(fi.files && fi.files[0]); fi.value = ''; });
  ['dragenter', 'dragover'].forEach(function (name) { dz.addEventListener(name, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (name) { dz.addEventListener(name, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
  dz.addEventListener('drop', function (e) { loadFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
  function prefill(s4, show) { quickMode = true;
    var r = null; for (var i = 0; i < R.length; i++) if (R[i].seq4 === s4) r = R[i];
    if (!r) return; ta.value = r.text; exp.value = r.entry_hash; pre.textContent = fill(C['verify.prefilled'], { 'check.seq4': r.seq4 }); pre.hidden = false; if (show) check();
  }
  function fromHash() { var m = /^#entry-(\d{4})$/.exec(location.hash); if (m) { prefill(m[1], true); } }
  var tryBtn = document.getElementById('try'); if (tryBtn) tryBtn.addEventListener('click', function () { prefill(tryBtn.getAttribute('data-seq4'), true); });
  fromHash(); window.addEventListener('hashchange', fromHash);
  var savedText = document.getElementById('saved-record'), savedFile = document.getElementById('saved-file');
  var savedOut = document.getElementById('saved-result');
  function savedMessage(key, values, ok) {
    savedOut.textContent = fill(C[key], values || {}); savedOut.className = 'result ' + (ok ? 'ok' : 'no');
    savedOut.hidden = false; savedOut.focus();
  }
  function compareSaved() {
    var raw = savedText.value.trim();
    if (/^[0-9a-f]{64}$/.test(raw)) {
      for (var h = 0; h < R.length; h++) if (R[h].chain_hash === raw) {
        savedMessage(h === R.length - 1 ? '_r10.verify.saved.same' : '_r10.verify.saved.extended', {}, true); return;
      }
      savedMessage('_r10.verify.saved.head_mismatch', {}, false); return;
    }
    var parsed = G.parseBounded(raw), doc = parsed.ok ? parsed.value : null;
    if (!G.plain(doc) || doc.schema !== 'cycle-record-list/1' || !Array.isArray(doc.entries) || !doc.entries.length || doc.entries.length > G.MAX_ITEMS) {
      savedMessage('_r10.verify.saved.invalid', {}, false); return;
    }
    var saved = doc.entries.slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
    var savedPrev = S.GENESIS;
    for (var i = 0; i < saved.length; i++) {
      var expectedSeq = i + 1, current = R[i], item = saved[i], entry = item && item.entry;
      var entryHash = null, chainHash = null;
      if (G.plain(item) && item.schema === 'cycle-record-envelope/1' && item.seq === expectedSeq && G.plain(entry) &&
          G.exactKeys(entry, ['corrects', 'missed_weeks', 'notes', 'prev_chain_hash', 'schema', 'sealed_at',
            'sealed_items', 'seq', 'week_start']) && entry.schema === 'cycle-record/1' && entry.seq === expectedSeq &&
          entry.prev_chain_hash === savedPrev && Array.isArray(entry.sealed_items) && entry.sealed_items.length === 4) {
        var savedItemsValid = true;
        for (var si = 0; si < entry.sealed_items.length; si++) {
          var savedItem = entry.sealed_items[si];
          if (!G.exactKeys(savedItem, ['label', 'sha256']) || savedItem.label !== ITEM_LABELS[si] || !G.hex64(savedItem.sha256)) {
            savedItemsValid = false; break;
          }
        }
        if (savedItemsValid) try {
          entryHash = S.sha256(S.canonicalJSON(entry)); chainHash = S.sha256(savedPrev + ':' + entryHash);
        } catch (savedError) { entryHash = null; chainHash = null; }
      }
      if (!G.hex64(item && item.entry_hash) || !G.hex64(item && item.chain_hash) || entryHash !== item.entry_hash ||
          chainHash !== item.chain_hash || !current || current.seq !== expectedSeq ||
          current.entry_hash !== entryHash || current.chain_hash !== chainHash) {
        savedMessage('_r10.verify.saved.diverged', { 'check.seq4': String(expectedSeq).padStart(4, '0') }, false); return;
      }
      savedPrev = chainHash;
    }
    savedMessage('_r10.verify.saved.extended', {}, true);
  }
  if (savedText.value.trim() || (typeof location !== 'undefined' && location.hash === '#saved-copy')) document.getElementById('saved-copy').open = true;
  document.getElementById('saved-check').addEventListener('click', compareSaved);
  savedFile.addEventListener('change', function () {
    var file = savedFile.files && savedFile.files[0]; if (!file || file.size > G.MAX_BYTES) { savedMessage('_r10.verify.saved.invalid', {}, false); return; }
    var reader = new FileReader(); reader.onload = function () { savedText.value = String(reader.result); compareSaved(); };
    reader.onerror = function () { savedMessage('_r10.verify.saved.invalid', {}, false); }; reader.readAsText(file); savedFile.value = '';
  });
  document.getElementById('run-selftest').addEventListener('click', function () {
    var button = this, box = document.getElementById('selftest'); button.disabled = true;
    G.selftestVectors(button).then(function (vectors) {
      var V = vectors.core, TV = vectors.tool, n = 0, failed = 0;
      for (var i = 0; i < V.length; i++) { var v = V[i], h; n++; try { if (v.kind === 'canonical') { var c = S.canonicalJSON(v.input); h = c === v.bytes ? S.sha256(c) : 'bytes differ'; } else if (v.kind === 'repeat') h = S.sha256(new Array(v.input[1] + 1).join(v.input[0])); else h = S.sha256(v.input); } catch (e) { h = 'error'; } if (h !== v.sha256) failed++; }
      box.querySelector('.res').textContent = failed ? fill(C['check.selftest.fail'], { 'selftest.failed': String(failed), 'selftest.n': String(n) }) : fill(C['check.selftest.pass'], { 'selftest.n': String(n) }); box.hidden = false;
    }).catch(function () {
      box.querySelector('.res').textContent = fill(C['check.selftest.fail'], { 'selftest.failed': '1', 'selftest.n': '1' }); box.hidden = false;
    }).then(function () { button.disabled = false; });
  });
})();
