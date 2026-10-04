/* Makes WebM recordings seekable: browsers write WebM from MediaRecorder without a Duration,
   so players show "--:--" and cannot jump around. This adds Segment > Info > Duration, the same fix as
   the fix-webm-duration package (MIT), but it only reads and rewrites the first few KB of the file and
   keeps the rest as a Blob slice, so even multi-GB recordings are fixed instantly without copying them.
   window.SR_fixWebmDuration(blob, durationMs) -> Promise<Blob> (the original blob if anything is unusual). */
(function () {
  'use strict';
  var ID_EBML = 0x1A45DFA3, ID_SEGMENT = 0x18538067, ID_INFO = 0x1549A966, ID_SEEKHEAD = 0x114D9B74,
    ID_SEEK = 0x4DBB, ID_SEEKPOS = 0x53AC, ID_CLUSTER = 0x1F43B675, ID_SCALE = 0x2AD7B1, ID_DURATION = 0x4489;

  /* EBML variable-length integer at pos. IDs keep their length marker; sizes drop it. */
  function vint(b, pos, keepMarker) {
    var first = b[pos];
    if (first === undefined || first === 0) return null;
    var len = 1, mask = 0x80;
    while (!(first & mask)) { len++; mask >>= 1; }
    if (pos + len > b.length) return null;
    var value = keepMarker ? first : (first & (mask - 1));
    var allOnes = (first & (mask - 1)) === (mask - 1);
    for (var i = 1; i < len; i++) { value = value * 256 + b[pos + i]; if (b[pos + i] !== 0xFF) allOnes = false; }
    return { len: len, value: value, unknown: !keepMarker && allOnes };
  }
  function vintLen(v) { var len = 1; while (len < 8 && v >= Math.pow(2, 7 * len) - 1) len++; return len; }
  function encSize(v, len) {
    var out = new Uint8Array(len);
    for (var i = len - 1; i >= 0; i--) { out[i] = v % 256; v = Math.floor(v / 256); }
    out[0] |= (0x80 >> (len - 1));
    return out;
  }
  function readUint(b, pos, size) { var v = 0; for (var i = 0; i < size; i++) v = v * 256 + b[pos + i]; return v; }
  function writeUint(b, pos, size, v) {
    if (v >= Math.pow(2, 8 * size)) return false;
    for (var i = size - 1; i >= 0; i--) { b[pos + i] = v % 256; v = Math.floor(v / 256); }
    return true;
  }
  function concat(parts) {
    var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }
  /* Calls fn(id, dataStart, size, elementStart) for every child in [start, end). Returns false on bad data. */
  function children(b, start, end, fn) {
    var p = start;
    while (p < end) {
      var id = vint(b, p, true); if (!id) return false;
      var sz = vint(b, p + id.len, false); if (!sz) return false;
      var data = p + id.len + sz.len;
      if (fn(id.value, data, sz.unknown ? -1 : sz.value, p) === false) return true;
      if (sz.unknown) return true;
      p = data + sz.value;
    }
    return true;
  }

  function fix(blob, ms) {
    if (!blob || !blob.size || !(ms > 0)) return Promise.resolve(blob);
    var headLen = Math.min(blob.size, 256 * 1024);
    return blob.slice(0, headLen).arrayBuffer().then(function (ab) {
      var b = new Uint8Array(ab);
      var id = vint(b, 0, true); if (!id || id.value !== ID_EBML) return blob;
      var sz = vint(b, id.len, false); if (!sz || sz.unknown) return blob;
      var p = id.len + sz.len + sz.value;
      id = vint(b, p, true); if (!id || id.value !== ID_SEGMENT) return blob;
      var segSizePos = p + id.len, seg = vint(b, segSizePos, false); if (!seg) return blob;
      var segData = segSizePos + seg.len;

      var info = null, seekHeads = [];
      children(b, segData, b.length, function (cid, data, size, start) {
        if (cid === ID_INFO) { if (size >= 0) info = { start: start, data: data, size: size, end: data + size }; return false; }
        if (cid === ID_SEEKHEAD && size >= 0) seekHeads.push({ data: data, end: data + size });
        if (cid === ID_CLUSTER || size < 0) return false;
      });
      if (!info || info.end > b.length) return blob;

      var scale = 1000000, dur = null;
      if (!children(b, info.data, info.end, function (cid, data, size) {
        if (size < 0) return false;
        if (cid === ID_SCALE) scale = readUint(b, data, size) || 1000000;
        else if (cid === ID_DURATION) dur = { pos: data, size: size };
      })) return blob;
      var value = ms * 1000000 / scale;

      if (dur) {                                   /* a Duration exists: fill it in place if it is empty */
        if (dur.size !== 8 && dur.size !== 4) return blob;
        var head = b.slice(0, info.end), dv = new DataView(head.buffer);
        var old = dur.size === 8 ? dv.getFloat64(dur.pos) : dv.getFloat32(dur.pos);
        if (old > 0 && isFinite(old)) return blob;
        if (dur.size === 8) dv.setFloat64(dur.pos, value); else dv.setFloat32(dur.pos, value);
        return new Blob([head, blob.slice(info.end)], { type: blob.type });
      }

      /* No Duration (what Chrome and Edge write): rebuild Info with one added. */
      var durEl = new Uint8Array(11); durEl[0] = 0x44; durEl[1] = 0x89; durEl[2] = 0x88;
      new DataView(durEl.buffer).setFloat64(3, value);
      var newSize = info.size + durEl.length;
      var oldSizeLen = info.data - info.start - 4;
      var newInfo = concat([new Uint8Array([0x15, 0x49, 0xA9, 0x66]), encSize(newSize, Math.max(oldSizeLen, vintLen(newSize))), b.subarray(info.data, info.end), durEl]);
      var delta = newInfo.length - (info.end - info.start);

      var segHead;
      if (seg.unknown) segHead = b.slice(0, segData);
      else {
        var ns = seg.value + delta;
        segHead = concat([b.subarray(0, segSizePos), encSize(ns, Math.max(seg.len, vintLen(ns)))]);
      }
      /* Anything between the Segment start and Info (a SeekHead) points at later elements: shift those. */
      var mid = b.slice(segData, info.start), infoRel = info.start - segData;
      seekHeads.forEach(function (sh) {
        children(b, sh.data, sh.end, function (cid, data, size) {
          if (cid !== ID_SEEK || size < 0) return;
          children(b, data, data + size, function (gid, gdata, gsize) {
            if (gid !== ID_SEEKPOS || gsize < 1 || gsize > 8) return;
            var pos = readUint(b, gdata, gsize);
            if (pos > infoRel) writeUint(mid, gdata - segData, gsize, pos + delta);
          });
        });
      });
      return new Blob([segHead, mid, newInfo, blob.slice(info.end)], { type: blob.type });
    }).catch(function () { return blob; });
  }

  window.SR_fixWebmDuration = fix;
})();
