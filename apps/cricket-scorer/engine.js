/* Cricket Scorer: the scoring engine (no DOM).  window.CRK
   A match is a config plus a list of events: openers, bowler and batter choices, balls, strike swaps,
   retirements, "end innings" and "super over". compute() replays every event from the start, so the
   whole score is always rebuilt from the ball list and Undo is simply "drop the last event".

   Laws followed (MCC Laws of Cricket, 2017 Code, 3rd edition 2022), plus the gully options in cfg.rules:
   - a wide or a no-ball is not one of the over (it is bowled again); its penalty run is an extra
     charged to the bowler (cfg.rules.wd / .nb: 1 run, or 0 for the gully "no run, just re-ball" rule)
   - runs off the bat from a no-ball go to the striker; byes / leg-byes from a no-ball stay byes / leg-byes
   - balls faced: legal balls and no-balls, never wides. Byes and leg-byes are not charged to the bowler
   - off a no-ball a batter can only be run out (or obstructing); off a wide also stumped / hit wicket
   - the batters change ends on an odd number of runs actually run (a 4 or 6 is even) and after every over
   - caught: the new batter comes in at the striker's end; run out: at the end where the wicket was broken
   - the match ends the moment the winning run is scored (a run out after it does not count)
   - free hit (ICC playing condition): after a no-ball; only a run out counts; it carries over a wide/no-ball
   - super over (ICC): 1 over and 2 wickets a side; the side that batted second bats first */
