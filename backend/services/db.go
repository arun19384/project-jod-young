package services

import (
	"ai-in-my-area-backend/models"
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-sql-driver/mysql"
)

type DBService struct {
	mu           sync.RWMutex
	sqlDB        *sql.DB
	isMySQL      bool
	lastError    string
	dbURL        string
	configPath   string
	localStore   *StorageService
}

var globalDB *DBService
var dbOnce sync.Once

func GetDB() *DBService {
	dbOnce.Do(func() {
		// Register TLS config for TiDB Cloud
		_ = mysql.RegisterTLSConfig("tidbtls", &tls.Config{
			ServerName:         "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
			InsecureSkipVerify: true,
		})

		configPath := filepath.Join(".", "data", "config.json")
		if _, err := os.Stat(configPath); os.IsNotExist(err) {
			if _, err := os.Stat(filepath.Join("backend", "data", "config.json")); err == nil {
				configPath = filepath.Join("backend", "data", "config.json")
			}
		}
		localStore := GetStorage()

		globalDB = &DBService{
			configPath: configPath,
			localStore: localStore,
		}

		// Load configured database URL
		globalDB.loadConfig()

		// Try connecting to MySQL if URL is set
		if globalDB.dbURL != "" {
			if err := globalDB.connectMySQL(globalDB.dbURL); err != nil {
				fmt.Printf("[DB] MySQL connection failed: %v. Falling back to local storage.\n", err)
				globalDB.lastError = err.Error()
			} else {
				fmt.Println("[DB] Successfully connected to MySQL / TiDB Cloud!")
				globalDB.isMySQL = true
				globalDB.lastError = ""
				if err := globalDB.initSchema(); err != nil {
					fmt.Printf("[DB] Error initializing schema: %v\n", err)
				}
			}
		}
	})
	return globalDB
}

func loadEnvFile() {
	candidates := []string{".env", "../.env", filepath.Join("backend", ".env")}
	for _, p := range candidates {
		data, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				v = strings.Trim(v, "\"'")
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
		}
		break
	}
}

func (d *DBService) loadConfig() {
	loadEnvFile()

	defaultURL := "mysql://2S6Vrj3kFBYbSKh.root:<PASSWORD>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sys"

	if envURL := os.Getenv("DATABASE_URL"); envURL != "" {
		d.dbURL = envURL
		return
	}

	if data, err := os.ReadFile(d.configPath); err == nil {
		var cfg struct {
			DatabaseURL string `json:"database_url"`
		}
		if err := json.Unmarshal(data, &cfg); err == nil && cfg.DatabaseURL != "" {
			d.dbURL = cfg.DatabaseURL
			return
		}
	}

	d.dbURL = defaultURL
	_ = d.saveConfig()
}

func (d *DBService) saveConfig() error {
	_ = os.MkdirAll(filepath.Dir(d.configPath), 0755)
	cfg := map[string]string{
		"database_url": d.dbURL,
	}
	data, _ := json.MarshalIndent(cfg, "", "  ")
	return os.WriteFile(d.configPath, data, 0644)
}

// Convert mysql://user:pass@host:port/db to Go MySQL DSN
func parseMySQLURL(rawURL string) (string, error) {
	if !strings.HasPrefix(rawURL, "mysql://") {
		return rawURL, nil
	}

	trimmed := strings.TrimPrefix(rawURL, "mysql://")
	// Find @ to split user:pass and host:port/db
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
	// URL decode password if needed
	if decodedPass, err := url.QueryUnescape(password); err == nil {
		password = decodedPass
	}

	// hostDb could be host:port/dbname
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

	// Build Go DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?tls=tidbtls&charset=utf8mb4&parseTime=true", username, password, hostPort, dbname)
	return dsn, nil
}

func (d *DBService) connectMySQL(rawURL string) error {
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
		db.Close()
		return err
	}

	if d.sqlDB != nil {
		d.sqlDB.Close()
	}
	d.sqlDB = db
	return nil
}

