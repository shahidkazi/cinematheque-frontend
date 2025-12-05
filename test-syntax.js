// Quick syntax test
const React = require('react');
const fs = require('fs');

try {
  const content = fs.readFileSync('/mnt/user-data/outputs/src/App.js', 'utf8');
  
  // Basic syntax check - will throw if invalid
  new Function(content.replace(/import .* from .*;/g, '')
                      .replace(/export default .*;/g, ''));
  
  console.log('✅ Syntax check passed!');
} catch (error) {
  console.log('❌ Syntax error found:');
  console.log(error.message);
}
