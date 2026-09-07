package services

import (
	"ai-in-my-area-backend/models"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type StorageService struct {
	mu       sync.RWMutex
	dbPath   string
	initPath string
	db       models.Database
}

var globalStorage *StorageService
var once sync.Once

func GetStorage() *StorageService {
	once.Do(func() {
		baseDir := "."
		dbPath := filepath.Join(baseDir, "data", "db.json")
		initPath := filepath.Join(baseDir, "data", "initial_data.json")

		globalStorage = &StorageService{
			dbPath:   dbPath,
			initPath: initPath,
		}
		if err := globalStorage.load(); err != nil {
			fmt.Printf("Warning: Failed to load DB, error: %v\n", err)
		}
	})
	return globalStorage
}

func (s *StorageService) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_ = os.MkdirAll(filepath.Dir(s.dbPath), 0755)

	targetPath := s.dbPath
	if _, err := os.Stat(s.dbPath); os.IsNotExist(err) {
		targetPath = s.initPath
	}

	data, err := os.ReadFile(targetPath)
	if err != nil {
		return err
	}

	var db models.Database
	if err := json.Unmarshal(data, &db); err != nil {
		return err
	}

	s.db = db

	if targetPath == s.initPath {
		_ = s.saveLocked()
	}

	return nil
}

func (s *StorageService) saveLocked() error {
	data, err := json.MarshalIndent(s.db, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.dbPath, data, 0644)
}

func (s *StorageService) GetSummary() models.SummaryResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	income := 0.0
	spentTx := 0.0

	for _, tx := range s.db.Transactions {
		if tx.IsIncome {
			income += tx.Amount
		} else {
			spentTx += tx.Amount
		}
	}

	if income == 0 {
		income = s.db.MonthlyBudget
		if income == 0 {
			income = 45000
		}
	}

	fixedTotal := 0.0
	fixedDone := 0
	for _, f := range s.db.Fixed {
		fixedTotal += f.Amount
		if f.Done {
			fixedDone++
		}
	}

	planMonthly := 0.0
	for _, p := range s.db.Plans {
		if p.PaidCount < p.TotalCount {
			planMonthly += p.Amount
		}
	}

	totalSpent := spentTx + fixedTotal + planMonthly
	left := income - totalSpent

	spentPct := 0
	if income > 0 {
		spentPct = int((totalSpent / income) * 100)
		if spentPct > 100 {
			spentPct = 100
		}
	}

	debtTotal := 0.0
	for _, d := range s.db.Debts {
		if !d.Cleared {
			debtTotal += d.Amount
		}
	}

	// Generate upcoming dues from fixed and cards
	dues := make([]models.DueItem, 0)
	for _, f := range s.db.Fixed {
		if !f.Done {
			dues = append(dues, models.DueItem{
				Day:    f.Day,
				Name:   f.Name,
				Note:   "คงที่ · รายเดือน",
				Amount: f.Amount,
				Tint:   "#d97757",
			})
		}
	}
	for _, c := range s.db.Cards {
		if c.Amount > 0 {
			dues = append(dues, models.DueItem{
				Day:    c.CutDay,
				Name:   c.Name,
				Note:   "รอบบิล · จ่าย " + c.DueDate,
				Amount: c.Amount,
				Tint:   c.Tint,
			})
		}
	}

	recent := s.db.Transactions
	if recent == nil {
		recent = make([]models.Transaction, 0)
	} else if len(recent) > 10 {
		recent = recent[:10]
	}

	debts := s.db.Debts
	if debts == nil {
		debts = make([]models.Debt, 0)
	}

	return models.SummaryResponse{
		MonthlyIncome:   income,
		MonthlySpent:    totalSpent,
		Remaining:       left,
		SpentPct:        spentPct,
		FixedTotal:      fixedTotal,
		FixedCountDone:  fixedDone,
		FixedCountTotal: len(s.db.Fixed),
		PlanMonthly:     planMonthly,
		PlanItemsCount:  len(s.db.Plans),
		Dues:            dues,
		Debts:           debts,
		DebtTotal:       debtTotal,
		Recent:          recent,
	}
}

func (s *StorageService) GetTransactions() []models.Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.db.Transactions == nil {
		return make([]models.Transaction, 0)
	}
	return s.db.Transactions
}

