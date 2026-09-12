import os
import numpy as np
import rasterio
from rasterio.transform import from_origin

def generate_sample_geotiffs():
    os.makedirs("sample_data", exist_ok=True)
    t1_path = os.path.join("sample_data", "t1_sample.tif")
    t2_path = os.path.join("sample_data", "t2_sample.tif")

    height, width = 512, 512

    # Synthesize realistic landscape for T1 (Green vegetation, brown soil, gray roads)
    np.random.seed(42)

    # Base background: Green field
    t1_r = np.full((height, width), 40, dtype=np.uint8)
    t1_g = np.full((height, width), 140, dtype=np.uint8)
    t1_b = np.full((height, width), 50, dtype=np.uint8)

    # Add noise texture
    noise = np.random.randint(-15, 15, (height, width), dtype=np.int16)
    t1_r = np.clip(t1_r.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    t1_g = np.clip(t1_g.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    t1_b = np.clip(t1_b.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Add a diagonal river (Blue)
    for y in range(height):
        x_center = int(120 + 40 * np.sin(y / 50.0))
        for dw in range(-15, 15):
            x = x_center + dw
            if 0 <= x < width:
                t1_r[y, x] = 30
                t1_g[y, x] = 100
                t1_b[y, x] = 210

    # Add existing small village structures (Gray)
    t1_r[80:140, 300:360] = 180
    t1_g[80:140, 300:360] = 180
    t1_b[80:140, 300:360] = 180

    t1_rgb = np.stack([t1_r, t1_g, t1_b], axis=0)

    # Create T2 (Landscape After Change):
    # Change 1: New construction complex (Bright red/yellow roofs & concrete pads)
    t2_rgb = t1_rgb.copy()
    t2_rgb[0, 220:320, 150:280] = 220  # Red roof
    t2_rgb[1, 220:320, 150:280] = 70
    t2_rgb[2, 220:320, 150:280] = 50

    # Change 2: Forest land clearing / deforestation (Brown bare earth)
    t2_rgb[0, 350:450, 320:440] = 170  # Brown soil
    t2_rgb[1, 350:450, 320:440] = 120
    t2_rgb[2, 350:450, 320:440] = 70

    # GeoTransform centered at San Francisco bay area / Silicon Valley (37.7749, -122.4194)
    # Resolution = 0.5 meters per pixel
    pixel_size_deg = 0.5 / 111320.0
    transform = from_origin(-122.4194, 37.7749, pixel_size_deg, pixel_size_deg)

    meta = {
        'driver': 'GTiff',
        'dtype': 'uint8',
        'nodata': None,
        'width': width,
        'height': height,
        'count': 3,
        'crs': 'EPSG:4326',
        'transform': transform
    }

    with rasterio.open(t1_path, 'w', **meta) as dst:
        dst.write(t1_rgb)

    with rasterio.open(t2_path, 'w', **meta) as dst:
        dst.write(t2_rgb)

    print(f"Sample GeoTIFFs generated:\n  - T1: {t1_path}\n  - T2: {t2_path}")

if __name__ == "__main__":
    generate_sample_geotiffs()
