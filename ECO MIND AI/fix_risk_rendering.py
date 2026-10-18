import os
import glob

# Helper for the string replacement
new_map = """{r.secondary_consequences.map((c: any, i) => {
                                const label = typeof c === 'object' && c !== null ? (c.variable || c.name || c.state || c.status || 'Unknown') : String(c);
                                return <li key={i}>{String(label).replace(/_/g, ' ')}</li>;
                              })}"""

pages = glob.glob('frontend/src/pages/*Intelligence.tsx')
pages.append('frontend/src/pages/EvidenceAndReasoning.tsx')
pages.append('frontend/src/pages/HumanImpact.tsx')

for page in pages:
    if os.path.exists(page):
        with open(page, 'r') as f:
            content = f.read()
        content = content.replace(
            "{r.secondary_consequences.map((c: any, i) => <li key={i}>{typeof c === 'string' ? c.replace(/_/g, ' ') : String(c)}</li>)}",
            new_map
        )
        with open(page, 'w') as f:
            f.write(content)

# Now fix RiskCard.tsx
risk_card = 'frontend/src/components/RiskCard.tsx'
with open(risk_card, 'r') as f:
    content = f.read()

bad_map = """{risk.secondary_consequences.map((c: any, idx) => {
                  const label = typeof c === 'object' && c !== null 
                    ? (c.variable ? formatLabel(c.variable) : formatLabel(c.state || c.status || JSON.stringify(c)))
                    : formatLabel(String(c));
                  return <li key={idx}>{label}</li>;
                })}"""

good_map = """{risk.secondary_consequences.map((c: any, idx) => {
                  const rawLabel = typeof c === 'object' && c !== null 
                    ? (c.variable || c.name || c.state || c.status || 'Unknown')
                    : String(c);
                  return <li key={idx}>{formatLabel(String(rawLabel))}</li>;
                })}"""

content = content.replace(bad_map, good_map)
with open(risk_card, 'w') as f:
    f.write(content)

print("Updated [object Object] renderings!")
