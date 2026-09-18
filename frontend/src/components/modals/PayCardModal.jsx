import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function PayCardModal({ card, accounts = [], onConfirm, onClose }) {
  const [selectedAcc, setSelectedAcc] = useState(accounts[0]?.id || 'Main');
  const [amount, setAmount] = useState(Math.abs(card.amt || 0));

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          ชำระยอดหนี้ {card.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>หักเงินจากบัญชีธนาคาร</label>
            <select
              style={inputStyle}
              value={selectedAcc}
              onChange={(e) => setSelectedAcc(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (คงเหลือ {Math.round(a.amt).toLocaleString()} บาท)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>จำนวนเงินที่ต้องการชำระ (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => onConfirm(card.id, selectedAcc, Math.abs(amount))}
          >
            ยืนยันชำระ
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. Add Fixed Bill Modal
