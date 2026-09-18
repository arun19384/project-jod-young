import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function EditAccountModal({ account, onSave, onClose }) {
  const [name, setName] = useState(account?.name || '');
  const [role, setRole] = useState(account?.role || '');
  const [amt, setAmt] = useState(account?.amt != null ? String(account.amt) : '');
  const [tint, setTint] = useState(account?.tint || '#d97757');

  const colors = ['#d97757', '#c9a227', '#7fa3c9', '#6c9a76', '#9b8ec4'];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          แก้ไขยอดเงินบัญชี {account?.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ยอดเงินคงเหลือปัจจุบัน (บาท)</label>
            <input
              type="number"
              style={{ ...inputStyle, fontSize: '18px', fontWeight: '600', color: '#6c9a76' }}
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>ชื่อบัญชี</label>
            <input
              type="text"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label style={labelStyle}>สีแถบแท็ก</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => setTint(c)}
                  className="pressable"
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
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              const parsedAmt = parseFloat(amt);
              onSave({
                name: name.trim() || account.name,
                role: role.trim(),
                amt: isNaN(parsedAmt) ? (account.amt || 0) : parsedAmt,
                tint,
              });
            }}
          >
            บันทึกยอดเงิน
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Add Credit Card Modal
