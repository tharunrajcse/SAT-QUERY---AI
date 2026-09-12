import numpy as np
import rasterio.features
import geopandas as gpd
from shapely.geometry import shape, mapping
import pyproj
from rasterio.transform import Affine

class GISAnalyzer:
    """
    Performs spatial vectorization, area calculations, centroid coordinate extraction,
    and GeoDataFrame processing on change detection binary masks.
    """

    @staticmethod
    def analyze_change(
        binary_mask: np.ndarray,
        transform: Affine,
        crs_str: str,
        pixel_size_m: float,
        bounds_wgs84: dict,
        min_polygon_area_m2: float = 5.0
    ) -> dict:
        height, width = binary_mask.shape
        total_pixels = height * width
        changed_pixels = int(np.count_nonzero(binary_mask > 127))
        unchanged_pixels = total_pixels - changed_pixels

        pixel_area_m2 = float(pixel_size_m ** 2)
        total_area_m2 = total_pixels * pixel_area_m2
        changed_area_m2 = changed_pixels * pixel_area_m2
        unchanged_area_m2 = total_area_m2 - changed_area_m2

        changed_area_ha = changed_area_m2 / 10000.0
        total_area_ha = total_area_m2 / 10000.0
        changed_area_km2 = changed_area_m2 / 1000000.0
        changed_percentage = (changed_pixels / total_pixels) * 100.0 if total_pixels > 0 else 0.0

        # Extract Vector Polygons
        mask_binary = (binary_mask > 127).astype(np.uint8)
        shapes_gen = rasterio.features.shapes(mask_binary, mask=(mask_binary == 1), transform=transform)

        polygons = []
        raw_geoms = []

        for geom, val in shapes_gen:
            if val == 1:
                poly_shape = shape(geom)
                if poly_shape.is_valid and not poly_shape.is_empty:
                    raw_geoms.append(poly_shape)

        # Build GeoDataFrame in source CRS
        polygon_features = []
        geojson_features = []

        if raw_geoms:
            gdf_src = gpd.GeoDataFrame(geometry=raw_geoms, crs=crs_str)

            # Transform to WGS84 (EPSG:4326) for web map display and lat/lon centroids
            try:
                crs_wgs84 = pyproj.CRS.from_epsg(4326)
                gdf_wgs84 = gdf_src.to_crs(crs_wgs84)
            except Exception:
                gdf_wgs84 = gdf_src

            # Sort polygons by area descending
            for idx, row in gdf_wgs84.iterrows():
                geom_wgs84 = row.geometry
                geom_src = gdf_src.geometry.iloc[idx]

                # Compute metric area (approximate if geographic, or exact if projected)
                area_m2 = float(geom_src.area)
                if crs_str == "EPSG:4326" or "deg" in crs_str.lower():
                    area_m2 *= (111320.0 ** 2)  # Degree to m^2 scale factor

                if area_m2 < min_polygon_area_m2:
                    continue

                centroid = geom_wgs84.centroid
                c_lat = round(float(centroid.y), 6)
                c_lon = round(float(centroid.x), 6)

                minx, miny, maxx, maxy = geom_wgs84.bounds
                bbox = [round(float(minx), 6), round(float(miny), 6), round(float(maxx), 6), round(float(maxy), 6)]

                severity = "Major" if area_m2 > 500 else ("Moderate" if area_m2 > 100 else "Minor")

                feature_dict = {
                    "id": len(polygon_features) + 1,
                    "area_m2": round(area_m2, 2),
                    "area_ha": round(area_m2 / 10000.0, 4),
                    "centroid_lat": c_lat,
                    "centroid_lon": c_lon,
                    "bbox": bbox,
                    "severity": severity
                }
                polygon_features.append(feature_dict)

                geojson_features.append({
                    "type": "Feature",
                    "id": len(polygon_features),
                    "properties": feature_dict,
                    "geometry": mapping(geom_wgs84)
                })

        # Sort features by area descending
        polygon_features.sort(key=lambda x: x['area_m2'], reverse=True)
        for i, p in enumerate(polygon_features):
            p['rank'] = i + 1

        geojson_collection = {
            "type": "FeatureCollection",
            "features": geojson_features
        }

        return {
            "summary_metrics": {
                "total_pixels": total_pixels,
                "changed_pixels": changed_pixels,
                "unchanged_pixels": unchanged_pixels,
                "total_area_m2": round(total_area_m2, 2),
                "total_area_ha": round(total_area_ha, 4),
                "changed_area_m2": round(changed_area_m2, 2),
                "changed_area_ha": round(changed_area_ha, 4),
                "changed_area_km2": round(changed_area_km2, 6),
                "changed_percentage": round(changed_percentage, 2),
                "polygon_count": len(polygon_features),
                "pixel_resolution_m": round(pixel_size_m, 2),
                "center_lat": bounds_wgs84.get('center_lat', 0.0),
                "center_lon": bounds_wgs84.get('center_lon', 0.0)
            },
            "polygons": polygon_features,
            "geojson": geojson_collection
        }
