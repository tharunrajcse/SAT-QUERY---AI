import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import LeftSidebar from './components/LeftSidebar';
import LoginPage from './components/LoginPage';
import CosmicLandingPage from './components/CosmicLandingPage';
import GISMetricsModal from './components/GISMetricsModal';
import ModeSelectionPage from './components/ModeSelectionPage';
import { UserAvatarIcon, RefreshIcon, LogOutIcon, DownloadIcon } from './components/Icons';

const DEFAULT_WELCOME_MESSAGE = {
  sender: 'bot',
  text: `### 🛰️ Welcome to GEO BI TEMPORAL!`
};

const DEFAULT_CLOSP_WELCOME_MESSAGE = {
  sender: 'bot',
  text: `### 📡 Welcome to Sentinel-1 & Sentinel-2 SAR + Optical Analysis!`
};

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', or 'signup'
  const [selectedMode, setSelectedMode] = useState('mode_select'); // 'mode_select', 'bi_temporal', or 'sar_optical'
  const [isGisModalOpen, setIsGisModalOpen] = useState(false);

  // Check saved user session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('geochange_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Error reading saved user:", err);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('geochange_token');
    localStorage.removeItem('geochange_user');
    setCurrentUser(null);
    setAuthView('landing');
    setSelectedMode('mode_select');
  };

  // Initialize Sessions from localStorage on initial load
  useEffect(() => {
    try {
      const savedSessionsStr = localStorage.getItem('geochange_chat_sessions');
      const savedActiveId = localStorage.getItem('geochange_active_session_id');

      if (savedSessionsStr) {
        const parsed = JSON.parse(savedSessionsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const tagged = parsed.map(s => {
            // Assign mode if missing based on title
            if (!s.mode) {
              s.mode = (s.title && s.title.toLowerCase().includes('closp')) ? 'sar_optical' : 'bi_temporal';
            }
            return s;
          });
          setSessions(tagged);
          if (savedActiveId && tagged.find(s => s.id === savedActiveId)) {
            setActiveSessionId(savedActiveId);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Error reading localStorage sessions:", err);
    }
  }, []);

  // Ensure an active session exists whenever selectedMode changes to bi_temporal or sar_optical
  useEffect(() => {
    if (selectedMode === 'mode_select') return;

    const modeSessions = sessions.filter(s => s.mode === selectedMode);
    if (modeSessions.length > 0) {
      // Pick first matching session for this mode if current activeSession belongs to other mode
      const currentActive = sessions.find(s => s.id === activeSessionId);
      if (!currentActive || currentActive.mode !== selectedMode) {
        setActiveSessionId(modeSessions[0].id);
      }
    } else {
      // Create new session for this mode if none exists
      createNewSessionForMode(selectedMode);
    }
  }, [selectedMode]);

  // Sync sessions state to localStorage whenever updated (sanitizing heavy base64 images)
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        const sanitized = sessions.map(s => {
          if (!s.analysisData) return s;
          const ad = { ...s.analysisData };
          if (ad.image_b64) ad.image_b64 = null;
          if (ad.images) {
            ad.images = {
              ...ad.images,
              t1: null,
              t2: null,
              mask: null,
              overlay: null
            };
          }
          return { ...s, analysisData: ad };
        });
        localStorage.setItem('geochange_chat_sessions', JSON.stringify(sanitized));
      } catch (err) {
        console.error("Error saving sessions to localStorage:", err);
      }
    }
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('geochange_active_session_id', activeSessionId);
    }
  }, [activeSessionId]);

  const createNewSessionForMode = (targetMode) => {
    const newId = 'session_' + Date.now();
    const isClosp = targetMode === 'sar_optical';
    const welcomeMsg = isClosp ? DEFAULT_CLOSP_WELCOME_MESSAGE : DEFAULT_WELCOME_MESSAGE;
    const newSession = {
      id: newId,
      mode: targetMode,
      title: isClosp ? 'CLOSP (SAR / Optical)' : 'Bi-Temporal Analysis',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      messages: [welcomeMsg],
      analysisData: null
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const createNewSession = () => {
    createNewSessionForMode(selectedMode === 'sar_optical' ? 'sar_optical' : 'bi_temporal');
  };

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      const modeRemaining = updated.filter(s => s.mode === selectedMode);
      if (modeRemaining.length > 0) {
        setActiveSessionId(modeRemaining[0].id);
      } else {
        createNewSessionForMode(selectedMode);
      }
    }
  };

  const updateActiveSession = (updatedFields) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, ...updatedFields };
      }
      return s;
    }));
  };

  // Get current active session object
  const activeSession = sessions.find(s => s.id === activeSessionId) || {
    id: 'default',
    mode: selectedMode,
    title: selectedMode === 'sar_optical' ? 'CLOSP Analysis' : 'Bi-Temporal Analysis',
    messages: [selectedMode === 'sar_optical' ? DEFAULT_CLOSP_WELCOME_MESSAGE : DEFAULT_WELCOME_MESSAGE],
    analysisData: null
  };

  // Execute CLOSP-VS Single-Image Pipeline (SAR / Optical)
  const executeClospPipeline = async ({ text, fileSingle, modality = 'Optical', baseMessages }) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('use_sample', !fileSingle);
    formData.append('modality', modality);
    if (text) formData.append('user_query', text);
    if (fileSingle) formData.append('file', fileSingle);

    try {
      const response = await fetch('/api/closp/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'CLOSP-VS Analysis failed');
      }

      const data = await response.json();
      const gm = data.geo_metrics;
      const cr = data.closp_result;
      const syn = data.synthesis;

      const evRows = cr.semantic_evidence.map(e =>
        `| #${e.rank} | **${e.category}** | ${e.similarity_score}% | ${e.evidence_level} |`
      ).join('\n');

      const botMarkdown = `
### 📡 CLOSP-VS Vision-Language Analysis (${data.modality})
**Primary Classification**: **${cr.top_classification}** (Similarity Evidence: **${cr.top_confidence_pct}%**)

---

### 📋 Executive Summary
${syn.executive_summary}

---

### 📊 Ranked Vision-Text Similarity Evidence Table
| Rank | Semantic Category | Similarity Evidence (%) | Confidence Level |
| :---: | :--- | :---: | :---: |
${evRows}

---

### 🗺️ Raster Spatial Extent Breakdown
- **Coverage Area**: ${gm.total_area_m2.toLocaleString()} m² (${gm.total_area_ha} ha)
- **Centroid Coordinates**: (${gm.center_lat}, ${gm.center_lon})
- **Pixel Resolution**: ${gm.pixel_resolution_m} m/pixel

### 📝 Semantic Comparison & Land Cover Breakdown
- **Semantic Comparison**: ${syn.semantic_comparison}
- **Spatial Area Breakdown**: ${syn.spatial_area_breakdown}

#### 🎯 Actionable Spatial Recommendations:
${syn.actionable_insights ? syn.actionable_insights.map(r => `- ${r}`).join('\n') : '- Field ground-truth verification recommended.'}
`;

      const msgsToUse = baseMessages || activeSession.messages;
      const newMessages = [
        ...msgsToUse,
        {
          sender: 'bot',
          text: botMarkdown,
          hasPdfDownload: true
        }
      ];

      const title = `CLOSP (${data.modality}) - ${cr.top_classification}`;

      updateActiveSession({
        messages: newMessages,
        analysisData: data,
        title: title
      });
    } catch (err) {
      const msgsToUse = baseMessages || activeSession.messages;
      updateActiveSession({
        messages: [
          ...msgsToUse,
          {
            sender: 'bot',
            text: `⚠️ **CLOSP-VS Pipeline Error:** ${err.message}`
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute Bi-Temporal Pipeline (T1 + T2)
  const executePipeline = async ({ text, fileT1, fileT2, useSample = false, baseMessages }) => {
    setLoading(true);

    const formData = new FormData();
    formData.append('use_sample', useSample);
    formData.append('t1_date', '2023-01-15');
    formData.append('t2_date', '2026-06-20');
    formData.append('threshold', '0.5');

    if (fileT1) formData.append('t1_file', fileT1);
    if (fileT2) formData.append('t2_file', fileT2);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const data = await response.json();
      const sm = data.summary_metrics;
      const syn = data.synthesis;
      const polys = data.polygons.slice(0, 5);

      const polyRows = polys.map(p => `| #${p.rank} | ${p.area_m2.toLocaleString()} m² | ${p.area_ha} ha | (${p.centroid_lat}, ${p.centroid_lon}) | ${p.severity} |`).join('\n');

      const botMarkdown = `
### 📋 Executive Summary
${syn.executive_summary}

---

### 📊 Spatial Metrics Summary Table

| Parameter | Value (Metric) | Value (Hectares / %) |
| :--- | :--- | :--- |
| **Total Monitored Area** | ${sm.total_area_m2.toLocaleString()} m² | ${sm.total_area_ha} ha |
| **Changed Surface Area** | **${sm.changed_area_m2.toLocaleString()} m²** | **${sm.changed_area_ha} ha (${sm.changed_area_km2} km²)** |
| **Unchanged Area** | ${(sm.total_area_m2 - sm.changed_area_m2).toLocaleString()} m² | ${(sm.total_area_ha - sm.changed_area_ha).toFixed(4)} ha |
| **Percentage Affected** | **${sm.changed_percentage}%** | ${sm.changed_pixels.toLocaleString()} pixels |
| **Polygon Clusters** | **${sm.polygon_count} distinct clusters** | Center: (${sm.center_lat}, ${sm.center_lon}) |

#### 📍 Top Change Polygon Clusters Table
| Rank | Area (m²) | Area (ha) | Centroid (Lat, Lon) | Severity |
| :---: | :--- | :--- | :--- | :---: |
${polyRows || '| - | No major clusters | - | - | - |'}

---

### 📝 Probable Drivers & Environmental Impact
- **Probable Drivers**: ${syn.change_explanation}
- **Risk Assessment**: ${syn.environmental_impact}

#### 🎯 Actionable Recommendations:
${syn.recommended_actions.map(r => `- ${r}`).join('\n')}
`;

      const msgsToUse = baseMessages || activeSession.messages;
      const newMessages = [
        ...msgsToUse,
        {
          sender: 'bot',
          text: botMarkdown,
          hasPdfDownload: true
        }
      ];

      const title = `Analysis - ${sm.changed_area_ha} ha changed`;

      updateActiveSession({
        messages: newMessages,
        analysisData: data,
        title: title
      });
    } catch (err) {
      const msgsToUse = baseMessages || activeSession.messages;
      updateActiveSession({
        messages: [
          ...msgsToUse,
          {
            sender: 'bot',
            text: `⚠️ **Analysis Pipeline Error:** ${err.message}`
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async ({ text, fileT1, fileT2 }) => {
    const isSarOptical = selectedMode === 'sar_optical';

    const userMsg = {
      sender: 'user',
      text: text || (isSarOptical
        ? 'Please identify the land cover and semantic similarity evidence for this image.'
        : 'Please differentiate these two images and analyze bi-temporal changes.'),
      attachments: {
        t1: fileT1 ? fileT1.name : null,
        t2: fileT2 ? fileT2.name : null
      }
    };

    const updatedMsgs = [...activeSession.messages, userMsg];
    updateActiveSession({ messages: updatedMsgs });

    if (isSarOptical) {
      const fileSingle = fileT1 || fileT2;
      const modality = fileT1 ? 'SAR' : 'Optical';

      if (fileSingle) {
        // User attached an actual image file -> Run CLOSP-VS vision-language analysis pipeline
        await executeClospPipeline({ text, fileSingle, modality, baseMessages: updatedMsgs });
      } else {
        // User sent a text message (e.g. "hi", "hello") WITHOUT attaching an image
        setLoading(true);
        try {
          const chatHistoryFormatted = updatedMsgs.slice(0, -1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          }));

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text || 'hi',
              chat_history: chatHistoryFormatted,
              mode: 'sar_optical'
            })
          });

          const data = await response.json();
          updateActiveSession({
            messages: [
              ...updatedMsgs,
              {
                sender: 'bot',
                text: data.reply || 'Hello! Please attach a Sentinel-1 SAR or Sentinel-2 Optical image to perform CLOSP-VS vision-language analysis.'
              }
            ]
          });
        } catch (err) {
          updateActiveSession({
            messages: [
              ...updatedMsgs,
              {
                sender: 'bot',
                text: `⚠️ Chat error: ${err.message}`
              }
            ]
          });
        } finally {
          setLoading(false);
        }
      }
    } else {
      if (fileT1 || fileT2) {
        await executePipeline({ text, fileT1, fileT2, useSample: false, baseMessages: updatedMsgs });
      } else {
        setLoading(true);
        try {
          const chatHistoryFormatted = updatedMsgs.slice(0, -1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          }));

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text || 'hi',
              chat_history: chatHistoryFormatted,
              mode: 'bi_temporal'
            })
          });

          const data = await response.json();
          updateActiveSession({
            messages: [
              ...updatedMsgs,
              {
                sender: 'bot',
                text: data.reply || 'Hello! Please attach T1 and T2 satellite images to perform bi-temporal change detection.'
              }
            ]
          });
        } catch (err) {
          updateActiveSession({
            messages: [
              ...updatedMsgs,
              {
                sender: 'bot',
                text: `⚠️ Chat error: ${err.message}`
              }
            ]
          });
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch('/api/generate-pdf', { method: 'POST' });
      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedMode === 'sar_optical' ? 'closp_optical_sar_report.pdf' : 'bi_temporal_change_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Error downloading PDF: ${err.message}`);
    }
  };

  // STEP 1: IF NOT LOGGED IN -> RENDER COSMIC LANDING PAGE OR LOGIN/SIGNUP PAGE
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <CosmicLandingPage
          onOpenLogin={() => setAuthView('login')}
          onOpenSignup={() => setAuthView('signup')}
        />
      );
    }
    return (
      <LoginPage
        initialTab={authView === 'signup' ? 'signup' : 'login'}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setSelectedMode('mode_select');
        }}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  // STEP 2: IF LOGGED IN BUT NO MODE SELECTED -> RENDER MODE SELECTION PAGE
  if (selectedMode === 'mode_select') {
    return (
      <ModeSelectionPage
        user={currentUser}
        onSelectBiTemporal={() => setSelectedMode('bi_temporal')}
        onSelectSarOptical={() => setSelectedMode('sar_optical')}
        onLogout={handleLogout}
      />
    );
  }

  // STEP 3: RENDER ACTIVE CHAT WORKSPACE (BI-TEMPORAL OR SAR+OPTICAL)
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header className="app-header" style={selectedMode === 'sar_optical' ? { background: '#0e0716', borderBottom: '1px solid rgba(242, 84, 91, 0.3)' } : {}}>
        <div className="logo-group">
          <div className="cosmic-brand-dot" style={selectedMode === 'sar_optical' ? { background: '#f2545b', boxShadow: '0 0 10px #f2545b' } : {}}></div>
          <div>
            <h1 className="logo-title" style={selectedMode === 'sar_optical' ? { color: '#ffffff' } : {}}>
              {selectedMode === 'sar_optical' ? 'SENTINEL SAR + OPTICAL' : 'GEO BI TEMPORAL'}
            </h1>
            <p className="logo-subtitle" style={selectedMode === 'sar_optical' ? { color: '#ff9ebb' } : {}}>
              {selectedMode === 'sar_optical'
                ? 'CLOSP-VS Zero-Shot Vision-Language Remote Sensing Engine'
                : 'Bi-Temporal Geospatial Intelligence Platform'}
            </p>
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Mode Switcher Button */}
          <button
            className="cosmic-btn-pill cosmic-btn-outline"
            style={selectedMode === 'sar_optical' ? { fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '6px' } : { fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setSelectedMode('mode_select')}
            title="Switch between Bi-Temporal and SAR/Optical workflow modes"
          >
            <RefreshIcon size={14} />
            <span>SWITCH WORKFLOW MODE</span>
          </button>

          <div className="user-profile-badge" style={selectedMode === 'sar_optical' ? { background: 'rgba(242, 84, 91, 0.15)', borderColor: 'rgba(242, 84, 91, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '6px' } : { display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <UserAvatarIcon size={16} color={selectedMode === 'sar_optical' ? '#ff9ebb' : '#48cae4'} />
            <span>Hello, <strong>{currentUser.username || currentUser.first_name}</strong></span>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Log Out of GEO BI TEMPORAL" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogOutIcon size={14} />
            <span>Log Out</span>
          </button>

          <button className="btn btn-crimson" onClick={handleDownloadPdf} disabled={!activeSession.analysisData} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <DownloadIcon size={14} />
            <span>DOWNLOAD REPORT</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Left Sidebar + Spacious Center Chat Window) */}
      <div className="main-workspace" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Sidebar (Mode Filtered Chat History) */}
        <LeftSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewChat={createNewSession}
          onDeleteSession={deleteSession}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentMode={selectedMode}
        />

        {/* Center Chat Window */}
        <ChatWindow
          messages={activeSession.messages}
          onSendMessage={handleSendMessage}
          onDownloadPdf={handleDownloadPdf}
          onOpenSpatialMetrics={() => setIsGisModalOpen(true)}
          hasAnalysisData={!!activeSession.analysisData}
          loading={loading}
          mode={selectedMode}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>

      {/* Interactive GIS Spatial Metrics & Maps Modal Overlay */}
      <GISMetricsModal
        isOpen={isGisModalOpen}
        onClose={() => setIsGisModalOpen(false)}
        analysisData={activeSession.analysisData}
        mode={selectedMode}
      />
    </div>
  );
}
