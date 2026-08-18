/** Форматує дату у вигляді "18 серпня 2026 року", як вимагає ТЗ. Часовий пояс Europe/Kyiv для показу. */
export function formatUkrainianDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  }).format(date);
  return formatted.replace(/\s*р\.?$/u, "") + " року";
}

export function formatUkrainianDateTime(date: Date): string {
  const datePart = formatUkrainianDate(date);
  const timePart = new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
