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
		ServerName: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
		MinVersion: tls.VersionTLS12,
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

func isCurrentMonth(dateText string) bool {
	now := time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600))
	for _, layout := range []string{"2006-01-02", "02 Jan", "2 Jan"} {
		if parsed, err := time.ParseInLocation(layout, dateText, now.Location()); err == nil {
			if layout != "2006-01-02" {
				parsed = time.Date(now.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, now.Location())
			}
			return parsed.Year() == now.Year() && parsed.Month() == now.Month()
		}
	}
	return true
}

func countsAsSpending(category string) bool {
	return category != "โอนเงิน" && category != "ชำระบัตรเครดิต"
}

func currentMonthKey() string {
	return time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600)).Format("2006-01")
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
			done BOOLEAN NOT NULL DEFAULT 0,
			done_month VARCHAR(7) NOT NULL DEFAULT ''
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

	_, _ = r.sqlDB.Exec("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_image MEDIUMTEXT")
	_, _ = r.sqlDB.Exec("ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS done_month VARCHAR(7) NOT NULL DEFAULT ''")
	_, _ = r.sqlDB.Exec("UPDATE fixed_expenses SET done_month = ? WHERE done = 1 AND done_month = ''", currentMonthKey())
	_, _ = r.sqlDB.Exec("UPDATE accounts SET name = 'บัญชีใช้จ่าย' WHERE name = 'เงินสด/บัญชีหลัก' OR name = 'บัญชีหลัก' OR id = 'acct-main'")
	_, _ = r.sqlDB.Exec("UPDATE transactions SET account = 'บัญชีใช้จ่าย' WHERE account = 'เงินสด/บัญชีหลัก' OR account = 'บัญชีหลัก'")

	r.seedIfEmpty()
	return nil
}

