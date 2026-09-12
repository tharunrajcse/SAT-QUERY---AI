// GeoChange AI Frontend JavaScript Core

let map = null;
let geojsonLayer = null;
let rasterOverlayLayer = null;
let currentAnalysisData = null;
let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUploadDropzones();
    initTabSwitching();
    initSwipeSlider();
    initEventListeners();
});

// Initialize Leaflet GIS Map
function initMap() {
    map = L.map('leafletMap').setView([37.7749, -122.4194], 14);

    // Satellite Base Layer (Esri World Imagery)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    }).addTo(map);

    // OpenStreetMap Street Layer
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    L.control.layers({
        "Satellite Imagery": satelliteLayer,
        "Street Map": streetLayer
    }).addTo(map);
}

// Dropzone file upload handlers
function initUploadDropzones() {
    setupDropzone('dropzoneT1', 'fileT1', 'nameT1');
    setupDropzone('dropzoneT2', 'fileT2', 'nameT2');
}

function setupDropzone(dropzoneId, inputId, nameId) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    const nameEl = document.getElementById(nameId);

    dropzone.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            nameEl.textContent = e.target.files[0].name;
            nameEl.style.color = '#06b6d4';
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            nameEl.textContent = e.dataTransfer.files[0].name;
            nameEl.style.color = '#06b6d4';
        }
    });
}

// Tab Switching
function initTabSwitching() {
    // Main Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
            if (target === 'mapTab' && map) {
                setTimeout(() => map.invalidateSize(), 200);
            }
        });
    });

    // Side Tabs
    document.querySelectorAll('.side-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.side-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.side-tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-sidetab');
            document.getElementById(target).classList.add('active');
        });
    });
}

// Interactive Swipe Comparison Slider
function initSwipeSlider() {
    const container = document.getElementById('swipeContainer');
    const divider = document.getElementById('swipeDivider');
    const afterWrap = document.getElementById('swipeAfterWrap');

    let isDragging = false;

    function moveDivider(x) {
        const rect = container.getBoundingClientRect();
        let posX = x - rect.left;
        posX = Math.max(0, Math.min(posX, rect.width));
        const percent = (posX / rect.width) * 100;
        divider.style.left = `${percent}%`;
        afterWrap.style.width = `${percent}%`;
    }

    divider.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (isDragging) moveDivider(e.clientX);
    });

    divider.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) moveDivider(e.touches[0].clientX);
    });
}

// Main event listeners
function initEventListeners() {
    // Threshold slider live value
    const slider = document.getElementById('thresholdSlider');
    const valDisplay = document.getElementById('thresholdVal');
    slider.addEventListener('input', () => {
        valDisplay.textContent = parseFloat(slider.value).toFixed(2);
    });

    // Run Analysis Button
    document.getElementById('btnAnalyze').addEventListener('click', () => runAnalysis(false));

    // 1-Click Sample Button
    document.getElementById('btnSample').addEventListener('click', () => runAnalysis(true));

    // Generate PDF Button
    document.getElementById('btnGeneratePdf').addEventListener('click', generatePdfReport);
}

// Execute Analysis Pipeline
async function runAnalysis(useSample = false) {
    const formData = new FormData();
    formData.append('use_sample', useSample);
    formData.append('t1_date', document.getElementById('t1Date').value);
    formData.append('t2_date', document.getElementById('t2Date').value);
    formData.append('threshold', document.getElementById('thresholdSlider').value);
    formData.append('fallback_lat', document.getElementById('fallbackLat').value);
    formData.append('fallback_lon', document.getElementById('fallbackLon').value);
    formData.append('fallback_res_m', document.getElementById('fallbackRes').value);

    const apiKey = document.getElementById('geminiApiKey').value.trim();
    if (apiKey) formData.append('gemini_api_key', apiKey);

    if (!useSample) {
        const fileT1 = document.getElementById('fileT1').files[0];
        const fileT2 = document.getElementById('fileT2').files[0];
        if (!fileT1 || !fileT2) {
            alert('Please select both T1 (Before) and T2 (After) image files, or click 1-Click Sample Demo.');
            return;
        }
        formData.append('t1_file', fileT1);
        formData.append('t2_file', fileT2);
    }

    showLoading(true, "Running TinyCD Bi-Temporal Pipeline...");

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Analysis pipeline failed');
        }

        const data = await response.json();
        currentAnalysisData = data;
        renderAnalysisResults(data);
        document.getElementById('btnGeneratePdf').disabled = false;
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        showLoading(false);
    }
}

