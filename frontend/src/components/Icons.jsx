import React from 'react';

export const SatelliteDishIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3C7.03 3 3 7.03 3 12C3 13.9 3.59 15.66 4.59 17.13L2.5 21.5L7.26 19.82C8.65 20.57 10.27 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7V13L16 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

export const OrbitSatelliteIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none" />
    <path d="M4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C16.1421 4.5 19.5 7.85786 19.5 12C19.5 16.1421 16.1421 19.5 12 19.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" />
    <path d="M17.5 6.5L20.5 3.5M6.5 17.5L3.5 20.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M19 12H21M3 12H5M12 3V5M12 19V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const UserAvatarIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
  </svg>
);

export const TrashIcon = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 6H5H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11V17M14 11V17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CameraIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M23 19C23 19.5523 22.5523 20 22 20H2C1.44772 20 1 19.5523 1 19V8C1 7.44772 1.44772 7 2 7H7L9 4H15L17 7H22C22.5523 7 23 7.44772 23 8V19Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13.5" r="3.5" stroke={color} strokeWidth="1.8" />
  </svg>
);

export const MapIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="2" x2="8" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const DocumentIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <polyline points="10 9 9 9 8 9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const MetricsIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 20V10M12 20V4M6 20V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LightningIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} />
  </svg>
);

export const SendIcon = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RefreshIcon = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21.5 2V6H17.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 22V18H6.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 11.5C20.0123 13.0645 19.5161 14.5913 18.587 15.8497C17.6578 17.1082 16.3403 18.0315 14.8344 18.4776C13.3285 18.9238 11.7088 18.8703 10.2223 18.3253C8.73582 17.7803 7.45618 16.7712 6.57604 15.4513M4 12.5C3.98774 10.9355 4.4839 9.40871 5.41303 8.15027C6.34217 6.89183 7.65969 5.96853 9.1656 5.52238C10.6715 5.07623 12.2912 5.12973 13.7777 5.67472C15.2642 6.21971 16.5438 7.22882 17.424 8.54874" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LogOutIcon = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DownloadIcon = ({ size = 16, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BotIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="16" r="1.5" fill={color}/>
    <circle cx="15.5" cy="16" r="1.5" fill={color}/>
    <path d="M12 2V7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="2" r="1" fill={color}/>
  </svg>
);

