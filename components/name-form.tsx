"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX, NAME_MIN } from "@/lib/constants";

export function NameForm({
  defaultValue = "",
  title = "¿Cómo te llamás?",
  submitLabel = "Entrar",
  onSubmit,
}: {
  defaultValue?: string;
  title?: string;
  submitLabel?: string;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < NAME_MIN) {
      setError("Escribí tu nombre");
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setError(`Máximo ${NAME_MAX} caracteres`);
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handle} className="flex w-full flex-col gap-4">
      <label className="text-lg font-semibold">{title}</label>
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tu nombre"
        maxLength={NAME_MAX}
        autoComplete="given-name"
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
