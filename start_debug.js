const concurrently = require('concurrently');
const { Writable } = require('stream');

const nullStream = new Writable({
  write(chunk, encoding, callback) {
    callback();
  }
});

console.clear();
console.log('========================================');
console.log('ECO SENSE AI');
console.log('🚀 Eco Sense AI Dashboard:');
console.log('http://localhost:8000');
console.log('========================================');
console.log('Starting all modules in the background... Please wait.');

concurrently([
  { command: 'npm run dev:dashboard', name: 'dashboard' },
  { command: 'npm run dev:carbonwise', name: 'carbonwise' },
  { command: 'npm run dev:geoguardian', name: 'geoguardian' },
  { command: 'npm run dev:ecomind', name: 'ecomind' },
  { command: 'npm run dev:plantwise', name: 'plantwise' },
  { command: 'npm run dev:greenpath', name: 'greenpath' },
  { command: 'npm run dev:agrisense', name: 'agrisense' }
], {
  
  successCondition: 'all'
});
