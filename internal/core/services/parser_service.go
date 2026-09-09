package services

import (
	"ai-in-my-area-backend/internal/core/domain"
	"ai-in-my-area-backend/internal/core/ports"
	"regexp"
	"strconv"
	"strings"
)

type categoryRule struct {
	Keywords []string
	Category string
	Tint     string
	Account  string
	IsIncome bool
}

var categoryRules = []categoryRule{
	{
		Keywords: []string{"ข้าว", "อาหาร", "ก๋วยเตี๋ยว", "หมูกระทะ", "ชาบู", "กิน", "ส้มตำ", "ข้าวมันไก่", "ขนม", "กะเพรา", "ซูชิ", "ซูชิโระ", "sushi", "sushiro", "ราเมง", "กาแฟ", "ชา", "ลาเต้", "อเมริกาโน่", "starbucks", "ชาเขียว", "ชานม", "kfc", "mcdonald", "พิซซ่า", "mk", "บุฟเฟ่ต์", "ของกิน"},
		Category: "อาหาร",
		Tint:     "#d97757",
		Account:  "บัญชีหลัก",
	},
	{
		Keywords: []string{"ของใช้", "เซเว่น", "7-11", "โลตัส", "lotus", "big c", "cj", "สบู่", "ยาสีฟัน", "แฟ้บ", "ทิชชู่", "น้ำยาล้างจาน", "ซุปเปอร์", "ซื้อของเข้าบ้าน", "supermarket", "วัตสัน", "watsons"},
		Category: "ของใช้",
		Tint:     "#c9a227",
		Account:  "บัญชีหลัก",
	},
	{
		Keywords: []string{"ชอปปิ้ง", "ช้อปปิ้ง", "ช็อปปิ้ง", "เสื้อผ้า", "shopee", "lazada", "tiktok", "เสื้อ", "กางเกง", "รองเท้า", "กระเป๋า", "หูฟัง", "uniqlo", "zara", "ซื้อของ", "shopping", "ของเล่น", "เกม", "เครื่องสำอาง"},
		Category: "ชอปปิ้ง",
		Tint:     "#9b8ec4",
		Account:  "บัญชีหลัก",
	},
	{
		Keywords: []string{"น้ำมัน", "เติมน้ำมัน", "ปตท", "ptt", "บางจาก", "เชลล์", "shell", "caltex", "เอสโซ่", "esso", "gasoline", "ดีเซล", "เบนซิน", "แก๊สโซฮอล์"},
		Category: "เติมน้ำมัน",
		Tint:     "#7fa3c9",
		Account:  "บัญชีหลัก",
	},
	{
		Keywords: []string{"เงินเดือน", "โบนัส", "ได้เงิน", "รับ", "คืนเงิน", "ขายของ", "ถูกหวย"},
		Category: "รายรับ",
		Tint:     "#6c9a76",
		Account:  "บัญชีหลัก",
		IsIncome: true,
	},
}

var numberRegex = regexp.MustCompile(`(\d[\d,]*(?:\.\d+)?)`)
var stripNumberRegex = regexp.MustCompile(`(\d[\d,]*(?:\.\d+)?)\s*(บาท)?`)

type ParserService struct{}

func NewParserService() ports.ParserUseCase {
	return &ParserService{}
}

func (p *ParserService) ParseTransactionText(text string, forceKind string) domain.ParseResponse {
	trimmed := strings.TrimSpace(text)
	lower := strings.ToLower(trimmed)

	var amount float64
	matches := numberRegex.FindStringSubmatch(trimmed)
	if len(matches) > 1 {
		cleaned := strings.ReplaceAll(matches[1], ",", "")
		if val, err := strconv.ParseFloat(cleaned, 64); err == nil {
			amount = val
		}
	}

	category := "อื่นๆ"
	tint := "#8a8780"
	account := "บัญชีหลัก"
	isIncome := forceKind == "in"

	for _, rule := range categoryRules {
		matched := false
		for _, kw := range rule.Keywords {
			if strings.Contains(lower, strings.ToLower(kw)) {
				matched = true
				break
			}
		}
		if matched {
			category = rule.Category
			tint = rule.Tint
			account = rule.Account
			if rule.IsIncome || forceKind == "in" {
				isIncome = true
			}
			break
		}
	}

	// Detect specific account or credit card in text
	if strings.Contains(lower, "บัตร a") || strings.Contains(lower, "บัตรa") {
		account = "บัตร A"
	} else if strings.Contains(lower, "บัตร b") || strings.Contains(lower, "บัตรb") {
		account = "บัตร B"
	} else if strings.Contains(lower, "บัตร c") || strings.Contains(lower, "บัตรc") {
		account = "บัตร C"
	} else if strings.Contains(lower, "รูด") || strings.Contains(lower, "บัตรเครดิต") {
		account = "บัตร A"
	} else if strings.Contains(lower, "saving") || strings.Contains(lower, "เงินเก็บ") {
		account = "Saving"
	} else if strings.Contains(lower, "second") || strings.Contains(lower, "สำรอง") {
		account = "Secondnary"
	}

	if forceKind == "out" {
		isIncome = false
	}

	name := strings.TrimSpace(stripNumberRegex.ReplaceAllString(trimmed, ""))
	if name == "" {
		if category != "อื่นๆ" {
			name = category
		} else {
			name = "ไม่ระบุ"
		}
	}

	return domain.ParseResponse{
		Name:     name,
		Amount:   amount,
		Category: category,
		Tint:     tint,
		Account:  account,
		IsIncome: isIncome,
	}
}
