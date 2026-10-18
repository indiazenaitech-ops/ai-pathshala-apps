/* Carrom: rules, scoring and the computer player (no DOM). Uses CRPHYS (physics.js).
   Simplified common Indian rules, close to the ICF / AICF laws:
   - The breaker plays white; players take turns to break, so colours swap every board.
   - Pocket your own coin: shoot again. Pocket the other side's coin: it stays pocketed and your turn ends.
   - The queen must be covered: pocket one of your own coins in the same shot or the next shot, else she goes back
     to the centre. House rule (on by default, as in the ICF laws): the queen counts only after your first own coin.
   - Striker in a pocket = foul: your turn ends and one of your pocketed coins comes back to the centre
     (owed until you have one). The queen pocketed in that shot also comes back.
   - A side cannot finish while the queen is still on the board: its last coin comes back to the centre.
   - Board: the side that pockets all its coins first wins 1 point per coin the other side still has on the board,
     plus the queen points if the winner covered the queen.
   CRRULES.MATCH, newMatch(mode, opts), newBoard(M), resolve(M, events), placeStriker(M, x), aiPlan / aiStep / aiPick */
(function (root) {
  'use strict';
  var P = root.CRPHYS || (typeof require === 'function' ? require('./physics.js') : null);
  var B = P.B;

  var MATCH = {
    short: { boards: 3, target: 0, queen: 3, limit: 0 },     /* family: 3 boards, most points wins */
    icf: { boards: 8, target: 25, queen: 3, limit: 22 },     /* ICF / AICF: 25 points or 8 boards; no queen points at 22+ */
    club: { boards: 8, target: 29, queen: 5, limit: 24 }     /* older club rules: 29 points, queen 5; none at 24+ */
  };
  var MODES = ['pvp', 'cpu', 'practice'];

  function sideOf(player) { return player === 0 ? 1 : -1; }   /* player 1 at the bottom, player 2 at the top */
  function other(c) { return c === 'w' ? 'b' : 'w'; }

  function newMatch(mode, opts) {
    opts = opts || {};
    var M = {
      v: 1, mode: MODES.indexOf(mode) >= 0 ? mode : 'pvp',
      opts: { match: MATCH[opts.match] ? opts.match : 'short', queenFirst: opts.queenFirst !== false, level: opts.level || 'medium' },
      scores: [0, 0], boards: [], boardNo: 1, over: false, winner: null, board: null
    };
    M.board = newBoard(M);
    return M;
  }

  function newBoard(M) {
    var breaker = M.mode === 'practice' ? 0 : (M.boardNo - 1) % 2;
    var colors = breaker === 0 ? ['w', 'b'] : ['b', 'w'];
    var pieces = P.rack(sideOf(breaker));
    pieces.push(P.piece('s', 's', 0, sideOf(breaker) * B.BASE_Y));
    var b = {
      pieces: pieces, turn: breaker, breaker: breaker, colors: colors,
      queen: { st: 'on', by: null }, due: { w: 0, b: 0 }, shots: 0, shotsBy: [0, 0], fouls: 0,
      breakDone: false, breakTries: 0, over: false, result: null, last: null, strikerX: [0, 0], seq: 0
    };
    M.board = b;
    placeStriker(M, 0);
    return b;
  }

  function onBoard(b, k) { var n = 0; b.pieces.forEach(function (p) { if (p.on && p.k === k) n++; }); return n; }
  function offBoard(b, k) { var n = 0; b.pieces.forEach(function (p) { if (!p.on && p.k === k) n++; }); return n; }
  function striker(b) { return P.strikerOf({ p: b.pieces }); }

  /* nearest free spot to the centre (rings around it), for coins and the queen that come back */
  function placeFree(b, piece) {
    var others = b.pieces.filter(function (p) { return p.on && p !== piece && p.k !== 's'; });
    function free(x, y) {
      for (var i = 0; i < others.length; i++) {
        var o = others[i], dx = o.x - x, dy = o.y - y, rr = o.r + piece.r + 0.03;
        if (dx * dx + dy * dy < rr * rr) return false;
      }
      return Math.abs(x) <= B.HALF - piece.r && Math.abs(y) <= B.HALF - piece.r;
    }
    var spot = null;
    if (free(0, 0)) spot = [0, 0];
    for (var rad = 0.5; !spot && rad < 34; rad += 0.5) {
      var n = Math.max(6, Math.round(2 * Math.PI * rad / 0.6));
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 2 * Math.PI, x = rad * Math.cos(a), y = rad * Math.sin(a);
        if (free(x, y)) { spot = [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]; break; }
      }
    }
    if (!spot) spot = [0, 0];
    piece.on = true; piece.pk = -1; piece.x = spot[0]; piece.y = spot[1]; piece.vx = 0; piece.vy = 0;
    return piece;
  }
  function bringBack(b, k, order) {
    /* the coin pocketed most recently comes back first */
    var cands = b.pieces.filter(function (p) { return !p.on && p.k === k; });
    if (!cands.length) return null;
    cands.sort(function (x, y) { return (order[y.id] || 0) - (order[x.id] || 0); });
    return placeFree(b, cands[0]);
  }

  function placeStriker(M, x) {
    var b = M.board, s = striker(b), side = sideOf(b.turn);
    s.on = true; s.pk = -1; s.vx = 0; s.vy = 0; s.y = side * B.BASE_Y;
    var want = x === undefined ? b.strikerX[b.turn] : x;
    var fx = P.fitStriker(b.pieces, side, want);
    s.x = fx === null ? 0 : fx;
    return s;
  }

  /* After a shot comes to rest: apply the rules. events = world.ev of that shot. */
  function resolve(M, events) {
    var b = M.board, me = b.turn, practice = M.mode === 'practice';
    var c = b.colors[me], o = other(c), cfg = MATCH[M.opts.match];
    var order = b.order || (b.order = {});
    var inIds = [], strikerIn = false, ownIn = 0, oppIn = 0, queenIn = false, touched = false;
    events.forEach(function (e) {
      if (e.type === 'pocket') {
        inIds.push(e.id); order[e.id] = ++b.seq;
        if (e.k === 's') strikerIn = true;
        else if (e.k === 'q') queenIn = true;
        else if (practice || e.k === c) ownIn++;
        else oppIn++;
      } else if (e.type === 'hit' && (e.ka === 's' || e.kb === 's')) touched = true;
    });
    var msgs = [], again = false, res = { player: me, color: c, pocketed: inIds, foul: strikerIn, ownIn: ownIn, oppIn: oppIn, queenIn: queenIn, msgs: msgs };
    b.shots++; b.shotsBy[me]++;
    if (strikerIn) b.fouls++;

    /* the break: it counts only when the striker touches a coin; up to 3 tries, then the other player breaks */
    if (!b.breakDone && !practice) {
      if (!touched && !inIds.length) {
        b.breakTries++;
        if (b.breakTries < 3) { msgs.push(['break_again', { n: 3 - b.breakTries }]); again = true; }
        else { msgs.push(['break_pass']); b.breakDone = true; }
        return finish(M, res, again);
      }
      b.breakDone = true;
    }

    if (practice) {
      if (queenIn) msgs.push(['p_queen']);
      if (ownIn) msgs.push(['p_in', { n: ownIn + (queenIn ? 1 : 0) }]);
      if (strikerIn) {
        b.due.w++;
        msgs.push(['foul_striker_p']);
      }
      while (b.due.w > 0) {
        var back = bringBack(b, 'w', order) || bringBack(b, 'b', order) || bringBack(b, 'q', order);
        if (!back) break;
        b.due.w--; msgs.push(['coin_back', { k: back.k }]);
      }
      if (onBoard(b, 'w') + onBoard(b, 'b') + onBoard(b, 'q') === 0) {
        b.over = true; M.over = true; M.winner = 0;
        b.result = { practice: true, shots: b.shots, fouls: b.fouls };
        M.boards.push(b.result);
      }
      return finish(M, res, true);
    }

    var hadOwn = offBoard(b, c) - ownIn > 0;
    var pendingMine = b.queen.st === 'pending' && b.queen.by === c;
    if (queenIn) {
      if (strikerIn) { placeFree(b, queenPiece(b)); b.queen = { st: 'on', by: null }; msgs.push(['queen_back_foul']); }
      else if (M.opts.queenFirst && !hadOwn && ownIn === 0) { placeFree(b, queenPiece(b)); b.queen = { st: 'on', by: null }; msgs.push(['queen_early']); }
      else if (ownIn > 0) { b.queen = { st: 'covered', by: c }; msgs.push(['queen_covered']); }
      else { b.queen = { st: 'pending', by: c }; msgs.push(['queen_cover_next']); again = true; }
    } else if (pendingMine) {
      if (ownIn > 0 && !strikerIn) { b.queen = { st: 'covered', by: c }; msgs.push(['queen_covered']); }
      else { placeFree(b, queenPiece(b)); b.queen = { st: 'on', by: null }; msgs.push(['queen_not_covered']); }
    }
    if (ownIn > 0) again = true;
    if (oppIn > 0) { again = false; msgs.push(['opp_coin', { n: oppIn }]); }
    if (strikerIn) { again = false; b.due[c]++; msgs.push(['foul_striker']); }
    else if (ownIn > 0 && again) msgs.push(['own_coin', { n: ownIn }]);
    /* dues are paid as soon as the player has a pocketed coin */
    [c, o].forEach(function (col) {
      while (b.due[col] > 0 && offBoard(b, col) > 0) { bringBack(b, col, order); b.due[col]--; msgs.push(['coin_back', { k: col }]); }
    });
    /* nobody can finish before the queen is covered */
    [c, o].forEach(function (col) {
      if (onBoard(b, col) === 0 && b.queen.st !== 'covered') { bringBack(b, col, order); msgs.push(['last_needs_queen', { k: col }]); }
    });
    var wOn = onBoard(b, 'w'), bOn = onBoard(b, 'b');
    if (wOn === 0 || bOn === 0) {
      var wc = wOn === 0 && bOn === 0 ? o : (wOn === 0 ? 'w' : 'b'), lc = other(wc), wi = b.colors.indexOf(wc);
      var coins = onBoard(b, lc), qp = 0;
      if (b.queen.by === wc && !(cfg.limit && M.scores[wi] >= cfg.limit)) qp = cfg.queen;
      b.over = true;
      b.result = { winner: wi, color: wc, coins: coins, queen: qp, pts: coins + qp, queenBy: b.queen.by, noQueenPts: b.queen.by === wc && qp === 0 };
      M.scores[wi] += b.result.pts;
      M.boards.push({ winner: wi, pts: b.result.pts, coins: coins, queen: qp, color: wc });
      var n = M.boards.length, hi = Math.max(M.scores[0], M.scores[1]);
      if ((cfg.target && hi >= cfg.target) || n >= cfg.boards) {
        M.over = true;
        M.winner = M.scores[0] === M.scores[1] ? -1 : (M.scores[0] > M.scores[1] ? 0 : 1);
      }
      again = false;
    }
    return finish(M, res, again);
  }
  function queenPiece(b) { for (var i = 0; i < b.pieces.length; i++) if (b.pieces[i].k === 'q') return b.pieces[i]; return null; }
  function finish(M, res, again) {
    var b = M.board;
    res.again = again;
    if (!b.over) {
      if (!again) b.turn = 1 - b.turn;
      if (M.mode === 'practice') b.turn = 0;
      placeStriker(M);
    } else { var s = striker(b); s.on = false; }
    res.next = b.turn; res.over = b.over;
    b.last = res;
    return res;
  }

  function nextBoard(M) {
    if (M.over || !M.board.over) return null;
    M.boardNo++;
    return newBoard(M);
  }

  /* ------------------------------------------------------------- computer player
     1) geometry: for each own coin (or the queen, when allowed) and each pocket, the "ghost" spot where the striker
        must touch it, striker spots along the base line with a clear path, cut angle under about 70°;
     2) the best of those (and a few plain shots) are tried in a copy of the board with the real physics;
     3) the best tried shot is played with aim noise for the chosen level. */
  var NOISE = { easy: [2.4, 0.1], medium: [1.1, 0.05], hard: [0.35, 0.02] };
  function segClear(ax, ay, bx, by, pieces, skip, rad) {
    var vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-9;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (!p.on || p.k === 's' || skip.indexOf(p.id) >= 0) continue;
      var t = ((p.x - ax) * vx + (p.y - ay) * vy) / L2; t = Math.max(0, Math.min(1, t));
      var dx = ax + vx * t - p.x, dy = ay + vy * t - p.y, rr = rad + p.r - 0.05;
      if (dx * dx + dy * dy < rr * rr) return false;
    }
    return true;
  }
  function targetsFor(M) {
    var b = M.board, c = b.colors[b.turn], practice = M.mode === 'practice';
    var q = b.queen, list = [];
    var queenOk = practice || (q.st === 'on' && (!M.opts.queenFirst || offBoard(b, c) > 0));
    b.pieces.forEach(function (p) {
      if (!p.on || p.k === 's') return;
      if (practice || p.k === c) list.push(p);
      else if (p.k === 'q' && queenOk && !(q.st === 'pending')) list.push(p);
    });
    return list;
  }
  function aiPlan(M) {
    var b = M.board, side = sideOf(b.turn), pieces = b.pieces, cands = [];
    var e = P.K.E_STRIKER, ms = B.SM, mc = B.CM, xfer = (1 + e) * ms / (ms + mc);
    if (!b.breakDone && M.mode !== 'practice') {
      [0, -1.5, 1.5].forEach(function (x, i) { cands.push({ x: x, ang: i === 0 ? 0 : (x > 0 ? -2 : 2), power: 1, geo: 50 - i }); });
    } else {
      var tg = targetsFor(M), WL = B.HALF - B.SR;
      /* aim points: the ghost spot itself, or its mirror image in one of the 4 cushions (a bank shot) */
      var mirrors = [null, ['x', WL], ['x', -WL], ['y', WL], ['y', -WL]];
      function mir(m, x, y) { return !m ? [x, y] : m[0] === 'x' ? [2 * m[1] - x, y] : [x, 2 * m[1] - y]; }
      function addShots(T, gx, gy, ux, uy, d1, isPot) {
        var sy = side * B.BASE_Y;
        for (var x = -B.BASE_X; x <= B.BASE_X + 1e-9; x += B.BASE_X / 12) {
          if (!P.fits(pieces, x, sy)) continue;
          for (var mi = 0; mi < mirrors.length; mi++) {
            var m = mirrors[mi], ap = mir(m, gx, gy);
            var vx = ap[0] - x, vy = ap[1] - sy, dS = Math.sqrt(vx * vx + vy * vy); if (dS < 0.5) continue;
            var ang = P.angleOf(side, vx, vy);
            if (Math.abs(ang) > 88) continue;
            /* direction of the striker when it reaches the ghost spot (after the bounce for a bank shot) */
            var dx = vx / dS, dy = vy / dS;
            if (m) {
              var hitT = m[0] === 'x' ? (m[1] - x) / (dx || 1e-9) : (m[1] - sy) / (dy || 1e-9);
              if (!(hitT > 0 && hitT < dS)) continue;
              var bx = x + dx * hitT, by = sy + dy * hitT;
              if (Math.abs(bx) > WL + 1e-6 || Math.abs(by) > WL + 1e-6) continue;
              if (!segClear(x, sy, bx, by, pieces, [], B.SR) || !segClear(bx, by, gx, gy, pieces, [T.id], B.SR)) continue;
              if (m[0] === 'x') dx = -dx; else dy = -dy;
            } else if (!segClear(x, sy, gx, gy, pieces, [T.id], B.SR)) continue;
            var cosc = isPot ? dx * ux + dy * uy : 1;
            if (cosc < 0.34) continue;
            var pw;
            if (isPot) {
              var vc = P.speedFor(Math.max(0.5, d1 - B.PR * 0.6), 28);
              pw = P.speedToPower(P.speedFor(dS, vc / (xfer * cosc)) * (m ? 1.3 : 1.06));
            } else pw = m ? 0.75 : 0.5;
            if (pw > 1) continue;
            cands.push({ x: x, ang: ang, power: Math.min(1, pw), target: T.id,
              geo: isPot ? cosc * cosc * 100 - dS * 0.25 - d1 * 0.35 - (m ? 25 : 0) : -60 - dS * 0.1 - (m ? 10 : 0) });
          }
        }
      }
      tg.forEach(function (T) {
        P.POCKETS.forEach(function (pk) {
          var ux = pk[0] - T.x, uy = pk[1] - T.y, d1 = Math.sqrt(ux * ux + uy * uy); ux /= d1; uy /= d1;
          if (!segClear(T.x, T.y, pk[0], pk[1], pieces, [T.id], B.CR)) return;
          addShots(T, T.x - ux * (B.SR + T.r), T.y - uy * (B.SR + T.r), ux, uy, d1, true);
        });
      });
      cands.sort(function (a, b2) { return b2.geo - a.geo; });
      var keep = [], per = {};
      cands.forEach(function (cd) { var k = cd.target; per[k] = (per[k] || 0) + 1; if (per[k] <= 2 && keep.length < 10) keep.push(cd); });
      cands = keep;
      if (cands.length < 4) {
        /* no good pot: just hit own coins (straight or off a cushion) to move them somewhere better */
        var more = [];
        var save = cands; cands = more;
        tg.forEach(function (T) { addShots(T, T.x, T.y, 0, 0, 0, false); });
        more.sort(function (a, b2) { return b2.geo - a.geo; });
        cands = save.concat(more.filter(function (cd, i) { return i % 3 === 0; }).slice(0, 8));
      }
      if (!cands.length) cands.push({ x: 0, ang: 0, power: 0.6, geo: -100 });
    }
    return { cands: cands, i: 0, best: null };
  }
  /* try one candidate in a copy of the board (each candidate three times: straight and nudged both ways, so the
     computer prefers shots that still work when the aim is a little off); returns false when all are tried */
  var TRIES = [0, 1, -1];
  function aiStep(M, plan) {
    var nTry = TRIES.length;
    if (plan.i >= plan.cands.length * nTry) return false;
    var ci = Math.floor(plan.i / nTry), ti = plan.i % nTry, cd = plan.cands[ci], b = M.board, side = sideOf(b.turn), c = b.colors[b.turn];
    plan.i++;
    var nz = NOISE[M.opts.level] || NOISE.medium, off = TRIES[ti] * Math.max(0.6, nz[0] * 0.8);
    var ps = P.clone(b.pieces), s = P.strikerOf({ p: ps });
    var fx = P.fitStriker(ps, side, cd.x);
    var sc = -40;
    if (fx !== null) {
      s.x = fx; s.y = side * B.BASE_Y; s.on = true;
      var w = P.world(ps), d = P.dir(side, cd.ang + off);
      P.fire(w, d.x, d.y, cd.power);
      P.run(w, 12);
      sc = 0;
      var practice = M.mode === 'practice', touched = false;
      w.ev.forEach(function (e) {
        if (e.type === 'hit' && (e.ka === 's' || e.kb === 's')) touched = true;
        if (e.type !== 'pocket') return;
        if (e.k === 's') sc -= 30;
        else if (e.k === 'q') sc += practice ? 10 : (b.queen.st === 'on' && (!M.opts.queenFirst || offBoard(b, c) > 0) ? 9 : -2);
        else if (practice || e.k === c) sc += 10;
        else sc -= 9;
      });
      if (!touched) sc -= 5;
    }
    cd.sims = (cd.sims || 0) + sc * (ti === 0 ? 2 : 1);
    if (ti === nTry - 1) {
      cd.sim = cd.sims / (nTry + 1);
      if (!plan.best || cd.sim > plan.best.sim || (cd.sim === plan.best.sim && cd.geo > plan.best.geo)) plan.best = cd;
    }
    return plan.i < plan.cands.length * nTry;
  }
  function aiPick(M, plan, rnd) {
    rnd = rnd || Math.random;
    var cd = plan.best || plan.cands[0], nz = NOISE[M.opts.level] || NOISE.medium;
    function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 0.5; }   /* roughly −3…3, standard deviation 1 */
    var ang = cd.ang + nz[0] * gauss(), pw = cd.power * (1 + nz[1] * gauss());
    return { x: cd.x, ang: Math.max(-88, Math.min(88, ang)), power: Math.max(0.05, Math.min(1, pw)), plan: cd };
  }

  var api = {
    MATCH: MATCH, MODES: MODES, sideOf: sideOf, other: other, newMatch: newMatch, newBoard: newBoard, nextBoard: nextBoard,
    resolve: resolve, placeStriker: placeStriker, placeFree: placeFree, onBoard: onBoard, offBoard: offBoard, striker: striker,
    aiPlan: aiPlan, aiStep: aiStep, aiPick: aiPick, NOISE: NOISE
  };
  root.CRRULES = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
