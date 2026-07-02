// Клиентский помощник для целей Yandex Metrica. Без счётчика — no-op.
type YmFn = (id: number, action: string, goal?: string) => void;

export function ymGoal(goal: string): void {
  if (typeof window === "undefined") return;
  const id = process.env.NEXT_PUBLIC_YM_ID;
  if (!id) return;
  const ym = (window as unknown as { ym?: YmFn }).ym;
  if (typeof ym === "function") ym(Number(id), "reachGoal", goal);
}
