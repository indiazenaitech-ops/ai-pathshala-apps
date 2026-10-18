/* Motion Graphs Lab: language-free data (presets, vehicles, quiz structure). Texts live in strings.js / content.js. */
window.MG_DATA = (function () {
  'use strict';
  function A(u, v, t) { return { type: 'accel', u: u, v: v, t: t }; }
  function C(v, t) { return { type: 'const', u: v, v: v, t: t }; }

  /* scenario presets: the first one is the default scenario */
  var presets = {
    car: { vehicle: 'car', segs: [A(0, 20, 10), C(20, 20), A(20, 0, 5)] },            /* 100 + 400 + 50 = 550 m */
    bus: { vehicle: 'bus', segs: [A(0, 12, 6), C(12, 20), A(12, 0, 4)] },             /* 36 + 240 + 24 = 300 m */
    cycle: { vehicle: 'cycle', segs: [C(6, 10), A(6, 2, 10), C(2, 10)] },             /* 60 + 40 + 20 = 120 m */
    train: { vehicle: 'train', segs: [A(0, 15, 30), C(15, 30), A(15, 25, 20)] },      /* 225 + 450 + 400 = 1075 m */
    ball: { vehicle: 'ball', segs: [A(19.6, -19.6, 4)] }                              /* up 19.6 m and back: displacement 0 */
  };
  var PRESET_ORDER = ['car', 'bus', 'cycle', 'train', 'ball'];
  var vehicles = { car: '🚗', bus: '🚌', cycle: '🚴', train: '🚆', ball: '🏐', dot: null };
  var VEHICLE_ORDER = ['car', 'bus', 'cycle', 'train', 'ball', 'dot'];

  /* graph shapes for the quiz (small graphs without numbers); each is a tiny scenario */
  var shapes = {
    rest_d: { d0: 20, segs: [C(0, 10)] },
    uniform_d: { segs: [C(5, 10)] },
    accel_d: { segs: [A(0, 10, 10)] },
    decel_d: { segs: [A(10, 0, 10)] },
    out_stop_back_d: { segs: [C(5, 4), C(0, 3), C(-5, 4)] },
    out_back_d: { segs: [C(5, 5), C(-5, 5)] },
    up_flat_d: { segs: [C(5, 5), C(0, 5)] },
    uniform_v: { segs: [C(6, 10)] },
    zero_v: { segs: [C(0, 10)] },
    accel_v: { segs: [A(0, 10, 10)] },
    decel_v: { segs: [A(10, 0, 10)] },
    trap_v: { segs: [A(0, 10, 3), C(10, 4), A(10, 0, 3)] },
    flat_decel_v: { segs: [C(10, 6), A(10, 0, 4)] },
    low_ramp_high_v: { segs: [C(5, 3), A(5, 10, 3), C(10, 4)] },
    pos_neg_v: { segs: [A(10, -10, 10)] },
    neg_pos_v: { segs: [A(-10, 10, 10)] },
    accel_from_speed_v: { segs: [A(5, 10, 10)] },
    a_pos: { segs: [A(0, 10, 10)] },
    a_zero: { segs: [C(5, 10)] },
    a_neg: { segs: [A(10, 0, 10)] },
    a_pos_zero: { segs: [A(0, 10, 5), C(10, 5)] }
  };

  /* 12 "which graph matches the story?" items: kind of graph, four shapes, index of the right one (before shuffling) */
  var stories = [
    { kind: 'd', opts: ['rest_d', 'uniform_d', 'accel_d', 'out_back_d'], ans: 0 },
    { kind: 'v', opts: ['uniform_v', 'accel_v', 'decel_v', 'zero_v'], ans: 0 },
    { kind: 'v', opts: ['accel_v', 'uniform_v', 'decel_v', 'accel_from_speed_v'], ans: 0 },
    { kind: 'v', opts: ['decel_v', 'accel_v', 'uniform_v', 'flat_decel_v'], ans: 0 },
    { kind: 'd', opts: ['out_stop_back_d', 'up_flat_d', 'out_back_d', 'uniform_d'], ans: 0 },
    { kind: 'v', opts: ['pos_neg_v', 'neg_pos_v', 'decel_v', 'accel_v'], ans: 0 },
    { kind: 'd', opts: ['uniform_d', 'rest_d', 'accel_d', 'decel_d'], ans: 0 },
    { kind: 'd', opts: ['accel_d', 'uniform_d', 'decel_d', 'rest_d'], ans: 0 },
    { kind: 'v', opts: ['trap_v', 'flat_decel_v', 'low_ramp_high_v', 'uniform_v'], ans: 0 },
    { kind: 'v', opts: ['flat_decel_v', 'trap_v', 'decel_v', 'low_ramp_high_v'], ans: 0 },
    { kind: 'v', opts: ['low_ramp_high_v', 'trap_v', 'accel_from_speed_v', 'uniform_v'], ans: 0 },
    { kind: 'a', opts: ['a_pos', 'a_zero', 'a_neg', 'a_pos_zero'], ans: 0 }
  ];

  /* 8 "read the graph" items: the graph is drawn with numbers; the answer is a number with a unit */
  var reads = [
    { kind: 'd', segs: [C(5, 12)], ans: 5, unit: 'ms', vars: { d: 60, t: 12 } },
    { kind: 'v', segs: [C(8, 15)], ans: 120, unit: 'm', vars: { v: 8, t: 15 } },
    { kind: 'v', segs: [A(0, 12, 6)], ans: 2, unit: 'ms2', vars: { v: 12, t: 6 } },
    { kind: 'v', segs: [A(0, 12, 6)], ans: 36, unit: 'm', vars: { v: 12, t: 6 } },
    { kind: 'd', segs: [C(5, 8), C(0, 2)], ans: 4, unit: 'ms', vars: { d: 40, t1: 8, t: 10 } },
    { kind: 'v', segs: [A(0, 10, 4), C(10, 6), A(10, 0, 2)], ans: 90, unit: 'm', vars: { v: 10, t1: 4, t2: 10, t3: 12 } },
    { kind: 'v', segs: [A(20, 0, 5)], ans: -4, unit: 'ms2', vars: { u: 20, t: 5 } },
    { kind: 'd', segs: [C(5, 6), C(-7.5, 4)], ans: 0, unit: 'm', vars: { d: 30, t1: 6, t: 10 } }
  ];

  /* printable worksheet: 3 story questions + 3 read-the-graph questions (indexes into the lists above) */
  var worksheet = { stories: [2, 4, 8], reads: [0, 3, 5] };

  return { presets: presets, PRESET_ORDER: PRESET_ORDER, vehicles: vehicles, VEHICLE_ORDER: VEHICLE_ORDER, shapes: shapes, stories: stories, reads: reads, worksheet: worksheet };
})();
