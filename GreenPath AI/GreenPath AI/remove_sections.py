import re
import os

filepath = "templates/index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove HTML: Live Drone Feed
content = re.sub(
    r'<!-- ================= LIVE DRONE FEED MONITORING ================= -->.*?<!-- ================= 3\. VISION ANALYTICS ================= -->',
    r'<!-- ================= 3. VISION ANALYTICS ================= -->',
    content, flags=re.DOTALL
)

# Remove HTML: Interactive GIS Map
content = re.sub(
    r'<!-- ================= 4\. INTERACTIVE GIS MAP ================= -->.*?<!-- ================= 5\. ATMOSPHERE & COVER ================= -->',
    r'<!-- ================= 5. ATMOSPHERE & COVER ================= -->',
    content, flags=re.DOTALL
)

# Remove HTML: Microclimate Simulation
content = re.sub(
    r'<!-- ================= 6\. MICROCLIMATE SIMULATION ================= -->.*?<!-- ================= 7\. HEALTH & SPECIES ================= -->',
    r'<!-- ================= 7. HEALTH & SPECIES ================= -->',
    content, flags=re.DOTALL
)

# Remove JS: Microclimate Simulator Core
content = re.sub(
    r'// ================= INTERACTIVE MICROCLIMATE SIMULATOR CORE =================.*?// ================= INTERACTIVE LEAFLET MAP MODULE =================',
    r'// ================= INTERACTIVE LEAFLET MAP MODULE =================',
    content, flags=re.DOTALL
)

# Remove JS: Leaflet Map Module
content = re.sub(
    r'// ================= INTERACTIVE LEAFLET MAP MODULE =================.*?// ================= MULTIPLE CHARTJS CONTROLLER =================',
    r'// ================= MULTIPLE CHARTJS CONTROLLER =================',
    content, flags=re.DOTALL
)

# Remove JS: Live Drone Dashboard System
content = re.sub(
    r'// ================= LIVE DRONE DASHBOARD SYSTEM =================.*?// ================= ENTERPRISE ADMIN USER MANAGEMENT & LOGIN AUDIT LOGIC =================',
    r'// ================= ENTERPRISE ADMIN USER MANAGEMENT & LOGIN AUDIT LOGIC =================',
    content, flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done removing sections.")
