package storage

import (
	"ai-in-my-area-backend/pkg/core/domain"
	"ai-in-my-area-backend/pkg/core/ports"
	"crypto/tls"
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-sql-driver/mysql"
)

type StorageRepository struct {
	mu         sync.RWMutex
	sqlDB      *sql.DB
	isMySQL    bool
	lastError  string
	dbURL      string
	localStore *JSONFileStore
}

func NewStorageRepository(cfg domain.AppConfig) ports.RepositoryPort {
	// Register TLS for TiDB Cloud
	_ = mysql.RegisterTLSConfig("tidbtls", &tls.Config{
		ServerName:         "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
		InsecureSkipVerify: true,
	})

	repo := &StorageRepository{
		dbURL:      cfg.DatabaseURL,
		localStore: NewJSONFileStore(),
	}

	if repo.dbURL != "" {
		if err := repo.connectMySQL(repo.dbURL); err != nil {
			fmt.Printf("[DB Adapter] MySQL connection failed: %v. Falling back to local storage.\n", err)
			repo.lastError = err.Error()
		} else {
			fmt.Println("[DB Adapter] Successfully connected to MySQL / TiDB Cloud!")
			repo.isMySQL = true
			repo.lastError = ""
			if err := repo.initSchema(); err != nil {
				fmt.Printf("[DB Adapter] Error initializing schema: %v\n", err)
			}
		}
	}

	return repo
}

