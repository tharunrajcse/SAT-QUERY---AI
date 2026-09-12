import React from 'react';
import { OrbitSatelliteIcon, MapIcon, BotIcon, DocumentIcon } from './Icons';

export default function CosmicLandingPage({ onOpenLogin, onOpenSignup }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="cosmic-page-wrap">
      {/* Navigation Header */}
      <nav className="cosmic-navbar">
        <div className="cosmic-brand">
          <div className="cosmic-brand-dot"></div>
          <span className="cosmic-brand-text">GEO BI TEMPORAL</span>
        </div>

        <div className="cosmic-nav-links">
          <button onClick={() => scrollToSection('hero')} className="nav-link-btn">Home</button>
          <button onClick={() => scrollToSection('services')} className="nav-link-btn">Services</button>
          <button onClick={() => scrollToSection('about')} className="nav-link-btn">About</button>
          <button onClick={() => scrollToSection('contact')} className="nav-link-btn">Contact</button>
        </div>

        <div className="cosmic-nav-actions">
          <button className="cosmic-btn-pill cosmic-btn-outline" onClick={onOpenLogin}>
            LOG IN
          </button>
          <button className="cosmic-btn-pill cosmic-btn-solid" onClick={onOpenSignup}>
            SIGN UP
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="cosmic-hero">
        {/* Background Decorative Vector Orbs & Planet graphics */}
        <div className="planet-graphic planet-large">
          <div className="planet-stripes"></div>
        </div>

        <div className="planet-graphic planet-medium">
          <div className="planet-stripes"></div>
          <div className="planet-ring"></div>
        </div>

        <div className="planet-graphic planet-small">
          <div className="planet-stripes"></div>
        </div>

        <div className="planet-graphic planet-cyan">
          <div className="planet-stripes-cyan"></div>
        </div>

        {/* Shooting Star Streak */}
        <div className="shooting-star-streak"></div>

        {/* Watermark Outlined Text */}
        <div className="cosmic-watermark">GEO BI TEMPORAL</div>

        {/* Hero Left Content */}
        <div className="hero-content">
          <h1 className="hero-main-title">
            Bi-Temporal <br />
            <span>Landing Page</span>
          </h1>

          <p className="hero-description">
            Advanced remote sensing geospatial change detection powered by PyTorch TinyCD neural networks, 
            GeoPandas vectorization engines, and Gemini AI bi-temporal intelligence.
          </p>

          <div className="hero-cta-group">
            <button className="cosmic-btn-pill cosmic-btn-solid hero-btn" onClick={onOpenSignup}>
              EXPLORE PLATFORM
            </button>
            <button className="cosmic-btn-pill cosmic-btn-outline hero-btn" onClick={() => scrollToSection('services')}>
              LEARN MORE
            </button>
          </div>

          <div className="hero-tech-badges">
            <div className="tech-badge">
              <span className="badge-icon">AI</span>
              <span>TinyCD PyTorch</span>
            </div>
            <div className="tech-badge">
              <span className="badge-icon">Kt</span>
              <span>GeoPandas GIS</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES HIGHLIGHT SECTION */}
      <section id="features" className="cosmic-section">
        <h2 className="section-title">Platform Capabilities</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>⚡ Sub-Second Change Inference</h3>
            <p>Process dual-timestamp satellite imagery pairs to extract precise change masks and polygons.</p>
          </div>
          <div className="feature-card">
            <h3>🗺️ Interactive Satellite Maps</h3>
            <p>Inspect detected environmental changes overlaid directly on Esri World Imagery maps.</p>
          </div>
          <div className="feature-card">
            <h3>📊 Area & Centroid Metrics</h3>
            <p>Get exact polygon hectare counts, GPS centroids, and change severity classifications.</p>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="cosmic-section">
        <h2 className="section-title">Core Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <OrbitSatelliteIcon size={28} color="#48cae4" />
            </div>
            <h3>Bi-Temporal Change Detection</h3>
            <p>High-resolution neural inference comparing T1 (Before) and T2 (After) satellite imagery using TinyCD.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapIcon size={28} color="#48cae4" />
            </div>
            <h3>GeoPandas GIS Vectorization</h3>
            <p>Automated vector polygon extraction, WGS84 centroid calculations, and surface area metric tables.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BotIcon size={28} color="#48cae4" />
            </div>
            <h3>Gemini AI Copilot</h3>
            <p>Interactive voice-enabled remote sensing assistant for environmental risk and driver analysis.</p>
          </div>
          <div className="service-card">
            <div className="service-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DocumentIcon size={28} color="#48cae4" />
            </div>
            <h3>PDF Executive Reports</h3>
            <p>One-click compiler generating high-resolution spatial change reports with graphics and maps.</p>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="cosmic-section alt-bg">
        <div className="about-wrap">
          <div className="about-text">
            <h2 className="section-title left-align">About GEO BI TEMPORAL</h2>
            <p>
              GEO BI TEMPORAL is an end-to-end geospatial intelligence system engineered for rapid satellite image analysis. 
              By combining state-of-the-art deep learning models with vector GIS analysis, we transform raw satellite pairs 
              into actionable environmental insights.
            </p>
            <button className="cosmic-btn-pill cosmic-btn-solid" onClick={onOpenSignup}>
              Get Started Now
            </button>
          </div>
          <div className="about-graphic">
            <div className="about-planet"></div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="cosmic-section">
        <h2 className="section-title">Contact & Support</h2>
        <p className="contact-sub">Have questions or need enterprise GIS integration?</p>
        <div className="contact-box">
          <input type="email" placeholder="Enter your email address..." className="contact-input" />
          <button className="cosmic-btn-pill cosmic-btn-solid">Send Request</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="cosmic-footer">
        <div className="cosmic-brand">
          <div className="cosmic-brand-dot"></div>
          <span className="cosmic-brand-text">GEO BI TEMPORAL</span>
        </div>
        <p>© 2026 GEO BI TEMPORAL Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
