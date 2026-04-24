import { NextResponse } from "next/server";
import { createEvent } from "@/lib/event-store";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIpFrom(req);
  const rl = await rateLimit(`events:create:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const code = await createEvent();
    return NextResponse.json({ code });
  } catch (err) {
    console.error("[api/events POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
