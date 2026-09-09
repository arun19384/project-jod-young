import React, { useState, useEffect } from 'react';

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const modalBoxStyle = {
  background: '#262624',
  border: '1px solid #3a3936',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '400px',
  padding: '22px 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
  maxHeight: '88vh',
  overflowY: 'auto',
};

const inputStyle = {
  background: '#302f2c',
  border: '1px solid #3a3936',
  borderRadius: '12px',
  padding: '11px 14px',
  color: '#f0eee6',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

const labelStyle = {
  fontSize: '12px',
  color: '#8a8780',
  marginBottom: '4px',
  display: 'block',
};

const primaryBtnStyle = {
  flex: 1,
  background: '#d97757',
  color: '#1a1a18',
  border: 'none',
  borderRadius: '12px',
  padding: '12px',
  fontWeight: '600',
  fontSize: '13.5px',
  cursor: 'pointer',
};

const cancelBtnStyle = {
  background: 'transparent',
  border: '1px solid #45433c',
  color: '#a8a49a',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '13px',
  cursor: 'pointer',
};

function SheetGrabber() {
  return (
    <div
      style={{
        width: '36px',
        height: '4px',
        borderRadius: '99px',
        background: '#4a4843',
        margin: '-6px auto 6px',
        flex: 'none',
      }}
    />
  );
}

// 1. Edit Monthly Budget Modal
export function EditBudgetModal({ currentBudget, onSave, onClose }) {
  const [budget, setBudget] = useState(currentBudget || 45000);

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          ตั้งค่างบประมาณ / เงินเดือนรายเดือน
        </div>
        <div>
          <label style={labelStyle}>ยอดเงินรับประจำเดือน (บาท)</label>
          <input
            type="number"
            style={inputStyle}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={primaryBtnStyle} className="pressable" onClick={() => onSave(budget)}>
            บันทึก
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Add Bank Account Modal
export function AddAccountModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('ใช้จ่ายทั่วไป');
  const [amt, setAmt] = useState('');
  const [tint, setTint] = useState('#d97757');

  const colors = ['#d97757', '#c9a227', '#7fa3c9', '#6c9a76', '#9b8ec4'];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มบัญชีธนาคารใหม่
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อบัญชี (เช่น กสิกรไทย, Main, กรุงไทย)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="กสิกรไทย"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>หน้าที่ / โน้ต (เช่น ใช้จ่าย, เงินเก็บ, สำรอง)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ใช้จ่ายประจำวัน"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>ยอดเงินคงเหลือปัจจุบัน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="10000"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>สีแถบแท็ก</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => setTint(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: tint === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), role: role.trim(), amt: parseFloat(amt) || 0, tint });
            }}
          >
            เพิ่มบัญชี
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 2.1 Edit Bank Account Modal
export function EditAccountModal({ account, onSave, onClose }) {
  const [name, setName] = useState(account?.name || '');
  const [role, setRole] = useState(account?.role || '');
  const [amt, setAmt] = useState(account?.amt != null ? String(account.amt) : '');
  const [tint, setTint] = useState(account?.tint || '#d97757');

  const colors = ['#d97757', '#c9a227', '#7fa3c9', '#6c9a76', '#9b8ec4'];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          แก้ไขยอดเงินบัญชี {account?.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ยอดเงินคงเหลือปัจจุบัน (บาท)</label>
            <input
              type="number"
              style={{ ...inputStyle, fontSize: '18px', fontWeight: '600', color: '#6c9a76' }}
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>ชื่อบัญชี</label>
            <input
              type="text"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>หน้าที่ / โน้ต (เช่น ใช้จ่าย, เงินเก็บ, สำรอง)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ใช้จ่ายประจำวัน"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>สีแถบแท็ก</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => setTint(c)}
                  className="pressable"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: tint === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              const parsedAmt = parseFloat(amt);
              onSave({
                name: name.trim() || account.name,
                role: role.trim(),
                amt: isNaN(parsedAmt) ? (account.amt || 0) : parsedAmt,
                tint,
              });
            }}
          >
            บันทึกยอดเงิน
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Add Credit Card Modal
export function AddCardModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [cut, setCut] = useState('15');
  const [due, setDue] = useState('5');
  const [amt, setAmt] = useState('0');
  const [limit, setLimit] = useState('30000');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มบัตรเครดิตใหม่
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อบัตร (เช่น SCB, KTC, Citi)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="บัตร KTC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>วันตัดรอบ (วันที่)</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="15"
                value={cut}
                onChange={(e) => setCut(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วันครบกำหนดชำระ</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="5 ต.ค."
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>ยอดใช้ปัจจุบัน (บาท)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="0"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วงเงินบัตร (บาท)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="30000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                name: name.trim(),
                cut,
                due,
                amt: parseFloat(amt) || 0,
                limit: parseFloat(limit) || 30000,
                tint: '#d97757',
                status: `ตัดทุกวันที่ ${cut}`,
              });
            }}
          >
            บันทึกบัตร
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Pay Credit Card Modal
export function PayCardModal({ card, accounts = [], onConfirm, onClose }) {
  const [selectedAcc, setSelectedAcc] = useState(accounts[0]?.id || 'Main');
  const [amount, setAmount] = useState(card.amt || 0);

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          ชำระยอดหนี้ {card.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>หักเงินจากบัญชีธนาคาร</label>
            <select
              style={inputStyle}
              value={selectedAcc}
              onChange={(e) => setSelectedAcc(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (คงเหลือ {Math.round(a.amt).toLocaleString()} บาท)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>จำนวนเงินที่ต้องการชำระ (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => onConfirm(card.id, selectedAcc, amount)}
          >
            ยืนยันชำระ
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. Add Fixed Bill Modal
export function AddFixedModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [amt, setAmt] = useState('');
  const [day, setDay] = useState('15');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มค่าใช้จ่ายคงที่รายเดือน
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อรายการ (เช่น ค่าเช่าห้อง, เน็ตบ้าน, ประกัน)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ค่าอินเทอร์เน็ต"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>ยอดเงิน (บาท/เดือน)</label>
              <input
                type="number"
                style={inputStyle}
                placeholder="499"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>วันที่ต้องจ่ายของทุกเดือน</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="10"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), amt: parseFloat(amt) || 0, day, done: false });
            }}
          >
            บันทึกบิล
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 6. Add Installment Plan Modal
export function AddPlanModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [a, setA] = useState('');
  const [total, setTotal] = useState('10');
  const [paid, setPaid] = useState('0');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มรายการผ่อนชำระ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อสินค้าหรือสิ่งที่ผ่อน (เช่น iPhone, เครื่องซักผ้า)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="โทรศัพท์มือถือ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>ค่างวดต่อเดือน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="1500"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>จำนวนงวดทั้งหมด</label>
              <input
                type="number"
                style={inputStyle}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>จ่ายไปแล้วกี่งวด</label>
              <input
                type="number"
                style={inputStyle}
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                name: name.trim(),
                a: parseFloat(a) || 0,
                total: parseInt(total) || 10,
                paid: parseInt(paid) || 0,
              });
            }}
          >
            เพิ่มรายการผ่อน
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 7. Add Debt Modal
export function AddDebtModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [what, setWhat] = useState('');
  const [a, setA] = useState('');

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          เพิ่มรายการออกให้ก่อน / ติดเงิน
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>ชื่อเพื่อน / คนที่ติดเงิน</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="พี่นก"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>รายละเอียด (เช่น ค่าอาหาร, แท็กซี่)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="ค่าข้าวเที่ยง"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>จำนวนเงิน (บาท)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="350"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryBtnStyle}
            className="pressable"
            onClick={() => {
              if (!name.trim() || !a) return;
              onSave({ name: name.trim(), what: what.trim(), a: parseFloat(a) || 0, cleared: false });
            }}
          >
            บันทึก
          </button>
          <button style={cancelBtnStyle} className="pressable" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 7.5. Edit Transaction Modal (แก้ไขรายการธุรกรรม - ตัวเลข หมวดหมู่ ชื่อ บัญชี)
