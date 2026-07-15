export function compactNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function money(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

export function relativeTick(tick: number, current: number): string {
  const difference = current - tick;
  if (difference <= 0) return 'только что';
  if (difference === 1) return 'ход назад';
  return `${difference} хода назад`;
}

export const seasonName = { spring: 'Весна', summer: 'Лето', autumn: 'Осень', winter: 'Зима' } as const;
