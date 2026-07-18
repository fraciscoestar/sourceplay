const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error("Usage: node task-brief.js PLAN_FILE TASK_NUMBER [OUTFILE]");
  process.exit(1);
}

const planFile = process.argv[2];
const taskNum = process.argv[3];
let outFile = process.argv[4];

if (!fs.existsSync(planFile)) {
  console.error(`No such plan file: ${planFile}`);
  process.exit(1);
}

const content = fs.readFileSync(planFile, 'utf8');
const lines = content.split(/\r?\n/);

let inTask = false;
let taskLines = [];
let infence = false;

for (let line of lines) {
  if (line.startsWith('```')) {
    infence = !infence;
  }
  
  if (!infence && /^#+[ \t]+Task[ \t]+([0-9]+)/i.test(line)) {
    const match = line.match(/^#+[ \t]+Task[ \t]+([0-9]+)/i);
    if (match && match[1] === taskNum) {
      inTask = true;
    } else {
      inTask = false;
    }
  }
  
  if (inTask) {
    taskLines.push(line);
  }
}

if (taskLines.length === 0) {
  console.error(`Task ${taskNum} not found in ${planFile}`);
  process.exit(1);
}

if (!outFile) {
  const repoRoot = path.join(__dirname, '..');
  const sddDir = path.join(repoRoot, '.superpowers', 'sdd');
  fs.mkdirSync(sddDir, { recursive: true });
  outFile = path.join(sddDir, `task-${taskNum}-brief.md`);
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
}

fs.writeFileSync(outFile, taskLines.join('\n'), 'utf8');
console.log(`wrote ${outFile}: ${taskLines.length} lines`);
