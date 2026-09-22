import os

filepath = "templates/index.html"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 1039 is {% if uploaded_image %}
# Line 1196 is {% endif %}

# We can find the exact lines by scanning for them around those locations
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "<!-- ================= 8. GROWTH TRACKING ================= -->" in line:
        # The {% if uploaded_image %} is usually the next line
        for j in range(i, i+5):
            if "{% if uploaded_image %}" in lines[j]:
                start_idx = j
                break
                
for i, line in enumerate(lines):
    if "<section class=\"dashboard-panel" in line and "id=\"panel-report\"" in line:
        # The {% endif %} is usually a few lines before this
        for j in range(i-5, i):
            if "{% endif %}" in lines[j]:
                end_idx = j
                break

if start_idx != -1 and end_idx != -1:
    lines[start_idx] = "            <!-- Removed if uploaded_image to expose Satellite Intelligence -->\n"
    lines[end_idx] = "            <!-- Removed endif for Satellite Intelligence -->\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully removed if uploaded_image wrappers from panel-comparison")
else:
    print(f"Failed to find the lines. start_idx={start_idx}, end_idx={end_idx}")