func parseMySQLURL(rawURL string) (string, error) {
	if !strings.HasPrefix(rawURL, "mysql://") {
		return rawURL, nil
	}

	trimmed := strings.TrimPrefix(rawURL, "mysql://")
	atIndex := strings.LastIndex(trimmed, "@")
	if atIndex == -1 {
		return "", fmt.Errorf("invalid mysql url: missing @")
	}

	userPass := trimmed[:atIndex]
	hostDb := trimmed[atIndex+1:]

	colonIndex := strings.Index(userPass, ":")
	if colonIndex == -1 {
		return "", fmt.Errorf("invalid mysql url: missing password delimiter")
	}

	username := userPass[:colonIndex]
	password := userPass[colonIndex+1:]
	if decodedPass, err := url.QueryUnescape(password); err == nil {
		password = decodedPass
	}

	slashIndex := strings.Index(hostDb, "/")
	dbname := "jod_ngen"
	hostPort := hostDb
	if slashIndex != -1 {
		hostPort = hostDb[:slashIndex]
		cand := strings.TrimPrefix(hostDb[slashIndex:], "/")
		if cand != "" && cand != "sys" {
			dbname = cand
		}
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?tls=tidbtls&charset=utf8mb4&parseTime=true", username, password, hostPort, dbname)
	return dsn, nil
}

func (r *StorageRepository) connectMySQL(rawURL string) error {
	dsn, err := parseMySQLURL(rawURL)
	if err != nil {
		return err
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return err
	}

	if r.sqlDB != nil {
		_ = r.sqlDB.Close()
	}
	r.sqlDB = db
	return nil
}

func (r *StorageRepository) Reconnect(rawURL string) (bool, string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.dbURL = rawURL

	err := r.connectMySQL(rawURL)
	if err != nil {
		r.isMySQL = false
		r.lastError = err.Error()
		return false, err.Error()
	}

	r.isMySQL = true
	r.lastError = ""
	_ = r.initSchema()
	return true, "Connected successfully"
}

func (r *StorageRepository) GetStatus() domain.DatabaseStatus {
	r.mu.RLock()
	defer r.mu.RUnlock()

	engine := "Local JSON File Store"
	if r.isMySQL {
		engine = "TiDB / MySQL Cloud"
	}

	return domain.DatabaseStatus{
		Connected:   r.isMySQL,
		Engine:      engine,
		DatabaseURL: maskURL(r.dbURL),
		Error:       r.lastError,
	}
}

func maskURL(raw string) string {
	re := regexp.MustCompile(`:[^:@]+@`)
	return re.ReplaceAllString(raw, ":****@")
}

func (r *StorageRepository) initSchema() error {
	if !r.isMySQL || r.sqlDB == nil {
		return nil
	}

	queries := []string{
		`CREATE TABLE IF NOT EXISTS transactions (
			id VARCHAR(64) PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			category VARCHAR(100) NOT NULL,
			category_tint VARCHAR(20) NOT NULL,
			amount DOUBLE NOT NULL,
			account VARCHAR(100) NOT NULL,
			date VARCHAR(20) NOT NULL,
			when_text VARCHAR(100) NOT NULL,
			is_income BOOLEAN NOT NULL DEFAULT 0,
			is_today BOOLEAN NOT NULL DEFAULT 0,
			receipt_image MEDIUMTEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS debts (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			what VARCHAR(255) NOT NULL,
			amount DOUBLE NOT NULL,
			cleared BOOLEAN NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS accounts (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			role VARCHAR(255) NOT NULL,
			amount DOUBLE NOT NULL,
			tint VARCHAR(20) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS cards (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			cut_day VARCHAR(20) NOT NULL,
			due_date VARCHAR(20) NOT NULL,
			amount DOUBLE NOT NULL,
			credit_limit DOUBLE NOT NULL DEFAULT 30000,
			pct INT NOT NULL DEFAULT 0,
			status VARCHAR(100) NOT NULL,
			tint VARCHAR(20) NOT NULL,
			chip_bg VARCHAR(50) NOT NULL,
			pdf_name VARCHAR(100) NOT NULL,
			pdf_label VARCHAR(100) NOT NULL,
			pdf_summary TEXT
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS fixed_expenses (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			amount DOUBLE NOT NULL,
			day VARCHAR(20) NOT NULL,
			done BOOLEAN NOT NULL DEFAULT 0
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS installment_plans (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			amount DOUBLE NOT NULL,
			paid_count INT NOT NULL DEFAULT 0,
			total_count INT NOT NULL DEFAULT 10,
			note VARCHAR(255),
			ends_at VARCHAR(100)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS app_settings (
			k VARCHAR(64) PRIMARY KEY,
			v TEXT
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
	}

	for _, q := range queries {
		if _, err := r.sqlDB.Exec(q); err != nil {
			log.Printf("[DB Adapter] Schema error: %v", err)
			return err
		}
	}

	_, _ = r.sqlDB.Exec("UPDATE accounts SET name = 'บัญชีหลัก' WHERE name = 'เงินสด/บัญชีหลัก' OR id = 'acct-main'")
	_, _ = r.sqlDB.Exec("UPDATE transactions SET account = 'บัญชีหลัก' WHERE account = 'เงินสด/บัญชีหลัก'")

	r.seedIfEmpty()
	return nil
}

func (r *StorageRepository) seedIfEmpty() {
	var count int
	_ = r.sqlDB.QueryRow("SELECT COUNT(*) FROM accounts").Scan(&count)
	var cardCount int
	_ = r.sqlDB.QueryRow("SELECT COUNT(*) FROM cards").Scan(&cardCount)
	if count > 0 && cardCount > 0 {
		return
	}

	initialDB := r.localStore.db

	for _, a := range initialDB.Accounts {
		_, _ = r.sqlDB.Exec("INSERT INTO accounts (id, name, role, amount, tint) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			a.ID, a.Name, a.Role, a.Amount, a.Tint)
	}

	for _, c := range initialDB.Cards {
		_, _ = r.sqlDB.Exec(`INSERT INTO cards 
			(id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount`,
			c.ID, c.Name, c.CutDay, c.DueDate, c.Amount, c.Limit, c.Pct, c.Status, c.Tint, c.ChipBg, c.PdfName, c.PdfLabel, c.PdfSummary)
	}

	for _, f := range initialDB.Fixed {
		_, _ = r.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			f.ID, f.Name, f.Amount, f.Day, f.Done)
	}

	for _, p := range initialDB.Plans {
		_, _ = r.sqlDB.Exec("INSERT INTO installment_plans (id, name, amount, paid_count, total_count, note, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			p.ID, p.Name, p.Amount, p.PaidCount, p.TotalCount, p.Note, p.EndsAt)
	}

	for _, deb := range initialDB.Debts {
		_, _ = r.sqlDB.Exec("INSERT INTO debts (id, name, what, amount, cleared) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			deb.ID, deb.Name, deb.What, deb.Amount, deb.Cleared)
	}

	for _, tx := range initialDB.Transactions {
		_, _ = r.sqlDB.Exec(`INSERT INTO transactions 
			(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today, receipt_image) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount`,
			tx.ID, tx.Title, tx.Category, tx.CategoryTint, tx.Amount, tx.Account, tx.Date, tx.When, tx.IsIncome, tx.IsToday, tx.ReceiptImage)
	}

	_, _ = r.sqlDB.Exec("INSERT INTO app_settings (k, v) VALUES ('monthlyBudget', '45000') ON DUPLICATE KEY UPDATE v='45000'")
}

func (r *StorageRepository) GetSummary() domain.SummaryResponse {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.GetSummary()
	}

	var budgetStr string
	budget := 45000.0
	if err := r.sqlDB.QueryRow("SELECT v FROM app_settings WHERE k = 'monthlyBudget'").Scan(&budgetStr); err == nil {
		var b float64
		if _, err := fmt.Sscanf(budgetStr, "%f", &b); err == nil && b > 0 {
			budget = b
		}
	}

	var income, spentTx float64
	rows, err := r.sqlDB.Query("SELECT amount, is_income FROM transactions")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var a float64
			var inc bool
			if err := rows.Scan(&a, &inc); err == nil {
				if inc {
					income += a
				} else {
					spentTx += a
				}
			}
		}
	}
	if income == 0 {
		income = budget
	}

	var fixedTotal float64
	var fixedDone, fixedTotalCount int
	fRows, err := r.sqlDB.Query("SELECT amount, done FROM fixed_expenses")
	if err == nil {
		defer fRows.Close()
		for fRows.Next() {
			var fa float64
			var fd bool
			if err := fRows.Scan(&fa, &fd); err == nil {
				fixedTotal += fa
				fixedTotalCount++
				if fd {
					fixedDone++
				}
			}
		}
	}

	var planMonthly float64
	var planCount int
	pRows, err := r.sqlDB.Query("SELECT amount, paid_count, total_count FROM installment_plans")
	if err == nil {
		defer pRows.Close()
		for pRows.Next() {
			var pa float64
			var paid, total int
			if err := pRows.Scan(&pa, &paid, &total); err == nil {
				planCount++
				if paid < total {
					planMonthly += pa
				}
			}
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

	debts := make([]domain.Debt, 0)
	var debtTotal float64
	dRows, err := r.sqlDB.Query("SELECT id, name, what, amount, cleared FROM debts ORDER BY created_at DESC")
	if err == nil {
		defer dRows.Close()
		for dRows.Next() {
			var deb domain.Debt
			if err := dRows.Scan(&deb.ID, &deb.Name, &deb.What, &deb.Amount, &deb.Cleared); err == nil {
				debts = append(debts, deb)
				if !deb.Cleared {
					debtTotal += deb.Amount
				}
			}
		}
	}

	dues := make([]domain.DueItem, 0)
	fDueRows, err := r.sqlDB.Query("SELECT day, name, amount FROM fixed_expenses WHERE done = 0")
	if err == nil {
		defer fDueRows.Close()
		for fDueRows.Next() {
			var di domain.DueItem
			if err := fDueRows.Scan(&di.Day, &di.Name, &di.Amount); err == nil {
				di.Note = "คงที่ · รายเดือน"
				di.Tint = "#d97757"
				dues = append(dues, di)
			}
		}
	}
	cDueRows, err := r.sqlDB.Query("SELECT cut_day, name, due_date, amount, tint FROM cards WHERE amount > 0")
	if err == nil {
		defer cDueRows.Close()
		for cDueRows.Next() {
			var cutDay, name, dueDate, tint string
			var amt float64
			if err := cDueRows.Scan(&cutDay, &name, &dueDate, &amt, &tint); err == nil {
				dues = append(dues, domain.DueItem{
					Day:    cutDay,
					Name:   name,
					Note:   "รอบบิล · จ่าย " + dueDate,
					Amount: amt,
					Tint:   tint,
				})
			}
		}
	}

	recent := make([]domain.Transaction, 0)
	tRows, err := r.sqlDB.Query("SELECT id, title, category, category_tint, amount, account, date, when_text, is_income, is_today, COALESCE(receipt_image, '') FROM transactions ORDER BY created_at DESC LIMIT 10")
	if err == nil {
		defer tRows.Close()
		for tRows.Next() {
			var tx domain.Transaction
			if err := tRows.Scan(&tx.ID, &tx.Title, &tx.Category, &tx.CategoryTint, &tx.Amount, &tx.Account, &tx.Date, &tx.When, &tx.IsIncome, &tx.IsToday, &tx.ReceiptImage); err == nil {
				recent = append(recent, tx)
			}
		}
	}

	return domain.SummaryResponse{
		MonthlyIncome:   income,
		MonthlySpent:    totalSpent,
		Remaining:       left,
		SpentPct:        spentPct,
		FixedTotal:      fixedTotal,
		FixedCountDone:  fixedDone,
		FixedCountTotal: fixedTotalCount,
		PlanMonthly:     planMonthly,
		PlanItemsCount:  planCount,
		Dues:            dues,
		Debts:           debts,
		DebtTotal:       debtTotal,
		Recent:          recent,
	}
}

func (r *StorageRepository) GetTransactions() []domain.Transaction {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.GetTransactions()
	}

	list := make([]domain.Transaction, 0)
	rows, err := r.sqlDB.Query("SELECT id, title, category, category_tint, amount, account, date, when_text, is_income, is_today, COALESCE(receipt_image, '') FROM transactions ORDER BY created_at DESC")
	if err != nil {
		return list
	}
	defer rows.Close()

	for rows.Next() {
		var tx domain.Transaction
		if err := rows.Scan(&tx.ID, &tx.Title, &tx.Category, &tx.CategoryTint, &tx.Amount, &tx.Account, &tx.Date, &tx.When, &tx.IsIncome, &tx.IsToday, &tx.ReceiptImage); err == nil {
			list = append(list, tx)
		}
	}
	return list
}

func (r *StorageRepository) AddTransaction(tx domain.Transaction) domain.Transaction {
	r.mu.Lock()
	defer r.mu.Unlock()

	created := r.localStore.AddTransaction(tx)

	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec(`INSERT INTO transactions 
			(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today, receipt_image) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			created.ID, created.Title, created.Category, created.CategoryTint, created.Amount, created.Account, created.Date, created.When, created.IsIncome, created.IsToday, created.ReceiptImage)

		if created.IsIncome {
			_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
		} else {
			res, _ := r.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
			if n, _ := res.RowsAffected(); n == 0 {
				_, _ = r.sqlDB.Exec("UPDATE cards SET amount = amount + ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
			}
		}
	}

	return created
}

func (r *StorageRepository) DeleteTransaction(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	ok := r.localStore.DeleteTransaction(id)

	if r.isMySQL && r.sqlDB != nil {
		var amount float64
		var account string
		var isIncome bool
		err := r.sqlDB.QueryRow("SELECT amount, account, is_income FROM transactions WHERE id = ?", id).Scan(&amount, &account, &isIncome)
		if err == nil {
			if isIncome {
				_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE name = ? OR id = ?", amount, account, account)
			} else {
				res, _ := r.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", amount, account, account)
				if n, _ := res.RowsAffected(); n == 0 {
					_, _ = r.sqlDB.Exec("UPDATE cards SET amount = GREATEST(0, amount - ?) WHERE name = ? OR id = ?", amount, account, account)
				}
			}
			_, _ = r.sqlDB.Exec("DELETE FROM transactions WHERE id = ?", id)
		}
	}

	return ok
}

func (r *StorageRepository) GetDebts() []domain.Debt {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.GetDebts()
	}
	debts := make([]domain.Debt, 0)
	rows, err := r.sqlDB.Query("SELECT id, name, what, amount, cleared FROM debts ORDER BY created_at DESC")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var deb domain.Debt
			if err := rows.Scan(&deb.ID, &deb.Name, &deb.What, &deb.Amount, &deb.Cleared); err == nil {
				debts = append(debts, deb)
			}
		}
	}
	return debts
}

