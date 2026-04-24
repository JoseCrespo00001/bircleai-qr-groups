import { z } from "zod";
import { NAME_MAX, NAME_MIN } from "@/lib/constants";
import { pickEmoji } from "@/lib/emoji";
import type { Member } from "@/types/event";

export const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, "Tu nombre no puede estar vacío")
  .max(NAME_MAX, `Máximo ${NAME_MAX} caracteres`);

export const userHeaderSchema = z.object({
  userId: z.string().min(6).max(40),
  name: nameSchema,
});

const CODE_RE = /^[a-z0-9]{4,16}$/;
const ID_RE = /^[A-Za-z0-9_-]{4,20}$/;

export function isValidEventCode(code: string): boolean {
  return CODE_RE.test(code);
}

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

export function readUserFromHeaders(
  headers: Headers,
):
  | { ok: true; user: { userId: string; name: string } }
  | { ok: false; error: string } {
  const userId = headers.get("x-user-id");
  const name = headers.get("x-user-name");
  const parsed = userHeaderSchema.safeParse({ userId, name });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid user",
    };
  }
  return { ok: true, user: parsed.data };
}

export function buildMember(user: { userId: string; name: string }): Member {
  return {
    userId: user.userId,
    name: user.name,
    emoji: pickEmoji(user.userId),
    joinedAt: Date.now(),
  };
}
