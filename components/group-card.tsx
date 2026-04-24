"use client";

import { Button } from "@/components/ui/button";
import { MAX_GROUP_SIZE } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import type { Group } from "@/types/event";

export function GroupCard({
  group,
  index,
  currentUserId,
  hasMyGroup,
  onJoin,
  onLeave,
  onToggleClose,
  busy,
}: {
  group: Group;
  index: number;
  currentUserId: string | null;
  hasMyGroup: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleClose: () => void;
  busy: boolean;
}) {
  const size = group.members.length;
  const full = size >= MAX_GROUP_SIZE;
  const closed = !!group.closed;
  const mine = currentUserId
    ? group.members.some((m) => m.userId === currentUserId)
    : false;
  const isCreator = mine && group.members[0]?.userId === currentUserId;
  const blocked = closed || full;
  const inAnother = !mine && hasMyGroup;
  const title = group.name?.trim() || `Grupo ${index + 1}`;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        mine
          ? "border-brand bg-brand-light/40 dark:bg-brand/10"
          : blocked
            ? "border-gray-200 bg-gray-50 opacity-70 dark:border-gray-800 dark:bg-gray-900/40"
            : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="truncate text-lg font-semibold">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {closed ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Listo
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              full
                ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                : "bg-brand-light text-brand dark:bg-brand/20 dark:text-brand-light",
            )}
          >
            {size}/{MAX_GROUP_SIZE}
          </span>
        </div>
      </div>

      <ul className="mb-4 flex flex-wrap gap-2">
        {group.members.map((m) => (
          <li
            key={m.userId}
            className={cn(
              "animate-pop flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm",
              m.userId === currentUserId
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-base",
                m.userId === currentUserId
                  ? "bg-white/20 text-white"
                  : "bg-brand-light text-brand",
              )}
            >
              {m.emoji ?? initials(m.name)}
            </span>
            <span className="max-w-[120px] truncate">{m.name}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {mine ? (
          <>
            <Button
              variant="danger"
              size="sm"
              onClick={onLeave}
              disabled={busy}
            >
              Salir
            </Button>
            {isCreator ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onToggleClose}
                disabled={busy}
              >
                {closed ? "Reabrir" : "Listo"}
              </Button>
            ) : null}
          </>
        ) : closed ? (
          <span className="text-sm text-gray-500">Grupo cerrado</span>
        ) : full ? (
          <span className="text-sm text-gray-500">¡Grupo completo!</span>
        ) : (
          <Button size="sm" onClick={onJoin} disabled={busy || inAnother}>
            {inAnother ? "Ya estás en otro grupo" : "Unirme"}
          </Button>
        )}
      </div>
    </div>
  );
}
