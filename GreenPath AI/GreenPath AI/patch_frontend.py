import os

filepath = "templates/index.html"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

satellite_html = """
                    <!-- SATELLITE INTELLIGENCE SECTION -->
                    <div class="cyber-card" style="grid-column: 1 / -1; margin-top: 24px;">
                        <h3><span>🛰️</span> Copernicus Satellite Intelligence</h3>
                        <p style="margin-bottom: 24px; font-size: 13px; color: var(--text-muted); line-height: 1.6;">
                            Retrieve and analyze real Sentinel-2 satellite imagery for a specific geographic coordinate. Computes exact Normalized Difference Vegetation Index (NDVI) and performs pixel-by-pixel environmental change detection.
                        </p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                            <div>
                                <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted);">Latitude</label>
                                <input type="number" step="any" id="sat-lat" value="40.782091" class="cyber-input" style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted);">Longitude</label>
                                <input type="number" step="any" id="sat-lon" value="-73.968285" class="cyber-input" style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted);">Radius (km)</label>
                                <input type="number" step="any" id="sat-radius" value="2.0" class="cyber-input" style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted);">Before Date</label>
                                <input type="date" id="sat-before" value="2022-06-01" class="cyber-input" style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; margin-bottom:4px; color:var(--text-muted);">After Date</label>
                                <input type="date" id="sat-after" value="2023-06-01" class="cyber-input" style="width:100%; padding:8px; background:var(--bg-base); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px;">
                            </div>
                        </div>
                        
                        <button onclick="runSatelliteAnalysis()" class="cyber-btn" style="background: var(--primary); font-weight: bold; width: 100%;">
                            Run Sentinel-2 Analysis
                        </button>
                        
                        <div id="sat-results" style="display: none; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                            <h4 style="margin-bottom: 16px;">Analysis Results</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                                <div style="text-align: center;">
                                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Before Image (<span id="sat-res-before-date"></span>)</p>
                                    <img id="sat-img-before" src="" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" />
                                </div>
                                <div style="text-align: center;">
                                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">After Image (<span id="sat-res-after-date"></span>)</p>
                                    <img id="sat-img-after" src="" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" />
                                </div>
                                <div style="text-align: center;">
                                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Detected Changes (NDVI Difference)</p>
                                    <img id="sat-img-diff" src="" style="width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" />
                                </div>
                            </div>
                            
                            <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                                <div style="background:var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                                    <h5 style="margin-bottom: 12px; color: var(--primary);">NDVI Metrics</h5>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>Before NDVI:</span> <strong id="sat-ndvi-before"></strong></div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>After NDVI:</span> <strong id="sat-ndvi-after"></strong></div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>NDVI Change:</span> <strong id="sat-ndvi-change"></strong></div>
                                    <div style="display:flex; justify-content:space-between; font-size:13px;"><span>Relative Change:</span> <strong id="sat-ndvi-rel"></strong></div>
                                </div>
                                <div style="background:var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                                    <h5 style="margin-bottom: 12px; color: var(--primary);">Change Detection</h5>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>Changed Pixels:</span> <strong id="sat-cd-pixels"></strong></div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>Change %:</span> <strong id="sat-cd-pct"></strong></div>
                                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;"><span>Severity:</span> <strong id="sat-cd-sev" style="text-transform: uppercase;"></strong></div>
                                    <div style="display:flex; justify-content:space-between; font-size:13px;"><span>Classification:</span> <strong id="sat-cd-type" style="text-transform: capitalize;"></strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
"""

# Insert satellite_html just after </form> in panel-comparison
insert_point = """                                <button type="button" class="cyber-btn">Select File</button>
                            </div>
                        </form>
                    </div>"""
                    
content = content.replace(insert_point, insert_point + "\n" + satellite_html)

satellite_js = """
        // ================= SATELLITE INTELLIGENCE JS =================
        async function runSatelliteAnalysis() {
            const lat = parseFloat(document.getElementById('sat-lat').value);
            const lon = parseFloat(document.getElementById('sat-lon').value);
            const radiusKm = parseFloat(document.getElementById('sat-radius').value);
            const beforeDate = document.getElementById('sat-before').value;
            const afterDate = document.getElementById('sat-after').value;
            
            if (!lat || !lon || !radiusKm || !beforeDate || !afterDate) {
                alert("Please fill in all satellite parameters.");
                return;
            }
            
            // Approximate bounding box from radius
            const R = 6378.137; // Earth radius km
            const dLat = (radiusKm / R) * (180 / Math.PI);
            const dLon = (radiusKm / (R * Math.cos(Math.PI * lat / 180))) * (180 / Math.PI);
            
            const bbox = [
                lon - dLon, // minLon
                lat - dLat, // minLat
                lon + dLon, // maxLon
                lat + dLat  // maxLat
            ];
            
            showRadarLoading();
            
            try {
                const response = await fetch('/api/satellite/compare', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ beforeDate, afterDate, bbox })
                });
                
                const data = await response.json();
                hideRadarLoading();
                
                if (!data.success) {
                    alert("Satellite Analysis Failed: " + (data.error || "Unknown error"));
                    return;
                }
                
                // Populate results
                document.getElementById('sat-results').style.display = 'block';
                
                document.getElementById('sat-img-before').src = data.images.before;
                document.getElementById('sat-img-after').src = data.images.after;
                document.getElementById('sat-img-diff').src = data.images.diff;
                
                document.getElementById('sat-res-before-date').innerText = data.dates.before;
                document.getElementById('sat-res-after-date').innerText = data.dates.after;
                
                document.getElementById('sat-ndvi-before').innerText = data.ndvi.before;
                document.getElementById('sat-ndvi-after').innerText = data.ndvi.after;
                
                const changeEl = document.getElementById('sat-ndvi-change');
                changeEl.innerText = (data.ndvi.change > 0 ? "+" : "") + data.ndvi.change;
                changeEl.style.color = data.ndvi.change >= 0 ? "var(--primary)" : "var(--accent-red)";
                
                document.getElementById('sat-ndvi-rel').innerText = data.ndvi.relativeChange + "%";
                
                document.getElementById('sat-cd-pixels').innerText = data.changeDetection.changedPixels + " / " + data.changeDetection.totalPixels;
                document.getElementById('sat-cd-pct').innerText = data.changeDetection.changePercentage + "%";
                document.getElementById('sat-cd-sev').innerText = data.changeDetection.severity;
                document.getElementById('sat-cd-type').innerText = data.changeDetection.changeType.replace('_', ' ');
                
                // Set color for severity
                const sevEl = document.getElementById('sat-cd-sev');
                if (data.changeDetection.severity === "high") sevEl.style.color = "var(--accent-red)";
                else if (data.changeDetection.severity === "medium") sevEl.style.color = "var(--accent-orange)";
                else sevEl.style.color = "var(--primary)";
                
            } catch (err) {
                hideRadarLoading();
                alert("Network error: " + err.message);
            }
        }
"""

# Insert satellite_js into index.html
content = content.replace("// ================= UPLOAD HANDLING & API JS =================", satellite_js + "\n// ================= UPLOAD HANDLING & API JS =================")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched index.html with satellite integration.")
