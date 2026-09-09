import React, { useState, useEffect } from 'react';

export default function AppLoadingScreen() {
  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    'กำลังเชื่อมต่อฐานข้อมูล TiDB Cloud...',
    'กำลังดาวน์โหลดสรุปยอดเงินและบัญชี...',
    'จัดเตรียมข้อมูลให้พร้อมใช้งาน...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'radial-gradient(ellipse at 50% 35%, #242320 0%, #131312 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Animated Ambient Background Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '18%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 87, 0.42) 0%, rgba(217, 119, 87, 0) 70%)',
          filter: 'blur(70px)',
          animation: 'orbFloat1 7s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '16%',
          right: '12%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108, 154, 118, 0.32) 0%, rgba(108, 154, 118, 0) 70%)',
          filter: 'blur(75px)',
          animation: 'orbFloat2 8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '10%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155, 142, 196, 0.26) 0%, rgba(155, 142, 196, 0) 70%)',
          filter: 'blur(65px)',
          animation: 'orbFloat3 9s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Center Content Stack */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          zIndex: 2,
        }}
      >
        {/* Logo Container with Concentric Radar Wave Rings */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ripple Ring 1 */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '34px',
              border: '2px solid rgba(217, 119, 87, 0.45)',
              animation: 'ripplePulse 2.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite',
              pointerEvents: 'none',
            }}
          />
          {/* Ripple Ring 2 (Staggered) */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '34px',
              border: '2px solid rgba(217, 119, 87, 0.35)',
              animation: 'ripplePulse 2.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 1.4s',
              pointerEvents: 'none',
            }}
          />

          {/* App Mascot Image */}
          <div
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '28px',
              overflow: 'hidden',
              background: 'rgba(38, 38, 36, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px)',
              animation: 'mascotFloat 3.2s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(217, 119, 87, 0.4)',
            }}
          >
            <img
              src="/app-logo.png"
              alt="จดยัง Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                // Fallback to favicon if app-logo fails
                e.currentTarget.src = '/favicon.png';
              }}
            />
          </div>
        </div>

        {/* Brand Information */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              font: "700 32px/1.2 'IBM Plex Sans Thai'",
              background: 'linear-gradient(180deg, #ffffff 0%, #dedbd2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
          >
            จดยัง
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              font: "400 13px/1.4 'IBM Plex Sans Thai'",
              color: '#9e9a8f',
              letterSpacing: '0.01em',
            }}
          >
            พิมพ์ประโยคเดียว ระบบจัดหมวดให้ทันที
          </p>
        </div>

        {/* Sleek Progress / Shimmer Bar */}
        <div
          style={{
            width: '180px',
            height: '4px',
            borderRadius: '99px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginTop: '8px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '99px',
              background: 'linear-gradient(90deg, #d97757 0%, #f5b28e 45%, #6c9a76 80%, #d97757 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s infinite linear',
            }}
          />
        </div>

        {/* Dynamic Status Text with Glowing Pulsing Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#d97757',
              boxShadow: '0 0 10px #d97757',
              animation: 'pulseDot 1.4s ease-in-out infinite',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              font: "500 13px 'IBM Plex Sans Thai'",
              color: '#dedbd2',
              letterSpacing: '0.01em',
              transition: 'all 0.3s ease',
            }}
          >
            {statusMessages[statusIndex]}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          font: "400 11.5px 'IBM Plex Sans Thai'",
          color: '#6e6c65',
          letterSpacing: '0.02em',
          zIndex: 2,
        }}
      >
        <span>☁️ ซิงค์ข้อมูลอัตโนมัติแบบ Real-time</span>
      </div>
    </div>
  );
}
