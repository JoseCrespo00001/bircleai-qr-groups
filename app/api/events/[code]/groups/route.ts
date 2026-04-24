import { NextResponse } from "next/server";
import { z } from "zod";
import { createGroup, eventExists } from "@/lib/event-store";
import { publishEvent } from "@/lib/pusher-server";
import {
  buildMember,
  isValidEventCode,
  readUserFromHeaders,
} from "@/lib/validation";
import { GROUP_NAME_MAX } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    name: z.string().trim().max(GROUP_NAME_MAX).optional(),
  })
  .optional();

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

  if (!(await eventExists(code))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const raw = await req.json().catch(() => ({}));
  const body = bodySchema.safeParse(raw);
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const group = await createGroup(
    code,
    buildMember(parsed.user),
    body.data?.name,
  );
  await publishEvent(code, { type: "group:created", group });
  return NextResponse.json({ group });
}
