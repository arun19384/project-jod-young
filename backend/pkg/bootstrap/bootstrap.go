package bootstrap

import (
	configAdapter "ai-in-my-area-backend/pkg/adapters/config"
	fiberAdapter "ai-in-my-area-backend/pkg/adapters/handlers/fiber"
	storageAdapter "ai-in-my-area-backend/pkg/adapters/storage"
	"ai-in-my-area-backend/pkg/core/domain"
	coreServices "ai-in-my-area-backend/pkg/core/services"

	"github.com/gofiber/fiber/v2"
)

type AppContainer struct {
	FiberApp *fiber.App
	Config   domain.AppConfig
}

func InitializeApp() *AppContainer {
	// 1. Driven Adapter: Load configuration via Viper
	cfgPort := configAdapter.NewViperConfigAdapter()
	cfg := cfgPort.GetConfig()

	// 2. Driven Adapter: Persistence Repository (TiDB Cloud MySQL + Local JSON fallback)
	repo := storageAdapter.NewStorageRepository(cfg)

	// 3. Core Domain Services (Hexagon Center)
	parserService := coreServices.NewParserService()
	appService := coreServices.NewAppService(repo, parserService, cfgPort)

	// 4. Driving Adapter: Fiber Web Router & Handlers
	fiberApp := fiberAdapter.NewFiberRouter(appService, parserService, cfg.AllowOrigins)

	return &AppContainer{
		FiberApp: fiberApp,
		Config:   cfg,
	}
}
