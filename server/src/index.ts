import "dotenv/config";
import express from "express";
import cors from "cors";
import { crudRouter } from "./routes/crud.js";
import { dataRouter } from "./routes/data.js";
import { aiRouter } from "./routes/ai.js";
import { getAiClient } from "./ai/index.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const aiEnabled = (process.env.AI_ASSISTANT_ENABLED ?? "true").toLowerCase() !== "false";

async function start() {
  if (aiEnabled) {
    try {
      await getAiClient();
      console.log(`AI assistant enabled (provider: ${process.env.AI_PROVIDER || "public"}).`);
    } catch (err) {
      console.error("AI assistant is enabled but misconfigured:");
      console.error(err instanceof Error ? err.message : err);
      console.error(
        "Fix the environment variables above, or set AI_ASSISTANT_ENABLED=false to run without AI features."
      );
      process.exit(1);
    }
  } else {
    console.log("AI assistant disabled via AI_ASSISTANT_ENABLED=false. No external API calls will be made.");
  }

  app.get("/api/config", (_req, res) => {
    res.json({ aiEnabled, aiProvider: process.env.AI_PROVIDER || "public" });
  });

  app.use("/api/subsystems", crudRouter("logicalSubsystems"));
  app.use("/api/cis", crudRouter("cis"));
  app.use("/api/delta-matrix", crudRouter("deltaMatrix"));
  app.use("/api/ab-compatibility", crudRouter("abCompatibility"));
  app.use("/api/cots-records", crudRouter("cotsRecords"));
  app.use("/api/recommendations", crudRouter("recommendations"));
  app.use("/api/data", dataRouter);

  if (aiEnabled) {
    app.use("/api/ai", aiRouter);
  } else {
    app.use("/api/ai", (_req, res) => {
      res.status(403).json({ error: "AI assistant is disabled (AI_ASSISTANT_ENABLED=false)." });
    });
  }

  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`PDR Workbench server listening on http://localhost:${PORT}`);
  });
}

start();
