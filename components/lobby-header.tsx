"use client";

import { Button } from "@/components/ui/button";
import { MAX_GROUP_SIZE } from "@/lib/constants";

export function LobbyHeader({
  name,
  emoji,
  canAct,
  busy,
  hasMyGroup,
  onCreate,
  onAutoMatch,
  onChangeName,
}: {
  name: string;
  emoji: string;
  canAct: boolean;
  busy: boolean;
  hasMyGroup: boolean;
  onCreate: () => void;
  onAutoMatch: () => void;
  onChangeName: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-[#0C0C20]/90">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-2xl dark:bg-brand/20">
            {emoji}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Hola,</p>
            <p className="truncate text-lg font-semibold">{name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeName}
          className="shrink-0 text-sm text-brand underline-offset-4 hover:underline"
        >
          Cambiar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          onClick={onCreate}
          disabled={!canAct || busy || hasMyGroup}
          size="md"
        >
          Crear grupo
        </Button>
        <Button
          variant="secondary"
          onClick={onAutoMatch}
          disabled={!canAct || busy || hasMyGroup}
          size="md"
        >
          Auto-match
        </Button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {hasMyGroup
          ? "Ya estás en un grupo. Salí primero si querés cambiar."
          : `Máximo ${MAX_GROUP_SIZE} personas por grupo.`}
      </p>
    </header>
  );
}