func (s *StorageService) AddTransaction(tx models.Transaction) models.Transaction {
	s.mu.Lock()
	defer s.mu.Unlock()

	if tx.ID == "" {
		tx.ID = fmt.Sprintf("tx-%d", time.Now().UnixNano())
	}
	if tx.Date == "" {
		tx.Date = time.Now().Format("2006-01-02")
	}
	if tx.When == "" {
		tx.When = "วันนี้ " + time.Now().Format("15:04")
	}
	tx.IsToday = true

	// Live Account Balance Sync!
	matchedAccount := false
	for i := range s.db.Accounts {
		if strings.EqualFold(s.db.Accounts[i].Name, tx.Account) || s.db.Accounts[i].ID == tx.Account {
			matchedAccount = true
			if tx.IsIncome {
				s.db.Accounts[i].Amount += tx.Amount
			} else {
				s.db.Accounts[i].Amount -= tx.Amount
			}
			break
		}
	}

	// If not matched bank account, check credit cards
	if !matchedAccount {
		for i := range s.db.Cards {
			if strings.EqualFold(s.db.Cards[i].Name, tx.Account) || s.db.Cards[i].ID == tx.Account {
				if !tx.IsIncome {
					s.db.Cards[i].Amount += tx.Amount
					limit := s.db.Cards[i].Limit
					if limit <= 0 {
						limit = 20000
					}
					s.db.Cards[i].Pct = int((s.db.Cards[i].Amount / limit) * 100)
					if s.db.Cards[i].Pct > 100 {
						s.db.Cards[i].Pct = 100
					}
				}
				break
			}
		}
	}

	// Prepend to list
	s.db.Transactions = append([]models.Transaction{tx}, s.db.Transactions...)
	_ = s.saveLocked()
	return tx
}

func (s *StorageService) DeleteTransaction(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	var targetTx *models.Transaction
	filtered := make([]models.Transaction, 0, len(s.db.Transactions))
	for _, tx := range s.db.Transactions {
		if tx.ID == id {
			t := tx
			targetTx = &t
			continue
		}
		filtered = append(filtered, tx)
	}

	if targetTx == nil {
		return false
	}

	// Rollback account balance!
	matched := false
	for i := range s.db.Accounts {
		if strings.EqualFold(s.db.Accounts[i].Name, targetTx.Account) || s.db.Accounts[i].ID == targetTx.Account {
			matched = true
			if targetTx.IsIncome {
				s.db.Accounts[i].Amount -= targetTx.Amount
			} else {
				s.db.Accounts[i].Amount += targetTx.Amount
			}
			break
		}
	}

	if !matched {
		for i := range s.db.Cards {
			if strings.EqualFold(s.db.Cards[i].Name, targetTx.Account) || s.db.Cards[i].ID == targetTx.Account {
				if !targetTx.IsIncome {
					s.db.Cards[i].Amount -= targetTx.Amount
					if s.db.Cards[i].Amount < 0 {
						s.db.Cards[i].Amount = 0
					}
					limit := s.db.Cards[i].Limit
					if limit <= 0 {
						limit = 20000
					}
					s.db.Cards[i].Pct = int((s.db.Cards[i].Amount / limit) * 100)
				}
				break
			}
		}
	}

	s.db.Transactions = filtered
	_ = s.saveLocked()
	return true
}

func (s *StorageService) PayCard(cardID string, fromAccountID string, amount float64) (*models.CreditCard, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var targetCard *models.CreditCard
	for i := range s.db.Cards {
		if s.db.Cards[i].ID == cardID {
			targetCard = &s.db.Cards[i]
			break
		}
	}
	if targetCard == nil {
		return nil, fmt.Errorf("credit card not found")
	}

	if amount <= 0 {
		amount = targetCard.Amount
	}

	// Deduct from bank account
	var targetAccount *models.BankAccount
	for i := range s.db.Accounts {
		if s.db.Accounts[i].ID == fromAccountID || strings.EqualFold(s.db.Accounts[i].Name, fromAccountID) {
			targetAccount = &s.db.Accounts[i]
			targetAccount.Amount -= amount
			break
		}
	}

	// Reset or reduce card balance
	targetCard.Amount -= amount
	if targetCard.Amount < 0 {
		targetCard.Amount = 0
	}
	targetCard.Pct = 0
	targetCard.Status = "ชำระแล้ว"

	// Add transaction record
	acctName := "Main"
	if targetAccount != nil {
		acctName = targetAccount.Name
	}
	tx := models.Transaction{
		ID:           fmt.Sprintf("tx-%d", time.Now().UnixNano()),
		Title:        "ชำระ " + targetCard.Name,
		Category:     "บัตร/ผ่อน",
		CategoryTint: "#9b8ec4",
		Amount:       amount,
		Account:      acctName,
		Date:         time.Now().Format("2006-01-02"),
		When:         "วันนี้ " + time.Now().Format("15:04"),
		IsIncome:     false,
		IsToday:      true,
	}
	s.db.Transactions = append([]models.Transaction{tx}, s.db.Transactions...)

	_ = s.saveLocked()
	return targetCard, nil
}

