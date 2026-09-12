import os
import io
import cv2
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

class ReportGenerator:
    """
    Generates a publication-quality PDF report for Bi-Temporal Change Detection results
    including Table of Contents, metadata, tables, visual map figures, and AI synthesis.
    """

    @staticmethod
    def generate_pdf_report(
        gis_data: dict,
        llm_synthesis: dict,
        metadata: dict,
        t1_rgb: np.ndarray,
        t2_rgb: np.ndarray,
        binary_mask: np.ndarray,
        output_path: str = None
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            output_path or buffer,
            pagesize=letter,
            rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Palette
        PRIMARY = colors.HexColor("#1e293b")  # Dark slate
        ACCENT = colors.HexColor("#0284c7")   # Ocean blue
        TEXT_DARK = colors.HexColor("#334155")
        BG_LIGHT = colors.HexColor("#f8fafc")

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=PRIMARY,
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=11,
            leading=14,
            textColor=ACCENT,
            spaceAfter=15
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=PRIMARY,
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=TEXT_DARK,
            spaceAfter=8
        )
        toc_style = ParagraphStyle(
            'TOCItem',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=15,
            textColor=ACCENT
        )

        story = []

        # Title Header
        story.append(Paragraph("Bi-Temporal Geospatial Change Analysis Report", title_style))
        story.append(Paragraph(f"Neural Network Model: TinyCD | Location: Lat {gis_data['summary_metrics']['center_lat']}, Lon {gis_data['summary_metrics']['center_lon']}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=15))

        # Metadata & TOC Table
        toc_list = llm_synthesis.get('table_of_contents', [
            "1. Acquisition Metadata", "2. Executive Summary", "3. Spatial Metrics", "4. Visual Maps", "5. Top Change Clusters", "6. AI Change Analysis"
        ])
        toc_html = "<br/>".join([f"• {item}" for item in toc_list])

        meta_data_table = [
            [Paragraph("<b>METADATA</b>", styles['Normal']), Paragraph("<b>TABLE OF CONTENTS</b>", styles['Normal'])],
            [
                Paragraph(
                    f"<b>T1 Date:</b> {metadata.get('t1_date', 'Prior')}<br/>"
                    f"<b>T2 Date:</b> {metadata.get('t2_date', 'Recent')}<br/>"
                    f"<b>Time Delta:</b> {metadata.get('time_diff', 'Bi-temporal')}<br/>"
                    f"<b>Resolution:</b> {gis_data['summary_metrics']['pixel_resolution_m']} m/px<br/>"
                    f"<b>CRS:</b> EPSG:4326 / WGS84", body_style
                ),
                Paragraph(toc_html, toc_style)
            ]
        ]
        t_meta = Table(meta_data_table, colWidths=[3.25*inch, 3.75*inch])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 15))

        # Section 1: Executive Summary
        story.append(Paragraph("1. Executive Summary", h2_style))
        story.append(Paragraph(llm_synthesis.get('executive_summary', ''), body_style))
        story.append(Spacer(1, 10))

        # Section 2: Summary Metrics Table
        story.append(Paragraph("2. Spatial Quantitative Metrics", h2_style))
        sm = gis_data['summary_metrics']
        metrics_table_data = [
            ["Metric Parameter", "Value (Metric)", "Value (Hectares / %)"],
            ["Total Monitored Surface Area", f"{sm['total_area_m2']:,.2f} m²", f"{sm['total_area_ha']:.4f} ha"],
            ["Changed Surface Area", f"{sm['changed_area_m2']:,.2f} m²", f"{sm['changed_area_ha']:.4f} ha ({sm['changed_area_km2']:.6f} km²)"],
            ["Unchanged Surface Area", f"{sm['total_area_m2'] - sm['changed_area_m2']:,.2f} m²", f"{sm['total_area_ha'] - sm['changed_area_ha']:.4f} ha"],
            ["Percentage Area Affected", f"{sm['changed_percentage']:.2f} %", f"{sm['changed_pixels']:,} changed px"],
            ["Distinct Change Polygon Clusters", f"{sm['polygon_count']} clusters", f"Min poly size > {sm['pixel_resolution_m']**2*5:.1f} m²"]
        ]
        t_metrics = Table(metrics_table_data, colWidths=[2.5*inch, 2.25*inch, 2.25*inch])
        t_metrics.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_metrics)
        story.append(Spacer(1, 15))

        # Section 3: Visual Maps
        story.append(Paragraph("3. Bi-Temporal Visual Inspection Maps", h2_style))
        img_t1_path, img_t2_path, img_mask_path, img_overlay_path = ReportGenerator._create_map_images(
            t1_rgb, t2_rgb, binary_mask, gis_data
        )

        visual_table = [
            [Paragraph("<b>T1 Image (Before)</b>", styles['Normal']), Paragraph("<b>T2 Image (After)</b>", styles['Normal'])],
            [RLImage(img_t1_path, width=3.3*inch, height=2.5*inch), RLImage(img_t2_path, width=3.3*inch, height=2.5*inch)],
            [Paragraph("<b>TinyCD Binary Change Mask</b>", styles['Normal']), Paragraph("<b>Polygon Change Overlay</b>", styles['Normal'])],
            [RLImage(img_mask_path, width=3.3*inch, height=2.5*inch), RLImage(img_overlay_path, width=3.3*inch, height=2.5*inch)]
        ]
        t_vis = Table(visual_table, colWidths=[3.5*inch, 3.5*inch])
        t_vis.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_vis)
        story.append(Spacer(1, 15))

        # Section 4: Top Change Clusters Table
        story.append(Paragraph("4. Top Affected Polygon Clusters & Coordinates", h2_style))
        polys = gis_data.get('polygons', [])[:5]

        poly_table_data = [["Rank", "Area (m²)", "Area (ha)", "Centroid (Lat, Lon)", "Severity"]]
        if polys:
            for p in polys:
                poly_table_data.append([
                    f"#{p['rank']}",
                    f"{p['area_m2']:,.1f}",
                    f"{p['area_ha']:.4f}",
                    f"({p['centroid_lat']}, {p['centroid_lon']})",
                    p['severity']
                ])
        else:
            poly_table_data.append(["-", "No significant clusters", "-", "-", "-"])

        t_poly = Table(poly_table_data, colWidths=[0.8*inch, 1.4*inch, 1.2*inch, 2.4*inch, 1.2*inch])
        t_poly.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_poly)
        story.append(Spacer(1, 15))

        # Section 5: AI Explanation & Recommendations
        story.append(Paragraph("5. AI Change Explanation & Drivers", h2_style))
        story.append(Paragraph(llm_synthesis.get('change_explanation', ''), body_style))

        story.append(Paragraph("6. Environmental Impact & Risk Assessment", h2_style))
        story.append(Paragraph(llm_synthesis.get('environmental_impact', ''), body_style))

        story.append(Paragraph("7. Actionable Recommendations", h2_style))
        recs = llm_synthesis.get('recommended_actions', [])
        for r in recs:
            story.append(Paragraph(f"• {r}", body_style))

        doc.build(story)

        # Cleanup temp image files
        for p in [img_t1_path, img_t2_path, img_mask_path, img_overlay_path]:
            if os.path.exists(p):
                try: os.remove(p)
                except Exception: pass

        if output_path:
            return None
        return buffer.getvalue()

    @staticmethod
    def _create_map_images(t1_rgb: np.ndarray, t2_rgb: np.ndarray, binary_mask: np.ndarray, gis_data: dict):
        temp_dir = os.path.join(os.getcwd(), "temp_report_images")
        os.makedirs(temp_dir, exist_ok=True)

        p1 = os.path.join(temp_dir, "t1.png")
        p2 = os.path.join(temp_dir, "t2.png")
        pm = os.path.join(temp_dir, "mask.png")
        po = os.path.join(temp_dir, "overlay.png")

        cv2.imwrite(p1, cv2.cvtColor(t1_rgb, cv2.COLOR_RGB2BGR))
        cv2.imwrite(p2, cv2.cvtColor(t2_rgb, cv2.COLOR_RGB2BGR))

        # Binary Mask RGB
        mask_rgb = np.zeros_like(t1_rgb)
        mask_rgb[binary_mask > 127] = [255, 69, 0]  # Bright red-orange change mask
        cv2.imwrite(pm, cv2.cvtColor(mask_rgb, cv2.COLOR_RGB2BGR))

        # Overlay image (T2 with semi-transparent red change highlights)
        overlay = t2_rgb.copy()
        mask_bool = binary_mask > 127
        overlay[mask_bool] = (0.5 * overlay[mask_bool] + 0.5 * np.array([255, 0, 0])).astype(np.uint8)

        # Draw red contours around changed polygons
        contours, _ = cv2.findContours((binary_mask > 127).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, contours, -1, (255, 255, 0), 2)  # Yellow outline

        cv2.imwrite(po, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))

        return p1, p2, pm, po
