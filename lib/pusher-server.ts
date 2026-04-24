import Pusher from "pusher";
import type { PusherEvent } from "@/types/event";

let server: Pusher | null = null;

function getServer(): Pusher {
  if (!server) {
    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
      process.env;
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      throw new Error("Missing PUSHER_* env vars");
    }
    server = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return server;
}

export function eventChannel(code: string): string {
  return `event-${code}`;
}

export async function publishEvent(
  code: string,
  event: PusherEvent,
): Promise<void> {
  try {
    await getServer().trigger(eventChannel(code), event.type, event);
  } catch (err) {
    console.error("[pusher] publish failed", err);
  }
}
