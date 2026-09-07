import React, { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab.jsx';
import AddTab from './components/AddTab.jsx';
import BankTab from './components/BankTab.jsx';
import PlanTab from './components/PlanTab.jsx';
import {
  EditBudgetModal,
  AddAccountModal,
  AddCardModal,
  PayCardModal,
  AddFixedModal,
  AddPlanModal,
  AddDebtModal,
  SettingsModal,
} from './components/Modals.jsx';
import {
  fetchSummary,
  fetchTransactions,
  addTransaction,
  deleteTransaction,
  fetchDebts,
  addDebt,
  toggleDebt,
  deleteDebt,
  fetchAccounts,
  addAccount,
  deleteAccount,
  addCard,
  payCard,
  deleteCard,
  toggleFixed,
  addFixed,
  deleteFixed,
  fetchPlans,
  addPlan,
  payPlan,
  deletePlan,
  updateBudget,
  resetData,
} from './services/api.js';

// SVG Icons for Bottom Navigation
function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d97757' : '#8a8780'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" fill={active ? 'rgba(217, 119, 87, 0.22)' : 'none'} />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function AddIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d97757' : '#8a8780'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill={active ? 'rgba(217, 119, 87, 0.22)' : 'none'} />
    </svg>
  );
}

function BankIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d97757' : '#8a8780'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" fill={active ? 'rgba(217, 119, 87, 0.22)' : 'none'} />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="6" cy="15" r="1.5" fill={active ? '#d97757' : '#8a8780'} />
    </svg>
  );
}

function PlanIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#d97757' : '#8a8780'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" fill={active ? 'rgba(217, 119, 87, 0.22)' : 'none'} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </svg>
  );
}

