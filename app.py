import os
import io
import cv2
import base64
import jwt
import datetime
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional

from core.geotiff_processor import GeoTIFFProcessor
from core.tinycd_inference import TinyCDInference
from core.gis_analyzer import GISAnalyzer
from core.llm_assistant import LLMAssistant
from core.report_generator import ReportGenerator
from core.db_manager import DBManager
from core.closp_inference import CLOSPInference

app = FastAPI(title="Bi-Temporal Geospatial Change Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
tinycd = TinyCDInference()
closp_model = CLOSPInference()
llm = LLMAssistant()
db = DBManager()

JWT_SECRET = os.getenv("JWT_SECRET", "geochange_secret_key_2026")

# In-memory store for current analysis result (empty until analysis is run)
current_session = {}

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[dict]] = []
    gemini_api_key: Optional[str] = None

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: str
    password: str
    recheck_password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_jwt_token(user_profile: dict) -> str:
    payload = {
        "email": user_profile["email"],
        "username": user_profile["username"],
        "first_name": user_profile["first_name"],
        "last_name": user_profile["last_name"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    try:
        user_profile = db.create_user(
            first_name=req.first_name,
            last_name=req.last_name,
            username=req.username,
            email=req.email,
            password=req.password,
            recheck_password=req.recheck_password
        )
        token = create_jwt_token(user_profile)
        return {
            "status": "success",
            "message": "Account created successfully!",
            "token": token,
            "user": user_profile
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    try:
        user_profile = db.authenticate_user(email=req.email, password=req.password)
        token = create_jwt_token(user_profile)
        return {
            "status": "success",
            "message": "Logged in successfully!",
            "token": token,
            "user": user_profile
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"status": "success", "user": payload}
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

# --- GEOSPATIAL ANALYSIS ENDPOINTS ---

@app.post("/api/analyze")
async def analyze_images(
    t1_file: Optional[UploadFile] = File(None),
    t2_file: Optional[UploadFile] = File(None),
    use_sample: bool = Form(False),
    t1_date: str = Form("2023-01-15"),
    t2_date: str = Form("2026-06-20"),
    threshold: float = Form(0.5),
    gemini_api_key: Optional[str] = Form(None),
    fallback_lat: float = Form(37.7749),
    fallback_lon: float = Form(-122.4194),
    fallback_res_m: float = Form(0.5)
):
    temp_files = []
    try:
        if use_sample:
            t1_path = os.path.join("sample_data", "t1_sample.tif")
            t2_path = os.path.join("sample_data", "t2_sample.tif")
            if not os.path.exists(t1_path) or not os.path.exists(t2_path):
                from create_sample_geotiffs import generate_sample_geotiffs
                generate_sample_geotiffs()
        else:
            if not t1_file or not t2_file:
                raise HTTPException(status_code=400, detail="Please upload both T1 and T2 image files or select sample mode.")

            t1_path = os.path.join("temp_t1_" + t1_file.filename)
            t2_path = os.path.join("temp_t2_" + t2_file.filename)
            temp_files = [t1_path, t2_path]

            with open(t1_path, "wb") as f:
                f.write(await t1_file.read())
            with open(t2_path, "wb") as f:
                f.write(await t2_file.read())

        # Step 1: Preprocessing & Grid Alignment
        geo_dict = GeoTIFFProcessor.process_pair(
            t1_path, t2_path,
            fallback_lat=fallback_lat,
            fallback_lon=fallback_lon,
            fallback_pixel_size_m=fallback_res_m
        )

        # Step 2: TinyCD Change Mask Inference
        inference_res = tinycd.predict(
            geo_dict['t1_rgb'], geo_dict['t2_rgb'], threshold=threshold
        )
        binary_mask = inference_res['binary_mask']

        # Step 3: GIS + GeoPandas Spatial Analysis & Vectorization
        gis_res = GISAnalyzer.analyze_change(
            binary_mask=binary_mask,
            transform=geo_dict['transform'],
            crs_str=geo_dict['crs'],
            pixel_size_m=geo_dict['pixel_size_m'],
            bounds_wgs84=geo_dict['bounds']
        )

        metadata = {
            "t1_date": t1_date,
            "t2_date": t2_date,
            "time_diff": "1,252 days (~3.4 years)" if t1_date == "2023-01-15" else "Bi-temporal interval"
        }

        # Step 4: Gemini LLM Synthesis
        synthesis = llm.generate_synthesis(gis_res, metadata, api_key=gemini_api_key)

        # Base64 Data URLs for web UI
        t1_b64 = _ndarray_to_b64(geo_dict['t1_rgb'])
        t2_b64 = _ndarray_to_b64(geo_dict['t2_rgb'])

        mask_rgb = np.zeros_like(geo_dict['t1_rgb'])
        mask_rgb[binary_mask > 127] = [255, 69, 0]  # Orange-red
        mask_b64 = _ndarray_to_b64(mask_rgb)

        overlay_rgb = geo_dict['t2_rgb'].copy()
        mask_bool = binary_mask > 127
        overlay_rgb[mask_bool] = (0.5 * overlay_rgb[mask_bool] + 0.5 * np.array([255, 0, 0])).astype(np.uint8)
        contours, _ = cv2.findContours((binary_mask > 127).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay_rgb, contours, -1, (255, 255, 0), 2)
        overlay_b64 = _ndarray_to_b64(overlay_rgb)

        # Store session in memory for PDF report generation and AI chat
        global current_session
        current_session = {
            "geo_dict": geo_dict,
            "binary_mask": binary_mask,
            "gis_data": gis_res,
            "synthesis": synthesis,
            "metadata": metadata,
            "gemini_api_key": gemini_api_key
        }

        return {
            "status": "success",
            "summary_metrics": gis_res['summary_metrics'],
            "polygons": gis_res['polygons'],
            "geojson": gis_res['geojson'],
            "synthesis": synthesis,
            "metadata": metadata,
            "bounds": geo_dict['bounds'],
            "images": {
                "t1": t1_b64,
                "t2": t2_b64,
                "mask": mask_b64,
                "overlay": overlay_b64
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        for p in temp_files:
            if os.path.exists(p):
                try: os.remove(p)
                except Exception: pass

@app.post("/api/chat")
async def chat_with_llm(req: ChatRequest):
    gis_data = current_session.get('gis_data') if current_session else None
    metadata = current_session.get('metadata') if current_session else None

    reply = llm.chat(
        user_message=req.message,
        chat_history=req.chat_history or [],
        gis_data=gis_data,
        metadata=metadata,
        api_key=req.gemini_api_key or (current_session.get('gemini_api_key') if current_session else None)
    )
    return {"reply": reply}

# --- CLOSP-VS (SENTINEL-1 SAR / SENTINEL-2 OPTICAL) ENDPOINTS ---

@app.post("/api/closp/analyze")
async def analyze_closp_single_image(
    file: Optional[UploadFile] = File(None),
    use_sample: bool = Form(False),
    modality: str = Form("Optical"), # "SAR" or "Optical"
    user_query: Optional[str] = Form(None),
    gemini_api_key: Optional[str] = Form(None),
    fallback_lat: float = Form(37.7749),
    fallback_lon: float = Form(-122.4194),
    fallback_res_m: float = Form(10.0)
):
    temp_path = None
    try:
        if use_sample:
            img_path = os.path.join("sample_data", "t2_sample.tif" if os.path.exists(os.path.join("sample_data", "t2_sample.tif")) else "t1_sample.tif")
            if not os.path.exists(img_path):
                from create_sample_geotiffs import generate_sample_geotiffs
                generate_sample_geotiffs()
        else:
            if not file:
                raise HTTPException(status_code=400, detail="Please upload a single Sentinel-1 SAR or Sentinel-2 Optical image.")
            temp_path = os.path.join("temp_closp_" + file.filename)
            with open(temp_path, "wb") as f:
                f.write(await file.read())
            img_path = temp_path

        # Step 1: Preprocess single raster and extract spatial metadata
        geo_dict = GeoTIFFProcessor.process_pair(
            img_path, img_path,
            fallback_lat=fallback_lat,
            fallback_lon=fallback_lon,
            fallback_pixel_size_m=fallback_res_m
        )

        img_rgb = geo_dict['t1_rgb']
        height, width, _ = img_rgb.shape
        total_pixels = height * width
        pixel_size_m = geo_dict['pixel_size_m']
        total_area_m2 = total_pixels * (pixel_size_m ** 2)

        geo_metrics = {
            "total_pixels": total_pixels,
            "total_area_m2": round(total_area_m2, 2),
            "total_area_ha": round(total_area_m2 / 10000.0, 4),
            "pixel_resolution_m": round(pixel_size_m, 2),
            "center_lat": geo_dict['bounds'].get('center_lat', fallback_lat),
            "center_lon": geo_dict['bounds'].get('center_lon', fallback_lon)
        }

        # Step 2: Run CLOSP-VS Vision-Language Similarity Inference
        custom_queries = [user_query] if user_query and len(user_query.strip()) > 3 else None
        closp_res = closp_model.predict_similarity(
            image_np=img_rgb,
            modality=modality,
            custom_queries=custom_queries
        )

        # Step 3: LLM Synthesis for CLOSP-VS
        synthesis = llm.generate_closp_synthesis(
            closp_res=closp_res,
            geo_metrics=geo_metrics,
            user_query=user_query,
            api_key=gemini_api_key
        )

        img_b64 = _ndarray_to_b64(img_rgb)

        global current_session
        current_session = {
            "modality": modality,
            "geo_metrics": geo_metrics,
            "closp_result": closp_res,
            "synthesis": synthesis,
            "image_b64": img_b64,
            "images": {
                "t1": img_b64,
                "t2": img_b64,
                "overlay": img_b64
            },
            "gis_data": {"summary_metrics": geo_metrics},
            "geo_dict": {"t1_rgb": img_rgb, "t2_rgb": img_rgb},
            "binary_mask": np.zeros((height, width), dtype=np.uint8),
            "metadata": {"t1_date": "Single Raster", "t2_date": modality},
            "gemini_api_key": gemini_api_key
        }

        return {
            "status": "success",
            "modality": modality,
            "geo_metrics": geo_metrics,
            "closp_result": closp_res,
            "synthesis": synthesis,
            "image_b64": img_b64,
            "images": {
                "t1": img_b64,
                "t2": img_b64,
                "overlay": img_b64
            }
        }
    except Exception as e:
        print(f"CLOSP analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"CLOSP-VS analysis failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try: os.remove(temp_path)
            except Exception: pass


@app.post("/api/generate-pdf")
async def generate_pdf():
    if not current_session or not current_session.get('gis_data'):
        raise HTTPException(status_code=400, detail="No active analysis session found. Please run analysis first.")

    pdf_bytes = ReportGenerator.generate_pdf_report(
        gis_data=current_session['gis_data'],
        llm_synthesis=current_session['synthesis'],
        metadata=current_session['metadata'],
        t1_rgb=current_session['geo_dict']['t1_rgb'],
        t2_rgb=current_session['geo_dict']['t2_rgb'],
        binary_mask=current_session['binary_mask']
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=bi_temporal_change_report.pdf"}
    )

def _ndarray_to_b64(arr: np.ndarray) -> str:
    try:
        if arr is None or arr.size == 0:
            return ""
        if arr.dtype != np.uint8:
            if arr.max() <= 1.0:
                arr = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
            else:
                arr = np.clip(arr, 0, 255).astype(np.uint8)
        
        if arr.ndim == 2:
            arr = np.stack([arr] * 3, axis=-1)
        elif arr.ndim == 3 and arr.shape[2] != 3:
            if arr.shape[0] == 3:
                arr = arr.transpose(1, 2, 0)
            elif arr.shape[0] == 1:
                arr = np.stack([arr[0]] * 3, axis=-1)

        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        success, buffer = cv2.imencode('.png', bgr)
        if not success:
            return ""
        b64_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/png;base64,{b64_str}"
    except Exception as e:
        print(f"Error encoding image array to b64: {e}")
        return ""

# Mount static React assets
dist_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
async def serve_react_app():
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        return HTMLResponse(open(index_path, "r", encoding="utf-8").read(), headers=headers)
    return HTMLResponse("<h1>React Build Not Found</h1>")

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
