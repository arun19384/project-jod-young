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

const TABS = [
  { id: 'home', label: 'สรุป', r: '6px' },
  { id: 'add', label: 'จด', r: '99px' },
  { id: 'bank', label: 'บัญชี', r: '4px' },
  { id: 'plan', label: 'ผ่อน', r: '50% 6px 50% 6px' },
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
        width: isMobileFrame ? '390px' : '100%',
        maxWidth: isMobileFrame ? '390px' : '640px',
        height: isMobileFrame ? '844px' : 'auto',
        minHeight: isMobileFrame ? '844px' : '90vh',
        flex: 'none',
        borderRadius: isMobileFrame ? '46px' : '24px',
        background: '#262624',
        border: '1px solid #3a3936',
        boxShadow: isMobileFrame
          ? '0 40px 80px -20px rgba(0,0,0,.7), 0 0 0 9px #121211'
          : '0 20px 50px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Mobile Top Status Bar */}
      <div
        style={{
          height: '52px',
          flex: 'none',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 24px 8px',
          font: "500 13px/1 'IBM Plex Sans Thai'",
          color: '#f0eee6',
        }}
      >
        <span>9:41</span>
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
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'home' && (
          <HomeTab
            summary={summary}
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

      {/* Bottom Navigation Bar */}
      <div
        style={{
          flex: 'none',
          borderTop: '1px solid #34332f',
          background: '#2a2926',
          padding: '9px 14px 26px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
        }}
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                border: 'none',
                background: isActive ? '#312f2b' : 'transparent',
                borderRadius: '13px',
                padding: '9px 4px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: t.r,
                  border: `1.6px solid ${isActive ? '#d97757' : '#78756e'}`,
                  background: isActive ? 'rgba(217,119,87,.25)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              />
              <div
                style={{
                  font: "500 10.5px/1 'IBM Plex Sans Thai'",
                  color: isActive ? '#d97757' : '#78756e',
                }}
              >
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#191917',
        fontFamily: "'IBM Plex Sans Thai', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
        padding: '36px 20px 56px',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ font: "500 11px/1 'IBM Plex Mono', monospace", letterSpacing: '.14em', color: '#8a8780', textTransform: 'uppercase' }}>
          Real-World Personal Finance App
        </div>
        <div style={{ font: "600 22px/1.3 'IBM Plex Sans Thai'", color: '#f0eee6' }}>จดเงิน</div>
        <div style={{ font: "300 13px/1.5 'IBM Plex Sans Thai'", color: '#8a8780' }}>
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
