import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';

export function EditTransactionModal({
  tx,
  accounts = [],
  cards = [],
  onSave,
  onClose,
}) {
  if (!tx) return null;

  const [isIncome, setIsIncome] = useState(Boolean(tx.income));
  const [amount, setAmount] = useState(tx.a ? String(tx.a) : '');
  const [category, setCategory] = useState(tx.c || 'อื่นๆ');
  const [tint, setTint] = useState(tx.tint || '#8a8780');
  const [title, setTitle] = useState(tx.t || '');
  const [transactionDate, setTransactionDate] = useState(() => toDateInputValue(tx.date));
  const [account, setAccount] = useState(
    (tx.acct === 'บัญชีหลัก' || tx.acct === 'Main' || tx.acct === 'เงินสด/บัญชีหลัก' || !tx.acct)
      ? 'บัญชีใช้จ่าย'
      : tx.acct
  );
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);

  const PRESET_CATEGORIES = [
    { cat: 'อาหาร', tint: '#d97757', icon: '🍲' },
    { cat: 'ของใช้', tint: '#c9a227', icon: '🛒' },
    { cat: 'ชอปปิ้ง', tint: '#9b8ec4', icon: '🛍️' },
    { cat: 'เติมน้ำมัน', tint: '#7fa3c9', icon: '⛽' },
    { cat: 'รายรับ', tint: '#6c9a76', icon: '💰' },
    { cat: 'อื่นๆ', tint: '#8a8780', icon: '📝' },
  ];

  const handleSelectCat = (item) => {
    setCategory(item.cat);
    setTint(item.tint);
    if (item.cat === 'รายรับ') {
      setIsIncome(true);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
      return;
    }
    const finalTitle = title.trim() || category || 'ไม่ระบุ';
    const finalAccount =
      (!account.trim() || account.trim() === 'บัญชีหลัก' || account.trim() === 'Main')
        ? 'บัญชีใช้จ่าย'
        : account.trim();
    const fallbackNow = new Date();
    const fallbackTime = `${String(fallbackNow.getHours()).padStart(2, '0')}:${String(fallbackNow.getMinutes()).padStart(2, '0')} น.`;
    const existingTime = String(tx.when || '').match(/(\d{1,2}:\d{2}(?:\s*น\.)?)/)?.[1] || fallbackTime;
    const finalWhen = transactionDate === todayDateInputValue() ? `วันนี้ · ${existingTime}` : `${transactionDate} · ${existingTime}`;

    const ok = await onSave(tx.id, {
      t: finalTitle,
      c: category,
      tint: tint || '#8a8780',
      a: parsedAmt,
      acct: finalAccount,
      income: isIncome,
      date: transactionDate,
      when: finalWhen,
    });
    if (ok !== false) onClose();
  };

  // Combine accounts and cards for selection
  const allWalletOptions = [
    ...accounts.map((a) => ({
      id: a.id,
      name: (a.name === 'บัญชีหลัก' || a.name === 'Main' || a.name === 'เงินสด/บัญชีหลัก') ? 'บัญชีใช้จ่าย' : a.name,
      type: 'bank',
      tint: a.tint || '#6c9a76',
    })),
    ...cards.map((c) => ({ id: c.id, name: c.name, type: 'card', tint: c.tint || '#9b8ec4' })),
  ];
  if (!allWalletOptions.some((w) => w.name === 'บัญชีใช้จ่าย')) {
    allWalletOptions.unshift({ id: 'main', name: 'บัญชีใช้จ่าย', type: 'bank', tint: '#6c9a76' });
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            แก้ไขรายการธุรกรรม
          </div>
          <span style={{ fontSize: '12px', color: '#8a8780' }}>
            {tx.date || ''} {tx.when || ''}
          </span>
        </div>

        {/* Income / Expense Toggle */}
        <div style={{ display: 'flex', background: '#1c1b18', borderRadius: '12px', padding: '3px', gap: '3px' }}>
          <button
            type="button"
            className="pressable"
            onClick={() => {
              setIsIncome(false);
              if (category === 'รายรับ') {
                setCategory('อาหาร');
                setTint('#d97757');
              }
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              background: !isIncome ? '#d97757' : 'transparent',
              color: !isIncome ? '#1a1a18' : '#8a8780',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🔴</span> รายจ่าย
          </button>
          <button
            type="button"
            className="pressable"
            onClick={() => {
              setIsIncome(true);
              setCategory('รายรับ');
              setTint('#6c9a76');
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              background: isIncome ? '#6c9a76' : 'transparent',
              color: isIncome ? '#1a1a18' : '#8a8780',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🟢</span> รายรับ
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label style={labelStyle}>จำนวนเงิน (บาท) *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              step="any"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{
                ...inputStyle,
                fontSize: '24px',
                fontWeight: '700',
                padding: '12px 42px 12px 14px',
                color: isIncome ? '#6c9a76' : '#f0eee6',
                fontVariantNumeric: 'tabular-nums',
              }}
              autoFocus
            />
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8a8780',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              บ.
            </span>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div>
          <label style={labelStyle}>วันที่ทำรายการ</label>
          <input type="date" value={transactionDate} max={todayDateInputValue()} onChange={(e) => setTransactionDate(e.target.value)} style={inputStyle} />
        </div>

        {/* Category Selector Pills */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>หมวดหมู่: <b style={{ color: tint }}>{category}</b></label>
            <button
              type="button"
              onClick={() => setShowCustomCat(!showCustomCat)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7fa3c9',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              {showCustomCat ? 'เลือกจากรายการ' : '+ ระบุเอง'}
            </button>
          </div>

          {showCustomCat ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="พิมพ์ชื่อหมวดหมู่..."
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                className="pressable"
                onClick={() => {
                  if (customCatInput.trim()) {
                    setCategory(customCatInput.trim());
                    setShowCustomCat(false);
                  }
                }}
                style={{
                  ...primaryBtnStyle,
                  flex: 'none',
                  padding: '0 16px',
                  background: '#3c3a35',
                  color: '#f0eee6',
                }}
              >
                ตกลง
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_CATEGORIES.map((catItem) => {
                const isSelected = category === catItem.cat;
                return (
                  <button
                    key={catItem.cat}
                    type="button"
                    className="pressable"
                    onClick={() => handleSelectCat(catItem)}
                    style={{
                      border: isSelected ? `1.5px solid ${catItem.tint}` : '1px solid #3a3936',
                      background: isSelected ? `${catItem.tint}22` : '#302f2c',
                      color: isSelected ? catItem.tint : '#d0cdc2',
                      borderRadius: '99px',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: isSelected ? '600' : '400',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{catItem.icon}</span>
                    <span>{catItem.cat}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Title / Description Input */}
        <div>
          <label style={labelStyle}>ชื่อรายการ / โน้ต</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ข้าวหมูกรอบ, ชาบู, ซื้อของเข้าบ้าน"
            style={inputStyle}
          />
        </div>

        {/* Account / Wallet Selector */}
        <div>
          <label style={labelStyle}>บัญชี / บัตรเครดิต</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
            }}
          >
            <optgroup label="บัญชีเงินฝาก">
              {allWalletOptions
                .filter((w) => w.type === 'bank')
                .map((w) => (
                  <option key={w.id} value={w.name}>
                    💳 {w.name}
                  </option>
                ))}
            </optgroup>
            {allWalletOptions.some((w) => w.type === 'card') && (
              <optgroup label="บัตรเครดิต">
                {allWalletOptions
                  .filter((w) => w.type === 'card')
                  .map((w) => (
                    <option key={w.id} value={w.name}>
                      💳 {w.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="pressable"
            onClick={handleSubmit}
            style={{
              ...primaryBtnStyle,
              background: '#6c9a76',
              color: '#1a1a18',
            }}
          >
            ✓ บันทึกการแก้ไข
          </button>
          <button
            type="button"
            className="pressable"
            onClick={onClose}
            style={cancelBtnStyle}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. Settings & Clean Slate Modal