export function EditTransactionModal({
  tx,
  accounts = [],
  cards = [],
  onSave,
  onClose,
}) {
  if (!tx) return null;

  const [isIncome, setIsIncome] = useState(Boolean(tx.income));
  const [amount, setAmount] = useState(tx.a ? String(tx.a) : '');
  const [category, setCategory] = useState(tx.c || 'อื่นๆ');
  const [tint, setTint] = useState(tx.tint || '#8a8780');
  const [title, setTitle] = useState(tx.t || '');
  const [account, setAccount] = useState(tx.acct || 'บัญชีหลัก');
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);

  const PRESET_CATEGORIES = [
    { cat: 'อาหาร', tint: '#d97757', icon: '🍲' },
    { cat: 'ของใช้', tint: '#c9a227', icon: '🛒' },
    { cat: 'ชอปปิ้ง', tint: '#9b8ec4', icon: '🛍️' },
    { cat: 'เติมน้ำมัน', tint: '#7fa3c9', icon: '⛽' },
    { cat: 'รายรับ', tint: '#6c9a76', icon: '💰' },
    { cat: 'อื่นๆ', tint: '#8a8780', icon: '📝' },
  ];

  const handleSelectCat = (item) => {
    setCategory(item.cat);
    setTint(item.tint);
    if (item.cat === 'รายรับ') {
      setIsIncome(true);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
      return;
    }
    const finalTitle = title.trim() || category || 'ไม่ระบุ';
    const finalAccount = account.trim() || 'บัญชีหลัก';

    onSave(tx.id, {
      t: finalTitle,
      c: category,
      tint: tint || '#8a8780',
      a: parsedAmt,
      acct: finalAccount,
      income: isIncome,
    });
    onClose();
  };

  // Combine accounts and cards for selection
  const allWalletOptions = [
    ...accounts.map((a) => ({ id: a.id, name: a.name, type: 'bank', tint: a.tint || '#6c9a76' })),
    ...cards.map((c) => ({ id: c.id, name: c.name, type: 'card', tint: c.tint || '#9b8ec4' })),
  ];
  if (!allWalletOptions.some((w) => w.name === 'บัญชีหลัก' || w.name === 'Main')) {
    allWalletOptions.unshift({ id: 'main', name: 'บัญชีหลัก', type: 'bank', tint: '#6c9a76' });
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            แก้ไขรายการธุรกรรม
          </div>
          <span style={{ fontSize: '12px', color: '#8a8780' }}>
            {tx.date || ''} {tx.when || ''}
          </span>
        </div>

        {/* Income / Expense Toggle */}
        <div style={{ display: 'flex', background: '#1c1b18', borderRadius: '12px', padding: '3px', gap: '3px' }}>
          <button
            type="button"
            className="pressable"
            onClick={() => {
              setIsIncome(false);
              if (category === 'รายรับ') {
                setCategory('อาหาร');
                setTint('#d97757');
              }
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              background: !isIncome ? '#d97757' : 'transparent',
              color: !isIncome ? '#1a1a18' : '#8a8780',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🔴</span> รายจ่าย
          </button>
          <button
            type="button"
            className="pressable"
            onClick={() => {
              setIsIncome(true);
              setCategory('รายรับ');
              setTint('#6c9a76');
            }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '9px',
              border: 'none',
              background: isIncome ? '#6c9a76' : 'transparent',
              color: isIncome ? '#1a1a18' : '#8a8780',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🟢</span> รายรับ
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label style={labelStyle}>จำนวนเงิน (บาท) *</label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              step="any"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{
                ...inputStyle,
                fontSize: '24px',
                fontWeight: '700',
                padding: '12px 42px 12px 14px',
                color: isIncome ? '#6c9a76' : '#f0eee6',
                fontVariantNumeric: 'tabular-nums',
              }}
              autoFocus
            />
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8a8780',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              บ.
            </span>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>หมวดหมู่: <b style={{ color: tint }}>{category}</b></label>
            <button
              type="button"
              onClick={() => setShowCustomCat(!showCustomCat)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7fa3c9',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              {showCustomCat ? 'เลือกจากรายการ' : '+ ระบุเอง'}
            </button>
          </div>

          {showCustomCat ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="พิมพ์ชื่อหมวดหมู่..."
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                className="pressable"
                onClick={() => {
                  if (customCatInput.trim()) {
                    setCategory(customCatInput.trim());
                    setShowCustomCat(false);
                  }
                }}
                style={{
                  ...primaryBtnStyle,
                  flex: 'none',
                  padding: '0 16px',
                  background: '#3c3a35',
                  color: '#f0eee6',
                }}
              >
                ตกลง
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_CATEGORIES.map((catItem) => {
                const isSelected = category === catItem.cat;
                return (
                  <button
                    key={catItem.cat}
                    type="button"
                    className="pressable"
                    onClick={() => handleSelectCat(catItem)}
                    style={{
                      border: isSelected ? `1.5px solid ${catItem.tint}` : '1px solid #3a3936',
                      background: isSelected ? `${catItem.tint}22` : '#302f2c',
                      color: isSelected ? catItem.tint : '#d0cdc2',
                      borderRadius: '99px',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: isSelected ? '600' : '400',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{catItem.icon}</span>
                    <span>{catItem.cat}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Title / Description Input */}
        <div>
          <label style={labelStyle}>ชื่อรายการ / โน้ต</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ข้าวหมูกรอบ, ชาบู, ซื้อของเข้าบ้าน"
            style={inputStyle}
          />
        </div>

        {/* Account / Wallet Selector */}
        <div>
          <label style={labelStyle}>บัญชี / บัตรเครดิต</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
            }}
          >
            <optgroup label="บัญชีเงินฝาก">
              {allWalletOptions
                .filter((w) => w.type === 'bank')
                .map((w) => (
                  <option key={w.id} value={w.name}>
                    💳 {w.name}
                  </option>
                ))}
            </optgroup>
            {allWalletOptions.some((w) => w.type === 'card') && (
              <optgroup label="บัตรเครดิต">
                {allWalletOptions
                  .filter((w) => w.type === 'card')
                  .map((w) => (
                    <option key={w.id} value={w.name}>
                      💳 {w.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className="pressable"
            onClick={handleSubmit}
            style={{
              ...primaryBtnStyle,
              background: '#6c9a76',
              color: '#1a1a18',
            }}
          >
            ✓ บันทึกการแก้ไข
          </button>
          <button
            type="button"
            className="pressable"
            onClick={onClose}
            style={cancelBtnStyle}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. Settings & Clean Slate Modal
export function SettingsModal({ transactions = [], onReset, onClose, onPinConfigChange }) {
  // PIN settings state
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('jod_pin_enabled') === 'true');
  const [pinInput, setPinInput] = useState(() => localStorage.getItem('jod_app_pin') || '');
  const [pinTimeout, setPinTimeout] = useState(() => localStorage.getItem('jod_pin_timeout') || '0');
  const [pinFeedback, setPinFeedback] = useState('');

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('ยังไม่มีประวัติการทำรายการสำหรับส่งออก');
      return;
    }
    const header = ['วันที่', 'เวลา/ระบุ', 'รายการ', 'หมวดหมู่', 'บัญชี', 'จำนวนเงิน (บาท)', 'ประเภท'];
    const rows = transactions.map((t) => [
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
    link.setAttribute('download', `jod-all-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTogglePin = (e) => {
    const enabled = e.target.checked;
    setPinEnabled(enabled);
    localStorage.setItem('jod_pin_enabled', String(enabled));
    if (enabled && !localStorage.getItem('jod_app_pin')) {
      localStorage.setItem('jod_app_pin', '1234');
      setPinInput('1234');
    }
    if (onPinConfigChange) onPinConfigChange();
  };

  const handleSavePin = () => {
    if (pinInput.length !== 4) {
      alert('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      return;
    }
    localStorage.setItem('jod_app_pin', pinInput);
    setPinFeedback('✓ บันทึกรหัส PIN ใหม่เรียบร้อย');
    setTimeout(() => setPinFeedback(''), 2500);
    if (onPinConfigChange) onPinConfigChange();
  };

  const handleTimeoutChange = (e) => {
    const val = e.target.value;
    setPinTimeout(val);
    localStorage.setItem('jod_pin_timeout', val);
    if (onPinConfigChange) onPinConfigChange();
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          การตั้งค่าและฐานข้อมูล
        </div>

        {/* CSV Data Export */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ font: "600 13.5px 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📥 ส่งออกข้อมูล (CSV / Excel)</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#8a8780', lineHeight: 1.4 }}>
            ดาวน์โหลดไฟล์ .csv ที่มี UTF-8 BOM เปิดกับ Microsoft Excel, Google Sheets ได้ทันทีโดยภาษาไทยไม่เพี้ยน
          </div>
          <button
            onClick={handleExportCSV}
            className="pressable"
            style={{
              background: '#3c3a35',
              border: '1px solid #4a4842',
              borderRadius: '10px',
              padding: '10px',
              color: '#d0cdc2',
              fontSize: '12.5px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📊 ดาวน์โหลด CSV ({transactions.length} รายการ)
          </button>
        </div>

        {/* PIN Security Section */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ font: "600 13.5px 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒 ล็อคแอปด้วยรหัส PIN</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={handleTogglePin}
                style={{ accentColor: '#d97757', width: '17px', height: '17px' }}
              />
            </label>
          </div>

          {pinEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <div>
                <label style={labelStyle}>รหัส PIN 4 หลัก</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="1234"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ ...inputStyle, letterSpacing: '6px', fontSize: '16px', textAlign: 'center', width: '110px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="pressable"
                    style={{
                      background: '#d97757',
                      color: '#1a1a18',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0 14px',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>ล็อคอัตโนมัติเมื่อออกจากแอป</label>
                <select
                  value={pinTimeout}
                  onChange={handleTimeoutChange}
                  style={{ ...inputStyle, cursor: 'pointer', fontSize: '12px' }}
                >
                  <option value="0">ทันทีที่สลับแอป (Instant)</option>
                  <option value="60">หลังจากไม่ได้ใช้งาน 1 นาที</option>
                  <option value="300">หลังจากไม่ได้ใช้งาน 5 นาที</option>
                </select>
              </div>

              {pinFeedback && (
                <div style={{ fontSize: '11.5px', color: '#6c9a76' }}>
                  {pinFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Slate & Reset Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="pressable"
            style={{
              background: '#2c2b28',
              border: '1px solid #d97757',
              color: '#d97757',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={async () => {
              try {
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
              } catch (e) {}
              window.location.replace(window.location.origin + '?reload=' + Date.now());
            }}
          >
            🔄 ล้างแคช & โหลดเวอร์ชันล่าสุด (Force Reload)
          </button>
          <button
            className="pressable"
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              color: '#d0cdc2',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onClick={() => onReset(true)}
          >
            🧹 ล้างข้อมูลเป็น 0 (เริ่มใช้งานจริงด้วยตัวเอง)
          </button>
          <button
            className="pressable"
            style={{
              background: 'transparent',
              border: '1px solid #45433c',
              color: '#8a8780',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={() => onReset(false)}
          >
            🔄 โหลดข้อมูลตัวอย่างต้นแบบกลับมา
          </button>
        </div>

        <button style={{ ...cancelBtnStyle, width: '100%', marginTop: '4px' }} className="pressable" onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}

// 9. Transfer Between Accounts Modal
export function TransferModal({ accounts = [], onTransfer, onClose }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const fromAcc = accounts.find((a) => a.id === fromId);
  const toAcc = accounts.find((a) => a.id === toId);

  const numAmount = parseFloat(amount) || 0;
  const fromBalanceAfter = fromAcc ? fromAcc.amt - numAmount : 0;
  const toBalanceAfter = toAcc ? toAcc.amt + numAmount : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromId || !toId) {
      setErr('กรุณาเลือกบัญชีต้นทางและปลายทาง');
      return;
    }
    if (fromId === toId) {
      setErr('บัญชีต้นทางและปลายทางต้องไม่เป็นบัญชีเดียวกัน');
      return;
    }
    if (numAmount <= 0) {
      setErr('กรุณาระบุจำนวนเงินที่ต้องการโอน');
      return;
    }
    if (fromAcc && fromAcc.amt < numAmount) {
      setErr(`ยอดเงินใน ${fromAcc.name} ไม่เพียงพอ (มีอยู่ ${Math.round(fromAcc.amt).toLocaleString()} บาท)`);
      return;
    }
    setErr('');
    onTransfer({ fromId, toId, amount: numAmount, note });
  };

  return (
    <div style={modalOverlayStyle}>
      <form onSubmit={handleSubmit} style={modalBoxStyle} className="animate-spring-sheet">
        <SheetGrabber />
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔁 โอนเงินระหว่างบัญชี</span>
        </div>

        {/* From Account */}
        <div>
          <label style={labelStyle}>จากบัญชี (ต้นทาง)</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({Math.round(a.amt || 0).toLocaleString()} บ.)
              </option>
            ))}
          </select>
        </div>

        {/* To Account */}
        <div>
          <label style={labelStyle}>ไปยังบัญชี (ปลายทาง)</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === fromId}>
                {a.name} ({Math.round(a.amt || 0).toLocaleString()} บ.)
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input & Fast Presets */}
        <div>
          <label style={labelStyle}>จำนวนเงินที่โอน (บาท)</label>
          <input
            type="number"
            step="any"
            placeholder="0"
            style={{ ...inputStyle, fontSize: '18px', fontWeight: '600' }}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErr('');
            }}
            required
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {[100, 500, 1000].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(String((parseFloat(amount) || 0) + p))}
                style={{
                  flex: 1,
                  background: '#302f2c',
                  border: '1px solid #3e3d39',
                  color: '#d0cdc2',
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  padding: '6px 0',
                  cursor: 'pointer',
                }}
              >
                +{p}
              </button>
            ))}
            {fromAcc && fromAcc.amt > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(fromAcc.amt))}
                style={{
                  flex: 1,
                  background: 'rgba(217, 119, 87, 0.15)',
                  border: '1px solid rgba(217, 119, 87, 0.3)',
                  color: '#d97757',
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  padding: '6px 0',
                  cursor: 'pointer',
                }}
              >
                ทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Live Balance Preview */}
        {numAmount > 0 && fromAcc && toAcc && fromId !== toId && (
          <div style={{ background: '#201f1d', border: '1px solid #33322e', borderRadius: '12px', padding: '10px 12px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#8a8780' }}>
              • {fromAcc.name}: <span style={{ color: fromBalanceAfter < 0 ? '#d97757' : '#f0eee6' }}>{Math.round(fromBalanceAfter).toLocaleString()} บ.</span>
            </div>
            <div style={{ color: '#8a8780' }}>
              • {toAcc.name}: <span style={{ color: '#6c9a76' }}>{Math.round(toBalanceAfter).toLocaleString()} บ.</span>
            </div>
          </div>
        )}

        {/* Note / Memo */}
        <div>
          <label style={labelStyle}>บันทึกช่วยจำ (ไม่บังคับ)</label>
          <input
            type="text"
            placeholder="เช่น ย้ายเงินออม, ค่าขนม"
            style={inputStyle}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {err && <div style={{ color: '#d97757', fontSize: '12px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button type="button" style={cancelBtnStyle} onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" style={primaryBtnStyle}>
            ยืนยันการโอนเงิน
          </button>
        </div>
      </form>
    </div>
  );
}

// 10. Receipt Image Preview Modal
export function ReceiptPreviewModal({ src, title, onClose }) {
  if (!src) return null;
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1f1e1c',
          border: '1px solid #3a3936',
          borderRadius: '20px',
          maxWidth: '420px',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
        }}
        className="animate-spring-sheet"
      >
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2f2e2a' }}>
          <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
            🧾 {title || 'สลิป / ใบเสร็จ'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#353430',
              border: 'none',
              borderRadius: '99px',
              width: '26px',
              height: '26px',
              color: '#a8a49a',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', background: '#141412', maxHeight: '70vh', overflowY: 'auto' }}>
          <img
            src={src}
            alt="Receipt Slip"
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '12px',
              objectFit: 'contain',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          />
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #2f2e2a' }}>
          <button style={{ ...cancelBtnStyle, padding: '8px 16px' }} onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const walletName = (wallet.name === 'เงินสด/บัญชีหลัก' || wallet.name === 'Main') ? 'บัญชีหลัก' : wallet.name;
  const targetName = walletName.toLowerCase();
  const targetId = (wallet.id || '').toLowerCase();

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
    const acct = tx.acct.trim().toLowerCase();
    if (acct === targetName || acct === targetId) return true;
    if (targetName === 'บัญชีหลัก' && (acct === 'main' || acct === 'เงินสด/บัญชีหลัก')) return true;
    if (isCard) {
      if (acct.includes(targetName) || targetName.includes(acct)) return true;
      if (targetId && (acct === `บัตร ${targetId}` || acct === `บัตร${targetId}`)) return true;
      if (acct.includes('บัตร') && walletName.includes('บัตร')) {
        const cardLetter = walletName.replace('บัตร', '').trim().toLowerCase();
        if (cardLetter && acct.includes(cardLetter)) return true;
      }
      // Match parts of card name (e.g. "ktc" or "ใส")
      const nameParts = targetName.split(/\s+/).filter((p) => p.length > 1);
      if (nameParts.length > 0 && nameParts.some((p) => acct.includes(p))) return true;
    }
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
  const recordedOut = walletTxs.filter((t) => !t.income).reduce((sum, t) => sum + (t.a || 0), 0);
  const cardInitialAmt = Math.abs(wallet.amt || 0);
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
  const totalOut = walletTxs.filter((t) => !t.income).reduce((sum, t) => sum + (t.a || 0), 0);

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
  const cardAmount = Math.abs(wallet.amt || totalOut || 0);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div
        className="animate-spring-up"
        style={{
          ...modalBoxStyle,
          maxWidth: '480px',
          maxHeight: '88vh',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #33322e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#232220',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              {isCard ? '💳' : (walletName === 'บัญชีหลัก' ? '💰' : '🏦')}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ font: "600 16px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
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
            style={{
              background: '#353430',
              border: 'none',
              borderRadius: '99px',
              width: '28px',
              height: '28px',
              color: '#a8a49a',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div>
                <span style={{ font: "400 11.5px/1 'IBM Plex Sans Thai'", color: '#8a8780' }}>
                  {isCard ? 'ยอดที่รูดใช้ไป / ยอดค้างชำระ' : 'ยอดเงินคงเหลือในบัญชี'}
                </span>
                <div style={{ font: "600 28px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6', fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                  {isCard ? fmt(cardAmount) : fmt(wallet.amt)} <span style={{ fontSize: '14px', fontWeight: '400', color: '#78756e' }}>บาท</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isCard && onOpenPayCard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPayCard(wallet);
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
                    <span style={{ fontSize: '10.5px', color: '#d97757' }}>💳 รูดใช้จ่ายทั้งหมด</span>
                    <div style={{ font: "600 14px 'IBM Plex Sans Thai'", color: '#d97757', marginTop: '2px' }}>
                      -{fmt(totalOut || cardAmount)} บ.
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            <div style={{ display: 'flex', gap: '4px' }}>
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
                        <span>{tx.when || tx.date || 'วันนี้'}</span>
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
                    {onEditTransaction && !tx.isStatementLine && (
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
                    {onDeleteTransaction && !tx.isStatementLine && (
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

