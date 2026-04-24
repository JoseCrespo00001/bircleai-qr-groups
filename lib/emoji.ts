const EMOJIS = [
  "🦊",
  "🐼",
  "🦁",
  "🐯",
  "🐨",
  "🐵",
  "🦄",
  "🐸",
  "🐙",
  "🦈",
  "🐳",
  "🦉",
  "🐢",
  "🦝",
  "🐺",
  "🐴",
  "🐷",
  "🦒",
  "🦔",
  "🦘",
  "🐻",
  "🐰",
  "🐹",
  "🐥",
  "🐧",
  "🦆",
  "🦅",
  "🦩",
  "🐬",
  "🦋",
  "🐞",
  "🦖",
];

export function pickEmoji(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % EMOJIS.length;
  return EMOJIS[idx];
}
