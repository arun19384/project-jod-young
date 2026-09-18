import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function TransferModal({ accounts = [], onTransfer, onClose }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const fromAcc = accounts.find((a) => a.id === fromId);
  const toAcc = accounts.find((a) => a.id === toId);

  const numAmount = parseFloat(amount) || 0;
  const fromBalanceAfter = fromAcc ? fromAcc.amt - numAmount : 0;
  const toBalanceAfter = toAcc ? toAcc.amt + numAmount : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromId || !toId) {
      setErr('กรุณาเลือกบัญชีต้นทางและปลายทาง');
      return;
    }
    if (fromId === toId) {
      setErr('บัญชีต้นทางและปลายทางต้องไม่เป็นบัญชีเดียวกัน');
      return;
    }
    if (numAmount <= 0) {
      setErr('กรุณาระบุจำนวนเงินที่ต้องการโอน');
      return;
    }
    if (fromAcc && fromAcc.amt < numAmount) {
      setErr(`ยอดเงินใน ${fromAcc.name} ไม่เพียงพอ (มีอยู่ ${Math.round(fromAcc.amt).toLocaleString()} บาท)`);
      return;
    }
    setErr('');
    onTransfer({ fromId, toId, amount: numAmount, note });
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔁 โอนเงินระหว่างบัญชี</span>
        </div>

        {/* From Account */}
        <div>
          <label style={labelStyle}>จากบัญชี (ต้นทาง)</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({Math.round(a.amt || 0).toLocaleString()} บ.)
              </option>
            ))}
          </select>
        </div>

        {/* To Account */}
        <div>
          <label style={labelStyle}>ไปยังบัญชี (ปลายทาง)</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === fromId}>
                {a.name} ({Math.round(a.amt || 0).toLocaleString()} บ.)
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input & Fast Presets */}
        <div>
          <label style={labelStyle}>จำนวนเงินที่โอน (บาท)</label>
          <input
            type="number"
            step="any"
            placeholder="0"
            style={{ ...inputStyle, fontSize: '18px', fontWeight: '600' }}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErr('');
            }}
            required
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {[100, 500, 1000].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(String((parseFloat(amount) || 0) + p))}
                style={{
                  flex: 1,
                  background: '#302f2c',
                  border: '1px solid #3e3d39',
                  color: '#d0cdc2',
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  padding: '6px 0',
                  cursor: 'pointer',
                }}
              >
                +{p}
              </button>
            ))}
            {fromAcc && fromAcc.amt > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(fromAcc.amt))}
                style={{
                  flex: 1,
                  background: 'rgba(217, 119, 87, 0.15)',
                  border: '1px solid rgba(217, 119, 87, 0.3)',
                  color: '#d97757',
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  padding: '6px 0',
                  cursor: 'pointer',
                }}
              >
                ทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Live Balance Preview */}
        {numAmount > 0 && fromAcc && toAcc && fromId !== toId && (
          <div style={{ background: '#201f1d', border: '1px solid #33322e', borderRadius: '12px', padding: '10px 12px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#8a8780' }}>
              • {fromAcc.name}: <span style={{ color: fromBalanceAfter < 0 ? '#d97757' : '#f0eee6' }}>{Math.round(fromBalanceAfter).toLocaleString()} บ.</span>
            </div>
            <div style={{ color: '#8a8780' }}>
              • {toAcc.name}: <span style={{ color: '#6c9a76' }}>{Math.round(toBalanceAfter).toLocaleString()} บ.</span>
            </div>
          </div>
        )}

        {/* Note / Memo */}
        <div>
          <label style={labelStyle}>บันทึกช่วยจำ (ไม่บังคับ)</label>
          <input
            type="text"
            placeholder="เช่น ย้ายเงินออม, ค่าขนม"
            style={inputStyle}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err && <div style={{ color: '#d97757', fontSize: '12px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button type="button" style={cancelBtnStyle} onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" style={primaryBtnStyle}>
            ยืนยันการโอนเงิน
          </button>
        </div>
      </form>
    </div>
  );
}

// 10. Receipt Image Preview Modal
