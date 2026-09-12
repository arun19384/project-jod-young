import React, { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab.jsx';
import AddTab from './components/AddTab.jsx';
import BankTab from './components/BankTab.jsx';
import PlanTab from './components/PlanTab.jsx';
import SearchModal from './components/SearchModal.jsx';
import LockScreen from './components/LockScreen.jsx';
import {
  EditBudgetModal,
  AddAccountModal,
  EditAccountModal,
  AddCardModal,
  PayCardModal,
  AddFixedModal,
  AddPlanModal,
  AddDebtModal,
  SettingsModal,
  TransferModal,
  ReceiptPreviewModal,
  EditTransactionModal,
} from './components/Modals.jsx';
import LoadingPopup from './components/LoadingPopup.jsx';
import AppLoadingScreen from './components/AppLoadingScreen.jsx';
import {
  fetchBootstrap,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  fetchDebts,
  addDebt,
  toggleDebt,
  deleteDebt,
  addAccount,
  deleteAccount,
  updateAccount,
  transferAccount,
  addCard,
  payCard,
  deleteCard,
  toggleFixed,
  addFixed,
  deleteFixed,
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
  const [summary, setSummary] = useState(null);
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [editAccountTarget, setEditAccountTarget] = useState(null);
  const [editTransactionTarget, setEditTransactionTarget] = useState(null);
  const [loadingText, setLoadingText] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Security / PIN Lock state
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem('jod_pin_enabled') === 'true' && Boolean(localStorage.getItem('jod_app_pin'));
    } catch {
      return false;
    }
  });
  const [appPin, setAppPin] = useState(() => {
    try {
      return localStorage.getItem('jod_app_pin') || '1234';
    } catch {
      return '1234';
    }
  });

  useEffect(() => {
    let hideTimestamp = 0;
    const handleVisibilityChange = () => {
      const pinEnabled = localStorage.getItem('jod_pin_enabled') === 'true';
      if (!pinEnabled) return;

      if (document.visibilityState === 'hidden') {
        hideTimestamp = Date.now();
      } else if (document.visibilityState === 'visible') {
        const timeoutSec = parseInt(localStorage.getItem('jod_pin_timeout') || '0', 10);
        const elapsedSec = (Date.now() - hideTimestamp) / 1000;
        if (elapsedSec >= timeoutSec) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

    // Follow the visible viewport without fighting Safari's focus scrolling.
    const viewport = window.visualViewport;
    let viewportFrame;
    const updateViewport = () => {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = requestAnimationFrame(() => {
        if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
        document.documentElement.style.setProperty('--app-height', `${viewport?.height || window.innerHeight}px`);
        document.documentElement.style.setProperty('--app-top', `${viewport?.offsetTop || 0}px`);
      });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('pageshow', updateViewport);
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);

    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      cancelAnimationFrame(viewportFrame);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('pageshow', updateViewport);
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      clearInterval(clockTimer);
    };
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchBootstrap();
      setSummary(data.summary);
      setTransactions(data.transactions);
      setAccountsData({
        accounts: data.accounts,
        cards: data.cards,
        fixed: data.fixed,
        bankTotal: data.bankTotal,
      });
      setPlansData(data.plans);
      setBackendOnline(true);
    } catch (err) {
      console.warn('API Error or connecting to local Go backend:', err);
      setBackendOnline(false);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Loading & Async Action Wrapper
  const runWithLoading = async (actionFn, message = 'กำลังดำเนินการ...') => {
    setLoadingText(message);
    setActionMessage(null);
    try {
      await actionFn();
      setActionMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
      setTimeout(() => setActionMessage(null), 2200);
      return true;
    } catch (err) {
      console.error(`Error during action [${message}]:`, err);
      setActionMessage({ type: 'error', text: err?.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่' });
      return false;
    } finally {
      setTimeout(() => {
        setLoadingText(null);
      }, 60);
    }
  };

  // Handlers wrapped with Loading Pop-up
  const handleAddTransaction = (newTx) => {
    return runWithLoading(async () => {
      await addTransaction(newTx);
      await loadData();
      setTab('home');
    }, 'กำลังบันทึกรายการ...');
  };

  const handleUpdateTransaction = (id, updatedData) => {
    return runWithLoading(async () => {
      await updateTransaction(id, updatedData);
      await loadData();
    }, 'กำลังบันทึกการแก้ไข...');
  };

  const handleDeleteTransaction = (id) => {
    return runWithLoading(async () => {
      await deleteTransaction(id);
      await loadData();
    }, 'กำลังลบรายการ...');
  };

  const handleToggleDebt = (id) => {
    return runWithLoading(async () => {
      await toggleDebt(id);
      await loadData();
    }, 'กำลังอัปเดตสถานะ...');
  };

  const handleAddDebt = (debtData) => {
    return runWithLoading(async () => {
      await addDebt(debtData);
      await loadData();
      setShowAddDebtModal(false);
    }, 'กำลังบันทึกคนติดเงิน...');
  };

  const handleDeleteDebt = (id) => {
    return runWithLoading(async () => {
      await deleteDebt(id);
      await loadData();
    }, 'กำลังลบรายการ...');
  };

  const handleToggleFixed = (id) => {
    return runWithLoading(async () => {
      await toggleFixed(id);
      await loadData();
    }, 'กำลังอัปเดตบิล...');
  };

  const handleAddFixed = (fixedData) => {
    return runWithLoading(async () => {
      await addFixed(fixedData);
      await loadData();
      setShowAddFixedModal(false);
    }, 'กำลังบันทึกบิลคงที่...');
  };

  const handleDeleteFixed = (id) => {
    return runWithLoading(async () => {
      await deleteFixed(id);
      await loadData();
    }, 'กำลังลบบิล...');
  };

  const handleAddAccount = (accData) => {
    return runWithLoading(async () => {
      await addAccount(accData);
      await loadData();
      setShowAddAccountModal(false);
    }, 'กำลังเพิ่มบัญชี...');
  };

  const handleUpdateAccount = (id, accData) => {
    return runWithLoading(async () => {
      await updateAccount(id, accData);
      await loadData();
      setEditAccountTarget(null);
    }, 'กำลังอัปเดตยอดเงิน...');
  };

  const handleTransferAccount = ({ fromId, toId, amount, note }) => {
    return runWithLoading(async () => {
      await transferAccount(fromId, toId, amount, note);
      await loadData();
      setShowTransferModal(false);
    }, 'กำลังทำรายการโอนเงิน...');
  };

  const handleDeleteAccount = (id) => {
    return runWithLoading(async () => {
      await deleteAccount(id);
      await loadData();
    }, 'กำลังลบบัญชี...');
  };

  const handleAddCard = (cardData) => {
    return runWithLoading(async () => {
      await addCard(cardData);
      await loadData();
      setShowAddCardModal(false);
    }, 'กำลังบันทึกบัตรเครดิต...');
  };

  const handleConfirmPayCard = (cardId, fromAccountId, amount) => {
    return runWithLoading(async () => {
      await payCard(cardId, fromAccountId, amount);
      await loadData();
      setPayCardTarget(null);
    }, 'กำลังบันทึกการชำระหนี้...');
  };

  const handleDeleteCard = (id) => {
    return runWithLoading(async () => {
      await deleteCard(id);
      await loadData();
    }, 'กำลังลบบัตร...');
  };

  const handleAddPlan = (planData) => {
    return runWithLoading(async () => {
      await addPlan(planData);
      await loadData();
      setShowAddPlanModal(false);
    }, 'กำลังบันทึกรายการผ่อน...');
  };

  const handlePayPlan = (planId) => {
    return runWithLoading(async () => {
      const defaultAcc = accountsData?.accounts?.[0]?.id || 'Main';
      await payPlan(planId, defaultAcc);
      await loadData();
    }, 'กำลังบันทึกชำระงวด...');
  };

  const handleDeletePlan = (id) => {
    return runWithLoading(async () => {
      await deletePlan(id);
      await loadData();
    }, 'กำลังลบรายการผ่อน...');
  };

  const handleSaveBudget = (newBudget) => {
    return runWithLoading(async () => {
      await updateBudget(newBudget);
      await loadData();
      setShowBudgetModal(false);
    }, 'กำลังบันทึกงบประมาณ...');
  };

  const handleReset = (cleanSlate) => {
    return runWithLoading(async () => {
      await resetData(cleanSlate);
      await loadData();
      setShowSettingsModal(false);
      setTab('home');
    }, 'กำลังดำเนินการ...');
  };

  // Get available accounts and cards list for dropdowns
  const availableAccounts = [
    ...(accountsData?.accounts || []),
    ...(accountsData?.cards || []),
  ];

  const content = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isRealMobile ? '100%' : isMobileFrame ? '390px' : '640px',
        height: isRealMobile ? '100%' : isMobileFrame ? '844px' : '90vh',
        maxHeight: isRealMobile ? '100%' : isMobileFrame ? '844px' : '90vh',
        flex: isRealMobile ? '1 1 0%' : 'none',
        minHeight: 0,
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
      {/* Mobile Top Status Bar with Dynamic Safe Area */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: isRealMobile
            ? 'max(env(safe-area-inset-top, 0px), 14px)'
            : isMobileFrame
            ? '18px'
            : '14px',
          paddingBottom: '10px',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 18px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 18px)',
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
            จดยัง
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

          {/* Quick Reload Button */}
          <button
            onClick={async () => {
              try {
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map((r) => r.unregister()));
                }
              } catch (e) {}
              window.location.replace(window.location.origin + '?reload=' + Date.now());
            }}
            title="รีเฟรชหน้าจอ / โหลดเวอร์ชันล่าสุด"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid #3a3936',
              borderRadius: '7px',
              color: '#f0eee6',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔄 รีเฟรช
          </button>

          {/* Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            title="ค้นหาและกรองรายการธุรกรรม"
            className="pressable"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8780',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '2px',
            }}
          >
            🔍
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="การตั้งค่าข้อมูล (ล้าง/คืนค่า/ส่งออก)"
            className="pressable"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8780',
              cursor: 'pointer',
              fontSize: '15px',
              padding: '2px',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Scrollable View Area */}
      <div
        className="app-scroll-content"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'none',
          paddingBottom: '16px',
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
            onEditTransaction={(tx) => setEditTransactionTarget(tx)}
            onSelectTab={(newTab) => setTab(newTab)}
            onOpenSearch={() => setShowSearchModal(true)}
            onEditAccount={(acc) => setEditAccountTarget(acc)}
            onOpenTransferModal={() => setShowTransferModal(true)}
            onOpenPayCard={(card) => setPayCardTarget(card)}
            onToggleFixed={handleToggleFixed}
            onOpenAddFixed={() => setShowAddFixedModal(true)}
            onDeleteFixed={handleDeleteFixed}
          />
        )}
        {tab === 'add' && (
          <AddTab
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(tx) => setEditTransactionTarget(tx)}
            transactions={transactions}
            availableAccounts={availableAccounts}
          />
        )}
        {tab === 'bank' && (
          <BankTab
            data={accountsData}
            transactions={transactions}
            onToggleFixed={handleToggleFixed}
            onDeleteFixed={handleDeleteFixed}
            onDeleteAccount={handleDeleteAccount}
            onDeleteCard={handleDeleteCard}
            onEditAccount={(acc) => setEditAccountTarget(acc)}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(tx) => setEditTransactionTarget(tx)}
            onOpenAddAccount={() => setShowAddAccountModal(true)}
            onOpenTransferModal={() => setShowTransferModal(true)}
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

      {/* Bottom Navigation Bar - Locked at bottom of Flexbox */}
      <nav
        role="navigation"
        aria-label="เมนูหลัก"
        style={{
          flex: 'none',
          position: 'relative',
          width: '100%',
          maxWidth: isRealMobile ? '100%' : isMobileFrame ? '390px' : '640px',
          margin: '0 auto',
          zIndex: 100,
          borderTop: '1px solid #34332f',
          background: '#262624',
          paddingTop: '8px',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
          paddingBottom: isRealMobile ? 'max(env(safe-area-inset-bottom, 0px), 14px)' : '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Liquid Sliding Pill Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            bottom: isRealMobile ? 'max(env(safe-area-inset-bottom, 0px), 14px)' : '10px',
            left: '12px',
            width: 'calc((100% - 24px - 12px) / 4)',
            background: 'rgba(217, 119, 87, 0.16)',
            border: '1px solid rgba(217, 119, 87, 0.28)',
            borderRadius: '14px',
            transform: `translateX(calc(${TABS.findIndex((t) => t.id === tab)} * (100% + 4px)))`,
            transition: 'transform 0.18s cubic-bezier(0.25, 1.2, 0.4, 1)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {TABS.map((t) => {
          const isActive = tab === t.id;
          const IconComponent = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="pressable"
              style={{
                border: 'none',
                background: 'transparent',
                borderRadius: '14px',
                padding: '7px 4px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isActive ? 'iconBounce 0.18s ease' : 'none',
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
                  transition: 'color 0.2s ease',
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
        width: '100%',
        height: isRealMobile ? '100%' : 'auto',
        minHeight: isRealMobile ? 0 : '100vh',
        maxHeight: isRealMobile ? '100%' : 'none',
        background: isRealMobile ? '#262624' : '#191917',
        fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isRealMobile ? '0px' : '18px',
        padding: isRealMobile ? '0px' : '36px 20px 56px',
        overflow: 'hidden',
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
              alt="จดยัง"
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
              <div style={{ font: "600 22px/1.2 'IBM Plex Sans Thai'", color: '#f0eee6' }}>จดยัง</div>
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
      {editAccountTarget && (
        <EditAccountModal
          account={editAccountTarget}
          onSave={(data) => handleUpdateAccount(editAccountTarget.id, data)}
          onClose={() => setEditAccountTarget(null)}
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
          transactions={transactions}
          onReset={handleReset}
          onClose={() => setShowSettingsModal(false)}
          onPinConfigChange={() => {
            const pin = localStorage.getItem('jod_app_pin') || '1234';
            setAppPin(pin);
          }}
        />
      )}

      {showSearchModal && (
        <SearchModal
          transactions={transactions}
          accounts={accountsData?.accounts || []}
          onDeleteTransaction={handleDeleteTransaction}
          onEditTransaction={(tx) => setEditTransactionTarget(tx)}
          onViewReceipt={(src) => setPreviewReceipt(src)}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {editTransactionTarget && (
        <EditTransactionModal
          tx={editTransactionTarget}
          accounts={accountsData?.accounts || []}
          cards={accountsData?.cards || []}
          onSave={handleUpdateTransaction}
          onClose={() => setEditTransactionTarget(null)}
        />
      )}

      {showTransferModal && (
        <TransferModal
          accounts={accountsData?.accounts || []}
          onTransfer={handleTransferAccount}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {previewReceipt && (
        <ReceiptPreviewModal
          src={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
        />
      )}

      {/* 4-digit PIN / Face ID Lock Screen */}
      {isLocked && (
        <LockScreen
          expectedPin={appPin}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Global Action Loading Popup */}
      {loadingText && <LoadingPopup message={loadingText} />}

      {actionMessage && (
        <div style={{ position: 'fixed', left: '50%', bottom: '84px', transform: 'translateX(-50%)', zIndex: 12000, padding: '10px 14px', borderRadius: '10px', background: actionMessage.type === 'error' ? '#7f3028' : '#315b3b', color: '#fff', font: "500 13px 'IBM Plex Sans Thai'", boxShadow: '0 8px 24px rgba(0,0,0,.35)', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>
          {actionMessage.text}
        </div>
      )}

      {/* App Initial Database Loading Screen */}
      {initialLoading && <AppLoadingScreen />}
    </div>
  );
}
