import React, { useState, useMemo } from 'react';
import AnalyticsChart from './AnalyticsChart.jsx';
import { ReceiptPreviewModal, WalletTransactionsModal } from './Modals.jsx';
import { getDaysUntilDue } from './BankTab.jsx';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

// Available sections that can be reordered on HomeTab
const SECTION_DEFS = [
  { id: 'fixed', label: 'ค่าใช้จ่ายประจำเดือน', icon: '📅', desc: 'บิลคงที่รายเดือน (ค่าน้ำ ค่าไฟ ค่าห้อง)' },
  { id: 'recent', label: 'รายการล่าสุด', icon: '📝', desc: 'รายการบันทึกธุรกรรมล่าสุด' },
  { id: 'spending', label: 'บัญชีใช้จ่าย & งบประมาณ', icon: '💰', desc: 'ยอดเงินคงเหลือในบัญชีใช้จ่าย และหลอดงบประมาณ' },
  { id: 'wallets', label: 'กระเป๋าเงิน & บัตร', icon: '💳', desc: 'ตัวกรองและยอดเงินในแต่ละบัญชี/บัตรเครดิต' },
  { id: 'due_soon', label: 'แจ้งเตือนบิลใกล้ครบกำหนด', icon: '🔔', desc: 'แถบเตือนบิลและบัตรที่ครบกำหนดใน 7 วัน' },
  { id: 'dues', label: 'ใกล้ครบกำหนดชำระ', icon: '⏳', desc: 'รายการที่ต้องจ่ายในเร็วๆ นี้' },
  { id: 'debts', label: 'คนติดเงิน', icon: '🤝', desc: 'รายการคนติดเงินและยอดค้างชำระ' },
  { id: 'analytics', label: 'สถิติรายจ่าย', icon: '📊', desc: 'กราฟวิเคราะห์สัดส่วนค่าใช้จ่าย' },
];

const DEFAULT_SECTION_ORDER = [
  'spending',
  'fixed',
  'recent',
  'wallets',
  'due_soon',
  'dues',
  'debts',
  'analytics',
];

