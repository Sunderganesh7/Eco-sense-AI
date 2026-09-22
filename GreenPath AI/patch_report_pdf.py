import os

filepath = "backend/services/report_service.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

satellite_pdf_code = """
    # ── Satellite Intelligence ─────────────────────────────────────────────
    sat_metrics = analysis.get("satellite_metrics")
    if sat_metrics:
        story.append(Paragraph("Satellite Environmental Intelligence (Sentinel-2)", section_header_style))
        story.append(HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY))
        story.append(Spacer(1, 0.2 * cm))
        
        ndvi = sat_metrics.get("ndvi", {})
        cd = sat_metrics.get("changeDetection", {})
        dates = sat_metrics.get("dates", {})
        
        sat_data = [
            [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style)],
            ["Observation Period", f"{dates.get('before')} to {dates.get('after')}"],
            ["Before NDVI", str(ndvi.get("before"))],
            ["After NDVI", str(ndvi.get("after"))],
            ["NDVI Change", str(ndvi.get("change"))],
            ["Relative NDVI Change", f"{ndvi.get('relativeChange')}%"],
            ["Changed Pixels", f"{cd.get('changedPixels')} / {cd.get('totalPixels')} ({cd.get('changePercentage')}%)"],
            ["Change Severity", str(cd.get("severity", "")).upper()],
            ["Change Classification", str(cd.get("changeType", "")).replace("_", " ").title()]
        ]
        
        sat_table = Table(sat_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        sat_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_HEADER_BG),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_LIGHT_BG, white]),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#a7f3d0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(sat_table)
        story.append(Spacer(1, 0.6 * cm))
"""

# Find a good place to insert this in generate_environmental_report.
# Let's insert it before "# ── 5. AI Recommendations" or similar.
target = "# ── 5. AI Recommended"
if target not in content:
    target = "# ── 5. "
    
if "sat_metrics =" not in content:
    content = content.replace(target, satellite_pdf_code + "\n    " + target)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Patched report_service.py with satellite section.")
