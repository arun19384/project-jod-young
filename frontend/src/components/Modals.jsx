import React, { useState, useEffect } from 'react';
import { fetchDBStatus, connectDB } from '../services/api.js';

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

// 8. Settings & Clean Slate & TiDB Cloud Connection Modal
export function SettingsModal({ transactions = [], onReset, onClose, onPinConfigChange }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [dbUrlInput, setDbUrlInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState('');

  // PIN settings state
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('jod_pin_enabled') === 'true');
  const [pinInput, setPinInput] = useState(() => localStorage.getItem('jod_app_pin') || '');
  const [pinTimeout, setPinTimeout] = useState(() => localStorage.getItem('jod_pin_timeout') || '0');
  const [pinFeedback, setPinFeedback] = useState('');

  useEffect(() => {
    fetchDBStatus().then((res) => {
      setDbStatus(res);
      setDbUrlInput(res.dbURL || 'mysql://2S6Vrj3kFBYbSKh.root:<PASSWORD>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sys');
    }).catch(() => {});
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setMsg('');
    try {
      const res = await connectDB(dbUrlInput);
      setMsg('🟢 ' + res.message);
      fetchDBStatus().then(setDbStatus).catch(() => {});
    } catch (err) {
      setMsg('⚠️ ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

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

        {/* Database Connection Panel */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ font: "600 13.5px 'IBM Plex Sans Thai'", color: '#f0eee6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>☁️ TiDB Cloud / MySQL</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '99px',
                background: dbStatus?.isMySQL ? 'rgba(108,154,118,0.2)' : 'rgba(217,119,87,0.2)',
                color: dbStatus?.isMySQL ? '#6c9a76' : '#d97757',
                border: `1px solid ${dbStatus?.isMySQL ? '#6c9a76' : '#d97757'}`,
              }}
            >
              {dbStatus?.mode || 'กำลังตรวจสอบ...'}
            </span>
          </div>

          <div>
            <label style={labelStyle}>MySQL / TiDB Cloud Connection String</label>
            <input
              type="text"
              style={{ ...inputStyle, fontSize: '11.5px', fontFamily: "'IBM Plex Mono', monospace" }}
              value={dbUrlInput}
              onChange={(e) => setDbUrlInput(e.target.value)}
              placeholder="mysql://user:pass@host:4000/db"
            />
          </div>

          {msg && (
            <div style={{ fontSize: '12px', color: msg.startsWith('🟢') ? '#6c9a76' : '#d97757', lineHeight: 1.4 }}>
              {msg}
            </div>
          )}

          {!dbStatus?.isMySQL && dbStatus?.lastError && (
            <div style={{ fontSize: '11px', color: '#8a8780', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px' }}>
              💡 หากขึ้น Access Denied: ตรวจสอบว่าใน TiDB Cloud ได้คลิก Reset Password และในแถบ Security ได้เปิด <b>Allow Access from Anywhere (0.0.0.0/0)</b> แล้วหรือไม่
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="pressable"
            style={{
              background: '#d97757',
              color: '#1a1a18',
              border: 'none',
              borderRadius: '10px',
              padding: '9px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {connecting ? 'กำลังเชื่อมต่อ...' : '🔌 เชื่อมต่อฐานข้อมูล (Connect)'}
          </button>
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
