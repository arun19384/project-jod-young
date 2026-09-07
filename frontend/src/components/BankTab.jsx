import React, { useState } from 'react';
import AnimatedNumber from './AnimatedNumber.jsx';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export default function BankTab({
  data,
  onToggleFixed,
  onDeleteFixed,
  onDeleteAccount,
  onDeleteCard,
  onOpenAddAccount,
  onOpenAddCard,
  onOpenAddFixed,
  onOpenPayCard,
}) {
  const [openCard, setOpenCard] = useState(null);

  const accounts = data?.accounts || [];
  const cards = data?.cards || [];
  const fixed = data?.fixed || [];
  const bankTotal = data?.bankTotal || 0;
  const fixedTotal = fixed.reduce((acc, f) => acc + (f.amt || 0), 0);

  return (
    <div className="animate-fadein" style={{ padding: '6px 22px 26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header with Add Account Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ font: "600 15px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>บัญชีธนาคาร</div>
          <div style={{ font: "400 12px/1.4 'IBM Plex Sans Thai'", color: '#78756e', fontVariantNumeric: 'tabular-nums' }}>
            รวม <AnimatedNumber value={bankTotal} duration={500} /> บาท
          </div>
        </div>
        <button
          onClick={onOpenAddAccount}
          className="pressable"
          style={{
            background: 'transparent',
            border: '1px solid #45433c',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '11.5px',
            color: '#d0cdc2',
            cursor: 'pointer',
          }}
        >
          + เพิ่มบัญชี
        </button>
      </div>

      {/* Bank Accounts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {accounts.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', color: '#78756e', fontSize: '12px' }}>
            ยังไม่มีบัญชีธนาคาร (กดเพิ่มบัญชีได้เลย)
          </div>
        ) : (
          accounts.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '13px',
                background: '#2c2b28',
                border: '1px solid #37362f',
                borderRadius: '16px',
                padding: '14px 15px',
              }}
            >
              <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '99px', background: b.tint || '#d97757' }} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ font: "500 14px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
                  {b.name === 'เงินสด/บัญชีหลัก' || b.name === 'Main' ? 'บัญชีหลัก' : b.name}
                </div>
                <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>{b.role}</div>
              </div>
              <div style={{ font: "600 16px/1 'IBM Plex Sans Thai'", color: '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedNumber value={b.amt} duration={500} />
              </div>
              {onDeleteAccount && accounts.length > 1 && (
                <button
                  onClick={() => onDeleteAccount(b.id)}
                  title="ลบบัญชีนี้"
                  className="pressable"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#5a5852',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '4px',
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

      {/* Credit Cards Section with Add Card Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>บัตรเครดิต</div>
          <button
            onClick={onOpenAddCard}
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
            + เพิ่มบัตร
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cards.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#78756e', fontSize: '12px' }}>
              ยังไม่มีข้อมูลบัตรเครดิต
            </div>
          ) : (
            cards.map((c) => {
              const isOpen = openCard === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    background: '#302f2c',
                    border: '1px solid #3a3936',
                    borderRadius: '18px',
                    padding: '15px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ font: "500 14px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>{c.name}</div>
                      <div style={{ font: "400 11px/1.3 'IBM Plex Mono', monospace", color: '#78756e' }}>
                        ตัด {c.cut} · จ่าย {c.due}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <div style={{ font: "600 19px/1 'IBM Plex Sans Thai'", color: '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(c.amt)}
                      </div>
                      <div
                        style={{
                          font: "500 10.5px/1 'IBM Plex Sans Thai'",
                          color: c.tint || '#d97757',
                          background: c.chipBg || 'rgba(255,255,255,0.05)',
                          padding: '4px 7px',
                          borderRadius: '6px',
                        }}
                      >
                        {c.status}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '5px', borderRadius: '99px', background: '#3a3833', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '99px',
                        background: c.tint || '#d97757',
                        width: `${c.pct}%`,
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button
                      onClick={() => setOpenCard(isOpen ? null : c.id)}
                      className="pressable"
                      style={{
                        flex: 1,
                        border: '1px solid #45433c',
                        background: 'transparent',
                        borderRadius: '11px',
                        padding: '11px',
                        color: isOpen ? '#d97757' : '#a8a49a',
                        font: "500 12px/1 'IBM Plex Sans Thai'",
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isOpen ? 'ปิด' : c.pdfLabel || 'แนบ PDF เทียบยอด'}
                    </button>
                    <button
                      onClick={() => onOpenPayCard && onOpenPayCard(c)}
                      className="pressable"
                      style={{
                        flex: 'none',
                        border: '1px solid #45433c',
                        background: 'transparent',
                        borderRadius: '11px',
                        padding: '11px 13px',
                        color: '#d0cdc2',
                        font: "500 12px/1 'IBM Plex Sans Thai'",
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6c9a76';
                        e.currentTarget.style.color = '#6c9a76';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#45433c';
                        e.currentTarget.style.color = '#d0cdc2';
                      }}
                    >
                      💳 จ่ายแล้ว
                    </button>
                    {onDeleteCard && (
                      <button
                        onClick={() => onDeleteCard(c.id)}
                        title="ลบบัตรนี้"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#5a5852',
                          cursor: 'pointer',
                          padding: '0 4px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* PDF Statement Reconcile Dropdown */}
                  {isOpen && (
                    <div
                      className="animate-pop"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        borderTop: '1px solid #3a3936',
                        paddingTop: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ font: "500 11.5px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                          กระทบยอดกับบิล PDF
                        </div>
                        <div style={{ font: "400 11px/1 'IBM Plex Mono', monospace", color: '#78756e' }}>
                          {c.pdfName}
                        </div>
                      </div>
                      {c.lines &&
                        c.lines.map((l, lIdx) => (
                          <div key={lIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                flex: 'none',
                                borderRadius: '5px',
                                background: l.bg || '#6c9a76',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                font: "600 10px/1 'IBM Plex Mono', monospace",
                                color: '#1a1a18',
                              }}
                            >
                              {l.mark}
                            </div>
                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                                font: "400 12.5px/1.3 'IBM Plex Sans Thai'",
                                color: '#d0cdc2',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {l.name}
                            </div>
                            <div
                              style={{
                                font: "400 12.5px/1 'IBM Plex Sans Thai'",
                                color: l.tint || '#d0cdc2',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {fmt(l.amt)}
                            </div>
                          </div>
                        ))}
                      <div style={{ font: "400 11.5px/1.4 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                        {c.pdfSummary}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Monthly Recurring Bills List with Add Fixed Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "500 12px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            คงที่ทุกเดือน · {fmt(fixedTotal)}
          </div>
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
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {fixed.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#78756e', fontSize: '12px' }}>
              ไม่มีบิลคงที่
            </div>
          ) : (
            fixed.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: '11px 2px',
                  borderBottom: '1px solid #2f2e2b',
                }}
              >
                <div
                  onClick={() => onToggleFixed && onToggleFixed(f.id)}
                  className="pressable"
                  style={{
                    width: '18px',
                    height: '18px',
                    flex: 'none',
                    borderRadius: '5px',
                    background: f.done ? '#6c9a76' : 'transparent',
                    border: `1px solid ${f.done ? '#6c9a76' : '#45433c'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: "600 10px/1 'IBM Plex Mono', monospace",
                    color: '#1a1a18',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.done ? '✓' : ''}
                </div>
                <div
                  onClick={() => onToggleFixed && onToggleFixed(f.id)}
                  style={{ flex: 1, font: "400 13.5px/1.3 'IBM Plex Sans Thai'", color: '#e8e5da', cursor: 'pointer' }}
                >
                  {f.name}
                </div>
                <div style={{ font: "400 11px/1 'IBM Plex Mono', monospace", color: '#78756e' }}>ว.{f.day}</div>
                <div
                  style={{
                    font: "500 13.5px/1 'IBM Plex Sans Thai'",
                    color: '#e8e5da',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: '52px',
                    textAlign: 'right',
                  }}
                >
                  {fmt(f.amt)}
                </div>
                {onDeleteFixed && (
                  <button
                    onClick={() => onDeleteFixed(f.id)}
                    title="ลบบิลนี้"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#5a5852',
                      cursor: 'pointer',
                      padding: '2px 4px',
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
    </div>
  );
}
