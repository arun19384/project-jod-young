import React, { useState, useEffect } from 'react';
import { fetchDBStatus, connectDB } from '../services/api.js';

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(3px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const modalBoxStyle = {
  background: '#262624',
  border: '1px solid #3a3936',
  borderRadius: '20px',
  width: '100%',
  maxWidth: '380px',
  padding: '20px 20px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
  maxHeight: '90vh',
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

// 1. Edit Monthly Budget Modal
export function EditBudgetModal({ currentBudget, onSave, onClose }) {
  const [budget, setBudget] = useState(currentBudget || 45000);

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-pop">
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
          <button style={primaryBtnStyle} onClick={() => onSave(budget)}>
            บันทึก
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), role: role.trim(), amt: parseFloat(amt) || 0, tint });
            }}
          >
            เพิ่มบัญชี
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
            onClick={() => onConfirm(card.id, selectedAcc, amount)}
          >
            ยืนยันชำระ
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), amt: parseFloat(amt) || 0, day, done: false });
            }}
          >
            บันทึกบิล
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
          <button style={cancelBtnStyle} onClick={onClose}>
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
      <div style={modalBoxStyle} className="animate-pop">
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
            onClick={() => {
              if (!name.trim() || !a) return;
              onSave({ name: name.trim(), what: what.trim(), a: parseFloat(a) || 0, cleared: false });
            }}
          >
            บันทึก
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. Settings & Clean Slate & TiDB Cloud Connection Modal
export function SettingsModal({ onReset, onClose }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [dbUrlInput, setDbUrlInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState('');

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

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle} className="animate-pop">
        <div style={{ font: "600 16px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>
          การตั้งค่าและฐานข้อมูล
        </div>

        {/* Database Connection Panel */}
        <div style={{ background: '#302f2c', border: '1px solid #3a3936', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#f0eee6' }}>
              สถานะ: {dbStatus?.isMySQL ? '🟢 เชื่อมต่อ TiDB Cloud สำเร็จ' : '🟡 โหมดบันทึกลงไฟล์ (Local)'}
            </span>
          </div>

          <div>
            <label style={labelStyle}>MySQL / TiDB Connection URL</label>
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

        <button style={{ ...cancelBtnStyle, width: '100%', marginTop: '4px' }} onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
