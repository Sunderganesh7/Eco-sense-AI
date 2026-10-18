import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_compliance_report_pdf(data: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#065f46'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#047857'),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'Heading2_Green',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937')
    )

    badge_style = ParagraphStyle(
        'VerdictBadge',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#059669') if data.get('verdict_badge') == 'green' else colors.HexColor('#d97706'),
        spaceAfter=4
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#b91c1c'),
        fontName="Helvetica-Bold"
    )

    story = []

    # Header Title
    story.append(Paragraph("GREENPERMIT AI — LEGAL COMPLIANCE & PLANTATION DOSSIER", title_style))
    story.append(Paragraph(f"Preliminary Statutory Assessment Report | Reference: {data.get('check_ref', 'GP-AUDIT-2026')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#059669'), spaceAfter=12))

    # Location & Score Summary Table
    score_val = data.get('compliance_score', 80)
    verdict_text = data.get('verdict', 'Conditionally Suitable')
    
    summary_data = [
        [
            Paragraph("<b>Site Name:</b>", body_style), Paragraph(str(data.get('location_name', 'Proposed Site')), body_style),
            Paragraph("<b>Compliance Score:</b>", body_style), Paragraph(f"<b>{score_val} / 100</b>", badge_style)
        ],
        [
            Paragraph("<b>Coordinates:</b>", body_style), Paragraph(f"{data.get('latitude', 0.0):.4f}° N, {data.get('longitude', 0.0):.4f}° E", body_style),
            Paragraph("<b>Preliminary Verdict:</b>", body_style), Paragraph(f"<b>{verdict_text}</b>", body_style)
        ],
        [
            Paragraph("<b>Land Category:</b>", body_style), Paragraph(str(data.get('land_type_display', 'Municipal Land')), body_style),
            Paragraph("<b>NOC Requirement:</b>", body_style), Paragraph(str(data.get('noc_required_display', 'Conditional')), body_style)
        ],
        [
            Paragraph("<b>Primary Authority:</b>", body_style), Paragraph(str(data.get('primary_authority', 'Tree Authority')), body_style),
            Paragraph("<b>Governing Statute:</b>", body_style), Paragraph(str(data.get('governing_law', 'Maharashtra Tree Act 1975')), body_style)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[1.3*inch, 2.3*inch, 1.3*inch, 2.3*inch])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#86efac')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dcfce7')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # Factor Breakdown Section
    story.append(Paragraph("1. Explainable 8-Factor Compliance Breakdown", h2_style))
    
    factor_rows = [["Factor Name", "Weight", "Score", "Status", "Explanation"]]
    for f in data.get('factors', []):
        f_dict = f if isinstance(f, dict) else f.model_dump()
        factor_rows.append([
            Paragraph(f_dict.get('factor_name', ''), body_style),
            Paragraph(str(f_dict.get('weight', '')), body_style),
            Paragraph(f"{f_dict.get('score_awarded', '')} pts", body_style),
            Paragraph(f_dict.get('status', '').title(), body_style),
            Paragraph(f_dict.get('explanation', ''), body_style)
        ])
    
    t_factors = Table(factor_rows, colWidths=[1.8*inch, 0.6*inch, 0.7*inch, 0.8*inch, 3.3*inch])
    t_factors.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_factors)
    story.append(Spacer(1, 10))

    # Document Checklist Section
    story.append(Paragraph("2. Required Document Checklist", h2_style))
    checklist_rows = [["#", "Document Name", "Status / Tag", "Issuing / Verifying Authority"]]
    for idx, item in enumerate(data.get('checklist', [])):
        c_dict = item if isinstance(item, dict) else item.model_dump()
        checklist_rows.append([
            Paragraph(str(idx+1), body_style),
            Paragraph(f"<b>{c_dict.get('name', '')}</b><br/>{c_dict.get('description', '')}", body_style),
            Paragraph(f"<b>{c_dict.get('tag', 'Required')}</b>", body_style),
            Paragraph(c_dict.get('authority_source', 'Tree Authority'), body_style)
        ])
    
    t_check = Table(checklist_rows, colWidths=[0.3*inch, 3.8*inch, 1.2*inch, 1.9*inch])
    t_check.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_check)
    story.append(Spacer(1, 12))

    # Statutory Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#ef4444'), spaceAfter=6))
    story.append(Paragraph("LEGAL DISCLAIMER & COMPLIANCE NOTICE:", disclaimer_style))
    story.append(Paragraph(
        "This document is an automated preliminary legal-compliance assessment generated by GreenPermit AI based on codified municipal, "
        "state, and central environmental rules. It does NOT constitute a final government permit, NOC, or legal guarantee. Final legal "
        "approval remains strictly with the competent government authority (Tree Authority / Forest Department / MCZMA / PWD / NHAI).",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer
