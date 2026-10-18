const fs = require('fs');
let file = 'frontend/src/pages/LandIntelligence.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<Map /g, '<MapIcon ');
fs.writeFileSync(file, content);
