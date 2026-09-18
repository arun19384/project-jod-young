import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function AddCardModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [cut, setCut] = useState('15');
  const [due, setDue] = useState('5');
  const [amt, setAmt] = useState('0');
  const [limit, setLimit] = useState('30000');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มบัตรเครดิตใหม่
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อบัตร (เช่น SCB, KTC, Citi)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="บัตร KTC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>วันตัดรอบ (วันที่)</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="15"
                value={cut}
                onChange={(e) => setCut(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วันครบกำหนดชำระ</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="5 ต.ค."
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>ยอดใช้ปัจจุบัน (บาท)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="0"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วงเงินบัตร (บาท)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="30000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
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
              onSave({
                name: name.trim(),
                cut,
                due,
                amt: parseFloat(amt) || 0,
                limit: parseFloat(limit) || 30000,
                tint: '#d97757',
                status: `ตัดทุกวันที่ ${cut}`,
              });
            }}
          >
            บันทึกบัตร
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Pay Credit Card Modal
