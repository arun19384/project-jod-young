package fiber_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	fiberAdapter "ai-in-my-area-backend/pkg/adapters/handlers/fiber"
	storageAdapter "ai-in-my-area-backend/pkg/adapters/storage"
	"ai-in-my-area-backend/pkg/core/domain"
	coreServices "ai-in-my-area-backend/pkg/core/services"
)

func TestHexagonalFiberAPI(t *testing.T) {
	// Keep integration tests isolated from local .env and the production database.
	originalWD, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	tempDir := t.TempDir()
	if err := os.Chdir(tempDir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(originalWD) })

	repo := storageAdapter.NewStorageRepository(domain.AppConfig{})
	parserService := coreServices.NewParserService()
	appService := coreServices.NewAppService(repo, parserService, nil)
	if _, err := appService.AddAccount(domain.BankAccount{ID: "acct-test", Name: "บัญชีใช้จ่าย", Role: "ทดสอบ", Amount: 1000, Tint: "#fff"}); err != nil {
		t.Fatal(err)
	}
	if _, err := appService.AddAccount(domain.BankAccount{ID: "acct-reserve", Name: "บัญชี บัตรเครดิต", Role: "พักเงินจ่ายบัตร", Amount: 0, Tint: "#fff"}); err != nil {
		t.Fatal(err)
	}
	app := fiberAdapter.NewFiberRouter(appService, parserService, "*")

	// 1. Test Health Endpoint
	req := httptest.NewRequest("GET", "/api/health", nil)
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatalf("Health check failed: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("Expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var healthData map[string]interface{}
	if err := json.Unmarshal(body, &healthData); err != nil {
		t.Fatalf("Invalid JSON response: %v", err)
	}
	if healthData["status"] != "ok" {
		t.Errorf("Expected status: ok, got %v", healthData["status"])
	}

	// 2. Test Parser Endpoint
	parsePayload := domain.ParseRequest{
		Text: "ข้าวมันไก่ 60",
		Kind: "out",
	}
	payloadBytes, _ := json.Marshal(parsePayload)
	req = httptest.NewRequest("POST", "/api/parse", bytes.NewReader(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req, 5000)
	if err != nil {
		t.Fatalf("Parse test failed: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("Expected 200, got %d", resp.StatusCode)
	}

	body, _ = io.ReadAll(resp.Body)
	var parseResp domain.ParseResponse
	if err := json.Unmarshal(body, &parseResp); err != nil {
		t.Fatalf("Invalid parse JSON: %v", err)
	}
	if parseResp.Amount != 60 {
		t.Errorf("Expected amount 60, got %f", parseResp.Amount)
	}
	if parseResp.Category != "อาหาร" {
		t.Errorf("Expected category 'อาหาร', got '%s'", parseResp.Category)
	}

	// 3. Test Summary Endpoint
	req = httptest.NewRequest("GET", "/api/summary", nil)
	resp, err = app.Test(req, 5000)
	if err != nil {
		t.Fatalf("Summary request failed: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("Expected 200, got %d", resp.StatusCode)
	}

	// 4. Test Add and Update Transaction
	addPayload := domain.AddTransactionRequest{
		Text: "กาแฟ 120",
		Kind: "out",
	}
	addBytes, _ := json.Marshal(addPayload)
	req = httptest.NewRequest("POST", "/api/transactions", bytes.NewReader(addBytes))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req, 5000)
	if err != nil || resp.StatusCode != 201 {
		t.Fatalf("Add transaction failed: %v (status %d)", err, resp.StatusCode)
	}

	body, _ = io.ReadAll(resp.Body)
	var addedTx domain.Transaction
	_ = json.Unmarshal(body, &addedTx)
	if addedTx.ID == "" {
		t.Fatalf("Expected transaction ID to be generated")
	}

	// Update Transaction: Change amount to 150 and title to กาแฟดริป
	updatePayload := domain.UpdateTransactionRequest{
		Name:     "กาแฟดริป",
		Category: "อาหาร",
		Tint:     "#d97757",
		Amount:   150,
		Account:  "บัญชีใช้จ่าย",
		IsIncome: false,
	}
	upBytes, _ := json.Marshal(updatePayload)
	req = httptest.NewRequest("PUT", "/api/transactions/"+addedTx.ID, bytes.NewReader(upBytes))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req, 5000)
	if err != nil || resp.StatusCode != 200 {
		t.Fatalf("Update transaction failed: %v (status %d)", err, resp.StatusCode)
	}

	body, _ = io.ReadAll(resp.Body)
	var updatedTx domain.Transaction
	_ = json.Unmarshal(body, &updatedTx)
	if updatedTx.Amount != 150 || updatedTx.Title != "กาแฟดริป" {
		t.Errorf("Expected amount 150 and title 'กาแฟดริป', got %f, %s", updatedTx.Amount, updatedTx.Title)
	}

	// A reserve transfer changes wallet balances but must not count as spending.
	if err := appService.TransferAccount("acct-test", "acct-reserve", 200, "กันไว้จ่ายบัตร"); err != nil {
		t.Fatalf("Transfer failed: %v", err)
	}
	summary := appService.GetSummary()
	if summary.MonthlySpent != 150 {
		t.Errorf("Expected spending 150 excluding transfer, got %f", summary.MonthlySpent)
	}

	// Card spending is an expense once; reserving and paying the card are not extra expenses.
	card, err := appService.AddCard(domain.CreditCard{ID: "card-test", Name: "KTC Test", Limit: 10000, Tint: "#fff"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := appService.AddTransaction(domain.AddTransactionRequest{Name: "card lunch", Category: "อาหาร", Amount: 100, Account: card.Name}); err != nil {
		t.Fatalf("Card spending failed: %v", err)
	}
	_, cards, _, _ := appService.GetAccounts()
	if len(cards) != 1 || cards[0].Amount != 100 {
		t.Fatalf("Expected card outstanding 100, got %+v", cards)
	}
	if _, err := appService.PayCard(card.ID, "acct-reserve", 100); err != nil {
		t.Fatalf("Card payment failed: %v", err)
	}
	summary = appService.GetSummary()
	if summary.MonthlySpent != 250 {
		t.Errorf("Expected spending 250 without double-counting card payment, got %f", summary.MonthlySpent)
	}
	previousMonth := time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	oldTx, err := appService.AddTransaction(domain.AddTransactionRequest{Name: "old expense", Category: "อื่นๆ", Amount: 50, Account: "บัญชีใช้จ่าย", Date: previousMonth, When: "วันนี้ · 09:30 น."})
	if err != nil {
		t.Fatalf("Historical transaction failed: %v", err)
	}
	if oldTx.IsToday || oldTx.When == "วันนี้ · 09:30 น." {
		t.Errorf("Expected historical transaction to keep real date, got today=%v when=%q", oldTx.IsToday, oldTx.When)
	}
	if got := appService.GetSummary().MonthlySpent; got != 250 {
		t.Errorf("Expected current-month spending 250, got %f", got)
	}
	accounts, cards, _, _ := appService.GetAccounts()
	if cards[0].Amount != 0 || accounts[1].Amount != 100 {
		t.Errorf("Expected settled card and reserve balance 100, got card=%f reserve=%f", cards[0].Amount, accounts[1].Amount)
	}
}
