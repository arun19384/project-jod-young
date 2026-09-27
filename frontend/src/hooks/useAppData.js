import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBootstrap } from '../services/api.js';
import { createRefreshController } from '../utils/refreshController.js';
import { splitCardBalance } from '../utils/cardCycle.js';

const emptyAccounts = { accounts: [], cards: [], fixed: [], bankTotal: 0 };
const emptyPlans = { monthlyTotal: 0, remainingTotal: 0, plans: [] };

export function useAppData() {
  const [data, setData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const controller = useRef(null);
  const loadData = useCallback(() => controller.current?.refresh(), []);

  useEffect(() => {
    const refreshController = createRefreshController({
      fetchData: (signal) => fetchBootstrap({ signal }),
      onData: (next) => {
        setData(next);
        setBackendOnline(true);
      },
      onError: (error) => {
        console.warn('Unable to refresh app data:', error);
        setBackendOnline(false);
      },
      onSettled: () => setInitialLoading(false),
    });
    controller.current = refreshController;
    const refreshVisible = () => {
      if (document.visibilityState !== 'hidden') {
        void refreshController.refresh({ background: true });
      }
    };
    void refreshController.refresh();
    const interval = setInterval(refreshVisible, 30000);
    document.addEventListener('visibilitychange', refreshVisible);
    window.addEventListener('online', refreshVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshVisible);
      window.removeEventListener('online', refreshVisible);
      refreshController.dispose();
      controller.current = null;
    };
  }, []);

  const transactions = data?.transactions ?? [];
  const cards = (data?.cards ?? []).map((card) => splitCardBalance(card, transactions));
  const cardAmounts = new Map(cards.map((card) => [card.name, card.amt]));
  const summary = data?.summary ? {
    ...data.summary,
    dues: (data.summary.dues || []).map((due) => cardAmounts.has(due.name) ? { ...due, amt: cardAmounts.get(due.name) } : due),
  } : null;

  return {
    summary,
    transactions,
    accountsData: data ? {
      accounts: data.accounts, cards, fixed: data.fixed, bankTotal: data.bankTotal,
    } : emptyAccounts,
    plansData: data?.plans ?? emptyPlans,
    backendOnline,
    initialLoading,
    loadData,
  };
}
