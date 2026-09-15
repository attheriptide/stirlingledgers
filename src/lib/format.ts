export const money = (n: number | undefined | null): string =>
  Math.round(Number(n) || 0).toLocaleString();

export const todayStr = (): string => new Date().toISOString().slice(0, 10);

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
