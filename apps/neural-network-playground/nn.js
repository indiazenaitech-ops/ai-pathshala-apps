/* Tiny neural network engine for the Neural Network Playground.
   Pure JavaScript, no libraries: data sets, input features, a small multi-layer
   perceptron with back-propagation and mini-batch gradient descent.
   Classic script: sets window.NN (and module.exports when run in Node for testing). */
(function (root) {
  'use strict';

  /* ---------- seeded random numbers (same seed = same data) ---------- */
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(r) {
    var u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  function shuffleInPlace(arr, r) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; }
    return arr;
  }

  /* ---------- data sets: points in [-6, 6] x [-6, 6]; label -1 = orange, +1 = blue ---------- */
  var RANGE = 6;
  function genData(kind, n, noise, seed) {
    var r = rng(seed), pts = [], i;
    noise = Math.max(0, Math.min(0.5, noise || 0));
    function uni(a, b) { return a + (b - a) * r(); }
    if (kind === 'blobs') {
      var sd = Math.sqrt(0.5 + (noise / 0.5) * 3.5);           // variance 0.5 → 4
      for (i = 0; i < n; i++) {
        var lb = i % 2 ? 1 : -1, c = lb > 0 ? 2 : -2;
        pts.push({ x: c + normal(r) * sd, y: c + normal(r) * sd, label: lb });
      }
    } else if (kind === 'circle') {
      var R = 5;
      for (i = 0; i < n; i++) {
        var inner = i % 2 === 0;
        var rr = inner ? uni(0, R * 0.5) : uni(R * 0.7, R);
        var ang = uni(0, 2 * Math.PI);
        var x = rr * Math.sin(ang), y = rr * Math.cos(ang);
        var nx = uni(-R, R) * noise, ny = uni(-R, R) * noise;    // noise can flip labels near the edge
        pts.push({ x: x, y: y, label: Math.sqrt((x + nx) * (x + nx) + (y + ny) * (y + ny)) < R * 0.5 ? 1 : -1 });
      }
    } else if (kind === 'xor') {
      var pad = 0.3;
      for (i = 0; i < n; i++) {
        var px = uni(-5, 5), py = uni(-5, 5);
        px += px > 0 ? pad : -pad; py += py > 0 ? pad : -pad;
        var qx = px + uni(-5, 5) * noise, qy = py + uni(-5, 5) * noise;
        pts.push({ x: px, y: py, label: qx * qy >= 0 ? 1 : -1 });
      }
    } else if (kind === 'spiral') {
      var half = Math.floor(n / 2);
      [[0, 1], [Math.PI, -1]].forEach(function (s) {
        for (var k = 0; k < half; k++) {
          var rad = k / half * 5, th = 1.75 * k / half * 2 * Math.PI + s[0];
          pts.push({ x: rad * Math.sin(th) + uni(-1, 1) * noise * 2, y: rad * Math.cos(th) + uni(-1, 1) * noise * 2, label: s[1] });
        }
      });
    }
    return shuffleInPlace(pts, r);
  }

  /* ---------- input features ---------- */
  var S = 1 / 3;     // scale so typical inputs are about -2..2
  var FEATURES = [
    { id: 'x1', label: 'x₁', f: function (x) { return x * S; } },
    { id: 'x2', label: 'x₂', f: function (x, y) { return y * S; } },
    { id: 'x1sq', label: 'x₁²', f: function (x) { return x * S * x * S; } },
    { id: 'x2sq', label: 'x₂²', f: function (x, y) { return y * S * y * S; } },
    { id: 'x1x2', label: 'x₁x₂', f: function (x, y) { return x * S * y * S; } },
    { id: 'sin1', label: 'sin(x₁)', f: function (x) { return Math.sin(x); } },
    { id: 'sin2', label: 'sin(x₂)', f: function (x, y) { return Math.sin(y); } }
  ];
  function featureFns(ids) {
    return FEATURES.filter(function (f) { return ids.indexOf(f.id) >= 0; });
  }
  function makeInput(fns, x, y, out) {
    out = out || new Float64Array(fns.length);
    for (var i = 0; i < fns.length; i++) out[i] = fns[i].f(x, y);
    return out;
  }

  /* ---------- activation functions (derivative uses z and/or a = f(z)) ---------- */
  var ACT = {
    relu: { f: function (z) { return z > 0 ? z : 0; }, d: function (z) { return z > 0 ? 1 : 0; } },
    tanh: { f: Math.tanh, d: function (z, a) { return 1 - a * a; } },
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); } },
    linear: { f: function (z) { return z; }, d: function () { return 1; } }
  };

  /* ---------- the network: sizes = [inputs, hidden..., 1]; output neuron uses tanh ---------- */
  function Net(sizes, act, seed) {
    this.sizes = sizes.slice();
    this.act = ACT[act] ? act : 'tanh';
    var r = rng(seed || 1), L = sizes.length;
    this.W = []; this.B = []; this.gW = []; this.gB = [];
    this.Z = []; this.A = []; this.D = [];
    for (var l = 0; l < L; l++) {
      this.Z.push(new Float64Array(sizes[l]));
      this.A.push(new Float64Array(sizes[l]));
      this.D.push(new Float64Array(sizes[l]));
    }
    for (l = 1; l < L; l++) {
      var nIn = sizes[l - 1], nOut = sizes[l];
      var lim = Math.sqrt(6 / (nIn + nOut));                    // Xavier / Glorot uniform
      var w = new Float64Array(nIn * nOut), b = new Float64Array(nOut);
      for (var k = 0; k < w.length; k++) w[k] = (r() * 2 - 1) * lim;
      for (k = 0; k < nOut; k++) b[k] = (this.act === 'relu' && l < L - 1) ? 0.1 : 0;
      this.W.push(w); this.B.push(b);
      this.gW.push(new Float64Array(w.length)); this.gB.push(new Float64Array(nOut));
    }
    this.batchCount = 0;
  }
  /* weight from neuron i (layer l-1) to neuron j (layer l) is W[l-1][j * sizes[l-1] + i] */
  Net.prototype.weight = function (l, i, j) { return this.W[l - 1][j * this.sizes[l - 1] + i]; };

  Net.prototype.forward = function (input) {
    var L = this.sizes.length, A = this.A, Z = this.Z, f = ACT[this.act].f;
    for (var i = 0; i < this.sizes[0]; i++) A[0][i] = input[i];
    for (var l = 1; l < L; l++) {
      var nIn = this.sizes[l - 1], nOut = this.sizes[l], w = this.W[l - 1], b = this.B[l - 1], prev = A[l - 1];
      var last = l === L - 1;
      for (var j = 0; j < nOut; j++) {
        var s = b[j], off = j * nIn;
        for (i = 0; i < nIn; i++) s += w[off + i] * prev[i];
        Z[l][j] = s;
        A[l][j] = last ? Math.tanh(s) : f(s);
      }
    }
    return A[L - 1][0];
  };

  /* add the gradient for one example (after forward) */
  Net.prototype.backward = function (target) {
    var L = this.sizes.length, A = this.A, Z = this.Z, D = this.D, d = ACT[this.act].d;
    var o = A[L - 1][0];
    D[L - 1][0] = (o - target) * (1 - o * o);                   // dLoss/dz for loss = ½(o − y)²
    for (var l = L - 1; l >= 1; l--) {
      var nIn = this.sizes[l - 1], nOut = this.sizes[l], w = this.W[l - 1], gw = this.gW[l - 1], gb = this.gB[l - 1];
      var prev = A[l - 1];
      for (var j = 0; j < nOut; j++) {
        var dj = D[l][j], off = j * nIn;
        gb[j] += dj;
        for (var i = 0; i < nIn; i++) gw[off + i] += dj * prev[i];
      }
      if (l > 1) {
        for (i = 0; i < nIn; i++) {
          var s = 0;
          for (j = 0; j < nOut; j++) s += w[j * nIn + i] * D[l][j];
          D[l - 1][i] = s * d(Z[l - 1][i], A[l - 1][i]);
        }
      }
    }
    this.batchCount++;
  };

  Net.prototype.update = function (lr) {
    if (!this.batchCount) return;
    var k = lr / this.batchCount;
    for (var l = 0; l < this.W.length; l++) {
      var w = this.W[l], gw = this.gW[l], b = this.B[l], gb = this.gB[l], i;
      for (i = 0; i < w.length; i++) { w[i] -= k * gw[i]; gw[i] = 0; }
      for (i = 0; i < b.length; i++) { b[i] -= k * gb[i]; gb[i] = 0; }
    }
    this.batchCount = 0;
  };

  Net.prototype.isBroken = function () {
    for (var l = 0; l < this.W.length; l++) {
      for (var i = 0; i < this.W[l].length; i++) if (!isFinite(this.W[l][i]) || Math.abs(this.W[l][i]) > 1e6) return true;
      for (i = 0; i < this.B[l].length; i++) if (!isFinite(this.B[l][i])) return true;
    }
    return false;
  };

  /* inputs: array of Float64Array (precomputed features), labels: array of ±1 */
  Net.prototype.trainEpoch = function (inputs, labels, lr, batch, r) {
    var n = inputs.length;
    if (!n) return;
    var order = [];
    for (var i = 0; i < n; i++) order.push(i);
    shuffleInPlace(order, r || Math.random);
    for (i = 0; i < n; i++) {
      this.forward(inputs[order[i]]);
      this.backward(labels[order[i]]);
      if ((i + 1) % batch === 0 || i === n - 1) this.update(lr);
    }
  };

  /* mean loss ½(o − y)² and accuracy (sign matches label) */
  Net.prototype.evaluate = function (inputs, labels) {
    var n = inputs.length, loss = 0, ok = 0;
    if (!n) return { loss: NaN, acc: NaN, n: 0 };
    for (var i = 0; i < n; i++) {
      var o = this.forward(inputs[i]), e = o - labels[i];
      loss += 0.5 * e * e;
      if ((o >= 0 ? 1 : -1) === labels[i]) ok++;
    }
    return { loss: loss / n, acc: ok / n, n: n };
  };

  var NN = { rng: rng, genData: genData, shuffle: shuffleInPlace, FEATURES: FEATURES, featureFns: featureFns, makeInput: makeInput, ACT: ACT, Net: Net, RANGE: RANGE };
  root.NN = NN;
  if (typeof module !== 'undefined' && module.exports) module.exports = NN;
})(typeof window !== 'undefined' ? window : this);