func (r *StorageRepository) AddDebt(deb domain.Debt) domain.Debt {
	r.mu.Lock()
	defer r.mu.Unlock()
	created := r.localStore.AddDebt(deb)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("INSERT INTO debts (id, name, what, amount, cleared) VALUES (?, ?, ?, ?, ?)",
			created.ID, created.Name, created.What, created.Amount, created.Cleared)
	}
	return created
}

func (r *StorageRepository) ToggleDebt(id string) (domain.Debt, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	updated, err := r.localStore.ToggleDebt(id)
	if err != nil {
		return domain.Debt{}, err
	}
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE debts SET cleared = ? WHERE id = ?", updated.Cleared, id)
	}
	return updated, nil
}

func (r *StorageRepository) DeleteDebt(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	ok := r.localStore.DeleteDebt(id)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM debts WHERE id = ?", id)
	}
	return ok
}

func (r *StorageRepository) GetAccounts() ([]domain.BankAccount, []domain.CreditCard, []domain.FixedExpense, float64) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.GetAccounts()
	}

	accounts := make([]domain.BankAccount, 0)
	aRows, err := r.sqlDB.Query("SELECT id, name, role, amount, tint FROM accounts")
	if err == nil {
		defer aRows.Close()
		for aRows.Next() {
			var a domain.BankAccount
			if err := aRows.Scan(&a.ID, &a.Name, &a.Role, &a.Amount, &a.Tint); err == nil {
				accounts = append(accounts, a)
			}
		}
	}

	totalBank := 0.0
	for _, a := range accounts {
		totalBank += a.Amount
	}

	cards := make([]domain.CreditCard, 0)
	cRows, err := r.sqlDB.Query("SELECT id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary FROM cards")
	if err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var c domain.CreditCard
			if err := cRows.Scan(&c.ID, &c.Name, &c.CutDay, &c.DueDate, &c.Amount, &c.Limit, &c.Pct, &c.Status, &c.Tint, &c.ChipBg, &c.PdfName, &c.PdfLabel, &c.PdfSummary); err == nil {
				c.ReconcileLines = make([]domain.ReconcileLine, 0)
				cards = append(cards, c)
			}
		}
	}

	fixed := make([]domain.FixedExpense, 0)
	fRows, err := r.sqlDB.Query("SELECT id, name, amount, day, done FROM fixed_expenses")
	if err == nil {
		defer fRows.Close()
		for fRows.Next() {
			var f domain.FixedExpense
			if err := fRows.Scan(&f.ID, &f.Name, &f.Amount, &f.Day, &f.Done); err == nil {
				fixed = append(fixed, f)
			}
		}
	}

	return accounts, cards, fixed, totalBank
}

