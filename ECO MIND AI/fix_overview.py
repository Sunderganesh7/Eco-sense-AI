import os
import re

filepath = 'frontend/src/pages/DashboardOverview.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Insert status logic before return (
logic = """
  const safeValStr = (v: any): string => {
    if (v === null || v === undefined) return 'Unknown';
    if (typeof v === 'object' && 'value' in v) return v.value !== null && v.value !== undefined ? String(v.value) : 'Unknown';
    return String(v);
  };

  const getStatus = (field: string, deps: string[]) => {
    const rawStatus = baseline?.summary?.[field] && typeof baseline.summary[field] === 'object' ? baseline.summary[field].status : baseline?.summary?.[field];
    if (rawStatus && rawStatus !== 'Unknown') return String(rawStatus);
    const hasDeps = deps.some(d => {
      const parts = d.split('.');
      let val: any = profile;
      for (const p of parts) val = val?.[p];
      return safeValStr(val) !== 'Unknown';
    });
    return hasDeps ? 'Context Dependent' : 'Unknown';
  };

  const soilStatus = getStatus('soil_status', ['soil.organic_carbon', 'soil.moisture', 'soil.ph']);
  const waterStatus = getStatus('water_status', ['climate.annual_rainfall', 'climate.temperature']);
  const habitatStatus = getStatus('habitat_status', ['biodiversity.species_richness', 'biodiversity.habitat_diversity']);

  return (
"""

content = content.replace("  return (\n    <>", logic + "    <>", 1)

# 2. Replace the hardcoded statuses in the JSX
# Soil System
content = re.sub(
    r"\{baseline\?\.summary\?\.soil_status.*?\('Unknown'\)\}",
    "{soilStatus.replace(/_/g, ' ')}",
    content, flags=re.DOTALL
)
content = re.sub(
    r"style=\{\{\s*borderLeft:\s*`4px solid var\(--color-\$\{\(baseline\?\.summary\?\.soil_status.*?\? 'success' : 'warning'\}\)`\s*\}\}",
    "style={{ borderLeft: `4px solid var(--color-${soilStatus.toLowerCase().includes('optimal') ? 'success' : 'warning'})` }}",
    content, flags=re.DOTALL
)

# Water System
content = re.sub(
    r"\{baseline\?\.summary\?\.water_status.*?\('Unknown'\)\}",
    "{waterStatus.replace(/_/g, ' ')}",
    content, flags=re.DOTALL
)
content = re.sub(
    r"style=\{\{\s*borderLeft:\s*`4px solid var\(--color-\$\{\(baseline\?\.summary\?\.water_status.*?\? 'success' : 'warning'\}\)`\s*\}\}",
    "style={{ borderLeft: `4px solid var(--color-${waterStatus.toLowerCase().includes('optimal') ? 'success' : 'warning'})` }}",
    content, flags=re.DOTALL
)

# Habitat System
content = re.sub(
    r"\{baseline\?\.summary\?\.habitat_status.*?\('Unknown'\)\}",
    "{habitatStatus.replace(/_/g, ' ')}",
    content, flags=re.DOTALL
)
content = re.sub(
    r"style=\{\{\s*borderLeft:\s*`4px solid var\(--color-\$\{\(baseline\?\.summary\?\.habitat_status.*?\? 'success' : 'warning'\}\)`\s*\}\}",
    "style={{ borderLeft: `4px solid var(--color-${habitatStatus.toLowerCase().includes('optimal') ? 'success' : 'warning'})` }}",
    content, flags=re.DOTALL
)

# 3. Remove Footer
content = re.sub(r"\s*\{/\*\s*Footer\s*\*/\}\s*<footer className=\"footer\">.*</footer>", "", content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)
print("Done")
