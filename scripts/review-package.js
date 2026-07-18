const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error("Usage: node review-package.js BASE HEAD [OUTFILE]");
  process.exit(1);
}

const base = process.argv[2];
const head = process.argv[3];
let outFile = process.argv[4];

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error(`Git command failed: ${cmd}\nError: ${e.message}`);
    process.exit(1);
  }
}

// Verify base and head
runGit(`git rev-parse --verify --quiet ${base}`);
runGit(`git rev-parse --verify --quiet ${head}`);

const baseShort = runGit(`git rev-parse --short ${base}`);
const headShort = runGit(`git rev-parse --short ${head}`);

if (!outFile) {
  const repoRoot = path.join(__dirname, '..');
  const sddDir = path.join(repoRoot, '.superpowers', 'sdd');
  fs.mkdirSync(sddDir, { recursive: true });
  outFile = path.join(sddDir, `review-${baseShort}..${headShort}.diff`);
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
}

let output = [];
output.push(`# Review package: ${base}..${head}\n`);
output.push("## Commits");
output.push(runGit(`git log --oneline ${base}..${head}`));
output.push("\n## Files changed");
output.push(runGit(`git diff --stat ${base}..${head}`));
output.push("\n## Diff");
output.push(runGit(`git diff -U10 ${base}..${head}`));

fs.writeFileSync(outFile, output.join('\n'), 'utf8');

const commitCount = runGit(`git rev-list --count ${base}..${head}`);
const stats = fs.statSync(outFile);
console.log(`wrote ${outFile}: ${commitCount} commit(s), ${stats.size} bytes`);
