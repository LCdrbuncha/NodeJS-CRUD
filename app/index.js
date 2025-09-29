import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "testuser",
  password: process.env.DB_PASSWORD || "testpass",
  database: process.env.DB_NAME || "testdb",
};

const bootstrap = `
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
`;

app.get("/", (req, res) => {
  res.send(`
    ${bootstrap}
    <div class="container mt-5">
      <h1 class="text-center text-primary">🌟 Node.js + Express + MySQL 🌟</h1>
      <p class="text-center">CRUD Example (Create, Read, Update, Delete)</p>
      <div class="text-center">
        <a href="/users" class="btn btn-success m-2">📋 ดูรายชื่อผู้ใช้</a>
        <a href="/add-user" class="btn btn-warning m-2">➕ เพิ่มผู้ใช้ใหม่</a>
      </div>
    </div>
  `);
});

// READ
app.get("/users", async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute("SELECT * FROM users");
    await conn.end();

    let tableRows = rows.map(
      (u) => `
        <tr>
          <td>${u.id}</td>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>
            <a href="/edit-user/${u.id}" class="btn btn-sm btn-info">✏ แก้ไข</a>
            <a href="/delete-user/${u.id}" class="btn btn-sm btn-danger" onclick="return confirm('คุณแน่ใจว่าจะลบผู้ใช้นี้?')">🗑 ลบ</a>
          </td>
        </tr>
      `
    ).join("");

    res.send(`
      ${bootstrap}
      <div class="container mt-5">
        <h2 class="text-center text-info">📋 รายชื่อผู้ใช้ทั้งหมด</h2>
        <table class="table table-striped table-bordered mt-3">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>ชื่อ</th>
              <th>Email</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="text-center">
          <a href="/" class="btn btn-primary">⬅ กลับหน้าแรก</a>
        </div>
      </div>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// CREATE form
app.get("/add-user", (req, res) => {
  res.send(`
    ${bootstrap}
    <div class="container mt-5">
      <h2 class="text-center text-success">➕ เพิ่มผู้ใช้ใหม่</h2>
      <form method="POST" action="/add-user" class="mt-3">
        <div class="mb-3">
          <label class="form-label">ชื่อ:</label>
          <input type="text" name="name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email:</label>
          <input type="email" name="email" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-success">✅ บันทึก</button>
        <a href="/" class="btn btn-secondary">⬅ ยกเลิก</a>
      </form>
    </div>
  `);
});

// CREATE action
app.post("/add-user", async (req, res) => {
  const { name, email } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
    await conn.end();
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Insert error");
  }
});

// UPDATE form
app.get("/edit-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute("SELECT * FROM users WHERE id=?", [id]);
    await conn.end();
    if (rows.length === 0) return res.send("ไม่พบผู้ใช้");

    const user = rows[0];
    res.send(`
      ${bootstrap}
      <div class="container mt-5">
        <h2 class="text-center text-warning">✏ แก้ไขผู้ใช้</h2>
        <form method="POST" action="/edit-user/${id}" class="mt-3">
          <div class="mb-3">
            <label class="form-label">ชื่อ:</label>
            <input type="text" name="name" class="form-control" value="${user.name}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Email:</label>
            <input type="email" name="email" class="form-control" value="${user.email}" required>
          </div>
          <button type="submit" class="btn btn-warning">💾 บันทึกการแก้ไข</button>
          <a href="/users" class="btn btn-secondary">⬅ ยกเลิก</a>
        </form>
      </div>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Update form error");
  }
});

// UPDATE action
app.post("/edit-user/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute("UPDATE users SET name=?, email=? WHERE id=?", [name, email, id]);
    await conn.end();
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update error");
  }
});

// DELETE
app.get("/delete-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute("DELETE FROM users WHERE id=?", [id]);
    await conn.end();
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete error");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