func (r *StorageRepository) seedIfEmpty() {
	var seedDisabled string
	if err := r.sqlDB.QueryRow("SELECT v FROM app_settings WHERE k = 'seed_disabled'").Scan(&seedDisabled); err == nil && seedDisabled == "1" {
		return
	}
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
		doneMonth := f.DoneMonth
		if f.Done && doneMonth == "" {
			doneMonth = currentMonthKey()
		}
		_, _ = r.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done, done_month) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=amount",
			f.ID, f.Name, f.Amount, f.Day, f.Done, doneMonth)
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
	rows, err := r.sqlDB.Query("SELECT amount, is_income, category, date FROM transactions")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var a float64
			var inc bool
			var category, dateText string
			if err := rows.Scan(&a, &inc, &category, &dateText); err == nil && isCurrentMonth(dateText) && countsAsSpending(category) {
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
	fRows, err := r.sqlDB.Query("SELECT amount, done_month = ? FROM fixed_expenses", currentMonthKey())
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

	totalSpent := spentTx
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
	fDueRows, err := r.sqlDB.Query("SELECT day, name, amount FROM fixed_expenses WHERE done_month <> ?", currentMonthKey())
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
		rows, err = r.sqlDB.Query("SELECT id, title, category, category_tint, amount, account, date, when_text, is_income, is_today FROM transactions ORDER BY created_at DESC")
		if err != nil {
			return list
		}
		defer rows.Close()
		for rows.Next() {
			var tx domain.Transaction
			if err := rows.Scan(&tx.ID, &tx.Title, &tx.Category, &tx.CategoryTint, &tx.Amount, &tx.Account, &tx.Date, &tx.When, &tx.IsIncome, &tx.IsToday); err == nil {
				list = append(list, tx)
			}
		}
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

func (r *StorageRepository) AddTransaction(tx domain.Transaction) (domain.Transaction, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddTransaction(tx)
	}

	now := time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600))
	if tx.ID == "" {
		tx.ID = fmt.Sprintf("tx-%d", now.UnixNano())
	}
	if tx.Date == "" {
		tx.Date = now.Format("2006-01-02")
	}
	if tx.When == "" {
		tx.When = "วันนี้ · " + now.Format("15:04 น.")
	}
	tx.IsToday = tx.Date == now.Format("2006-01-02")

	dbtx, err := r.sqlDB.Begin()
	if err != nil {
		return domain.Transaction{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer dbtx.Rollback()
	if err := applyTransactionEffect(dbtx, tx, false); err != nil {
		return domain.Transaction{}, err
	}
	if _, err := dbtx.Exec(`INSERT INTO transactions
		(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today, receipt_image)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, tx.ID, tx.Title, tx.Category, tx.CategoryTint, tx.Amount,
		tx.Account, tx.Date, tx.When, tx.IsIncome, tx.IsToday, tx.ReceiptImage); err != nil {
		return domain.Transaction{}, fmt.Errorf("save transaction: %w", err)
	}
	if err := dbtx.Commit(); err != nil {
		return domain.Transaction{}, fmt.Errorf("commit transaction: %w", err)
	}
	return tx, nil
}

func applyTransactionEffect(dbtx *sql.Tx, tx domain.Transaction, reverse bool) error {
	delta := tx.Amount
	if (!tx.IsIncome && !reverse) || (tx.IsIncome && reverse) {
		delta = -tx.Amount
	}

	if delta < 0 {
		res, err := dbtx.Exec("UPDATE accounts SET amount = amount + ? WHERE (name = ? OR id = ?) AND amount + ? >= 0", delta, tx.Account, tx.Account, delta)
		if err != nil {
			return fmt.Errorf("update account balance: %w", err)
		}
		if n, _ := res.RowsAffected(); n > 0 {
			return nil
		}
	} else {
		res, err := dbtx.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", delta, tx.Account, tx.Account)
		if err != nil {
			return fmt.Errorf("update account balance: %w", err)
		}
		if n, _ := res.RowsAffected(); n > 0 {
			return nil
		}
	}

	if tx.IsIncome {
		return fmt.Errorf("account not found")
	}
	cardDelta := tx.Amount
	if reverse {
		cardDelta = -tx.Amount
	}
	res, err := dbtx.Exec(`UPDATE cards SET amount = GREATEST(0, amount + ?),
		pct = CASE WHEN credit_limit > 0 THEN ROUND((GREATEST(0, amount + ?) / credit_limit) * 100) ELSE 0 END,
		status = CASE WHEN GREATEST(0, amount + ?) = 0 THEN 'ชำระแล้ว' ELSE 'ค้างชำระ' END
		WHERE name = ? OR id = ?`, cardDelta, cardDelta, cardDelta, tx.Account, tx.Account)
	if err != nil {
		return fmt.Errorf("update card balance: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("account or card not found, or account balance is insufficient")
	}
	return nil
}

func (r *StorageRepository) UpdateTransaction(id string, req domain.UpdateTransactionRequest) (domain.Transaction, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.UpdateTransaction(id, req)
	}

	if r.isMySQL && r.sqlDB != nil {
		dbtx, err := r.sqlDB.Begin()
		if err != nil {
			return domain.Transaction{}, fmt.Errorf("begin update: %w", err)
		}
		defer dbtx.Rollback()
		var oldTitle, oldCategory, oldTint, oldAccount, oldDate, oldWhen, oldReceipt string
		var oldAmount float64
		var oldIsIncome bool

		scanErr := dbtx.QueryRow(`SELECT title, category, category_tint, amount, account, date, when_text, is_income, COALESCE(receipt_image, '')
			FROM transactions WHERE id = ? FOR UPDATE`, id).Scan(
			&oldTitle, &oldCategory, &oldTint, &oldAmount, &oldAccount, &oldDate, &oldWhen, &oldIsIncome, &oldReceipt,
		)
		if scanErr != nil {
			return domain.Transaction{}, fmt.Errorf("transaction not found")
		}
		if !countsAsSpending(oldCategory) {
			return domain.Transaction{}, fmt.Errorf("system transactions cannot be edited")
		}

		// Determine new values
		newTx := domain.Transaction{
			ID:           id,
			Title:        req.Name,
			Category:     req.Category,
			CategoryTint: req.Tint,
			Amount:       req.Amount,
			Account:      req.Account,
			Date:         req.Date,
			When:         req.When,
			IsIncome:     req.IsIncome,
			IsToday:      req.Date == time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600)).Format("2006-01-02"),
			ReceiptImage: req.Receipt,
		}
		if newTx.Title == "" {
			newTx.Title = oldTitle
		}
		if newTx.Category == "" {
			newTx.Category = oldCategory
		}
		if newTx.CategoryTint == "" {
			newTx.CategoryTint = oldTint
		}
		if newTx.Amount <= 0 {
			newTx.Amount = oldAmount
		}
		if newTx.Account == "" {
			newTx.Account = oldAccount
		}
		if newTx.Date == "" {
			newTx.Date = oldDate
		}
		if newTx.When == "" {
			newTx.When = oldWhen
		}
		if newTx.ReceiptImage == "" {
			newTx.ReceiptImage = oldReceipt
		}
		newTx.IsToday = newTx.Date == time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600)).Format("2006-01-02")

		oldTx := domain.Transaction{Amount: oldAmount, Account: oldAccount, IsIncome: oldIsIncome}
		if err := applyTransactionEffect(dbtx, oldTx, true); err != nil {
			return domain.Transaction{}, fmt.Errorf("revert old transaction: %w", err)
		}
		if err := applyTransactionEffect(dbtx, newTx, false); err != nil {
			return domain.Transaction{}, err
		}

		_, updateErr := dbtx.Exec(`UPDATE transactions SET
			title = ?, category = ?, category_tint = ?, amount = ?, account = ?, date = ?, when_text = ?, is_income = ?, is_today = ?, receipt_image = ?
			WHERE id = ?`,
			newTx.Title, newTx.Category, newTx.CategoryTint, newTx.Amount, newTx.Account, newTx.Date, newTx.When, newTx.IsIncome, newTx.IsToday, newTx.ReceiptImage,
			id)
		if updateErr != nil {
			return domain.Transaction{}, fmt.Errorf("update transaction: %w", updateErr)
		}
		if err := dbtx.Commit(); err != nil {
			return domain.Transaction{}, fmt.Errorf("commit update: %w", err)
		}

		return newTx, nil
	}

	return domain.Transaction{}, fmt.Errorf("storage unavailable")
}

func (r *StorageRepository) DeleteTransaction(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.DeleteTransaction(id)
	}
	dbtx, err := r.sqlDB.Begin()
	if err != nil {
		return false
	}
	defer dbtx.Rollback()
	var amount float64
	var account, category string
	var isIncome bool
	if err := dbtx.QueryRow("SELECT amount, account, is_income, category FROM transactions WHERE id = ? FOR UPDATE", id).Scan(&amount, &account, &isIncome, &category); err != nil {
		return false
	}
	if !countsAsSpending(category) {
		return false
	}
	if isIncome {
		if _, err := dbtx.Exec("UPDATE accounts SET amount = amount - ? WHERE name = ? OR id = ?", amount, account, account); err != nil {
			return false
		}
	} else {
		res, err := dbtx.Exec("UPDATE accounts SET amount = amount + ? WHERE name = ? OR id = ?", amount, account, account)
		if err != nil {
			return false
		}
		if n, _ := res.RowsAffected(); n == 0 {
			if _, err := dbtx.Exec("UPDATE cards SET amount = GREATEST(0, amount - ?), pct = ROUND((GREATEST(0, amount - ?) / credit_limit) * 100) WHERE name = ? OR id = ?", amount, amount, account, account); err != nil {
				return false
			}
		}
	}
	if _, err := dbtx.Exec("DELETE FROM transactions WHERE id = ?", id); err != nil {
		return false
	}
	return dbtx.Commit() == nil
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

func (r *StorageRepository) AddDebt(deb domain.Debt) (domain.Debt, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddDebt(deb), nil
	}
	if deb.ID == "" {
		deb.ID = fmt.Sprintf("debt-%d", time.Now().UnixNano())
	}
	_, err := r.sqlDB.Exec("INSERT INTO debts (id, name, what, amount, cleared) VALUES (?, ?, ?, ?, ?)", deb.ID, deb.Name, deb.What, deb.Amount, deb.Cleared)
	if err != nil {
		return domain.Debt{}, fmt.Errorf("save debt: %w", err)
	}
	return deb, nil
}

func (r *StorageRepository) ToggleDebt(id string) (domain.Debt, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("UPDATE debts SET cleared = NOT cleared WHERE id = ?", id)
		if err != nil {
			return domain.Debt{}, err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return domain.Debt{}, fmt.Errorf("debt not found")
		}
		var updated domain.Debt
		err = r.sqlDB.QueryRow("SELECT id, name, what, amount, cleared FROM debts WHERE id = ?", id).Scan(&updated.ID, &updated.Name, &updated.What, &updated.Amount, &updated.Cleared)
		return updated, err
	}
	updated, err := r.localStore.ToggleDebt(id)
	if err != nil {
		return domain.Debt{}, err
	}
	return updated, nil
}

func (r *StorageRepository) DeleteDebt(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("DELETE FROM debts WHERE id = ?", id)
		if err != nil {
			return false
		}
		n, _ := res.RowsAffected()
		return n > 0
	}
	ok := r.localStore.DeleteDebt(id)
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
	fRows, err := r.sqlDB.Query("SELECT id, name, amount, day, done_month = ?, done_month FROM fixed_expenses", currentMonthKey())
	if err == nil {
		defer fRows.Close()
		for fRows.Next() {
			var f domain.FixedExpense
			if err := fRows.Scan(&f.ID, &f.Name, &f.Amount, &f.Day, &f.Done, &f.DoneMonth); err == nil {
				fixed = append(fixed, f)
			}
		}
	}

	return accounts, cards, fixed, totalBank
}

func (r *StorageRepository) AddAccount(acc domain.BankAccount) (domain.BankAccount, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddAccount(acc), nil
	}
	if acc.ID == "" {
		acc.ID = fmt.Sprintf("acct-%d", time.Now().UnixNano())
	}
	_, err := r.sqlDB.Exec("INSERT INTO accounts (id, name, role, amount, tint) VALUES (?, ?, ?, ?, ?)", acc.ID, acc.Name, acc.Role, acc.Amount, acc.Tint)
	if err != nil {
		return domain.BankAccount{}, fmt.Errorf("save account: %w", err)
	}
	return acc, nil
}

func (r *StorageRepository) UpdateAccount(id string, acc domain.BankAccount) (domain.BankAccount, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("UPDATE accounts SET amount = ?, name = COALESCE(NULLIF(?, ''), name), role = COALESCE(NULLIF(?, ''), role), tint = COALESCE(NULLIF(?, ''), tint) WHERE id = ?", acc.Amount, acc.Name, acc.Role, acc.Tint, id)
		if err != nil {
			return domain.BankAccount{}, fmt.Errorf("update account: %w", err)
		}
		changed, err := res.RowsAffected()
		if err != nil || changed == 0 {
			return domain.BankAccount{}, fmt.Errorf("account not found")
		}
		var updated domain.BankAccount
		if err := r.sqlDB.QueryRow("SELECT id, name, role, amount, tint FROM accounts WHERE id = ?", id).Scan(&updated.ID, &updated.Name, &updated.Role, &updated.Amount, &updated.Tint); err != nil {
			return domain.BankAccount{}, fmt.Errorf("read updated account: %w", err)
		}
		return updated, nil
	}
	updated, err := r.localStore.UpdateAccount(id, acc)
	if err != nil {
		return domain.BankAccount{}, err
	}
	return updated, nil
}

func (r *StorageRepository) DeleteAccount(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("DELETE FROM accounts WHERE id = ?", id)
		if err != nil {
			return false
		}
		changed, err := res.RowsAffected()
		return err == nil && changed > 0
	}
	ok := r.localStore.DeleteAccount(id)
	return ok
}

func (r *StorageRepository) TransferAccount(fromID, toID string, amount float64, note string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if amount <= 0 || fromID == "" || toID == "" || fromID == toID {
		return fmt.Errorf("invalid transfer request")
	}

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.TransferAccount(fromID, toID, amount, note)
	}

	dbtx, err := r.sqlDB.Begin()
	if err != nil {
		return fmt.Errorf("begin transfer: %w", err)
	}
	defer dbtx.Rollback()

	var from, to domain.BankAccount
	if err := dbtx.QueryRow("SELECT id, name, amount FROM accounts WHERE id = ? OR name = ? LIMIT 1 FOR UPDATE", fromID, fromID).Scan(&from.ID, &from.Name, &from.Amount); err != nil {
		return fmt.Errorf("sender account not found: %w", err)
	}
	if err := dbtx.QueryRow("SELECT id, name, amount FROM accounts WHERE id = ? OR name = ? LIMIT 1 FOR UPDATE", toID, toID).Scan(&to.ID, &to.Name, &to.Amount); err != nil {
		return fmt.Errorf("recipient account not found: %w", err)
	}
	if from.ID == to.ID {
		return fmt.Errorf("sender and recipient must be different")
	}
	if from.Amount < amount {
		return fmt.Errorf("insufficient balance in sender account")
	}

	if _, err := dbtx.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ?", amount, from.ID); err != nil {
		return fmt.Errorf("debit sender account: %w", err)
	}
	if _, err := dbtx.Exec("UPDATE accounts SET amount = amount + ? WHERE id = ?", amount, to.ID); err != nil {
		return fmt.Errorf("credit recipient account: %w", err)
	}

	bkkLoc := time.FixedZone("Asia/Bangkok", 7*3600)
	now := time.Now().In(bkkLoc)
	title := fmt.Sprintf("โอนไป %s", to.Name)
	if note != "" {
		title += " · " + note
	}
	txID := fmt.Sprintf("tx-%d", now.UnixNano())
	_, err = dbtx.Exec(`INSERT INTO transactions
		(id, title, category, category_tint, amount, account, date, when_text, is_income, is_today)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		txID, title, "โอนเงิน", "#7fa3c9", amount, from.Name,
		now.Format("2006-01-02"), "วันนี้ · "+now.Format("15:04 น."), false, true)
	if err != nil {
		return fmt.Errorf("record transfer: %w", err)
	}
	if err := dbtx.Commit(); err != nil {
		return fmt.Errorf("commit transfer: %w", err)
	}
	return nil
}

func (r *StorageRepository) AddCard(card domain.CreditCard) (domain.CreditCard, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddCard(card), nil
	}
	if card.ID == "" {
		card.ID = fmt.Sprintf("card-%d", time.Now().UnixNano())
	}
	_, err := r.sqlDB.Exec(`INSERT INTO cards
		(id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, card.ID, card.Name, card.CutDay, card.DueDate, card.Amount,
		card.Limit, card.Pct, card.Status, card.Tint, card.ChipBg, card.PdfName, card.PdfLabel, card.PdfSummary)
	if err != nil {
		return domain.CreditCard{}, fmt.Errorf("save card: %w", err)
	}
	return card, nil
}

func (r *StorageRepository) PayCard(cardID, fromAccountID string, amount float64) (domain.CreditCard, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.PayCard(cardID, fromAccountID, amount)
	}
	dbtx, err := r.sqlDB.Begin()
	if err != nil {
		return domain.CreditCard{}, err
	}
	defer dbtx.Rollback()
	var accountID, accountName string
	var balance float64
	if err := dbtx.QueryRow("SELECT id, name, amount FROM accounts WHERE id = ? OR name = ? LIMIT 1 FOR UPDATE", fromAccountID, fromAccountID).Scan(&accountID, &accountName, &balance); err != nil {
		return domain.CreditCard{}, fmt.Errorf("payment account not found")
	}
	var updated domain.CreditCard
	if err := dbtx.QueryRow("SELECT id, name, cut_day, due_date, amount, credit_limit, pct, status, tint, chip_bg, pdf_name, pdf_label, pdf_summary FROM cards WHERE id = ? FOR UPDATE", cardID).Scan(&updated.ID, &updated.Name, &updated.CutDay, &updated.DueDate, &updated.Amount, &updated.Limit, &updated.Pct, &updated.Status, &updated.Tint, &updated.ChipBg, &updated.PdfName, &updated.PdfLabel, &updated.PdfSummary); err != nil {
		return domain.CreditCard{}, fmt.Errorf("card not found")
	}
	if amount <= 0 || amount > updated.Amount {
		return domain.CreditCard{}, fmt.Errorf("payment exceeds outstanding balance")
	}
	if balance < amount {
		return domain.CreditCard{}, fmt.Errorf("insufficient balance in payment account")
	}
	remaining := updated.Amount - amount
	status := "ค้างชำระ"
	if remaining <= 0 {
		remaining = 0
		status = "ชำระแล้ว"
	}
	pct := 0
	if updated.Limit > 0 {
		pct = int((remaining / updated.Limit) * 100)
	}
	if _, err := dbtx.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ?", amount, accountID); err != nil {
		return domain.CreditCard{}, err
	}
	if _, err := dbtx.Exec("UPDATE cards SET amount = ?, pct = ?, status = ? WHERE id = ?", remaining, pct, status, cardID); err != nil {
		return domain.CreditCard{}, err
	}
	now := time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600))
	_, err = dbtx.Exec(`INSERT INTO transactions (id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, fmt.Sprintf("tx-%d", now.UnixNano()), "ชำระ "+updated.Name, "ชำระบัตรเครดิต", "#9b8ec4", amount, accountName, now.Format("2006-01-02"), "วันนี้ · "+now.Format("15:04 น."), false, true)
	if err != nil {
		return domain.CreditCard{}, err
	}
	if err := dbtx.Commit(); err != nil {
		return domain.CreditCard{}, err
	}
	updated.Amount, updated.Pct, updated.Status = remaining, pct, status
	return updated, nil
}

func (r *StorageRepository) DeleteCard(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("DELETE FROM cards WHERE id = ?", id)
		if err != nil {
			return false
		}
		n, _ := res.RowsAffected()
		return n > 0
	}
	ok := r.localStore.DeleteCard(id)
	return ok
}

