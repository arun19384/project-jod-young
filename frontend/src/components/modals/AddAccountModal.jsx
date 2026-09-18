import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function AddAccountModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('ใช้จ่ายทั่วไป');
  const [amt, setAmt] = useState('');
  const [tint, setTint] = useState('#d97757');

  const colors = ['#d97757', '#c9a227', '#7fa3c9', '#6c9a76', '#9b8ec4'];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มบัญชีธนาคารใหม่
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อบัญชี (เช่น กสิกรไทย, Main, กรุงไทย)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="กสิกรไทย"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>หน้าที่ / โน้ต (เช่น ใช้จ่าย, เงินเก็บ, สำรอง)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ใช้จ่ายประจำวัน"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>ยอดเงินคงเหลือปัจจุบัน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="10000"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>สีแถบแท็ก</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => setTint(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: tint === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), role: role.trim(), amt: parseFloat(amt) || 0, tint });
            }}
          >
            เพิ่มบัญชี
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 2.1 Edit Bank Account Modal
