const fs = require('fs');
const path = require('path');

const dir1 = 'Z:\\projects\\taxi\\frontend\\src';
const dir2 = 'z:\\projects\\redigo\\frontend\\src';

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const files1 = getFiles(dir1).map(f => path.relative(dir1, f));
const files2 = getFiles(dir2).map(f => path.relative(dir2, f));

console.log('Comparing frontend src files...\n');

const onlyInTaxi = files1.filter(f => !files2.includes(f));
const onlyInRedigo = files2.filter(f => !files1.includes(f));

if (onlyInTaxi.length > 0) {
  console.log('=== Only in Z:\\projects\\taxi ===');
  onlyInTaxi.forEach(f => console.log(f));
  console.log('\n');
}

if (onlyInRedigo.length > 0) {
  console.log('=== Only in z:\\projects\\redigo ===');
  onlyInRedigo.forEach(f => console.log(f));
  console.log('\n');
}

console.log('=== Differing files ===');
let diffCount = 0;
files1.forEach(f => {
  if (files2.includes(f)) {
    const path1 = path.join(dir1, f);
    const path2 = path.join(dir2, f);
    const stat1 = fs.statSync(path1);
    const stat2 = fs.statSync(path2);
    
    if (stat1.size !== stat2.size) {
      console.log(`${f} (Size diff: Taxi=${stat1.size} vs Redigo=${stat2.size})`);
      diffCount++;
    } else {
      const content1 = fs.readFileSync(path1, 'utf8');
      const content2 = fs.readFileSync(path2, 'utf8');
      if (content1 !== content2) {
        console.log(`${f} (Content diff, same size: ${stat1.size})`);
        diffCount++;
      }
    }
  }
});
if (diffCount === 0) {
  console.log('No files with matching names have differing contents.');
}
