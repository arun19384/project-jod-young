package fiber_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	configAdapter "ai-in-my-area-backend/internal/adapters/config"
	fiberAdapter "ai-in-my-area-backend/internal/adapters/handlers/fiber"
	storageAdapter "ai-in-my-area-backend/internal/adapters/storage"
	"ai-in-my-area-backend/internal/core/domain"
	coreServices "ai-in-my-area-backend/internal/core/services"
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
}
