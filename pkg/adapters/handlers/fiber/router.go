package fiber

import (
	"ai-in-my-area-backend/pkg/core/ports"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func NewFiberRouter(appUseCase ports.AppUseCase, parserUseCase ports.ParserUseCase, allowOrigins string) *fiber.App {
	if allowOrigins == "" {
		allowOrigins = "*"
	}

	app := fiber.New(fiber.Config{
		AppName:   "จดยัง (Jod Yang) - Hexagonal Fiber API",
		BodyLimit: 15 * 1024 * 1024, // 15MB for receipts and images
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${latency} ${method} ${path}\n",
		TimeFormat: "15:04:05",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	h := NewFiberHandler(appUseCase, parserUseCase)

	// API Routes Group
	api := app.Group("/api")

	// System & Health
	api.Get("/health", h.HealthCheck)
	api.Get("/db/status", h.GetDBStatus)
	api.Post("/db/connect", h.DBConnect)

	// Dashboard & Summary
	api.Get("/summary", h.GetSummary)

	// Transactions
	api.Get("/transactions", h.GetTransactions)
	api.Post("/transactions", h.AddTransaction)
	api.Delete("/transactions/:id", h.DeleteTransaction)

	// Debts
	api.Get("/debts", h.GetDebts)
	api.Post("/debts", h.AddDebt)
	api.Put("/debts/:id", h.ToggleDebt)
	api.Delete("/debts/:id", h.DeleteDebt)

	// Accounts & Transfers
	api.Get("/accounts", h.GetAccounts)
	api.Post("/accounts", h.AddAccount)
	api.Post("/accounts/transfer", h.TransferAccount)
	api.Put("/accounts/:id", h.UpdateAccount)
	api.Delete("/accounts/:id", h.DeleteAccount)

	// Credit Cards
	api.Post("/cards", h.AddCard)
	api.Post("/cards/:id/pay", h.PayCard)
	api.Delete("/cards/:id", h.DeleteCard)

	// Fixed Monthly Bills
	api.Post("/fixed", h.AddFixed)
	api.Put("/fixed/:id", h.ToggleFixed)
	api.Delete("/fixed/:id", h.DeleteFixed)

	// Installment Plans
	api.Get("/plans", h.GetPlans)
	api.Post("/plans", h.AddPlan)
	api.Post("/plans/:id/pay", h.PayPlan)
	api.Delete("/plans/:id", h.DeletePlan)

	// Budget & Reset
	api.Put("/budget", h.UpdateBudget)
	api.Post("/reset", h.ResetData)

	// Smart Thai NLP Parser
	api.Post("/parse", h.ParseText)

	return app
}