func (d *DBService) Reconnect(rawURL string) (bool, string) {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.dbURL = rawURL
	_ = d.saveConfig()

	err := d.connectMySQL(rawURL)
	if err != nil {
		d.isMySQL = false
		d.lastError = err.Error()
		return false, err.Error()
	}

	d.isMySQL = true
	d.lastError = ""
	_ = d.initSchema()
	return true, "Connected successfully"
}

func (d *DBService) GetStatus() map[string]interface{} {
	d.mu.RLock()
	defer d.mu.RUnlock()

	return map[string]interface{}{
		"isMySQL":   d.isMySQL,
		"dbURL":     maskURL(d.dbURL),
		"lastError": d.lastError,
		"mode":      func() string { if d.isMySQL { return "TiDB / MySQL Cloud" } else { return "Local JSON File Store" } }(),
	}
}

func maskURL(raw string) string {
	re := regexp.MustCompile(`:[^:@]+@`)
	return re.ReplaceAllString(raw, ":****@")
}

func (d *DBService) initSchema() error {
	if !d.isMySQL || d.sqlDB == nil {
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
		if _, err := d.sqlDB.Exec(q); err != nil {
			log.Printf("[DB] Schema error: %v", err)
			return err
		}
	}

	// Seed from initial data if empty
	d.seedIfEmpty()
	return nil
}

