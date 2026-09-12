import React from 'react';
import SidePanel from './SidePanel';
import { SatelliteDishIcon, OrbitSatelliteIcon } from './Icons';

export default function GISMetricsModal({ isOpen, onClose, analysisData, mode = 'bi_temporal' }) {
  if (!isOpen) return null;

  const isClosp = mode === 'sar_optical' || (analysisData && !!analysisData.closp_result);

  return (
    <div className="gis-modal-overlay" onClick={onClose}>
      <div className="gis-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gis-modal-header" style={isClosp ? { background: '#0e0716', borderBottom: '1px solid rgba(242, 84, 91, 0.3)' } : {}}>
          <div className="gis-modal-title">
            <span className="modal-icon" style={{ display: 'flex', alignItems: 'center' }}>
              {isClosp ? <SatelliteDishIcon size={22} color="#f2545b" /> : <OrbitSatelliteIcon size={22} color="#48cae4" />}
            </span>
            <h3 style={isClosp ? { color: '#ff9ebb' } : {}}>
              {isClosp
                ? 'Sentinel-1/2 CLOSP-VS Vision-Text Similarity & GIS Metrics'
                : 'Bi-Temporal GIS Spatial Metrics & Satellite Maps'}
            </h3>
          </div>
          <button className="gis-modal-close-btn" onClick={onClose} title="Close Visual Suite">
            &times;
          </button>
        </div>

        <div className="gis-modal-body">
          <SidePanel analysisData={analysisData} mode={mode} />
        </div>
      </div>
    </div>
  );
}
