import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function EditBudgetModal({ currentBudget, onSave, onClose }) {
  const [budget, setBudget] = useState(currentBudget || 45000);

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          ตั้งค่างบประมาณ / เงินเดือนรายเดือน
        </div>
        <div>
          <label style={labelStyle}>ยอดเงินรับประจำเดือน (บาท)</label>
          <input
            type="number"
            style={inputStyle}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={primaryBtnStyle} className="pressable" onClick={() => onSave(budget)}>
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

// 2. Add Bank Account Modal