// Render Results on UI
function renderAnalysisResults(data) {
    const sm = data.summary_metrics;

    // KPI Cards
    document.getElementById('kpiTotalArea').textContent = `${sm.total_area_m2.toLocaleString()} m²`;
    document.getElementById('kpiTotalAreaHa').textContent = `${sm.total_area_ha} hectares`;

    document.getElementById('kpiChangedArea').textContent = `${sm.changed_area_m2.toLocaleString()} m²`;
    document.getElementById('kpiChangedAreaHa').textContent = `${sm.changed_area_ha} hectares (${sm.changed_area_km2} km²)`;

    document.getElementById('kpiPercent').textContent = `${sm.changed_percentage}%`;
    document.getElementById('kpiPixels').textContent = `${sm.changed_pixels.toLocaleString()} pixels`;

    document.getElementById('kpiClusters').textContent = sm.polygon_count;

    // Images update
    document.getElementById('imgSwipeT1').src = data.images.t1;
    document.getElementById('imgSwipeT2').src = data.images.t2;
    document.getElementById('imgBinaryMask').src = data.images.mask;
    document.getElementById('imgOverlay').src = data.images.overlay;

    // Update Leaflet Map
    updateLeafletMap(data);

    // Summary Text Blocks
    const syn = data.synthesis;
    document.getElementById('summaryExec').textContent = syn.executive_summary || '';
    document.getElementById('summaryDrivers').textContent = syn.change_explanation || '';
    document.getElementById('summaryImpact').textContent = syn.environmental_impact || '';

    // Update Polygons Table
    renderPolygonsTable(data.polygons);
}

// Render Map layers & vector polygons
function updateLeafletMap(data) {
    const bounds = data.bounds;
    const southWest = L.latLng(bounds.south, bounds.west);
    const northEast = L.latLng(bounds.north, bounds.east);
    const latLngBounds = L.latLngBounds(southWest, northEast);

    map.fitBounds(latLngBounds);

    // Overlay T2 image on map
    if (rasterOverlayLayer) map.removeLayer(rasterOverlayLayer);
    rasterOverlayLayer = L.imageOverlay(data.images.t2, latLngBounds, { opacity: 0.7 }).addTo(map);

    // Remove existing GeoJSON
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    // Render Vector Polygons
    geojsonLayer = L.geoJSON(data.geojson, {
        style: function (feature) {
            return {
                color: '#ef4444',
                weight: 2,
                fillColor: '#ef4444',
                fillOpacity: 0.45
            };
        },
        onEachFeature: function (feature, layer) {
            const props = feature.properties;
            const popupContent = `
                <div style="font-family: Inter, sans-serif; font-size: 12px; color: #0f172a;">
                    <strong style="color: #ef4444; font-size: 13px;">Change Cluster #${props.id} (${props.severity})</strong><br/>
                    <b>Area:</b> ${props.area_m2.toLocaleString()} m² (${props.area_ha} ha)<br/>
                    <b>Centroid Lat:</b> ${props.centroid_lat}<br/>
                    <b>Centroid Lon:</b> ${props.centroid_lon}<br/>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);
}

// Render Polygons Table
function renderPolygonsTable(polygons) {
    const tbody = document.getElementById('polygonTableBody');
    tbody.innerHTML = '';

    if (!polygons || polygons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No significant change clusters detected</td></tr>';
        return;
    }

    polygons.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${p.rank}</td>
            <td>${p.area_m2.toLocaleString()}</td>
            <td>(${p.centroid_lat}, ${p.centroid_lon})</td>
            <td><span class="badge" style="background:${p.severity === 'Major' ? '#ef4444' : '#f59e0b'}">${p.severity}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Generate PDF Report
async function generatePdfReport() {
    showLoading(true, "Compiling PDF Document Report...");
    try {
        const response = await fetch('/api/generate-pdf', { method: 'POST' });
        if (!response.ok) throw new Error("Failed to generate PDF report");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "bi_temporal_change_report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        alert(`Error downloading PDF report: ${err.message}`);
    } finally {
        showLoading(false);
    }
}

// Gemini AI Chat Logic
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    appendChatMessage('user', msg);
    input.value = '';

    const apiKey = document.getElementById('geminiApiKey').value.trim();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                chat_history: chatHistory,
                gemini_api_key: apiKey
            })
        });

        const data = await response.json();
        const reply = data.reply || "No reply received.";
        appendChatMessage('bot', reply);
        chatHistory.push({ role: 'user', content: msg });
        chatHistory.push({ role: 'model', content: reply });
    } catch (err) {
        appendChatMessage('bot', `⚠️ Error communicating with Gemini API: ${err.message}`);
    }
}

function sendQuickChip(text) {
    document.getElementById('chatInput').value = text;
    sendChatMessage();
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') sendChatMessage();
}

function appendChatMessage(role, text) {
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role === 'user' ? 'user-msg' : 'bot-msg'}`;
    msgDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'Gemini AI'}:</strong><br/>${escapeHtml(text).replace(/\n/g, '<br/>')}`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showLoading(show, text = "Processing...") {
    const overlay = document.getElementById('loadingOverlay');
    document.getElementById('spinnerText').textContent = text;
    if (show) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}
