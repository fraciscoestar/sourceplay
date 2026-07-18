const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const base = process.argv[2];
const head = process.argv[3];
let outFile = process.argv[4];

if (!base || !head) {
  console.error("Usage: node review-package.js BASE HEAD [OUTFILE]");
  process.exit(1);
}

try {
  execSync(`git rev-parse --verify --quiet ${base}`, { stdio: 'ignore' });
} catch (e) {
  console.error(`bad BASE: ${base}`);
  process.exit(1);
}

try {
  execSync(`git rev-parse --verify --quiet ${head}`, { stdio: 'ignore' });
} catch (e) {
  console.error(`bad HEAD: ${head}`);
  process.exit(1);
}

const shortBase = execSync(`git rev-parse --short ${base}`).toString().trim();
const shortHead = execSync(`git rev-parse --short ${head}`).toString().trim();

if (!outFile) {
  const root = path.resolve(__dirname, '..');
  const sddDir = path.join(root, '.superpowers', 'sdd');
  if (!fs.existsSync(sddDir)) {
    fs.mkdirSync(sddDir, { recursive: true });
  }
  outFile = path.join(sddDir, `review-${shortBase}..${shortHead}.diff`);
}

const commits = execSync(`git log --oneline ${base}..${head}`).toString();
const stat = execSync(`git diff --stat ${base}..${head}`).toString();
const diff = execSync(`git diff -U10 ${base}..${head}`).toString();
const commitCount = execSync(`git rev-list --count ${base}..${head}`).toString().trim();

const output = [
  `# Review package: ${base}..${head}`,
  '',
  '## Commits',
  commits,
  '',
  '## Files changed',
  stat,
  '',
  '## Diff',
  diff
].join('\n');

fs.writeFileSync(outFile, output);
console.log(`wrote ${outFile}: ${commitCount} commit(s), ${output.length} bytes`);
