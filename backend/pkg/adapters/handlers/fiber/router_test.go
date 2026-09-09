package fiber_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	configAdapter "ai-in-my-area-backend/pkg/adapters/config"
	fiberAdapter "ai-in-my-area-backend/pkg/adapters/handlers/fiber"
	storageAdapter "ai-in-my-area-backend/pkg/adapters/storage"
	"ai-in-my-area-backend/pkg/core/domain"
	coreServices "ai-in-my-area-backend/pkg/core/services"
)

func TestHexagonalFiberAPI(t *testing.T) {
	// Bootstrap components
	cfgPort := configAdapter.NewViperConfigAdapter()
	cfg := cfgPort.GetConfig()
	repo := storageAdapter.NewStorageRepository(cfg)
	parserService := coreServices.NewParserService()
	appService := coreServices.NewAppService(repo, parserService, cfgPort)
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
		Account:  "บัญชีหลัก",
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
}
