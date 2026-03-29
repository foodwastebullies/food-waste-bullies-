import schedule from "node-schedule";
import db from "../db";
import { formatFoodCheckMessage, sendSlackMessage } from "../slack-utils";

export const CHECK_DELAY_MS = 36 * 60 * 60 * 1000; // 36 hours

export async function runItemCheck(checkId: string, foodItemId: string) {
  db.prepare("UPDATE food_item_checks SET fired = 1 WHERE id = ?").run(checkId);

  const item = db.prepare(`
    SELECT fi.*, u.name as owner_name, u.slack_handle,
           s.name as shelf_name, f.name as fridge_name
    FROM food_items fi
    JOIN shelves s ON fi.shelf_id = s.id
    JOIN fridges f ON s.fridge_id = f.id
    JOIN users u ON fi.user_id = u.id
    WHERE fi.id = ?
  `).get(foodItemId) as any;

  if (item) {
    console.log(`[CHECK] "${item.name}" still in fridge after 36h — sending Slack alert`);
    await sendSlackMessage(
      formatFoodCheckMessage(item.name, item.owner_name, item.slack_handle, item.expiry_date, `${item.fridge_name} - ${item.shelf_name}`),
    );
  }
}

export function scheduleItemCheck(checkId: string, foodItemId: string, checkAt: Date) {
  if (checkAt <= new Date()) {
    runItemCheck(checkId, foodItemId);
    return;
  }
  schedule.scheduleJob(checkId, checkAt, () => runItemCheck(checkId, foodItemId));
  console.log(`[CHECK] Scheduled check for food item ${foodItemId} at ${checkAt.toISOString()}`);
}

export function cancelItemCheck(foodItemId: string) {
  const pending = db.prepare(
    "SELECT id FROM food_item_checks WHERE food_item_id = ? AND fired = 0",
  ).get(foodItemId) as any;
  if (pending) {
    const job = schedule.scheduledJobs[pending.id];
    if (job) job.cancel();
    db.prepare("UPDATE food_item_checks SET fired = 1 WHERE id = ?").run(pending.id);
  }
}

export function restorePendingChecks() {
  const pending = db.prepare("SELECT * FROM food_item_checks WHERE fired = 0").all() as any[];
  for (const check of pending) {
    scheduleItemCheck(check.id, check.food_item_id, new Date(check.check_at));
  }
  if (pending.length > 0) {
    console.log(`[CHECK] Restored ${pending.length} pending food item check(s)`);
  }
}