func (r *StorageRepository) AddFixed(fixed domain.FixedExpense) (domain.FixedExpense, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddFixed(fixed), nil
	}
	if fixed.ID == "" {
		fixed.ID = fmt.Sprintf("fixed-%d", time.Now().UnixNano())
	}
	if fixed.Done {
		fixed.DoneMonth = currentMonthKey()
	}
	_, err := r.sqlDB.Exec("INSERT INTO fixed_expenses (id, name, amount, day, done, done_month) VALUES (?, ?, ?, ?, ?, ?)",
		fixed.ID, fixed.Name, fixed.Amount, fixed.Day, fixed.Done, fixed.DoneMonth)
	if err != nil {
		return domain.FixedExpense{}, fmt.Errorf("save fixed expense: %w", err)
	}
	return fixed, nil
}

func (r *StorageRepository) ToggleFixed(id string) (domain.FixedExpense, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		month := currentMonthKey()
		res, err := r.sqlDB.Exec("UPDATE fixed_expenses SET done = IF(done_month = ?, 0, 1), done_month = IF(done_month = ?, '', ?) WHERE id = ?", month, month, month, id)
		if err != nil {
			return domain.FixedExpense{}, err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return domain.FixedExpense{}, fmt.Errorf("fixed expense not found")
		}
		var updated domain.FixedExpense
		err = r.sqlDB.QueryRow("SELECT id, name, amount, day, done_month = ?, done_month FROM fixed_expenses WHERE id = ?", month, id).Scan(&updated.ID, &updated.Name, &updated.Amount, &updated.Day, &updated.Done, &updated.DoneMonth)
		return updated, err
	}
	updated, err := r.localStore.ToggleFixed(id)
	if err != nil {
		return domain.FixedExpense{}, err
	}
	return updated, nil
}

