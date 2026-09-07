import React, { useState, useEffect } from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    cat: 'อาหาร',
    tint: '#d97757',
    kw: [
      'ข้าว', 'อาหาร', 'ก๋วยเตี๋ยว', 'หมูกระทะ', 'ชาบู', 'กิน', 'ส้มตำ', 'ข้าวมันไก่',
      'ขนม', 'กะเพรา', 'ซูชิ', 'ซูชิโระ', 'sushi', 'sushiro', 'ราเมง', 'กาแฟ', 'ชา',
      'ลาเต้', 'อเมริกาโน่', 'starbucks', 'ชาเขียว', 'ชานม', 'kfc', 'mcdonald', 'พิซซ่า',
      'mk', 'บุฟเฟ่ต์', 'ของกิน', 'ไอติม', 'ของหวาน', 'ร้านอาหาร', 'เนื้อย่าง'
    ],
    acct: 'บัญชีหลัก',
  },
  {
    id: 'household',
    cat: 'ของใช้',
    tint: '#c9a227',
    kw: [
      'ของใช้', 'เซเว่น', '7-11', 'โลตัส', 'lotus', 'big c', 'cj', 'สบู่', 'ยาสีฟัน',
      'แฟ้บ', 'ทิชชู่', 'น้ำยาล้างจาน', 'ซุปเปอร์', 'ซื้อของเข้าบ้าน', 'supermarket',
      'วัตสัน', 'watsons', 'ยา', 'ผงซักฟอก', 'ของใช้ในบ้าน', 'น้ำยา'
    ],
    acct: 'บัญชีหลัก',
  },
  {
    id: 'shopping',
    cat: 'ชอปปิ้ง',
    tint: '#9b8ec4',
    kw: [
      'ชอปปิ้ง', 'ช้อปปิ้ง', 'ช็อปปิ้ง', 'เสื้อผ้า', 'shopee', 'lazada', 'tiktok',
      'เสื้อ', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'หูฟัง', 'uniqlo', 'zara', 'ซื้อของ',
      'shopping', 'ของเล่น', 'เกม', 'เครื่องสำอาง', 'ลิป', 'ครีม'
    ],
    acct: 'บัญชีหลัก',
  },
  {
    id: 'fuel',
    cat: 'เติมน้ำมัน',
    tint: '#7fa3c9',
    kw: [
      'น้ำมัน', 'เติมน้ำมัน', 'ปตท', 'ptt', 'บางจาก', 'เชลล์', 'shell', 'caltex',
      'เอสโซ่', 'esso', 'gasoline', 'ดีเซล', 'เบนซิน', 'แก๊สโซฮอล์', 'lpg', 'ngv', 'ชาร์จรถ'
    ],
    acct: 'บัญชีหลัก',
  },
  {
    id: 'others',
    cat: 'อื่นๆ',
    tint: '#8a8780',
    kw: ['อื่นๆ', 'จิปาถะ', 'ทั่วไป'],
    acct: 'บัญชีหลัก',
  },
  {
    id: 'income',
    cat: 'รายรับ',
    tint: '#6c9a76',
    kw: ['เงินเดือน', 'โบนัส', 'ได้เงิน', 'รับ', 'คืนเงิน', 'ขายของ', 'ถูกหวย', 'income'],
    acct: 'บัญชีหลัก',
    income: true,
  },
];

const PRESET_COLORS = [
  '#d97757', // Terracotta Orange
  '#c9a227', // Amber Gold
  '#6c9a76', // Sage Green
  '#7fa3c9', // Classic Blue
  '#9b8ec4', // Lavender Purple
  '#e06c75', // Coral Pink
  '#56b6c2', // Cyan Teal
  '#8a8780', // Slate Grey
];

