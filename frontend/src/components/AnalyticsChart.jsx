import React, { useState, useMemo } from 'react';
import { isSystemTransaction, isTransactionInCurrentMonth } from '../utils/transactionDate.js';

const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');

const DEFAULT_CATEGORY_COLORS = {
  'อาหาร': '#d97757',
  'ของใช้': '#c9a227',
  'ชอปปิ้ง': '#9b8ec4',
  'เติมน้ำมัน': '#7fa3c9',
  'โอนเงิน': '#5e81ac',
  'ผ่อนชำระ': '#e06c75',
  'บิล/รายเดือน': '#bf616a',
  'อื่นๆ': '#8a8780',
};

export default function AnalyticsChart({ transactions = [] }) {
  const [viewMode, setViewMode] = useState('donut'); // 'donut' or 'bar'
  const [selectedCat, setSelectedCat] = useState(null);

  // Group transactions by category (only expenses, excluding income)
  const { categoryData, totalExpense } = useMemo(() => {
    const expenseTx = transactions.filter((t) => !t.income && !isSystemTransaction(t) && isTransactionInCurrentMonth(t));
    const groups = {};
    let total = 0;

    expenseTx.forEach((tx) => {
      const cat = tx.c || 'อื่นๆ';
      const amt = Number(tx.a) || 0;
      total += amt;
      if (!groups[cat]) {
        groups[cat] = {
          name: cat,
          amount: 0,
          count: 0,
          tint: tx.tint || DEFAULT_CATEGORY_COLORS[cat] || '#8a8780',
        };
      }
      groups[cat].amount += amt;
      groups[cat].count += 1;
    });

    const list = Object.values(groups).sort((a, b) => b.amount - a.amount);
    return { categoryData: list, totalExpense: total };
  }, [transactions]);

  if (totalExpense === 0 || categoryData.length === 0) {
    return (
      <div
        style={{
          background: '#2c2b28',
          border: '1px solid #37362f',
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center',
          color: '#78756e',
          fontSize: '13px',
        }}
      >
        📊 ยังไม่มีข้อมูลค่าใช้จ่ายสำหรับวิเคราะห์
      </div>
    );
  }

  // Calculate Donut Segments
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const donutSegments = categoryData.map((cat) => {
    const pct = totalExpense > 0 ? cat.amount / totalExpense : 0;
    const strokeDash = pct * circumference;
    const strokeOffset = -accumulatedAngle;
    accumulatedAngle += strokeDash;
    return {
      ...cat,
      pct: Math.round(pct * 100),
      strokeDash,
      strokeOffset,
    };
  });

  const activeCategory = selectedCat
    ? categoryData.find((c) => c.name === selectedCat)
    : null;

  return (
    <div
      style={{
        background: '#2c2b28',
        border: '1px solid #37362f',
        borderRadius: '20px',
        padding: '18px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Header with View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ font: "600 14.5px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📊 สถิติค่าใช้จ่าย</span>
            <span style={{ fontSize: '11.5px', color: '#8a8780', fontWeight: '400' }}>
              ({categoryData.length} หมวดหมู่)
            </span>
          </div>
          <div style={{ font: "400 11.5px/1.3 'IBM Plex Sans Thai'", color: '#8a8780', marginTop: '2px' }}>
            รวม {fmt(totalExpense)} บาท
          </div>
        </div>

        <div style={{ display: 'flex', background: '#20201e', padding: '3px', borderRadius: '10px', border: '1px solid #383733' }}>
          <button
            onClick={() => setViewMode('donut')}
            className="pressable"
            style={{
              background: viewMode === 'donut' ? '#3c3a35' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              color: viewMode === 'donut' ? '#f0eee6' : '#78756e',
              fontSize: '11px',
              fontWeight: '500',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            โดนัท
          </button>
          <button
            onClick={() => setViewMode('bar')}
            className="pressable"
            style={{
              background: viewMode === 'bar' ? '#3c3a35' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              color: viewMode === 'bar' ? '#f0eee6' : '#78756e',
              fontSize: '11px',
              fontWeight: '500',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            แท่ง
          </button>
        </div>
      </div>

      {/* Chart Representation */}
      {viewMode === 'donut' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '8px 0' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', flex: 'none' }}>
            <svg
              viewBox="0 0 160 160"
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(-90deg)',
                overflow: 'visible',
              }}
            >
              {donutSegments.map((seg) => {
                const isSelected = selectedCat === seg.name;
                return (
                  <circle
                    key={seg.name}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={seg.tint}
                    strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${seg.strokeDash} ${circumference - seg.strokeDash}`}
                    strokeDashoffset={seg.strokeOffset}
                    strokeLinecap="butt"
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 0.15s, opacity 0.15s',
                      opacity: selectedCat && !isSelected ? 0.45 : 1,
                    }}
                    onClick={() => setSelectedCat(isSelected ? null : seg.name)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Info */}
            <div
              onClick={() => setSelectedCat(null)}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '10px',
              }}
            >
              <div style={{ font: "600 13.5px/1.2 'IBM Plex Sans Thai'", color: activeCategory ? activeCategory.tint : '#d97757' }}>
                {activeCategory ? activeCategory.name : 'ทั้งหมด'}
              </div>
              <div style={{ font: "600 14px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                {fmt(activeCategory ? activeCategory.amount : totalExpense)}
              </div>
              <div style={{ fontSize: '10px', color: '#78756e' }}>
                {activeCategory ? `${activeCategory.pct}%` : 'บาท'}
              </div>
            </div>
          </div>

          {/* Quick Category Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            {categoryData.slice(0, 4).map((c) => {
              const isSelected = selectedCat === c.name;
              const pct = Math.round((c.amount / totalExpense) * 100);
              return (
                <div
                  key={c.name}
                  onClick={() => setSelectedCat(isSelected ? null : c.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '4px 6px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '99px', background: c.tint, flex: 'none' }} />
                    <span style={{ fontSize: '12px', color: isSelected ? '#fff' : '#d0cdc2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#8a8780', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Bar Chart View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
          {categoryData.map((c) => {
            const pct = Math.round((c.amount / totalExpense) * 100);
            const isSelected = selectedCat === c.name;
            return (
              <div
                key={c.name}
                onClick={() => setSelectedCat(isSelected ? null : c.name)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  opacity: selectedCat && !isSelected ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: isSelected ? '#fff' : '#d0cdc2', fontWeight: isSelected ? '600' : '400' }}>
                    {c.name} ({c.count} รายการ)
                  </span>
                  <span style={{ color: '#f0eee6', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(c.amount)} บ. <span style={{ color: '#78756e', fontSize: '11px' }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: '7px', background: '#1f1e1c', borderRadius: '99px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: c.tint,
                      borderRadius: '99px',
                      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Filter Hint / Reset */}
      {selectedCat && (
        <div
          onClick={() => setSelectedCat(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(217, 119, 87, 0.12)',
            border: '1px solid rgba(217, 119, 87, 0.3)',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '11.5px',
            color: '#d97757',
            cursor: 'pointer',
          }}
        >
          <span>กำลังกรองดูเฉพาะ: <b>{selectedCat}</b></span>
          <span>แตะเพื่อล้างตัวกรอง ✕</span>
        </div>
      )}
    </div>
  );
}
