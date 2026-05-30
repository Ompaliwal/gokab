const fs = require('fs');

const path1 = 'Z:\\projects\\taxi\\frontend\\src\\modules\\user\\pages\\Home.jsx';
const path2 = 'z:\\projects\\redigo\\frontend\\src\\modules\\user\\pages\\Home.jsx';

const content1 = fs.readFileSync(path1, 'utf8').split('\n');
const content2 = fs.readFileSync(path2, 'utf8').split('\n');

console.log(`Taxi Home.jsx: ${content1.length} lines`);
console.log(`Redigo Home.jsx: ${content2.length} lines`);

// Let's do a simple comparison of lines to see what is missing in Redigo
// Find strings that are in taxi but not in redigo
console.log('\n=== Lines unique to Z:\\projects\\taxi Home.jsx ===');
let uniqueCount = 0;
content1.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed && !content2.some(l => l.trim() === trimmed)) {
    if (uniqueCount < 50) {
      console.log(`Line ${idx + 1}: ${trimmed.slice(0, 100)}`);
    }
    uniqueCount++;
  }
});
console.log(`Total unique lines in Taxi: ${uniqueCount}`);
