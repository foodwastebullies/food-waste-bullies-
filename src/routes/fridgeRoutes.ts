import { Router } from "express";
import db from "../db";
import { authenticateToken } from "../services/auth";

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const fridges = db.prepare("SELECT * FROM fridges").all();
  res.json(fridges);
});

export default router;
