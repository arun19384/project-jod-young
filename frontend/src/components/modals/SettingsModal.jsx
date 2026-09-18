import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function SettingsModal({ transactions = [], onReset, onClose, onPinConfigChange }) {
  // PIN settings state
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('jod_pin_enabled') === 'true');
  const [pinInput, setPinInput] = useState(() => localStorage.getItem('jod_app_pin') || '');
  const [pinTimeout, setPinTimeout] = useState(() => localStorage.getItem('jod_pin_timeout') || '0');
  const [pinFeedback, setPinFeedback] = useState('');

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('ยังไม่มีประวัติการทำรายการสำหรับส่งออก');
      return;
    }
    const header = ['วันที่', 'เวลา/ระบุ', 'รายการ', 'หมวดหมู่', 'บัญชี', 'จำนวนเงิน (บาท)', 'ประเภท'];
    const rows = transactions.map((t) => [
      t.date || '',
      t.when || '',
      `"${(t.t || '').replace(/"/g, '""')}"`,
      `"${(t.c || '').replace(/"/g, '""')}"`,
      `"${(t.acct || '').replace(/"/g, '""')}"`,
      t.a || 0,
      t.income ? 'รายรับ' : 'รายจ่าย',
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jod-all-transactions-${todayDateInputValue()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTogglePin = (e) => {
    const enabled = e.target.checked;
    setPinEnabled(enabled);
    localStorage.setItem('jod_pin_enabled', String(enabled));
    if (enabled && !localStorage.getItem('jod_app_pin')) {
      localStorage.setItem('jod_app_pin', '1234');
      setPinInput('1234');
    }
    if (onPinConfigChange) onPinConfigChange();
  };

  const handleSavePin = () => {
    if (pinInput.length !== 4) {
      alert('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      return;
    }
    localStorage.setItem('jod_app_pin', pinInput);
    setPinFeedback('✓ บันทึกรหัส PIN ใหม่เรียบร้อย');
    setTimeout(() => setPinFeedback(''), 2500);
    if (onPinConfigChange) onPinConfigChange();
  };

  const handleTimeoutChange = (e) => {
    const val = e.target.value;
    setPinTimeout(val);
    localStorage.setItem('jod_pin_timeout', val);
    if (onPinConfigChange) onPinConfigChange();
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          การตั้งค่าและฐานข้อมูล
        </div>

        {/* CSV Data Export */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ font: "600 13.5px 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📥 ส่งออกข้อมูล (CSV / Excel)</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#8a8780', lineHeight: 1.4 }}>
            ดาวน์โหลดไฟล์ .csv ที่มี UTF-8 BOM เปิดกับ Microsoft Excel, Google Sheets ได้ทันทีโดยภาษาไทยไม่เพี้ยน
          </div>
          <button
            onClick={handleExportCSV}
            className="pressable"
            style={{
              background: '#3c3a35',
              border: '1px solid #4a4842',
              borderRadius: '10px',
              padding: '10px',
              color: '#d0cdc2',
              fontSize: '12.5px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📊 ดาวน์โหลด CSV ({transactions.length} รายการ)
          </button>
        </div>

        {/* PIN Security Section */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ font: "600 13.5px 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒 ล็อคแอปด้วยรหัส PIN</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={handleTogglePin}
                style={{ accentColor: '#d97757', width: '17px', height: '17px' }}
              />
            </label>
          </div>

          {pinEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <div>
                <label style={labelStyle}>รหัส PIN 4 หลัก</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="1234"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ ...inputStyle, letterSpacing: '6px', fontSize: '16px', textAlign: 'center', width: '110px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="pressable"
                    style={{
                      background: '#d97757',
                      color: '#1a1a18',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0 14px',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>ล็อคอัตโนมัติเมื่อออกจากแอป</label>
                <select
                  value={pinTimeout}
                  onChange={handleTimeoutChange}
                  style={{ ...inputStyle, cursor: 'pointer', fontSize: '12px' }}
                >
                  <option value="0">ทันทีที่สลับแอป (Instant)</option>
                  <option value="60">หลังจากไม่ได้ใช้งาน 1 นาที</option>
                  <option value="300">หลังจากไม่ได้ใช้งาน 5 นาที</option>
                </select>
              </div>

              {pinFeedback && (
                <div style={{ fontSize: '11.5px', color: '#6c9a76' }}>
                  {pinFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Slate & Reset Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="pressable"
            style={{
              background: '#2c2b28',
              border: '1px solid #d97757',
              color: '#d97757',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={async () => {
              try {
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
              } catch (e) {}
              window.location.replace(window.location.origin + '?reload=' + Date.now());
            }}
          >
            🔄 ล้างแคช & โหลดเวอร์ชันล่าสุด (Force Reload)
          </button>
          <button
            className="pressable"
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              color: '#d0cdc2',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onClick={() => onReset(true)}
          >
            🧹 ล้างข้อมูลเป็น 0 (เริ่มใช้งานจริงด้วยตัวเอง)
          </button>
          <button
            className="pressable"
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              color: '#8a8780',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={() => onReset(false)}
          >
            🔄 โหลดข้อมูลตัวอย่างต้นแบบกลับมา
          </button>
        </div>

        <button style={{ ...cancelBtnStyle, width: '100%', marginTop: '4px' }} className="pressable" onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}

// 9. Transfer Between Accounts Modal