export default function HomeTab({
  summary,
  accountsData,
  transactions = [],
  onToggleDebt,
  onDeleteDebt,
  onOpenAddDebt,
  onOpenEditBudget,
  onDeleteTransaction,
  onEditTransaction,
  onSelectTab,
  onOpenSearch,
  onEditAccount,
  onOpenTransferModal,
  onOpenPayCard,
  onToggleFixed,
  onOpenAddFixed,
  onDeleteFixed,
}) {
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [selectedWalletModal, setSelectedWalletModal] = useState(null);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  // Section Order state saved in localStorage
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('jod_home_section_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          DEFAULT_SECTION_ORDER.forEach((s) => {
            if (!merged.includes(s)) merged.push(s);
          });
          return merged;
        }
      }
    } catch (e) {
      // Ignore
    }
    return DEFAULT_SECTION_ORDER;
  });

  const handleSaveSectionOrder = (newOrder) => {
    setSectionOrder(newOrder);
    try {
      localStorage.setItem('jod_home_section_order', JSON.stringify(newOrder));
    } catch (e) {
      console.error('Failed to save section order:', e);
    }
  };

  const handleSetTopSection = (sectionId) => {
    const next = [sectionId, ...sectionOrder.filter((s) => s !== sectionId)];
    handleSaveSectionOrder(next);
  };

  const handleMoveSection = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const temp = next[index];
    next[index] = next[newIdx];
    next[newIdx] = temp;
    handleSaveSectionOrder(next);
  };

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
  const fixedList = accountsData?.fixed || [];
  const allWallets = [
    ...accounts.map((a) => ({
      ...a,
      id: a.id,
      name: (a.name === 'เงินสด/บัญชีหลัก' || a.name === 'Main' || a.name === 'บัญชีหลัก') ? 'บัญชีใช้จ่าย' : a.name,
      role: a.role || 'เงินเดือน/ใช้จ่าย',
      amt: a.amt || 0,
      tint: a.tint || '#6c9a76',
      isCard: false,
    })),
    ...cards.map((c) => ({
      ...c,
      id: c.id,
      name: c.name,
      role: c.role || `ตัด ${c.cut || '-'} · จ่าย ${c.due || '-'}`,
      amt: -(c.amt || c.used || 0),
      tint: c.tint || '#9b8ec4',
      isCard: true,
    })),
  ];

  // Primary spending account (บัญชีใช้จ่าย)
  const spendingAccount = accounts.find(
    (a) => a.name === 'บัญชีใช้จ่าย' || (a.role && a.role.includes('ใช้จ่าย')) || a.name === 'บัญชีหลัก' || a.name === 'Main' || a.name === 'เงินสด/บัญชีหลัก'
  ) || accounts[0];
  const spendingAccountName = (spendingAccount?.name === 'เงินสด/บัญชีหลัก' || spendingAccount?.name === 'Main' || spendingAccount?.name === 'บัญชีหลัก')
    ? 'บัญชีใช้จ่าย'
    : (spendingAccount?.name || 'บัญชีใช้จ่าย');
  const spendingBalance = spendingAccount ? (spendingAccount.amt || 0) : left;

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
      if (selectedWallets.length === 1 && selectedWallets[0] === walletId) {
        setSelectedWallets(['ALL']);
      } else {
        setSelectedWallets([walletId]);
      }
    } else {
      if (selectedWallets.includes('ALL')) {
        setSelectedWallets([walletId]);
      } else {
        if (selectedWallets.includes(walletId)) {
          const next = selectedWallets.filter((x) => x !== walletId);
          setSelectedWallets(next.length > 0 ? next : ['ALL']);
        } else {
          const next = [...selectedWallets, walletId];
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
    : transactions.filter((tx) => {
        if (!tx.acct) return false;
        const acct = tx.acct.trim();
        return selectedIdentifiers.has(acct) ||
          ((selectedIdentifiers.has('บัญชีใช้จ่าย') || selectedIdentifiers.has('บัญชีหลัก')) &&
            (acct === 'บัญชีใช้จ่าย' || acct === 'บัญชีหลัก' || acct.toLowerCase() === 'main' || acct === 'เงินสด/บัญชีหลัก'));
      });

  // Calculate upcoming due bills and credit cards within 7 days
  const dueSoonItems = useMemo(() => {
    const list = [];
    const fixedArr = accountsData?.fixed || [];
    const cardList = accountsData?.cards || [];

    fixedArr.forEach((f) => {
      if (!f.done) {
        const days = getDaysUntilDue(f.day);
        if (days !== null && days <= 7) {
          list.push({
            id: f.id,
            name: f.name,
            amt: f.amt,
            days,
            detail: `ทุกวันที่ ${f.day}`,
            isCard: false,
          });
        }
      }
    });

    cardList.forEach((c) => {
      if (c.amt > 0) {
        const days = getDaysUntilDue(c.due);
        if (days !== null && days <= 7) {
          list.push({
            id: c.id,
            name: c.name,
            amt: c.amt,
            days,
            detail: `จ่าย ${c.due}`,
            isCard: true,
          });
        }
      }
    });

    return list.sort((a, b) => a.days - b.days);
  }, [accountsData]);

  // Section Renderers (Static, Zero Animation, Minimalist)
  const renderSpendingSection = () => (
    <div key="spending" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div
            onClick={() => {
              if (spendingAccount) {
                setSelectedWalletModal(spendingAccount);
              }
            }}
            className="pressable"
            style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
            title="แตะเพื่อดูประวัติรายการในบัญชีนี้"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: spendingAccount?.tint || '#d97757',
              }}
            />
            <span style={{ font: "600 13.5px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
              บัญชีใช้จ่าย ({spendingAccountName})
            </span>
            <span style={{ fontSize: '10.5px', color: '#d97757', background: 'rgba(217,119,87,0.14)', padding: '2px 6px', borderRadius: '5px' }}>
              📄 ดูประวัติ
            </span>
          </div>
          {onOpenEditBudget && (
            <button
              onClick={onOpenEditBudget}
              className="pressable"
              style={{
                background: 'transparent',
                border: '1px solid #45433c',
                borderRadius: '6px',
                padding: '2px 7px',
                fontSize: '11px',
                color: '#a8a49a',
                cursor: 'pointer',
              }}
              title="ตั้งงบประมาณรายเดือน"
            >
              ✎ ตั้งงบ
            </button>
          )}
        </div>

        <div
          onClick={() => {
            if (spendingAccount) {
              setSelectedWalletModal(spendingAccount);
            }
          }}
          className="pressable"
          style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}
          title="แตะเพื่อดูประวัติรายการในบัญชีใช้จ่าย"
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
            <div style={{ font: "600 44px/1 'IBM Plex Sans Thai'", color: '#f0eee6', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(spendingBalance)}
            </div>
            <div style={{ font: "400 15px/1 'IBM Plex Sans Thai'", color: '#78756e' }}>บาท</div>
          </div>
          <div style={{ fontSize: '11px', color: '#d97757', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px', fontWeight: '500' }}>
            <span>📄 แตะดูประวัติรายการ</span>
            <span>›</span>
          </div>
        </div>
      </div>

      {/* Monthly Budget Spending Progress Bar (Clean static) */}
      <div
        onClick={onOpenEditBudget}
        className="pressable"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
        title="แตะเพื่อตั้งงบประมาณรายเดือน"
      >
        <div style={{ height: '7px', borderRadius: '99px', background: '#33322f', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '99px',
              width: `${Math.min(spentPct, 100)}%`,
              background: 'linear-gradient(90deg, #d97757 0%, #e09477 100%)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 12px/1.4 'IBM Plex Sans Thai'", color: '#8a8780' }}>
          <span>
            ใช้ไปแล้ว {spentPct}% (<span style={{ color: '#d0cdc2', fontVariantNumeric: 'tabular-nums' }}>{fmt(spent)}</span> บ.)
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            งบเดือนนี้ {fmt(income)} บ. (เหลือ {fmt(left)} บ.)
          </span>
        </div>
      </div>
    </div>
  );

  const renderFixedExpensesSection = () => (
    <div key="fixed" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ font: "600 13.5px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            📅 ค่าใช้จ่ายประจำเดือน
          </span>
          <span
            style={{
              fontSize: '10.5px',
              color: fixedDone === fixedTotalCount && fixedTotalCount > 0 ? '#6c9a76' : '#d97757',
              background: fixedDone === fixedTotalCount && fixedTotalCount > 0 ? 'rgba(108,154,118,0.15)' : 'rgba(217,119,87,0.14)',
              padding: '2px 7px',
              borderRadius: '99px',
            }}
          >
            ตัดแล้ว {fixedDone}/{fixedTotalCount} · รวม {fmt(fixedTotal)} บ.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onOpenAddFixed && (
            <button
              onClick={onOpenAddFixed}
              className="pressable"
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
              + เพิ่มบิล
            </button>
          )}
        </div>
      </div>

      {/* List of Fixed Bills or Minimalist Empty State */}
      {fixedList.length === 0 ? (
        <div
          style={{
            background: '#242321',
            border: '1px dashed #3a3935',
            borderRadius: '14px',
            padding: '16px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#8a8780' }}>ยังไม่มีค่าใช้จ่ายประจำเดือน</div>
          <div style={{ fontSize: '11px', color: '#68655e' }}>บันทึกบิลที่ต้องจ่ายทุกเดือน เช่น ค่าน้ำ ค่าไฟ ค่าห้อง เน็ต</div>
          {onOpenAddFixed && (
            <button
              onClick={onOpenAddFixed}
              className="pressable"
              style={{
                background: 'rgba(217,119,87,0.14)',
                border: '1px solid rgba(217,119,87,0.3)',
                borderRadius: '8px',
                padding: '4px 12px',
                fontSize: '11.5px',
                color: '#d97757',
                cursor: 'pointer',
                marginTop: '2px',
              }}
            >
              + เพิ่มบิลแรก
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {fixedList.map((f) => (
            <div
              key={f.id}
              onClick={() => onToggleFixed && onToggleFixed(f.id)}
              className="pressable"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                background: f.done ? '#22211f' : '#2b2a27',
                border: `1px solid ${f.done ? '#2f2e2b' : '#393833'}`,
                borderRadius: '12px',
                padding: '10px 13px',
                cursor: 'pointer',
                opacity: f.done ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {/* Minimal Square Checkbox */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    flex: 'none',
                    borderRadius: '6px',
                    background: f.done ? '#2e4733' : '#33322e',
                    border: `1.5px solid ${f.done ? '#4e855b' : '#525048'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#6c9a76',
                    fontWeight: '700',
                  }}
                >
                  {f.done ? '✓' : ''}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                  <span
                    style={{
                      font: "500 13px/1.3 'IBM Plex Sans Thai'",
                      color: f.done ? '#8a8780' : '#f0eee6',
                      textDecoration: f.done ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.name}
                  </span>
                  <span style={{ font: "400 10.5px/1.2 'IBM Plex Sans Thai'", color: '#78756e' }}>
                    ทุกวันที่ {f.day} {f.done ? '· ตัดแล้ว' : '· รอตัด'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
                <span
                  style={{
                    font: "600 13.5px/1 'IBM Plex Sans Thai'",
                    color: f.done ? '#78756e' : '#e8e5da',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ฿{fmt(f.amt)}
                </span>
                {onDeleteFixed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFixed(f.id);
                    }}
                    title="ลบบิลนี้"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#5a5852',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '2px 4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d97757')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5a5852')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDueSoonSection = () => {
    if (dueSoonItems.length === 0) return null;
    return (
      <div
        key="due_soon"
        onClick={() => onSelectTab && onSelectTab('bank')}
        className="pressable"
        style={{
          background: 'linear-gradient(135deg, rgba(217,119,87,0.18) 0%, rgba(201,162,39,0.12) 100%)',
          border: '1px solid rgba(217,119,87,0.4)',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <div style={{ font: "600 13px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ครบกำหนดชำระเร็วๆ นี้ ({dueSoonItems.length} รายการ)
            </div>
            <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#d97757' }}>
              {dueSoonItems[0].name} • {dueSoonItems[0].days === 0 ? '🚨 ครบกำหนดวันนี้!' : `⚡ อีก ${dueSoonItems[0].days} วัน`} ({fmt(dueSoonItems[0].amt)} บ.)
            </div>
          </div>
        </div>
        <span style={{ fontSize: '11.5px', color: '#d0cdc2', flex: 'none' }}>แตะดู ➔</span>
      </div>
    );
  };

  const renderWalletsSection = () => (
    <div
      key="wallets"
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
            }}
            title={isMultiMode ? 'โหมดเลือกได้หลายอัน (เปิดอยู่)' : 'เปิดโหมดเลือกได้หลายบัญชี'}
          >
            {isMultiMode ? '✓ หลายบัญชี' : 'แตะเดี่ยว'}
          </button>

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
            }}
            title="บันทึกตัวเลือกนี้เป็นค่าเริ่มต้นเมื่อเปิดแอป"
          >
            {defaultSavedFeedback ? '✓ บันทึกแล้ว' : '⭐ ตั้งเป็น Default'}
          </button>
        </div>
      </div>

      {/* Filter Pills */}
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
          }}
        >
          {isAllSelected && <span style={{ color: '#d97757' }}>✓</span>}
          ทั้งหมด
        </button>

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
        {!isAllSelected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 2px 2px',
              borderBottom: '1px solid #37362f',
            }}
          >
            <span style={{ fontSize: '11.5px', color: '#8a8780' }}>
              ยอดคงเหลือ ({visibleWallets.length} บัญชีที่เลือก):
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ font: "600 15px/1 'IBM Plex Sans Thai'", color: '#6c9a76', fontVariantNumeric: 'tabular-nums' }}>
                ฿{fmt(selectedTotalAmt)}
              </span>
              {visibleWallets.length === 1 && (
                <button
                  onClick={() => setSelectedWalletModal(visibleWallets[0])}
                  className="pressable"
                  style={{
                    background: 'rgba(217,119,87,0.15)',
                    border: '1px solid rgba(217,119,87,0.3)',
                    color: '#d97757',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  📄 ดูรายการ
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: visibleWallets.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
          {visibleWallets.slice(0, 4).map((w) => (
            <div
              key={w.id}
              onClick={() => setSelectedWalletModal(w)}
              className="pressable"
              title="แตะเพื่อดูประวัติรายการในกระเป๋านี้"
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
                {w.isCard ? (
                  <span style={{ fontSize: '9px', color: '#9b8ec4', background: 'rgba(155,142,196,0.15)', padding: '1px 4px', borderRadius: '4px' }}>
                    บัตร
                  </span>
                ) : (
                  <span style={{ fontSize: '9.5px', color: '#d97757' }}>📄 ดูรายการ</span>
                )}
              </div>
              <div style={{ font: "600 15px/1.2 'IBM Plex Sans Thai'", color: w.amt < 0 ? '#d97757' : '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                {w.isCard ? (
                  <>ใช้ไป {fmt(Math.abs(w.amt))}</>
                ) : (
                  fmt(w.amt)
                )}
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
            className="pressable"
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
  );

  const renderDuesSection = () => (
    <div key="dues" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780', letterSpacing: '0.02em' }}>
        ใกล้ครบกำหนด
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dues.length === 0 ? (
          <div style={{ padding: '14px', textAlign: 'center', color: '#78756e', fontSize: '12px', background: '#242321', borderRadius: '12px', border: '1px dashed #373630' }}>
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
  );

  const renderDebtsSection = () => (
    <div key="debts" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <div style={{ padding: '14px', textAlign: 'center', color: '#78756e', fontSize: '12px', background: '#242321', borderRadius: '12px', border: '1px dashed #373630' }}>
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
  );

  const renderAnalyticsSection = () => (
    <div key="analytics">
      <AnalyticsChart transactions={transactions} />
    </div>
  );

  const renderRecentTransactionsSection = () => (
    <div key="recent" style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="pressable"
              style={{
                background: '#302f2b',
                border: '1px solid #45433c',
                borderRadius: '7px',
                padding: '3px 8px',
                color: '#d0cdc2',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>🔍</span> ค้นหา
            </button>
          )}
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredRecent.length === 0 ? (
          <div
            style={{
              padding: '22px 14px',
              textAlign: 'center',
              color: '#8a8780',
              fontSize: '12.5px',
              background: '#242321',
              borderRadius: '14px',
              border: '1px dashed #373630',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div>ยังไม่มีรายการธุรกรรมในกระเป๋านี้</div>
            <button
              onClick={() => onSelectTab && onSelectTab('add')}
              className="pressable"
              style={{
                background: 'rgba(217,119,87,0.14)',
                border: '1px solid rgba(217,119,87,0.3)',
                borderRadius: '8px',
                padding: '4px 12px',
                fontSize: '11.5px',
                color: '#d97757',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              + จดรายการตอนนี้
            </button>
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
              {e.receipt && (
                <button
                  onClick={() => setPreviewReceipt(e.receipt)}
                  title="แตะเพื่อดูรูปสลิป"
                  style={{
                    border: '1px solid #4a4842',
                    background: '#302f2b',
                    borderRadius: '6px',
                    padding: '2px 5px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: '#d97757',
                  }}
                >
                  🧾
                </button>
              )}
              <div
                style={{
                  font: "500 13.5px/1 'IBM Plex Sans Thai'",
                  color: e.income ? '#6c9a76' : '#e8e5da',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {e.income ? '+' : '−'}{fmt(e.a)}
              </div>
              {onEditTransaction && (
                <button
                  onClick={() => onEditTransaction(e)}
                  title="แก้ไขรายการนี้"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#5a5852',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '2px 4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#7fa3c9')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5a5852')}
                >
                  ✎
                </button>
              )}
              {onDeleteTransaction && (
                <button
                  onClick={() => onDeleteTransaction(e.id)}
                  title="ลบรายการนี้"
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
  );

  // Map section ID to renderer
  const sectionRendererMap = {
    spending: renderSpendingSection,
    fixed: renderFixedExpensesSection,
    recent: renderRecentTransactionsSection,
    wallets: renderWalletsSection,
    due_soon: renderDueSoonSection,
    dues: renderDuesSection,
    debts: renderDebtsSection,
    analytics: renderAnalyticsSection,
  };

  return (
    <div style={{ padding: '6px 18px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Month Header with Date & Reorder Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🗓️</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ font: "600 15px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>กันยายน</div>
            <div style={{ font: "400 11px/1.2 'IBM Plex Sans Thai'", color: '#8a8780' }}>
              วันที่ 9 · เหลือ 21 วัน
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowLayoutModal(true)}
            className="pressable"
            style={{
              background: '#2c2b28',
              border: '1px solid #3d3b36',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11px',
              color: '#d0cdc2',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="ปรับแต่งลำดับการแสดงผลของหน้าสรุป"
          >
            <span>⇅</span>
            <span>จัดหน้า</span>
          </button>

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
            9 / 30
          </div>
        </div>
      </div>

      {/* Render All Sections in Customized Order */}
      {sectionOrder.map((sId) => {
        const renderer = sectionRendererMap[sId];
        return renderer ? renderer() : null;
      })}

      {/* Modal: Customize Home Section Order */}
      {showLayoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowLayoutModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#242320',
              border: '1px solid #3a3935',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ font: "600 17px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
                  จัดลำดับหน้าสรุป
                </div>
                <div style={{ font: "400 12px/1.3 'IBM Plex Sans Thai'", color: '#8a8780', marginTop: '3px' }}>
                  เลือกส่วนที่ต้องการให้แสดงด้านบนสุด หรือปรับเรียงตามชอบ
                </div>
              </div>
              <button
                onClick={() => setShowLayoutModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8a8780',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Priority: Show First Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#d97757' }}>
                ★ ทางลัด: เลือกให้แสดงด้านบนสุดทันที
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => handleSetTopSection('fixed')}
                  className="pressable"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: sectionOrder[0] === 'fixed' ? 'rgba(217,119,87,0.2)' : '#2d2c28',
                    border: `1px solid ${sectionOrder[0] === 'fixed' ? '#d97757' : '#3d3b36'}`,
                    color: sectionOrder[0] === 'fixed' ? '#d97757' : '#dedbd2',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📅</span>
                  <span style={{ fontWeight: sectionOrder[0] === 'fixed' ? '600' : '400' }}>ค่าใช้จ่ายประจำเดือน</span>
                </button>

                <button
                  onClick={() => handleSetTopSection('recent')}
                  className="pressable"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: sectionOrder[0] === 'recent' ? 'rgba(217,119,87,0.2)' : '#2d2c28',
                    border: `1px solid ${sectionOrder[0] === 'recent' ? '#d97757' : '#3d3b36'}`,
                    color: sectionOrder[0] === 'recent' ? '#d97757' : '#dedbd2',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📝</span>
                  <span style={{ fontWeight: sectionOrder[0] === 'recent' ? '600' : '400' }}>รายการล่าสุด</span>
                </button>

                <button
                  onClick={() => handleSetTopSection('spending')}
                  className="pressable"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: sectionOrder[0] === 'spending' ? 'rgba(217,119,87,0.2)' : '#2d2c28',
                    border: `1px solid ${sectionOrder[0] === 'spending' ? '#d97757' : '#3d3b36'}`,
                    color: sectionOrder[0] === 'spending' ? '#d97757' : '#dedbd2',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>💰</span>
                  <span style={{ fontWeight: sectionOrder[0] === 'spending' ? '600' : '400' }}>บัญชีใช้จ่าย</span>
                </button>

                <button
                  onClick={() => handleSetTopSection('wallets')}
                  className="pressable"
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: sectionOrder[0] === 'wallets' ? 'rgba(217,119,87,0.2)' : '#2d2c28',
                    border: `1px solid ${sectionOrder[0] === 'wallets' ? '#d97757' : '#3d3b36'}`,
                    color: sectionOrder[0] === 'wallets' ? '#d97757' : '#dedbd2',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>💳</span>
                  <span style={{ fontWeight: sectionOrder[0] === 'wallets' ? '600' : '400' }}>กระเป๋าเงิน & บัตร</span>
                </button>
              </div>
            </div>

            {/* Detailed Section Reordering List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #33322e', paddingTop: '12px' }}>
              <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                ลำดับการแสดงผลทั้งหมด:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sectionOrder.map((sId, idx) => {
                  const def = SECTION_DEFS.find((d) => d.id === sId) || { label: sId, icon: '📌' };
                  const isTop = idx === 0;
                  return (
                    <div
                      key={sId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isTop ? '#2d2924' : '#282724',
                        border: `1px solid ${isTop ? 'rgba(217,119,87,0.4)' : '#383733'}`,
                        borderRadius: '10px',
                        padding: '8px 10px',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isTop ? '#d97757' : '#383733',
                            color: isTop ? '#ffffff' : '#8a8780',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10.5px',
                            fontWeight: '600',
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '15px' }}>{def.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ font: "500 12.5px/1.2 'IBM Plex Sans Thai'", color: isTop ? '#f0eee6' : '#dedbd2' }}>
                            {def.label} {isTop && <span style={{ color: '#d97757', fontSize: '10px' }}>(แสดงบนสุด)</span>}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 'none' }}>
                        <button
                          onClick={() => handleMoveSection(idx, -1)}
                          disabled={idx === 0}
                          style={{
                            background: '#33322e',
                            border: '1px solid #44423c',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            color: idx === 0 ? '#5a5852' : '#dedbd2',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="เลื่อนขึ้น"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveSection(idx, 1)}
                          disabled={idx === sectionOrder.length - 1}
                          style={{
                            background: '#33322e',
                            border: '1px solid #44423c',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            color: idx === sectionOrder.length - 1 ? '#5a5852' : '#dedbd2',
                            cursor: idx === sectionOrder.length - 1 ? 'default' : 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="เลื่อนลง"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #33322e', paddingTop: '12px' }}>
              <button
                onClick={() => handleSaveSectionOrder(DEFAULT_SECTION_ORDER)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8a8780',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ↺ รีเซ็ตค่าเริ่มต้น
              </button>
              <button
                onClick={() => setShowLayoutModal(false)}
                style={{
                  background: '#d97757',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewReceipt && (
        <ReceiptPreviewModal
          src={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
        />
      )}

      {/* Wallet Transactions Detail Modal */}
      {selectedWalletModal && (
        <WalletTransactionsModal
          wallet={selectedWalletModal}
          transactions={transactions}
          onClose={() => setSelectedWalletModal(null)}
          onDeleteTransaction={onDeleteTransaction}
          onEditTransaction={onEditTransaction}
          onEditAccount={onEditAccount}
          onOpenTransferModal={onOpenTransferModal}
          onOpenPayCard={onOpenPayCard}
        />
      )}
    </div>
  );
}
