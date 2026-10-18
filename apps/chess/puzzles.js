/* Puzzles for the Chess app, made for this app and verified with its own engine (scratch script):
   mate-in-1: exactly one legal move gives checkmate; mate-in-2: no mate in 1, exactly one first move (sol) after which
   every defence allows a mate. Fields: fen, n (moves to mate), sol (first move, UCI), theme (string key "th_<theme>"). */
window.CHESS_PUZZLES = [
  {"fen":"6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1","n":1,"sol":"d1d8","theme":"backrank"},
  {"fen":"r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4","n":1,"sol":"h5f7","theme":"scholar"},
  {"fen":"6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1","n":1,"sol":"h6f7","theme":"smothered"},
  {"fen":"rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2","n":1,"sol":"d8h4","theme":"fool"},
  {"fen":"7k/1R6/8/8/8/8/8/R5K1 w - - 0 1","n":1,"sol":"a1a8","theme":"ladder"},
  {"fen":"1k6/ppp5/8/2n5/8/P7/1P5Q/5K2 w - - 0 1","n":1,"sol":"h2h8","theme":"backrank"},
  {"fen":"4RNk1/5p1p/6p1/8/8/2P5/2B2K1P/8 w - - 0 1","n":1,"sol":"f8e6","theme":"knight"},
  {"fen":"4k3/3pppR1/1r2R3/8/6P1/5PK1/8/5b2 w - - 0 1","n":1,"sol":"g7g8","theme":"rooks"},
  {"fen":"B3N2k/1r4pp/8/8/2P5/3P1Q2/8/2K5 w - - 0 1","n":1,"sol":"f3f8","theme":"backrank"},
  {"fen":"7k/6pp/4B3/8/8/8/2QP1P2/1K6 w - - 0 1","n":1,"sol":"c2c8","theme":"backrank"},
  {"fen":"4q2k/6pp/6Q1/8/1B6/5PP1/8/7K w - - 0 1","n":1,"sol":"g6e8","theme":"capture"},
  {"fen":"7k/6pp/5R2/5R2/P3P3/8/2Kb4/8 w - - 0 1","n":1,"sol":"f6f8","theme":"rooks"},
  {"fen":"4k3/3pppRN/7B/8/P7/8/1K3P2/8 w - - 0 1","n":1,"sol":"g7g8","theme":"rooks"},
  {"fen":"6k1/5ppp/8/8/7Q/3K1b1r/3P1P2/8 w - - 0 1","n":1,"sol":"h4d8","theme":"backrank"},
  {"fen":"7k/4B1pp/7Q/8/1P6/N7/5P2/4K3 w - - 0 1","n":2,"sol":"e7f6","theme":"quiet"},
  {"fen":"6k1/5p1p/8/8/7P/K5N1/P3Q3/2B5 w - - 0 1","n":2,"sol":"c1h6","theme":"quiet"},
  {"fen":"7k/6pp/3n2B1/1R6/3PP3/3r4/8/5K2 w - - 0 1","n":2,"sol":"b5b8","theme":"backrank"},
  {"fen":"6k1/5ppp/4q3/3R4/4B3/2P5/3K1P1N/8 w - - 0 1","n":2,"sol":"d5d8","theme":"backrank"},
  {"fen":"6k1/1Q3p1p/8/8/r2P4/1B1K4/n2N2P1/8 w - - 0 1","n":2,"sol":"b7f7","theme":"sacrifice"},
  {"fen":"2k5/ppp4R/6R1/2q5/8/2P1P3/2K5/8 w - - 0 1","n":2,"sol":"g6g8","theme":"rooks"},
  {"fen":"7k/6pp/8/8/4rP2/R7/1P2R3/3K4 w - - 0 1","n":2,"sol":"a3a8","theme":"rooks"},
  {"fen":"6k1/3N1p1p/n3Q1p1/8/8/3P4/3P3B/K7 w - - 0 1","n":2,"sol":"e6e8","theme":"queen"},
  {"fen":"1k3n2/ppp5/7N/4B3/8/P7/1K3P2/2Q5 w - - 0 1","n":2,"sol":"c1c7","theme":"sacrifice"},
  {"fen":"r3k3/2nppp2/8/8/2R5/3P4/7P/R6K w - - 0 1","n":2,"sol":"a1a8","theme":"rooks"},
  {"fen":"6kB/4Qp1p/6p1/2b2N2/5P2/6K1/1P6/8 w - - 0 1","n":2,"sol":"f5h6","theme":"knight"},
  {"fen":"1N4k1/5pp1/6np/5Q2/2B5/6PK/7P/8 w - - 0 1","n":2,"sol":"f5f7","theme":"sacrifice"},
  {"fen":"n5k1/5pp1/6Bp/N3r3/6Q1/P7/K5P1/8 w - - 0 1","n":2,"sol":"g4c8","theme":"queen"}
];
