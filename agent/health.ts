import express from "express";
import type { AgentEngine } from "@/lib/agent/engine";

export function startHealthServer(engine: AgentEngine, port = 3001) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/status", (_req, res) => {
    const status = engine.getStatus();
    res.json({
      ...status,
      config: {
        ...status.config,
        minSwapAmount: status.config.minSwapAmount?.toString(),
        maxSwapAmount: status.config.maxSwapAmount?.toString(),
      },
    });
  });

  // Allow UI to update config at runtime (autoExecute toggle, targetRate)
  app.patch("/config", (req, res) => {
    const { targetRate, autoExecute, slippageBps, intervalMs } = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof targetRate === "number") patch.targetRate = targetRate;
    if (typeof autoExecute === "boolean") patch.autoExecute = autoExecute;
    if (typeof slippageBps === "number") patch.slippageBps = slippageBps;
    if (typeof intervalMs === "number") patch.intervalMs = intervalMs;
    engine.updateConfig(patch);
    res.json({ ok: true });
  });

  const server = app.listen(port, () => {
    console.log(JSON.stringify({ event: "health:started", port }));
  });

  return server;
}
