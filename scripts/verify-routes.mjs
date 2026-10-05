import http from 'http';
import fs from 'fs';

// Read nav.config.ts and extract slugs using regex
const navConfigContent = fs.readFileSync('./src/lib/nav/nav.config.ts', 'utf8');

const groupRegex = /slug:\s*'([^']+)'/g;
const slugs = [];
let match;
while ((match = groupRegex.exec(navConfigContent)) !== null) {
  slugs.push(match[1]);
}

// 8 groups + 44 items = 52 slugs
console.log(`Found ${slugs.length} total slugs in nav.config.ts.`);

const groups = ['accounting', 'warehouses', 'cold-storage', 'banking', 'costs', 'reports', 'hr', 'setup'];
const routes = [];

// Parse groups and their items
const lines = navConfigContent.split('\n');
let currentGroup = '';

for (const line of lines) {
  if (line.includes("key: '") && !line.includes("cluster:")) {
    const keyMatch = line.match(/key:\s*'([^']+)'/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (groups.includes(key)) {
        currentGroup = key;
      } else if (currentGroup) {
        routes.push({ group: currentGroup, page: key });
      }
    }
  }
}

console.log(`Parsed ${routes.length} distinct item routes.`);

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, status: 500, error: err.message });
    });
  });
}

async function verifyAll() {
  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    const arUrl = `http://127.0.0.1:3088/dashboard/${r.group}/${r.page}`;
    const enUrl = `http://127.0.0.1:3088/en/dashboard/${r.group}/${r.page}`;

    const resAr = await checkUrl(arUrl);
    const resEn = await checkUrl(enUrl);

    if (resAr.status === 200) {
      passed++;
    } else {
      console.error(`[FAIL AR] ${arUrl} -> ${resAr.status}`);
      failed++;
    }

    if (resEn.status === 200) {
      passed++;
    } else {
      console.error(`[FAIL EN] ${enUrl} -> ${resEn.status}`);
      failed++;
    }
  }

  console.log(`Verification complete: ${passed} passed, ${failed} failed out of ${routes.length * 2} URL tests.`);
  if (failed > 0) process.exit(1);
}

verifyAll();
