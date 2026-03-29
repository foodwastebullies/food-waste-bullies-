import { Router } from "express";
import jwt from "jsonwebtoken";
import db from "../db";
import { hashPassword, verifyPassword, authenticateToken, JWT_SECRET } from "../services/auth";
import { sendResetDM } from "../slack-utils";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, admin: user.admin },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.json({ token, user });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email) as any;
  // Always return success to avoid leaking which emails exist
  if (!user) return res.json({ status: "success" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0").run(user.id);
  db.prepare("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)").run(code, user.id, expiresAt);

  const sent = await sendResetDM(email, user.name, code);
  if (!sent) {
    return res.status(500).json({ error: "Failed to send Slack DM. Ensure SLACK_BOT_TOKEN is configured and the user's email matches their Slack account." });
  }

  res.json({ status: "success" });
});

router.post("/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Email, code, and new password are required" });
  }

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
  if (!user) return res.status(400).json({ error: "Invalid reset request" });

  const record = db.prepare(
    "SELECT * FROM password_reset_tokens WHERE token = ? AND user_id = ? AND used = 0",
  ).get(code, user.id) as any;

  if (!record) return res.status(400).json({ error: "Invalid or expired code" });
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: "Code has expired" });
  }

  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").run(code);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), user.id);
  res.json({ status: "success" });
});

router.get("/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

export default router;
