import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
  if (!agentApiUrl) {
    return NextResponse.json({ error: "Agent not configured" }, { status: 503 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  try {
    const upstream = await fetch(`${agentApiUrl}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = (await upstream.json()) as Record<string, unknown>;
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Agent unreachable" }, { status: 502 });
  }
}
