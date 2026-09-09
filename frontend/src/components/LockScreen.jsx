import React, { useState, useEffect } from 'react';

export default function LockScreen({ expectedPin, onUnlock }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        // Validate PIN
        if (nextPin === expectedPin) {
          onUnlock();
        } else {
          setShake(true);
          setErrorMsg('รหัส PIN ไม่ถูกต้อง ลองอีกครั้ง');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  // Listen to physical keyboard events as well
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, expectedPin]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#1a1a18',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 24px 50px',
        userSelect: 'none',
      }}
    >
      {/* Top Header & Dots */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'rgba(217, 119, 87, 0.15)',
            border: '1px solid rgba(217, 119, 87, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          🔒
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ font: "600 20px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            ป้อนรหัส PIN 4 หลัก
          </div>
          <div style={{ font: "400 13px/1.4 'IBM Plex Sans Thai'", color: '#8a8780', marginTop: '4px' }}>
            ปลดล็อคเพื่อเข้าสู่ จดยัง
          </div>
        </div>

        {/* 4 PIN Dots */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '10px',
            transform: shake ? 'translateX(-8px)' : 'none',
            transition: 'transform 0.08s ease-in-out',
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '99px',
                  background: filled ? '#d97757' : '#302f2c',
                  border: `2px solid ${filled ? '#d97757' : '#45433c'}`,
                  boxShadow: filled ? '0 0 12px rgba(217,119,87,0.5)' : 'none',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div
            style={{
              font: "500 13px/1 'IBM Plex Sans Thai'",
              color: '#d97757',
              marginTop: '4px',
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <div
        style={{
          width: '100%',
          maxWidth: '300px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '18px 24px',
          justifyItems: 'center',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(String(num))}
            className="pressable"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '99px',
              background: '#262624',
              border: '1px solid #373630',
              color: '#f0eee6',
              font: "500 24px/1 'IBM Plex Sans Thai'",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {num}
          </button>
        ))}

        {/* Empty space or Biometrics / Face ID prompt */}
        <button
          onClick={() => {
            // FaceID / Bio prompt simulation
            if (window.confirm('ยืนยันตัวตนด้วย Face ID / Touch ID?')) {
              onUnlock();
            }
          }}
          className="pressable"
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '99px',
            background: 'transparent',
            border: 'none',
            color: '#d97757',
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          🙂
        </button>

        {/* Number 0 */}
        <button
          onClick={() => handleDigit('0')}
          className="pressable"
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '99px',
            background: '#262624',
            border: '1px solid #373630',
            color: '#f0eee6',
            font: "500 24px/1 'IBM Plex Sans Thai'",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          0
        </button>

        {/* Backspace */}
        <button
          onClick={handleBackspace}
          className="pressable"
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '99px',
            background: 'transparent',
            border: 'none',
            color: '#8a8780',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ⌫
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
