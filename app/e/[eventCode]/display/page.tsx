"use client";

import { use } from "react";
import { useEvent } from "@/hooks/use-event";
import { MAX_GROUP_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/event";

export default function DisplayPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = use(params);
  const { state, isLoading, error } = useEvent(eventCode, null);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0C0C20] px-10 text-center text-white">
        <div>
          <h1 className="text-6xl font-bold">Evento no encontrado</h1>
          <p className="mt-4 text-2xl text-gray-400">
            Revisá el código: <span className="font-mono">{eventCode}</span>
          </p>
        </div>
      </main>
    );
  }

  const groups = state?.groups ?? [];
  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);

  return (
    <main className="min-h-screen bg-[#0C0C20] px-8 py-10 text-white">
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="text-lg uppercase tracking-[0.3em] text-brand-light/70">
            Evento
          </p>
          <h1 className="font-mono text-6xl font-bold tracking-widest">
            {eventCode.toUpperCase()}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-wider text-gray-400">
            Grupos · Personas
          </p>
          <p className="text-4xl font-semibold">
            {groups.length} · {totalMembers}
          </p>
        </div>
      </header>

      {isLoading && !state ? (
        <div className="flex items-center justify-center py-32 text-2xl text-gray-500">
          Cargando…
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-4xl font-semibold text-gray-300">
            Escaneá el QR y armá el primer grupo
          </p>
          <p className="mt-4 text-xl text-gray-500">
            Los grupos aparecen acá en tiempo real
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, idx) => (
            <DisplayGroup key={g.id} group={g} index={idx} />
          ))}
        </section>
      )}
    </main>
  );
}

function DisplayGroup({ group, index }: { group: Group; index: number }) {
  const title = group.name?.trim() || `Grupo ${index + 1}`;
  const size = group.members.length;
  const full = size >= MAX_GROUP_SIZE;
  const closed = !!group.closed;

  return (
    <article
      className={cn(
        "rounded-3xl border bg-white/5 p-6 backdrop-blur",
        closed
          ? "border-emerald-500/50"
          : full
            ? "border-amber-500/50"
            : "border-white/10",
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="truncate text-3xl font-bold">{title}</h2>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          {closed ? (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300">
              Listo
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-3 py-1 font-semibold",
              full
                ? "bg-amber-500/20 text-amber-300"
                : "bg-brand/20 text-brand-light",
            )}
          >
            {size}/{MAX_GROUP_SIZE}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {group.members.map((m) => (
          <li
            key={m.userId}
            className="animate-pop flex items-center gap-4 rounded-2xl bg-white/5 px-4 py-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl">
              {m.emoji ?? "👤"}
            </span>
            <span className="truncate text-2xl font-semibold">{m.name}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
