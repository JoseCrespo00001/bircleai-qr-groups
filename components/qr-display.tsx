"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

export function QrDisplay({ code }: { code: string }) {
  const [url, setUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUrl(`${window.location.origin}/e/${code}`);
  }, [code]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white">
        {url ? (
          <QRCodeSVG value={url} size={280} level="M" marginSize={1} />
        ) : (
          <div className="h-[280px] w-[280px] animate-pulse rounded bg-gray-100" />
        )}
      </div>
      {url ? (
        <div className="flex w-full flex-col items-center gap-3">
          <p className="break-all text-center font-mono text-sm text-gray-600 dark:text-gray-300">
            {url}
          </p>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? "¡Copiado!" : "Copiar link"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