const TABS = [
  { id: 'home', label: 'สรุป', Icon: HomeIcon },
  { id: 'add', label: 'จด', Icon: AddIcon },
  { id: 'bank', label: 'บัญชี', Icon: BankIcon },
  { id: 'plan', label: 'ผ่อน', Icon: PlanIcon },
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('UI Crash caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#f0eee6' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>เกิดข้อผิดพลาดในการแสดงผล</div>
          <div style={{ fontSize: '12px', color: '#d97757', marginBottom: '14px', fontFamily: 'monospace' }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              background: '#d97757',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#1a1a18',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            รีเฟรชหน้าใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [summary, setSummary] = useState({
    income: 45000,
    spent: 0,
    left: 45000,
    spentPct: 0,
    fixedTotal: 0,
    fixedDone: 0,
    fixedTotalCount: 0,
    planMonthly: 0,
    planCount: 0,
    dues: [],
    debts: [],
    debtTotal: 0,
    recent: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [accountsData, setAccountsData] = useState({
    accounts: [],
    cards: [],
    fixed: [],
    bankTotal: 0,
  });
  const [plansData, setPlansData] = useState({
    monthlyTotal: 0,
    remainingTotal: 0,
    plans: [],
  });
  const [backendOnline, setBackendOnline] = useState(false);

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [payCardTarget, setPayCardTarget] = useState(null);
  const [showAddFixedModal, setShowAddFixedModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // PWA & iOS detection states
  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      window.innerWidth <= 768 ||
      window.navigator.standalone ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    );
  };

  const [isRealMobile, setIsRealMobile] = useState(checkIsMobile);

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  // Safe localStorage helper for iOS Safari private mode
  const getStoredItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const setStoredItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignored if storage is restricted
    }
  };

  const [showIosPrompt, setShowIosPrompt] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      return Boolean(isIos && !isStandalone && !getStoredItem('ios_pwa_dismissed'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      setIsRealMobile(checkIsMobile());
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Keep window.scrollY locked to 0 on iOS so page never shifts up
    const handleScrollLock = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScrollLock, { passive: true });

    // When virtual keyboard closes or inputs blur, reset scroll position instantly
    const handleFocusOut = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 50);
    };
    window.addEventListener('focusout', handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleScrollLock);
      window.visualViewport.addEventListener('scroll', handleScrollLock);
    }

    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('scroll', handleScrollLock);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleScrollLock);
        window.visualViewport.removeEventListener('scroll', handleScrollLock);
      }
      clearInterval(clockTimer);
    };
  }, []);

  const loadData = async () => {
    try {
      const [sum, txs, accts, plans] = await Promise.all([
        fetchSummary(),
        fetchTransactions(),
        fetchAccounts(),
        fetchPlans(),
      ]);
      setSummary(sum);
      setTransactions(txs);
      setAccountsData(accts);
      setPlansData(plans);
      setBackendOnline(true);
    } catch (err) {
      console.warn('API Error or connecting to local Go backend:', err);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleAddTransaction = async (newTx) => {
    try {
      await addTransaction(newTx);
      await loadData();
      setTab('home');
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleToggleDebt = async (id) => {
    try {
      await toggleDebt(id);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle debt:', err);
    }
  };

  const handleAddDebt = async (debtData) => {
    try {
      await addDebt(debtData);
      await loadData();
      setShowAddDebtModal(false);
    } catch (err) {
      console.error('Failed to add debt:', err);
    }
  };

  const handleDeleteDebt = async (id) => {
    try {
      await deleteDebt(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete debt:', err);
    }
  };

  const handleToggleFixed = async (id) => {
    try {
      await toggleFixed(id);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle fixed bill:', err);
    }
  };

  const handleAddFixed = async (fixedData) => {
    try {
      await addFixed(fixedData);
      await loadData();
      setShowAddFixedModal(false);
    } catch (err) {
      console.error('Failed to add fixed bill:', err);
    }
  };

  const handleDeleteFixed = async (id) => {
    try {
      await deleteFixed(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete fixed bill:', err);
    }
  };

  const handleAddAccount = async (accData) => {
    try {
      await addAccount(accData);
      await loadData();
      setShowAddAccountModal(false);
    } catch (err) {
      console.error('Failed to add account:', err);
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteAccount(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const handleAddCard = async (cardData) => {
    try {
      await addCard(cardData);
      await loadData();
      setShowAddCardModal(false);
    } catch (err) {
      console.error('Failed to add card:', err);
    }
  };

  const handleConfirmPayCard = async (cardId, fromAccountId, amount) => {
    try {
      await payCard(cardId, fromAccountId, amount);
      await loadData();
      setPayCardTarget(null);
    } catch (err) {
      console.error('Failed to pay card:', err);
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await deleteCard(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleAddPlan = async (planData) => {
    try {
      await addPlan(planData);
      await loadData();
      setShowAddPlanModal(false);
    } catch (err) {
      console.error('Failed to add plan:', err);
    }
  };

  const handlePayPlan = async (planId) => {
    try {
      const defaultAcc = accountsData?.accounts?.[0]?.id || 'Main';
      await payPlan(planId, defaultAcc);
      await loadData();
    } catch (err) {
      console.error('Failed to pay plan:', err);
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await deletePlan(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  const handleSaveBudget = async (newBudget) => {
    try {
      await updateBudget(newBudget);
      await loadData();
      setShowBudgetModal(false);
    } catch (err) {
      console.error('Failed to update budget:', err);
    }
  };

  const handleReset = async (cleanSlate) => {
    try {
      await resetData(cleanSlate);
      await loadData();
      setShowSettingsModal(false);
      setTab('home');
    } catch (err) {
      console.error('Failed to reset data:', err);
    }
  };

  // Get available accounts and cards list for dropdowns
  const availableAccounts = [
    ...(accountsData?.accounts || []),
    ...(accountsData?.cards || []),
  ];

  const content = (
    <div
      style={{
        position: isRealMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: isRealMobile ? '100%' : isMobileFrame ? '390px' : '640px',
        height: isRealMobile ? '100dvh' : isMobileFrame ? '844px' : '90vh',
        maxHeight: isRealMobile ? '100dvh' : isMobileFrame ? '844px' : '90vh',
        flex: isRealMobile ? '1' : 'none',
        borderRadius: isRealMobile ? '0px' : isMobileFrame ? '46px' : '24px',
        background: '#262624',
        border: isRealMobile ? 'none' : '1px solid #3a3936',
        boxShadow: isRealMobile
          ? 'none'
          : isMobileFrame
          ? '0 40px 80px -20px rgba(0,0,0,.7), 0 0 0 9px #121211'
          : '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: isRealMobile ? 'none' : 'all 0.3s ease',
        zIndex: 10,
      }}
    >
      {/* Mobile Top Status Bar */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: isRealMobile ? 'max(env(safe-area-inset-top, 54px), 54px)' : '12px',
          paddingBottom: '10px',
          paddingLeft: '18px',
          paddingRight: '18px',
          background: '#262624',
          borderBottom: '1px solid #2f2e2b',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/app-logo.png"
            alt="Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#f0eee6', letterSpacing: '-0.01em' }}>
            จดเงิน
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Backend Status Indicator */}
          <span
            title={backendOnline ? 'Golang Backend Online (:8080)' : 'Connecting to Golang Backend...'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: backendOnline ? '#6c9a76' : '#c9a227',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: backendOnline ? '#6c9a76' : '#c9a227',
              }}
            />
            {backendOnline ? 'Live DB' : 'Connecting'}
          </span>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="การตั้งค่าข้อมูล (ล้าง/คืนค่า)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8780',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '2px',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Scrollable View Area */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: isRealMobile ? 'calc(80px + max(env(safe-area-inset-bottom, 34px), 34px))' : '24px',
        }}
      >
        {tab === 'home' && (
          <HomeTab
            summary={summary}
            accountsData={accountsData}
            transactions={transactions}
            onToggleDebt={handleToggleDebt}
            onDeleteDebt={handleDeleteDebt}
            onOpenAddDebt={() => setShowAddDebtModal(true)}
            onOpenEditBudget={() => setShowBudgetModal(true)}
            onDeleteTransaction={handleDeleteTransaction}
            onSelectTab={(newTab) => setTab(newTab)}
          />
        )}
        {tab === 'add' && (
          <AddTab
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            transactions={transactions}
            availableAccounts={availableAccounts}
          />
        )}
        {tab === 'bank' && (
          <BankTab
            data={accountsData}
            onToggleFixed={handleToggleFixed}
            onDeleteFixed={handleDeleteFixed}
            onDeleteAccount={handleDeleteAccount}
            onDeleteCard={handleDeleteCard}
            onOpenAddAccount={() => setShowAddAccountModal(true)}
            onOpenAddCard={() => setShowAddCardModal(true)}
            onOpenAddFixed={() => setShowAddFixedModal(true)}
            onOpenPayCard={(card) => setPayCardTarget(card)}
          />
        )}
        {tab === 'plan' && (
          <PlanTab
            data={plansData}
            onOpenAddPlan={() => setShowAddPlanModal(true)}
            onPayPlan={handlePayPlan}
            onDeletePlan={handleDeletePlan}
          />
        )}
      </div>

      {/* Bottom Navigation Bar - Locked & Anchored at bottom */}
      <nav
        role="navigation"
        aria-label="เมนูหลัก"
        style={{
          flex: 'none',
          position: isRealMobile ? 'fixed' : 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: isRealMobile ? '100%' : isMobileFrame ? '390px' : '640px',
          margin: '0 auto',
          zIndex: 1000,
          borderTop: '1px solid #34332f',
          background: '#262624',
          paddingTop: '8px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingBottom: isRealMobile ? 'max(env(safe-area-inset-bottom, 34px), 34px)' : '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const IconComponent = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                border: 'none',
                background: isActive ? 'rgba(217, 119, 87, 0.14)' : 'transparent',
                borderRadius: '12px',
                padding: '7px 4px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <IconComponent active={isActive} />
              </div>
              <div
                style={{
                  font: `${isActive ? '600' : '400'} 11px/1 'IBM Plex Sans Thai'`,
                  color: isActive ? '#d97757' : '#8a8780',
                  letterSpacing: '0.01em',
                  transition: 'color 0.15s ease',
                }}
              >
                {t.label}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div
      style={{
        height: isRealMobile ? '100dvh' : 'auto',
        minHeight: isRealMobile ? '100dvh' : '100vh',
        background: isRealMobile ? '#262624' : '#191917',
        fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isRealMobile ? '0px' : '18px',
        padding: isRealMobile ? '0px' : '36px 20px 56px',
        width: '100%',
        overflow: isRealMobile ? 'hidden' : 'visible',
      }}
    >
      {/* iOS PWA Install Guide Banner */}
      {showIosPrompt && (
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            background: 'linear-gradient(135deg, #2e2820, #22211f)',
            borderBottom: '1px solid #d97757',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '12.5px',
            color: '#f0eee6',
            zIndex: 9999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📲</span>
            <div>
              ติดตั้งบน iPhone: แตะปุ่มแชร์ <strong>[ 📤 ]</strong> ด้านล่าง แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม"</strong>
            </div>
          </div>
          <button
            onClick={() => {
              setStoredItem('ios_pwa_dismissed', 'true');
              setShowIosPrompt(false);
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: '#bbb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info (Desktop only) */}
      {!isRealMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/app-logo.png"
              alt="จดเงิน"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                border: '1.5px solid #3a3936',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                objectFit: 'cover',
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ font: "500 11px/1 'IBM Plex Mono', monospace", letterSpacing: '.14em', color: '#8a8780', textTransform: 'uppercase' }}>
                Personal Finance App
              </div>
              <div style={{ font: "600 22px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>จดเงิน</div>
            </div>
          </div>
          <div style={{ font: "300 13px/1.4 'IBM Plex Sans Thai'", color: '#8a8780' }}>
            พิมพ์ประโยคเดียว ระบบตัดยอดเงินในบัญชีจริงอัตโนมัติ
          </div>

          {/* Viewport Toggle & Clean Slate shortcut */}
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setIsMobileFrame(true)}
              style={{
                border: `1px solid ${isMobileFrame ? '#d97757' : '#3a3936'}`,
                background: isMobileFrame ? 'rgba(217,119,87,.15)' : '#262624',
                color: isMobileFrame ? '#d97757' : '#8a8780',
                padding: '5px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📱 จอมือถือ
            </button>
            <button
              onClick={() => setIsMobileFrame(false)}
              style={{
                border: `1px solid ${!isMobileFrame ? '#d97757' : '#3a3936'}`,
                background: !isMobileFrame ? 'rgba(217,119,87,.15)' : '#262624',
                color: !isMobileFrame ? '#d97757' : '#8a8780',
                padding: '5px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🖥️ จอกว้าง
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                border: '1px solid #45433c',
                background: '#2c2b28',
                color: '#d0cdc2',
                padding: '5px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ⚙️ ล้างข้อมูล/เริ่มใหม่
            </button>
          </div>
        </div>
      )}

      {/* App Main Component */}
      {content}

      {/* Interactive Modals */}
      {showBudgetModal && (
        <EditBudgetModal
          currentBudget={summary?.income || 45000}
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
      {showAddAccountModal && (
        <AddAccountModal
          onSave={handleAddAccount}
          onClose={() => setShowAddAccountModal(false)}
        />
      )}
      {showAddCardModal && (
        <AddCardModal
          onSave={handleAddCard}
          onClose={() => setShowAddCardModal(false)}
        />
      )}
      {payCardTarget && (
        <PayCardModal
          card={payCardTarget}
          accounts={accountsData?.accounts || []}
          onConfirm={handleConfirmPayCard}
          onClose={() => setPayCardTarget(null)}
        />
      )}
      {showAddFixedModal && (
        <AddFixedModal
          onSave={handleAddFixed}
          onClose={() => setShowAddFixedModal(false)}
        />
      )}
      {showAddPlanModal && (
        <AddPlanModal
          onSave={handleAddPlan}
          onClose={() => setShowAddPlanModal(false)}
        />
      )}
      {showAddDebtModal && (
        <AddDebtModal
          onSave={handleAddDebt}
          onClose={() => setShowAddDebtModal(false)}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          onReset={handleReset}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
