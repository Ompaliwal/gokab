const fs = require('fs');

const path = 'Z:\\projects\\taxi\\Backend\\src\\modules\\taxi\\driver\\controllers\\driverController.js';
const content = fs.readFileSync(path, 'utf8');

// Find all export const statements that relate to pooling
// In JS files, functions are usually written as:
// export const name = asyncHandler(async (req, res) => { ... })
// We can use a parser or matching logic to slice from "export const getPoolingDriverBookings" to the next "export const" or similar.

const fns = [
  'getPoolingDriverBookings',
  'getOwnerPoolingVehicles',
  'createOwnerPoolingVehicle',
  'updateOwnerPoolingVehicle',
  'deleteOwnerPoolingVehicle',
  'startPoolingOnboardingRequest',
  'verifyPoolingOnboardingOtpRequest',
  'getPoolingOnboardingSessionRequest',
  'savePoolingOnboardingDetailsRequest',
  'completePoolingOnboardingRequest',
  'uploadPoolingOnboardingImageRequest'
];

let extracted = '';

fns.forEach(fn => {
  const startIndex = content.indexOf(`export const ${fn}`);
  if (startIndex === -1) {
    console.log(`Could not find ${fn}`);
    return;
  }
  
  // Find the end of the function. We can find the next "export const" or EOF.
  let endIndex = content.length;
  const nextExports = [];
  
  // Search for any "export const" after startIndex
  let pos = content.indexOf('export const', startIndex + 1);
  while (pos !== -1) {
    nextExports.push(pos);
    pos = content.indexOf('export const', pos + 1);
  }
  
  if (nextExports.length > 0) {
    endIndex = Math.min(...nextExports);
  }
  
  const fnContent = content.slice(startIndex, endIndex).trim();
  extracted += fnContent + '\n\n';
});

fs.writeFileSync('scratch/extracted_pooling_fns.js', extracted);
console.log('Extracted functions written to scratch/extracted_pooling_fns.js');