func (r *StorageRepository) AddAccount(acc domain.BankAccount) domain.BankAccount {
	r.mu.Lock()
	defer r.mu.Unlock()
	created := r.localStore.AddAccount(acc)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("INSERT INTO accounts (id, name, role, amount, tint) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, role = ?, amount = ?, tint = ?",
			created.ID, created.Name, created.Role, created.Amount, created.Tint,
			created.Name, created.Role, created.Amount, created.Tint)
	}
	return created
}

func (r *StorageRepository) UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	updated, err := r.localStore.UpdateAccount(id, acc)
	if err != nil {
		return domain.BankAccount{}, err
	}
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = ?, name = COALESCE(NULLIF(?, ''), name), role = COALESCE(NULLIF(?, ''), role) WHERE id = ?",
			updated.Amount, updated.Name, updated.Role, id)
	}
	return updated, nil
}

func (r *StorageRepository) DeleteAccount(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	ok := r.localStore.DeleteAccount(id)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM accounts WHERE id = ?", id)
	}
	return ok
}

func (r *StorageRepository) TransferAccount(fromID, toID string, amount float64, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	err := r.localStore.TransferAccount(fromID, toID, amount, note)
	if err != nil {
		return err
	}

	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", amount, fromID, fromID)
		_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE id = ? OR name = ?", amount, toID, toID)

		if len(r.localStore.db.Transactions) > 0 {
			tx := r.localStore.db.Transactions[0]
			_, _ = r.sqlDB.Exec(`INSERT INTO transactions 
				(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				tx.ID, tx.Title, tx.Category, tx.CategoryTint, tx.Amount, tx.Account, tx.Date, tx.When, tx.IsIncome, tx.IsToday)
		}
	}

	return nil
}

func (r *StorageRepository) AddCard(card domain.CreditCard) domain.CreditCard {
	r.mu.Lock()
	defer r.mu.Unlock()
	created := r.localStore.AddCard(card)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec(`INSERT INTO cards 
			(id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			created.ID, created.Name, created.CutDay, created.DueDate, created.Amount, created.Limit, created.Pct, created.Status, created.Tint, created.ChipBg, created.PdfName, created.PdfLabel, created.PdfSummary)
	}
	return created
}

func (r *StorageRepository) PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	updated, err := r.localStore.PayCard(cardID, fromAccountID, amount)
	if err != nil {
		return domain.CreditCard{}, err
	}

	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", amount, fromAccountID, fromAccountID)
		_, _ = r.sqlDB.Exec("UPDATE cards SET amount = GREATEST(0, amount - ?), status = 'ชำระแล้ว' WHERE id = ?", amount, cardID)
	}

	return updated, nil
}

