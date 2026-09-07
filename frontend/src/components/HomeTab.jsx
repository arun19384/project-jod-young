import React from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export default function HomeTab({
  summary,
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

  return (
    <div className="animate-fadein" style={{ padding: '6px 22px 26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Month Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ font: "600 15px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>กันยายน</div>
          <div style={{ font: "400 12px/1.4 'IBM Plex Mono', monospace", color: '#78756e' }}>7 / 30</div>
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

      {/* Debts / Lent Money (With Add Button) */}
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

      {/* Recent Transactions (With Delete Ability) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
          รายการล่าสุด (คลิก ✕ เพื่อลบและคืนยอดเงิน)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#78756e', fontSize: '12.5px' }}>
              ยังไม่มีรายการธุรกรรม
            </div>
          ) : (
            recent.map((e) => (
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
