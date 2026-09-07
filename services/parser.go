package services

import (
	"ai-in-my-area-backend/models"
	"regexp"
	"strconv"
	"strings"
)

type CategoryRule struct {
	Keywords []string
	Category string
	Tint     string
	Account  string
	IsIncome bool
}

var categoryRules = []CategoryRule{
	{
		Keywords: []string{"กาแฟ", "ชา", "ลาเต้", "อเมริกาโน่", "starbucks", "ชาเขียว", "ชานม"},
		Category: "กาแฟ",
		Tint:     "#c9a227",
		Account:  "Main",
	},
	{
		Keywords: []string{"ข้าว", "อาหาร", "ก๋วยเตี๋ยว", "หมูกระทะ", "ชาบู", "กิน", "เซเว่น", "7-11", "ส้มตำ", "ข้าวมันไก่", "ขนม", "กะเพรา"},
		Category: "อาหาร",
		Tint:     "#d97757",
		Account:  "Main",
	},
	{
		Keywords: []string{"น้ำมัน", "เติมน้ำมัน", "ปตท", "ptt", "บางจาก", "เชลล์", "gasoline"},
		Category: "น้ำมันรถ",
		Tint:     "#7fa3c9",
		Account:  "Main",
	},
	{
		Keywords: []string{"แท็กซี่", "วิน", "bts", "mrt", "grab", "ทางด่วน", "ที่จอดรถ", "รถเมล์"},
		Category: "เดินทาง",
		Tint:     "#7fa3c9",
		Account:  "Main",
	},
	{
		Keywords: []string{"ค่าไฟ", "ค่าน้ำ", "เน็ต", "โทรศัพท์", "ประกันสังคม", "ให้แม่", "ค่าห้อง", "ค่าเช่า"},
		Category: "คงที่",
		Tint:     "#9b8ec4",
		Account:  "Main",
	},
	{
		Keywords: []string{"บัตร", "ผ่อน", "ประกัน"},
		Category: "บัตร/ผ่อน",
		Tint:     "#9b8ec4",
		Account:  "Credit",
	},
	{
		Keywords: []string{"เก็บ", "ออม", "saving"},
		Category: "เงินเก็บ",
		Tint:     "#6c9a76",
		Account:  "Saving",
	},
	{
		Keywords: []string{"ออกให้", "ยืม", "ออกก่อน", "จ่ายแทน"},
		Category: "ออกให้ก่อน",
		Tint:     "#c9a227",
		Account:  "Main",
	},
	{
		Keywords: []string{"เงินเดือน", "โบนัส", "ได้เงิน", "รับ", "คืนเงิน", "ขายของ", "ถูกหวย"},
		Category: "รายรับ",
		Tint:     "#6c9a76",
		Account:  "Main",
		IsIncome: true,
	},
}

var numberRegex = regexp.MustCompile(`(\d[\d,]*(?:\.\d+)?)`)
var stripNumberRegex = regexp.MustCompile(`(\d[\d,]*(?:\.\d+)?)\s*(บาท)?`)

func ParseTransactionText(text string, forceKind string) models.ParseResponse {
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
	account := "Main"
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

	return models.ParseResponse{
		Name:     name,
		Amount:   amount,
		Category: category,
		Tint:     tint,
		Account:  account,
		IsIncome: isIncome,
	}
}
