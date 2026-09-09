package storage

import (
	"ai-in-my-area-backend/internal/core/domain"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

type JSONFileStore struct {
	mu       sync.RWMutex
	dbPath   string
	initPath string
	db       domain.Database
}

func NewJSONFileStore() *JSONFileStore {
	candidates := []string{".", "..", "backend"}
	baseDir := "."
	for _, p := range candidates {
		if _, err := os.Stat(filepath.Join(p, "data", "initial_data.json")); err == nil {
			baseDir = p
			break
		}
	}

	dbPath := filepath.Join(baseDir, "data", "db.json")
	initPath := filepath.Join(baseDir, "data", "initial_data.json")

	store := &JSONFileStore{
		dbPath:   dbPath,
		initPath: initPath,
	}
	_ = store.load()
	return store
}

func (s *JSONFileStore) load() error {
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

	var db domain.Database
	if err := json.Unmarshal(data, &db); err != nil {
		return err
	}

	s.db = db
	return nil
}

func (s *JSONFileStore) save() error {
	_ = os.MkdirAll(filepath.Dir(s.dbPath), 0755)
	data, err := json.MarshalIndent(s.db, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.dbPath, data, 0644)
}

func (s *JSONFileStore) GetSummary() domain.SummaryResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var income, spent float64
	for _, tx := range s.db.Transactions {
		if tx.IsIncome {
			income += tx.Amount
		} else {
			spent += tx.Amount
		}
	}

	if income == 0 {
		income = s.db.MonthlyBudget
	}

	var fixedTotal float64
	var fixedDone int
	for _, f := range s.db.Fixed {
		fixedTotal += f.Amount
		if f.Done {
			fixedDone++
		}
	}

	var planMonthly float64
	for _, p := range s.db.Plans {
		if p.PaidCount < p.TotalCount {
			planMonthly += p.Amount
		}
	}

	totalSpent := spent + fixedTotal + planMonthly
	left := income - totalSpent

	spentPct := 0
	if income > 0 {
		spentPct = int((totalSpent / income) * 100)
		if spentPct > 100 {
			spentPct = 100
		}
	}

	dues := make([]domain.DueItem, 0)
	for _, f := range s.db.Fixed {
		if !f.Done {
			dues = append(dues, domain.DueItem{
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
			dues = append(dues, domain.DueItem{
				Day:    c.CutDay,
				Name:   c.Name,
				Note:   "รอบบิล · จ่าย " + c.DueDate,
				Amount: c.Amount,
				Tint:   c.Tint,
			})
		}
	}

	sort.SliceStable(dues, func(i, j int) bool {
		return dues[i].Day < dues[j].Day
	})

	var debtTotal float64
	debts := make([]domain.Debt, 0)
	for _, d := range s.db.Debts {
		debts = append(debts, d)
		if !d.Cleared {
			debtTotal += d.Amount
		}
	}

	recent := make([]domain.Transaction, 0)
	if len(s.db.Transactions) > 10 {
		recent = append(recent, s.db.Transactions[:10]...)
	} else {
		recent = append(recent, s.db.Transactions...)
	}

	return domain.SummaryResponse{
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

func (s *JSONFileStore) GetTransactions() []domain.Transaction {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]domain.Transaction, len(s.db.Transactions))
	copy(res, s.db.Transactions)
	return res
}

func (s *JSONFileStore) AddTransaction(tx domain.Transaction) domain.Transaction {
	s.mu.Lock()
	defer s.mu.Unlock()

	bkkLoc := time.FixedZone("Asia/Bangkok", 7*3600)
	now := time.Now().In(bkkLoc)
	if tx.ID == "" {
		tx.ID = fmt.Sprintf("tx-%d", now.UnixNano())
	}
	if tx.Date == "" {
		tx.Date = now.Format("02 Jan")
	}
	if tx.When == "" {
		tx.When = "วันนี้ · " + now.Format("15:04 น.")
	}
	tx.IsToday = true

	s.db.Transactions = append([]domain.Transaction{tx}, s.db.Transactions...)

	// Update bank or card
	for i, a := range s.db.Accounts {
		if strings.EqualFold(a.Name, tx.Account) || strings.EqualFold(a.ID, tx.Account) {
			if tx.IsIncome {
				s.db.Accounts[i].Amount += tx.Amount
			} else {
				s.db.Accounts[i].Amount -= tx.Amount
			}
			break
		}
	}

	_ = s.save()
	return tx
}

func (s *JSONFileStore) DeleteTransaction(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	var target domain.Transaction
	for i, tx := range s.db.Transactions {
		if tx.ID == id {
			idx = i
			target = tx
			break
		}
	}
	if idx == -1 {
		return false
	}

	s.db.Transactions = append(s.db.Transactions[:idx], s.db.Transactions[idx+1:]...)

	// Rollback balance
	for i, a := range s.db.Accounts {
		if strings.EqualFold(a.Name, target.Account) || strings.EqualFold(a.ID, target.Account) {
			if target.IsIncome {
				s.db.Accounts[i].Amount -= target.Amount
			} else {
				s.db.Accounts[i].Amount += target.Amount
			}
			break
		}
	}

	_ = s.save()
	return true
}

func (s *JSONFileStore) GetDebts() []domain.Debt {
	s.mu.RLock()
	defer s.mu.RUnlock()
	res := make([]domain.Debt, len(s.db.Debts))
	copy(res, s.db.Debts)
	return res
}

func (s *JSONFileStore) AddDebt(deb domain.Debt) domain.Debt {
	s.mu.Lock()
	defer s.mu.Unlock()

	if deb.ID == "" {
		deb.ID = fmt.Sprintf("debt-%d", time.Now().UnixNano())
	}
	s.db.Debts = append([]domain.Debt{deb}, s.db.Debts...)
	_ = s.save()
	return deb
}

func (s *JSONFileStore) ToggleDebt(id string) (domain.Debt, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, d := range s.db.Debts {
		if d.ID == id {
			s.db.Debts[i].Cleared = !s.db.Debts[i].Cleared
			_ = s.save()
			return s.db.Debts[i], nil
		}
	}
	return domain.Debt{}, errors.New("debt not found")
}

func (s *JSONFileStore) DeleteDebt(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i, d := range s.db.Debts {
		if d.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.db.Debts = append(s.db.Debts[:idx], s.db.Debts[idx+1:]...)
	_ = s.save()
	return true
}

func (s *JSONFileStore) GetAccounts() (accounts []domain.BankAccount, cards []domain.CreditCard, fixed []domain.FixedExpense, bankTotal float64) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	accounts = make([]domain.BankAccount, len(s.db.Accounts))
	copy(accounts, s.db.Accounts)

	cards = make([]domain.CreditCard, len(s.db.Cards))
	copy(cards, s.db.Cards)

	fixed = make([]domain.FixedExpense, len(s.db.Fixed))
	copy(fixed, s.db.Fixed)

	for _, a := range accounts {
		bankTotal += a.Amount
	}
	return accounts, cards, fixed, bankTotal
}

func (s *JSONFileStore) AddAccount(acc domain.BankAccount) domain.BankAccount {
	s.mu.Lock()
	defer s.mu.Unlock()
	if acc.ID == "" {
		acc.ID = fmt.Sprintf("acct-%d", time.Now().UnixNano())
	}
	s.db.Accounts = append(s.db.Accounts, acc)
	_ = s.save()
	return acc
}

func (s *JSONFileStore) UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, a := range s.db.Accounts {
		if a.ID == id {
			if acc.Name != "" {
				s.db.Accounts[i].Name = acc.Name
			}
			if acc.Role != "" {
				s.db.Accounts[i].Role = acc.Role
			}
			s.db.Accounts[i].Amount = acc.Amount
			_ = s.save()
			return s.db.Accounts[i], nil
		}
	}
	return domain.BankAccount{}, errors.New("account not found")
}

func (s *JSONFileStore) DeleteAccount(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := -1
	for i, a := range s.db.Accounts {
		if a.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.db.Accounts = append(s.db.Accounts[:idx], s.db.Accounts[idx+1:]...)
	_ = s.save()
	return true
}

func (s *JSONFileStore) TransferAccount(fromID, toID string, amount float64, note string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fromIdx := -1
	toIdx := -1
	for i, a := range s.db.Accounts {
		if a.ID == fromID || a.Name == fromID {
			fromIdx = i
		}
		if a.ID == toID || a.Name == toID {
			toIdx = i
		}
	}

	if fromIdx == -1 || toIdx == -1 {
		return errors.New("sender or recipient account not found")
	}

	if s.db.Accounts[fromIdx].Amount < amount {
		return errors.New("insufficient balance in sender account")
	}

	s.db.Accounts[fromIdx].Amount -= amount
	s.db.Accounts[toIdx].Amount += amount

	// Log transaction record
	bkkLoc := time.FixedZone("Asia/Bangkok", 7*3600)
	nowBkk := time.Now().In(bkkLoc)
	tx := domain.Transaction{
		ID:           fmt.Sprintf("tx-%d", nowBkk.UnixNano()),
		Title:        fmt.Sprintf("โอนไป %s", s.db.Accounts[toIdx].Name),
		Category:     "โอนเงิน",
		CategoryTint: "#7fa3c9",
		Amount:       amount,
		Account:      s.db.Accounts[fromIdx].Name,
		Date:         nowBkk.Format("02 Jan"),
		When:         "วันนี้ · " + nowBkk.Format("15:04 น."),
		IsIncome:     false,
		IsToday:      true,
	}
	s.db.Transactions = append([]domain.Transaction{tx}, s.db.Transactions...)

	_ = s.save()
	return nil
}

func (s *JSONFileStore) AddCard(card domain.CreditCard) domain.CreditCard {
	s.mu.Lock()
	defer s.mu.Unlock()
	if card.ID == "" {
		card.ID = fmt.Sprintf("card-%d", time.Now().UnixNano())
	}
	s.db.Cards = append(s.db.Cards, card)
	_ = s.save()
	return card
}

func (s *JSONFileStore) PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cIdx := -1
	for i, c := range s.db.Cards {
		if c.ID == cardID {
			cIdx = i
			break
		}
	}
	if cIdx == -1 {
		return domain.CreditCard{}, errors.New("card not found")
	}

	for i, a := range s.db.Accounts {
		if a.ID == fromAccountID || a.Name == fromAccountID {
			s.db.Accounts[i].Amount -= amount
			break
		}
	}

	s.db.Cards[cIdx].Amount -= amount
	if s.db.Cards[cIdx].Amount <= 0 {
		s.db.Cards[cIdx].Amount = 0
		s.db.Cards[cIdx].Status = "ชำระแล้ว"
	}

	_ = s.save()
	return s.db.Cards[cIdx], nil
}

func (s *JSONFileStore) DeleteCard(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := -1
	for i, c := range s.db.Cards {
		if c.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.db.Cards = append(s.db.Cards[:idx], s.db.Cards[idx+1:]...)
	_ = s.save()
	return true
}

func (s *JSONFileStore) AddFixed(fixed domain.FixedExpense) domain.FixedExpense {
	s.mu.Lock()
	defer s.mu.Unlock()
	if fixed.ID == "" {
		fixed.ID = fmt.Sprintf("fixed-%d", time.Now().UnixNano())
	}
	s.db.Fixed = append(s.db.Fixed, fixed)
	_ = s.save()
	return fixed
}

func (s *JSONFileStore) ToggleFixed(id string) (domain.FixedExpense, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, f := range s.db.Fixed {
		if f.ID == id {
			s.db.Fixed[i].Done = !s.db.Fixed[i].Done
			_ = s.save()
			return s.db.Fixed[i], nil
		}
	}
	return domain.FixedExpense{}, errors.New("fixed expense not found")
}

func (s *JSONFileStore) DeleteFixed(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := -1
	for i, f := range s.db.Fixed {
		if f.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.db.Fixed = append(s.db.Fixed[:idx], s.db.Fixed[idx+1:]...)
	_ = s.save()
	return true
}

func (s *JSONFileStore) GetPlans() (monthlyTotal float64, remainingTotal float64, plans []domain.InstallmentPlan) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	plans = make([]domain.InstallmentPlan, len(s.db.Plans))
	copy(plans, s.db.Plans)

	for _, p := range plans {
		if p.PaidCount < p.TotalCount {
			monthlyTotal += p.Amount
			remain := p.TotalCount - p.PaidCount
			remainingTotal += p.Amount * float64(remain)
		}
	}
	return monthlyTotal, remainingTotal, plans
}

func (s *JSONFileStore) AddPlan(plan domain.InstallmentPlan) domain.InstallmentPlan {
	s.mu.Lock()
	defer s.mu.Unlock()
	if plan.ID == "" {
		plan.ID = fmt.Sprintf("plan-%d", time.Now().UnixNano())
	}
	s.db.Plans = append(s.db.Plans, plan)
	_ = s.save()
	return plan
}

func (s *JSONFileStore) PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pIdx := -1
	for i, p := range s.db.Plans {
		if p.ID == planID {
			pIdx = i
			break
		}
	}
	if pIdx == -1 {
		return domain.InstallmentPlan{}, errors.New("plan not found")
	}

	for i, a := range s.db.Accounts {
		if a.ID == fromAccountID || a.Name == fromAccountID {
			s.db.Accounts[i].Amount -= s.db.Plans[pIdx].Amount
			break
		}
	}

	s.db.Plans[pIdx].PaidCount++
	_ = s.save()
	return s.db.Plans[pIdx], nil
}

func (s *JSONFileStore) DeletePlan(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := -1
	for i, p := range s.db.Plans {
		if p.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.db.Plans = append(s.db.Plans[:idx], s.db.Plans[idx+1:]...)
	_ = s.save()
	return true
}

func (s *JSONFileStore) UpdateBudget(budget float64) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.db.MonthlyBudget = budget
	_ = s.save()
	return budget
}

func (s *JSONFileStore) ResetData(cleanSlate bool) domain.Database {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cleanSlate {
		s.db = domain.Database{
			MonthlyBudget: 45000,
			Transactions:  []domain.Transaction{},
			Debts:         []domain.Debt{},
			Accounts:      []domain.BankAccount{},
			Cards:         []domain.CreditCard{},
			Fixed:         []domain.FixedExpense{},
			Plans:         []domain.InstallmentPlan{},
		}
	} else {
		if data, err := os.ReadFile(s.initPath); err == nil {
			_ = json.Unmarshal(data, &s.db)
		}
	}

	_ = s.save()
	return s.db
}