func (r *StorageRepository) DeleteCard(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	ok := r.localStore.DeleteCard(id)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM cards WHERE id = ?", id)
	}
	return ok
}

func (r *StorageRepository) AddFixed(fixed domain.FixedExpense) domain.FixedExpense {
	r.mu.Lock()
	defer r.mu.Unlock()
	created := r.localStore.AddFixed(fixed)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done) VALUES (?, ?, ?, ?, ?)",
			created.ID, created.Name, created.Amount, created.Day, created.Done)
	}
	return created
}

func (r *StorageRepository) ToggleFixed(id string) (domain.FixedExpense, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	updated, err := r.localStore.ToggleFixed(id)
	if err != nil {
		return domain.FixedExpense{}, err
	}
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE fixed_expenses SET done = ? WHERE id = ?", updated.Done, id)
	}
	return updated, nil
}

func (r *StorageRepository) DeleteFixed(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	ok := r.localStore.DeleteFixed(id)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM fixed_expenses WHERE id = ?", id)
	}
	return ok
}

func (r *StorageRepository) GetPlans() (monthlyTotal float64, remainingTotal float64, plans []domain.InstallmentPlan) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.GetPlans()
	}

	monthlyTotal = 0.0
	remainingTotal = 0.0
	plans = make([]domain.InstallmentPlan, 0)

	rows, err := r.sqlDB.Query("SELECT id, name, amount, paid_count, total_count, note, ends_at FROM installment_plans")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p domain.InstallmentPlan
			if err := rows.Scan(&p.ID, &p.Name, &p.Amount, &p.PaidCount, &p.TotalCount, &p.Note, &p.EndsAt); err == nil {
				plans = append(plans, p)
				if p.PaidCount < p.TotalCount {
					monthlyTotal += p.Amount
					remain := p.TotalCount - p.PaidCount
					remainingTotal += p.Amount * float64(remain)
				}
			}
		}
	}

	return monthlyTotal, remainingTotal, plans
}

