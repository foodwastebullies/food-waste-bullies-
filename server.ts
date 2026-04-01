import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fridge.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    slack_handle TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    role TEXT CHECK(role IN ('housemate', 'food_police')) DEFAULT 'housemate',
    admin INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fridges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    shelf TEXT,
    freezer INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS food_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    user_id TEXT NOT NULL,
    fridge_id TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    serving_number INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    claimed_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (fridge_id) REFERENCES fridges(id),
    FOREIGN KEY (claimed_by) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (id, name, email, slack_handle, role, admin) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("u1", "Admin User", "admin@example.com", "@admin", "food_police", 1);
  insertUser.run("u2", "Housemate 1", "user1@example.com", "@user1", "housemate", 0);
}

const fridgeCount = db.prepare("SELECT COUNT(*) as count FROM fridges").get() as { count: number };
if (fridgeCount.count === 0) {
  const insertFridge = db.prepare("INSERT INTO fridges (id, name, shelf, freezer) VALUES (?, ?, ?, ?)");
  insertFridge.run("f1", "Fridge 1", "Top", 0);
  insertFridge.run("f2", "Fridge 2", "Middle", 0);
  insertFridge.run("f3", "Fridge 3", "Bottom", 0);
  insertFridge.run("f4", "Freezer 1", "", 1);
  insertFridge.run("f5", "Freezer 2", "", 1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { id, name, email, slack_handle, check_in_date, check_out_date, role, admin } = req.body;
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, slack_handle, check_in_date, check_out_date, role, admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, email, slack_handle, check_in_date, check_out_date, role, admin ? 1 : 0);
    res.status(201).json({ status: "success" });
  });

  app.post("/api/login", (req, res) => {
    const { name, email } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE name = ? AND email = ?").get(name, email);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/fridges", (req, res) => {
    const fridges = db.prepare("SELECT * FROM fridges").all();
    res.json(fridges);
  });

  app.get("/api/food-items", (req, res) => {
    const items = db.prepare(`
      SELECT 
        fi.*, 
        f.name as fridge_name,
        u.name as owner_name,
        u.slack_handle as owner_slack
      FROM food_items fi
      JOIN fridges f ON fi.fridge_id = f.id
      JOIN users u ON fi.user_id = u.id
      ORDER BY fi.expiry_date ASC
    `).all();
    res.json(items);
  });

  app.post("/api/food-items", (req, res) => {
    const { id, name, image_url, user_id, fridge_id, expiry_date, serving_number } = req.body;
    const insert = db.prepare(`
      INSERT INTO food_items (id, name, image_url, user_id, fridge_id, expiry_date, serving_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, image_url, user_id, fridge_id, expiry_date, serving_number);
    
    // Mock Slack notification
    console.log(`[SLACK] Notification to #eat-me: New food item "${name}" logged by user ${user_id}`);
    
    res.status(201).json({ status: "success" });
  });

  app.patch("/api/food-items/:id/claim", (req, res) => {
    const { id } = req.params;
    const { servings, user_id } = req.body;
    
    const item = db.prepare("SELECT * FROM food_items WHERE id = ?").get() as any;
    if (!item) return res.status(404).json({ error: "Item not found" });

    const newServings = item.serving_number - servings;
    if (newServings <= 0) {
      db.prepare("DELETE FROM food_items WHERE id = ?").run(id);
      res.json({ status: "deleted" });
    } else {
      db.prepare("UPDATE food_items SET serving_number = ?, claimed_by = ? WHERE id = ?").run(newServings, user_id, id);
      res.json({ status: "updated", serving_number: newServings });
    }
  });

  app.delete("/api/food-items/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM food_items WHERE id = ?").run(id);
    res.json({ status: "success" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
