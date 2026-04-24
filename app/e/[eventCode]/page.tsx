"use client";

import { use, useState } from "react";
import { NameForm } from "@/components/name-form";
import { GroupCard } from "@/components/group-card";
import { LobbyHeader } from "@/components/lobby-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUP_NAME_MAX } from "@/lib/constants";
import { useIdentity } from "@/hooks/use-identity";
import { useEvent } from "@/hooks/use-event";

type ActionResult = { ok: boolean; error?: string };

export default function LobbyPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = use(params);
  const { identity, loaded, save, clear } = useIdentity(eventCode);
  const [editingName, setEditingName] = useState(false);
  const { state, myGroup, hasMyGroup, isLoading, error, actions } = useEvent(
    eventCode,
    identity,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <p className="text-gray-500">Cargando…</p>
      </main>
    );
  }

  if (error) {
    const notFound = (error as Error).message
      ?.toLowerCase()
      .includes("not found");
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">
          {notFound ? "Evento no encontrado" : "Algo falló"}
        </h1>
        <p className="text-gray-500">
          {notFound
            ? "Puede que haya expirado. Pedile al organizador un QR nuevo."
            : (error as Error).message}
        </p>
      </main>
    );
  }

  if (!identity || editingName) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Evento
          </p>
          <p className="font-mono text-xl font-semibold tracking-widest">
            {eventCode.toUpperCase()}
          </p>
        </div>
        <div className="w-full">
          <NameForm
            defaultValue={identity?.name ?? ""}
            title={identity ? "Cambiar nombre" : "¿Cómo te llamás?"}
            submitLabel={identity ? "Guardar" : "Entrar"}
            onSubmit={(name) => {
              save(name);
              setEditingName(false);
            }}
          />
          {identity ? (
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className="mt-3 w-full text-sm text-gray-500 hover:underline"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  async function run(action: () => Promise<ActionResult>) {
    setBusy(true);
    setActionError(null);
    try {
      const r = await action();
      if (!r.ok) {
        setActionError(translateError(r.error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    const trimmed = groupName.trim();
    await run(() => actions.createGroup(trimmed || undefined));
    setCreatingGroup(false);
    setGroupName("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-2">
      <LobbyHeader
        name={identity.name}
        emoji={identity.emoji}
        canAct={!isLoading}
        busy={busy}
        hasMyGroup={hasMyGroup}
        onCreate={() => setCreatingGroup(true)}
        onAutoMatch={() => run(actions.autoMatch)}
        onChangeName={() => setEditingName(true)}
      />

      {creatingGroup ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <label className="mb-2 block text-sm font-medium">
            Nombre del grupo{" "}
            <span className="text-xs text-gray-500">(opcional)</span>
          </label>
          <Input
            autoFocus
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Los Rojos, Equipo A, …"
            maxLength={GROUP_NAME_MAX}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={busy}>
              Crear grupo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreatingGroup(false);
                setGroupName("");
              }}
              disabled={busy}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </div>
      ) : null}

      <section className="mt-6 flex flex-col gap-3 pb-10">
        {!state && isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : state && state.groups.length > 0 ? (
          state.groups.map((g, idx) => (
            <GroupCard
              key={g.id}
              group={g}
              index={idx}
              currentUserId={identity.userId}
              hasMyGroup={hasMyGroup}
              onJoin={() => run(() => actions.joinGroup(g.id))}
              onLeave={() => run(() => actions.leaveGroup(g.id))}
              onToggleClose={() =>
                run(() => actions.setClosed(g.id, !g.closed))
              }
              busy={busy}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
            Todavía no hay grupos. Creá el primero o usá Auto-match.
          </div>
        )}
      </section>

      <footer className="pb-8 pt-2 text-center">
        <Button variant="ghost" size="sm" onClick={clear}>
          Salir del evento
        </Button>
      </footer>
    </main>
  );
}

function translateError(err?: string): string {
  switch (err) {
    case "FULL":
      return "¡El grupo ya está completo!";
    case "CLOSED":
      return "El grupo ya está cerrado.";
    case "ALREADY_IN":
      return "Ya estás en este grupo.";
    case "NOT_FOUND":
      return "No se encontró el grupo o el evento.";
    case "NOT_MEMBER":
      return "No estabas en ese grupo.";
    case "NOT_CREATOR":
      return "Solo el creador del grupo puede cerrarlo.";
    default:
      return err ?? "Algo falló";
  }
}
