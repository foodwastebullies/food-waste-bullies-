import { Router } from "express";
import db from "../db";
import { hashPassword, authenticateToken } from "../services/auth";

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});

router.post("/", authenticateToken, (req, res) => {
  const { id, name, email, password, slack_handle, check_in_date, check_out_date, role, admin } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required" });

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, slack_handle, check_in_date, check_out_date, role, admin, on_patrol)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(id, name, email, hashPassword(password), slack_handle, check_in_date, check_out_date, role, admin ? 1 : 0);

  res.status(201).json({ status: "success" });
});

router.put("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, password, slack_handle, check_in_date, check_out_date, role, admin } = req.body;

  const existing = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(id) as any;
  if (!existing) return res.status(404).json({ error: "User not found" });

  const passwordHash = password ? hashPassword(password) : existing.password_hash;

  db.prepare(`
    UPDATE users
    SET name = ?, email = ?, password_hash = ?, slack_handle = ?, check_in_date = ?, check_out_date = ?, role = ?, admin = ?
    WHERE id = ?
  `).run(name, email, passwordHash, slack_handle, check_in_date || null, check_out_date || null, role, admin ? 1 : 0, id);

  res.json({ status: "success" });
});

router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ status: "success" });
});

export default router;
