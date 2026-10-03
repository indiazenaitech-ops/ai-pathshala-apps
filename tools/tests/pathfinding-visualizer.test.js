/* Interaction test for Maze Solver (Search). Run by tools/verify.js in en and hi.
   The app's answers are checked against an independent BFS (fewest steps) and Dijkstra (cheapest cost). */
module.exports = async function ({ page, expect, log }) {
  const dbg = () => page.evaluate(() => window.PF_DEBUG());
  const WALL = 1, MUD = 2;

  function reference(s) {
    const { cols, rows, cells, start, goal } = s, N = cols * rows;
    const nbrs = (i) => {
      const r = Math.floor(i / cols), c = i % cols, out = [];
      if (r > 0) out.push(i - cols); if (c < cols - 1) out.push(i + 1); if (r < rows - 1) out.push(i + cols); if (c > 0) out.push(i - 1);
      return out.filter(j => cells[j] !== WALL);
    };
    const dist = new Array(N).fill(-1); dist[start] = 0; const q = [start];
    for (let h = 0; h < q.length; h++) for (const v of nbrs(q[h])) if (dist[v] < 0) { dist[v] = dist[q[h]] + 1; q.push(v); }
    const cost = new Array(N).fill(Infinity), done = new Array(N).fill(false); cost[start] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && cost[i] < Infinity && (u < 0 || cost[i] < cost[u])) u = i;
      if (u < 0) break;
      done[u] = true;
      for (const v of nbrs(u)) { const nc = cost[u] + (cells[v] === MUD ? 5 : 1); if (nc < cost[v]) cost[v] = nc; }
    }
    return { steps: dist[goal] < 0 ? null : dist[goal], cost: cost[goal] === Infinity ? null : cost[goal] };
  }
  function validPath(s, path) {
    if (!path.length || path[0] !== s.start || path[path.length - 1] !== s.goal) return false;
    for (let k = 1; k < path.length; k++) {
      const a = path[k - 1], b = path[k];
      const ok = (Math.abs(a - b) === s.cols) || (Math.abs(a - b) === 1 && Math.floor(a / s.cols) === Math.floor(b / s.cols));
      if (!ok || s.cells[b] === WALL) return false;
    }
    return true;
  }
  const pathCost = (s, path) => path.slice(1).reduce((a, i) => a + (s.cells[i] === MUD ? 5 : 1), 0);

  // 1) default board: odd-sized grid with start + goal, nothing searched yet
  let s = await dbg();
  expect(s.cols >= 9 && s.rows >= 7 && s.cols % 2 === 1 && s.rows % 2 === 1, `grid is odd-sized, got ${s.cols}x${s.rows}`);
  expect(s.cells.some(c => c === MUD) && s.cells.some(c => c === WALL), 'demo board has walls and mud');
  expect(s.mode === 'idle' && !s.result, 'nothing searched at start');
  const ref0 = reference(s);
  log('grid', s.cols + 'x' + s.rows, 'ref steps', ref0.steps, 'ref cost', ref0.cost);

  // 2) BFS, instant: fewest steps, but on the demo board it walks through the mud
  await page.click('#speed button[data-speed="instant"]');
  await page.click('#alg-bfs');
  await page.click('#run');
  s = await dbg();
  expect(s.mode === 'done' && s.result.found, 'BFS finishes and finds the goal');
  expect(s.result.steps === ref0.steps, `BFS path has the fewest steps (${ref0.steps}), got ${s.result.steps}`);
  expect(validPath(s, s.result.path), 'BFS path is a valid chain of neighbouring open cells');
  expect(Number(await page.getAttribute('#st-steps', 'data-value')) === ref0.steps, 'Path steps stat shows the BFS steps');
  const bfsCost = s.result.cost;
  expect(bfsCost === pathCost(s, s.result.path), 'BFS cost = sum of cells entered');
  expect(bfsCost > ref0.cost, `demo: BFS (cost ${bfsCost}) is dearer than the cheapest path (${ref0.cost}) because it ignores mud`);
  expect(await page.$eval('#msg', m => m.dataset.kind === 'warn'), 'message warns that a cheaper path exists');

  // 3) Dijkstra and A*: cheapest cost; A* explores no more cells than Dijkstra
  await page.click('#alg-dij');
  await page.click('#run');
  s = await dbg();
  expect(s.result.found && s.result.cost === ref0.cost, `Dijkstra finds the cheapest cost ${ref0.cost}, got ${s.result.cost}`);
  const dijExplored = s.result.explored;
  expect(Number(await page.getAttribute('#st-cost', 'data-value')) === ref0.cost, 'Path cost stat shows the Dijkstra cost');
  await page.click('#alg-astar');
  await page.click('#run');
  s = await dbg();
  expect(s.result.found && s.result.cost === ref0.cost, `A* finds the cheapest cost ${ref0.cost}, got ${s.result.cost}`);
  expect(s.result.explored <= dijExplored, `A* explores no more than Dijkstra (${s.result.explored} vs ${dijExplored})`);
  expect(await page.$eval('#msg', m => m.dataset.kind === 'good'), 'message says this is the cheapest path');

  // 4) Step mode: three presses = three cells taken out of the waiting list
  await page.click('#alg-bfs');
  await page.click('#step');
  await page.click('#step');
  await page.click('#step');
  s = await dbg();
  expect(s.mode === 'paused' && s.evi === 3, `3 steps → 3 events replayed, got ${s.evi} (${s.mode})`);
  expect(Number(await page.getAttribute('#st-explored', 'data-value')) === 3, 'Explored stat counts 3 cells');

  // 5) clear everything and draw a wall by dragging across the board
  await page.click('#clear-all');
  s = await dbg();
  expect(s.cells.every(c => c === 0), 'Clear walls & mud leaves an empty grid');
  await page.click('#tool-wall');
  await page.$eval('#board', e => e.scrollIntoView({ block: 'center' }));
  const box = await page.$eval('#board', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const cw = box.w / s.cols, chh = box.h / s.rows;
  const sc = s.start % s.cols, gc = s.goal % s.cols, col = Math.floor((sc + gc) / 2);
  const at = (r, c) => [box.x + (c + 0.5) * cw, box.y + (r + 0.5) * chh];
  let p = at(0, col);
  await page.mouse.move(p[0], p[1]); await page.mouse.down();
  p = at(s.rows - 2, col);
  await page.mouse.move(p[0], p[1], { steps: 12 }); await page.mouse.up();
  s = await dbg();
  let wallsInCol = 0;
  for (let r = 0; r < s.rows; r++) if (s.cells[r * s.cols + col] === WALL) wallsInCol++;
  expect(wallsInCol === s.rows - 1, `dragging drew ${s.rows - 1} walls in column ${col + 1}, got ${wallsInCol}`);

  // 6) mud: one tap paints a mud cell
  await page.click('#tool-mud');
  p = at(1, 1);
  await page.mouse.click(p[0], p[1]);
  s = await dbg();
  expect(s.cells[s.cols + 1] === MUD, 'tapping with the Mud tool makes a mud cell');

  // 7) compare all five on this grid
  await page.click('#cmp-btn');
  const rowsN = await page.$$eval('#cmp-body tr', r => r.length);
  expect(rowsN === 5, 'compare table has 5 rows, got ' + rowsN);
  const ref1 = reference(s);
  const row = async (a) => page.$eval('#cmp-row-' + a, tr => ({ explored: +tr.dataset.explored, steps: tr.dataset.steps === '' ? null : +tr.dataset.steps, cost: tr.dataset.cost === '' ? null : +tr.dataset.cost, cheapest: tr.dataset.cheapest === '1' }));
  const bfs = await row('bfs'), dij = await row('dij'), ast = await row('astar'), gre = await row('greedy'), dfs = await row('dfs');
  expect(bfs.steps === ref1.steps, `compare: BFS steps ${bfs.steps} = reference ${ref1.steps}`);
  expect(dij.cost === ref1.cost && ast.cost === ref1.cost && dij.cheapest && ast.cheapest, `compare: Dijkstra and A* cost = reference ${ref1.cost}`);
  expect(gre.cost >= ref1.cost && dfs.cost >= ref1.cost && dfs.steps >= ref1.steps, 'compare: no algorithm beats the true cheapest / shortest');
  expect(ast.explored <= dij.explored, `compare: A* explored ${ast.explored} ≤ Dijkstra ${dij.explored}`);
  expect((await page.$$eval('#cmp-ins li', l => l.length)) >= 3, 'compare shows at least 3 insights');

  // 8) drag the goal to a new cell; after a finished run the path updates live
  await page.click('#alg-astar');
  await page.click('#run');
  s = await dbg();
  const g0 = s.goal, gr0 = Math.floor(g0 / s.cols), gc0 = g0 % s.cols;
  const targetRow = gr0 >= 2 ? gr0 - 2 : gr0 + 2;
  p = at(gr0, gc0); await page.mouse.move(p[0], p[1]); await page.mouse.down();
  p = at(targetRow, gc0); await page.mouse.move(p[0], p[1], { steps: 6 }); await page.mouse.up();
  s = await dbg();
  expect(s.goal === targetRow * s.cols + gc0, `goal moved to row ${targetRow + 1}, got index ${s.goal}`);
  const ref2 = reference(s);
  expect(s.mode === 'done' && s.result.cost === ref2.cost && s.result.path[s.result.path.length - 1] === s.goal, 'A* re-ran live and still finds the cheapest path to the moved goal');

  // 9) maze generator: walls everywhere, start and goal open, solvable, and A* is still optimal
  await page.click('#gen-maze');
  s = await dbg();
  const wallShare = s.cells.filter(c => c === WALL).length / s.cells.length;
  expect(wallShare > 0.3 && s.cells[s.start] !== WALL && s.cells[s.goal] !== WALL, 'maze has many walls and open start/goal, wall share ' + wallShare.toFixed(2));
  const ref3 = reference(s);
  expect(ref3.steps !== null, 'the maze can be solved');
  await page.click('#run');
  s = await dbg();
  expect(s.result.found && s.result.cost === ref3.cost && validPath(s, s.result.path), 'A* solves the maze with the cheapest path');
  // compare table updated itself for the new grid
  const dij3 = await row('dij');
  expect(dij3.cost === ref3.cost, 'compare table refreshed after the maze was made');

  // 10) the grid survives a reload
  const cellsBefore = s.cells.join('');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  s = await dbg();
  expect(s.cells.join('') === cellsBefore && s.alg === 'astar' && s.speed === 'instant', 'grid, algorithm and speed are restored after reload');

  // 11) animated run (fast) finishes by itself
  await page.click('#speed button[data-speed="fast"]');
  await page.click('#run');
  await page.waitForFunction(() => window.PF_DEBUG().mode === 'done', null, { timeout: 30000 });
  s = await dbg();
  expect(s.result.found && s.evi === s.events, 'animated run replays every event and finishes');
};
