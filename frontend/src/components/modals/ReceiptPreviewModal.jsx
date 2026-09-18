import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function ReceiptPreviewModal({ src, title, onClose }) {
  if (!src) return null;
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1f1e1c',
          border: '1px solid #3a3936',
          borderRadius: '20px',
          maxWidth: '420px',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
        }}
        className="animate-spring-sheet"
      >
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2f2e2a' }}>
          <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            🧾 {title || 'สลิป / ใบเสร็จ'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#353430',
              border: 'none',
              borderRadius: '99px',
              width: '26px',
              height: '26px',
              color: '#a8a49a',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', background: '#141412', maxHeight: '70vh', overflowY: 'auto' }}>
          <img
            src={src}
            alt="Receipt Slip"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '12px',
              objectFit: 'contain',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          />
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #2f2e2a' }}>
          <button style={{ ...cancelBtnStyle, padding: '8px 16px' }} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