func (s *StorageService) PayPlan(planID string, fromAccountID string) (*models.InstallmentPlan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var targetPlan *models.InstallmentPlan
	for i := range s.db.Plans {
		if s.db.Plans[i].ID == planID {
			targetPlan = &s.db.Plans[i]
			break
		}
	}
	if targetPlan == nil {
		return nil, fmt.Errorf("installment plan not found")
	}

	if targetPlan.PaidCount >= targetPlan.TotalCount {
		return nil, fmt.Errorf("plan is already fully paid")
	}

	targetPlan.PaidCount++
	remain := targetPlan.TotalCount - targetPlan.PaidCount
	if remain == 0 {
		targetPlan.Note = "ชำระครบถ้วนแล้ว"
		targetPlan.EndsAt = "จบแล้ว"
	} else {
		targetPlan.Note = fmt.Sprintf("เหลือ %s บาท", fmt.Sprintf("%.0f", targetPlan.Amount*float64(remain)))
		targetPlan.EndsAt = fmt.Sprintf("อีก %d งวด", remain)
	}

	// Deduct from bank account if specified
	acctName := "Main"
	for i := range s.db.Accounts {
		if s.db.Accounts[i].ID == fromAccountID || strings.EqualFold(s.db.Accounts[i].Name, fromAccountID) {
			s.db.Accounts[i].Amount -= targetPlan.Amount
			acctName = s.db.Accounts[i].Name
			break
		}
	}

	// Record transaction
	tx := models.Transaction{
		ID:           fmt.Sprintf("tx-%d", time.Now().UnixNano()),
		Title:        fmt.Sprintf("ผ่อน %s (งวด %d/%d)", targetPlan.Name, targetPlan.PaidCount, targetPlan.TotalCount),
		Category:     "บัตร/ผ่อน",
		CategoryTint: "#9b8ec4",
		Amount:       targetPlan.Amount,
		Account:      acctName,
		Date:         time.Now().Format("2006-01-02"),
		When:         "วันนี้ " + time.Now().Format("15:04"),
		IsIncome:     false,
		IsToday:      true,
	}
	s.db.Transactions = append([]models.Transaction{tx}, s.db.Transactions...)

	_ = s.saveLocked()
	return targetPlan, nil
}

// Full Account CRUD
func (s *StorageService) AddAccount(acc models.BankAccount) models.BankAccount {
	s.mu.Lock()
	defer s.mu.Unlock()
	if acc.ID == "" {
		acc.ID = fmt.Sprintf("acct-%d", time.Now().UnixNano())
	}
	if acc.Tint == "" {
		acc.Tint = "#d97757"
	}
	s.db.Accounts = append(s.db.Accounts, acc)
	_ = s.saveLocked()
	return acc
}

func (s *StorageService) DeleteAccount(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := make([]models.BankAccount, 0, len(s.db.Accounts))
	found := false
	for _, a := range s.db.Accounts {
		if a.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, a)
	}
	if found {
		s.db.Accounts = filtered
		_ = s.saveLocked()
	}
	return found
}

// Full Card CRUD
func (s *StorageService) AddCard(card models.CreditCard) models.CreditCard {
	s.mu.Lock()
	defer s.mu.Unlock()
	if card.ID == "" {
		card.ID = fmt.Sprintf("card-%d", time.Now().UnixNano())
	}
	if card.Tint == "" {
		card.Tint = "#d97757"
	}
	if card.Limit <= 0 {
		card.Limit = 30000
	}
	card.Pct = int((card.Amount / card.Limit) * 100)
	if card.Pct > 100 {
		card.Pct = 100
	}
	s.db.Cards = append(s.db.Cards, card)
	_ = s.saveLocked()
	return card
}

func (s *StorageService) DeleteCard(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := make([]models.CreditCard, 0, len(s.db.Cards))
	found := false
	for _, c := range s.db.Cards {
		if c.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, c)
	}
	if found {
		s.db.Cards = filtered
		_ = s.saveLocked()
	}
	return found
}

// Full Fixed CRUD
func (s *StorageService) AddFixed(f models.FixedExpense) models.FixedExpense {
	s.mu.Lock()
	defer s.mu.Unlock()
	if f.ID == "" {
		f.ID = fmt.Sprintf("fix-%d", time.Now().UnixNano())
	}
	s.db.Fixed = append(s.db.Fixed, f)
	_ = s.saveLocked()
	return f
}

func (s *StorageService) DeleteFixed(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := make([]models.FixedExpense, 0, len(s.db.Fixed))
	found := false
	for _, f := range s.db.Fixed {
		if f.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, f)
	}
	if found {
		s.db.Fixed = filtered
		_ = s.saveLocked()
	}
	return found
}

