package handlers

import (
	"ai-in-my-area-backend/models"
	"ai-in-my-area-backend/services"
	"encoding/json"
	"net/http"
	"strings"
)

func EnableCORS(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return true
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func DBStatusHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}
	db := services.GetDB()
	writeJSON(w, http.StatusOK, db.GetStatus())
}

func DBConnectHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		DatabaseURL string `json:"database_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.DatabaseURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid database_url"})
		return
	}

	db := services.GetDB()
	success, msg := db.Reconnect(req.DatabaseURL)
	if !success {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"status":  "error",
			"message": msg,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "connected",
		"message": msg,
	})
}

func SummaryHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}
	db := services.GetDB()
	summary := db.GetSummary()
	writeJSON(w, http.StatusOK, summary)
}

func TransactionsHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()

	if r.Method == http.MethodGet {
		txs := db.GetTransactions()
		writeJSON(w, http.StatusOK, txs)
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Text     string  `json:"text"`
			Name     string  `json:"t"`
			Category string  `json:"c"`
			Tint     string  `json:"tint"`
			Amount   float64 `json:"a"`
			Account  string  `json:"acct"`
			IsIncome bool    `json:"income"`
			Kind     string  `json:"kind"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
			return
		}

		if req.Text != "" && req.Amount == 0 {
			parsed := services.ParseTransactionText(req.Text, req.Kind)
			req.Name = parsed.Name
			req.Amount = parsed.Amount
			req.Category = parsed.Category
			req.Tint = parsed.Tint
			req.Account = parsed.Account
			req.IsIncome = parsed.IsIncome
		}

		if req.Amount <= 0 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Amount must be greater than 0"})
			return
		}

		if req.Name == "" {
			req.Name = "ไม่ระบุ"
		}
		if req.Category == "" {
			req.Category = "อื่นๆ"
		}
		if req.Tint == "" {
			req.Tint = "#8a8780"
		}
		if req.Account == "" {
			req.Account = "Main"
		}

		newTx := db.AddTransaction(models.Transaction{
			Title:        req.Name,
			Category:     req.Category,
			CategoryTint: req.Tint,
			Amount:       req.Amount,
			Account:      req.Account,
			IsIncome:     req.IsIncome,
		})

		writeJSON(w, http.StatusCreated, newTx)
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func DeleteTransactionHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Transaction ID required"})
		return
	}
	id := pathParts[2]

	db := services.GetDB()
	if ok := db.DeleteTransaction(id); ok {
		writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
	} else {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Transaction not found"})
	}
}

func DebtsHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()

	if r.Method == http.MethodGet {
		debts := db.GetDebts()
		writeJSON(w, http.StatusOK, debts)
		return
	}

	if r.Method == http.MethodPost {
		var d models.Debt
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
			return
		}
		created := db.AddDebt(d)
		writeJSON(w, http.StatusCreated, created)
		return
	}

	if r.Method == http.MethodPut {
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) >= 3 {
			id := pathParts[2]
			updated, err := db.ToggleDebt(id)
			if err != nil {
				writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, updated)
			return
		}
	}

	if r.Method == http.MethodDelete {
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) >= 3 {
			id := pathParts[2]
			if db.DeleteDebt(id) {
				writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
				return
			}
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "Debt not found"})
			return
		}
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func AccountsHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()

	if r.Method == http.MethodGet {
		accts, cards, fixed, totalBank := db.GetAccounts()
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"accounts":  accts,
			"cards":     cards,
			"fixed":     fixed,
			"bankTotal": totalBank,
		})
		return
	}

	if r.Method == http.MethodPost {
		var acc models.BankAccount
		if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
			return
		}
		created := db.AddAccount(acc)
		writeJSON(w, http.StatusCreated, created)
		return
	}

	if r.Method == http.MethodPut {
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) >= 3 {
			id := pathParts[2]
			var acc models.BankAccount
			if err := json.NewDecoder(r.Body).Decode(&acc); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
				return
			}
			updated, err := db.UpdateAccount(id, acc)
			if err != nil {
				writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, updated)
			return
		}
	}

	if r.Method == http.MethodDelete {
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) >= 3 {
			id := pathParts[2]
			if db.DeleteAccount(id) {
				writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
				return
			}
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "Account not found"})
			return
		}
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func CardsHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	if r.Method == http.MethodPost && len(pathParts) >= 4 && pathParts[3] == "pay" {
		cardID := pathParts[2]
		var req models.PayCardRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		updatedCard, err := db.PayCard(cardID, req.FromAccountID, req.Amount)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, updatedCard)
		return
	}

	if r.Method == http.MethodPost {
		var card models.CreditCard
		if err := json.NewDecoder(r.Body).Decode(&card); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
			return
		}
		created := db.AddCard(card)
		writeJSON(w, http.StatusCreated, created)
		return
	}

	if r.Method == http.MethodDelete && len(pathParts) >= 3 {
		id := pathParts[2]
		if db.DeleteCard(id) {
			writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
			return
		}
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Card not found"})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func FixedHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	if r.Method == http.MethodPut && len(pathParts) >= 3 {
		id := pathParts[2]
		updated, err := db.ToggleFixed(id)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, updated)
		return
	}

	if r.Method == http.MethodPost {
		var f models.FixedExpense
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
			return
		}
		created := db.AddFixed(f)
		writeJSON(w, http.StatusCreated, created)
		return
	}

	if r.Method == http.MethodDelete && len(pathParts) >= 3 {
		id := pathParts[2]
		if db.DeleteFixed(id) {
			writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
			return
		}
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Fixed bill not found"})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func PlansHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	db := services.GetDB()
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	if r.Method == http.MethodPost && len(pathParts) >= 4 && pathParts[3] == "pay" {
		planID := pathParts[2]
		var req models.PayPlanRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		updatedPlan, err := db.PayPlan(planID, req.FromAccountID)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, updatedPlan)
		return
	}

	if r.Method == http.MethodGet {
		monthly, remaining, plans := db.GetPlans()
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"monthlyTotal":   monthly,
			"remainingTotal": remaining,
			"plans":          plans,
		})
		return
	}

	if r.Method == http.MethodPost {
		var p models.InstallmentPlan
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
			return
		}
		created := db.AddPlan(p)
		writeJSON(w, http.StatusCreated, created)
		return
	}

	if r.Method == http.MethodDelete && len(pathParts) >= 3 {
		id := pathParts[2]
		if db.DeletePlan(id) {
			writeJSON(w, http.StatusOK, map[string]string{"status": "deleted", "id": id})
			return
		}
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Plan not found"})
		return
	}

	writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
}

func BudgetHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodPut {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req models.UpdateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
		return
	}

	db := services.GetDB()
	updated := db.UpdateBudget(req.Budget)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"budget": updated,
	})
}

func ResetHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req models.ResetRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	db := services.GetDB()
	res := db.ResetData(req.CleanSlate)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":     "reset_success",
		"cleanSlate": req.CleanSlate,
		"database":   res,
	})
}

func ParseHandler(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req models.ParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid payload"})
		return
	}

	resp := services.ParseTransactionText(req.Text, req.Kind)
	writeJSON(w, http.StatusOK, resp)
}
