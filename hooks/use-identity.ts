"use client";

import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { z } from "zod";
import { USER_ID_LENGTH } from "@/lib/constants";
import { pickEmoji } from "@/lib/emoji";

const identitySchema = z.object({
  userId: z.string().min(6).max(40),
  name: z.string().min(1).max(60),
});

export type Identity = z.infer<typeof identitySchema> & { emoji: string };

function storageKey(eventCode: string): string {
  return `qrg:identity:${eventCode}`;
}

function withEmoji(identity: z.infer<typeof identitySchema>): Identity {
  return { ...identity, emoji: pickEmoji(identity.userId) };
}

export function useIdentity(eventCode: string) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(eventCode));
      if (raw) {
        const result = identitySchema.safeParse(JSON.parse(raw));
        if (result.success) setIdentity(withEmoji(result.data));
      }
    } catch {}
    setLoaded(true);
  }, [eventCode]);

  const save = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setIdentity((prev) => {
        const next = {
          userId: prev?.userId ?? nanoid(USER_ID_LENGTH),
          name: trimmed,
        };
        try {
          localStorage.setItem(storageKey(eventCode), JSON.stringify(next));
        } catch {}
        return withEmoji(next);
      });
    },
    [eventCode],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(eventCode));
    } catch {}
    setIdentity(null);
  }, [eventCode]);

  return { identity, loaded, save, clear };
}