func (r *StorageRepository) DeleteFixed(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("DELETE FROM fixed_expenses WHERE id = ?", id)
		if err != nil {
			return false
		}
		n, _ := res.RowsAffected()
		return n > 0
	}
	ok := r.localStore.DeleteFixed(id)
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

func (r *StorageRepository) AddPlan(plan domain.InstallmentPlan) (domain.InstallmentPlan, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.AddPlan(plan), nil
	}
	if plan.ID == "" {
		plan.ID = fmt.Sprintf("plan-%d", time.Now().UnixNano())
	}
	_, err := r.sqlDB.Exec("INSERT INTO installment_plans (id, name, amount, paid_count, total_count, note, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)", plan.ID, plan.Name, plan.Amount, plan.PaidCount, plan.TotalCount, plan.Note, plan.EndsAt)
	if err != nil {
		return domain.InstallmentPlan{}, fmt.Errorf("save plan: %w", err)
	}
	return plan, nil
}

func (r *StorageRepository) PayPlan(planID, fromAccountID string) (domain.InstallmentPlan, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.isMySQL || r.sqlDB == nil {
		return r.localStore.PayPlan(planID, fromAccountID)
	}
	dbtx, err := r.sqlDB.Begin()
	if err != nil {
		return domain.InstallmentPlan{}, err
	}
	defer dbtx.Rollback()
	var updated domain.InstallmentPlan
	if err := dbtx.QueryRow("SELECT id, name, amount, paid_count, total_count, note, ends_at FROM installment_plans WHERE id = ? FOR UPDATE", planID).Scan(&updated.ID, &updated.Name, &updated.Amount, &updated.PaidCount, &updated.TotalCount, &updated.Note, &updated.EndsAt); err != nil {
		return domain.InstallmentPlan{}, fmt.Errorf("installment plan not found")
	}
	if updated.PaidCount >= updated.TotalCount {
		return domain.InstallmentPlan{}, fmt.Errorf("installment plan is already complete")
	}
	var accountID, accountName string
	var balance float64
	if err := dbtx.QueryRow("SELECT id, name, amount FROM accounts WHERE id = ? OR name = ? LIMIT 1 FOR UPDATE", fromAccountID, fromAccountID).Scan(&accountID, &accountName, &balance); err != nil {
		return domain.InstallmentPlan{}, fmt.Errorf("payment account not found")
	}
	if balance < updated.Amount {
		return domain.InstallmentPlan{}, fmt.Errorf("insufficient balance in payment account")
	}
	if _, err := dbtx.Exec("UPDATE accounts SET amount = amount - ? WHERE id = ?", updated.Amount, accountID); err != nil {
		return domain.InstallmentPlan{}, err
	}
	if _, err := dbtx.Exec("UPDATE installment_plans SET paid_count = paid_count + 1 WHERE id = ?", planID); err != nil {
		return domain.InstallmentPlan{}, err
	}
	now := time.Now().In(time.FixedZone("Asia/Bangkok", 7*3600))
	_, err = dbtx.Exec(`INSERT INTO transactions (id, title, category, category_tint, amount, account, date, when_text, is_income, is_today) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, fmt.Sprintf("tx-%d", now.UnixNano()), "จ่ายงวด "+updated.Name, "ผ่อนชำระ", "#e06c75", updated.Amount, accountName, now.Format("2006-01-02"), "วันนี้ · "+now.Format("15:04 น."), false, true)
	if err != nil {
		return domain.InstallmentPlan{}, err
	}
	if err := dbtx.Commit(); err != nil {
		return domain.InstallmentPlan{}, err
	}
	updated.PaidCount++
	return updated, nil
}

func (r *StorageRepository) DeletePlan(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isMySQL && r.sqlDB != nil {
		res, err := r.sqlDB.Exec("DELETE FROM installment_plans WHERE id = ?", id)
		if err != nil {
			return false
		}
		n, _ := res.RowsAffected()
		return n > 0
	}
	ok := r.localStore.DeletePlan(id)
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
		seedFlag := "0"
		if cleanSlate {
			seedFlag = "1"
		}
		_, _ = r.sqlDB.Exec("INSERT INTO app_settings (k, v) VALUES ('seed_disabled', ?) ON DUPLICATE KEY UPDATE v = ?", seedFlag, seedFlag)
		if !cleanSlate {
			r.seedIfEmpty()
		}
	}

	return res
}
