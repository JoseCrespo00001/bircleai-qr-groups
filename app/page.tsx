"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEvent() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/events", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo crear el evento");
      router.push(`/e/${body.code}/host`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Armá grupos al toque</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Escaneá un QR, poné tu nombre, armá equipo con los que estén cerca.
        </p>
      </div>

      <Button
        size="lg"
        onClick={createEvent}
        disabled={busy}
        className="w-full"
      >
        {busy ? "Creando…" : "Crear evento nuevo"}
      </Button>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Los eventos se borran solos a las 24h.
      </p>
    </main>
  );
}
