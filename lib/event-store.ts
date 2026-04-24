import { nanoid } from "nanoid";
import { getRedis } from "@/lib/redis";
import {
  EVENT_CODE_LENGTH,
  EVENT_TTL_SECONDS,
  GROUP_ID_LENGTH,
  MAX_GROUP_SIZE,
} from "@/lib/constants";
import type { EventState, Group, Member } from "@/types/event";

const metaKey = (code: string) => `event:${code}:meta`;
const groupsSetKey = (code: string) => `event:${code}:groups`;
const groupKey = (code: string, groupId: string) => `group:${code}:${groupId}`;

type Meta = { createdAt: number };

async function touch(code: string): Promise<void> {
  const redis = getRedis();
  const ids = await redis.smembers(groupsSetKey(code));
  await Promise.all([
    redis.expire(metaKey(code), EVENT_TTL_SECONDS),
    redis.expire(groupsSetKey(code), EVENT_TTL_SECONDS),
    ...ids.map((id) => redis.expire(groupKey(code, id), EVENT_TTL_SECONDS)),
  ]);
}

export async function createEvent(): Promise<string> {
  const redis = getRedis();
  const code = nanoid(EVENT_CODE_LENGTH)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "a");
  const meta: Meta = { createdAt: Date.now() };
  await redis.set(metaKey(code), meta, { ex: EVENT_TTL_SECONDS });
  return code;
}

export async function eventExists(code: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(metaKey(code));
  return exists === 1;
}

export async function getEventState(code: string): Promise<EventState | null> {
  const redis = getRedis();
  const meta = await redis.get<Meta>(metaKey(code));
  if (!meta) return null;

  const ids = await redis.smembers(groupsSetKey(code));
  if (ids.length === 0) {
    return { code, createdAt: meta.createdAt, groups: [] };
  }

  const keys = ids.map((id) => groupKey(code, id));
  const groups = await redis.mget<Array<Group | null>>(...keys);
  const clean = groups.filter((g): g is Group => g !== null);
  clean.sort((a, b) => a.createdAt - b.createdAt);
  return { code, createdAt: meta.createdAt, groups: clean };
}

async function saveGroup(code: string, group: Group): Promise<void> {
  const redis = getRedis();
  await redis.set(groupKey(code, group.id), group, { ex: EVENT_TTL_SECONDS });
  await redis.sadd(groupsSetKey(code), group.id);
  await touch(code);
}

export async function createGroup(
  code: string,
  user: Member,
  name?: string,
): Promise<Group> {
  const trimmed = name?.trim();
  const group: Group = {
    id: nanoid(GROUP_ID_LENGTH),
    members: [user],
    createdAt: Date.now(),
    ...(trimmed ? { name: trimmed } : {}),
  };
  await saveGroup(code, group);
  return group;
}

export type JoinError = "NOT_FOUND" | "FULL" | "ALREADY_IN" | "CLOSED";
export type JoinResult =
  | { ok: true; group: Group }
  | { ok: false; error: JoinError };

export async function joinGroup(
  code: string,
  groupId: string,
  user: Member,
): Promise<JoinResult> {
  const redis = getRedis();
  const group = await redis.get<Group>(groupKey(code, groupId));
  if (!group) return { ok: false, error: "NOT_FOUND" };
  if (group.closed) return { ok: false, error: "CLOSED" };
  if (group.members.some((m) => m.userId === user.userId)) {
    return { ok: false, error: "ALREADY_IN" };
  }
  if (group.members.length >= MAX_GROUP_SIZE) {
    return { ok: false, error: "FULL" };
  }
  group.members.push(user);
  await redis.set(groupKey(code, groupId), group, { ex: EVENT_TTL_SECONDS });
  await touch(code);
  return { ok: true, group };
}

export type SetClosedResult =
  | { ok: true; group: Group }
  | { ok: false; error: "NOT_FOUND" | "NOT_CREATOR" };

export async function setGroupClosed(
  code: string,
  groupId: string,
  userId: string,
  closed: boolean,
): Promise<SetClosedResult> {
  const redis = getRedis();
  const group = await redis.get<Group>(groupKey(code, groupId));
  if (!group) return { ok: false, error: "NOT_FOUND" };
  const creatorId = group.members[0]?.userId;
  if (creatorId !== userId) return { ok: false, error: "NOT_CREATOR" };
  group.closed = closed;
  await redis.set(groupKey(code, groupId), group, { ex: EVENT_TTL_SECONDS });
  await touch(code);
  return { ok: true, group };
}

export type LeaveResult =
  | { ok: true; group: Group | null }
  | { ok: false; error: "NOT_FOUND" | "NOT_MEMBER" };

export async function leaveGroup(
  code: string,
  groupId: string,
  userId: string,
): Promise<LeaveResult> {
  const redis = getRedis();
  const group = await redis.get<Group>(groupKey(code, groupId));
  if (!group) return { ok: false, error: "NOT_FOUND" };
  const idx = group.members.findIndex((m) => m.userId === userId);
  if (idx === -1) return { ok: false, error: "NOT_MEMBER" };

  group.members.splice(idx, 1);

  if (group.members.length === 0) {
    await redis.del(groupKey(code, groupId));
    await redis.srem(groupsSetKey(code), groupId);
    await touch(code);
    return { ok: true, group: null };
  }

  await redis.set(groupKey(code, groupId), group, { ex: EVENT_TTL_SECONDS });
  await touch(code);
  return { ok: true, group };
}

export type AutoMatchResult =
  | { ok: true; group: Group; created: boolean }
  | { ok: false; error: "NOT_FOUND" };

export async function autoMatch(
  code: string,
  user: Member,
): Promise<AutoMatchResult> {
  const state = await getEventState(code);
  if (!state) return { ok: false, error: "NOT_FOUND" };

  const alreadyIn = state.groups.find((g) =>
    g.members.some((m) => m.userId === user.userId),
  );
  if (alreadyIn) return { ok: true, group: alreadyIn, created: false };

  const open = state.groups.find(
    (g) => !g.closed && g.members.length < MAX_GROUP_SIZE,
  );
  if (open) {
    const res = await joinGroup(code, open.id, user);
    if (res.ok) return { ok: true, group: res.group, created: false };
  }

  const group = await createGroup(code, user);
  return { ok: true, group, created: true };
}
