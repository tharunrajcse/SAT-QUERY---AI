import React from 'react';
import { UserAvatarIcon, LogOutIcon, OrbitSatelliteIcon, SatelliteDishIcon } from './Icons';

export default function ModeSelectionPage({ user, onSelectBiTemporal, onSelectSarOptical, onLogout }) {
  return (
    <div className="cosmic-page-wrap" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, #070d18 0%, #0d1b2a 50%, #091322 100%)'
    }}>
      {/* Background Decorative Vector Planet Graphics & Watermark (Z-index 1, non-blocking) */}
      <div className="planet-graphic" style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle at 30% 30%, #f2545b, #0d1b2a)',
        opacity: 0.4,
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <div className="planet-stripes"></div>
      </div>

      <div className="planet-graphic" style={{
        position: 'absolute',
        bottom: '-60px',
        left: '-60px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle at 30% 30%, #48cae4, #0d1b2a)',
        opacity: 0.4,
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <div className="planet-stripes"></div>
        <div className="planet-ring"></div>
      </div>

      <div className="planet-graphic" style={{
        position: 'absolute',
        top: '140px',
        left: '20px',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle at 30% 30%, #48cae4, #070d18)',
        opacity: 0.3,
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <div className="planet-stripes-cyan"></div>
      </div>

      <div className="shooting-star-streak" style={{
        position: 'absolute',
        top: '90px',
        right: '120px',
        opacity: 0.5,
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>

      {/* Massive Faded Background Title */}
      <div style={{
        position: 'absolute',
        top: '6%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '7rem',
        fontWeight: '900',
        letterSpacing: '20px',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255, 255, 255, 0.05)',
        opacity: 0.5,
        zIndex: 1,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}>
        GEO BI TEMPORAL
      </div>

      {/* Navigation Header (Fixed at top, Z-index 50) */}
      <nav className="cosmic-navbar" style={{ zIndex: 50, position: 'relative', flexShrink: 0 }}>
        <div className="cosmic-brand">
          <div className="cosmic-brand-dot"></div>
          <span className="cosmic-brand-text">GEO BI TEMPORAL</span>
        </div>

        <div className="cosmic-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-profile-badge" style={{ background: 'rgba(72, 202, 228, 0.12)', border: '1px solid rgba(72, 202, 228, 0.3)', padding: '0.45rem 1rem', borderRadius: '20px', color: '#e2e8f0', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <UserAvatarIcon size={16} color="#48cae4" />
            <span>Welcome, <strong>{user?.username || user?.first_name || 'Researcher'}</strong></span>
          </div>
          <button className="cosmic-btn-pill cosmic-btn-outline" onClick={onLogout} title="Log Out of GEO BI TEMPORAL" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogOutIcon size={14} />
            <span>LOG OUT</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area starting directly below Header (Z-index 10) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.5rem 1.5rem 2rem 1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Title Header Section */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.3rem 1rem',
            borderRadius: '50px',
            background: 'rgba(72, 202, 228, 0.12)',
            border: '1px solid rgba(72, 202, 228, 0.3)',
            color: '#48cae4',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            GEOSPATIAL INTELLIGENCE PLATFORM
          </span>

          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff 0%, #48cae4 50%, #90e0ef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px'
          }}>
            Select Analysis Workflow
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '680px', margin: '0 auto', lineHeight: '1.5' }}>
            Choose your remote sensing pipeline: Compare bi-temporal timestamps or analyze Sentinel-1 SAR & Sentinel-2 Optical rasters using CLOSP-VS.
          </p>
        </div>

        {/* Dual Cosmic Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.8rem',
          width: '100%',
          maxWidth: '920px'
        }}>
          {/* Card 1: Bi-Temporal Analysis */}
          <div
            onClick={onSelectBiTemporal}
            className="feature-card"
            style={{
              padding: '2rem 1.8rem',
              borderRadius: '24px',
              border: '1px solid rgba(72, 202, 228, 0.35)',
              background: 'linear-gradient(145deg, rgba(13, 27, 42, 0.92) 0%, rgba(9, 19, 34, 0.96) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              backdropFilter: 'blur(16px)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(72, 202, 228, 0.8)';
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(72, 202, 228, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(72, 202, 228, 0.35)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6)';
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(72, 202, 228, 0.25) 0%, rgba(0, 119, 182, 0.2) 100%)',
              border: '1px solid rgba(72, 202, 228, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(72, 202, 228, 0.2)'
            }}>
              <OrbitSatelliteIcon size={28} color="#48cae4" />
            </div>

            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#48cae4',
              marginBottom: '0.4rem'
            }}>
              T1 + T2 Image Pair
            </span>

            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.6rem 0' }}>
              Bi-Temporal Analysis
            </h3>

            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.6rem 0', flex: 1 }}>
              Compare pre (T1) and post (T2) satellite image timestamps to extract binary change masks, spatial polygon metrics, and AI driver analysis using TinyCD.
            </p>

            <button className="cosmic-btn-pill cosmic-btn-solid" style={{ width: '100%', padding: '0.8rem 1.2rem', fontSize: '0.88rem', fontWeight: '700' }}>
              LAUNCH BI-TEMPORAL MODE →
            </button>
          </div>

          {/* Card 2: Sentinel-1 / Sentinel-2 SAR + Optical Analysis */}
          <div
            onClick={onSelectSarOptical}
            className="feature-card"
            style={{
              padding: '2rem 1.8rem',
              borderRadius: '24px',
              border: '1px solid rgba(242, 84, 91, 0.4)',
              background: 'linear-gradient(145deg, rgba(30, 20, 40, 0.92) 0%, rgba(9, 19, 34, 0.96) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              backdropFilter: 'blur(16px)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(242, 84, 91, 0.8)';
              e.currentTarget.style.boxShadow = '0 30px 60px rgba(242, 84, 91, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(242, 84, 91, 0.4)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6)';
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(242, 84, 91, 0.25) 0%, rgba(180, 40, 60, 0.2) 100%)',
              border: '1px solid rgba(242, 84, 91, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(242, 84, 91, 0.2)'
            }}>
              <SatelliteDishIcon size={28} color="#f2545b" />
            </div>

            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#f2545b',
              marginBottom: '0.4rem'
            }}>
              Single Image (SAR / Optical)
            </span>

            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ffffff', margin: '0 0 0.6rem 0' }}>
              SAR + Optical Analysis
            </h3>

            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.6rem 0', flex: 1 }}>
              Upload single Sentinel-1 SAR or Sentinel-2 Optical rasters for zero-shot vision-language classification, similarity vector evidence, and land cover breakdown using CLOSP-VS.
            </p>

            <button className="cosmic-btn-pill" style={{
              width: '100%',
              padding: '0.8rem 1.2rem',
              fontSize: '0.88rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #f2545b 0%, #c1121f 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 20px rgba(242, 84, 91, 0.4)'
            }}>
              LAUNCH SAR + OPTICAL MODE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
