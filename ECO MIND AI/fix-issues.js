const fs = require('fs');

const pages = [
  'ClimateIntelligence.tsx',
  'SoilIntelligence.tsx',
  'BiodiversityIntelligence.tsx',
  'LandIntelligence.tsx',
  'HumanImpact.tsx',
  'DashboardOverview.tsx',
  'EvidenceAndReasoning.tsx'
];

for (const p of pages) {
  const file = `frontend/src/pages/${p}`;
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix typeof null issue for baseline statuses
  content = content.replace(
    /typeof\s+baseline\?\.summary\.([a-zA-Z0-9_]+)\s*===\s*'object'\s*\?\s*\(\s*baseline\.summary\.\1\s*as\s+any\s*\)\.status\s*:\s*\(\s*baseline\?\.summary\.\1\s*\|\|\s*'Unknown'\s*\)/g,
    "(baseline?.summary?.$1 && typeof baseline.summary.$1 === 'object' ? baseline.summary.$1.status : baseline?.summary?.$1) || 'Unknown'"
  );
  
  // Also for DashboardOverview which has a different format:
  content = content.replace(
    /typeof\s+baseline\?\.summary\.([a-zA-Z0-9_]+)\s*===\s*'object'\s*\?\s*baseline\?\.summary\.\1\?\.status/g,
    "baseline?.summary?.$1 && typeof baseline.summary.$1 === 'object' ? baseline.summary.$1.status"
  );

  // Fix any invalid escapes that might exist
  content = content.replace(/\\'/g, "'");

  fs.writeFileSync(file, content);
}
console.log("Fixed issues");
