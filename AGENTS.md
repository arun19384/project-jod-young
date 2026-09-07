# Workspace Rules for project-jod-young

## 🚀 Critical Rule: Always Deploy on Changes (ทุกครั้งที่แก้ ต้อง Deploy เสมอ)

- **Mandatory Auto-Deploy**: ทุกครั้งที่มีการแก้ไขโค้ด ปรับปรุงหน้าเว็บ ฟังก์ชัน หรือแก้บั๊กในโปรเจกต์นี้ หลังจากทดสอบการทำงานแล้ว ให้ทำการ **Commit และ Push ขึ้น GitHub (`origin main`) ทันทีเสมอ** เพื่อให้ Vercel ทำการ Auto-Deploy ขึ้นระบบ Production แบบอัตโนมัติ โดยไม่ต้องรอให้ผู้ใช้สั่งซ้ำ
- **Pre-Deploy Verification**:
  - ตรวจสอบว่า Frontend Build ผ่าน: `cd frontend && npm.cmd run build`
  - ตรวจสอบว่า Go Backend และ Vercel Serverless Function Build ผ่าน: `go build ./api` และ `go build main.go`
- **Git Push Workflow**:
  - ใช้ `git add` เฉพาะไฟล์โค้ดและคอนฟิกที่จำเป็น
  - เขียน Commit Message ให้ชัดเจน เช่น `feat: ...`, `fix: ...`, `refactor: ...`
  - สั่ง `git push origin main` เสมอ
- **Security & Secrets**:
  - ตรวจสอบให้แน่ใจเสมอว่าไฟล์ `.env` และข้อมูล Credential ของฐานข้อมูล TiDB Cloud อยู่ใน `.gitignore` และไม่ถูก Push ขึ้น Git สาธารณะเด็ดขาด