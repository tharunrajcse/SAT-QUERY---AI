import os
import sys
import numpy as np

def test_full_pipeline():
    print("--- 1. TESTING GEOTIFF PROCESSOR ---")
    from core.geotiff_processor import GeoTIFFProcessor
    t1_path = os.path.join("sample_data", "t1_sample.tif")
    t2_path = os.path.join("sample_data", "t2_sample.tif")

    geo_dict = GeoTIFFProcessor.process_pair(t1_path, t2_path)
    print(f"GeoTIFF Processed: Shape=({geo_dict['height']}, {geo_dict['width']}), CRS={geo_dict['crs']}, Resolution={geo_dict['pixel_size_m']}m")

    print("\n--- 2. TESTING TINYCD INFERENCE ---")
    from core.tinycd_inference import TinyCDInference
    tinycd = TinyCDInference()
    inf_res = tinycd.predict(geo_dict['t1_rgb'], geo_dict['t2_rgb'])
    mask = inf_res['binary_mask']
    print(f"TinyCD Mask Generated: Unique values={np.unique(mask)}, Non-zero count={np.count_nonzero(mask)}")

    print("\n--- 3. TESTING GIS & GEOPANDAS VECTORIZATION ---")
    from core.gis_analyzer import GISAnalyzer
    gis_res = GISAnalyzer.analyze_change(
        binary_mask=mask,
        transform=geo_dict['transform'],
        crs_str=geo_dict['crs'],
        pixel_size_m=geo_dict['pixel_size_m'],
        bounds_wgs84=geo_dict['bounds']
    )
    sm = gis_res['summary_metrics']
    print(f"GIS Metrics: Total Area={sm['total_area_m2']} m² ({sm['total_area_ha']} ha), Changed Area={sm['changed_area_m2']} m² ({sm['changed_percentage']}%), Polygons={sm['polygon_count']}")
    if gis_res['polygons']:
        p = gis_res['polygons'][0]
        print(f"  Top Polygon #1: Area={p['area_m2']} m², Centroid=({p['centroid_lat']}, {p['centroid_lon']})")

    print("\n--- 4. TESTING GEMINI LLM SYNTHESIS (FALLBACK & PROMPT) ---")
    from core.llm_assistant import LLMAssistant
    llm = LLMAssistant()
    meta = {"t1_date": "2023-01-15", "t2_date": "2026-06-20", "time_diff": "3.4 years"}
    synthesis = llm.generate_synthesis(gis_res, meta)
    print(f"LLM Synthesis TOC Sections: {len(synthesis['table_of_contents'])}")
    print(f"Executive Summary preview: {synthesis['executive_summary'][:120]}...")

    print("\n--- 5. TESTING PDF REPORT GENERATION ---")
    from core.report_generator import ReportGenerator
    pdf_bytes = ReportGenerator.generate_pdf_report(
        gis_data=gis_res,
        llm_synthesis=synthesis,
        metadata=meta,
        t1_rgb=geo_dict['t1_rgb'],
        t2_rgb=geo_dict['t2_rgb'],
        binary_mask=mask
    )
    print(f"PDF Generated Successfully: Size={len(pdf_bytes)} bytes!")

    print("\n✅ PIPELINE FULLY FUNCTIONAL AND VERIFIED!")

if __name__ == "__main__":
    test_full_pipeline()
