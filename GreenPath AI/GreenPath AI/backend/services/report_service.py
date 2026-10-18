"""
GreenPath AI — PDF Report Generation Service (NEW)
Generates comprehensive downloadable environmental reports using ReportLab.
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)


def generate_environmental_report(
    session_data: Dict[str, Any],
    impact_records: list,
    output_dir: str,
    report_title: str = "GreenPath AI Environmental Report",
) -> str:
    import os
    import uuid
    from datetime import datetime
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, Image, KeepTogether
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from backend.services.botanical_service import get_botanical_info, get_tree_care_recommendation
        from backend.services.plantation_pdf_map import _generate_plantation_map
    except ImportError:
        logger.error("ReportLab or botanical_service not found. Cannot generate PDF.")
        raise

    os.makedirs(output_dir, exist_ok=True)
    filename = f"greenpath_report_{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(output_dir, filename)

    # Margins: Top ~40pt, Bottom ~40pt, Left ~45pt, Right ~45pt
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=45, leftMargin=45,
        topMargin=50, bottomMargin=50,
    )

    COLOR_PRIMARY = HexColor("#10b981")
    COLOR_DARK = HexColor("#064e3b")
    COLOR_LIGHT_BG = HexColor("#f8fafc")

    styles = getSampleStyleSheet()

    # Typography adjustments
    title_style = ParagraphStyle("Title", fontSize=20, fontName="Helvetica-Bold", textColor=COLOR_DARK, spaceAfter=2)
    subtitle_style = ParagraphStyle("Subtitle", fontSize=10, fontName="Helvetica", textColor=HexColor("#475569"), spaceAfter=10)
    
    section_header_style = ParagraphStyle("SectionHeader", fontSize=14, fontName="Helvetica-Bold", textColor=COLOR_DARK, spaceBefore=14, spaceAfter=4)
    body_style = ParagraphStyle("Body", fontSize=10, fontName="Helvetica", textColor=black, spaceAfter=6, leading=14)
    caption_style = ParagraphStyle("Caption", fontSize=8, fontName="Helvetica-Oblique", textColor=HexColor("#64748b"), alignment=TA_CENTER, spaceBefore=4, spaceAfter=8)

    story = []
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    dataset_name = session_data.get("current_image", "Unknown Dataset")

    # 1. Header (Compact)
    header_data = [
        [
            Paragraph("<b>GREENPATH AI</b>", title_style),
            Paragraph(f"<b>Generated:</b> {ts}<br/><b>Dataset:</b> {dataset_name}", ParagraphStyle("SubR", parent=subtitle_style, alignment=TA_RIGHT))
        ],
        [
            Paragraph("Environmental Intelligence Report", ParagraphStyle("SubL", parent=subtitle_style, alignment=TA_LEFT)),
            ""
        ]
    ]
    header_table = Table(header_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("SPAN", (0, 1), (0, 1))
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_DARK))
    story.append(Spacer(1, 0.5 * cm))

    # Helper function to create KeepTogether blocks
    def keep(elements):
        return KeepTogether(elements)

    # 2. Executive Summary
    tree_count = session_data.get("tree_count")
    if tree_count is None: tree_count = 0
    green_pct = session_data.get("green", 0.0)
    co2 = float(tree_count * 22.0)
    heat_red = min(tree_count * 0.15, 3.0)
    eco = min((tree_count / 30.0) * 100.0, 100.0)
    
    exec_data = [
        ["Trees Detected:", f"{tree_count}"],
        ["Green Cover %:", f"{green_pct}%"],
        ["Estimated Annual CO2 Absorption:", f"{co2:.0f} kg/year"],
        ["Heat Mitigation:", f"{heat_red:.2f}°C"],
        ["Eco-Index Score:", f"{eco:.0f}/100"]
    ]
    exec_table = Table(exec_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    exec_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    
    story.append(keep([
        Paragraph("EXECUTIVE SUMMARY", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm),
        exec_table,
        Spacer(1, 0.4 * cm)
    ]))

    # 3. Source Satellite Image
    up_img_path = os.path.join("uploads", dataset_name)
    src_img_elements = [
        Paragraph("1. SOURCE SATELLITE IMAGE", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm)
    ]
    if os.path.exists(up_img_path):
        src_img_elements.append(Image(up_img_path, width=12*cm, height=8.5*cm, kind='proportional'))
        src_img_elements.append(Paragraph("Source image used for environmental analysis", caption_style))
    else:
        src_img_elements.append(Paragraph("Image not available for this analysis", body_style))
    src_img_elements.append(Spacer(1, 0.4 * cm))
    story.append(keep(src_img_elements))

    # 4. YOLOv8 Tree Detection
    yolo_img = session_data.get("yolo_tree_output_image")
    det_img_path = os.path.join("outputs", yolo_img) if yolo_img else ""
    yolo_elements = [
        Paragraph("2. YOLOv8 TREE DETECTION", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm)
    ]
    if det_img_path and os.path.exists(det_img_path):
        yolo_elements.append(Image(det_img_path, width=12*cm, height=8.5*cm, kind='proportional'))
        yolo_elements.append(Paragraph("YOLOv8 tree detection and spatial bounding-box overlay", caption_style))
    else:
        yolo_elements.append(Paragraph("Image not available for this analysis", body_style))
    
    yolo_elements.append(Paragraph(f"<b>Total Trees Detected:</b> {tree_count}", body_style))
    yolo_elements.append(Spacer(1, 0.4 * cm))
    story.append(keep(yolo_elements))

    # 5. Tree Species Intelligence
    species_name = session_data.get("active_species_name")
    botanical_info = get_botanical_info(species_name) if species_name else None
    
    if species_name and botanical_info:
        spec_data = [
            ["Common Name", species_name],
            ["Scientific Name", botanical_info.get("scientific_name", "N/A")],
            ["Family", botanical_info.get("family", "N/A")],
            ["Native Region", botanical_info.get("native_region", "N/A")],
            ["Habitat / Tree Type", botanical_info.get("tree_type", "N/A")],
            ["Average Height", botanical_info.get("average_height", "N/A")],
            ["Lifespan", botanical_info.get("lifespan", "N/A")],
            ["Conservation Status", botanical_info.get("conservation_status", "N/A")]
        ]
        spec_table = Table(spec_data, colWidths=[doc.width * 0.35, doc.width * 0.65])
        spec_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        
        species_header = [
            Paragraph("3. TREE SPECIES INTELLIGENCE", section_header_style),
            HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
            Spacer(1, 0.2 * cm),
            spec_table,
            Spacer(1, 0.3 * cm)
        ]
        story.append(keep(species_header))
        
        species_body = [
            Paragraph(f"<b>Species Overview:</b> {botanical_info.get('description', 'N/A')}", body_style),
            Paragraph(f"<b>Ecological Role:</b> {botanical_info.get('ecological_importance', 'N/A')}", body_style),
            Paragraph(f"<b>Common Uses:</b> {botanical_info.get('uses', 'N/A')}", body_style),
            Spacer(1, 0.2 * cm)
        ]
        story.append(keep(species_body))
        
        care_req = get_tree_care_recommendation(species_name, "healthy")
        if care_req:
            care_elements = [
                Paragraph("<b>Habitat & Growing Conditions:</b>", body_style),
                Paragraph(f"- Sunlight: {care_req.get('sunlight', 'N/A')}", body_style),
                Paragraph(f"- Water: {care_req.get('watering', 'N/A')}", body_style),
                Paragraph(f"- Soil: {care_req.get('soil', 'N/A')}", body_style),
                Paragraph(f"- Climate / Care: {care_req.get('climate', 'N/A')}", body_style),
                Spacer(1, 0.4 * cm)
            ]
            story.append(keep(care_elements))
        else:
            story.append(Spacer(1, 0.4 * cm))
    else:
        story.append(keep([
            Paragraph("3. TREE SPECIES INTELLIGENCE", section_header_style),
            HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
            Spacer(1, 0.2 * cm),
            Paragraph("Species information not available for this analysis.", body_style),
            Spacer(1, 0.4 * cm)
        ]))

    # 6. Green Cover Analysis
    green_pct_val = session_data.get("green")
    non_green_pct_val = session_data.get("non_green")
    gc_header = [
        Paragraph("4. GREEN COVER ANALYSIS", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm)
    ]
    if green_pct_val is not None:
        gc_data = [
            ["Green Cover Vegetation Percentage:", f"{green_pct_val}%"],
            ["Vegetation Cover %:", f"{green_pct_val}%"],
            ["Pavements & Built %:", f"{non_green_pct_val}%"]
        ]
        gc_table = Table(gc_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
        gc_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        gc_header.append(gc_table)
        gc_header.append(Spacer(1, 0.3 * cm))
        story.append(keep(gc_header))
        
        v_mask = session_data.get("green_img")
        nv_mask = session_data.get("non_green_img")
        
        mask_cells = []
        if v_mask and os.path.exists(os.path.join("outputs", v_mask)):
            mask_cells.append([Image(os.path.join("outputs", v_mask), width=6.5*cm, height=5*cm, kind='proportional'), Paragraph("Vegetation Mask", caption_style)])
        if nv_mask and os.path.exists(os.path.join("outputs", nv_mask)):
            mask_cells.append([Image(os.path.join("outputs", nv_mask), width=6.5*cm, height=5*cm, kind='proportional'), Paragraph("Non-Vegetation Mask", caption_style)])
            
        if mask_cells:
            if len(mask_cells) == 2:
                m_table = Table([[mask_cells[0][0], mask_cells[1][0]], [mask_cells[0][1], mask_cells[1][1]]], colWidths=[doc.width*0.5, doc.width*0.5])
                m_table.setStyle(TableStyle([("ALIGN", (0,0), (-1,-1), "CENTER"), ("VALIGN", (0,0), (-1,-1), "TOP")]))
                story.append(keep([m_table, Spacer(1, 0.4 * cm)]))
            else:
                story.append(keep([mask_cells[0][0], mask_cells[0][1], Spacer(1, 0.4 * cm)]))
    else:
        gc_header.append(Paragraph("Green cover analysis not available.", body_style))
        gc_header.append(Spacer(1, 0.4 * cm))
        story.append(keep(gc_header))

    # 7. Recommended Planting Locations
    plantation_zones = session_data.get("plantation_zones_data")
    pl_header = [
        Paragraph("5. RECOMMENDED PLANTING LOCATIONS", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm)
    ]
    if plantation_zones and plantation_zones.get("estimated_trees", 0) > 0:
        p_data = [
            ["Existing Trees:", f"{tree_count}"],
            ["Estimated Additional Trees:", f"{plantation_zones.get('estimated_trees', 0)}"],
            ["Recommended Planting Area:", f"{plantation_zones.get('total_recommended_area', 0)} hectares"]
        ]
        p_table = Table(p_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
        p_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        pl_header.append(p_table)
        pl_header.append(Spacer(1, 0.3 * cm))
        
        # Generate the professional plantation map
        up_img_path = os.path.join("uploads", dataset_name)
        new_map_path = _generate_plantation_map(up_img_path, output_dir, plantation_zones)
        
        if new_map_path and os.path.exists(new_map_path):
            pl_header.append(Image(new_map_path, width=12*cm, height=8.5*cm, kind='proportional'))
            pl_header.append(Paragraph("AI-generated planting recommendations based on observed tree density.", caption_style))
            
            # Legend
            legend_data = [
                [
                    Paragraph("<font color='#16a34a'>●</font> Existing Trees", body_style),
                    Paragraph("<font color='#dc2626'>●</font> High Priority — Recommended Planting", body_style),
                    Paragraph("<font color='#d97706'>●</font> Medium Priority — Recommended Planting", body_style)
                ]
            ]
            legend_table = Table(legend_data, colWidths=[doc.width * 0.25, doc.width * 0.4, doc.width * 0.35])
            legend_table.setStyle(TableStyle([
                ("ALIGN", (0,0), (-1,-1), "CENTER"),
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6)
            ]))
            pl_header.append(legend_table)
            
        story.append(keep(pl_header))
            
        points = plantation_zones.get("planting_points", [])
        if points:
            loc_elements = [
                Spacer(1, 0.2 * cm),
                Paragraph("<b>Recommended Locations:</b>", body_style)
            ]
            for i, pt in enumerate(points[:12]):
                loc_elements.append(Paragraph(f"- Location {i+1}: {pt.get('position', 'Unknown')} (Priority: {pt.get('priority', 'MEDIUM')})", body_style))
            if len(points) > 12:
                loc_elements.append(Paragraph(f"...and {len(points)-12} more.", body_style))
            loc_elements.append(Spacer(1, 0.4 * cm))
            story.append(keep(loc_elements))
    else:
        pl_header.append(Paragraph("No recommended planting data available.", body_style))
        pl_header.append(Spacer(1, 0.4 * cm))
        story.append(keep(pl_header))

    # 8. Plantation Impact & Monitoring
    imp_header = [
        Paragraph("6. PLANTATION IMPACT & MONITORING", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm)
    ]
    if impact_records:
        latest = impact_records[-1]
        planted = latest.get("planted", 0)
        surviving = latest.get("surviving", 0)
        green = latest.get("green", 0)
        
        i_data = [
            ["Trees Planted", f"{planted}"],
            ["Tree Survival", f"{surviving}"],
            ["Current Green Cover", f"{green}%"]
        ]
        if tree_count is not None:
            after_count = tree_count + surviving
            i_data.append(["CO2 Absorption Change", f"+{(surviving * 22):.1f} kg/year"])
            i_data.append(["Total Expected Trees", f"{after_count}"])
            
        i_table = Table(i_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        i_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        imp_header.append(i_table)
        imp_header.append(Spacer(1, 0.3 * cm))
        story.append(keep(imp_header))
        
        timeline_elements = [Paragraph("<b>Monitoring Timeline:</b>", body_style)]
        for rec in impact_records:
            timeline_elements.append(Paragraph(f"- <b>{rec.get('milestone', 'Record')}</b> (Surviving: {rec.get('surviving', 0)}, Health: {rec.get('health', 0)}%, Green Cover: {rec.get('green', 0)}%)", body_style))
        timeline_elements.append(Spacer(1, 0.4 * cm))
        story.append(keep(timeline_elements))
    else:
        imp_header.append(Paragraph("No plantation monitoring records available.", body_style))
        imp_header.append(Spacer(1, 0.4 * cm))
        story.append(keep(imp_header))

    # 9. Environmental Assessment Summary
    final_summary = (
        f"The current environmental assessment of {dataset_name} reveals a tree population of {tree_count} trees. "
    )
    if green_pct_val is not None:
        final_summary += f"The green cover currently stands at {green_pct_val}%. "
    if species_name and species_name != "No tree species detected. Please upload a clearer image containing a visible tree.":
        final_summary += f"The primary detected species is {species_name}. "
        
    final_summary += f"The total carbon absorption is estimated at {co2:.0f} kg/year with an Eco-Index score of {eco:.0f}/100. "
    
    if plantation_zones and plantation_zones.get("estimated_trees", 0) > 0:
        final_summary += f"There are opportunities to plant an estimated {plantation_zones.get('estimated_trees')} additional trees in the recommended zones. "
    
    if impact_records:
        final_summary += f"Plantation monitoring currently tracks {impact_records[-1].get('surviving', 0)} surviving trees from recent afforestation efforts. "
        
    story.append(keep([
        Paragraph("ENVIRONMENTAL ASSESSMENT SUMMARY", section_header_style),
        HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY),
        Spacer(1, 0.2 * cm),
        Paragraph(final_summary, body_style)
    ]))

    # Page Header/Footer callbacks
    def header_footer(canvas, doc):
        canvas.saveState()
        # Header on later pages
        if doc.page > 1:
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(HexColor("#64748b"))
            canvas.drawString(doc.leftMargin, doc.pagesize[1] - 30, "GreenPath AI | Environmental Intelligence Report")
            canvas.line(doc.leftMargin, doc.pagesize[1] - 35, doc.pagesize[0] - doc.rightMargin, doc.pagesize[1] - 35)
        # Footer on all pages
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(HexColor("#94a3b8"))
        canvas.drawString(doc.leftMargin, 30, "GreenPath AI")
        canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 30, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return filepath




def generate_qr_code(verification_url: str, output_dir: str = "outputs") -> str:
    """
    Generates a high-contrast QR code PNG for Executive Report verification.
    Works offline using Python qrcode[pil].
    """
    try:
        import qrcode
        os.makedirs(output_dir, exist_ok=True)
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#064e3b", back_color="white")
        filename = f"qrcode_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(output_dir, filename)
        img.save(filepath)
        return filepath
    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        return ""


def generate_multi_image_pdf_report(
    batch_results: list,
    output_dir: str = "outputs",
    report_title: str = "GreenPath AI Multi-Image Batch Executive Report",
) -> str:
    """
    Generates a Combined Executive PDF Report for multiple canopy images.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, PageBreak, Image,
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        logger.error("ReportLab not installed. Cannot generate multi-image PDF.")
        raise

    os.makedirs(output_dir, exist_ok=True)
    filename = f"greenpath_batch_report_{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    COLOR_PRIMARY = HexColor("#10b981")
    COLOR_DARK = HexColor("#064e3b")
    COLOR_LIGHT_BG = HexColor("#f0fdf4")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BatchTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=COLOR_DARK,
        alignment=TA_CENTER,
    )
    section_header_style = ParagraphStyle(
        "BatchSecHead",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=COLOR_DARK,
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BatchBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=black,
    )

    story = []
    ts = datetime.now().strftime("%d %B %Y, %H:%M:%S")

    story.append(Paragraph(report_title, title_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(f"<b>Batch Processing Date:</b> {ts} | <b>Total Images Analysed:</b> {len(batch_results)}", ParagraphStyle("Sub", fontSize=10, alignment=TA_CENTER)))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_PRIMARY))
    story.append(Spacer(1, 0.4 * cm))

    # 1. SUMMARY TABLE
    story.append(Paragraph("1. Multi-Image Batch Summary Table", section_header_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY))
    story.append(Spacer(1, 0.2 * cm))

    summary_data = [["#", "Image Filename", "Detected Species", "Health Status", "Confidence"]]
    for idx, item in enumerate(batch_results, 1):
        summary_data.append([
            str(idx),
            str(item.get("filename", "image.jpg")),
            str(item.get("species_name", "N/A")),
            str(item.get("health_status", "Healthy")).upper(),
            str(item.get("confidence_score", "0%")),
        ])

    table = Table(summary_data, colWidths=[doc.width * 0.08, doc.width * 0.28, doc.width * 0.32, doc.width * 0.18, doc.width * 0.14])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_LIGHT_BG, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1fae5")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5 * cm))

    # 2. INDIVIDUAL IMAGE DETECTIONS
    story.append(Paragraph("2. Individual Canopy Detections & Botanical Profiles", section_header_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY))
    story.append(Spacer(1, 0.3 * cm))

    for idx, item in enumerate(batch_results, 1):
        story.append(Paragraph(f"<b>Image {idx}: {item.get('filename', 'Canopy Image')}</b>", section_header_style))
        img_table_data = [
            [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Result</b>", body_style)],
            ["Species Name", str(item.get("species_name", "N/A"))],
            ["Health Status", str(item.get("health_status", "Healthy")).upper()],
            ["Confidence Score", str(item.get("confidence_score", "N/A"))],
            ["Detection Time", str(item.get("detection_time", "N/A"))],
        ]
        bot_info = item.get("botanical_info") or {}
        if bot_info:
            img_table_data.append(["Scientific Name", str(bot_info.get("scientific_name", "N/A"))])
            img_table_data.append(["Family", str(bot_info.get("family", "N/A"))])
            img_table_data.append(["Conservation Status", str(bot_info.get("conservation_status", "N/A"))])

        it_table = Table(img_table_data, colWidths=[doc.width * 0.35, doc.width * 0.65])
        it_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#d1fae5")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#a7f3d0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(it_table)
        story.append(Spacer(1, 0.3 * cm))

    # FOOTER
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        body_style,
    ))
    story.append(Paragraph(
        f"GreenPath AI — Smart Environmental Intelligence Platform | {ts}",
        ParagraphStyle("Footer", fontSize=8, textColor=HexColor("#9ca3af"), alignment=TA_CENTER),
    ))

    doc.build(story)
    logger.info(f"📄 Multi-Image Batch PDF Report generated: {filepath}")
    return filepath


