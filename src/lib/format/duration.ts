/** Читабельна тривалість між двома датами (роки, місяці, дні), українською. */
export function formatDuration(start: Date, end: Date | null, asOfDate: Date): string {
  const endEffective = end ?? asOfDate;
  const totalDays = Math.max(0, Math.floor((endEffective.getTime() - start.getTime()) / 86_400_000));
  const years = Math.floor(totalDays / 365);
  const remainderAfterYears = totalDays % 365;
  const months = Math.floor(remainderAfterYears / 30);
  const days = remainderAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${pluralYears(years)}`);
  if (months > 0) parts.push(`${months} ${pluralMonths(months)}`);
  if (years === 0 && (days > 0 || parts.length === 0)) parts.push(`${days} ${pluralDays(days)}`);

  return parts.join(" ");
}

function pluralYears(n: number): string {
  return pluralize(n, "рік", "роки", "років");
}
function pluralMonths(n: number): string {
  return pluralize(n, "місяць", "місяці", "місяців");
}
function pluralDays(n: number): string {
  return pluralize(n, "день", "дні", "днів");
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
