import { NextResponse } from "next/server";
import { getEventState } from "@/lib/event-store";
import { isValidEventCode } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!isValidEventCode(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const state = await getEventState(code);
  if (!state) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json(state);
}
