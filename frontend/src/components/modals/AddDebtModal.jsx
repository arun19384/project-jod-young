import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function AddDebtModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [what, setWhat] = useState('');
  const [a, setA] = useState('');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มรายการออกให้ก่อน / ติดเงิน
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อเพื่อน / คนที่ติดเงิน</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="พี่นก"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>รายละเอียด (เช่น ค่าอาหาร, แท็กซี่)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ค่าข้าวเที่ยง"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>จำนวนเงิน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="350"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim() || !a) return;
              onSave({ name: name.trim(), what: what.trim(), a: parseFloat(a) || 0, cleared: false });
            }}
          >
            บันทึก
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 7.5. Edit Transaction Modal (แก้ไขรายการธุรกรรม - ตัวเลข หมวดหมู่ ชื่อ บัญชี)
