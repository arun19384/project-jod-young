package storage

import (
	"ai-in-my-area-backend/pkg/core/domain"
	"path/filepath"
	"testing"
)

func TestRenamePreservesTransactionBalance(t *testing.T) {
	s := &JSONFileStore{dbPath: filepath.Join(t.TempDir(), "db.json")}
	s.AddAccount(domain.BankAccount{ID: "a", Name: "Old", Amount: 1000})
	tx, err := s.AddTransaction(domain.Transaction{Title: "Food", Category: "Food", Amount: 100, Account: "Old"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.UpdateAccount("a", domain.BankAccount{Name: "New", Amount: 900}); err != nil {
		t.Fatal(err)
	}
	if got := s.GetTransactions()[0].Account; got != "New" {
		t.Fatalf("account = %s", got)
	}
	if !s.DeleteTransaction(tx.ID) {
		t.Fatal("delete failed")
	}
	accounts, _, _, _ := s.GetAccounts()
	if accounts[0].Amount != 1000 {
		t.Fatalf("balance = %v", accounts[0].Amount)
	}
}
func TestInstallmentHistoryCannotBeChanged(t *testing.T) {
	s := &JSONFileStore{dbPath: filepath.Join(t.TempDir(), "db.json")}
	s.AddAccount(domain.BankAccount{ID: "a", Name: "Bank", Amount: 1000})
	s.AddPlan(domain.InstallmentPlan{ID: "p", Name: "Plan", Amount: 100, TotalCount: 10})
	if _, err := s.PayPlan("p", "a"); err != nil {
		t.Fatal(err)
	}
	tx := s.GetTransactions()[0]
	if s.DeleteTransaction(tx.ID) {
		t.Fatal("deleted installment history")
	}
	if _, err := s.UpdateTransaction(tx.ID, domain.UpdateTransactionRequest{Name: "Changed", Amount: 50, Account: "Bank"}); err == nil {
		t.Fatal("edited installment history")
	}
	accounts, _, _, _ := s.GetAccounts()
	_, remaining, plans := s.GetPlans()
	if accounts[0].Amount != 900 || plans[0].PaidCount != 1 || remaining != 900 || len(s.GetTransactions()) != 1 {
		t.Fatal("payment state changed")
	}
	if s.GetSummary().MonthlySpent != 100 {
		t.Fatal("installment no longer counts as spending")
	}
}
