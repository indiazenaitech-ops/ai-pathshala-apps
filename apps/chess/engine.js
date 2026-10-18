/* Chess engine for the Chess app: rules (legal moves, check, mate, draws), FEN / SAN / PGN and the computer
   opponent (alpha-beta search). Everything lives inside ONE factory function, so the very same code runs on the
   page (rules and notation) and inside a Blob Web Worker (the search), which also works when the app is opened
   from a downloaded folder (file://). No libraries.
   Board: 0x88 mailbox, a1 = 0, h1 = 7, a8 = 112, h8 = 119. Piece = colour (0 white, 8 black) | type (1..6). */
window.ChessEngineFactory = function ChessEngineFactory() {
  'use strict';

  /* ================================================================ constants */
  var PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
  var WHITE = 0, BLACK = 8;
  var F_CAP = 1, F_EP = 2, F_CASTLE = 4, F_DOUBLE = 8;
  var KN = [33, 31, 18, 14, -14, -18, -31, -33];
  var KG = [16, 17, 1, -15, -16, -17, -1, 15];
  var DIAG = [15, 17, -15, -17], ORTH = [16, 1, -16, -1];
  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var FILES = 'abcdefgh';
  var PCHR = ' PNBRQK  pnbrqk';          // index = piece code
  var STACK = 4096, MAXPLY = 96, MPP = 320;
  var MATE = 30000, INF = 32000;
  var i;

  /* castling rights that survive a move touching a square (WK = 1, WQ = 2, BK = 4, BQ = 8) */
  var CMASK = new Int8Array(128);
  for (i = 0; i < 128; i++) CMASK[i] = 15;
  CMASK[0] = 13; CMASK[7] = 14; CMASK[4] = 12; CMASK[112] = 7; CMASK[119] = 11; CMASK[116] = 3;

  function mv(f, t, p, fl) { return f | (t << 7) | (p << 14) | (fl << 17); }
  function mFrom(m) { return m & 127; }
  function mTo(m) { return (m >> 7) & 127; }
  function mPromo(m) { return (m >> 14) & 7; }
  function mFlags(m) { return m >>> 17; }
  function sqName(s) { return FILES[s & 7] + ((s >> 4) + 1); }
  function sqIndex(name) { var m = /^([a-h])([1-8])$/.exec(String(name)); return m ? (m[2] - 1) * 16 + FILES.indexOf(m[1]) : -1; }
  function uci(m) { return sqName(mFrom(m)) + sqName(mTo(m)) + (mPromo(m) ? ' pnbrq'[mPromo(m)] : ''); }

  /* ================================================================ zobrist keys (fixed seed: same in page and worker) */
  var rs = 0x2545F491;
  function r32() { rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5; return rs | 0; }
  var ZL = new Int32Array(2048), ZH = new Int32Array(2048), ZCL = new Int32Array(16), ZCH = new Int32Array(16);
  var ZEL = new Int32Array(8), ZEH = new Int32Array(8);
  for (i = 0; i < 2048; i++) { ZL[i] = r32(); ZH[i] = r32(); }
  for (i = 0; i < 16; i++) { ZCL[i] = r32(); ZCH[i] = r32(); }
  for (i = 0; i < 8; i++) { ZEL[i] = r32(); ZEH[i] = r32(); }
  var ZSL = r32(), ZSH = r32();

  /* ================================================================ position */
  function Position() {
    this.board = new Int8Array(128);
    this.turn = WHITE; this.castle = 0; this.ep = -1; this.epLo = 0; this.epHi = 0;
    this.half = 0; this.full = 1; this.kings = new Int16Array(2);
    this.hlo = 0; this.hhi = 0; this.ply = 0;
    this.alloc(STACK);
  }
  var UNDO = ['uMove', 'uCap', 'uCastle', 'uEp', 'uHalf', 'uLo', 'uHi', 'uEpLo', 'uEpHi'];
  Position.prototype.alloc = function (n) {
    var T = [Int32Array, Int8Array, Int8Array, Int16Array, Int32Array, Int32Array, Int32Array, Int32Array, Int32Array];
    for (var k = 0; k < UNDO.length; k++) {
      var a = new T[k](n);
      if (this[UNDO[k]]) a.set(this[UNDO[k]]);
      this[UNDO[k]] = a;
    }
  };
  /* make room for more moves (very long games) */
  Position.prototype.room = function () { if (this.ply > this.uMove.length - MAXPLY - 32) this.alloc(this.uMove.length * 2); };

  Position.prototype.attacked = function (sq, by) {
    var b = this.board, t, d, p, k;
    if (by === WHITE) {
      t = sq - 15; if (!(t & 0x88) && b[t] === 1) return true;
      t = sq - 17; if (!(t & 0x88) && b[t] === 1) return true;
    } else {
      t = sq + 15; if (!(t & 0x88) && b[t] === 9) return true;
      t = sq + 17; if (!(t & 0x88) && b[t] === 9) return true;
    }
    var kn = by | KNIGHT, kg = by | KING, bi = by | BISHOP, ro = by | ROOK, qu = by | QUEEN;
    for (k = 0; k < 8; k++) { t = sq + KN[k]; if (!(t & 0x88) && b[t] === kn) return true; }
    for (k = 0; k < 8; k++) { t = sq + KG[k]; if (!(t & 0x88) && b[t] === kg) return true; }
    for (k = 0; k < 4; k++) {
      d = DIAG[k]; t = sq + d;
      while (!(t & 0x88)) { p = b[t]; if (p) { if (p === bi || p === qu) return true; break; } t += d; }
      d = ORTH[k]; t = sq + d;
      while (!(t & 0x88)) { p = b[t]; if (p) { if (p === ro || p === qu) return true; break; } t += d; }
    }
    return false;
  };
  Position.prototype.inCheck = function () { return this.attacked(this.kings[this.turn >> 3], this.turn ^ 8); };

  /* pseudo-legal moves into buf[n...]; returns the new end. caps = captures and queen promotions only */
  Position.prototype.gen = function (buf, n, caps) {
    var b = this.board, us = this.turn, them = us ^ 8, sq, p, t, k, d, q, to, r;
    for (sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      p = b[sq];
      if (!p || (p & 8) !== us) continue;
      t = p & 7;
      if (t === PAWN) {
        var fwd = us ? -16 : 16; r = sq >> 4;
        var promo = us ? r === 1 : r === 6;
        to = sq + fwd;
        if (!b[to]) {
          if (promo) {
            buf[n++] = mv(sq, to, QUEEN, 0);
            if (!caps) { buf[n++] = mv(sq, to, KNIGHT, 0); buf[n++] = mv(sq, to, ROOK, 0); buf[n++] = mv(sq, to, BISHOP, 0); }
          } else if (!caps) {
            buf[n++] = mv(sq, to, 0, 0);
            if ((us ? r === 6 : r === 1) && !b[to + fwd]) buf[n++] = mv(sq, to + fwd, 0, F_DOUBLE);
          }
        }
        for (k = -1; k <= 1; k += 2) {
          to = sq + fwd + k;
          if (to & 0x88) continue;
          q = b[to];
          if (q && (q & 8) === them) {
            if (promo) {
              buf[n++] = mv(sq, to, QUEEN, F_CAP);
              if (!caps) { buf[n++] = mv(sq, to, KNIGHT, F_CAP); buf[n++] = mv(sq, to, ROOK, F_CAP); buf[n++] = mv(sq, to, BISHOP, F_CAP); }
            } else buf[n++] = mv(sq, to, 0, F_CAP);
          } else if (!q && to === this.ep) buf[n++] = mv(sq, to, 0, F_CAP | F_EP);
        }
      } else if (t === KNIGHT || t === KING) {
        var offs = t === KNIGHT ? KN : KG;
        for (k = 0; k < 8; k++) {
          to = sq + offs[k];
          if (to & 0x88) continue;
          q = b[to];
          if (!q) { if (!caps) buf[n++] = mv(sq, to, 0, 0); }
          else if ((q & 8) === them) buf[n++] = mv(sq, to, 0, F_CAP);
        }
        if (t === KING && !caps && this.castle) {
          if (us === WHITE && sq === 4) {
            if ((this.castle & 1) && !b[5] && !b[6] && b[7] === ROOK && !this.attacked(4, them) && !this.attacked(5, them) && !this.attacked(6, them)) buf[n++] = mv(4, 6, 0, F_CASTLE);
            if ((this.castle & 2) && !b[3] && !b[2] && !b[1] && b[0] === ROOK && !this.attacked(4, them) && !this.attacked(3, them) && !this.attacked(2, them)) buf[n++] = mv(4, 2, 0, F_CASTLE);
          } else if (us === BLACK && sq === 116) {
            if ((this.castle & 4) && !b[117] && !b[118] && b[119] === (BLACK | ROOK) && !this.attacked(116, them) && !this.attacked(117, them) && !this.attacked(118, them)) buf[n++] = mv(116, 118, 0, F_CASTLE);
            if ((this.castle & 8) && !b[115] && !b[114] && !b[113] && b[112] === (BLACK | ROOK) && !this.attacked(116, them) && !this.attacked(115, them) && !this.attacked(114, them)) buf[n++] = mv(116, 114, 0, F_CASTLE);
          }
        }
      } else {
        var dirs = t === BISHOP ? DIAG : (t === ROOK ? ORTH : KG), nd = dirs.length;
        for (k = 0; k < nd; k++) {
          d = dirs[k]; to = sq + d;
          while (!(to & 0x88)) {
            q = b[to];
            if (!q) { if (!caps) buf[n++] = mv(sq, to, 0, 0); }
            else { if ((q & 8) === them) buf[n++] = mv(sq, to, 0, F_CAP); break; }
            to += d;
          }
        }
      }
    }
    return n;
  };

  Position.prototype.make = function (m) {
    var b = this.board, from = m & 127, to = (m >> 7) & 127, fl = m >>> 17, promo = (m >> 14) & 7;
    var p = b[from], us = this.turn, them = us ^ 8, cap = b[to], k = this.ply, cs, r;
    this.uMove[k] = m; this.uCastle[k] = this.castle; this.uEp[k] = this.ep; this.uHalf[k] = this.half;
    this.uLo[k] = this.hlo; this.uHi[k] = this.hhi; this.uEpLo[k] = this.epLo; this.uEpHi[k] = this.epHi;
    this.ply = k + 1;
    var lo = this.hlo ^ this.epLo ^ ZL[(p << 7) | from], hi = this.hhi ^ this.epHi ^ ZH[(p << 7) | from];
    if (fl & F_EP) {
      cs = us === WHITE ? to - 16 : to + 16;
      cap = b[cs]; b[cs] = 0;
      lo ^= ZL[(cap << 7) | cs]; hi ^= ZH[(cap << 7) | cs];
    } else if (cap) { lo ^= ZL[(cap << 7) | to]; hi ^= ZH[(cap << 7) | to]; }
    this.uCap[k] = cap;
    var np = promo ? (us | promo) : p;
    b[to] = np; b[from] = 0;
    lo ^= ZL[(np << 7) | to]; hi ^= ZH[(np << 7) | to];
    if (fl & F_CASTLE) {
      var rf, rt;
      if (to === 6) { rf = 7; rt = 5; } else if (to === 2) { rf = 0; rt = 3; } else if (to === 118) { rf = 119; rt = 117; } else { rf = 112; rt = 115; }
      r = b[rf]; b[rt] = r; b[rf] = 0;
      lo ^= ZL[(r << 7) | rf] ^ ZL[(r << 7) | rt]; hi ^= ZH[(r << 7) | rf] ^ ZH[(r << 7) | rt];
    }
    if ((p & 7) === KING) this.kings[us >> 3] = to;
    var oc = this.castle, nc = oc & CMASK[from] & CMASK[to];
    if (nc !== oc) { lo ^= ZCL[oc] ^ ZCL[nc]; hi ^= ZCH[oc] ^ ZCH[nc]; this.castle = nc; }
    this.ep = -1; this.epLo = 0; this.epHi = 0;
    if (fl & F_DOUBLE) {
      var e = (from + to) >> 1, ep = them | PAWN;
      this.ep = e;
      if ((!((to + 1) & 0x88) && b[to + 1] === ep) || (!((to - 1) & 0x88) && b[to - 1] === ep)) {
        this.epLo = ZEL[e & 7]; this.epHi = ZEH[e & 7]; lo ^= this.epLo; hi ^= this.epHi;
      }
    }
    this.half = ((p & 7) === PAWN || cap) ? 0 : this.half + 1;
    if (us === BLACK) this.full++;
    this.turn = them;
    this.hlo = lo ^ ZSL; this.hhi = hi ^ ZSH;
  };

  Position.prototype.unmake = function () {
    var k = --this.ply, m = this.uMove[k], b = this.board;
    var from = m & 127, to = (m >> 7) & 127, fl = m >>> 17, promo = (m >> 14) & 7;
    var us = this.turn ^ 8;
    this.turn = us;
    var p = promo ? (us | PAWN) : b[to];
    b[from] = p;
    if (fl & F_EP) { b[to] = 0; b[us === WHITE ? to - 16 : to + 16] = this.uCap[k]; }
    else b[to] = this.uCap[k];
    if (fl & F_CASTLE) {
      var rf, rt;
      if (to === 6) { rf = 7; rt = 5; } else if (to === 2) { rf = 0; rt = 3; } else if (to === 118) { rf = 119; rt = 117; } else { rf = 112; rt = 115; }
      b[rf] = b[rt]; b[rt] = 0;
    }
    if ((p & 7) === KING) this.kings[us >> 3] = from;
    this.castle = this.uCastle[k]; this.ep = this.uEp[k]; this.half = this.uHalf[k];
    this.hlo = this.uLo[k]; this.hhi = this.uHi[k]; this.epLo = this.uEpLo[k]; this.epHi = this.uEpHi[k];
    if (us === BLACK) this.full--;
  };

  /* "pass" for null-move pruning in the search */
  Position.prototype.makeNull = function () {
    var k = this.ply;
    this.uMove[k] = 0; this.uCastle[k] = this.castle; this.uEp[k] = this.ep; this.uHalf[k] = this.half;
    this.uLo[k] = this.hlo; this.uHi[k] = this.hhi; this.uEpLo[k] = this.epLo; this.uEpHi[k] = this.epHi;
    this.ply = k + 1;
    this.hlo ^= this.epLo ^ ZSL; this.hhi ^= this.epHi ^ ZSH;
    this.ep = -1; this.epLo = 0; this.epHi = 0; this.half = 0;
    this.turn ^= 8;
  };
  Position.prototype.unmakeNull = function () {
    var k = --this.ply;
    this.turn ^= 8;
    this.ep = this.uEp[k]; this.half = this.uHalf[k]; this.hlo = this.uLo[k]; this.hhi = this.uHi[k];
    this.epLo = this.uEpLo[k]; this.epHi = this.uEpHi[k];
  };

  var LBUF = new Int32Array(MPP);
  Position.prototype.legalMoves = function () {
    var n = this.gen(LBUF, 0, false), out = [], us = this.turn, k;
    var list = Array.prototype.slice.call(LBUF, 0, n);
    for (k = 0; k < n; k++) {
      this.make(list[k]);
      if (!this.attacked(this.kings[us >> 3], this.turn)) out.push(list[k]);
      this.unmake();
    }
    return out;
  };
  Position.prototype.hasLegalMove = function () {
    var buf = new Int32Array(MPP), n = this.gen(buf, 0, false), us = this.turn, ok = false;
    for (var k = 0; k < n && !ok; k++) {
      this.make(buf[k]);
      if (!this.attacked(this.kings[us >> 3], this.turn)) ok = true;
      this.unmake();
    }
    return ok;
  };

  Position.prototype.rehash = function () {
    var lo = 0, hi = 0, b = this.board, sq, p;
    for (sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      p = b[sq];
      if (p) { lo ^= ZL[(p << 7) | sq]; hi ^= ZH[(p << 7) | sq]; }
    }
    lo ^= ZCL[this.castle]; hi ^= ZCH[this.castle];
    this.epLo = 0; this.epHi = 0;
    if (this.ep >= 0) {
      var pushed = this.turn === WHITE ? this.ep - 16 : this.ep + 16, mine = this.turn | PAWN;
      if ((!((pushed + 1) & 0x88) && b[pushed + 1] === mine) || (!((pushed - 1) & 0x88) && b[pushed - 1] === mine)) {
        this.epLo = ZEL[this.ep & 7]; this.epHi = ZEH[this.ep & 7]; lo ^= this.epLo; hi ^= this.epHi;
      }
    }
    if (this.turn === BLACK) { lo ^= ZSL; hi ^= ZSH; }
    this.hlo = lo; this.hhi = hi;
  };

  Position.prototype.fen = function () {
    var s = '', b = this.board, r, f, e, p;
    for (r = 7; r >= 0; r--) {
      e = 0;
      for (f = 0; f < 8; f++) {
        p = b[r * 16 + f];
        if (!p) e++; else { if (e) { s += e; e = 0; } s += PCHR[p]; }
      }
      if (e) s += e;
      if (r) s += '/';
    }
    var c = (this.castle & 1 ? 'K' : '') + (this.castle & 2 ? 'Q' : '') + (this.castle & 4 ? 'k' : '') + (this.castle & 8 ? 'q' : '');
    return s + ' ' + (this.turn ? 'b' : 'w') + ' ' + (c || '-') + ' ' + (this.ep >= 0 ? sqName(this.ep) : '-') + ' ' + this.half + ' ' + this.full;
  };

  /* FEN → { pos } or { error: 'format' | 'kings' | 'pawns' | 'check' | 'count' } */
  function parseFen(fen) {
    var parts = String(fen == null ? '' : fen).trim().split(/\s+/);
    if (!parts[0]) return { error: 'format' };
    var rows = parts[0].split('/');
    if (rows.length !== 8) return { error: 'format' };
    var pos = new Position(), b = pos.board, cnt = [0, 0], pawns = [0, 0], kings = [0, 0];
    for (var r = 0; r < 8; r++) {
      var file = 0, row = rows[r];
      for (var j = 0; j < row.length; j++) {
        var ch = row[j];
        if (ch >= '1' && ch <= '8') { file += +ch; if (file > 8) return { error: 'format' }; continue; }
        var idx = 'PNBRQKpnbrqk'.indexOf(ch);
        if (idx < 0 || file > 7) return { error: 'format' };
        var color = idx < 6 ? WHITE : BLACK, type = (idx % 6) + 1, sq = (7 - r) * 16 + file, side = color >> 3;
        b[sq] = color | type; cnt[side]++;
        if (type === KING) { kings[side]++; pos.kings[side] = sq; }
        if (type === PAWN) { pawns[side]++; if (r === 0 || r === 7) return { error: 'pawns' }; }
        file++;
      }
      if (file !== 8) return { error: 'format' };
    }
    if (kings[0] !== 1 || kings[1] !== 1) return { error: 'kings' };
    if (cnt[0] > 16 || cnt[1] > 16 || pawns[0] > 8 || pawns[1] > 8) return { error: 'count' };
    var side = (parts[1] || 'w').toLowerCase();
    if (side !== 'w' && side !== 'b') return { error: 'format' };
    pos.turn = side === 'w' ? WHITE : BLACK;
    var cr = parts[2] || '-', c = 0;
    if (cr !== '-') {
      if (!/^[KQkq]+$/.test(cr)) return { error: 'format' };
      if (cr.indexOf('K') >= 0 && b[4] === KING && b[7] === ROOK) c |= 1;
      if (cr.indexOf('Q') >= 0 && b[4] === KING && b[0] === ROOK) c |= 2;
      if (cr.indexOf('k') >= 0 && b[116] === (BLACK | KING) && b[119] === (BLACK | ROOK)) c |= 4;
      if (cr.indexOf('q') >= 0 && b[116] === (BLACK | KING) && b[112] === (BLACK | ROOK)) c |= 8;
    }
    pos.castle = c;
    var eps = parts[3] || '-';
    pos.ep = -1;
    if (eps !== '-') {
      var e = sqIndex(eps);
      if (e < 0) return { error: 'format' };
      /* keep it only if it really follows a double step of the other side's pawn */
      var er = e >> 4, pushed = pos.turn === WHITE ? e - 16 : e + 16, orig = pos.turn === WHITE ? e + 16 : e - 16;
      if ((pos.turn === WHITE ? er === 5 : er === 2) && !b[e] && !b[orig] && b[pushed] === ((pos.turn ^ 8) | PAWN)) pos.ep = e;
    }
    var h = parseInt(parts[4], 10), fm = parseInt(parts[5], 10);
    pos.half = isFinite(h) && h >= 0 ? Math.min(h, 9999) : 0;
    pos.full = isFinite(fm) && fm >= 1 ? Math.min(fm, 9999) : 1;
    if (pos.attacked(pos.kings[(pos.turn ^ 8) >> 3], pos.turn)) return { error: 'check' };
    pos.rehash();
    return { pos: pos };
  }

  /* ================================================================ notation */
  function san(pos, m, legal) {
    var from = mFrom(m), to = mTo(m), fl = mFlags(m), promo = mPromo(m), p = pos.board[from], t = p & 7, s, k;
    if (fl & F_CASTLE) s = (to & 7) === 6 ? 'O-O' : 'O-O-O';
    else if (t === PAWN) {
      s = (fl & F_CAP ? FILES[from & 7] + 'x' : '') + sqName(to) + (promo ? '=' + 'NBRQ'[promo - 2] : '');
    } else {
      s = 'NBRQK'[t - 2];
      legal = legal || pos.legalMoves();
      var amb = false, sameFile = false, sameRank = false;
      for (k = 0; k < legal.length; k++) {
        var l = legal[k], lf = mFrom(l);
        if (l !== m && lf !== from && mTo(l) === to && pos.board[lf] === p) {
          amb = true;
          if ((lf & 7) === (from & 7)) sameFile = true;
          if ((lf >> 4) === (from >> 4)) sameRank = true;
        }
      }
      if (amb) s += !sameFile ? FILES[from & 7] : (!sameRank ? String((from >> 4) + 1) : sqName(from));
      s += (fl & F_CAP ? 'x' : '') + sqName(to);
    }
    pos.make(m);
    if (pos.inCheck()) s += pos.hasLegalMove() ? '+' : '#';
    pos.unmake();
    return s;
  }

  /* a move typed as SAN ("Nf3", "exd5", "O-O", "e8=Q") or UCI ("g1f3", "e7e8q"); returns the move or 0 */
  function parseMove(pos, str) {
    var s = String(str == null ? '' : str).trim().replace(/[+#!?]+$/, '').replace(/\s*e\.?\s*p\.?$/i, '').replace(/0/g, 'O').replace(/\s+/g, '');
    if (!s) return 0;
    var legal = pos.legalMoves(), k, out = [];
    var u = /^([a-h][1-8])-?([a-h][1-8])([qrbnQRBN])?$/.exec(s);
    if (u) {
      for (k = 0; k < legal.length; k++) {
        var l = legal[k];
        if (sqName(mFrom(l)) === u[1] && sqName(mTo(l)) === u[2] && (mPromo(l) ? ' nbrq'.indexOf((u[3] || 'q').toLowerCase()) === mPromo(l) - 1 : true)) return l;
      }
    }
    var norm = function (x) { return x.replace(/[x:=+#]/g, ''); };
    var sans = legal.map(function (l) { return san(pos, l, legal); });
    for (k = 0; k < legal.length; k++) if (sans[k].replace(/[+#]/g, '') === s) return legal[k];
    for (k = 0; k < legal.length; k++) if (norm(sans[k]) === norm(s)) out.push(legal[k]);
    if (out.length === 1) return out[0];
    out = [];
    for (k = 0; k < legal.length; k++) if (norm(sans[k]).toLowerCase() === norm(s).toLowerCase()) out.push(legal[k]);
    if (out.length === 1) return out[0];
    /* "Ngf3" style over-disambiguation or "Pe4" */
    var m2 = /^([NBRQKP])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?([NBRQ]))?$/i.exec(s);
    if (m2) {
      var pt = m2[1] ? 'PNBRQK'.indexOf(m2[1].toUpperCase()) + 1 : PAWN;
      out = legal.filter(function (l) {
        var f = mFrom(l);
        if ((pos.board[f] & 7) !== pt || sqName(mTo(l)) !== m2[4].toLowerCase()) return false;
        if (m2[2] && FILES[f & 7] !== m2[2].toLowerCase()) return false;
        if (m2[3] && String((f >> 4) + 1) !== m2[3]) return false;
        if (mPromo(l) && ' nbrq'.indexOf((m2[5] || 'q').toLowerCase()) !== mPromo(l) - 1) return false;
        return true;
      });
      if (out.length === 1) return out[0];
    }
    return 0;
  }

  /* ================================================================ material and draws */
  function counts(pos) {
    var b = pos.board, c = { w: [0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0, 0, 0, 0, 0], wbL: 0, wbD: 0, bbL: 0, bbD: 0 }, sq, p;
    for (sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      p = b[sq];
      if (!p) continue;
      var white = !(p & 8), t = p & 7;
      (white ? c.w : c.b)[t]++;
      if (t === BISHOP) {
        var light = ((sq >> 4) + (sq & 7)) & 1;
        if (white) { if (light) c.wbL++; else c.wbD++; } else { if (light) c.bbL++; else c.bbD++; }
      }
    }
    return c;
  }
  /* dead position: nobody can ever checkmate (K v K, K + minor v K, only bishops all on one colour) */
  function insufficient(pos) {
    var c = counts(pos), w = c.w, k = c.b;
    if (w[PAWN] || k[PAWN] || w[ROOK] || k[ROOK] || w[QUEEN] || k[QUEEN]) return false;
    if (w[KNIGHT] + w[BISHOP] + k[KNIGHT] + k[BISHOP] <= 1) return true;
    if (w[KNIGHT] || k[KNIGHT]) return false;
    return (c.wbL + c.bbL === 0) || (c.wbD + c.bbD === 0);
  }
  /* could `color` ever deliver mate? (used when the other side runs out of time; same idea as lichess) */
  function canMate(pos, color) {
    var c = counts(pos), me = color === WHITE ? c.w : c.b, op = color === WHITE ? c.b : c.w;
    if (me[PAWN] || me[ROOK] || me[QUEEN]) return true;
    var n = me[KNIGHT], bs = me[BISHOP];
    if (n + bs === 0) return false;
    if (n >= 2 || (n && bs)) return true;
    if (n === 1) return op[PAWN] + op[KNIGHT] + op[BISHOP] + op[ROOK] > 0;
    var myL = color === WHITE ? c.wbL : c.bbL, myD = color === WHITE ? c.wbD : c.bbD;
    if (myL && myD) return true;
    var opL = color === WHITE ? c.bbL : c.wbL, opD = color === WHITE ? c.bbD : c.wbD;
    return op[PAWN] > 0 || op[KNIGHT] > 0 || (myL ? opD > 0 : opL > 0);
  }

  /* key for threefold repetition (FIDE 9.2.2): pieces, side to move, castling rights, en passant only if possible */
  function repKey(pos) {
    var f = pos.fen().split(' '), ep = '-';
    if (pos.ep >= 0) {
      var legal = pos.legalMoves();
      for (var k = 0; k < legal.length; k++) if (mFlags(legal[k]) & F_EP) { ep = f[3]; break; }
    }
    return f[0] + ' ' + f[1] + ' ' + f[2] + ' ' + ep;
  }

  /* ================================================================ game (rules + history) */
  function Game(fen) {
    var r = parseFen(fen || START_FEN);
    if (r.error) throw new Error('fen:' + r.error);
    this.pos = r.pos;
    this.startFen = r.pos.fen();
    this.moves = [];
    this.keys = [repKey(this.pos)];
    this.result = null;
  }
  Game.prototype.legal = function () { return this.pos.legalMoves(); };
  Game.prototype.play = function (m) {
    var pos = this.pos, legal = pos.legalMoves();
    if (legal.indexOf(m) < 0) return null;
    var from = mFrom(m), to = mTo(m), fl = mFlags(m);
    var rec = {
      m: m, uci: uci(m), san: san(pos, m, legal), piece: pos.board[from], color: pos.turn,
      captured: fl & F_EP ? ((pos.turn ^ 8) | PAWN) : pos.board[to], promo: mPromo(m), flags: fl, from: from, to: to
    };
    pos.room();
    pos.make(m);
    this.moves.push(rec);
    this.keys.push(repKey(pos));
    return rec;
  };
  Game.prototype.playUci = function (u) {
    var legal = this.pos.legalMoves();
    for (var k = 0; k < legal.length; k++) if (uci(legal[k]) === u) return this.play(legal[k]);
    return null;
  };
  Game.prototype.undo = function () {
    if (!this.moves.length) return null;
    this.pos.unmake();
    this.keys.pop();
    this.result = null;
    return this.moves.pop();
  };
  Game.prototype.setResult = function (result, reason) { this.result = { result: result, reason: reason }; };
  Game.prototype.repetitions = function () {
    var key = this.keys[this.keys.length - 1], n = 0;
    for (var k = 0; k < this.keys.length; k++) if (this.keys[k] === key) n++;
    return n;
  };
  /* opts.manual: threefold / 50-move draws must be claimed (claim: true); fivefold / 75 moves still end the game */
  Game.prototype.status = function (opts) {
    var pos = this.pos, check = pos.inCheck(), manual = !!(opts && opts.manual);
    if (this.result) return { over: true, result: this.result.result, reason: this.result.reason, check: check };
    var legal = pos.legalMoves();
    if (!legal.length) {
      return check ? { over: true, result: pos.turn === WHITE ? '0-1' : '1-0', reason: 'checkmate', check: true }
        : { over: true, result: '1/2-1/2', reason: 'stalemate', check: false };
    }
    if (insufficient(pos)) return { over: true, result: '1/2-1/2', reason: 'insufficient', check: check };
    var reps = this.repetitions();
    if (reps >= (manual ? 5 : 3)) return { over: true, result: '1/2-1/2', reason: manual ? 'fivefold' : 'threefold', check: check };
    if (pos.half >= (manual ? 150 : 100)) return { over: true, result: '1/2-1/2', reason: manual ? 'seventyfive' : 'fifty', check: check };
    return { over: false, check: check, legal: legal, claim: reps >= 3 ? 'threefold' : (pos.half >= 100 ? 'fifty' : null) };
  };
  Game.prototype.fen = function () { return this.pos.fen(); };

  function pgnEsc(v) { return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  Game.prototype.pgn = function (tags) {
    var st = this.status(), res = st.over ? st.result : '*';
    var T = [['Event', 'Casual game'], ['Site', '?'], ['Date', '????.??.??'], ['Round', '-'], ['White', '?'], ['Black', '?'], ['Result', res]];
    var extra = [];
    tags = tags || {};
    Object.keys(tags).forEach(function (k) {
      if (tags[k] == null || k === 'Result') return;
      for (var j = 0; j < T.length; j++) if (T[j][0] === k) { T[j][1] = tags[k]; return; }
      extra.push([k, tags[k]]);
    });
    if (this.startFen !== START_FEN) T.push(['SetUp', '1'], ['FEN', this.startFen]);
    T = T.concat(extra);
    var head = T.map(function (t) { return '[' + t[0] + ' "' + pgnEsc(t[1]) + '"]'; }).join('\n');
    var start = parseFen(this.startFen).pos, num = start.full, toks = [];
    this.moves.forEach(function (r, k) {
      if (r.color === WHITE) toks.push(num + '.');
      else if (k === 0) toks.push(num + '...');
      toks.push(r.san);
      if (r.color === BLACK) num++;
    });
    toks.push(res);
    var lines = [], line = '';
    toks.forEach(function (t) {
      if (line && line.length + 1 + t.length > 79) { lines.push(line); line = t; }
      else line = line ? line + ' ' + t : t;
    });
    if (line) lines.push(line);
    return head + '\n\n' + lines.join('\n') + '\n';
  };

  /* PGN (one game) → { game, tags, result } or { error: 'fen' | 'move', at, game } */
  function parsePgn(text) {
    var s = String(text == null ? '' : text), tags = {};
    s = s.replace(/\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]/g, function (_, k, v) { tags[k] = v.replace(/\\(.)/g, '$1'); return ' '; });
    s = s.replace(/\{[^}]*\}/g, ' ').replace(/;[^\n]*/g, ' ');
    var prev;
    do { prev = s; s = s.replace(/\([^()]*\)/g, ' '); } while (s !== prev);
    s = s.replace(/\$\d+/g, ' ');
    var game;
    try { game = new Game(tags.FEN || START_FEN); } catch (e) { return { error: 'fen' }; }
    var toks = s.split(/\s+/), result = null;
    for (var k = 0; k < toks.length; k++) {
      var tok = toks[k].replace(/^\d+\.+/, '');
      if (!tok) continue;
      if (/^(1-0|0-1|1\/2-1\/2|½-½|\*)$/.test(tok)) { result = tok === '½-½' ? '1/2-1/2' : tok; break; }
      if (/^\d+\.*$/.test(tok)) continue;
      var m = parseMove(game.pos, tok);
      if (!m) return { error: 'move', at: tok, game: game, tags: tags };
      game.play(m);
    }
    return { game: game, tags: tags, result: result };
  }

  function perft(pos, depth) {
    var buf = new Int32Array(MPP), n = pos.gen(buf, 0, false), count = 0, us = pos.turn;
    for (var k = 0; k < n; k++) {
      pos.make(buf[k]);
      if (!pos.attacked(pos.kings[us >> 3], pos.turn)) count += depth <= 1 ? 1 : perft(pos, depth - 1);
      pos.unmake();
    }
    return count;
  }

  /* ================================================================ evaluation */
  var VMG = [0, 100, 320, 330, 500, 950, 0], VEG = [0, 120, 300, 320, 530, 960, 0], PH = [0, 0, 1, 1, 2, 4, 0];
  function T(a) { return new Int16Array(a); }
  /* piece-square tables from White's side, a8 first (our own small tweaks of the well-known simple tables) */
  var PMG = [null,
    T([0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 5, 22, 22, 0, 0, 0, 5, -5, -8, 4, 4, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0]),
    T([-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 12, 15, 15, 12, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -35, -30, -30, -30, -30, -35, -50]),
    T([-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 8, 0, 0, 0, 0, 8, -10, -20, -10, -12, -10, -10, -12, -10, -20]),
    T([0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 3, 0, 0]),
    T([-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20]),
    T([-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20])];
  var PEG = [null,
    T([0, 0, 0, 0, 0, 0, 0, 0, 80, 80, 80, 80, 80, 80, 80, 80, 50, 50, 50, 50, 50, 50, 50, 50, 30, 30, 30, 30, 30, 30, 30, 30,
      15, 15, 15, 15, 15, 15, 15, 15, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    PMG[2], PMG[3],
    T([0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    PMG[5],
    T([-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50])];
  var PASS_MG = [0, 5, 5, 10, 20, 35, 60, 0], PASS_EG = [0, 10, 15, 25, 45, 75, 120, 0];
  var PF = new Int8Array(20), PMIN = new Int8Array(20), PMAX = new Int8Array(20), PAWNS = new Int16Array(16), ROOKS = new Int16Array(24);

  function shelter(b, k, c) {
    var r = k >> 4, f = k & 7, s = 0, fwd = c === WHITE ? 16 : -16, pawn = c | PAWN;
    if (c === WHITE ? r > 1 : r < 6) return -15;
    for (var df = -1; df <= 1; df++) {
      var ff = f + df;
      if (ff < 0 || ff > 7) continue;
      var s1 = k + df + fwd, s2 = s1 + fwd;
      if (!(s1 & 0x88) && b[s1] === pawn) s += 12;
      else if (!(s2 & 0x88) && b[s2] === pawn) s += 6;
      else s -= 10;
    }
    return s;
  }
  function mopup(loser, winner) {
    var lr = loser >> 4, lf = loser & 7, wr = winner >> 4, wf = winner & 7;
    var cmd = Math.max(3 - lr, lr - 4) + Math.max(3 - lf, lf - 4);
    var md = Math.abs(lr - wr) + Math.abs(lf - wf);
    return 12 * cmd + 5 * (14 - md);
  }

  function evaluate(pos) {
    var b = pos.board, mg = 0, eg = 0, phase = 0, sq, p, t, k, d, to, n, q, f;
    var wb = 0, bb = 0, wnp = 0, bnp = 0, wpc = 0, bpc = 0, np = 0, nr = 0;
    for (k = 0; k < 20; k++) { PF[k] = 0; PMIN[k] = 9; PMAX[k] = -1; }
    for (sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      p = b[sq];
      if (!p) continue;
      t = p & 7;
      var c = p & 8, w = c === 0;
      var idx = w ? ((7 - (sq >> 4)) << 3) | (sq & 7) : ((sq >> 4) << 3) | (sq & 7);
      var smg = VMG[t] + PMG[t][idx], seg = VEG[t] + PEG[t][idx];
      phase += PH[t];
      if (t === PAWN) {
        var fi = (w ? 0 : 10) + (sq & 7) + 1, rk = sq >> 4;
        PF[fi]++; if (rk < PMIN[fi]) PMIN[fi] = rk; if (rk > PMAX[fi]) PMAX[fi] = rk;
        PAWNS[np++] = sq;
        if (w) wpc++; else bpc++;
      } else if (t !== KING) {
        if (w) wnp += VMG[t]; else bnp += VMG[t];
        if (t === KNIGHT) {
          n = 0;
          for (k = 0; k < 8; k++) { to = sq + KN[k]; if (!(to & 0x88)) { q = b[to]; if (!q || (q & 8) !== c) n++; } }
          smg += (n - 4) * 4; seg += (n - 4) * 4;
        } else {
          var dirs = t === BISHOP ? DIAG : (t === ROOK ? ORTH : KG), nd = dirs.length;
          n = 0;
          for (k = 0; k < nd; k++) {
            d = dirs[k]; to = sq + d;
            while (!(to & 0x88)) { q = b[to]; if (!q) { n++; to += d; continue; } if ((q & 8) !== c) n++; break; }
          }
          if (t === BISHOP) { smg += (n - 6) * 5; seg += (n - 6) * 5; if (w) wb++; else bb++; }
          else if (t === ROOK) { smg += (n - 7) * 2; seg += (n - 7) * 4; if (nr < 24) ROOKS[nr++] = sq; }
          else { smg += n - 13; seg += (n - 13) * 2; }
        }
      }
      if (w) { mg += smg; eg += seg; } else { mg -= smg; eg -= seg; }
    }
    for (k = 0; k < np; k++) {
      sq = PAWNS[k];
      var white = !(b[sq] & 8), pf = (sq & 7) + 1, r = sq >> 4, own = white ? 0 : 10, opp = white ? 10 : 0, s1 = 0, s2 = 0, passed = true;
      if (!PF[own + pf - 1] && !PF[own + pf + 1]) { s1 -= 10; s2 -= 15; }
      for (f = pf - 1; f <= pf + 1; f++) {
        if (white ? PMAX[opp + f] > r : PMIN[opp + f] < r) { passed = false; break; }
      }
      if (passed) { var rr = white ? r : 7 - r; s1 += PASS_MG[rr]; s2 += PASS_EG[rr]; }
      if (white) { mg += s1; eg += s2; } else { mg -= s1; eg -= s2; }
    }
    for (f = 1; f <= 8; f++) {
      if (PF[f] > 1) { mg -= 10 * (PF[f] - 1); eg -= 20 * (PF[f] - 1); }
      if (PF[10 + f] > 1) { mg += 10 * (PF[10 + f] - 1); eg += 20 * (PF[10 + f] - 1); }
    }
    for (k = 0; k < nr; k++) {
      sq = ROOKS[k];
      var rw = !(b[sq] & 8), rf = (sq & 7) + 1, ownP = PF[(rw ? 0 : 10) + rf], oppP = PF[(rw ? 10 : 0) + rf], bm = 0, be = 0;
      if (!ownP) { if (!oppP) { bm = 25; be = 10; } else { bm = 12; be = 6; } }
      if (rw) { mg += bm; eg += be; } else { mg -= bm; eg -= be; }
    }
    if (wb >= 2) { mg += 30; eg += 50; }
    if (bb >= 2) { mg -= 30; eg -= 50; }
    mg += shelter(b, pos.kings[0], WHITE) - shelter(b, pos.kings[1], BLACK);
    if (phase > 24) phase = 24;
    var s = ((mg * phase + eg * (24 - phase)) / 24) | 0;
    /* endgame knowledge */
    if (s > 0 && wpc === 0 && wnp <= 330) s = 0;
    else if (s < 0 && bpc === 0 && bnp <= 330) s = 0;
    else if (s > 0 && wpc === 0 && wnp - bnp < 400) s >>= 2;
    else if (s < 0 && bpc === 0 && bnp - wnp < 400) s = -((-s) >> 2);
    if (bpc === 0 && bnp === 0 && wnp >= 500) s += mopup(pos.kings[1], pos.kings[0]);
    if (wpc === 0 && wnp === 0 && bnp >= 500) s -= mopup(pos.kings[0], pos.kings[1]);
    return (pos.turn === WHITE ? s : -s) + 10;
  }

  /* ================================================================ search */
  var TTN = 1 << 19, TTM = TTN - 1, ttK = null, ttMv, ttSc, ttDp, ttFl;
  function ttAlloc() {
    if (ttK) return;
    ttK = new Int32Array(TTN); ttMv = new Int32Array(TTN); ttSc = new Int16Array(TTN); ttDp = new Int8Array(TTN); ttFl = new Int8Array(TTN);
  }
  var EXACT = 1, LOWER = 2, UPPER = 3;
  var S = { pos: null, nodes: 0, stop: false, deadline: 0, useQ: true };
  var MOVES = new Int32Array(MAXPLY * MPP), SCORES = new Int32Array(MAXPLY * MPP);
  var KILL = new Int32Array(MAXPLY * 2), HIST = new Int32Array(16 * 128);

  function toTT(s, ply) { return s > MATE - 500 ? s + ply : (s < -MATE + 500 ? s - ply : s); }
  function fromTT(s, ply) { return s > MATE - 500 ? s - ply : (s < -MATE + 500 ? s + ply : s); }
  function isRep(pos) {
    var lo = pos.hlo, hi = pos.hhi, k = pos.ply, end = Math.max(0, k - pos.half);
    for (var j = k - 2; j >= end; j -= 2) if (pos.uLo[j] === lo && pos.uHi[j] === hi) return true;
    return false;
  }
  function hasPieces(b, c) {
    for (var sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      var p = b[sq];
      if (p && (p & 8) === c && (p & 7) !== PAWN && (p & 7) !== KING) return true;
    }
    return false;
  }
  function tick() {
    if ((++S.nodes & 2047) === 0 && Date.now() > S.deadline) S.stop = true;
    return S.stop;
  }
  function orderMoves(pos, base, n, ttm, ply) {
    var b = pos.board, k, m, fl, s;
    for (k = base; k < n; k++) {
      m = MOVES[k]; fl = m >>> 17;
      if (m === ttm) s = 3000000;
      else if (fl & F_CAP) s = 2000000 + (fl & F_EP ? VMG[PAWN] : VMG[b[(m >> 7) & 127] & 7]) * 16 - (b[m & 127] & 7) + ((m >> 14) & 7 ? 5000 : 0);
      else if ((m >> 14) & 7) s = ((m >> 14) & 7) === QUEEN ? 1900000 : -100000;
      else if (m === KILL[ply * 2]) s = 1500000;
      else if (m === KILL[ply * 2 + 1]) s = 1400000;
      else s = HIST[(b[m & 127] << 7) | ((m >> 7) & 127)];
      SCORES[k] = s;
    }
  }
  function pickNext(i, n) {
    var bi = i, bs = SCORES[i], k;
    for (k = i + 1; k < n; k++) if (SCORES[k] > bs) { bs = SCORES[k]; bi = k; }
    if (bi !== i) {
      var tm = MOVES[i]; MOVES[i] = MOVES[bi]; MOVES[bi] = tm;
      var ts = SCORES[i]; SCORES[i] = SCORES[bi]; SCORES[bi] = ts;
    }
    return MOVES[i];
  }

  function qsearch(alpha, beta, ply, qd) {
    var pos = S.pos;
    if (tick()) return 0;
    if (!S.useQ || ply >= MAXPLY - 1) return evaluate(pos);
    var us = pos.turn, inCheck = qd < 3 && pos.attacked(pos.kings[us >> 3], us ^ 8), stand = 0, best = -INF;
    if (!inCheck) {
      stand = evaluate(pos);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      best = stand;
    }
    var base = ply * MPP, n = pos.gen(MOVES, base, !inCheck), legal = 0, b = pos.board;
    orderMoves(pos, base, n, 0, ply);
    for (var k = base; k < n; k++) {
      var m = pickNext(k, n), fl = m >>> 17;
      if (!inCheck && (fl & F_CAP) && !((m >> 14) & 7)) {
        var gain = fl & F_EP ? VMG[PAWN] : VMG[b[(m >> 7) & 127] & 7];
        if (stand + gain + 200 < alpha) continue;
      }
      pos.make(m);
      if (pos.attacked(pos.kings[us >> 3], pos.turn)) { pos.unmake(); continue; }
      legal++;
      var sc = -qsearch(-beta, -alpha, ply + 1, qd + 1);
      pos.unmake();
      if (S.stop) return 0;
      if (sc > best) { best = sc; if (sc > alpha) { alpha = sc; if (sc >= beta) break; } }
    }
    if (inCheck && !legal) return -MATE + ply;
    return best;
  }

  function search(depth, alpha, beta, ply, nullOk) {
    var pos = S.pos;
    if (tick()) return 0;
    var pv = beta - alpha > 1;
    if (pos.half >= 100 || isRep(pos)) return 0;
    var ma = -MATE + ply; if (alpha < ma) alpha = ma;
    var mb = MATE - ply - 1; if (beta > mb) beta = mb;
    if (alpha >= beta) return alpha;
    var us = pos.turn, them = us ^ 8, inCheck = pos.attacked(pos.kings[us >> 3], them);
    if (inCheck) depth++;
    if (depth <= 0) return qsearch(alpha, beta, ply, 0);
    if (ply >= MAXPLY - 2) return evaluate(pos);
    var idx = pos.hlo & TTM, ttm = 0;
    if (ttK[idx] === pos.hhi && ttFl[idx]) {
      ttm = ttMv[idx];
      if (!pv && ttDp[idx] >= depth) {
        var ts = fromTT(ttSc[idx], ply), tf = ttFl[idx];
        if (tf === EXACT || (tf === LOWER && ts >= beta) || (tf === UPPER && ts <= alpha)) return ts;
      }
    }
    if (!pv && !inCheck) {
      var ev = evaluate(pos);
      if (depth <= 3 && ev - 110 * depth >= beta && beta > -MATE + 500 && beta < MATE - 500) return ev;
      if (nullOk && depth >= 3 && ev >= beta && hasPieces(pos.board, us)) {
        pos.makeNull();
        var ns = -search(depth - 1 - (depth > 6 ? 3 : 2), -beta, -beta + 1, ply + 1, false);
        pos.unmakeNull();
        if (S.stop) return 0;
        if (ns >= beta) return ns >= MATE - 500 ? beta : ns;
      }
    }
    var base = ply * MPP, n = pos.gen(MOVES, base, false), b = pos.board;
    orderMoves(pos, base, n, ttm, ply);
    var best = -INF, bestMove = 0, legal = 0, oldAlpha = alpha;
    for (var k = base; k < n; k++) {
      var m = pickNext(k, n), quiet = !((m >>> 17) & F_CAP) && !((m >> 14) & 7);
      pos.make(m);
      if (pos.attacked(pos.kings[us >> 3], pos.turn)) { pos.unmake(); continue; }
      legal++;
      var sc;
      if (legal === 1) sc = -search(depth - 1, -beta, -alpha, ply + 1, true);
      else {
        var red = 0;
        if (depth >= 3 && quiet && !inCheck && legal > 3 && m !== KILL[ply * 2] && m !== KILL[ply * 2 + 1] &&
          !pos.attacked(pos.kings[them >> 3], us)) {
          red = legal > 8 ? 2 : 1;
          if (pv && red > 1) red = 1;
        }
        sc = -search(depth - 1 - red, -alpha - 1, -alpha, ply + 1, true);
        if (sc > alpha && red && !S.stop) sc = -search(depth - 1, -alpha - 1, -alpha, ply + 1, true);
        if (sc > alpha && sc < beta && !S.stop) sc = -search(depth - 1, -beta, -alpha, ply + 1, true);
      }
      pos.unmake();
      if (S.stop) return 0;
      if (sc > best) {
        best = sc; bestMove = m;
        if (sc > alpha) {
          alpha = sc;
          if (sc >= beta) {
            if (quiet) {
              if (KILL[ply * 2] !== m) { KILL[ply * 2 + 1] = KILL[ply * 2]; KILL[ply * 2] = m; }
              var hi2 = (b[m & 127] << 7) | ((m >> 7) & 127);
              HIST[hi2] += depth * depth;
              if (HIST[hi2] > 1000000) for (var h = 0; h < HIST.length; h++) HIST[h] >>= 1;
            }
            break;
          }
        }
      }
    }
    if (!legal) return inCheck ? -MATE + ply : 0;
    ttK[idx] = pos.hhi; ttMv[idx] = bestMove; ttSc[idx] = toTT(best, ply); ttDp[idx] = depth;
    ttFl[idx] = best >= beta ? LOWER : (best > oldAlpha ? EXACT : UPPER);
    return best;
  }

  /* ================================================================ opening book (well-known main lines) */
  var BOOK = [
    'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8',
    'e2e4 e7e5 g1f3 b8c6 f1b5 g8f6 e1g1 f6e4 d2d4 e4d6 b5c6 d7c6 d4e5 d6f5',
    'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d3 d7d6 e1g1 e8g8',
    'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5 e1g1 d7d6 c2c3 e8g8',
    'e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6 e4e5 d8e7',
    'e2e4 e7e5 g1f3 b8c6 b1c3 g8f6 f1b5 f8b4 e1g1 e8g8',
    'e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5 f1d3 b8c6',
    'e2e4 e7e5 g1f3 d7d6 d2d4 e5d4 f3d4 g8f6 b1c3 f8e7',
    'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6 c1e3 e7e5',
    'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6 c1e3 f8g7',
    'e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5 d4b5 d7d6',
    'e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 b8c6 b1c3 d8c7',
    'e2e4 c7c5 c2c3 g8f6 e4e5 f6d5 d2d4 c5d4 g1f3 b8c6',
    'e2e4 c7c5 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7 d2d3 d7d6',
    'e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7 g5e7 d8e7',
    'e2e4 e7e6 d2d4 d7d5 e4e5 c7c5 c2c3 b8c6 g1f3 d8b6',
    'e2e4 e7e6 d2d4 d7d5 b1d2 g8f6 e4e5 f6d7 f1d3 c7c5',
    'e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6 h2h4 h7h6',
    'e2e4 c7c6 d2d4 d7d5 e4e5 c8f5 g1f3 e7e6 f1e2 c7c5',
    'e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6 g1f3 c8f5',
    'e2e4 g7g6 d2d4 f8g7 b1c3 d7d6 g1f3 g8f6',
    'e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 g1f3 f8g7 f1e2 e8g8',
    'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3 b8d7',
    'd2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5',
    'd2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5 e1g1 a7a6',
    'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8 f1e2 e7e5',
    'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5 g1f3 c7c5',
    'd2d4 g8f6 c2c4 e7e6 g1f3 b7b6 g2g3 c8b7 f1g2 f8e7 e1g1 e8g8',
    'd2d4 g8f6 c2c4 c7c5 d4d5 e7e6 b1c3 e6d5 c4d5 d7d6',
    'd2d4 g8f6 g1f3 e7e6 c1f4 c7c5 e2e3 b8c6 c2c3 d7d5',
    'd2d4 d7d5 g1f3 g8f6 c1f4 c7c5 e2e3 b8c6 c2c3 d8b6',
    'd2d4 d7d5 c1f4 g8f6 e2e3 e7e6 g1f3 f8d6 f1d3 e8g8',
    'c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5 c4d5 f6d5',
    'c2c4 g8f6 b1c3 e7e6 e2e4 d7d5 e4e5 d5d4',
    'c2c4 c7c5 g1f3 g8f6 b1c3 b8c6 g2g3 g7g6',
    'g1f3 d7d5 g2g3 g8f6 f1g2 c7c6 e1g1 c8g4 d2d3 b8d7',
    'g1f3 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 d2d4 e8g8'
  ];
  function bookMove(moves, rng) {
    var hist = moves.join(' '), cands = [];
    for (var k = 0; k < BOOK.length; k++) {
      var line = BOOK[k];
      if (!hist) { cands.push(line.split(' ')[0]); continue; }
      if (line.indexOf(hist + ' ') === 0) cands.push(line.slice(hist.length + 1).split(' ')[0]);
    }
    return cands.length ? cands[Math.floor(rng() * cands.length)] : null;
  }

  /* ================================================================ think: the computer's move */
  var LEVELS = [null,
    { depth: 1, time: 250, noise: 160, rnd: 0.22, q: false, book: false },
    { depth: 2, time: 400, noise: 70, rnd: 0.08, q: true, book: true },
    { depth: 3, time: 700, noise: 30, rnd: 0.03, q: true, book: true },
    { depth: 4, time: 900, noise: 10, rnd: 0, q: true, book: true },
    { depth: 64, time: 1500, noise: 0, rnd: 0, q: true, book: true },
    { depth: 64, time: 3000, noise: 0, rnd: 0, q: true, book: true }
  ];
  function rngFrom(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildPosition(fen, moves) {
    var r = parseFen(fen || START_FEN);
    if (r.error) return null;
    var pos = r.pos;
    for (var k = 0; k < (moves || []).length; k++) {
      var legal = pos.legalMoves(), m = 0;
      for (var j = 0; j < legal.length; j++) if (uci(legal[j]) === moves[k]) { m = legal[j]; break; }
      if (!m) return null;
      pos.room();
      pos.make(m);
    }
    return pos;
  }

  /* req = { fen, moves: [uci], level 1..6, time (ms cap), seed, book } →
     { move: uci | null, san, score (centipawns for the side to move), depth, nodes, ms, book } */
  function think(req) {
    req = req || {};
    var t0 = Date.now();
    var pos = buildPosition(req.fen, req.moves);
    if (!pos) return { error: 'position' };
    var legal = pos.legalMoves();
    if (!legal.length) return { move: null };
    var lv = LEVELS[Math.max(1, Math.min(6, (req.level | 0) || 6))];
    var rng = rngFrom(req.seed == null ? Math.floor(Math.random() * 4294967296) : req.seed);
    function done(m, score, depth, how) {
      return { move: uci(m), san: san(pos, m, legal), score: score, depth: depth, nodes: S.nodes, ms: Date.now() - t0, how: how };
    }
    S.nodes = 0;
    if (lv.book && req.book !== false && (req.fen || START_FEN) === START_FEN && (req.moves || []).length < 16) {
      var bm = bookMove(req.moves || [], rng);
      for (var k = 0; bm && k < legal.length; k++) if (uci(legal[k]) === bm) return done(legal[k], 0, 0, 'book');
    }
    ttAlloc();
    S.pos = pos; S.stop = false; S.useQ = lv.q;
    var budget = Math.max(40, Math.min(lv.time, req.time || lv.time));
    S.deadline = t0 + budget;
    for (k = 0; k < HIST.length; k++) HIST[k] >>= 2;
    KILL.fill(0);
    if (legal.length === 1) return done(legal[0], -evalAfter(pos, legal[0]), 0, 'only');
    if (lv.rnd && rng() < lv.rnd) return done(legal[Math.floor(rng() * legal.length)], 0, 0, 'random');
    var maxDepth = Math.min(lv.depth, req.depth || 64, MAXPLY - 12);
    var root = legal.slice(), rsc = root.map(function (m) { return -evalAfter(pos, m); }), d, v, best = 0, bestScore = -INF, depthDone = 0;
    sortRoot(root, rsc);
    if (lv.noise) {
      for (d = 1; d <= maxDepth; d++) {
        var sc = [], ok = true;
        for (k = 0; k < root.length; k++) {
          pos.make(root[k]); v = -search(d - 1, -INF, INF, 1, true); pos.unmake();
          if (S.stop) { ok = false; break; }
          sc.push(v);
        }
        if (!ok) break;
        rsc = sc; depthDone = d;
        if (Date.now() - t0 > budget * 0.5) break;
      }
      var bi = 0, bv = -INF;
      for (k = 0; k < root.length; k++) {
        var nv = rsc[k] + (Math.abs(rsc[k]) < MATE - 500 ? Math.round((rng() * 2 - 1) * lv.noise) : 0);
        if (nv > bv) { bv = nv; bi = k; }
      }
      return done(root[bi], rsc[bi], depthDone, 'search');
    }
    for (d = 1; d <= maxDepth; d++) {
      var alpha = -INF, beta = INF, iterBest = 0, iterScore = -INF;
      for (k = 0; k < root.length; k++) {
        var m = root[k];
        pos.make(m);
        if (k === 0) v = -search(d - 1, -beta, -alpha, 1, true);
        else {
          v = -search(d - 1, -alpha - 1, -alpha, 1, true);
          if (v > alpha && !S.stop) v = -search(d - 1, -beta, -alpha, 1, true);
        }
        pos.unmake();
        if (S.stop) break;
        rsc[k] = v;
        if (v > alpha) { alpha = v; iterBest = m; iterScore = v; }
      }
      if (S.stop) { if (iterBest) { best = iterBest; bestScore = iterScore; } break; }
      best = iterBest; bestScore = iterScore; depthDone = d;
      sortRoot(root, rsc, best);
      if (bestScore >= MATE - 500 || bestScore <= -MATE + 500) break;
      if (Date.now() - t0 > budget * 0.55) break;
    }
    if (!best) { best = root[0]; bestScore = rsc[0]; }
    return done(best, bestScore, depthDone, 'search');
  }
  function evalAfter(pos, m) {
    pos.make(m);
    var v = pos.hasLegalMove() ? evaluate(pos) : (pos.inCheck() ? -MATE : 0);
    pos.unmake();
    return v;
  }
  function sortRoot(root, sc, first) {
    var idx = root.map(function (_, k) { return k; });
    idx.sort(function (a, b) { if (root[a] === first) return -1; if (root[b] === first) return 1; return sc[b] - sc[a] || a - b; });
    var r2 = idx.map(function (k) { return root[k]; }), s2 = idx.map(function (k) { return sc[k]; });
    for (var k = 0; k < root.length; k++) { root[k] = r2[k]; sc[k] = s2[k]; }
  }

  return {
    START_FEN: START_FEN, WHITE: WHITE, BLACK: BLACK, PAWN: PAWN, KNIGHT: KNIGHT, BISHOP: BISHOP, ROOK: ROOK, QUEEN: QUEEN, KING: KING,
    F_CAP: F_CAP, F_EP: F_EP, F_CASTLE: F_CASTLE, F_DOUBLE: F_DOUBLE, MATE: MATE, LEVELS: LEVELS, BOOK: BOOK,
    Position: Position, Game: Game, parseFen: parseFen, parsePgn: parsePgn, parseMove: parseMove, san: san, uci: uci,
    sqName: sqName, sqIndex: sqIndex, mFrom: mFrom, mTo: mTo, mPromo: mPromo, mFlags: mFlags,
    insufficient: insufficient, canMate: canMate, counts: counts, perft: perft, evaluate: evaluate, think: think, buildPosition: buildPosition
  };
};
window.ChessEngine = window.ChessEngineFactory();
