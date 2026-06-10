import express from "express";
import type { AgentEngine } from "@/lib/agent/engine";
import { createA2ARouter } from "./a2a";

export function startHealthServer(engine: AgentEngine, port = 3001) {
  const app = express();
  app.use(express.json());

  // CORS — allow Next.js frontend (Vercel) and external agents to call this
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });
  app.options("*", (_req, res) => res.sendStatus(204));

  // A2A interop routes — mounted at /a2a/*
  app.use("/a2a", createA2ARouter(engine));

  app.get("/health", (_req, res) => {
    const status = engine.getStatus();
    res.json({
      status: "ok",
      timestamp: Date.now(),
      address: status.agentAddress,
      uptime: process.uptime() | 0,
    });
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

  // PATCH /config — update config fields and/or toggle active state
  app.patch("/config", (req, res) => {
    const { active, targetRate, autoExecute, slippageBps, intervalMs } =
      req.body as Record<string, unknown>;

    // Config fields
    const patch: Record<string, unknown> = {};
    if (typeof targetRate === "number") patch.targetRate = targetRate;
    if (typeof autoExecute === "boolean") patch.autoExecute = autoExecute;
    if (typeof slippageBps === "number") patch.slippageBps = slippageBps;
    if (typeof intervalMs === "number") patch.intervalMs = intervalMs;
    if (Object.keys(patch).length > 0) engine.updateConfig(patch);

    // Active toggle — pause/resume without killing the process
    if (typeof active === "boolean") {
      if (active) engine.resume();
      else engine.pause();
    }

    res.json({ ok: true });
  });

  const server = app.listen(port, () => {
    console.log(JSON.stringify({ event: "health:started", port }));
  });

  return server;
}
