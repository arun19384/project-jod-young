package ports

import (
	"ai-in-my-area-backend/pkg/core/domain"
)

// AppUseCase defines the Inbound Port (Primary / Driving Port) for application features
type AppUseCase interface {
	GetSummary() domain.SummaryResponse
	GetTransactions() []domain.Transaction
	AddTransaction(req domain.AddTransactionRequest) (domain.Transaction, error)
	DeleteTransaction(id string) bool

	GetDebts() []domain.Debt
	AddDebt(debt domain.Debt) domain.Debt
	ToggleDebt(id string) (domain.Debt, error)
	DeleteDebt(id string) bool

	GetAccounts() (accounts []domain.BankAccount, cards []domain.CreditCard, fixed []domain.FixedExpense, bankTotal float64)
	AddAccount(acc domain.BankAccount) domain.BankAccount
	UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error)
	DeleteAccount(id string) bool
	TransferAccount(fromID, toID string, amount float64, note string) error

	AddCard(card domain.CreditCard) domain.CreditCard
	PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error)
	DeleteCard(id string) bool

	AddFixed(fixed domain.FixedExpense) domain.FixedExpense
	ToggleFixed(id string) (domain.FixedExpense, error)
	DeleteFixed(id string) bool

	GetPlans() (monthlyTotal float64, remainingTotal float64, plans []domain.InstallmentPlan)
	AddPlan(plan domain.InstallmentPlan) domain.InstallmentPlan
	PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error)
	DeletePlan(id string) bool

	UpdateBudget(budget float64) float64
	ResetData(cleanSlate bool) domain.Database

	GetDBStatus() domain.DatabaseStatus
	ReconnectDB(databaseURL string) (bool, string)
}

// ParserUseCase defines the Inbound Port for natural language parsing
type ParserUseCase interface {
	ParseTransactionText(text string, forceKind string) domain.ParseResponse
}

// RepositoryPort defines the Outbound Port (Secondary / Driven Port) for persistence
type RepositoryPort interface {
	GetSummary() domain.SummaryResponse
	GetTransactions() []domain.Transaction
	AddTransaction(tx domain.Transaction) domain.Transaction
	DeleteTransaction(id string) bool

	GetDebts() []domain.Debt
	AddDebt(debt domain.Debt) domain.Debt
	ToggleDebt(id string) (domain.Debt, error)
	DeleteDebt(id string) bool

	GetAccounts() (accounts []domain.BankAccount, cards []domain.CreditCard, fixed []domain.FixedExpense, bankTotal float64)
	AddAccount(acc domain.BankAccount) domain.BankAccount
	UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error)
	DeleteAccount(id string) bool
	TransferAccount(fromID, toID string, amount float64, note string) error

	AddCard(card domain.CreditCard) domain.CreditCard
	PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error)
	DeleteCard(id string) bool

	AddFixed(fixed domain.FixedExpense) domain.FixedExpense
	ToggleFixed(id string) (domain.FixedExpense, error)
	DeleteFixed(id string) bool

	GetPlans() (monthlyTotal float64, remainingTotal float64, plans []domain.InstallmentPlan)
	AddPlan(plan domain.InstallmentPlan) domain.InstallmentPlan
	PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error)
	DeletePlan(id string) bool

	UpdateBudget(budget float64) float64
	ResetData(cleanSlate bool) domain.Database

	GetStatus() domain.DatabaseStatus
	Reconnect(databaseURL string) (bool, string)
}

// ConfigPort defines the Outbound Port for configuration management
type ConfigPort interface {
	GetConfig() domain.AppConfig
	SaveDatabaseURL(dbURL string) error
}
