import re

filepath = "templates/index.html"
patterns = [r"L\.map", r"leaflet", r"id=[\"']map[\"']", r"gps", r"geojson"]

print("Searching templates/index.html...")
with open(filepath, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        for pattern in patterns:
            if re.search(pattern, line, re.IGNORECASE):
                print(f"Line {line_num}: {line.strip()[:120]}")
                break
