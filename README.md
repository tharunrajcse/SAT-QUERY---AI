# 🛰️ GEO BI TEMPORAL — AI Geospatial Intelligence & Bi-Temporal Satellite Analysis

A state-of-the-art Geospatial Intelligence Platform combining **PyTorch TinyCD Neural Vision**, **CLOSP-VS Zero-Shot Vision-Language Embeddings**, **GeoPandas GIS Spatial Analytics**, and **Gemini AI Remote Sensing Copilot**.

---

## 🌟 Features

- **Bi-Temporal Neural Change Detection**: Fast neural inference comparing pre-change ($T_1$) and post-change ($T_2$) satellite imagery using the **TinyCD** architecture.
- **CLOSP-VS Zero-Shot Vision-Language Analysis**: Zero-shot semantic identification and land cover similarity scoring for Sentinel-1 SAR (Radar) and Sentinel-2 Optical imagery.
- **GeoPandas GIS Vectorization**: Automated extraction of change polygons, WGS84 GPS centroids, severity classifications, and hectare metric tables.
- **AI Remote Sensing Assistant**: Voice-enabled Gemini AI copilot for environmental risk assessment and driver analysis.
- **PDF Executive Report Generator**: One-click generation of spatial change reports with vector maps, charts, and executive summaries.
- **Cosmic Modern UI**: Built with React (Vite), featuring interactive Leaflet GIS maps, side-by-side curtain swipe sliders, and vector SVG iconography.

---

## 🏗️ System Architecture

```
                       ┌────────────────────────┐
                       │  React (Vite) Frontend │
                       └───────────┬────────────┘
                                   │ HTTP / API
                                   ▼
                       ┌────────────────────────┐
                       │  FastAPI Backend (Py)  │
                       └─────┬─────────────┬────┘
                             │             │
        ┌────────────────────┴─┐         ┌─┴───────────────────┐
        │  TinyCD Neural Vision│         │  CLOSP-VS Multimodal│
        │  (Bi-Temporal T1/T2) │         │  (Sentinel SAR/Opt) │
        └────────────┬─────────┘         └─────────┬───────────┘
                     │                             │
                     ▼                             ▼
        ┌──────────────────────────────────────────────┐
        │  GeoPandas GIS Vectorizer & GeoTIFF Parser   │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │  Gemini AI Copilot & PDF Report Generator    │
        └──────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── app.py                      # FastAPI Backend Server & Endpoints
├── requirements.txt            # Python Dependencies
├── .gitignore                  # Git Exclusion Rules
├── README.md                   # Project Overview & Deployment Guide
├── core/                       # Core ML & GIS Processing Engines
│   ├── tinycd_inference.py     # TinyCD Neural Change Detection Engine
│   ├── closp_inference.py      # CLOSP-VS Vision-Language Similarity Model
│   ├── gis_analyzer.py         # GeoPandas Polygon & Vector Extractor
│   ├── geotiff_processor.py    # Raster & Spatial Extent Reader
│   ├── llm_assistant.py        # Gemini AI Assistant & Prompt Pipeline
│   ├── report_generator.py     # PDF Executive Report Compiler
│   └── db_manager.py           # MongoDB Session Persistence
├── TinyCD/                     # TinyCD Neural Model Architecture & Weights
├── CLOSP-VS/                   # CLOSP-VS Vision-Language Modules
├── sample_data/                # Sample Satellite Rasters (T1 & T2)
└── frontend/                   # React + Vite User Interface
    ├── src/                    # Components & UI Workspaces
    ├── package.json            # Node Dependencies
    └── vite.config.js          # Vite Build Config
```

---

## 🛠️ Local Installation & Setup

### 1. Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `v18` or higher
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

### 3. Backend Setup (Python Virtual Environment)
```bash
# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Linux / macOS
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
PORT=8080
```

### 6. Run Local Server
```bash
python app.py
```
Open **`http://127.0.0.1:8080`** in your browser.

---

## ☁️ Deployment on Render

### Web Service Settings

- **Environment**: `Python 3`
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build && cd .. && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port $PORT
  ```

### Environment Variables on Render Panel
In your Render Web Service settings, add the following under **Environment Variables**:
- `GEMINI_API_KEY`: Your Gemini API Key
- `MONGODB_URI`: (Optional) MongoDB Connection String

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
