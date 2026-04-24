"use client";

import Link from "next/link";
import { use } from "react";
import { QrDisplay } from "@/components/qr-display";

export default function HostPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = use(params);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Evento
        </p>
        <h1 className="font-mono text-4xl font-bold tracking-widest">
          {eventCode.toUpperCase()}
        </h1>
      </div>

      <QrDisplay code={eventCode} />

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Mostralo en una pantalla. La gente lo escanea y entra a poner su nombre.
      </div>

      <div className="flex flex-col items-center gap-3 text-sm">
        <Link
          href={`/e/${eventCode}/display`}
          className="text-brand underline-offset-4 hover:underline"
        >
          Abrir pantalla gigante (para proyectar) →
        </Link>
        <Link
          href={`/e/${eventCode}`}
          className="text-gray-500 underline-offset-4 hover:underline"
        >
          Entrar al lobby como participante →
        </Link>
      </div>
    </main>
  );
}