func (r *StorageRepository) AddPlan(plan domain.InstallmentPlan) domain.InstallmentPlan {
	r.mu.Lock()
	defer r.mu.Unlock()
	created := r.localStore.AddPlan(plan)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("INSERT INTO installment_plans (id, name, amount, paid_count, total_count, note, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			created.ID, created.Name, created.Amount, created.PaidCount, created.TotalCount, created.Note, created.EndsAt)
	}
	return created
}

func (r *StorageRepository) PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	updated, err := r.localStore.PayPlan(planID, fromAccountID)
	if err != nil {
		return domain.InstallmentPlan{}, err
	}

	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", updated.Amount, fromAccountID, fromAccountID)
		_, _ = r.sqlDB.Exec("UPDATE installment_plans SET paid_count = paid_count + 1 WHERE id = ?", planID)
	}

	return updated, nil
}

func (r *StorageRepository) DeletePlan(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	ok := r.localStore.DeletePlan(id)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM installment_plans WHERE id = ?", id)
	}
	return ok
}

func (r *StorageRepository) UpdateBudget(budget float64) float64 {
	r.mu.Lock()
	defer r.mu.Unlock()
	res := r.localStore.UpdateBudget(budget)
	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("INSERT INTO app_settings (k, v) VALUES ('monthlyBudget', ?) ON DUPLICATE KEY UPDATE v = ?",
			fmt.Sprintf("%.0f", budget), fmt.Sprintf("%.0f", budget))
	}
	return res
}

func (r *StorageRepository) ResetData(cleanSlate bool) domain.Database {
	r.mu.Lock()
	defer r.mu.Unlock()
	res := r.localStore.ResetData(cleanSlate)

	if r.isMySQL && r.sqlDB != nil {
		_, _ = r.sqlDB.Exec("DELETE FROM transactions")
		_, _ = r.sqlDB.Exec("DELETE FROM debts")
		_, _ = r.sqlDB.Exec("DELETE FROM accounts")
		_, _ = r.sqlDB.Exec("DELETE FROM cards")
		_, _ = r.sqlDB.Exec("DELETE FROM fixed_expenses")
		_, _ = r.sqlDB.Exec("DELETE FROM installment_plans")
		r.seedIfEmpty()
	}

	return res
}
