import "dotenv/config";
import { createAgentWallet } from "./wallet";
import { startHealthServer } from "./health";
import { AgentEngine } from "@/lib/agent/engine";
import { loadAgentConfig } from "@/lib/agent/config";

async function main() {
  console.log(JSON.stringify({ event: "agent:booting", version: "1.0.0" }));

  const { walletClient, address } = createAgentWallet();
  const config = loadAgentConfig();

  console.log(JSON.stringify({
    event: "agent:config_loaded",
    walletAddress: address,
    autoExecute: config.autoExecute,
    targetRate: config.targetRate,
    intervalMs: config.intervalMs,
  }));

  const engine = new AgentEngine(walletClient, config);

  const port = parseInt(process.env.PORT ?? "3001");
  startHealthServer(engine, port);

  engine.start();

  // Graceful shutdown
  const shutdown = () => {
    console.log(JSON.stringify({ event: "agent:shutdown_signal" }));
    engine.stop();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err: unknown) => {
  console.error(JSON.stringify({ event: "agent:fatal", error: (err as Error).message }));
  process.exit(1);
});
