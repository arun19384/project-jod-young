import React, { useState, useEffect } from 'react';
import { displayTransactionWhen, isSystemTransaction, toDateInputValue, todayDateInputValue } from '../../utils/transactionDate.js';
import { isAfterLatestCardCutoff } from '../../utils/cardCycle.js';

import { modalOverlayStyle, modalBoxStyle, inputStyle, labelStyle, primaryBtnStyle, cancelBtnStyle, SheetGrabber } from './shared.jsx';
import { ReceiptPreviewModal } from './ReceiptPreviewModal.jsx';

export function WalletTransactionsModal({
  wallet,
  transactions = [],
  onClose,
  onDeleteTransaction,
  onEditTransaction,
  onEditAccount,
  onOpenTransferModal,
  onOpenPayCard,
}) {
  if (!wallet) return null;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, OUT, IN
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const isCard = !!(wallet.isCard || wallet.cut || wallet.due || (wallet.role && wallet.role.includes('บัตร')));
  const walletName = (wallet.name === 'เงินสด/บัญชีหลัก' || wallet.name === 'Main' || wallet.name === 'บัญชีหลัก') ? 'บัญชีใช้จ่าย' : wallet.name;
  const normalizeWalletKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const targetName = normalizeWalletKey(walletName);
  const targetId = normalizeWalletKey(wallet.id);
  const cardMatchKeys = new Set(
    [targetName, targetId, targetId && `บัตร ${targetId}`, targetId && `บัตร${targetId}`]
      .filter(Boolean)
      .map(normalizeWalletKey)
  );
  const isCardSystemTx = (tx) => tx?.c === 'โอนเงิน' || tx?.c === 'ชำระบัตรเครดิต';

  // 1. Convert statement lines from credit card into transactions if available
  const cardLinesAsTxs = (isCard && Array.isArray(wallet.lines))
    ? wallet.lines.map((l, idx) => ({
        id: `card-stmt-${wallet.id || 'c'}-${idx}`,
        t: l.name,
        c: 'บัตรเครดิต',
        a: l.amt,
        acct: walletName,
        date: l.date || '',
        when: wallet.cut ? `รอบตัด ${wallet.cut}` : 'Statement บัตร',
        income: false,
        tint: l.bg || wallet.tint || '#9b8ec4',
        isStatementLine: true,
        mark: l.mark || '✓',
      }))
    : [];

  // 2. Filter transactions matching this wallet from app transactions
  const matchedAppTxs = transactions.filter((tx) => {
    if (!tx.acct) return false;
    const acct = normalizeWalletKey(tx.acct);
    if (isCard) {
      if (isCardSystemTx(tx)) return false;
      return cardMatchKeys.has(acct) && !isAfterLatestCardCutoff(tx, wallet.cut);
    }
    if (acct === targetName || acct === targetId) return true;
    if ((targetName === 'บัญชีใช้จ่าย' || targetName === 'บัญชีหลัก') && (acct === 'บัญชีใช้จ่าย' || acct === 'บัญชีหลัก' || acct === 'main' || acct === 'เงินสด/บัญชีหลัก')) return true;
    return false;
  });

  // 3. Combine without duplicates between statement lines and app txs
  const walletTxs = [...matchedAppTxs];
  cardLinesAsTxs.forEach((cline) => {
    const exists = matchedAppTxs.some(
      (tx) => tx.t && tx.t.trim().toLowerCase() === cline.t.trim().toLowerCase() && Math.abs(tx.a - cline.a) < 1
    );
    if (!exists) {
      walletTxs.push(cline);
    }
  });

  // 4. If card has an initial balance set during card creation that exceeds recorded transactions
  const recordedOut = walletTxs.filter((t) => !t.income && !isCardSystemTx(t)).reduce((sum, t) => sum + (t.a || 0), 0);
  const cardInitialAmt = Math.abs(wallet.amt ?? wallet.used ?? 0);
  const diff = cardInitialAmt - recordedOut;
  if (isCard && diff > 0.01) {
    walletTxs.push({
      id: `initial-card-${wallet.id || 'c'}`,
      t: 'ยอดยกมา / ยอดค้างชำระเริ่มต้นของบัตร',
      c: 'ยอดยกมา',
      a: Math.round(diff * 100) / 100,
      acct: walletName,
      date: wallet.due || 'รอบก่อนหน้า',
      when: 'ยอดยกมาก่อนเริ่มจด',
      income: false,
      tint: '#9b8ec4',
      isStatementLine: true,
      mark: '📌',
    });
  }

  // Stats calculation
  const totalIn = walletTxs.filter((t) => t.income).reduce((sum, t) => sum + (t.a || 0), 0);
  const totalOut = walletTxs.filter((t) => !t.income && !isCardSystemTx(t)).reduce((sum, t) => sum + (t.a || 0), 0);

  // Filtered by search & type
  const filtered = walletTxs.filter((tx) => {
    if (filterType === 'IN' && !tx.income) return false;
    if (filterType === 'OUT' && tx.income) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (tx.t && tx.t.toLowerCase().includes(q)) ||
      (tx.c && tx.c.toLowerCase().includes(q)) ||
      (tx.when && tx.when.toLowerCase().includes(q)) ||
      (tx.date && tx.date.toLowerCase().includes(q))
    );
  });

  const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
  const cardAmount = Math.abs(wallet.amt ?? wallet.used ?? 0);

  return (
    <div className="wallet-detail-overlay" style={modalOverlayStyle} onClick={onClose}>
      <div
        className="wallet-detail-modal animate-spring-sheet"
        style={{
          ...modalBoxStyle,
          maxWidth: '480px',
          maxHeight: 'min(82dvh, calc(100dvh - max(24px, env(safe-area-inset-top, 0px)) - max(24px, env(safe-area-inset-bottom, 0px))))',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="wallet-detail-header"
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #33322e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#232220',
            flex: 'none',
            minWidth: 0,
          }}
        >
          <button
            onClick={onClose}
            className="pressable"
            style={{
              background: '#353430',
              border: '1px solid #45433c',
              borderRadius: '10px',
              minWidth: '58px',
              height: '32px',
              color: '#f0eee6',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: 'none',
            }}
            title="กลับ"
          >
            ← กลับ
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isCard ? 'rgba(155,142,196,0.18)' : 'rgba(217,119,87,0.18)',
                border: `1px solid ${isCard ? '#9b8ec4' : (wallet.tint || '#d97757')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              {isCard ? '💳' : (walletName === 'บัญชีใช้จ่าย' || walletName === 'บัญชีหลัก' ? '💰' : '🏦')}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ font: "600 16px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {walletName}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: isCard ? 'rgba(155,142,196,0.18)' : 'rgba(217,119,87,0.15)',
                    color: isCard ? '#b8a9e6' : '#d97757',
                    fontWeight: '500',
                  }}
                >
                  {isCard ? 'บัตรเครดิต' : (wallet.role || 'บัญชีธนาคาร')}
                </span>
              </div>
              <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780', marginTop: '2px' }}>
                {isCard
                  ? `ตัดยอด ${wallet.cut || '-'} · ชำระภายใน ${wallet.due || '-'} ${wallet.status ? `(${wallet.status})` : ''}`
                  : (wallet.role || 'บัญชีเงินฝาก')}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="wallet-detail-close"
            style={{
              background: '#353430',
              border: 'none',
              borderRadius: '99px',
              width: '28px',
              height: '28px',
              color: '#a8a49a',
              cursor: 'pointer',
              fontSize: '13px',
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="wallet-detail-body" style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {/* Wallet / Credit Card Summary Card */}
          <div
            style={{
              background: 'linear-gradient(145deg, #2b2a27 0%, #1e1d1b 100%)',
              border: '1px solid #3d3b36',
              borderRadius: '16px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: wallet.tint || (isCard ? '#9b8ec4' : '#d97757') }} />

            <div className="wallet-detail-summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ font: "400 11.5px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                  {isCard ? 'ยอดค้างชำระปัจจุบัน' : 'ยอดเงินคงเหลือในบัญชี'}
                </span>
                <div style={{ font: "600 28px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                  {isCard ? fmt(cardAmount) : fmt(wallet.amt)} <span style={{ fontSize: '14px', fontWeight: '400', color: '#78756e' }}>บาท</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="wallet-detail-actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isCard && onOpenPayCard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPayCard({ ...wallet, amt: cardAmount });
                    }}
                    className="pressable"
                    style={{
                      background: 'rgba(108,154,118,0.18)',
                      border: '1px solid rgba(108,154,118,0.35)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      color: '#6c9a76',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="บันทึกชำระยอดบัตรนี้"
                  >
                    💳 ชำระยอดบัตร
                  </button>
                )}
                {!isCard && onEditAccount && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditAccount(wallet);
                    }}
                    className="pressable"
                    style={{
                      background: 'rgba(217,119,87,0.15)',
                      border: '1px solid rgba(217,119,87,0.35)',
                      borderRadius: '8px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      color: '#d97757',
                      cursor: 'pointer',
                    }}
                    title="แก้ไขยอดเงิน"
                  >
                    ✎ ปรับยอด
                  </button>
                )}
                {!isCard && onOpenTransferModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTransferModal();
                    }}
                    className="pressable"
                    style={{
                      background: '#353430',
                      border: '1px solid #45433c',
                      borderRadius: '8px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      color: '#d0cdc2',
                      cursor: 'pointer',
                    }}
                    title="โอนเงินไปบัญชีอื่น"
                  >
                    🔁 โอน
                  </button>
                )}
              </div>
            </div>

            {/* Credit Card Progress Bar */}
            {isCard && wallet.pct !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ height: '5px', borderRadius: '99px', background: '#383630', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '99px',
                      background: wallet.tint || '#d97757',
                      width: `${wallet.pct}%`,
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#8a8780' }}>
                  <span>ใช้วงเงินไปแล้ว {wallet.pct}%</span>
                  <span>{wallet.due ? `ครบกำหนดชำระ ${wallet.due}` : ''}</span>
                </div>
              </div>
            )}

            {/* Income & Expense Breakdown for this Wallet */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid #383733',
              }}
            >
              {isCard ? (
                <>
                  <div style={{ background: '#252422', padding: '8px 10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '10.5px', color: '#d97757' }}>💳 รูดที่พบในประวัติ</span>
                    <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#d97757', marginTop: '2px' }}>
                      -{fmt(totalOut)} บ.
                    </div>
                  </div>
                  <div style={{ background: '#252422', padding: '8px 10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '10.5px', color: '#a8a49a' }}>🧾 รายการทั้งหมด</span>
                    <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#f0eee6', marginTop: '2px' }}>
                      {walletTxs.length} รายการ
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: '#252422', padding: '8px 10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '10.5px', color: '#6c9a76' }}>⬇ เงินเข้าทั้งหมด</span>
                    <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#6c9a76', marginTop: '2px' }}>
                      +{fmt(totalIn)} บ.
                    </div>
                  </div>
                  <div style={{ background: '#252422', padding: '8px 10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '10.5px', color: '#d97757' }}>⬆ เงินออกทั้งหมด</span>
                    <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#d97757', marginTop: '2px' }}>
                      -{fmt(totalOut)} บ.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="wallet-detail-filter" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`🔍 ค้นหารายการใน${isCard ? 'บัตรนี้' : 'บัญชีนี้'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                padding: '8px 12px',
                fontSize: '12.5px',
                borderRadius: '10px',
              }}
            />
            <div style={{ display: 'flex', gap: '4px', flex: 'none' }}>
              <button
                onClick={() => setFilterType('ALL')}
                style={{
                  background: filterType === 'ALL' ? '#3e3d38' : '#2b2a27',
                  border: `1px solid ${filterType === 'ALL' ? '#d97757' : '#383733'}`,
                  color: filterType === 'ALL' ? '#f0eee6' : '#8a8780',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType('OUT')}
                style={{
                  background: filterType === 'OUT' ? 'rgba(217,119,87,0.2)' : '#2b2a27',
                  border: `1px solid ${filterType === 'OUT' ? '#d97757' : '#383733'}`,
                  color: filterType === 'OUT' ? '#d97757' : '#8a8780',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {isCard ? 'รูดใช้' : 'จ่าย'}
              </button>
              {!isCard && (
                <button
                  onClick={() => setFilterType('IN')}
                  style={{
                    background: filterType === 'IN' ? 'rgba(108,154,118,0.2)' : '#2b2a27',
                    border: `1px solid ${filterType === 'IN' ? '#6c9a76' : '#383733'}`,
                    color: filterType === 'IN' ? '#6c9a76' : '#8a8780',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  รับ
                </button>
              )}
            </div>
          </div>

          {/* Transactions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: "600 12.5px 'IBM Plex Sans Thai'", color: '#a8a49a' }}>
                {isCard ? 'รายการรูด / ประวัติการใช้บัตร' : 'ประวัติรายการธุรกรรม'} ({filtered.length} รายการ)
              </span>
              {search && (
                <span style={{ fontSize: '11px', color: '#78756e' }}>
                  ค้นหา "{search}"
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: '#232220',
                  borderRadius: '12px',
                  border: '1px dashed #3a3936',
                  color: '#78756e',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '24px' }}>{isCard ? '💳' : '📝'}</span>
                <div>{search ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : `ยังไม่มีประวัติรายการใน${isCard ? 'บัตรนี้' : 'บัญชีนี้'}`}</div>
                <div style={{ fontSize: '11px', color: '#5a5852' }}>
                  เมื่อเพิ่มรายการในหน้าบันทึก โดยระบุตัดบัญชี {walletName} รายการจะปรากฏที่นี่
                </div>
              </div>
            ) : (
              filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="pressable animate-fadein"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#272624',
                    border: '1px solid #353430',
                    borderRadius: '12px',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: `${tx.tint || '#d97757'}22`,
                        color: tx.tint || '#d97757',
                        fontSize: '11px',
                        fontWeight: '500',
                        flex: 'none',
                      }}
                    >
                      {tx.c || (isCard ? 'บัตรเครดิต' : 'ทั่วไป')}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          font: "500 13px 'IBM Plex Sans Thai'",
                          color: '#f0eee6',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tx.t}
                      </div>
                      <div style={{ font: "400 11px 'IBM Plex Sans Thai'", color: '#78756e', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{displayTransactionWhen(tx)}</span>
                        {tx.isStatementLine && (
                          <span style={{ fontSize: '9.5px', color: '#9b8ec4', background: 'rgba(155,142,196,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                            📋 Statement บัตร
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
                    {tx.receipt && (
                      <button
                        onClick={() => setPreviewReceipt(tx.receipt)}
                        className="pressable"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px',
                        }}
                        title="ดูสลิป/ใบเสร็จ"
                      >
                        🧾
                      </button>
                    )}
                    <span
                      style={{
                        font: "600 13.5px 'IBM Plex Sans Thai'",
                        color: tx.income ? '#6c9a76' : '#f0eee6',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {tx.income ? '+' : '-'}{fmt(tx.a)} บ.
                    </span>
                    {onEditTransaction && !tx.isStatementLine && !isSystemTransaction(tx) && (
                      <button
                        onClick={() => onEditTransaction(tx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#5a5852',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '2px 4px',
                        }}
                        title="แก้ไขรายการนี้ (แก้ตัวเลข/หมวดหมู่)"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#7fa3c9')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#5a5852')}
                      >
                        ✎
                      </button>
                    )}
                    {onDeleteTransaction && !tx.isStatementLine && !isSystemTransaction(tx) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`ต้องการลบรายการ "${tx.t}" หรือไม่?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#5a5852',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px',
                        }}
                        title="ลบรายการนี้"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#d97757')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#5a5852')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #33322e',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#232220',
            flex: 'none',
          }}
        >
          <button style={{ ...cancelBtnStyle, padding: '8px 18px' }} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>

      {previewReceipt && (
        <ReceiptPreviewModal src={previewReceipt} onClose={() => setPreviewReceipt(null)} />
      )}
    </div>
  );
}
