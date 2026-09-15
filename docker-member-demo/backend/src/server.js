import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();
const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

app.use(cors());
app.use(express.json());

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get("/api/health", async (_req, res) => {
  const result = await pool.query("SELECT NOW() AS now");
  res.json({
    status: "ok",
    databaseTime: result.rows[0].now,
  });
});

app.get("/api/users", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, name, email, created_at FROM members ORDER BY id DESC"
  );
  res.json(result.rows);
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "กรอก name, email, password ให้ครบ" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO members (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    console.error(error);
    return res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "กรอก email และ password" });
  }

  const result = await pool.query(
    "SELECT id, name, email FROM members WHERE email = $1 AND password = $2",
    [email, password]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }

  return res.json({
    message: "ล็อกอินสำเร็จ",
    user: result.rows[0],
  });
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });

