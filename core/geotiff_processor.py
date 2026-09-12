import os
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, calculate_default_transform
from rasterio.transform import from_origin, Affine
import pyproj
from PIL import Image

class GeoTIFFProcessor:
    """
    Handles loading, alignment, CRS extraction, and resampling of T1 and T2 image pairs.
    Supports GeoTIFFs as well as standard PNG/JPEG images with spatial fallbacks.
    """

    @staticmethod
    def process_pair(
        t1_path: str,
        t2_path: str,
        fallback_lat: float = 37.7749,
        fallback_lon: float = -122.4194,
        fallback_pixel_size_m: float = 0.5
    ) -> dict:
        """
        Process T1 and T2 images, ensuring matching grid shapes, CRS, and Affine transform.
        """
        is_t1_geotiff, t1_data, t1_meta = GeoTIFFProcessor._read_image(t1_path)
        is_t2_geotiff, t2_data, t2_meta = GeoTIFFProcessor._read_image(t2_path)

        height, width = t1_data.shape[1], t1_data.shape[2]

        # Determine CRS and transform
        if is_t1_geotiff and t1_meta.get('crs'):
            crs = str(t1_meta['crs'])
            transform = t1_meta['transform']
            pixel_size_m = GeoTIFFProcessor._calculate_pixel_size_m(transform, crs)
        else:
            # Fallback georeferencing centered at (fallback_lat, fallback_lon)
            crs, transform, pixel_size_m = GeoTIFFProcessor._create_fallback_transform(
                height, width, fallback_lat, fallback_lon, fallback_pixel_size_m
            )

        # Align T2 to T1 grid if dimensions or transform differ
        t2_data_aligned = GeoTIFFProcessor._align_images(
            t2_data, is_t2_geotiff, t2_meta, t1_data.shape, crs, transform
        )

        # Extract RGB arrays (H, W, 3)
        t1_rgb = GeoTIFFProcessor._to_rgb(t1_data)
        t2_rgb = GeoTIFFProcessor._to_rgb(t2_data_aligned)

        # Calculate bounding box in WGS84 (lat/lon)
        bounds_wgs84 = GeoTIFFProcessor._calculate_wgs84_bounds(height, width, transform, crs)

        return {
            "t1_rgb": t1_rgb,
            "t2_rgb": t2_rgb,
            "crs": crs,
            "transform": transform,
            "bounds": bounds_wgs84,
            "height": height,
            "width": width,
            "pixel_size_m": pixel_size_m,
            "is_geotiff": is_t1_geotiff or is_t2_geotiff
        }

    @staticmethod
    def _read_image(path: str):
        try:
            with rasterio.open(path) as src:
                data = src.read()
                meta = src.meta.copy()
                is_geotiff = src.crs is not None
                return is_geotiff, data, meta
        except Exception:
            # Fallback using PIL for non-GeoTIFF images
            img = Image.open(path).convert('RGB')
            arr = np.array(img).transpose(2, 0, 1)  # C, H, W
            meta = {
                'driver': 'PNG',
                'dtype': arr.dtype,
                'nodata': None,
                'width': img.width,
                'height': img.height,
                'count': 3,
                'crs': None,
                'transform': Affine.identity()
            }
            return False, arr, meta

    @staticmethod
    def _to_rgb(arr: np.ndarray) -> np.ndarray:
        """Converts C, H, W to H, W, 3 RGB uint8 array."""
        if arr.ndim == 2:
            arr = np.stack([arr] * 3, axis=-1)
        elif arr.ndim == 3:
            if arr.shape[0] >= 3:
                arr = arr[:3, :, :].transpose(1, 2, 0)
            elif arr.shape[0] == 1:
                arr = np.stack([arr[0]] * 3, axis=-1)
            else:
                arr = arr.transpose(1, 2, 0)

        # Normalize to uint8 0..255 if needed
        if arr.dtype != np.uint8:
            arr_min, arr_max = arr.min(), arr.max()
            if arr_max > arr_min:
                arr = ((arr - arr_min) / (arr_max - arr_min) * 255).astype(np.uint8)
            else:
                arr = np.zeros_like(arr, dtype=np.uint8)
        return arr

    @staticmethod
    def _create_fallback_transform(height: int, width: int, center_lat: float, center_lon: float, pixel_size_m: float):
        """Creates WGS84 GeoTransform from center lat/lon and resolution."""
        # Convert pixel size from meters to degrees roughly (1 deg ~ 111,320m)
        deg_per_m = 1.0 / 111320.0
        pixel_size_deg = pixel_size_m * deg_per_m

        west = center_lon - (width * pixel_size_deg / 2.0)
        north = center_lat + (height * pixel_size_deg / 2.0)

        transform = from_origin(west, north, pixel_size_deg, pixel_size_deg)
        return "EPSG:4326", transform, pixel_size_m

    @staticmethod
    def _calculate_pixel_size_m(transform: Affine, crs_str: str) -> float:
        """Calculates pixel resolution in meters."""
        res_x = abs(transform.a)
        res_y = abs(transform.e)
        res_avg = (res_x + res_y) / 2.0

        try:
            crs = pyproj.CRS.from_string(crs_str)
            if crs.is_geographic:
                # Degrees to meters
                return res_avg * 111320.0
            else:
                # Already in projected metric units (e.g. UTM)
                return res_avg
        except Exception:
            return res_avg if res_avg < 10.0 else 0.5

    @staticmethod
    def _align_images(t2_data, is_t2_geotiff, t2_meta, target_shape, target_crs, target_transform):
        """Resamples T2 to match target shape and transform if necessary."""
        c, h, w = target_shape
        if t2_data.shape[1] == h and t2_data.shape[2] == w:
            return t2_data

        aligned = np.zeros((t2_data.shape[0], h, w), dtype=t2_data.dtype)

        src_crs = t2_meta.get('crs') or target_crs
        src_transform = t2_meta.get('transform') or target_transform

        for b in range(t2_data.shape[0]):
            reproject(
                source=t2_data[b],
                destination=aligned[b],
                src_transform=src_transform,
                src_crs=src_crs,
                dst_transform=target_transform,
                dst_crs=target_crs,
                resampling=Resampling.bilinear
            )
        return aligned

    @staticmethod
    def _calculate_wgs84_bounds(height: int, width: int, transform: Affine, crs_str: str) -> dict:
        """Transforms corners to WGS84 EPSG:4326 lat/lon bounds."""
        corners = [(0, 0), (width, 0), (width, height), (0, height)]
        x_coords = [transform.a * col + transform.c for col, row in corners]
        y_coords = [transform.e * row + transform.f for col, row in corners]

        try:
            crs_src = pyproj.CRS.from_string(crs_str)
            crs_wgs84 = pyproj.CRS.from_epsg(4326)

            if crs_src != crs_wgs84:
                transformer = pyproj.Transformer.from_crs(crs_src, crs_wgs84, always_xy=True)
                lons, lats = transformer.transform(x_coords, y_coords)
            else:
                lons, lats = x_coords, y_coords

            return {
                "west": round(float(min(lons)), 6),
                "south": round(float(min(lats)), 6),
                "east": round(float(max(lons)), 6),
                "north": round(float(max(lats)), 6),
                "center_lat": round(float((min(lats) + max(lats)) / 2.0), 6),
                "center_lon": round(float((min(lons) + max(lons)) / 2.0), 6)
            }
        except Exception:
            return {
                "west": -122.4194,
                "south": 37.7749,
                "east": -122.4094,
                "north": 37.7849,
                "center_lat": 37.7799,
                "center_lon": -122.4144
            }
