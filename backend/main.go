package main

import (
	"ai-in-my-area-backend/internal/bootstrap"
	"fmt"
	"log"
)

func main() {
	container := bootstrap.InitializeApp()
	port := container.Config.Port
	if port == "" {
		port = "8080"
	}

	fmt.Printf("=========================================\n")
	fmt.Printf(" 'จดเงิน' Hexagonal Architecture (Fiber + Viper)\n")
	fmt.Printf(" Listening on http://localhost:%s\n", port)
	fmt.Printf("=========================================\n")

	if err := container.FiberApp.Listen(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
