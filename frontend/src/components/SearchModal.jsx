import React, { useState, useMemo } from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export default function SearchModal({
  transactions = [],
  accounts = [],
  onDeleteTransaction,
  onViewReceipt,
  onClose,
}) {
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL', 'EXPENSE', 'INCOME'
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedAccount, setSelectedAccount] = useState('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      if (t.c) set.add(t.c);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return transactions.filter((t) => {
      // Type match
      if (selectedType === 'EXPENSE' && t.income) return false;
      if (selectedType === 'INCOME' && !t.income) return false;

      // Category match
      if (selectedCat !== 'ALL' && t.c !== selectedCat) return false;

      // Account match
      if (selectedAccount !== 'ALL' && t.acct !== selectedAccount) return false;

      // Keyword match
      if (q) {
        const titleMatch = (t.t || '').toLowerCase().includes(q);
        const catMatch = (t.c || '').toLowerCase().includes(q);
        const acctMatch = (t.acct || '').toLowerCase().includes(q);
        const amountMatch = String(t.a || '').includes(q);
        if (!titleMatch && !catMatch && !acctMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, keyword, selectedType, selectedCat, selectedAccount]);

  // Total summary of filtered results
  const totalAmount = useMemo(() => {
    return filtered.reduce((acc, t) => acc + (t.income ? (t.a || 0) : -(t.a || 0)), 0);
  }, [filtered]);

  // CSV Export helper
  const handleExportFilteredCSV = () => {
    if (filtered.length === 0) return;
    const header = ['วันที่', 'เวลา/ระบุ', 'รายการ', 'หมวดหมู่', 'บัญชี', 'จำนวนเงิน (บาท)', 'ประเภท'];
    const rows = filtered.map((t) => [
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
    link.setAttribute('download', `jod-search-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '16px 12px 24px',
      }}
    >
      <div
        className="animate-spring-sheet"
        style={{
          background: '#262624',
          border: '1px solid #3a3936',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid #33322e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔍 ค้นหา & ตัวกรองประวัติ</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#353430',
              border: 'none',
              borderRadius: '99px',
              width: '28px',
              height: '28px',
              color: '#a8a49a',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Input & Filter Chips */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid #302f2c' }}>
          {/* Text Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              placeholder="พิมพ์ชื่อรายการ, บัญชี, หรือจำนวนเงิน..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                width: '100%',
                background: '#302f2c',
                border: '1px solid #45433c',
                borderRadius: '12px',
                padding: '11px 36px 11px 14px',
                color: '#f0eee6',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#8a8780',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'EXPENSE', label: '💸 รายจ่าย' },
              { id: 'INCOME', label: '💰 รายรับ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className="pressable"
                style={{
                  flex: 1,
                  background: selectedType === tab.id ? 'rgba(217,119,87,0.18)' : '#302f2c',
                  border: `1px solid ${selectedType === tab.id ? '#d97757' : '#3d3c38'}`,
                  borderRadius: '8px',
                  color: selectedType === tab.id ? '#d97757' : '#8a8780',
                  fontSize: '11.5px',
                  fontWeight: '500',
                  padding: '6px 4px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Horizontal Chips */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => setSelectedCat('ALL')}
              style={{
                flex: 'none',
                background: selectedCat === 'ALL' ? '#d97757' : '#302f2c',
                border: 'none',
                borderRadius: '99px',
                color: selectedCat === 'ALL' ? '#1a1a18' : '#a8a49a',
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              ทุกหมวด
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCat(c)}
                style={{
                  flex: 'none',
                  background: selectedCat === c ? '#d97757' : '#302f2c',
                  border: 'none',
                  borderRadius: '99px',
                  color: selectedCat === c ? '#1a1a18' : '#a8a49a',
                  fontSize: '11px',
                  fontWeight: selectedCat === c ? '600' : '400',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info & CSV Export Button */}
        <div
          style={{
            padding: '8px 18px',
            background: '#22211f',
            borderBottom: '1px solid #302f2c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
          }}
        >
          <span style={{ color: '#8a8780' }}>
            พบ <b style={{ color: '#d97757' }}>{filtered.length}</b> รายการ · ยอดสุทธิ{' '}
            <b style={{ color: totalAmount >= 0 ? '#6c9a76' : '#d97757', fontVariantNumeric: 'tabular-nums' }}>
              {totalAmount >= 0 ? `+${fmt(totalAmount)}` : `−${fmt(Math.abs(totalAmount))}`}
            </b>{' '}
            บ.
          </span>
          {filtered.length > 0 && (
            <button
              onClick={handleExportFilteredCSV}
              className="pressable"
              style={{
                background: 'transparent',
                border: '1px solid #45433c',
                borderRadius: '6px',
                padding: '3px 8px',
                color: '#d0cdc2',
                fontSize: '10.5px',
                cursor: 'pointer',
              }}
            >
              📥 โหลด CSV
            </button>
          )}
        </div>

        {/* Transaction List */}
        <div
          style={{
            flex: 1,
            minHeight: '200px',
            overflowY: 'auto',
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#78756e', fontSize: '13px' }}>
              ไม่พบรายการธุรกรรมที่ตรงกับเงื่อนไข
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 4px',
                  borderBottom: '1px solid #2f2e2b',
                }}
              >
                <div style={{ width: '8px', height: '8px', flex: 'none', borderRadius: '99px', background: t.tint || '#8a8780' }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div
                    style={{
                      font: "500 13.5px/1.3 'IBM Plex Sans Thai'",
                      color: '#e8e5da',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.t}
                  </div>
                  <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>
                    {t.c} · {t.acct} · {t.when}
                  </div>
                </div>

                {/* Receipt Thumbnail / Badge */}
                {t.receipt && (
                  <button
                    onClick={() => onViewReceipt && onViewReceipt(t.receipt, t.t)}
                    title="แตะเพื่อดูสลิป/ใบเสร็จ"
                    style={{
                      border: '1px solid #4a4842',
                      background: '#302f2b',
                      borderRadius: '6px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: '#d97757',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    🧾 สลิป
                  </button>
                )}

                <div
                  style={{
                    font: "600 14px/1 'IBM Plex Sans Thai'",
                    color: t.income ? '#6c9a76' : '#e8e5da',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.income ? '+' : '−'}{fmt(t.a)}
                </div>

                {onDeleteTransaction && (
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    title="ลบรายการนี้"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#605e58',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d97757')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#605e58')}
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
