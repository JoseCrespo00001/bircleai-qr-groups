import { NextResponse } from "next/server";
import { leaveGroup } from "@/lib/event-store";
import { publishEvent } from "@/lib/pusher-server";
import {
  isValidEventCode,
  isValidId,
  readUserFromHeaders,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; groupId: string }> },
) {
  const { code, groupId } = await params;
  if (!isValidEventCode(code) || !isValidId(groupId)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const parsed = readUserFromHeaders(req.headers);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await leaveGroup(code, groupId, parsed.user.userId);
  if (!result.ok) {
    const status = result.error === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (result.group) {
    await publishEvent(code, { type: "group:updated", group: result.group });
    return NextResponse.json({ group: result.group });
  }

  await publishEvent(code, { type: "group:deleted", groupId });
  return NextResponse.json({ group: null });
}
