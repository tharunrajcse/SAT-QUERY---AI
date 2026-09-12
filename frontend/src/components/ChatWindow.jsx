import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  SatelliteDishIcon,
  OrbitSatelliteIcon,
  UserAvatarIcon,
  CameraIcon,
  DocumentIcon,
  MapIcon,
  MetricsIcon,
  LightningIcon,
  SendIcon
} from './Icons';

export default function ChatWindow({
  messages,
  onSendMessage,
  onDownloadPdf,
  onOpenSpatialMetrics,
  hasAnalysisData,
  loading,
  mode = 'bi_temporal',
  sidebarCollapsed = false
}) {
  const [inputText, setInputText] = useState('');
  const [fileT1, setFileT1] = useState(null);
  const [fileT2, setFileT2] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const fileInputRefT1 = useRef(null);
  const fileInputRefT2 = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isSarOptical = mode === 'sar_optical';

  // Auto-scroll to bottom of messages on message update or pipeline run
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (overrideText) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (!textToSend && !fileT1 && !fileT2) return;
    onSendMessage({
      text: textToSend,
      fileT1,
      fileT2
    });
    setInputText('');
    setFileT1(null);
    setFileT2(null);
    setIsPlusMenuOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuickChip = (queryText) => {
    setInputText(queryText);
  };

  // Voice Assistant: Speech-to-Text handler
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input (Speech Recognition) is supported in Chrome, Edge, and Safari browsers.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputText(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setIsListening(false);
    }
  };

  return (
    <div className={`chat-section ${isSarOptical ? 'sar-optical-section' : ''}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, height: '100%', width: '100%', overflow: 'hidden', minHeight: 0 }}>
      {/* Background Vector Artwork */}
      {isSarOptical ? (
        <>
          <div className="sar-radar-crosshair"></div>
          <div className="chat-bg-planet chat-planet-large" style={{ background: 'radial-gradient(circle at 30% 30%, #f2545b, #170d22)', opacity: 0.25 }}>
            <div className="planet-stripes"></div>
          </div>
          <div className="chat-bg-planet chat-planet-medium" style={{ background: 'radial-gradient(circle at 30% 30%, #b5179e, #0e0716)', opacity: 0.25 }}>
            <div className="planet-stripes"></div>
          </div>
          <div className="chat-bg-streak" style={{ background: 'linear-gradient(90deg, #f2545b 0%, #7209b7 60%, transparent 100%)', opacity: 0.4 }}></div>
        </>
      ) : (
        <>
          <div className="chat-bg-planet chat-planet-large">
            <div className="planet-stripes"></div>
          </div>
          <div className="chat-bg-planet chat-planet-medium">
            <div className="planet-stripes"></div>
          </div>
          <div className="chat-bg-planet chat-planet-cyan">
            <div className="planet-stripes-cyan"></div>
          </div>
          <div className="chat-bg-streak"></div>
        </>
      )}

      {/* Messages Stream — full width so scrollbar anchors at far right corner of webpage */}
      <div className="messages-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '24px 40px 140px 40px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 10, width: '100%', maxWidth: '100%', margin: 0 }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
            <div className={`avatar ${msg.sender === 'user' ? 'user-avatar' : 'bot-avatar'}`} style={isSarOptical && msg.sender === 'bot' ? { background: 'linear-gradient(135deg, #f2545b, #7209b7)', border: '1px solid #ff7b9c' } : {}}>
              {msg.sender === 'user' ? (
                <UserAvatarIcon size={20} color="#ffffff" />
              ) : isSarOptical ? (
                <SatelliteDishIcon size={20} color="#ffffff" />
              ) : (
                <OrbitSatelliteIcon size={20} color="#ffffff" />
              )}
            </div>

            <div className={`msg-card ${msg.sender === 'user' ? (isSarOptical ? 'user-card sar-user-card' : 'user-card') : (isSarOptical ? 'bot-card sar-bot-card' : 'bot-card')}`}>
              {msg.attachments && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {msg.attachments.t1 && (
                    <span className="pill" style={isSarOptical ? { background: 'rgba(242, 84, 91, 0.25)', borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '5px' } : { display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CameraIcon size={14} /> {isSarOptical ? 'Sentinel-1 SAR Image' : 'Take Image 1'}: {msg.attachments.t1}
                    </span>
                  )}
                  {msg.attachments.t2 && (
                    <span className="pill" style={isSarOptical ? { background: 'rgba(114, 9, 183, 0.3)', borderColor: '#b5179e', color: '#e0aaff', display: 'inline-flex', alignItems: 'center', gap: '5px' } : { display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CameraIcon size={14} /> {isSarOptical ? 'Sentinel-2 Optical Image' : 'Take Image 2'}: {msg.attachments.t2}
                    </span>
                  )}
                </div>
              )}
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              </div>
              {msg.hasPdfDownload && (
                <div className="chat-msg-actions">
                  <button className="cosmic-btn-pill cosmic-btn-outline action-btn" onClick={onOpenSpatialMetrics} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isSarOptical ? <SatelliteDishIcon size={16} /> : <MapIcon size={16} />}
                    {isSarOptical ? 'View Vision-Text Similarity & Spatial Metrics' : 'View Spatial Metrics & Maps'}
                  </button>
                  <button className="cosmic-btn-pill cosmic-btn-solid action-btn" onClick={onDownloadPdf} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <DocumentIcon size={16} /> Download Report
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-row bot-row">
            <div className="avatar bot-avatar" style={isSarOptical ? { background: 'linear-gradient(135deg, #f2545b, #7209b7)' } : {}}>
              {isSarOptical ? <SatelliteDishIcon size={20} color="#ffffff" /> : <OrbitSatelliteIcon size={20} color="#ffffff" />}
            </div>
            <div className="msg-card" style={isSarOptical ? { background: 'rgba(30, 15, 38, 0.9)', borderColor: '#f2545b' } : {}}>
              <span style={{ color: isSarOptical ? '#f2545b' : '#48cae4', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LightningIcon size={16} color={isSarOptical ? '#f2545b' : '#48cae4'} />
                {isSarOptical ? 'Running CLOSP-VS Vision-Language Similarity Inference & Spatial Classification...' : 'Processing TinyCD model & GeoPandas vectorization...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FIXED Bottom Input Area — pinned 12px above screen bottom, aligned 40px from sidebar */}
      <div className="chat-bottom-dock" style={{ position: 'fixed', bottom: '12px', left: sidebarCollapsed ? '70px' : '280px', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0, padding: 0, pointerEvents: 'none', transition: 'left 0.25s ease' }}>
        {/* Input bar — transparent container, rounded input-box-wrap aligned left */}
        <div className="chat-input-container" style={{ pointerEvents: 'auto', width: '100%', margin: 0, padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
          {/* Attachment Badges */}
          <div className="attachment-pills">
            {fileT1 && (
              <span className="pill" style={isSarOptical ? { background: 'rgba(242, 84, 91, 0.25)', borderColor: '#f2545b', color: '#ff9ebb', display: 'inline-flex', alignItems: 'center', gap: '5px' } : { display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CameraIcon size={14} />
                {isSarOptical ? 'Sentinel-1 SAR' : 'Image 1'}: {fileT1.name}
                <span className="pill-remove" onClick={() => setFileT1(null)}>✕</span>
              </span>
            )}
            {fileT2 && (
              <span className="pill" style={isSarOptical ? { background: 'rgba(114, 9, 183, 0.3)', borderColor: '#b5179e', color: '#e0aaff', display: 'inline-flex', alignItems: 'center', gap: '5px' } : { display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CameraIcon size={14} />
                {isSarOptical ? 'Sentinel-2 Optical' : 'Image 2'}: {fileT2.name}
                <span className="pill-remove" onClick={() => setFileT2(null)}>✕</span>
              </span>
            )}
            {isListening && (
              <span className="pill pill-listening">
                Listening to voice... Speak now
              </span>
            )}
          </div>

          {/* Rounded Input Box — 12px from screen bottom, aligned 40px from sidebar */}
          <div className="input-box-wrap" style={isSarOptical ? { borderColor: 'rgba(242, 84, 91, 0.4)', background: '#1a0e28', maxWidth: '900px', width: 'calc(100vw - 340px)', margin: 0, borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.85)' } : { maxWidth: '900px', width: 'calc(100vw - 340px)', margin: 0, borderRadius: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.85)' }}>
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRefT1}
              accept="image/*,.tif,.tiff"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && setFileT1(e.target.files[0])}
            />
            <input
              type="file"
              ref={fileInputRefT2}
              accept="image/*,.tif,.tiff"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && setFileT2(e.target.files[0])}
            />

            {/* Plus (+) Action Button */}
            <div className="plus-btn-container">
              <button
                className={`plus-action-btn ${isPlusMenuOpen ? 'active' : ''}`}
                style={isSarOptical && isPlusMenuOpen ? { borderColor: '#f2545b', color: '#f2545b' } : {}}
                title="Add attachment image"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              >
                +
              </button>

              {/* Popover Attachment Menu */}
              {isPlusMenuOpen && (
                <div className="plus-popover-menu" style={isSarOptical ? { border: '1px solid rgba(242, 84, 91, 0.4)' } : {}}>
                  <div
                    className="popover-menu-item"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      fileInputRefT1.current.click();
                    }}
                  >
                    <span className="menu-item-icon"><CameraIcon size={18} color="#f2545b" /></span>
                    <div className="menu-item-text">
                      <span className="menu-item-title" style={isSarOptical ? { color: '#ff9ebb' } : {}}>
                        {isSarOptical ? 'Upload Sentinel-1 SAR Image' : 'Take Image 1'}
                      </span>
                      <span className="menu-item-sub">
                        {isSarOptical ? 'Synthetic Aperture Radar (Sentinel-1 SAR raster)' : 'Upload T1 (Before) satellite image'}
                      </span>
                    </div>
                  </div>

                  <div
                    className="popover-menu-item"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      fileInputRefT2.current.click();
                    }}
                  >
                    <span className="menu-item-icon"><CameraIcon size={18} color="#b5179e" /></span>
                    <div className="menu-item-text">
                      <span className="menu-item-title" style={isSarOptical ? { color: '#e0aaff' } : {}}>
                        {isSarOptical ? 'Upload Sentinel-2 Optical Image' : 'Take Image 2'}
                      </span>
                      <span className="menu-item-sub">
                        {isSarOptical ? 'Multispectral Optical (Sentinel-2 raster)' : 'Upload T2 (After) satellite image'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder={
                isListening
                  ? "Listening... Speak your prompt..."
                  : isSarOptical
                    ? "Ask CLOSP-VS (e.g., 'Does this SAR image represent an urban area?')..."
                    : "Ask anything..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            {/* Sound Wave Blue Voice Assistant Button */}
            <button
              className={`blue-wave-btn ${isListening ? 'listening' : ''}`}
              style={isSarOptical ? { background: '#7209b7' } : {}}
              title={isListening ? "Stop listening" : "Click to speak (Voice Assistant)"}
              onClick={toggleVoiceInput}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12V12.01M8 9V15M12 5V19M16 8V16M20 11V13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Send Button */}
            <button
              className="cosmic-btn-pill cosmic-btn-solid send-btn"
              style={isSarOptical ? { background: 'linear-gradient(135deg, #f2545b, #7209b7)', borderColor: '#f2545b', display: 'inline-flex', alignItems: 'center', gap: '6px' } : { display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleSend()}
            >
              <span>SEND</span> <SendIcon size={14} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