(function () {
  'use strict';
  var BPO = 6;                                   /* balls per over */
  var KINDS = ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', 'obstruct'];
  var BOWLER_CREDIT = { bowled: 1, caught: 1, lbw: 1, stumped: 1, hitwicket: 1 };
  var DEAD = BOWLER_CREDIT;                      /* no runs come from these balls (only a wide's penalty) */

  function int(v, lo, hi, d) {
    var n = Math.floor(Number(v));
    if (!isFinite(n)) return d;
    return n < lo ? lo : n > hi ? hi : n;
  }
  function str(v, max) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''; }

  function defaults() {
    return {
      v: 1, teams: [{ name: '', players: [] }, { name: '', players: [] }],
      pps: 6, overs: 5, toss: 0, decision: 'bat',
      rules: { wd: 1, nb: 1, freeHit: true, lastAlone: false, maxOv: 0 }
    };
  }

  /* a clean copy of any (possibly old or hand-edited) config */
  function sanitize(c) {
    c = c && typeof c === 'object' ? c : {};
    var d = defaults(), r = c.rules && typeof c.rules === 'object' ? c.rules : {};
    var pps = int(c.pps, 2, 11, d.pps);
    var teams = [0, 1].map(function (i) {
      var tm = c.teams && c.teams[i] && typeof c.teams[i] === 'object' ? c.teams[i] : {};
      var pl = Array.isArray(tm.players) ? tm.players : [], out = [];
      for (var j = 0; j < pps; j++) out.push(str(pl[j], 30));
      return { name: str(tm.name, 30), players: out };
    });
    return {
      v: 1, teams: teams, pps: pps,
      overs: Number(c.overs) === 0 ? 0 : int(c.overs, 1, 50, d.overs),
      toss: Number(c.toss) === 1 ? 1 : 0, decision: c.decision === 'bowl' ? 'bowl' : 'bat',
      rules: {
        wd: Number(r.wd) === 0 ? 0 : 1, nb: Number(r.nb) === 0 ? 0 : 1, freeHit: r.freeHit !== false,
        lastAlone: !!r.lastAlone, maxOv: int(r.maxOv, 0, 50, 0)
      }
    };
  }
  function firstBat(cfg) { return cfg.decision === 'bat' ? cfg.toss : 1 - cfg.toss; }

  function mkInn(cfg, idx, bat, target, sup) {
    return {
      idx: idx, bat: bat, bowl: 1 - bat, sup: !!sup,
      ovLimit: sup ? 1 : cfg.overs,                                  /* 0 = no limit */
      maxWk: sup ? 2 : (cfg.rules.lastAlone ? cfg.pps : cfg.pps - 1),
      target: target || 0,                                           /* runs needed to win (2nd innings) */
      runs: 0, wkts: 0, legal: 0, ex: { wd: 0, nb: 0, b: 0, lb: 0 },
      bt: [], bw: [],                     /* batters (batting order) and bowlers (bowling order) */
      s: -1, ns: -1,                      /* index in bt of the striker / non-striker (-1 = empty place) */
      bowler: -1, prevBowler: -1,         /* index in bw: bowling now / bowled the last completed over */
      ov: [], fow: [], ps: { r: 0, b: 0 },
      fh: false, alone: false, started: false, vacant: '', lastOut: -1,
      done: false, end: ''                /* end: allout | overs | target | manual */
    };
  }
  function mkBat(p, ord) { return { p: p, r: 0, b: 0, f4: 0, f6: 0, st: 'bat', how: null, ord: ord }; }
  function mkBw(p) { return { p: p, balls: 0, r: 0, w: 0, m: 0, wd: 0, nb: 0, dots: 0 }; }
  function findBt(inn, p) { for (var i = 0; i < inn.bt.length; i++) if (inn.bt[i].p === p) return i; return -1; }
  function findBw(inn, p) { for (var i = 0; i < inn.bw.length; i++) if (inn.bw[i].p === p) return i; return -1; }

  /* players of the batting side who can still come in: not batted yet, or retired hurt */
  function available(M, inn) {
    var out = [];
    for (var p = 0; p < M.cfg.pps; p++) {
      var i = findBt(inn, p);
      if (i < 0 || inn.bt[i].st === 'ret') out.push(p);
    }
    return out;
  }

  /* which dismissals the Laws allow on this ball */
  function allowedKinds(x, freeHit) {
    if (freeHit || x === 'nb' || x === 'b' || x === 'lb') return ['runout', 'obstruct'];
    if (x === 'wd') return ['stumped', 'hitwicket', 'runout', 'obstruct'];
    return KINDS.slice();
  }

  /* likely end of a run out: the batter is out at the end he/she was running to on the next run */
  function defaultEnd(who, runs) {
    var odd = runs % 2 === 1;
    return who === 'N' ? (odd ? 'N' : 'S') : (odd ? 'S' : 'N');
  }

  function swapEnds(inn) {
    var x = inn.s; inn.s = inn.ns; inn.ns = x;
    if (inn.vacant) inn.vacant = inn.vacant === 'S' ? 'N' : 'S';
  }

  function curOver(inn) {
    var last = inn.ov[inn.ov.length - 1];
    if (!last || last.done) {
      last = { n: inn.ov.length + 1, runs: 0, wk: 0, legal: 0, bwr: 0, balls: [], bowlers: [], done: false };
      inn.ov.push(last);
    }
    return last;
  }

  /* a batter's place is empty: bring the next one in, bat alone, or the innings is all out */
  function afterVacancy(M, inn, pos) {
    inn.vacant = '';
    if (inn.wkts >= inn.maxWk) { inn.done = true; inn.end = 'allout'; return; }
    if (available(M, inn).length) { inn.vacant = pos; return; }
    var other = pos === 'S' ? inn.ns : inn.s;
    if (M.cfg.rules.lastAlone && other >= 0) { inn.s = other; inn.ns = -1; inn.alone = true; return; }
    inn.done = true; inn.end = 'allout';
  }

  function open(M, inn, ev) {
    var n = M.cfg.pps, a = int(ev.s, 0, n - 1, -1), b = int(ev.n, 0, n - 1, -1);
    if (inn.started || a < 0 || b < 0 || a === b) { M.bad++; return; }
    inn.bt.push(mkBat(a, 1), mkBat(b, 2));
    inn.s = 0; inn.ns = 1; inn.started = true; inn.ps = { r: 0, b: 0 };
  }

  function setBowler(M, inn, ev) {
    var p = int(ev.p, 0, M.cfg.pps - 1, -1);
    if (!inn.started || p < 0) { M.bad++; return; }
    var i = findBw(inn, p);
    if (i < 0) { inn.bw.push(mkBw(p)); i = inn.bw.length - 1; }
    inn.bowler = i;
  }

  function newBatter(M, inn, ev) {
    var p = int(ev.p, 0, M.cfg.pps - 1, -1), i = p < 0 ? -1 : findBt(inn, p);
    if (!inn.vacant || p < 0 || (i >= 0 && inn.bt[i].st !== 'ret')) { M.bad++; return; }
    if (i < 0) { inn.bt.push(mkBat(p, inn.bt.length + 1)); i = inn.bt.length - 1; }
    inn.bt[i].st = 'bat'; inn.bt[i].how = null;
    if (inn.vacant === 'S') inn.s = i; else inn.ns = i;
    inn.vacant = ''; inn.ps = { r: 0, b: 0 };
  }

  function retire(M, inn, ev) {
    var pos = ev.who === 'N' ? 'N' : 'S', i = pos === 'S' ? inn.s : inn.ns;
    if (!inn.started || inn.vacant || i < 0) { M.bad++; return; }
    var b = inn.bt[i];
    if (ev.out) {
      b.st = 'out'; b.how = { k: 'retout', bw: -1, f: -1 }; inn.wkts++;
      inn.fow.push({ r: inn.runs, w: inn.wkts, p: b.p, balls: inn.legal });
    } else { b.st = 'ret'; b.how = { k: 'rethurt', bw: -1, f: -1 }; }
    if (pos === 'S') inn.s = -1; else inn.ns = -1;
    inn.alone = false; inn.lastOut = i; inn.ps = { r: 0, b: 0 };
    afterVacancy(M, inn, pos);
    if (inn.done) finish(M);
  }

  function ball(M, inn, ev) {
    if (!inn.started || inn.vacant || inn.bowler < 0 || inn.s < 0) { M.bad++; return; }
    var R = M.cfg.rules;
    var x = ['wd', 'nb', 'b', 'lb'].indexOf(ev.x) >= 0 ? ev.x : '';
    var r = int(ev.r, 0, 9, 0);
    var wide = x === 'wd', nb = x === 'nb', legal = !wide && !nb;
    var nbx = nb && (ev.nbx === 'b' || ev.nbx === 'lb') ? ev.nbx : '';
    var w = ev.w && typeof ev.w === 'object' && allowedKinds(x, inn.fh).indexOf(ev.w.k) >= 0 ? ev.w : null;
    if (w && DEAD[w.k]) r = 0;
    if ((x === 'b' || x === 'lb') && r < 1) x = '';           /* "0 byes" is just a dot ball */

    var pen = wide ? R.wd : nb ? R.nb : 0, bat = 0, bye = 0, lb = 0, wd = 0;
    if (x === '') bat = r; else if (x === 'b') bye = r; else if (x === 'lb') lb = r; else if (wide) wd = r;
    else if (nbx === 'b') bye = r; else if (nbx === 'lb') lb = r; else bat = r;
    /* the winning hit: only the runs needed count, unless it is a boundary (Law 16.6) */
    if (inn.target > 0 && r !== 4 && r !== 6) {
      var over = inn.runs + pen + bat + bye + lb + wd - inn.target;
      if (over > 0) {
        var cut = Math.min(over, bat + bye + lb + wd);
        if (bat) bat -= cut; else if (bye) bye -= cut; else if (lb) lb -= cut; else wd -= cut;
        r -= cut;
      }
    }
    var total = pen + bat + bye + lb + wd;
    var sI = inn.s, nI = inn.ns, st = inn.bt[sI], bw = inn.bw[inn.bowler], ov = curOver(inn), fhWas = inn.fh;

    inn.runs += total;
    if (wide) inn.ex.wd += pen + wd;
    if (nb) inn.ex.nb += pen;
    inn.ex.b += bye; inn.ex.lb += lb;
    if (!wide) { st.b++; inn.ps.b++; }
    st.r += bat;
    if (bat === 4) st.f4++; else if (bat === 6) st.f6++;
    var bwr = bat + (wide ? pen + wd : 0) + (nb ? pen : 0);
    bw.r += bwr;
    if (wide) bw.wd++;
    if (nb) bw.nb++;
    if (legal) { bw.balls++; inn.legal++; ov.legal++; if (total === 0) bw.dots++; }
    inn.ps.r += total; ov.runs += total; ov.bwr += bwr;
    if (ov.bowlers.indexOf(inn.bowler) < 0) ov.bowlers.push(inn.bowler);

    var won = inn.target > 0 && inn.runs >= inn.target;
    if (won) w = null;                                         /* the winning run ends the match */
    ov.balls.push({ x: x, r: r, nbx: nbx, w: w ? w.k : '', fh: fhWas, t: total, bw: inn.bowler });

    /* odd runs actually run: the batters have crossed */
    if ((bat + bye + lb + wd) % 2 === 1 && !inn.alone && nI >= 0) swapEnds(inn);

    if (w) {
      var outI = (w.k === 'runout' || w.k === 'obstruct') && w.who === 'N' && nI >= 0 ? nI : sI;
      var notI = outI === sI ? nI : sI, ob = inn.bt[outI], pos = 'S';
      ob.st = 'out';
      ob.how = { k: w.k, bw: BOWLER_CREDIT[w.k] ? bw.p : -1, f: int(w.f, -1, M.cfg.pps - 1, -1) };
      inn.wkts++; ov.wk++;
      if (BOWLER_CREDIT[w.k]) bw.w++;
      inn.fow.push({ r: inn.runs, w: inn.wkts, p: ob.p, balls: inn.legal });
      if (w.k === 'runout' || w.k === 'obstruct') {
        pos = w.end === 'N' && notI >= 0 ? 'N' : 'S';
        if (pos === 'S') { inn.s = -1; inn.ns = notI; } else { inn.ns = -1; inn.s = notI; }
      } else inn.s = -1;
      inn.alone = false; inn.lastOut = outI; inn.ps = { r: 0, b: 0 };
      afterVacancy(M, inn, pos);
    }

    if (nb && R.freeHit) inn.fh = true;
    else if (legal) inn.fh = false;                            /* a wide keeps a waiting free hit */

    if (legal && inn.legal % BPO === 0) {
      if (ov.legal === BPO && ov.bowlers.length === 1 && ov.bwr === 0) bw.m++;
      ov.done = true;
      inn.prevBowler = inn.bowler;
      inn.bowler = -1;
      if (!inn.alone) swapEnds(inn);
    }

    if (won) { inn.done = true; inn.end = 'target'; }
    else if (!inn.done && inn.ovLimit && inn.legal >= inn.ovLimit * BPO) { inn.done = true; inn.end = 'overs'; }
    if (inn.done) finish(M);
  }

  /* an innings is over: start the next one or decide the match */
  function finish(M) {
    var k = M.cur, inn = M.inns[k];
    inn.vacant = '';
    if (k % 2 === 0) {
      M.inns.push(mkInn(M.cfg, k + 1, inn.bowl, inn.runs + 1, inn.sup));
      M.cur = k + 1;
      return;
    }
    var a = M.inns[k - 1], b = inn, res;
    if (b.runs > a.runs) res = { type: 'wkts', win: b.bat, n: Math.max(0, b.maxWk - b.wkts), balls: b.ovLimit ? Math.max(0, b.ovLimit * BPO - b.legal) : -1 };
    else if (b.runs < a.runs) res = { type: 'runs', win: a.bat, n: a.runs - b.runs };
    else res = { type: 'tie', win: -1 };
    if (b.sup) { res.sup = true; if (res.type !== 'tie') res.type = 'super'; }
    if (res.type === 'tie') M.ties++;
    M.result = res; M.done = true;
  }

  function startSuper(M) {
    if (!M.done || !M.result || M.result.type !== 'tie') { M.bad++; return; }
    var prev = M.inns[M.inns.length - 1], k = M.inns.length;
    M.inns.push(mkInn(M.cfg, k, prev.bat, 0, true));
    M.cur = k; M.result = null; M.done = false;
  }

  function step(M, ev) {
    var inn = M.inns[M.cur];
    if (ev.t === 'super') return startSuper(M);
    if (M.done || inn.done) { M.bad++; return; }
    switch (ev.t) {
      case 'open': return open(M, inn, ev);
      case 'bowl': return setBowler(M, inn, ev);
      case 'bat': return newBatter(M, inn, ev);
      case 'ball': return ball(M, inn, ev);
      case 'retire': return retire(M, inn, ev);
      case 'swap':
        if (inn.started && !inn.vacant && inn.s >= 0 && inn.ns >= 0) swapEnds(inn); else M.bad++;
        return;
      case 'end':
        if (!inn.started) { M.bad++; return; }
        inn.done = true; inn.end = 'manual'; finish(M);
        return;
    }
    M.bad++;
  }

  /* what the scorer has to do next */
  function need(M) {
    if (M.done) return { k: M.result.type === 'tie' ? 'tie' : 'done' };
    var inn = M.inns[M.cur];
    if (!inn.started) return { k: 'open' };
    if (inn.vacant) return { k: 'bat', pos: inn.vacant };
    if (inn.bowler < 0) return { k: 'bowl' };
    return { k: 'ball' };
  }

  function compute(cfgIn, events) {
    var cfg = sanitize(cfgIn);
    var M = { cfg: cfg, inns: [], cur: 0, result: null, done: false, ties: 0, bad: 0, n: 0 };
    M.inns.push(mkInn(cfg, 0, firstBat(cfg), 0, false));
    (Array.isArray(events) ? events : []).forEach(function (ev) {
      if (ev && typeof ev === 'object') step(M, ev); else M.bad++;
      M.n++;
    });
    M.need = need(M);
    return M;
  }

  /* ------------------------------------------------------------ small helpers for the page */
  function oversText(legal) { return Math.floor(legal / BPO) + (legal % BPO ? '.' + (legal % BPO) : ''); }
  function rate(runs, legal) { return legal > 0 ? runs * BPO / legal : null; }
  function ballsLeft(inn) { return inn.ovLimit ? Math.max(0, inn.ovLimit * BPO - inn.legal) : -1; }
  /* short ball notation: • 1 4 6 W wd wd+1 nb nb+4 2b 1lb 1+W */
  function label(c) {
    var s;
    if (c.x === 'wd') s = 'wd' + (c.r ? '+' + c.r : '');
    else if (c.x === 'nb') s = 'nb' + (c.r ? '+' + c.r + (c.nbx || '') : '');
    else if (c.x === 'b' || c.x === 'lb') s = c.r + c.x;
    else s = c.r ? String(c.r) : (c.w ? '' : '•');
    return c.w ? (s ? s + '+W' : 'W') : s;
  }

  window.CRK = {
    BPO: BPO, KINDS: KINDS, BOWLER_CREDIT: BOWLER_CREDIT,
    defaults: defaults, sanitize: sanitize, firstBat: firstBat, compute: compute,
    available: available, allowedKinds: allowedKinds, defaultEnd: defaultEnd,
    oversText: oversText, rate: rate, ballsLeft: ballsLeft, label: label
  };
})();
