import { Router } from "express";
import db from "../db";
import { authenticateToken } from "../services/auth";

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const shelves = db.prepare(`
    SELECT s.*, f.name as fridge_name
    FROM shelves s
    JOIN fridges f ON s.fridge_id = f.id
    ORDER BY f.name, s.name
  `).all();
  res.json(shelves);
});

export default router;
