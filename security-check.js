// This script checks if the vulnerable packages are being used
const fs = require('fs');
const path = require('path');

// Define the vulnerable packages and their secure versions
const vulnerablePackages = {
  'axios': '1.9.0',
  'cookie': '0.7.2'
};

console.log('Security Check Report:');
console.log('=====================');

// Check if package-lock.json exists
const packageLockPath = path.join(__dirname, 'package-lock.json');
if (!fs.existsSync(packageLockPath)) {
  console.log('package-lock.json not found. Run npm install first.');
  process.exit(1);
}

// Read package-lock.json
const packageLock = require(packageLockPath);

// Check for vulnerable packages
let vulnerabilitiesFound = false;

// Function to check dependencies recursively
function checkDependencies(dependencies, path = []) {
  if (!dependencies) return;
  
  Object.entries(dependencies).forEach(([name, info]) => {
    const currentPath = [...path, name];
    
    if (vulnerablePackages[name]) {
      const currentVersion = info.version;
      const secureVersion = vulnerablePackages[name];
      
      // Compare versions (simple string comparison for now)
      if (currentVersion !== secureVersion) {
        console.log(`⚠️ Vulnerable package found: ${name}@${currentVersion}`);
        console.log(`   Secure version: ${secureVersion}`);
        console.log(`   Path: ${currentPath.join(' -> ')}`);
        console.log('');
        vulnerabilitiesFound = true;
      }
    }
    
    // Check nested dependencies
    if (info.dependencies) {
      checkDependencies(info.dependencies, currentPath);
    }
  });
}

// Start checking from the root dependencies
checkDependencies(packageLock.dependencies);

if (!vulnerabilitiesFound) {
  console.log('✅ No known vulnerable packages found!');
} else {
  console.log('⚠️ Vulnerable packages found. Please update them to secure versions.');
}
