"use client";

import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { getPusherClient } from "@/lib/pusher-client";
import type { EventState, Group, PusherEvent } from "@/types/event";
import type { Identity } from "@/hooks/use-identity";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function fetcher(url: string): Promise<EventState> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function applyEvent(
  prev: EventState | undefined,
  evt: PusherEvent,
): EventState | undefined {
  if (!prev) return prev;
  switch (evt.type) {
    case "group:created": {
      if (prev.groups.some((g) => g.id === evt.group.id)) return prev;
      return { ...prev, groups: [...prev.groups, evt.group] };
    }
    case "group:updated": {
      return {
        ...prev,
        groups: prev.groups.map((g) => (g.id === evt.group.id ? evt.group : g)),
      };
    }
    case "group:deleted": {
      return {
        ...prev,
        groups: prev.groups.filter((g) => g.id !== evt.groupId),
      };
    }
  }
}

export function useEvent(code: string, identity: Identity | null) {
  const key = `/api/events/${code}`;
  const { data, error, isLoading, mutate } = useSWR<EventState>(key, fetcher, {
    refreshInterval: 10_000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`event-${code}`);

    const handler = (evt: PusherEvent) => {
      mutate((prev) => applyEvent(prev, evt), { revalidate: false });
    };

    channel.bind("group:created", handler);
    channel.bind("group:updated", handler);
    channel.bind("group:deleted", handler);

    return () => {
      channel.unbind("group:created", handler);
      channel.unbind("group:updated", handler);
      channel.unbind("group:deleted", handler);
      pusher.unsubscribe(`event-${code}`);
    };
  }, [code, mutate]);

  const withIdentity = useCallback(
    async (path: string, body?: unknown): Promise<ActionResult<unknown>> => {
      if (!identity) return { ok: false, error: "Sin identidad" };
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": identity.userId,
          "x-user-name": identity.name,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: payload.error ?? `HTTP ${res.status}` };
      }
      return { ok: true, data: payload };
    },
    [identity],
  );

  const createGroup = useCallback(
    async (name?: string) => {
      const r = await withIdentity(
        `/api/events/${code}/groups`,
        name ? { name } : undefined,
      );
      if (r.ok) mutate();
      return r;
    },
    [code, mutate, withIdentity],
  );

  const joinGroup = useCallback(
    async (groupId: string) => {
      const r = await withIdentity(
        `/api/events/${code}/groups/${groupId}/join`,
      );
      if (r.ok) mutate();
      return r;
    },
    [code, mutate, withIdentity],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      const r = await withIdentity(
        `/api/events/${code}/groups/${groupId}/leave`,
      );
      if (r.ok) mutate();
      return r;
    },
    [code, mutate, withIdentity],
  );

  const autoMatch = useCallback(async () => {
    const r = await withIdentity(`/api/events/${code}/auto-match`);
    if (r.ok) mutate();
    return r;
  }, [code, mutate, withIdentity]);

  const setClosed = useCallback(
    async (groupId: string, closed: boolean) => {
      const r = await withIdentity(
        `/api/events/${code}/groups/${groupId}/close`,
        { closed },
      );
      if (r.ok) mutate();
      return r;
    },
    [code, mutate, withIdentity],
  );

  const myGroup: Group | undefined = identity
    ? data?.groups.find((g) =>
        g.members.some((m) => m.userId === identity.userId),
      )
    : undefined;

  return {
    state: data,
    myGroup,
    hasMyGroup: !!myGroup,
    isLoading,
    error,
    actions: { createGroup, joinGroup, leaveGroup, autoMatch, setClosed },
  };
}
