const fs = require('fs');

const path1 = 'Z:\\projects\\taxi\\Backend\\src\\modules\\taxi\\driver\\routes\\driverRoutes.js';
const path2 = 'z:\\projects\\redigo\\Backend\\src\\modules\\taxi\\driver\\routes\\driverRoutes.js';

const content1 = fs.readFileSync(path1, 'utf8').split('\n');
const content2 = fs.readFileSync(path2, 'utf8').split('\n');

console.log(`Taxi Routes: ${content1.length} lines`);
console.log(`Redigo Routes: ${content2.length} lines`);

console.log('\n=== Unique lines in Taxi driverRoutes.js ===');
content1.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed && !content2.some(l => l.trim() === trimmed)) {
    console.log(`Line ${idx + 1}: ${trimmed}`);
  }
});
