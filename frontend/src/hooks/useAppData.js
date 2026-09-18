import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBootstrap } from '../services/api.js';
import { createRefreshController } from '../utils/refreshController.js';

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

  return {
    summary: data?.summary ?? null,
    transactions: data?.transactions ?? [],
    accountsData: data ? {
      accounts: data.accounts, cards: data.cards, fixed: data.fixed, bankTotal: data.bankTotal,
    } : emptyAccounts,
    plansData: data?.plans ?? emptyPlans,
    backendOnline,
    initialLoading,
    loadData,
  };
}
