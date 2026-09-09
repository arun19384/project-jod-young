# สคริปต์รันระบบ 'จดยัง' (Full-Stack React + Golang)
$ErrorActionPreference = "Stop"

# ตั้งค่า PATH ให้มองเห็น Go และ Node.js
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "==========================================================" -ForegroundColor DarkCyan
Write-Host "       เริ่มต้นรันแอปพลิเคชัน 'จดยัง' (FE + BE)           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor DarkCyan

# สตาร์ต Backend (Golang Hexagonal Fiber) บนพอร์ต 8080
Write-Host "`n[1/2] เริ่มต้นรัน Golang Hexagonal Server (:8080)..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "go" -ArgumentList "run", "main.go" -WorkingDirectory "$projectRoot" -PassThru

# รอ Backend เริ่มต้น
Start-Sleep -Seconds 2

# สตาร์ต Frontend (React + Vite) บนพอร์ต 5173
Write-Host "[2/2] เริ่มต้นรัน React Frontend Server (:5173)..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "$projectRoot\frontend" -PassThru

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  ระบบพร้อมใช้งานเรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "  - Frontend (React):   http://localhost:5173" -ForegroundColor Cyan
Write-Host "  - Backend (Golang):   http://localhost:8080" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "กด Ctrl+C เพื่อหยุดการทำงานทั้งสองระบบ`n" -ForegroundColor DarkGray

try {
    # รอจนกว่าจะมีการกดปิด
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nกำลังปิดระบบ..." -ForegroundColor Yellow
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "ปิดระบบเรียบร้อยแล้ว." -ForegroundColor Green
}
