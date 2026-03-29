import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "./src/db"; // initialize database + run migrations + seed
import { restorePendingChecks } from "./src/services/foodChecks";
import authRoutes from "./src/routes/authRoutes";
import userRoutes from "./src/routes/userRoutes";
import fridgeRoutes from "./src/routes/fridgeRoutes";
import shelveRoutes from "./src/routes/shelveRoutes";
import foodItemRoutes from "./src/routes/foodItemRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  restorePendingChecks();

  app.use("/api", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/fridges", fridgeRoutes);
  app.use("/api/shelves", shelveRoutes);
  app.use("/api/food-items", foodItemRoutes);

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
