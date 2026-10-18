/* Flowchart & Algorithm Lab: the 12 example programs (structure only).
   Texts marked {{key}} are filled from content.js in the current language when an example is loaded
   (the loaded program is then the user's own: switching the language later does not change it). */
window.FC_EXAMPLES = [
  { id: 'sum2', inputs: ['12', '8'], blocks: [
    { type: 'input', var: 'a', prompt: '{{p_a}}' },
    { type: 'input', var: 'b', prompt: '{{p_b}}' },
    { type: 'process', var: 'total', expr: 'a + b' },
    { type: 'output', expr: '"{{s_sum}}", total' }
  ] },
  { id: 'largest3', inputs: ['5', '9', '2'], blocks: [
    { type: 'input', var: 'a', prompt: '{{p_a}}' },
    { type: 'input', var: 'b', prompt: '{{p_b}}' },
    { type: 'input', var: 'c', prompt: '{{p_c}}' },
    { type: 'process', var: 'largest', expr: 'a' },
    { type: 'decision', cond: 'b > largest', yes: [{ type: 'process', var: 'largest', expr: 'b' }], no: [] },
    { type: 'decision', cond: 'c > largest', yes: [{ type: 'process', var: 'largest', expr: 'c' }], no: [] },
    { type: 'output', expr: '"{{s_largest}}", largest' }
  ] },
  { id: 'evenodd', inputs: ['7'], blocks: [
    { type: 'input', var: 'n', prompt: '{{p_n}}' },
    { type: 'decision', cond: 'n % 2 == 0',
      yes: [{ type: 'output', expr: 'n, "{{s_even}}"' }],
      no: [{ type: 'output', expr: 'n, "{{s_odd}}"' }] }
  ] },
  { id: 'factorial', inputs: ['5'], blocks: [
    { type: 'input', var: 'n', prompt: '{{p_n}}' },
    { type: 'process', var: 'fact', expr: '1' },
    { type: 'for', var: 'i', from: '1', to: 'n', step: '1', body: [{ type: 'process', var: 'fact', expr: 'fact * i' }] },
    { type: 'output', expr: '"{{s_fact}}", fact' }
  ] },
  { id: 'table', inputs: ['7'], blocks: [
    { type: 'input', var: 'n', prompt: '{{p_n}}' },
    { type: 'for', var: 'i', from: '1', to: '10', step: '1', body: [{ type: 'output', expr: 'n, "x", i, "=", n * i' }] }
  ] },
  { id: 'grade', inputs: ['78'], blocks: [
    { type: 'input', var: 'marks', prompt: '{{p_marks}}' },
    { type: 'decision', cond: 'marks >= 90', yes: [{ type: 'process', var: 'grade', expr: '"A"' }],
      no: [{ type: 'decision', cond: 'marks >= 75', yes: [{ type: 'process', var: 'grade', expr: '"B"' }],
        no: [{ type: 'decision', cond: 'marks >= 60', yes: [{ type: 'process', var: 'grade', expr: '"C"' }],
          no: [{ type: 'decision', cond: 'marks >= 33', yes: [{ type: 'process', var: 'grade', expr: '"D"' }],
            no: [{ type: 'process', var: 'grade', expr: '"F"' }] }] }] }] },
    { type: 'output', expr: '"{{s_grade}}", grade' }
  ] },
  { id: 'sum1n', inputs: ['10'], blocks: [
    { type: 'input', var: 'n', prompt: '{{p_n}}' },
    { type: 'process', var: 'sum', expr: '0' },
    { type: 'process', var: 'i', expr: '1' },
    { type: 'while', cond: 'i <= n', body: [
      { type: 'process', var: 'sum', expr: 'sum + i' },
      { type: 'process', var: 'i', expr: 'i + 1' }
    ] },
    { type: 'output', expr: '"{{s_sum}}", sum' }
  ] },
  { id: 'prime', inputs: ['29'], blocks: [
    { type: 'input', var: 'n', prompt: '{{p_n}}' },
    { type: 'process', var: 'prime', expr: 'True' },
    { type: 'decision', cond: 'n < 2', yes: [{ type: 'process', var: 'prime', expr: 'False' }], no: [] },
    { type: 'for', var: 'i', from: '2', to: 'n - 1', step: '1', body: [
      { type: 'decision', cond: 'n % i == 0', yes: [{ type: 'process', var: 'prime', expr: 'False' }], no: [] }
    ] },
    { type: 'decision', cond: 'prime == True',
      yes: [{ type: 'output', expr: 'n, "{{s_prime}}"' }],
      no: [{ type: 'output', expr: 'n, "{{s_notprime}}"' }] }
  ] },
  { id: 'si', inputs: ['5000', '8', '3'], blocks: [
    { type: 'input', var: 'p', prompt: '{{p_p}}' },
    { type: 'input', var: 'r', prompt: '{{p_r}}' },
    { type: 'input', var: 't', prompt: '{{p_t}}' },
    { type: 'process', var: 'si', expr: 'p * r * t / 100' },
    { type: 'process', var: 'amount', expr: 'p + si' },
    { type: 'output', expr: '"{{s_si}}", si' },
    { type: 'output', expr: '"{{s_amount}}", amount' }
  ] },
  { id: 'atm', inputs: ['2500', '1500'], blocks: [
    { type: 'input', var: 'balance', prompt: '{{p_balance}}' },
    { type: 'input', var: 'amount', prompt: '{{p_amount}}' },
    { type: 'decision', cond: 'amount > balance',
      yes: [{ type: 'output', expr: '"{{s_insufficient}}"' }],
      no: [{ type: 'decision', cond: 'amount % 100 != 0',
        yes: [{ type: 'output', expr: '"{{s_multiple}}"' }],
        no: [
          { type: 'process', var: 'balance', expr: 'balance - amount' },
          { type: 'output', expr: '"{{s_collect}}", amount' },
          { type: 'output', expr: '"{{s_balance}}", balance' }
        ] }] }
  ] },
  { id: 'leap', inputs: ['2024'], blocks: [
    { type: 'input', var: 'year', prompt: '{{p_year}}' },
    { type: 'decision', cond: '(year % 4 == 0 and year % 100 != 0) or year % 400 == 0',
      yes: [{ type: 'output', expr: 'year, "{{s_leap}}"' }],
      no: [{ type: 'output', expr: 'year, "{{s_notleap}}"' }] }
  ] },
  { id: 'gcd', inputs: ['48', '18'], blocks: [
    { type: 'input', var: 'a', prompt: '{{p_a}}' },
    { type: 'input', var: 'b', prompt: '{{p_b}}' },
    { type: 'while', cond: 'b != 0', body: [
      { type: 'process', var: 'temp', expr: 'b' },
      { type: 'process', var: 'b', expr: 'a % b' },
      { type: 'process', var: 'a', expr: 'temp' }
    ] },
    { type: 'output', expr: '"{{s_gcd}}", a' }
  ] }
];
