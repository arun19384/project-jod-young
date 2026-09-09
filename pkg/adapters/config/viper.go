package config

import (
	"ai-in-my-area-backend/pkg/core/domain"
	"ai-in-my-area-backend/pkg/core/ports"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/spf13/viper"
)

type ViperConfigAdapter struct {
	mu     sync.RWMutex
	v      *viper.Viper
	cfg    domain.AppConfig
	cfgDir string
}

func NewViperConfigAdapter() ports.ConfigPort {
	v := viper.New()

	// 1. Defaults
	v.SetDefault("PORT", "8080")
	v.SetDefault("ALLOW_ORIGINS", "*")
	v.SetDefault("ENV", "development")

	// 2. Read .env file if present
	v.SetConfigType("env")
	envPaths := []string{".", "..", "backend"}
	for _, p := range envPaths {
		envFile := filepath.Join(p, ".env")
		if _, err := os.Stat(envFile); err == nil {
			v.SetConfigFile(envFile)
			_ = v.MergeInConfig()
			break
		}
	}

	// 3. Read OS Environment variables (e.g. DATABASE_URL, PORT)
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// 4. Resolve config file path for fallback JSON config (data/config.json)
	dataDir := filepath.Join(".", "data")
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		if _, err := os.Stat(filepath.Join("backend", "data")); err == nil {
			dataDir = filepath.Join("backend", "data")
		} else {
			_ = os.MkdirAll(dataDir, 0755)
		}
	}
	configPath := filepath.Join(dataDir, "config.json")

	// If DATABASE_URL is not set in env, check config.json
	dbURL := v.GetString("DATABASE_URL")
	if dbURL == "" {
		if data, err := os.ReadFile(configPath); err == nil {
			var jsonCfg struct {
				DatabaseURL string `json:"database_url"`
			}
			if err := json.Unmarshal(data, &jsonCfg); err == nil && jsonCfg.DatabaseURL != "" {
				dbURL = jsonCfg.DatabaseURL
				v.Set("DATABASE_URL", dbURL)
			}
		}
	}

	adapter := &ViperConfigAdapter{
		v:      v,
		cfgDir: dataDir,
		cfg: domain.AppConfig{
			Port:         v.GetString("PORT"),
			DatabaseURL:  dbURL,
			ConfigPath:   configPath,
			AllowOrigins: v.GetString("ALLOW_ORIGINS"),
			Environment:  v.GetString("ENV"),
		},
	}

	return adapter
}

func (a *ViperConfigAdapter) GetConfig() domain.AppConfig {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.cfg
}

func (a *ViperConfigAdapter) SaveDatabaseURL(dbURL string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.cfg.DatabaseURL = dbURL
	a.v.Set("DATABASE_URL", dbURL)

	payload := map[string]string{
		"database_url": dbURL,
	}
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(a.cfg.ConfigPath, data, 0644)
}
