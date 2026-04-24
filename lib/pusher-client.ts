"use client";

import PusherClient from "pusher-js";

let singleton: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (singleton) return singleton;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    console.warn(
      "[pusher] NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER not set",
    );
    return null;
  }

  singleton = new PusherClient(key, { cluster, forceTLS: true });
  return singleton;
}
