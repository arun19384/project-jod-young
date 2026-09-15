# Docker Member Demo

โปรเจกต์เล็ก ๆ สำหรับฝึก Docker: หน้าบ้านสมัคร/ล็อกอิน ส่งข้อมูลไปหลังบ้าน และหลังบ้านต่อ PostgreSQL

## โครงสร้าง

```text
docker-member-demo/
  backend/          Node.js + Express API
  frontend/         HTML + JavaScript หน้าเว็บง่าย ๆ
  docker-compose.yml
```

## วิธีรัน

ต้องเปิด Docker Desktop ก่อน แล้วใช้คำสั่งนี้จากโฟลเดอร์ `docker-member-demo`

```bash
docker compose up --build
```

เปิดหน้าเว็บ:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:4000/api/health
```

## คำสั่งที่ใช้บ่อย

ดู container ที่กำลังรัน:

```bash
docker ps
```

หยุดระบบ:

```bash
docker compose down
```

หยุดและลบ database volume เพื่อเริ่มข้อมูลใหม่:

```bash
docker compose down -v
```

## API ที่มี

- `POST /api/register` สมัครสมาชิก
- `POST /api/login` ล็อกอิน
- `GET /api/users` ดูรายชื่อสมาชิก
- `GET /api/health` เช็กว่า backend และ database ทำงานอยู่ไหม