// Full Plan CRUD
func (s *StorageService) AddPlan(p models.InstallmentPlan) models.InstallmentPlan {
	s.mu.Lock()
	defer s.mu.Unlock()
	if p.ID == "" {
		p.ID = fmt.Sprintf("plan-%d", time.Now().UnixNano())
	}
	remain := p.TotalCount - p.PaidCount
	if p.Note == "" {
		p.Note = fmt.Sprintf("เหลือ %.0f บาท", p.Amount*float64(remain))
	}
	if p.EndsAt == "" {
		p.EndsAt = fmt.Sprintf("อีก %d งวด", remain)
	}
	s.db.Plans = append(s.db.Plans, p)
	_ = s.saveLocked()
	return p
}

func (s *StorageService) DeletePlan(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := make([]models.InstallmentPlan, 0, len(s.db.Plans))
	found := false
	for _, p := range s.db.Plans {
		if p.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, p)
	}
	if found {
		s.db.Plans = filtered
		_ = s.saveLocked()
	}
	return found
}

// Full Debt CRUD
func (s *StorageService) AddDebt(d models.Debt) models.Debt {
	s.mu.Lock()
	defer s.mu.Unlock()
	if d.ID == "" {
		d.ID = fmt.Sprintf("debt-%d", time.Now().UnixNano())
	}
	if d.What == "" {
		d.What = "ยืมเงิน · " + time.Now().Format("02/01")
	}
	s.db.Debts = append(s.db.Debts, d)
	_ = s.saveLocked()
	return d
}

func (s *StorageService) DeleteDebt(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	filtered := make([]models.Debt, 0, len(s.db.Debts))
	found := false
	for _, d := range s.db.Debts {
		if d.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, d)
	}
	if found {
		s.db.Debts = filtered
		_ = s.saveLocked()
	}
	return found
}

func (s *StorageService) GetDebts() []models.Debt {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.db.Debts == nil {
		return make([]models.Debt, 0)
	}
	return s.db.Debts
}

func (s *StorageService) ToggleDebt(id string) (*models.Debt, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.db.Debts {
		if s.db.Debts[i].ID == id {
			s.db.Debts[i].Cleared = !s.db.Debts[i].Cleared
			_ = s.saveLocked()
			return &s.db.Debts[i], nil
		}
	}
	return nil, fmt.Errorf("debt not found")
}

func (s *StorageService) GetAccounts() ([]models.BankAccount, []models.CreditCard, []models.FixedExpense, float64) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	totalBank := 0.0
	for _, a := range s.db.Accounts {
		totalBank += a.Amount
	}

	accts := s.db.Accounts
	if accts == nil {
		accts = make([]models.BankAccount, 0)
	}
	cards := s.db.Cards
	if cards == nil {
		cards = make([]models.CreditCard, 0)
	}
	fixed := s.db.Fixed
	if fixed == nil {
		fixed = make([]models.FixedExpense, 0)
	}

	return accts, cards, fixed, totalBank
}

func (s *StorageService) ToggleFixed(id string) (*models.FixedExpense, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.db.Fixed {
		if s.db.Fixed[i].ID == id {
			s.db.Fixed[i].Done = !s.db.Fixed[i].Done
			_ = s.saveLocked()
			return &s.db.Fixed[i], nil
		}
	}
	return nil, fmt.Errorf("fixed expense not found")
}

func (s *StorageService) GetPlans() (float64, float64, []models.InstallmentPlan) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	monthlyTotal := 0.0
	remainingTotal := 0.0

	for _, p := range s.db.Plans {
		if p.PaidCount < p.TotalCount {
			monthlyTotal += p.Amount
			remainCount := p.TotalCount - p.PaidCount
			remainingTotal += p.Amount * float64(remainCount)
		}
	}

	plans := s.db.Plans
	if plans == nil {
		plans = make([]models.InstallmentPlan, 0)
	}

	return monthlyTotal, remainingTotal, plans
}

func (s *StorageService) UpdateBudget(budget float64) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.db.MonthlyBudget = budget
	_ = s.saveLocked()
	return budget
}

func (s *StorageService) ResetData(cleanSlate bool) models.Database {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cleanSlate {
		s.db = models.Database{
			MonthlyBudget: 0,
			Transactions:  []models.Transaction{},
			Debts:         []models.Debt{},
			Accounts: []models.BankAccount{
				{ID: "acct-main", Name: "เงินสด/บัญชีหลัก", Role: "ใช้จ่ายประจำวัน", Amount: 0, Tint: "#d97757"},
			},
			Cards: []models.CreditCard{},
			Fixed: []models.FixedExpense{},
			Plans: []models.InstallmentPlan{},
		}
	} else {
		// Restore from initial
		data, err := os.ReadFile(s.initPath)
		if err == nil {
			var initDB models.Database
			if err := json.Unmarshal(data, &initDB); err == nil {
				s.db = initDB
			}
		}
	}

	_ = s.saveLocked()
	return s.db
}
