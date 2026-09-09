package handler

import (
	"ai-in-my-area-backend/internal/bootstrap"
	"net/http"
	"strings"
	"sync"

	"github.com/gofiber/adaptor/v2"
)

var (
	handlerFunc http.HandlerFunc
	initOnce    sync.Once
)

func initApp() {
	container := bootstrap.InitializeApp()
	handlerFunc = adaptor.FiberApp(container.FiberApp)
}

func Handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(initApp)

	// Ensure route has /api prefix for matching if stripped by Vercel rewrite
	if !strings.HasPrefix(r.URL.Path, "/api") {
		r.URL.Path = "/api" + r.URL.Path
	}

	handlerFunc(w, r)
}
