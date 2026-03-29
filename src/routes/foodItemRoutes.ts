import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db";
import { authenticateToken } from "../services/auth";
import { scheduleItemCheck, cancelItemCheck, CHECK_DELAY_MS } from "../services/foodChecks";
import { formatNewFoodMessage, sendSlackMessage } from "../slack-utils";

const router = Router();

router.get("/", authenticateToken, (req, res) => {
  const items = db.prepare(`
    SELECT
      fi.*,
      s.fridge_id,
      s.name as shelf_name,
      s.freezer,
      f.name as fridge_name,
      u.name as owner_name,
      u.slack_handle as owner_slack
    FROM food_items fi
    JOIN shelves s ON fi.shelf_id = s.id
    JOIN fridges f ON s.fridge_id = f.id
    JOIN users u ON fi.user_id = u.id
    ORDER BY fi.expiry_date ASC
  `).all();
  res.json(items);
});

router.post("/", authenticateToken, async (req, res) => {
  const { id, name, image_url, user_id, shelf_id, expiry_date, serving_number } = req.body;

  db.prepare(`
    INSERT INTO food_items (id, name, image_url, user_id, shelf_id, expiry_date, serving_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, image_url, user_id, shelf_id, expiry_date, serving_number);

  // Schedule a 36h check if the expiry is far enough out
  const createdAt = new Date();
  const checkAt = new Date(createdAt.getTime() + CHECK_DELAY_MS);
  if (new Date(expiry_date) > checkAt) {
    const checkId = randomUUID();
    db.prepare("INSERT INTO food_item_checks (id, food_item_id, check_at) VALUES (?, ?, ?)").run(checkId, id, checkAt.toISOString());
    scheduleItemCheck(checkId, id, checkAt);
  }

  const owner = db.prepare("SELECT name, slack_handle FROM users WHERE id = ?").get(user_id) as any;
  const shelf = db.prepare("SELECT s.name as shelf_name, f.name as fridge_name FROM shelves s JOIN fridges f ON s.fridge_id = f.id WHERE s.id = ?").get(shelf_id) as any;
  await sendSlackMessage(
    formatNewFoodMessage(
      name,
      owner?.name ?? user_id,
      owner?.slack_handle ?? "",
      expiry_date,
      serving_number,
      shelf ? `${shelf.fridge_name} - ${shelf.shelf_name}` : shelf_id,
    ),
  );

  res.status(201).json({ status: "success" });
});

router.patch("/:id/claim", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { servings, user_id } = req.body;

  const item = db.prepare("SELECT * FROM food_items WHERE id = ?").get(id) as any;
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

router.delete("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  cancelItemCheck(id);
  db.prepare("DELETE FROM food_items WHERE id = ?").run(id);
  res.json({ status: "success" });
});

export default router;
