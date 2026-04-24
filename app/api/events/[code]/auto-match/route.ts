import { NextResponse } from "next/server";
import { autoMatch } from "@/lib/event-store";
import { publishEvent } from "@/lib/pusher-server";
import {
  buildMember,
  isValidEventCode,
  readUserFromHeaders,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!isValidEventCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const parsed = readUserFromHeaders(req.headers);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await autoMatch(code, buildMember(parsed.user));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  await publishEvent(code, {
    type: result.created ? "group:created" : "group:updated",
    group: result.group,
  });
  return NextResponse.json({ group: result.group, created: result.created });
}
