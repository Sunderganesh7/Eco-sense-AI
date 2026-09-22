import os

filepath = "app.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add satellite_metrics to analysis_data dictionary
target = '"executive_summary": "This comprehensive executive environmental audit'

if 'session.get("satellite_metrics")' not in content:
    replacement = '"satellite_metrics": session.get("satellite_metrics"),\n            ' + target
    content = content.replace(target, replacement)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Injected satellite_metrics into download_report route.")
