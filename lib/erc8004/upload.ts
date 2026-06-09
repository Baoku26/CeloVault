import { readFileSync } from "fs";
import { join } from "path";
import type { AgentCard } from "./registry";

export async function uploadAgentCard(agentCard: AgentCard): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set in environment");

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: agentCard,
      pinataMetadata: { name: "celovault-agent-card" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

export function loadAgentCard(): AgentCard {
  const path = join(process.cwd(), "agent", "registration.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as AgentCard;
}
