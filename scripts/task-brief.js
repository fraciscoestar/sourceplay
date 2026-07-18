const fs = require('fs');
const path = require('path');

const planFile = process.argv[2];
const taskNum = process.argv[3];
let outFile = process.argv[4];

if (!planFile || !taskNum) {
  console.error("Usage: node task-brief.js PLAN_FILE TASK_NUMBER [OUTFILE]");
  process.exit(1);
}

const fullPlanPath = path.resolve(planFile);
if (!fs.existsSync(fullPlanPath)) {
  console.error(`Plan file not found: ${fullPlanPath}`);
  process.exit(1);
}

if (!outFile) {
  const root = path.resolve(__dirname, '..');
  const sddDir = path.join(root, '.superpowers', 'sdd');
  if (!fs.existsSync(sddDir)) {
    fs.mkdirSync(sddDir, { recursive: true });
  }
  outFile = path.join(sddDir, `task-${taskNum}-brief.md`);
}

const content = fs.readFileSync(fullPlanPath, 'utf-8');
const lines = content.split(/\r?\n/);
let inTask = false;
let taskContent = [];
let infence = false;

const taskHeadingRegex = new RegExp(`^#+[ \\t]+Task[ \\t]+${taskNum}([^0-9]|$)`, 'i');
const generalTaskHeadingRegex = /^#+[ \t]+Task[ \t]+[0-9]+/i;

for (let line of lines) {
  if (line.startsWith('```')) {
    infence = !infence;
  }
  if (!infence && generalTaskHeadingRegex.test(line)) {
    if (taskHeadingRegex.test(line)) {
      inTask = true;
    } else {
      inTask = false;
    }
  }
  if (inTask) {
    taskContent.push(line);
  }
}

if (taskContent.length === 0) {
  console.error(`Task ${taskNum} not found in ${planFile}`);
  process.exit(1);
}

fs.writeFileSync(outFile, taskContent.join('\n'));
console.log(`wrote ${outFile}: ${taskContent.length} lines`);
