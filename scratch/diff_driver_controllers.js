const fs = require('fs');

const path1 = 'Z:\\projects\\taxi\\Backend\\src\\modules\\taxi\\driver\\controllers\\driverController.js';
const path2 = 'z:\\projects\\redigo\\Backend\\src\\modules\\taxi\\driver\\controllers\\driverController.js';

const content1 = fs.readFileSync(path1, 'utf8');
const content2 = fs.readFileSync(path2, 'utf8');

// Find all matches for functions containing "Pooling"
const regex = /export const \w*Pooling\w*/g;
const matches1 = content1.match(regex) || [];
const matches2 = content2.match(regex) || [];

console.log('=== Functions with "Pooling" in Z:\\projects\\taxi ===');
console.log(matches1);

console.log('\n=== Functions with "Pooling" in z:\\projects\\redigo ===');
console.log(matches2);

const missingInRedigo = matches1.filter(m => !matches2.includes(m));
console.log('\n=== Missing "Pooling" functions in Redigo ===');
console.log(missingInRedigo);
