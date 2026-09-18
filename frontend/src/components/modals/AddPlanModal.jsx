import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function AddPlanModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [a, setA] = useState('');
  const [total, setTotal] = useState('10');
  const [paid, setPaid] = useState('0');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มรายการผ่อนชำระ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อสินค้าหรือสิ่งที่ผ่อน (เช่น iPhone, เครื่องซักผ้า)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="โทรศัพท์มือถือ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>ค่างวดต่อเดือน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="1500"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>จำนวนงวดทั้งหมด</label>
              <input
                type="number"
                style={inputStyle}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>จ่ายไปแล้วกี่งวด</label>
              <input
                type="number"
                style={inputStyle}
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
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
                a: parseFloat(a) || 0,
                total: parseInt(total) || 10,
                paid: parseInt(paid) || 0,
              });
            }}
          >
            เพิ่มรายการผ่อน
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 7. Add Debt Modal
