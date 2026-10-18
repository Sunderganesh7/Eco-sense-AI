import os
import re

files = [
    ('frontend/src/pages/SoilIntelligence.tsx', 'soil_status', "safeVal(profile.soil?.organic_carbon) !== 'Unknown' || safeVal(profile.soil?.moisture) !== 'Unknown' || safeVal(profile.soil?.ph) !== 'Unknown'"),
    ('frontend/src/pages/BiodiversityIntelligence.tsx', 'habitat_status', "safeVal(profile.biodiversity?.species_richness) !== 'Unknown' || safeVal(profile.biodiversity?.habitat_diversity) !== 'Unknown'"),
    ('frontend/src/pages/LandIntelligence.tsx', 'habitat_status', "safeVal(profile.land_use?.land_use_type) !== 'Unknown' || safeVal(profile.land_use?.primary_crop) !== 'Unknown' || safeVal(profile.land_use?.cropping_system) !== 'Unknown'"),
    ('frontend/src/pages/HumanImpact.tsx', 'habitat_status', "safeVal(profile.human_impact?.pollution_level) !== 'Unknown' || safeVal(profile.human_impact?.deforestation_rate) !== 'Unknown'")
]

for filepath, field, deps in files:
    with open(filepath, 'r') as f:
        content = f.read()

    pattern = re.compile(r"const\s+([a-zA-Z]+Status)\s*=\s*\(baseline\?\.summary\?\.([a-zA-Z0-9_]+)\s*&&\s*typeof\s+baseline\.summary\.[a-zA-Z0-9_]+\s*===\s*'object'\s*\?\s*baseline\.summary\.[a-zA-Z0-9_]+\.status\s*:\s*baseline\?\.summary\?\.([a-zA-Z0-9_]+)\)\s*\|\|\s*'Unknown';")

    def repl(m):
        statusVar = m.group(1)
        f_name = m.group(2)
        return f"""const rawStatus = baseline?.summary?.{f_name} && typeof baseline.summary.{f_name} === 'object' ? baseline.summary.{f_name}.status : baseline?.summary?.{f_name};
  let {statusVar} = 'Unknown';
  if (rawStatus && rawStatus !== 'Unknown') {{
    {statusVar} = String(rawStatus);
  }} else if ({deps}) {{
    {statusVar} = 'Context Dependent';
  }}"""

    new_content = pattern.sub(repl, content)
    with open(filepath, 'w') as f:
        f.write(new_content)

print("Fixed statuses")