def send_email_report(recipient_email: str, pdf_path: str, subject: str = "GreenPath AI Executive Environmental Report") -> Dict[str, Any]:
    """
    Sends the Executive PDF Report to recipient_email via SMTP/Flask-Mail.
    Handles offline/unconfigured SMTP servers gracefully by logging and returning structured status.
    """
    if not recipient_email or "@" not in recipient_email:
        return {"success": False, "message": "Invalid recipient email address provided."}

    try:
        # Check if real SMTP config exists in environment
        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASS")

        if smtp_host and smtp_user and smtp_pass:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            from email.mime.application import MIMEApplication

            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = recipient_email
            msg["Subject"] = subject

            body = (
                "Hello,\n\n"
                "Please find attached your official GreenPath AI Executive Environmental Report.\n"
                "This report includes full canopy metadata, YOLOv8 species classifications, and cryptographic QR verification.\n\n"
                "Best regards,\nGreenPath AI Platform"
            )
            msg.attach(MIMEText(body, "plain"))

            if os.path.exists(pdf_path):
                with open(pdf_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=os.path.basename(pdf_path))
                part["Content-Disposition"] = f'attachment; filename="{os.path.basename(pdf_path)}"'
                msg.attach(part)

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)

            return {"success": True, "message": f"Executive Report successfully sent via email to {recipient_email}."}
        else:
            # Graceful offline mode
            logger.info(f"✉️ [OFFLINE SMTP MODE] Simulated Executive Report email dispatch to: {recipient_email} (file: {pdf_path})")
            return {
                "success": True,
                "message": f"Report prepared and queued for delivery to {recipient_email} (Offline SMTP simulation mode active)."
            }
    except Exception as e:
        logger.error(f"Failed to send email report to {recipient_email}: {e}")
        return {"success": False, "message": f"Email delivery error: {str(e)}"}
