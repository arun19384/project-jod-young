package main

import (
	"ai-in-my-area-backend/handlers"
	"ai-in-my-area-backend/services"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Initialize DB Engine (connects to TiDB / MySQL or fallback to local store)
	_ = services.GetDB()

	mux := http.NewServeMux()

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
	mux.HandleFunc("/api/accounts/transfer", handlers.AccountsHandler)
	mux.HandleFunc("/api/cards", handlers.CardsHandler)
	mux.HandleFunc("/api/cards/", handlers.CardsHandler)
	mux.HandleFunc("/api/fixed", handlers.FixedHandler)
	mux.HandleFunc("/api/fixed/", handlers.FixedHandler)
	mux.HandleFunc("/api/plans", handlers.PlansHandler)
	mux.HandleFunc("/api/plans/", handlers.PlansHandler)
	mux.HandleFunc("/api/budget", handlers.BudgetHandler)
	mux.HandleFunc("/api/reset", handlers.ResetHandler)
	mux.HandleFunc("/api/parse", handlers.ParseHandler)

	port := ":8080"
	fmt.Printf("=========================================\n")
	fmt.Printf(" 'จดเงิน' Backend Running (MySQL + Local)\n")
	fmt.Printf(" Listening on http://localhost%s\n", port)
	fmt.Printf("=========================================\n")

	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
