package fiber_test

import (
	adapter "ai-in-my-area-backend/pkg/adapters/handlers/fiber"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAPIKeyCORSPreflight(t *testing.T) {
	app := adapter.NewFiberRouter(nil, nil, "https://example.test", "secret")
	req := httptest.NewRequest("OPTIONS", "/api/bootstrap", nil)
	req.Header.Set("Origin", "https://example.test")
	req.Header.Set("Access-Control-Request-Method", "GET")
	req.Header.Set("Access-Control-Request-Headers", "x-api-key")
	res, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 204 || !strings.Contains(strings.ToLower(res.Header.Get("Access-Control-Allow-Headers")), "x-api-key") {
		t.Fatal("API key preflight rejected")
	}
}
