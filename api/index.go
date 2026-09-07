package handler

import (
	"ai-in-my-area-backend/handlers"
	"ai-in-my-area-backend/services"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
)

var (
	mux  *http.ServeMux
	once sync.Once
)

func initRoutes() {
	_ = services.GetDB()

	mux = http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if handlers.EnableCORS(w, r) {
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"app":    "จดเงิน",
			"db":     services.GetDB().GetStatus(),
		})
	})

	// Database Connection Management
	mux.HandleFunc("/api/db/status", handlers.DBStatusHandler)
	mux.HandleFunc("/api/db/connect", handlers.DBConnectHandler)

	// API Routes
	mux.HandleFunc("/api/summary", handlers.SummaryHandler)
	mux.HandleFunc("/api/transactions", handlers.TransactionsHandler)
	mux.HandleFunc("/api/transactions/", handlers.DeleteTransactionHandler)
	mux.HandleFunc("/api/debts", handlers.DebtsHandler)
	mux.HandleFunc("/api/debts/", handlers.DebtsHandler)
	mux.HandleFunc("/api/accounts", handlers.AccountsHandler)
	mux.HandleFunc("/api/accounts/", handlers.AccountsHandler)
	mux.HandleFunc("/api/cards", handlers.CardsHandler)
	mux.HandleFunc("/api/cards/", handlers.CardsHandler)
	mux.HandleFunc("/api/fixed", handlers.FixedHandler)
	mux.HandleFunc("/api/fixed/", handlers.FixedHandler)
	mux.HandleFunc("/api/plans", handlers.PlansHandler)
	mux.HandleFunc("/api/plans/", handlers.PlansHandler)
	mux.HandleFunc("/api/budget", handlers.BudgetHandler)
	mux.HandleFunc("/api/reset", handlers.ResetHandler)
	mux.HandleFunc("/api/parse", handlers.ParseHandler)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initRoutes)

	// Enable CORS for all incoming API requests on Vercel
	if handlers.EnableCORS(w, r) {
		return
	}

	// Ensure route has /api prefix for matching if stripped by Vercel rewrite
	if !strings.HasPrefix(r.URL.Path, "/api") {
		r.URL.Path = "/api" + r.URL.Path
	}

	mux.ServeHTTP(w, r)
}
