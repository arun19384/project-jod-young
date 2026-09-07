import React, { useState } from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

const CATS = [
  { kw: ['กาแฟ', 'ชา', 'ลาเต้', 'อเมริกาโน่', 'starbucks', 'ชาเขียว', 'ชานม'], cat: 'กาแฟ', tint: '#c9a227', acct: 'Main' },
  { kw: ['ข้าว', 'อาหาร', 'ก๋วยเตี๋ยว', 'หมูกระทะ', 'ชาบู', 'กิน', 'เซเว่น', '7-11', 'ส้มตำ', 'ข้าวมันไก่', 'ขนม', 'กะเพรา'], cat: 'อาหาร', tint: '#d97757', acct: 'Main' },
  { kw: ['น้ำมัน', 'เติมน้ำมัน', 'ปตท', 'ptt', 'บางจาก', 'เชลล์'], cat: 'น้ำมันรถ', tint: '#7fa3c9', acct: 'Main' },
  { kw: ['แท็กซี่', 'วิน', 'bts', 'mrt', 'grab', 'ทางด่วน', 'ที่จอดรถ', 'รถเมล์'], cat: 'เดินทาง', tint: '#7fa3c9', acct: 'Main' },
  { kw: ['ค่าไฟ', 'ค่าน้ำ', 'เน็ต', 'โทรศัพท์', 'ประกันสังคม', 'ให้แม่', 'ค่าห้อง'], cat: 'คงที่', tint: '#9b8ec4', acct: 'Main' },
  { kw: ['บัตร', 'ผ่อน', 'ประกัน'], cat: 'บัตร/ผ่อน', tint: '#9b8ec4', acct: 'Credit' },
  { kw: ['เก็บ', 'ออม', 'saving'], cat: 'เงินเก็บ', tint: '#6c9a76', acct: 'Saving' },
  { kw: ['ออกให้', 'ยืม', 'ออกก่อน', 'จ่ายแทน'], cat: 'ออกให้ก่อน', tint: '#c9a227', acct: 'Main' },
  { kw: ['เงินเดือน', 'โบนัส', 'ได้เงิน', 'รับ', 'คืนเงิน', 'ขายของ'], cat: 'รายรับ', tint: '#6c9a76', acct: 'Main', income: true },
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

  const defaultAccount = availableAccounts[0]?.name || 'Main';

  const parse = (text) => {
    const raw = (text || '').trim();
    const m = raw.match(/(\d[\d,]*(?:\.\d+)?)/);
    const amount = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
    const words = raw.toLowerCase();
    const hit = CATS.find((c) => c.kw.some((k) => words.includes(k)));
    const name = raw.replace(/(\d[\d,]*(?:\.\d+)?)\s*(บาท)?/, '').trim();
    return {
      amount,
      name: name || (hit ? hit.cat : 'ไม่ระบุ'),
      cat: overrideCat || (hit ? hit.cat : 'อื่นๆ'),
      tint: hit ? hit.tint : '#8a8780',
      acct: overrideAcct || (hit ? hit.acct : defaultAccount),
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
    'กาแฟ 120',
    'ข้าว 65',
    'เติมน้ำมัน 900',
    'เซเว่น 180',
    'ออกให้เพื่อน 500',
    'โอนเงินเก็บ 5000',
  ];

  const todayList = transactions.filter((e) => e.today);
  const todayTotal = todayList
    .filter((e) => !e.income)
    .reduce((acc, e) => acc + e.a, 0);

  return (
    <div className="animate-fadein" style={{ padding: '6px 22px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ font: "600 15px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>จด</div>

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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="กาแฟ 120"
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
                  <span style={{ color: '#78756e' }}>หมวด:</span>
                  <span style={{ color: parsed.tint }}>{parsed.cat}</span>
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
                    }}
                  >
                    {availableAccounts.map((a) => (
                      <option key={a.id || a.name} value={a.name} style={{ background: '#262624', color: '#f0eee6' }}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    color: parsed.income ? '#6c9a76' : '#d97757',
                  }}
                >
                  {parsed.income ? 'รายรับ' : 'รายจ่าย'}
                </div>
              </>
            ) : (
              <div style={{ color: '#78756e', fontSize: '12px' }}>
                พิมพ์ของกับราคา เช่น ข้าว 65 แล้วกดบันทึก
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
              padding: '15px',
              background: '#d97757',
              color: '#1a1a18',
              font: "600 14px/1 'IBM Plex Sans Thai'",
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
              padding: '15px 16px',
              color: '#a8a49a',
              font: "500 13px/1 'IBM Plex Sans Thai'",
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {kind === 'out' ? 'จ่าย' : 'รับ'}
          </button>
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
                padding: '9px 12px',
                color: '#d0cdc2',
                font: "400 12.5px/1 'IBM Plex Sans Thai'",
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Transactions List (With Delete Ability) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>วันนี้</div>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#78756e', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(todayTotal)} บาท
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {todayList.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#78756e', fontSize: '13px' }}>
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
    </div>
  );
}
