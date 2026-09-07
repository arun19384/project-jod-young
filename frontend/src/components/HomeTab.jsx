import React, { useState } from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export default function HomeTab({
  summary,
  accountsData,
  transactions = [],
  onToggleDebt,
  onDeleteDebt,
  onOpenAddDebt,
  onOpenEditBudget,
  onDeleteTransaction,
  onSelectTab,
}) {
  if (!summary) {
    return (
      <div style={{ padding: '40px 22px', textAlign: 'center', color: '#8a8780' }}>
        กำลังโหลดข้อมูลสรุป...
      </div>
    );
  }

  const income = summary.income || 45000;
  const spent = summary.spent || 0;
  const left = summary.left || 0;
  const spentPct = summary.spentPct || 0;
  const fixedTotal = summary.fixedTotal || 0;
  const fixedDone = summary.fixedDone || 0;
  const fixedTotalCount = summary.fixedTotalCount || 0;
  const planMonthly = summary.planMonthly || 0;
  const planCount = summary.planCount || 0;
  const dues = summary.dues || [];
  const debts = summary.debts || [];
  const debtTotal = summary.debtTotal || 0;
  const recent = summary.recent || [];

  // Wallets data
  const accounts = accountsData?.accounts || [];
  const cards = accountsData?.cards || [];
  const allWallets = [
    ...accounts.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role || 'เงินเดือน/ใช้จ่าย',
      amt: a.amt || 0,
      tint: a.tint || '#6c9a76',
      isCard: false,
    })),
    ...cards.map((c) => ({
      id: c.id,
      name: c.name,
      role: `วงเงินเหลือ ${fmt((c.limit || 0) - (c.used || 0))}`,
      amt: -(c.used || 0),
      tint: c.tint || '#9b8ec4',
      isCard: true,
    })),
  ];

  // Selected wallets filter state (stored in localStorage)
  const [selectedWallets, setSelectedWallets] = useState(() => {
    try {
      const saved = localStorage.getItem('jod_default_wallets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Ignore parse error
    }
    return ['ALL'];
  });

  const [isMultiMode, setIsMultiMode] = useState(false);
  const [defaultSavedFeedback, setDefaultSavedFeedback] = useState(false);

  // Check if current selection is the saved default
  const isCurrentDefault = (() => {
    try {
      const saved = localStorage.getItem('jod_default_wallets');
      if (!saved) {
        return selectedWallets.length === 1 && selectedWallets[0] === 'ALL';
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (parsed.length !== selectedWallets.length) return false;
        return parsed.every((id) => selectedWallets.includes(id));
      }
    } catch (e) {
      // Ignore
    }
    return false;
  })();

  const handleSaveDefault = () => {
    try {
      localStorage.setItem('jod_default_wallets', JSON.stringify(selectedWallets));
      setDefaultSavedFeedback(true);
      setTimeout(() => setDefaultSavedFeedback(false), 2200);
    } catch (e) {
      console.error('Failed to save default wallets:', e);
    }
  };

  const handleToggleWallet = (walletId) => {
    if (walletId === 'ALL') {
      setSelectedWallets(['ALL']);
      return;
    }

    if (!isMultiMode) {
      // Single select mode
      if (selectedWallets.length === 1 && selectedWallets[0] === walletId) {
        // Toggle to ALL if tapping the already selected single wallet
        setSelectedWallets(['ALL']);
      } else {
        setSelectedWallets([walletId]);
      }
    } else {
      // Multi-select mode
      if (selectedWallets.includes('ALL')) {
        setSelectedWallets([walletId]);
      } else {
        if (selectedWallets.includes(walletId)) {
          const next = selectedWallets.filter((x) => x !== walletId);
          setSelectedWallets(next.length > 0 ? next : ['ALL']);
        } else {
          const next = [...selectedWallets, walletId];
          // If all individual wallets are selected, condense to ALL
          if (next.length >= allWallets.length) {
            setSelectedWallets(['ALL']);
          } else {
            setSelectedWallets(next);
          }
        }
      }
    }
  };

  // Filtered wallet lists and totals
  const isAllSelected = selectedWallets.includes('ALL');
  const visibleWallets = isAllSelected
    ? allWallets
    : allWallets.filter((w) => selectedWallets.includes(w.id));

  const selectedTotalAmt = visibleWallets
    .filter((w) => !w.isCard)
    .reduce((sum, w) => sum + (w.amt || 0), 0);

  // Filter recent transactions
  const selectedIdentifiers = new Set();
  selectedWallets.forEach((sw) => {
    if (sw === 'ALL') return;
    selectedIdentifiers.add(sw);
    const matched = allWallets.find((w) => w.id === sw);
    if (matched) {
      selectedIdentifiers.add(matched.name);
    }
  });

  const filteredRecent = isAllSelected
    ? recent
    : recent.filter((tx) => {
        if (!tx.acct) return false;
        return selectedIdentifiers.has(tx.acct);
      });

  return (
    <div className="animate-fadein" style={{ padding: '6px 20px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Month Header with App Logo & Welcome */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <img
            src="/app-logo.png"
            alt="จดเงิน"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              border: '1.5px solid #3a3936',
              objectFit: 'cover',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ font: "600 16px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>กันยายน</div>
            <div style={{ font: "400 11px/1.2 'IBM Plex Sans Thai'", color: '#8a8780' }}>
              วันที่ 7 · เหลือ 23 วัน
            </div>
          </div>
        </div>
        <div
          style={{
            font: "500 11.5px/1.4 'IBM Plex Mono', monospace",
            color: '#8a8780',
            background: '#2c2b28',
            padding: '5px 9px',
            borderRadius: '8px',
            border: '1px solid #37362f',
          }}
        >
          7 / 30
        </div>
      </div>

      {/* Remaining Budget & Bar (Click to edit budget) */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer' }}
        onClick={onOpenEditBudget}
        title="แตะเพื่อแก้ไขงบประมาณ/เงินเดือน"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ font: "400 12px/1.4 'IBM Plex Sans Thai'", color: '#8a8780' }}>เหลือใช้ (แตะเพื่อตั้งงบ)</span>
            <span style={{ fontSize: '10px', color: '#d97757' }}>✎ แก้ไข</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
            <div style={{ font: "600 46px/1 'IBM Plex Sans Thai'", color: '#f0eee6', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(left)}
            </div>
            <div style={{ font: "400 15px/1 'IBM Plex Sans Thai'", color: '#78756e' }}>บาท</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '8px', borderRadius: '99px', background: '#33322f', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                height: '100%',
                background: '#d97757',
                borderRadius: '99px',
                transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                width: `${spentPct}%`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 12px/1.4 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            <span>
              ใช้ไป <span style={{ color: '#d0cdc2', fontVariantNumeric: 'tabular-nums' }}>{fmt(spent)}</span>
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>รับ {fmt(income)}</span>
          </div>
        </div>
      </div>

      {/* Wallet Selector & Balance View */}
      <div
        style={{
          background: '#2c2b28',
          border: '1px solid #383733',
          borderRadius: '18px',
          padding: '14px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Wallet Section Header & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ font: "600 13.5px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>กระเป๋าเงิน</span>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                borderRadius: '99px',
                background: isAllSelected ? 'rgba(217,119,87,0.18)' : '#383733',
                color: isAllSelected ? '#d97757' : '#d0cdc2',
                border: `1px solid ${isAllSelected ? 'rgba(217,119,87,0.3)' : '#44423c'}`,
              }}
            >
              {isAllSelected ? 'แสดงทั้งหมด' : `เลือก ${selectedWallets.length} บัญชี`}
            </span>
            {isCurrentDefault && (
              <span style={{ fontSize: '10px', color: '#c9a227' }} title="นี่คือตัวเลือกเริ่มต้นของคุณ">
                ★ Default
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Multi-Select Toggle Button */}
            <button
              onClick={() => setIsMultiMode(!isMultiMode)}
              style={{
                background: isMultiMode ? 'rgba(217,119,87,0.2)' : 'transparent',
                border: `1px solid ${isMultiMode ? '#d97757' : '#45433c'}`,
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '11px',
                color: isMultiMode ? '#d97757' : '#a8a49a',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isMultiMode ? 'โหมดเลือกได้หลายอัน (เปิดอยู่)' : 'เปิดโหมดเลือกได้หลายบัญชี'}
            >
              {isMultiMode ? '✓ หลายบัญชี' : 'แตะเดี่ยว'}
            </button>

            {/* Set as Default Button */}
            <button
              onClick={handleSaveDefault}
              style={{
                background: defaultSavedFeedback ? 'rgba(108,154,118,0.2)' : '#33322e',
                border: `1px solid ${defaultSavedFeedback ? '#6c9a76' : '#45433c'}`,
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '11px',
                color: defaultSavedFeedback ? '#6c9a76' : '#d0cdc2',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="บันทึกตัวเลือกนี้เป็นค่าเริ่มต้นเมื่อเปิดแอป"
            >
              {defaultSavedFeedback ? '✓ บันทึกแล้ว' : '⭐ ตั้งเป็น Default'}
            </button>
          </div>
        </div>

        {/* Filter Pills (All + Individual Wallets) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            overflowX: 'auto',
            paddingBottom: '2px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Select All Button */}
          <button
            onClick={() => handleToggleWallet('ALL')}
            style={{
              flex: 'none',
              border: `1px solid ${isAllSelected ? '#d97757' : '#3f3d38'}`,
              background: isAllSelected ? 'rgba(217,119,87,0.18)' : '#232220',
              color: isAllSelected ? '#f0eee6' : '#8a8780',
              fontWeight: isAllSelected ? '600' : '400',
              borderRadius: '99px',
              padding: '6px 12px',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
          >
            {isAllSelected && <span style={{ color: '#d97757' }}>✓</span>}
            ทั้งหมด
          </button>

          {/* Individual Wallet Pills */}
          {allWallets.map((w) => {
            const isSelected = !isAllSelected && selectedWallets.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => handleToggleWallet(w.id)}
                style={{
                  flex: 'none',
                  border: `1px solid ${isSelected ? '#d97757' : '#3f3d38'}`,
                  background: isSelected ? 'rgba(217,119,87,0.18)' : '#232220',
                  color: isSelected ? '#f0eee6' : '#a8a49a',
                  fontWeight: isSelected ? '600' : '400',
                  borderRadius: '99px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: w.tint || '#d97757',
                  }}
                />
                <span>{w.name}</span>
                {isSelected && <span style={{ color: '#d97757', fontSize: '11px' }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Selected Wallets Detail View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
          {/* Combined balance header for selected wallets */}
          {!isAllSelected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '4px 2px 2px',
                borderBottom: '1px solid #37362f',
              }}
            >
              <span style={{ fontSize: '11.5px', color: '#8a8780' }}>
                ยอดคงเหลือรวม ({visibleWallets.length} บัญชีที่เลือก):
              </span>
              <span style={{ font: "600 15px/1 'IBM Plex Sans Thai'", color: '#6c9a76', fontVariantNumeric: 'tabular-nums' }}>
                ฿{fmt(selectedTotalAmt)}
              </span>
            </div>
          )}

          {/* Cards for the selected wallets */}
          <div style={{ display: 'grid', gridTemplateColumns: visibleWallets.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
            {visibleWallets.slice(0, 4).map((w) => (
              <div
                key={w.id}
                onClick={() => onSelectTab && onSelectTab('bank')}
                style={{
                  background: '#242321',
                  border: '1px solid #373630',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: w.tint || '#d97757' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span
                    style={{
                      font: "500 12px/1.3 'IBM Plex Sans Thai'",
                      color: '#f0eee6',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.name}
                  </span>
                  {w.isCard && (
                    <span style={{ fontSize: '9px', color: '#9b8ec4', background: 'rgba(155,142,196,0.15)', padding: '1px 4px', borderRadius: '4px' }}>
                      บัตร
                    </span>
                  )}
                </div>
                <div style={{ font: "600 15px/1.2 'IBM Plex Sans Thai'", color: w.amt < 0 ? '#d97757' : '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                  {w.isCard ? `ใช้ไป ${fmt(Math.abs(w.amt))}` : fmt(w.amt)}
                  <span style={{ fontSize: '10px', color: '#78756e', marginLeft: '3px' }}>฿</span>
                </div>
                <div style={{ font: "400 10.5px/1.2 'IBM Plex Sans Thai'", color: '#78756e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.role}
                </div>
              </div>
            ))}
          </div>

          {visibleWallets.length > 4 && (
            <button
              onClick={() => onSelectTab && onSelectTab('bank')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8a8780',
                fontSize: '11px',
                textAlign: 'center',
                padding: '4px',
                cursor: 'pointer',
              }}
            >
              ดูบัญชีทั้งหมด ({visibleWallets.length} บัญชี) →
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Cards (Fixed & Installments) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div
          onClick={() => onSelectTab && onSelectTab('bank')}
          style={{
            background: '#302f2c',
            border: '1px solid #3a3936',
            borderRadius: '16px',
            padding: '14px 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6c6a62')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3a3936')}
        >
          <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>คงที่ทุกเดือน</div>
          <div style={{ font: "600 20px/1 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(fixedTotal)}
          </div>
          <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>
            ตัดแล้ว {fixedDone} / {fixedTotalCount}
          </div>
        </div>

        <div
          onClick={() => onSelectTab && onSelectTab('plan')}
          style={{
            background: '#302f2c',
            border: '1px solid #3a3936',
            borderRadius: '16px',
            padding: '14px 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6c6a62')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3a3936')}
        >
          <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>ผ่อนเดือนนี้</div>
          <div style={{ font: "600 20px/1 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(planMonthly)}
          </div>
          <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>{planCount} รายการ</div>
        </div>
      </div>

      {/* Upcoming Dues */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780', letterSpacing: '0.02em' }}>
          ใกล้ครบกำหนด
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dues.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#78756e', fontSize: '12px' }}>
              ไม่มีรายการที่ต้องจ่ายในเร็วๆ นี้
            </div>
          ) : (
            dues.map((d, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#2c2b28',
                  border: '1px solid #37362f',
                  borderRadius: '14px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ width: '38px', flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                  <div style={{ font: "600 16px/1 'IBM Plex Sans Thai'", color: d.tint || '#d97757', fontVariantNumeric: 'tabular-nums' }}>
                    {d.day}
                  </div>
                  <div style={{ font: "400 9.5px/1 'IBM Plex Mono', monospace", color: '#78756e', textTransform: 'uppercase' }}>
                    ก.ย.
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ font: "500 13.5px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>{d.name}</div>
                  <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>{d.note}</div>
                </div>
                <div style={{ font: "500 14px/1 'IBM Plex Sans Thai'", color: '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(d.amt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debts / Lent Money */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            ติดเงินอยู่ · <span style={{ color: '#d97757' }}>{fmt(debtTotal)} บาท</span>
          </div>
          <button
            onClick={onOpenAddDebt}
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              borderRadius: '8px',
              padding: '3px 8px',
              fontSize: '11px',
              color: '#d0cdc2',
              cursor: 'pointer',
            }}
          >
            + เพิ่มคนติดเงิน
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {debts.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#78756e', fontSize: '12px' }}>
              ไม่มีคนติดเงิน
            </div>
          ) : (
            debts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#2c2b28',
                  border: '1px solid #37362f',
                  borderRadius: '14px',
                  padding: '11px 12px 11px 14px',
                  opacity: p.cleared ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    flex: 'none',
                    borderRadius: '99px',
                    background: '#3c3a35',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: "500 12px/1 'IBM Plex Sans Thai'",
                    color: '#d0cdc2',
                  }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ font: "500 13.5px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>{p.name}</div>
                  <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>{p.what}</div>
                </div>
                <div style={{ font: "500 14px/1 'IBM Plex Sans Thai'", color: '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(p.a)}
                </div>
                <button
                  onClick={() => onToggleDebt && onToggleDebt(p.id)}
                  style={{
                    border: '1px solid #45433c',
                    background: 'transparent',
                    color: p.cleared ? '#78756e' : '#a8a49a',
                    font: "500 11.5px/1 'IBM Plex Sans Thai'",
                    padding: '7px 10px',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.cleared ? 'คืนแล้ว' : 'เคลียร์'}
                </button>
                {onDeleteDebt && (
                  <button
                    onClick={() => onDeleteDebt(p.id)}
                    title="ลบรายการ"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#78756e',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Transactions (Filtered by Selected Wallet) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            รายการล่าสุด ·{' '}
            <span style={{ color: '#d97757' }}>
              {isAllSelected
                ? 'ทุกกระเป๋า'
                : selectedWallets.length === 1
                ? allWallets.find((w) => w.id === selectedWallets[0])?.name || selectedWallets[0]
                : `${selectedWallets.length} กระเป๋า`}
            </span>{' '}
            <span style={{ color: '#78756e' }}>({filteredRecent.length} รายการ)</span>
          </div>
          {!isAllSelected && (
            <button
              onClick={() => setSelectedWallets(['ALL'])}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#d97757',
                fontSize: '11.5px',
                cursor: 'pointer',
                padding: '2px 4px',
                textDecoration: 'underline',
              }}
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredRecent.length === 0 ? (
            <div style={{ padding: '18px 12px', textAlign: 'center', color: '#78756e', fontSize: '12.5px', background: '#242321', borderRadius: '12px', border: '1px dashed #373630' }}>
              {isAllSelected
                ? 'ยังไม่มีรายการธุรกรรม'
                : 'ไม่มีรายการธุรกรรมในกระเป๋าเงินที่เลือก'}
            </div>
          ) : (
            filteredRecent.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 2px',
                  borderBottom: '1px solid #2f2e2b',
                }}
              >
                <div style={{ width: '7px', height: '7px', flex: 'none', borderRadius: '99px', background: e.tint || '#8a8780' }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div
                    style={{
                      font: "400 13.5px/1.3 'IBM Plex Sans Thai'",
                      color: '#e8e5da',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.t}
                  </div>
                  <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>
                    {e.c} · {e.acct} · {e.when}
                  </div>
                </div>
                <div
                  style={{
                    font: "500 13.5px/1 'IBM Plex Sans Thai'",
                    color: e.income ? '#6c9a76' : '#e8e5da',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {e.income ? '+' : '−'}{fmt(e.a)}
                </div>
                {onDeleteTransaction && (
                  <button
                    onClick={() => onDeleteTransaction(e.id)}
                    title="ลบรายการนี้ (คืนยอดเงินกลับบัญชี)"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#5a5852',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '2px 6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d97757')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5a5852')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
