import React from 'react';

export default function LoadingPopup({ message = 'กำลังดำเนินการ...' }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadein 0.18s ease forwards',
      }}
    >
      <div
        className="animate-pop"
        style={{
          background: '#262624',
          border: '1px solid #3d3b37',
          borderRadius: '24px',
          padding: '28px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
          minWidth: '220px',
          maxWidth: '300px',
          textAlign: 'center',
        }}
      >
        {/* Animated Custom Spinner */}
        <div
          style={{
            position: 'relative',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="loading-spinner" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div
            style={{
              font: "600 15px/1.3 'IBM Plex Sans Thai'",
              color: '#f0eee6',
              letterSpacing: '-0.01em',
            }}
          >
            {message}
          </div>
          <div style={{ font: "400 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            กรุณารอสักครู่
          </div>
        </div>
      </div>
    </div>
  );
}
