import { NextResponse } from "next/server";
import { z } from "zod";
import { setGroupClosed } from "@/lib/event-store";
import { publishEvent } from "@/lib/pusher-server";
import {
  isValidEventCode,
  isValidId,
  readUserFromHeaders,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ closed: z.boolean() });

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

  const raw = await req.json().catch(() => ({}));
  const body = bodySchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await setGroupClosed(
    code,
    groupId,
    parsed.user.userId,
    body.data.closed,
  );
  if (!result.ok) {
    const status = result.error === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  await publishEvent(code, { type: "group:updated", group: result.group });
  return NextResponse.json({ group: result.group });
}
