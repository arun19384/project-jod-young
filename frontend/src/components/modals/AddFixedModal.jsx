import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function AddFixedModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [day, setDay] = useState('15');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มค่าใช้จ่ายคงที่รายเดือน
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อรายการ (เช่น ค่าเช่าห้อง, เน็ตบ้าน, ประกัน)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ค่าอินเทอร์เน็ต"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>ยอดเงิน (บาท/เดือน)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="499"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วันที่ต้องจ่ายของทุกเดือน</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="10"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), amt: parseFloat(amt) || 0, day, done: false });
            }}
          >
            บันทึกบิล
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 6. Add Installment Plan Modal
