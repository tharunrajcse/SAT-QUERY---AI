import React, { useState, useEffect, useRef } from 'react';
import {
  SatelliteDishIcon,
  OrbitSatelliteIcon,
  CameraIcon,
  MetricsIcon,
  MapIcon,
  DocumentIcon,
  LightningIcon
} from './Icons';

export default function SidePanel({ analysisData, mode = 'bi_temporal' }) {
  const [activeTab, setActiveTab] = useState('auto');
  const [swipePos, setSwipePos] = useState(50);
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const geojsonLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);

  const isClosp = mode === 'sar_optical' || Boolean(analysisData && (analysisData.closp_result || analysisData.modality));

  // Default active tab based on mode
  const currentTab = activeTab === 'auto' ? (isClosp ? 'closp_evidence' : 'map') : activeTab;

  // Initialize and update Leaflet GIS Map (for Bi-Temporal or single image GIS bounds)
  useEffect(() => {
    const L = window.L;
    if (!L) return;

    if (!leafletInstance.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([37.7749, -122.4194], 14);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri World Imagery',
        maxZoom: 19
      }).addTo(map);

      leafletInstance.current = map;
    }

    if (leafletInstance.current && analysisData && analysisData.bounds) {
      const map = leafletInstance.current;
      const bounds = analysisData.bounds;

      const latLngBounds = L.latLngBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ]);

      map.fitBounds(latLngBounds);

      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Add Overlay
      if (overlayLayerRef.current) map.removeLayer(overlayLayerRef.current);
      if (analysisData.images && analysisData.images.t2) {
        overlayLayerRef.current = L.imageOverlay(analysisData.images.t2, latLngBounds, { opacity: 0.65 }).addTo(map);
      } else if (analysisData.image_b64) {
        overlayLayerRef.current = L.imageOverlay(analysisData.image_b64, latLngBounds, { opacity: 0.75 }).addTo(map);
      }

      // Add Red Vector Polygons
      if (geojsonLayerRef.current) map.removeLayer(geojsonLayerRef.current);
      if (analysisData.geojson) {
        geojsonLayerRef.current = L.geoJSON(analysisData.geojson, {
          style: {
            color: '#ef4444',
            weight: 2.5,
            fillColor: '#ef4444',
            fillOpacity: 0.45
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties;
            layer.bindPopup(`
              <div style="font-family: Inter, sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
                <strong style="color: #ef4444; font-size: 14px;">Change Cluster #${p.id} (${p.severity})</strong><br/>
                <b>Area:</b> ${p.area_m2 ? p.area_m2.toLocaleString() : 0} m² (${p.area_ha} ha)<br/>
                <b>Centroid:</b> (${p.centroid_lat}, ${p.centroid_lon})
              </div>
            `);
          }
        }).addTo(map);
      }
    }
  }, [analysisData, currentTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if ((tab === 'map' || tab === 'closp_map') && leafletInstance.current) {
      setTimeout(() => {
        leafletInstance.current.invalidateSize();
      }, 150);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER FOR CLOSP-VS SENTINEL-1 SAR & SENTINEL-2 OPTICAL ANALYSIS DATA
  // ---------------------------------------------------------------------------
  if (isClosp) {
    if (!analysisData || !analysisData.closp_result) {
      return (
        <div className="visual-section" style={{ background: '#0e0716', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(242, 84, 91, 0.1)', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '20px', padding: '32px', maxWidth: '640px', width: '100%' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <SatelliteDishIcon size={42} color="#f2545b" />
            </span>
            <h3 style={{ color: '#ff9ebb', fontSize: '1.4rem', margin: '0 0 10px 0', fontWeight: '800' }}>
              Sentinel-1 SAR & Sentinel-2 Optical CLOSP-VS Analysis
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              No active CLOSP-VS raster analysis loaded for this session yet.
            </p>
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.7' }}>
              <strong style={{ color: '#f2545b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <LightningIcon size={16} color="#f2545b" /> Quick Start Instructions:
              </strong>
              1. Upload a single <strong>Sentinel-1 SAR</strong> (radar) or <strong>Sentinel-2 Optical</strong> (multispectral) raster in the chat input.<br/>
              2. Zero-shot vision-text embedding similarity scores, land cover percentages, and spatial metrics will appear here.
            </div>
          </div>
        </div>
      );
    }
    const cr = analysisData.closp_result || {};
    const gm = analysisData.geo_metrics || {};
    const rawSyn = analysisData.synthesis || {};
    const evidence = cr.semantic_evidence || [];

    const rasterImageSrc = analysisData.image_b64 || (analysisData.images && (analysisData.images.t2 || analysisData.images.t1 || analysisData.images.overlay));

    const formatText = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        return val.text || val.summary || val.description || JSON.stringify(val);
      }
      return String(val);
    };

    const executiveSummary = formatText(
      typeof rawSyn === 'string' ? rawSyn : rawSyn.executive_summary,
      `CLOSP-VS vision-language analysis on ${analysisData.modality || 'Sentinel'} imagery identified '${cr.top_classification || 'Target Area'}' as the primary land cover classification with a top similarity evidence score of ${cr.top_confidence_pct || 0}%. Covered area totals ${gm.total_area_ha || 0} hectares at coordinates (${gm.center_lat || 0}, ${gm.center_lon || 0}).`
    );

    const semanticComparison = formatText(
      typeof rawSyn === 'object' ? rawSyn.semantic_comparison : null,
      `Semantic vector embeddings indicate strong correspondence with '${cr.top_classification || 'Primary Category'}'. Compared against other candidate land cover categories, top identified category exhibits the highest feature similarity.`
    );

    const spatialAreaBreakdown = formatText(
      typeof rawSyn === 'object' ? rawSyn.spatial_area_breakdown : null,
      `Total raster coverage area: ${gm.total_area_m2 ? gm.total_area_m2.toLocaleString() : 0} m² (${gm.total_area_ha || 0} ha). Top semantic class '${cr.top_classification || 'Category'}' accounts for the primary weight of the analyzed scene.`
    );

    const recommendations = (typeof rawSyn === 'object' && Array.isArray(rawSyn.actionable_insights) && rawSyn.actionable_insights.length > 0)
      ? rawSyn.actionable_insights
      : ((typeof rawSyn === 'object' && Array.isArray(rawSyn.recommended_actions) && rawSyn.recommended_actions.length > 0)
        ? rawSyn.recommended_actions
        : [
            `Verify ground-truth land cover status for ${cr.top_classification || 'primary category'} near centroid (${gm.center_lat || 0}, ${gm.center_lon || 0}).`,
            "Integrate high-resolution multispectral imagery for micro-scale spatial verification.",
            "Cross-reference CLOSP-VS similarity scores with local land use GIS databases."
          ]);

    return (
      <div className="visual-section" style={{ background: '#0e0716' }}>
        {/* Navigation Tabs for CLOSP Mode */}
        <div className="visual-nav" style={{ borderBottomColor: 'rgba(242, 84, 91, 0.3)', background: '#120a1c' }}>
          <button
            className={`visual-tab ${currentTab === 'closp_evidence' ? 'active' : ''}`}
            style={currentTab === 'closp_evidence' ? { borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '8px' } : { display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => handleTabChange('closp_evidence')}
          >
            <SatelliteDishIcon size={16} /> Vision-Language Similarity Evidence
          </button>
          <button
            className={`visual-tab ${currentTab === 'closp_raster' ? 'active' : ''}`}
            style={currentTab === 'closp_raster' ? { borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '8px' } : { display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => handleTabChange('closp_raster')}
          >
            <CameraIcon size={16} /> Single Raster & Spatial Extent
          </button>
          <button
            className={`visual-tab ${currentTab === 'closp_summary' ? 'active' : ''}`}
            style={currentTab === 'closp_summary' ? { borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '8px' } : { display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => handleTabChange('closp_summary')}
          >
            <DocumentIcon size={16} /> Executive Synthesis & Recommendations
          </button>
        </div>

        {/* Tab 1: CLOSP-VS Similarity Evidence Table */}
        {currentTab === 'closp_evidence' && (
          <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ background: 'rgba(242, 84, 91, 0.1)', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f2545b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CLOSP-VS Model Inference ({analysisData.modality || 'Optical'})
              </span>
              <h3 style={{ color: '#ffffff', fontSize: '1.4rem', margin: '4px 0' }}>
                Primary Classification: <span style={{ color: '#ff9ebb' }}>{cr.top_classification}</span>
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                Top Vision-Text Embedding Similarity Evidence: <strong>{cr.top_confidence_pct}%</strong>
              </p>
            </div>

            <h4 style={{ color: '#ff9ebb', fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MetricsIcon size={18} color="#ff9ebb" /> Ranked Semantic Similarity Vector Evidence Table
            </h4>
            <table className="rendered-table" style={{ borderColor: 'rgba(242, 84, 91, 0.3)' }}>
              <thead>
                <tr style={{ background: 'rgba(242, 84, 91, 0.2)' }}>
                  <th style={{ color: '#ff9ebb' }}>Rank</th>
                  <th style={{ color: '#ff9ebb' }}>Semantic Land Cover Category</th>
                  <th style={{ color: '#ff9ebb' }}>Similarity Evidence Score (%)</th>
                  <th style={{ color: '#ff9ebb' }}>Confidence Level</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item) => (
                  <tr key={item.rank} style={{ background: item.rank === 1 ? 'rgba(242, 84, 91, 0.12)' : 'transparent' }}>
                    <td style={{ fontWeight: 'bold' }}>#{item.rank}</td>
                    <td style={{ fontWeight: '600', color: item.rank === 1 ? '#ffffff' : '#cbd5e1' }}>{item.category}</td>
                    <td style={{ color: '#ff9ebb', fontWeight: 'bold' }}>{item.similarity_score}%</td>
                    <td>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: item.evidence_level === 'High' ? 'rgba(242, 84, 91, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        color: item.evidence_level === 'High' ? '#ff9ebb' : '#94a3b8',
                        border: '1px solid rgba(242, 84, 91, 0.4)'
                      }}>
                        {item.evidence_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Single Image Raster & Spatial Extent */}
        {currentTab === 'closp_raster' && (
          <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%' }}>
              <div style={{ background: '#140c22', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h4 style={{ color: '#ff9ebb', fontSize: '1rem', marginBottom: '12px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CameraIcon size={18} color="#ff9ebb" /> Analyzed Raster Image ({analysisData.modality || 'SAR / Optical'})
                </h4>
                {rasterImageSrc ? (
                  <img src={rasterImageSrc} alt="Analyzed Satellite Raster" style={{ width: '100%', maxHeight: '420px', borderRadius: '10px', objectFit: 'contain', border: '1px solid rgba(242, 84, 91, 0.2)' }} />
                ) : (
                  <div style={{ background: 'rgba(242, 84, 91, 0.05)', border: '1px dashed rgba(242, 84, 91, 0.3)', borderRadius: '12px', padding: '32px 20px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                      <OrbitSatelliteIcon size={38} color="#f2545b" />
                    </div>
                    <span style={{ color: '#ff9ebb', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {analysisData.modality || 'Sentinel'} Raster Grid Analyzed
                    </span>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '6px 0 0 0' }}>
                      Pixel Dimensions: {gm.total_pixels ? gm.total_pixels.toLocaleString() : 'Grid'} px | Spatial Resolution: {gm.pixel_resolution_m || 10} m/px
                    </p>
                  </div>
                )}
              </div>

              <div style={{ background: '#140c22', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '14px', padding: '20px' }}>
                <h4 style={{ color: '#ff9ebb', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapIcon size={18} color="#ff9ebb" /> GIS Raster Spatial Extent Metrics
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Monitored Area:</span>
                    <div style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '700' }}>
                      {gm.total_area_m2 ? gm.total_area_m2.toLocaleString() : 0} m² ({gm.total_area_ha} ha)
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>GPS Centroid Coordinates:</span>
                    <div style={{ color: '#ff9ebb', fontSize: '1.1rem', fontWeight: '700' }}>
                      Lat {gm.center_lat}, Lon {gm.center_lon}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Pixel Spatial Resolution:</span>
                    <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '700' }}>
                      {gm.pixel_resolution_m} meters / pixel
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Raster Pixels Analyzed:</span>
                    <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '700' }}>
                      {gm.total_pixels ? gm.total_pixels.toLocaleString() : 0} pixels
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Executive Synthesis & Recommendations */}
        {currentTab === 'closp_summary' && (
          <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            <div style={{ background: '#140c22', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ color: '#ff9ebb', fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DocumentIcon size={18} color="#ff9ebb" /> Executive Summary
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '0.95rem' }}>
                {executiveSummary}
              </p>
            </div>

            <div style={{ background: '#140c22', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ color: '#ff9ebb', fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MetricsIcon size={18} color="#ff9ebb" /> Semantic Comparison & Area Allocation
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '12px' }}>
                <strong>Semantic Comparison:</strong> {semanticComparison}
              </p>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '0.95rem' }}>
                <strong>Spatial Area Allocation:</strong> {spatialAreaBreakdown}
              </p>
            </div>

            <div style={{ background: '#140c22', border: '1px solid rgba(242, 84, 91, 0.3)', borderRadius: '14px', padding: '20px' }}>
              <h4 style={{ color: '#ff9ebb', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LightningIcon size={18} color="#ff9ebb" /> Actionable Recommendations
              </h4>
              <ul style={{ color: '#cbd5e1', paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
                {recommendations.map((item, idx) => {
                  const text = typeof item === 'string'
                    ? item
                    : (typeof item === 'object' && item !== null
                        ? (item.insight || item.action || item.recommendation || item.text || JSON.stringify(item))
                        : String(item));
                  return <li key={idx}>{text}</li>;
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER FOR BI-TEMPORAL GEOSPATIAL CHANGE ANALYSIS DATA (EXISTING SYSTEM)
  // ---------------------------------------------------------------------------
  return (
    <div className="visual-section">
      {/* Top Visual Navigation Tabs */}
      <div className="visual-nav">
        <button
          className={`visual-tab ${currentTab === 'map' ? 'active' : ''}`}
          onClick={() => handleTabChange('map')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <OrbitSatelliteIcon size={16} color="#48cae4" /> GIS Satellite Map & Polygons
        </button>
        <button
          className={`visual-tab ${currentTab === 'swipe' ? 'active' : ''}`}
          onClick={() => handleTabChange('swipe')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <MapIcon size={16} color="#48cae4" /> Side-by-Side Curtain Swipe
        </button>
        <button
          className={`visual-tab ${currentTab === 'mask' ? 'active' : ''}`}
          onClick={() => handleTabChange('mask')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <CameraIcon size={16} color="#48cae4" /> Binary Mask & Vector Overlay
        </button>
        <button
          className={`visual-tab ${currentTab === 'table' ? 'active' : ''}`}
          onClick={() => handleTabChange('table')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <MetricsIcon size={16} color="#48cae4" /> Spatial Metrics & Clusters
        </button>
      </div>

      {/* Visual Workspace Content */}
      <div className="visual-body">
        {/* Tab 1: Leaflet Interactive Satellite Map */}
        <div style={{ display: currentTab === 'map' ? 'block' : 'none', width: '100%', height: '100%' }}>
          <div ref={mapRef} className="leaflet-container-custom" />
        </div>

        {/* Tab 2: Curtain Swipe Comparison Slider */}
        {currentTab === 'swipe' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
            {analysisData && analysisData.images ? (
              <>
                <img
                  src={analysisData.images.t1}
                  alt="T1 Before"
                  style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: `${swipePos}%`,
                    height: '100%',
                    overflow: 'hidden',
                    borderRight: '3px solid #06b6d4'
                  }}
                >
                  <img
                    src={analysisData.images.t2}
                    alt="T2 After"
                    style={{ width: mapRef.current?.offsetWidth || '800px', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={swipePos}
                  onChange={(e) => setSwipePos(e.target.value)}
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '15%',
                    width: '70%',
                    zIndex: 20
                  }}
                />
              </>
            ) : (
              <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                Upload images or run analysis to inspect swipe slider
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Binary Mask & Colorized Vector Overlay */}
        {currentTab === 'mask' && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '100%', overflowY: 'auto' }}>
            {analysisData && analysisData.images ? (
              <>
                <div style={{ background: '#131b2e', border: '1px solid #263554', borderRadius: '12px', padding: '12px' }}>
                  <h4 style={{ color: '#06b6d4', fontSize: '13px', marginBottom: '10px' }}>TinyCD Binary Mask</h4>
                  <img src={analysisData.images.mask} alt="Mask" style={{ width: '100%', borderRadius: '8px', border: '1px solid #263554' }} />
                </div>
                <div style={{ background: '#131b2e', border: '1px solid #263554', borderRadius: '12px', padding: '12px' }}>
                  <h4 style={{ color: '#06b6d4', fontSize: '13px', marginBottom: '10px' }}>Colorized Vector Overlay</h4>
                  <img src={analysisData.images.overlay} alt="Overlay" style={{ width: '100%', borderRadius: '8px', border: '1px solid #263554' }} />
                </div>
              </>
            ) : (
              <div style={{ gridColumn: 'span 2', padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                Upload images or run analysis to inspect binary change mask
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Spatial Metrics & Polygon Clusters Data Table */}
        {currentTab === 'table' && (
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            {analysisData && analysisData.polygons ? (
              <div>
                <h3 style={{ color: '#06b6d4', fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapIcon size={16} color="#06b6d4" /> Polygon Change Clusters & Coordinates
                </h3>
                <table className="rendered-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Area (m²)</th>
                      <th>Area (ha)</th>
                      <th>Centroid Latitude / Longitude</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.polygons.map(p => (
                      <tr key={p.id}>
                        <td>#{p.rank}</td>
                        <td>{p.area_m2 ? p.area_m2.toLocaleString() : 0} m²</td>
                        <td>{p.area_ha} ha</td>
                        <td>({p.centroid_lat}, {p.centroid_lon})</td>
                        <td>
                          <span style={{
                            background: p.severity === 'Major' ? '#ef4444' : '#f59e0b',
                            color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'
                          }}>
                            {p.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                Upload images or run analysis to inspect spatial metrics table
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
