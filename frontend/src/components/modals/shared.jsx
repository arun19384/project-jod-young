import React from 'react';

export const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))',
};

export const modalBoxStyle = {
  background: '#262624',
  border: '1px solid #3a3936',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '400px',
  padding: '22px 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
  maxHeight: 'calc(100dvh - max(32px, env(safe-area-inset-top, 0px)) - max(32px, env(safe-area-inset-bottom, 0px)))',
  overflowY: 'auto',
};

export const inputStyle = {
  background: '#302f2c',
  border: '1px solid #3a3936',
  borderRadius: '12px',
  padding: '11px 14px',
  color: '#f0eee6',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

export const labelStyle = {
  fontSize: '12px',
  color: '#8a8780',
  marginBottom: '4px',
  display: 'block',
};

export const primaryBtnStyle = {
  flex: 1,
  background: '#d97757',
  color: '#1a1a18',
  border: 'none',
  borderRadius: '12px',
  padding: '12px',
  fontWeight: '600',
  fontSize: '13.5px',
  cursor: 'pointer',
};

export const cancelBtnStyle = {
  background: 'transparent',
  border: '1px solid #45433c',
  color: '#a8a49a',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '13px',
  cursor: 'pointer',
};

export function SheetGrabber() {
  return (
    <div
      style={{
        width: '36px',
        height: '4px',
        borderRadius: '99px',
        background: '#4a4843',
        margin: '-6px auto 6px',
        flex: 'none',
      }}
    />
  );
}

// 1. Edit Monthly Budget Modal
