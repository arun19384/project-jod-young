import { lazyComponent } from './lazyComponent.jsx';

export const EditBudgetModal = lazyComponent(() => import('./modals/EditBudgetModal.jsx').then(module => ({ default: module.EditBudgetModal })));
export const AddAccountModal = lazyComponent(() => import('./modals/AddAccountModal.jsx').then(module => ({ default: module.AddAccountModal })));
export const EditAccountModal = lazyComponent(() => import('./modals/EditAccountModal.jsx').then(module => ({ default: module.EditAccountModal })));
export const AddCardModal = lazyComponent(() => import('./modals/AddCardModal.jsx').then(module => ({ default: module.AddCardModal })));
export const PayCardModal = lazyComponent(() => import('./modals/PayCardModal.jsx').then(module => ({ default: module.PayCardModal })));
export const AddFixedModal = lazyComponent(() => import('./modals/AddFixedModal.jsx').then(module => ({ default: module.AddFixedModal })));
export const AddPlanModal = lazyComponent(() => import('./modals/AddPlanModal.jsx').then(module => ({ default: module.AddPlanModal })));
export const AddDebtModal = lazyComponent(() => import('./modals/AddDebtModal.jsx').then(module => ({ default: module.AddDebtModal })));
export const EditTransactionModal = lazyComponent(() => import('./modals/EditTransactionModal.jsx').then(module => ({ default: module.EditTransactionModal })));
export const SettingsModal = lazyComponent(() => import('./modals/SettingsModal.jsx').then(module => ({ default: module.SettingsModal })));
export const TransferModal = lazyComponent(() => import('./modals/TransferModal.jsx').then(module => ({ default: module.TransferModal })));
export const ReceiptPreviewModal = lazyComponent(() => import('./modals/ReceiptPreviewModal.jsx').then(module => ({ default: module.ReceiptPreviewModal })));
export const WalletTransactionsModal = lazyComponent(() => import('./modals/WalletTransactionsModal.jsx').then(module => ({ default: module.WalletTransactionsModal })));