func (d *DBService) seedIfEmpty() {
	var count int
	_ = d.sqlDB.QueryRow("SELECT COUNT(*) FROM accounts").Scan(&count)
	var cardCount int
	_ = d.sqlDB.QueryRow("SELECT COUNT(*) FROM cards").Scan(&cardCount)
	if count > 0 && cardCount > 0 {
		return
	}

	fmt.Println("[DB] Seeding database from initial data file...")
	var initialDB models.Database
	if data, err := os.ReadFile(d.localStore.initPath); err == nil {
		_ = json.Unmarshal(data, &initialDB)
	} else {
		initialDB = d.localStore.db
	}

	// Accounts
	for _, a := range initialDB.Accounts {
		_, _ = d.sqlDB.Exec("INSERT INTO accounts (id, name, role, amount, tint) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			a.ID, a.Name, a.Role, a.Amount, a.Tint)
	}

	// Cards
	for _, c := range initialDB.Cards {
		_, _ = d.sqlDB.Exec(`INSERT INTO cards 
			(id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount`,
			c.ID, c.Name, c.CutDay, c.DueDate, c.Amount, c.Limit, c.Pct, c.Status, c.Tint, c.ChipBg, c.PdfName, c.PdfLabel, c.PdfSummary)
	}

	// Fixed
	for _, f := range initialDB.Fixed {
		_, _ = d.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			f.ID, f.Name, f.Amount, f.Day, f.Done)
	}

	// Plans
	for _, p := range initialDB.Plans {
		_, _ = d.sqlDB.Exec("INSERT INTO installment_plans (id, name, amount, paid_count, total_count, note, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			p.ID, p.Name, p.Amount, p.PaidCount, p.TotalCount, p.Note, p.EndsAt)
	}

	// Debts
	for _, deb := range initialDB.Debts {
		_, _ = d.sqlDB.Exec("INSERT INTO debts (id, name, what, amount, cleared) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			deb.ID, deb.Name, deb.What, deb.Amount, deb.Cleared)
	}

	// Transactions
	for _, tx := range initialDB.Transactions {
		_, _ = d.sqlDB.Exec(`INSERT INTO transactions 
			(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount`,
			tx.ID, tx.Title, tx.Category, tx.CategoryTint, tx.Amount, tx.Account, tx.Date, tx.When, tx.IsIncome, tx.IsToday)
	}

	// Budget
	_, _ = d.sqlDB.Exec("INSERT INTO app_settings (k, v) VALUES ('monthlyBudget', '45000') ON DUPLICATE KEY UPDATE v='45000'")
}

// Router delegates to MySQL if connected, otherwise to Local File Store
func (d *DBService) GetSummary() models.SummaryResponse {
	d.mu.RLock()
	defer d.mu.RUnlock()

	if !d.isMySQL || d.sqlDB == nil {
		return d.localStore.GetSummary()
	}

	// Read from MySQL
	var budgetStr string
	budget := 45000.0
	if err := d.sqlDB.QueryRow("SELECT v FROM app_settings WHERE k = 'monthlyBudget'").Scan(&budgetStr); err == nil {
		var b float64
		if _, err := fmt.Sscanf(budgetStr, "%f", &b); err == nil && b > 0 {
			budget = b
		}
	}

	var income, spentTx float64
	rows, err := d.sqlDB.Query("SELECT amount, is_income FROM transactions")
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
	fRows, err := d.sqlDB.Query("SELECT amount, done FROM fixed_expenses")
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
	pRows, err := d.sqlDB.Query("SELECT amount, paid_count, total_count FROM installment_plans")
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

	debts := make([]models.Debt, 0)
	var debtTotal float64
	dRows, err := d.sqlDB.Query("SELECT id, name, what, amount, cleared FROM debts ORDER BY created_at DESC")
	if err == nil {
		defer dRows.Close()
		for dRows.Next() {
			var deb models.Debt
			if err := dRows.Scan(&deb.ID, &deb.Name, &deb.What, &deb.Amount, &deb.Cleared); err == nil {
				debts = append(debts, deb)
				if !deb.Cleared {
					debtTotal += deb.Amount
				}
			}
		}
	}

	dues := make([]models.DueItem, 0)
	fDueRows, err := d.sqlDB.Query("SELECT day, name, amount FROM fixed_expenses WHERE done = 0")
	if err == nil {
		defer fDueRows.Close()
		for fDueRows.Next() {
			var di models.DueItem
			if err := fDueRows.Scan(&di.Day, &di.Name, &di.Amount); err == nil {
				di.Note = "คงที่ · รายเดือน"
				di.Tint = "#d97757"
				dues = append(dues, di)
			}
		}
	}
	cDueRows, err := d.sqlDB.Query("SELECT cut_day, name, due_date, amount, tint FROM cards WHERE amount > 0")
	if err == nil {
		defer cDueRows.Close()
		for cDueRows.Next() {
			var cutDay, name, dueDate, tint string
			var amt float64
			if err := cDueRows.Scan(&cutDay, &name, &dueDate, &amt, &tint); err == nil {
				dues = append(dues, models.DueItem{
					Day:    cutDay,
					Name:   name,
					Note:   "รอบบิล · จ่าย " + dueDate,
					Amount: amt,
					Tint:   tint,
				})
			}
		}
	}

	recent := make([]models.Transaction, 0)
	tRows, err := d.sqlDB.Query("SELECT id, title, category, category_tint, amount, account, date, when_text, is_income, is_today FROM transactions ORDER BY created_at DESC LIMIT 10")
	if err == nil {
		defer tRows.Close()
		for tRows.Next() {
			var tx models.Transaction
			if err := tRows.Scan(&tx.ID, &tx.Title, &tx.Category, &tx.CategoryTint, &tx.Amount, &tx.Account, &tx.Date, &tx.When, &tx.IsIncome, &tx.IsToday); err == nil {
				recent = append(recent, tx)
			}
		}
	}

	return models.SummaryResponse{
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

func (d *DBService) GetTransactions() []models.Transaction {
	d.mu.RLock()
	defer d.mu.RUnlock()

	if !d.isMySQL || d.sqlDB == nil {
		return d.localStore.GetTransactions()
	}

	list := make([]models.Transaction, 0)
	rows, err := d.sqlDB.Query("SELECT id, title, category, category_tint, amount, account, date, when_text, is_income, is_today FROM transactions ORDER BY created_at DESC")
	if err != nil {
		return list
	}
	defer rows.Close()

	for rows.Next() {
		var tx models.Transaction
		if err := rows.Scan(&tx.ID, &tx.Title, &tx.Category, &tx.CategoryTint, &tx.Amount, &tx.Account, &tx.Date, &tx.When, &tx.IsIncome, &tx.IsToday); err == nil {
			list = append(list, tx)
		}
	}
	return list
}

func (d *DBService) AddTransaction(tx models.Transaction) models.Transaction {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Always sync with local store
	created := d.localStore.AddTransaction(tx)

	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec(`INSERT INTO transactions 
			(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			created.ID, created.Title, created.Category, created.CategoryTint, created.Amount, created.Account, created.Date, created.When, created.IsIncome, created.IsToday)

		// Sync account balance in MySQL
		if created.IsIncome {
			_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
		} else {
			res, _ := d.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
			if n, _ := res.RowsAffected(); n == 0 {
				_, _ = d.sqlDB.Exec("UPDATE cards SET amount = amount + ? WHERE name = ? OR id = ?", created.Amount, created.Account, created.Account)
			}
		}
	}

	return created
}

func (d *DBService) DeleteTransaction(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()

	ok := d.localStore.DeleteTransaction(id)

	if d.isMySQL && d.sqlDB != nil {
		var amount float64
		var account string
		var isIncome bool
		err := d.sqlDB.QueryRow("SELECT amount, account, is_income FROM transactions WHERE id = ?", id).Scan(&amount, &account, &isIncome)
		if err == nil {
			if isIncome {
				_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE name = ? OR id = ?", amount, account, account)
			} else {
				res, _ := d.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", amount, account, account)
				if n, _ := res.RowsAffected(); n == 0 {
					_, _ = d.sqlDB.Exec("UPDATE cards SET amount = GREATEST(0, amount - ?) WHERE name = ? OR id = ?", amount, account, account)
				}
			}
			_, _ = d.sqlDB.Exec("DELETE FROM transactions WHERE id = ?", id)
		}
	}

	return ok
}

func (d *DBService) PayCard(cardID string, fromAccountID string, amount float64) (*models.CreditCard, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	updated, err := d.localStore.PayCard(cardID, fromAccountID, amount)
	if err != nil {
		return nil, err
	}

	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", amount, fromAccountID, fromAccountID)
		_, _ = d.sqlDB.Exec("UPDATE cards SET amount = GREATEST(0, amount - ?), status = 'ชำระแล้ว' WHERE id = ?", amount, cardID)
	}

	return updated, nil
}

func (d *DBService) PayPlan(planID string, fromAccountID string) (*models.InstallmentPlan, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	updated, err := d.localStore.PayPlan(planID, fromAccountID)
	if err != nil {
		return nil, err
	}

	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", updated.Amount, fromAccountID, fromAccountID)
		_, _ = d.sqlDB.Exec("UPDATE installment_plans SET paid_count = paid_count + 1 WHERE id = ?", planID)
	}

	return updated, nil
}


func (d *DBService) AddDebt(deb models.Debt) models.Debt {
	d.mu.Lock()
	defer d.mu.Unlock()
	created := d.localStore.AddDebt(deb)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("INSERT INTO debts (id, name, what, amount, cleared) VALUES (?, ?, ?, ?, ?)",
			created.ID, created.Name, created.What, created.Amount, created.Cleared)
	}
	return created
}

func (d *DBService) ToggleDebt(id string) (*models.Debt, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	updated, err := d.localStore.ToggleDebt(id)
	if err != nil {
		return nil, err
	}
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE debts SET cleared = ? WHERE id = ?", updated.Cleared, id)
	}
	return updated, nil
}

func (d *DBService) DeleteDebt(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	ok := d.localStore.DeleteDebt(id)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM debts WHERE id = ?", id)
	}
	return ok
}

func (d *DBService) GetDebts() []models.Debt {
	d.mu.RLock()
	defer d.mu.RUnlock()
	if !d.isMySQL || d.sqlDB == nil {
		return d.localStore.GetDebts()
	}
	debts := make([]models.Debt, 0)
	rows, err := d.sqlDB.Query("SELECT id, name, what, amount, cleared FROM debts ORDER BY created_at DESC")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var deb models.Debt
			if err := rows.Scan(&deb.ID, &deb.Name, &deb.What, &deb.Amount, &deb.Cleared); err == nil {
				debts = append(debts, deb)
			}
		}
	}
	return debts
}

func (d *DBService) GetAccounts() ([]models.BankAccount, []models.CreditCard, []models.FixedExpense, float64) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	if !d.isMySQL || d.sqlDB == nil {
		return d.localStore.GetAccounts()
	}

	accounts := make([]models.BankAccount, 0)
	aRows, err := d.sqlDB.Query("SELECT id, name, role, amount, tint FROM accounts")
	if err == nil {
		defer aRows.Close()
		for aRows.Next() {
			var a models.BankAccount
			if err := aRows.Scan(&a.ID, &a.Name, &a.Role, &a.Amount, &a.Tint); err == nil {
				accounts = append(accounts, a)
			}
		}
	}

	totalBank := 0.0
	for _, a := range accounts {
		totalBank += a.Amount
	}

	cards := make([]models.CreditCard, 0)
	cRows, err := d.sqlDB.Query("SELECT id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary FROM cards")
	if err == nil {
		defer cRows.Close()
		for cRows.Next() {
			var c models.CreditCard
			if err := cRows.Scan(&c.ID, &c.Name, &c.CutDay, &c.DueDate, &c.Amount, &c.Limit, &c.Pct, &c.Status, &c.Tint, &c.ChipBg, &c.PdfName, &c.PdfLabel, &c.PdfSummary); err == nil {
				c.ReconcileLines = make([]models.ReconcileLine, 0)
				cards = append(cards, c)
			}
		}
	}

	fixed := make([]models.FixedExpense, 0)
	fRows, err := d.sqlDB.Query("SELECT id, name, amount, day, done FROM fixed_expenses")
	if err == nil {
		defer fRows.Close()
		for fRows.Next() {
			var f models.FixedExpense
			if err := fRows.Scan(&f.ID, &f.Name, &f.Amount, &f.Day, &f.Done); err == nil {
				fixed = append(fixed, f)
			}
		}
	}

	return accounts, cards, fixed, totalBank
}

func (d *DBService) GetPlans() (float64, float64, []models.InstallmentPlan) {
	d.mu.RLock()
	defer d.mu.RUnlock()

	if !d.isMySQL || d.sqlDB == nil {
		return d.localStore.GetPlans()
	}

	monthlyTotal := 0.0
	remainingTotal := 0.0
	plans := make([]models.InstallmentPlan, 0)

	rows, err := d.sqlDB.Query("SELECT id, name, amount, paid_count, total_count, note, ends_at FROM installment_plans")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p models.InstallmentPlan
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

func (d *DBService) AddPlan(p models.InstallmentPlan) models.InstallmentPlan {
	d.mu.Lock()
	defer d.mu.Unlock()
	created := d.localStore.AddPlan(p)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("INSERT INTO installment_plans (id, name, amount, paid_count, total_count, note, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			created.ID, created.Name, created.Amount, created.PaidCount, created.TotalCount, created.Note, created.EndsAt)
	}
	return created
}

func (d *DBService) DeletePlan(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	ok := d.localStore.DeletePlan(id)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM installment_plans WHERE id = ?", id)
	}
	return ok
}

func (d *DBService) UpdateBudget(budget float64) float64 {
	d.mu.Lock()
	defer d.mu.Unlock()
	res := d.localStore.UpdateBudget(budget)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("INSERT INTO app_settings (k, v) VALUES ('monthlyBudget', ?) ON DUPLICATE KEY UPDATE v = ?",
			fmt.Sprintf("%.0f", budget), fmt.Sprintf("%.0f", budget))
	}
	return res
}

func (d *DBService) ResetData(cleanSlate bool) models.Database {
	d.mu.Lock()
	defer d.mu.Unlock()
	res := d.localStore.ResetData(cleanSlate)

	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM transactions")
		_, _ = d.sqlDB.Exec("DELETE FROM debts")
		_, _ = d.sqlDB.Exec("DELETE FROM accounts")
		_, _ = d.sqlDB.Exec("DELETE FROM cards")
		_, _ = d.sqlDB.Exec("DELETE FROM fixed_expenses")
		_, _ = d.sqlDB.Exec("DELETE FROM installment_plans")
		d.seedIfEmpty()
	}

	return res
}

func (d *DBService) AddAccount(acc models.BankAccount) models.BankAccount {
	d.mu.Lock()
	defer d.mu.Unlock()
	created := d.localStore.AddAccount(acc)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("INSERT INTO accounts (id, name, role, amount, tint) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, role = ?, amount = ?, tint = ?",
			created.ID, created.Name, created.Role, created.Amount, created.Tint,
			created.Name, created.Role, created.Amount, created.Tint)
	}
	return created
}

func (d *DBService) DeleteAccount(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	ok := d.localStore.DeleteAccount(id)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM accounts WHERE id = ?", id)
	}
	return ok
}

func (d *DBService) UpdateAccount(id string, acc models.BankAccount) (*models.BankAccount, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	updated, err := d.localStore.UpdateAccount(id, acc)
	if err != nil {
		return nil, err
	}
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = ?, name = COALESCE(NULLIF(?, ''), name), role = COALESCE(NULLIF(?, ''), role) WHERE id = ?",
			updated.Amount, updated.Name, updated.Role, id)
	}
	return updated, nil
}

func (d *DBService) TransferAccount(fromID, toID string, amount float64, note string) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	err := d.localStore.TransferAccount(fromID, toID, amount, note)
	if err != nil {
		return err
	}

	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ? OR name = ?", amount, fromID, fromID)
		_, _ = d.sqlDB.Exec("UPDATE accounts SET amount = amount + ? WHERE id = ? OR name = ?", amount, toID, toID)

		if len(d.localStore.db.Transactions) > 0 {
			tx := d.localStore.db.Transactions[0]
			_, _ = d.sqlDB.Exec(`INSERT INTO transactions 
				(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				tx.ID, tx.Title, tx.Category, tx.CategoryTint, tx.Amount, tx.Account, tx.Date, tx.When, tx.IsIncome, tx.IsToday)
		}
	}

	return nil
}

func (d *DBService) AddCard(card models.CreditCard) models.CreditCard {
	d.mu.Lock()
	defer d.mu.Unlock()
	created := d.localStore.AddCard(card)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec(`INSERT INTO cards 
			(id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			created.ID, created.Name, created.CutDay, created.DueDate, created.Amount, created.Limit, created.Pct, created.Status, created.Tint, created.ChipBg, created.PdfName, created.PdfLabel, created.PdfSummary)
	}
	return created
}

func (d *DBService) DeleteCard(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	ok := d.localStore.DeleteCard(id)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM cards WHERE id = ?", id)
	}
	return ok
}

func (d *DBService) ToggleFixed(id string) (*models.FixedExpense, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	updated, err := d.localStore.ToggleFixed(id)
	if err != nil {
		return nil, err
	}
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("UPDATE fixed_expenses SET done = ? WHERE id = ?", updated.Done, id)
	}
	return updated, nil
}

func (d *DBService) AddFixed(f models.FixedExpense) models.FixedExpense {
	d.mu.Lock()
	defer d.mu.Unlock()
	created := d.localStore.AddFixed(f)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done) VALUES (?, ?, ?, ?, ?)",
			created.ID, created.Name, created.Amount, created.Day, created.Done)
	}
	return created
}

func (d *DBService) DeleteFixed(id string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	ok := d.localStore.DeleteFixed(id)
	if d.isMySQL && d.sqlDB != nil {
		_, _ = d.sqlDB.Exec("DELETE FROM fixed_expenses WHERE id = ?", id)
	}
	return ok
}

