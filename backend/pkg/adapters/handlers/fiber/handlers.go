package fiber

import (
	"ai-in-my-area-backend/pkg/core/domain"
	"ai-in-my-area-backend/pkg/core/ports"

	"github.com/gofiber/fiber/v2"
)

type FiberHandler struct {
	appUseCase    ports.AppUseCase
	parserUseCase ports.ParserUseCase
}

func NewFiberHandler(appUseCase ports.AppUseCase, parserUseCase ports.ParserUseCase) *FiberHandler {
	return &FiberHandler{
		appUseCase:    appUseCase,
		parserUseCase: parserUseCase,
	}
}

func (h *FiberHandler) HealthCheck(c *fiber.Ctx) error {
	status := h.appUseCase.GetDBStatus()
	return c.JSON(fiber.Map{
		"status": "ok",
		"app":    "จดยัง",
		"db":     status,
	})
}

func (h *FiberHandler) GetDBStatus(c *fiber.Ctx) error {
	status := h.appUseCase.GetDBStatus()
	return c.JSON(status)
}

func (h *FiberHandler) DBConnect(c *fiber.Ctx) error {
	var req domain.DBConnectRequest
	if err := c.BodyParser(&req); err != nil || req.DatabaseURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid database_url",
		})
	}

	success, msg := h.appUseCase.ReconnectDB(req.DatabaseURL)
	if !success {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": msg,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "connected",
		"message": msg,
	})
}

func (h *FiberHandler) GetSummary(c *fiber.Ctx) error {
	summary := h.appUseCase.GetSummary()
	return c.JSON(summary)
}

func (h *FiberHandler) GetTransactions(c *fiber.Ctx) error {
	txs := h.appUseCase.GetTransactions()
	return c.JSON(txs)
}

func (h *FiberHandler) AddTransaction(c *fiber.Ctx) error {
	var req domain.AddTransactionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	tx, err := h.appUseCase.AddTransaction(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(tx)
}

func (h *FiberHandler) UpdateTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Transaction ID required",
		})
	}

	var req domain.UpdateTransactionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	tx, err := h.appUseCase.UpdateTransaction(id, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(tx)
}

func (h *FiberHandler) DeleteTransaction(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Transaction ID required",
		})
	}

	if h.appUseCase.DeleteTransaction(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Transaction not found",
	})
}

func (h *FiberHandler) GetDebts(c *fiber.Ctx) error {
	debts := h.appUseCase.GetDebts()
	return c.JSON(debts)
}

func (h *FiberHandler) AddDebt(c *fiber.Ctx) error {
	var d domain.Debt
	if err := c.BodyParser(&d); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	created := h.appUseCase.AddDebt(d)
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *FiberHandler) ToggleDebt(c *fiber.Ctx) error {
	id := c.Params("id")
	updated, err := h.appUseCase.ToggleDebt(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(updated)
}

func (h *FiberHandler) DeleteDebt(c *fiber.Ctx) error {
	id := c.Params("id")
	if h.appUseCase.DeleteDebt(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Debt not found",
	})
}

func (h *FiberHandler) GetAccounts(c *fiber.Ctx) error {
	accts, cards, fixed, totalBank := h.appUseCase.GetAccounts()
	return c.JSON(fiber.Map{
		"accounts":  accts,
		"cards":     cards,
		"fixed":     fixed,
		"bankTotal": totalBank,
	})
}

func (h *FiberHandler) AddAccount(c *fiber.Ctx) error {
	var acc domain.BankAccount
	if err := c.BodyParser(&acc); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	created := h.appUseCase.AddAccount(acc)
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *FiberHandler) UpdateAccount(c *fiber.Ctx) error {
	id := c.Params("id")
	var acc domain.BankAccount
	if err := c.BodyParser(&acc); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	updated, err := h.appUseCase.UpdateAccount(id, acc)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(updated)
}

func (h *FiberHandler) DeleteAccount(c *fiber.Ctx) error {
	id := c.Params("id")
	if h.appUseCase.DeleteAccount(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Account not found",
	})
}

func (h *FiberHandler) TransferAccount(c *fiber.Ctx) error {
	var req domain.TransferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}

	if err := h.appUseCase.TransferAccount(req.FromID, req.ToID, req.Amount, req.Note); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"status": "transferred",
	})
}

func (h *FiberHandler) AddCard(c *fiber.Ctx) error {
	var card domain.CreditCard
	if err := c.BodyParser(&card); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	created := h.appUseCase.AddCard(card)
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *FiberHandler) PayCard(c *fiber.Ctx) error {
	cardID := c.Params("id")
	var req domain.PayCardRequest
	_ = c.BodyParser(&req)

	updated, err := h.appUseCase.PayCard(cardID, req.FromAccountID, req.Amount)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(updated)
}

func (h *FiberHandler) DeleteCard(c *fiber.Ctx) error {
	id := c.Params("id")
	if h.appUseCase.DeleteCard(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Card not found",
	})
}

func (h *FiberHandler) AddFixed(c *fiber.Ctx) error {
	var fixed domain.FixedExpense
	if err := c.BodyParser(&fixed); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	created := h.appUseCase.AddFixed(fixed)
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *FiberHandler) ToggleFixed(c *fiber.Ctx) error {
	id := c.Params("id")
	updated, err := h.appUseCase.ToggleFixed(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(updated)
}

func (h *FiberHandler) DeleteFixed(c *fiber.Ctx) error {
	id := c.Params("id")
	if h.appUseCase.DeleteFixed(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Fixed bill not found",
	})
}

func (h *FiberHandler) GetPlans(c *fiber.Ctx) error {
	monthly, remaining, plans := h.appUseCase.GetPlans()
	return c.JSON(fiber.Map{
		"monthlyTotal":   monthly,
		"remainingTotal": remaining,
		"plans":          plans,
	})
}

func (h *FiberHandler) AddPlan(c *fiber.Ctx) error {
	var p domain.InstallmentPlan
	if err := c.BodyParser(&p); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	created := h.appUseCase.AddPlan(p)
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *FiberHandler) PayPlan(c *fiber.Ctx) error {
	planID := c.Params("id")
	var req domain.PayPlanRequest
	_ = c.BodyParser(&req)

	updated, err := h.appUseCase.PayPlan(planID, req.FromAccountID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(updated)
}

func (h *FiberHandler) DeletePlan(c *fiber.Ctx) error {
	id := c.Params("id")
	if h.appUseCase.DeletePlan(id) {
		return c.JSON(fiber.Map{
			"status": "deleted",
			"id":     id,
		})
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"error": "Plan not found",
	})
}

func (h *FiberHandler) UpdateBudget(c *fiber.Ctx) error {
	var req domain.UpdateBudgetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}
	updated := h.appUseCase.UpdateBudget(req.Budget)
	return c.JSON(fiber.Map{
		"budget": updated,
	})
}

func (h *FiberHandler) ResetData(c *fiber.Ctx) error {
	var req domain.ResetRequest
	_ = c.BodyParser(&req)

	res := h.appUseCase.ResetData(req.CleanSlate)
	return c.JSON(fiber.Map{
		"status":     "reset_success",
		"cleanSlate": req.CleanSlate,
		"database":   res,
	})
}

func (h *FiberHandler) ParseText(c *fiber.Ctx) error {
	var req domain.ParseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload",
		})
	}

	resp := h.parserUseCase.ParseTransactionText(req.Text, req.Kind)
	return c.JSON(resp)
}