export default function AddTab({
  onAddTransaction,
  onDeleteTransaction,
  transactions = [],
  availableAccounts = [],
}) {
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState('out'); // 'out' (จ่าย) or 'in' (รับ)
  const [overrideAcct, setOverrideAcct] = useState(null);
  const [overrideCat, setOverrideCat] = useState(null);

  // Custom Categories state (synced with localStorage)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('jod_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customOnly = parsed.filter(
            (p) => !DEFAULT_CATEGORIES.some((d) => d.id === p.id || d.cat === p.cat)
          );
          return [...DEFAULT_CATEGORIES, ...customOnly];
        }
      }
    } catch (e) {
      console.warn('Failed to load custom categories:', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // Modal State for adding/managing categories
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatKw, setNewCatKw] = useState('');

  const defaultAccount =
    availableAccounts.find(
      (a) => a.name === 'บัญชีหลัก' || a.name.includes('บัญชีหลัก')
    )?.name || 'บัญชีหลัก';

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.cat === trimmed)) {
      alert('มีหมวดหมู่นี้อยู่แล้ว');
      return;
    }

    const kwList = newCatKw
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    if (!kwList.includes(trimmed.toLowerCase())) {
      kwList.push(trimmed.toLowerCase());
    }

    const newCategory = {
      id: `custom_${Date.now()}`,
      cat: trimmed,
      tint: newCatColor,
      kw: kwList,
      acct: defaultAccount,
      isCustom: true,
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    try {
      localStorage.setItem(
        'jod_custom_categories',
        JSON.stringify(updated.filter((c) => c.isCustom))
      );
    } catch (e) {
      console.error('Failed to save category:', e);
    }

    setOverrideCat(trimmed);
    setNewCatName('');
    setNewCatKw('');
    setShowAddCatModal(false);
  };

  const handleDeleteCategory = (catId) => {
    const updated = categories.filter((c) => c.id !== catId);
    setCategories(updated);
    try {
      localStorage.setItem(
        'jod_custom_categories',
        JSON.stringify(updated.filter((c) => c.isCustom))
      );
    } catch (e) {
      console.error('Failed to delete category:', e);
    }
    if (overrideCat && !updated.some((c) => c.cat === overrideCat)) {
      setOverrideCat(null);
    }
  };

  const parse = (text) => {
    const raw = (text || '').trim();
    const m = raw.match(/(\d[\d,]*(?:\.\d+)?)/);
    const amount = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
    const words = raw.toLowerCase();
    
    // Find matching category from list
    const hit = categories.find((c) => c.kw && c.kw.some((k) => words.includes(k)));
    const matchedCat = categories.find((c) => c.cat === overrideCat);

    const name = raw.replace(/(\d[\d,]*(?:\.\d+)?)\s*(บาท)?/, '').trim();
    const activeCat = overrideCat || (hit ? hit.cat : 'อื่นๆ');
    const activeTint = matchedCat ? matchedCat.tint : hit ? hit.tint : '#8a8780';

    const rawAcct = overrideAcct || (hit && hit.acct ? hit.acct : defaultAccount);
    const activeAcct = (rawAcct === 'Main' || rawAcct === 'เงินสด/บัญชีหลัก') ? 'บัญชีหลัก' : rawAcct;

    return {
      amount,
      name: name || (hit ? hit.cat : 'ไม่ระบุ'),
      cat: activeCat,
      tint: activeTint,
      acct: activeAcct,
      income: kind === 'in' || !!(hit && hit.income),
    };
  };

  const parsed = parse(draft);

  const handleSave = () => {
    if (!parsed.amount) return;
    onAddTransaction({
      text: draft,
      t: parsed.name,
      c: parsed.cat,
      tint: parsed.tint,
      a: parsed.amount,
      acct: parsed.acct,
      income: parsed.income,
    });
    setDraft('');
    setOverrideAcct(null);
    setOverrideCat(null);
  };

  const quickPicks = [
    'ซูชิโระ 233',
    'ข้าว 65',
    'เซเว่น 180',
    'เติมน้ำมัน 900',
    'shopee 350',
    'อื่นๆ 100',
  ];

  const todayList = transactions.filter((e) => e.today);
  const todayTotal = todayList
    .filter((e) => !e.income)
    .reduce((acc, e) => acc + e.a, 0);

  return (
    <div className="animate-fadein" style={{ padding: '6px 20px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ font: "600 16px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>จด</div>
        <button
          onClick={() => setShowAddCatModal(true)}
          style={{
            background: 'transparent',
            border: '1px solid #45433c',
            borderRadius: '8px',
            padding: '4px 9px',
            fontSize: '11px',
            color: '#d0cdc2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="จัดการและเพิ่มหมวดหมู่ใหม่"
        >
          <span>🏷️</span> จัดการหมวด
        </button>
      </div>

      {/* Input Box with Auto Parser */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          style={{
            background: '#302f2c',
            border: `1px solid ${draft.trim() ? '#d97757' : '#3a3936'}`,
            borderRadius: '18px',
            padding: '16px 16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'border-color 0.2s',
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              // Reset override when cleared
              if (!e.target.value) {
                setOverrideCat(null);
                setOverrideAcct(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="ซูชิโระ 233"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#f0eee6',
              font: "400 22px/1.3 'IBM Plex Sans Thai'",
              width: '100%',
              padding: 0,
            }}
          />

          {/* Live Chips (Clickable to override) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', minHeight: '26px' }}>
            {draft.trim() ? (
              <>
                {/* Amount chip */}
                <div
                  className="animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#3a3833',
                    border: '1px solid #45433c',
                    borderRadius: '8px',
                    padding: '5px 9px',
                    font: "400 11.5px/1 'IBM Plex Sans Thai'",
                    color: '#d0cdc2',
                  }}
                >
                  <span style={{ color: '#78756e' }}>ยอด:</span>
                  <span style={{ color: '#f0eee6', fontWeight: '600' }}>{fmt(parsed.amount || 0)}</span>
                </div>

                {/* Category selector dropdown chip */}
                <div
                  className="animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#3a3833',
                    border: '1px solid #45433c',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    font: "400 11.5px/1 'IBM Plex Sans Thai'",
                    color: '#d0cdc2',
                  }}
                >
                  <span style={{ color: '#78756e' }}>หมวด:</span>
                  <select
                    value={parsed.cat}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowAddCatModal(true);
                      } else {
                        setOverrideCat(e.target.value);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: parsed.tint,
                      fontWeight: '600',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '11.5px',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.cat} value={c.cat} style={{ background: '#262624', color: '#f0eee6' }}>
                        {c.cat}
                      </option>
                    ))}
                    <option value="__NEW__" style={{ background: '#2c2820', color: '#d97757' }}>
                      + เพิ่มหมวดใหม่...
                    </option>
                  </select>
                </div>

                {/* Account selector chip */}
                <div
                  className="animate-pop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#3a3833',
                    border: '1px solid #45433c',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    font: "400 11.5px/1 'IBM Plex Sans Thai'",
                    color: '#d0cdc2',
                  }}
                >
                  <span style={{ color: '#78756e' }}>ตัดบัญชี:</span>
                  <select
                    value={parsed.acct}
                    onChange={(e) => setOverrideAcct(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#d97757',
                      fontWeight: '500',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '11.5px',
                    }}
                  >
                    {(() => {
                      const list = availableAccounts.map((a) => {
                        const cleanName =
                          a.name === 'เงินสด/บัญชีหลัก' || a.name === 'Main'
                            ? 'บัญชีหลัก'
                            : a.name;
                        return { ...a, cleanName };
                      });
                      if (!list.some((a) => a.cleanName === 'บัญชีหลัก')) {
                        list.unshift({ id: 'acct-main', cleanName: 'บัญชีหลัก' });
                      }
                      return list.map((a) => (
                        <option
                          key={a.id || a.cleanName}
                          value={a.cleanName}
                          style={{ background: '#262624', color: '#f0eee6' }}
                        >
                          {a.cleanName}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Income / Expense toggle chip */}
                <div
                  className="animate-pop"
                  onClick={() => setKind((k) => (k === 'out' ? 'in' : 'out'))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#3a3833',
                    border: '1px solid #45433c',
                    borderRadius: '8px',
                    padding: '5px 9px',
                    font: "400 11.5px/1 'IBM Plex Sans Thai'",
                    color: parsed.income ? '#6c9a76' : '#d97757',
                    cursor: 'pointer',
                  }}
                  title="คลิกเพื่อสลับ รายรับ / รายจ่าย"
                >
                  {parsed.income ? 'รายรับ' : 'รายจ่าย'}
                </div>
              </>
            ) : (
              <div style={{ color: '#78756e', fontSize: '12px' }}>
                พิมพ์ชื่อรายการกับราคา เช่น <strong>ซูชิโระ 233</strong> หรือ <strong>เติมน้ำมัน 900</strong>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              background: '#d97757',
              color: '#1a1a18',
              font: "600 14.5px/1 'IBM Plex Sans Thai'",
              cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            บันทึก
          </button>
          <button
            onClick={() => setKind((k) => (k === 'out' ? 'in' : 'out'))}
            style={{
              flex: 'none',
              border: '1px solid #45433c',
              background: 'transparent',
              borderRadius: '14px',
              padding: '14px 16px',
              color: kind === 'in' ? '#6c9a76' : '#a8a49a',
              font: "500 13px/1 'IBM Plex Sans Thai'",
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {kind === 'out' ? 'จ่าย' : 'รับ'}
          </button>
        </div>
      </div>

      {/* Category Pills (Tap to set category or add new) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            เลือกหมวดหมู่ (หรือพิมพ์ชื่อหมวดในข้อความได้เลย)
          </div>
          <button
            onClick={() => setShowAddCatModal(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d97757',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            + เพิ่มหมวด
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {categories.map((c) => {
            const isSelected = overrideCat ? overrideCat === c.cat : parsed.cat === c.cat;
            return (
              <button
                key={c.id || c.cat}
                onClick={() => setOverrideCat(c.cat)}
                style={{
                  border: `1px solid ${isSelected ? c.tint : '#3a3936'}`,
                  background: isSelected ? `${c.tint}25` : '#2c2b28',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  color: isSelected ? '#f0eee6' : '#a8a49a',
                  font: "400 11.5px/1 'IBM Plex Sans Thai'",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.tint }} />
                <span>{c.cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Tap Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>แตะใส่เร็ว</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {quickPicks.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setDraft(q)}
              style={{
                border: '1px solid #3a3936',
                background: '#2c2b28',
                borderRadius: '10px',
                padding: '8px 12px',
                color: '#d0cdc2',
                font: "400 12px/1 'IBM Plex Sans Thai'",
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>วันนี้</div>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#78756e', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(todayTotal)} บาท
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {todayList.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#78756e', fontSize: '12.5px' }}>
              ยังไม่มีรายการของวันนี้
            </div>
          ) : (
            todayList.map((e) => (
              <div
                key={e.id}
                className="animate-pop"
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
                  <div style={{ font: "400 13.5px/1.3 'IBM Plex Sans Thai'", color: '#e8e5da' }}>{e.t}</div>
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
                    title="ลบรายการนี้ (คืนยอดเงิน)"
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

      {/* Add / Manage Categories Modal */}
      {showAddCatModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowAddCatModal(false)}
        >
          <div
            style={{
              background: '#262624',
              border: '1px solid #3e3d37',
              borderRadius: '20px',
              padding: '22px 20px',
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
                🏷️ จัดการและเพิ่มหมวดหมู่
              </div>
              <button
                onClick={() => setShowAddCatModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8a8780',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Category Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', color: '#8a8780' }}>ชื่อหมวดหมู่ใหม่</label>
              <input
                type="text"
                placeholder="เช่น ความงาม, สัตว์เลี้ยง, ท่องเที่ยว"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{
                  background: '#302f2c',
                  border: '1px solid #45433c',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#f0eee6',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Color Palette Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', color: '#8a8780' }}>เลือกสีประจำหมวด</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: c,
                      border: newCatColor === c ? '2.5px solid #f0eee6' : '1.5px solid transparent',
                      cursor: 'pointer',
                      boxShadow: newCatColor === c ? `0 0 8px ${c}` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Auto-matching keywords */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', color: '#8a8780' }}>
                คำช่วยจำเพื่อแยกหมวดอัตโนมัติ (คั่นด้วยจุลภาค)
              </label>
              <input
                type="text"
                placeholder="เช่น ครีม, ลิป, สกินแคร์, เครื่องสำอาง"
                value={newCatKw}
                onChange={(e) => setNewCatKw(e.target.value)}
                style={{
                  background: '#302f2c',
                  border: '1px solid #45433c',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#f0eee6',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Add Category Button */}
            <button
              onClick={handleAddCategory}
              style={{
                background: '#d97757',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                color: '#1a1a18',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              + บันทึกหมวดหมู่ใหม่
            </button>

            {/* Current Custom Categories List (With Delete Ability) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #37362f', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#78756e' }}>หมวดหมู่ที่เพิ่มเอง:</div>
              {categories.filter((c) => c.isCustom).length === 0 ? (
                <div style={{ fontSize: '11.5px', color: '#5a5852', fontStyle: 'italic' }}>
                  ยังไม่มีหมวดหมู่ที่สร้างเอง (ใช้หมวดมาตรฐาน: อาหาร, ของใช้, ชอปปิ้ง, เติมน้ำมัน, อื่นๆ)
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {categories
                    .filter((c) => c.isCustom)
                    .map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#302f2c',
                          border: '1px solid #3e3d37',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '11.5px',
                          color: '#e8e5da',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.tint }} />
                        <span>{c.cat}</span>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#78756e',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '0 2px',
                          }}
                          title="ลบหมวดหมู่นี้"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
