/* Finds a Chrome/Chromium/Edge binary for the headless checks, on Windows, macOS and Linux (cloud sessions, CI).
 *   const CHROME = require('./chrome-path')();   // null when none is found
 * Order: $EDU_CHROME / $CHROME_PATH, the usual install paths, then a Chromium downloaded by Playwright
 * (`npx playwright install chromium` puts it in ~/.cache/ms-playwright on Linux). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');

module.exports = function findChrome() {
  const list = [process.env.EDU_CHROME, process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/snap/bin/chromium', '/opt/google/chrome/chrome'];
  const pw = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), '.cache', 'ms-playwright'), path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')];
  for (const dir of pw) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const d of fs.readdirSync(dir).filter(n => /^chromium(_headless_shell)?-\d+/.test(n)).sort().reverse()) {
      for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) list.push(path.join(dir, d, sub));
    }
  }
  return list.find(p => p && fs.existsSync(p)) || null;
};
