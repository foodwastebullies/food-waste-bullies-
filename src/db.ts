import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { hashPassword } from "./services/auth";

const db = new Database("fridge.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    slack_handle TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    role TEXT CHECK(role IN ('housemate', 'food_police')) DEFAULT 'housemate',
    admin INTEGER DEFAULT 0,
    on_patrol INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fridges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shelves (
    id TEXT PRIMARY KEY,
    fridge_id TEXT NOT NULL,
    name TEXT NOT NULL,
    freezer INTEGER DEFAULT 0,
    FOREIGN KEY (fridge_id) REFERENCES fridges(id)
  );

  CREATE TABLE IF NOT EXISTS food_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    user_id TEXT NOT NULL,
    shelf_id TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    serving_number INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    claimed_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shelf_id) REFERENCES shelves(id),
    FOREIGN KEY (claimed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS food_item_checks (
    id TEXT PRIMARY KEY,
    food_item_id TEXT NOT NULL,
    check_at TEXT NOT NULL,
    fired INTEGER DEFAULT 0
  );
`);

// Migrations for existing databases
try { db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT"); } catch { /* already exists */ }
try { db.exec("ALTER TABLE food_items ADD COLUMN shelf_id TEXT"); } catch { /* already exists */ }

// Seed users
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, password_hash, slack_handle, role, admin, on_patrol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  insertUser.run(randomUUID(), "Admin User", "admin@example.com", hashPassword("admin123"), "@admin", "food_police", 1, 1);
  insertUser.run(randomUUID(), "Housemate 1", "user1@example.com", hashPassword("password123"), "@user1", "housemate", 0, 0);
}

// Seed fridges
const fridgeCount = db.prepare("SELECT COUNT(*) as count FROM fridges").get() as { count: number };
if (fridgeCount.count === 0) {
  const insertFridge = db.prepare("INSERT INTO fridges (id, name) VALUES (?, ?)");
  insertFridge.run("f1", "Fridge 1");
  insertFridge.run("f2", "Fridge 2");
  insertFridge.run("f3", "Fridge 3");
  insertFridge.run("fr1", "Freezer 1");
  insertFridge.run("fr2", "Freezer 2");
}

// Seed shelves
const shelfCount = db.prepare("SELECT COUNT(*) as count FROM shelves").get() as { count: number };
if (shelfCount.count === 0) {
  const insertShelf = db.prepare("INSERT INTO shelves (id, fridge_id, name, freezer) VALUES (?, ?, ?, ?)");
  insertShelf.run("f1t", "f1", "Top", 0);
  insertShelf.run("f1m", "f1", "Middle", 0);
  insertShelf.run("f1b", "f1", "Bottom", 0);
  insertShelf.run("f2t", "f2", "Top", 0);
  insertShelf.run("f2m", "f2", "Middle", 0);
  insertShelf.run("f2b", "f2", "Bottom", 0);
  insertShelf.run("f3t", "f3", "Top", 0);
  insertShelf.run("f3m", "f3", "Middle", 0);
  insertShelf.run("f3b", "f3", "Bottom", 0);
  insertShelf.run("fr1s", "fr1", "Main", 1);
  insertShelf.run("fr2s", "fr2", "Main", 1);
}

export default db;
