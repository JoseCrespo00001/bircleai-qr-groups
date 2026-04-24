import { NextResponse } from "next/server";
import { joinGroup } from "@/lib/event-store";
import { publishEvent } from "@/lib/pusher-server";
import {
  buildMember,
  isValidEventCode,
  isValidId,
  readUserFromHeaders,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  FULL: 409,
  ALREADY_IN: 409,
  CLOSED: 409,
};

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

  const result = await joinGroup(code, groupId, buildMember(parsed.user));
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: STATUS[result.error] ?? 400 },
    );
  }

  await publishEvent(code, { type: "group:updated", group: result.group });
  return NextResponse.json({ group: result.group });
}
