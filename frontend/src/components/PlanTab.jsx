import React from 'react';
import AnimatedNumber from './AnimatedNumber.jsx';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

export default function PlanTab({ data, onOpenAddPlan, onPayPlan, onDeletePlan }) {
  const monthlyTotal = data?.monthlyTotal || 0;
  const remainingTotal = data?.remainingTotal || 0;
  const plans = data?.plans || [];

  return (
    <div className="animate-fadein" style={{ padding: '6px 22px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Overview Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "600 15px/1.4 'IBM Plex Sans Thai'", color: '#f0eee6' }}>รายการผ่อนชำระ</div>
          <button
            onClick={onOpenAddPlan}
            className="pressable"
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '11.5px',
              color: '#d0cdc2',
              cursor: 'pointer',
            }}
          >
            + เพิ่มรายการผ่อน
          </button>
        </div>

        <div
          style={{
            background: '#302f2c',
            border: '1px solid #3a3936',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            gap: '14px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>ยอดผ่อนต่อเดือน</div>
            <div style={{ font: "600 24px/1 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={monthlyTotal} duration={500} />
            </div>
          </div>
          <div style={{ width: '1px', background: '#3a3936' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>ยอดผ่อนเหลือทั้งหมด</div>
            <div style={{ font: "600 24px/1 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={remainingTotal} duration={500} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {plans.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#78756e', fontSize: '13px' }}>
            ไม่มีรายการผ่อนชำระ (สามารถกดเพิ่มรายการใหม่ได้)
          </div>
        ) : (
          plans.map((p) => {
            const remainCount = p.total - p.paid;
            const remainAmt = p.a * remainCount;
            const isFinished = p.paid >= p.total;

            return (
              <div
                key={p.id}
                style={{
                  background: '#2c2b28',
                  border: '1px solid #37362f',
                  borderRadius: '16px',
                  padding: '14px 15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ font: "500 14px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>{p.name}</div>
                    <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                      {isFinished ? 'ผ่อนครบทุกงวดแล้ว' : `เหลือ ${fmt(remainAmt)} บาท`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <div style={{ font: "600 15px/1 'IBM Plex Sans Thai'", color: '#e8e5da', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(p.a)}/ด.
                    </div>
                    <div style={{ font: "400 10.5px/1 'IBM Plex Mono', monospace", color: '#78756e' }}>
                      {p.paid}/{p.total}
                    </div>
                  </div>
                </div>

                {/* Pips Bar */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: p.total }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '99px',
                        background: i < p.paid ? '#d97757' : '#3f3d38',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ font: "400 11px/1.3 'IBM Plex Sans Thai'", color: '#78756e' }}>
                    {p.endsAt || (remainCount === 0 ? 'จบแล้ว' : `อีก ${remainCount} งวด`)}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!isFinished && onPayPlan && (
                      <button
                        onClick={() => onPayPlan(p.id)}
                        className="pressable"
                        style={{
                          border: '1px solid #d97757',
                          background: 'rgba(217,119,87,0.15)',
                          color: '#d97757',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        +1 จ่ายงวดนี้
                      </button>
                    )}
                    {onDeletePlan && (
                      <button
                        onClick={() => onDeletePlan(p.id)}
                        title="ลบรายการนี้"
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
