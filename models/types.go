package models

type Transaction struct {
	ID           string  `json:"id"`
	Title        string  `json:"t"`
	Category     string  `json:"c"`
	CategoryTint string  `json:"tint"`
	Amount       float64 `json:"a"`
	Account      string  `json:"acct"`
	Date         string  `json:"date"`
	When         string  `json:"when"`
	IsIncome     bool    `json:"income"`
	IsToday      bool    `json:"today"`
	ReceiptImage string  `json:"receipt,omitempty"`
}

type Debt struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	What    string  `json:"what"`
	Amount  float64 `json:"a"`
	Cleared bool    `json:"cleared"`
}

type BankAccount struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Role   string  `json:"role"`
	Amount float64 `json:"amt"`
	Tint   string  `json:"tint"`
}

type ReconcileLine struct {
	Name   string  `json:"name"`
	Amount float64 `json:"amt"`
	OK     bool    `json:"ok"`
	Mark   string  `json:"mark"`
	Bg     string  `json:"bg"`
	Tint   string  `json:"tint"`
}

type CreditCard struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	CutDay         string          `json:"cut"`
	DueDate        string          `json:"due"`
	Amount         float64         `json:"amt"`
	Limit          float64         `json:"limit"`
	Pct            int             `json:"pct"`
	Status         string          `json:"status"`
	Tint           string          `json:"tint"`
	ChipBg         string          `json:"chipBg"`
	PdfName        string          `json:"pdfName"`
	PdfLabel       string          `json:"pdfLabel"`
	PdfSummary     string          `json:"pdfSummary"`
	ReconcileLines []ReconcileLine `json:"lines"`
}

type FixedExpense struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Amount float64 `json:"amt"`
	Day    string  `json:"day"`
	Done   bool    `json:"done"`
}

type InstallmentPlan struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Amount     float64 `json:"a"`
	PaidCount  int     `json:"paid"`
	TotalCount int     `json:"total"`
	Note       string  `json:"note"`
	EndsAt     string  `json:"endsAt"`
}

type DueItem struct {
	Day    string  `json:"day"`
	Name   string  `json:"name"`
	Note   string  `json:"note"`
	Amount float64 `json:"amt"`
	Tint   string  `json:"tint"`
}

type SummaryResponse struct {
	MonthlyIncome   float64       `json:"income"`
	MonthlySpent    float64       `json:"spent"`
	Remaining       float64       `json:"left"`
	SpentPct        int           `json:"spentPct"`
	FixedTotal      float64       `json:"fixedTotal"`
	FixedCountDone  int           `json:"fixedDone"`
	FixedCountTotal int           `json:"fixedTotalCount"`
	PlanMonthly     float64       `json:"planMonthly"`
	PlanItemsCount  int           `json:"planCount"`
	Dues            []DueItem     `json:"dues"`
	Debts           []Debt        `json:"debts"`
	DebtTotal       float64       `json:"debtTotal"`
	Recent          []Transaction `json:"recent"`
}

type ParseRequest struct {
	Text string `json:"text"`
	Kind string `json:"kind"` // "in" or "out"
}

type ParseResponse struct {
	Name     string  `json:"name"`
	Amount   float64 `json:"amount"`
	Category string  `json:"cat"`
	Tint     string  `json:"tint"`
	Account  string  `json:"acct"`
	IsIncome bool    `json:"income"`
}

type PayCardRequest struct {
	FromAccountID string  `json:"fromAccountId"`
	Amount        float64 `json:"amount"`
}

type PayPlanRequest struct {
	FromAccountID string `json:"fromAccountId"`
}

type UpdateBudgetRequest struct {
	Budget float64 `json:"budget"`
}

type ResetRequest struct {
	CleanSlate bool `json:"cleanSlate"`
}

type Database struct {
	MonthlyBudget float64           `json:"monthlyBudget"`
	Transactions  []Transaction     `json:"transactions"`
	Debts         []Debt            `json:"debts"`
	Accounts      []BankAccount     `json:"accounts"`
	Cards         []CreditCard      `json:"cards"`
	Fixed         []FixedExpense    `json:"fixed"`
	Plans         []InstallmentPlan `json:"plans"`
}
