package services

import (
	"ai-in-my-area-backend/internal/core/domain"
	"ai-in-my-area-backend/internal/core/ports"
	"errors"
)

type AppService struct {
	repo       ports.RepositoryPort
	parser     ports.ParserUseCase
	configPort ports.ConfigPort
}

func NewAppService(repo ports.RepositoryPort, parser ports.ParserUseCase, configPort ports.ConfigPort) ports.AppUseCase {
	return &AppService{
		repo:       repo,
		parser:     parser,
		configPort: configPort,
	}
}

func (s *AppService) GetSummary() domain.SummaryResponse {
	return s.repo.GetSummary()
}

func (s *AppService) GetTransactions() []domain.Transaction {
	return s.repo.GetTransactions()
}

func (s *AppService) AddTransaction(req domain.AddTransactionRequest) (domain.Transaction, error) {
	if req.Text != "" && req.Amount == 0 {
		parsed := s.parser.ParseTransactionText(req.Text, req.Kind)
		req.Name = parsed.Name
		req.Amount = parsed.Amount
		req.Category = parsed.Category
		req.Tint = parsed.Tint
		req.Account = parsed.Account
		req.IsIncome = parsed.IsIncome
	}

	if req.Amount <= 0 {
		return domain.Transaction{}, errors.New("amount must be greater than 0")
	}

	if req.Name == "" {
		req.Name = "ไม่ระบุ"
	}
	if req.Category == "" {
		req.Category = "อื่นๆ"
	}
	if req.Tint == "" {
		req.Tint = "#8a8780"
	}
	if req.Account == "" || req.Account == "Main" || req.Account == "เงินสด/บัญชีหลัก" {
		req.Account = "บัญชีหลัก"
	}

	tx := domain.Transaction{
		Title:        req.Name,
		Category:     req.Category,
		CategoryTint: req.Tint,
		Amount:       req.Amount,
		Account:      req.Account,
		IsIncome:     req.IsIncome,
		ReceiptImage: req.Receipt,
	}

	created := s.repo.AddTransaction(tx)
	return created, nil
}

func (s *AppService) DeleteTransaction(id string) bool {
	return s.repo.DeleteTransaction(id)
}

func (s *AppService) GetDebts() []domain.Debt {
	return s.repo.GetDebts()
}

func (s *AppService) AddDebt(debt domain.Debt) domain.Debt {
	return s.repo.AddDebt(debt)
}

func (s *AppService) ToggleDebt(id string) (domain.Debt, error) {
	return s.repo.ToggleDebt(id)
}

func (s *AppService) DeleteDebt(id string) bool {
	return s.repo.DeleteDebt(id)
}

func (s *AppService) GetAccounts() (accounts []domain.BankAccount, cards []domain.CreditCard, fixed []domain.FixedExpense, bankTotal float64) {
	return s.repo.GetAccounts()
}

func (s *AppService) AddAccount(acc domain.BankAccount) domain.BankAccount {
	return s.repo.AddAccount(acc)
}

func (s *AppService) UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error) {
	return s.repo.UpdateAccount(id, acc)
}

func (s *AppService) DeleteAccount(id string) bool {
	return s.repo.DeleteAccount(id)
}

func (s *AppService) TransferAccount(fromID, toID string, amount float64, note string) error {
	return s.repo.TransferAccount(fromID, toID, amount, note)
}

func (s *AppService) AddCard(card domain.CreditCard) domain.CreditCard {
	return s.repo.AddCard(card)
}

func (s *AppService) PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error) {
	return s.repo.PayCard(cardID, fromAccountID, amount)
}

func (s *AppService) DeleteCard(id string) bool {
	return s.repo.DeleteCard(id)
}

func (s *AppService) AddFixed(fixed domain.FixedExpense) domain.FixedExpense {
	return s.repo.AddFixed(fixed)
}

func (s *AppService) ToggleFixed(id string) (domain.FixedExpense, error) {
	return s.repo.ToggleFixed(id)
}

func (s *AppService) DeleteFixed(id string) bool {
	return s.repo.DeleteFixed(id)
}

func (s *AppService) GetPlans() (monthlyTotal float64, remainingTotal float64, plans []domain.InstallmentPlan) {
	return s.repo.GetPlans()
}

func (s *AppService) AddPlan(plan domain.InstallmentPlan) domain.InstallmentPlan {
	return s.repo.AddPlan(plan)
}

func (s *AppService) PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error) {
	return s.repo.PayPlan(planID, fromAccountID)
}

func (s *AppService) DeletePlan(id string) bool {
	return s.repo.DeletePlan(id)
}

func (s *AppService) UpdateBudget(budget float64) float64 {
	return s.repo.UpdateBudget(budget)
}

func (s *AppService) ResetData(cleanSlate bool) domain.Database {
	return s.repo.ResetData(cleanSlate)
}

func (s *AppService) GetDBStatus() domain.DatabaseStatus {
	return s.repo.GetStatus()
}

func (s *AppService) ReconnectDB(databaseURL string) (bool, string) {
	ok, msg := s.repo.Reconnect(databaseURL)
	if ok && s.configPort != nil {
		_ = s.configPort.SaveDatabaseURL(databaseURL)
	}
	return ok, msg
}
