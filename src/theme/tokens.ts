/**
 * Спрощена реалізація рольових кольорів Material Design 3 (M3 color roles)
 * поверх MUI, без офіційної M3-бібліотеки для React (станом на розробку
 * такої зрілої/підтримуваної бібліотеки немає) — задокументовано в
 * docs/DECISION_LOG.md. Стримана державницька палітра: приглушений
 * синьо-жовтий акцент без прямої імітації прапора чи офіційної символіки.
 */
export const lightTokens = {
  primary: "#2E5AAC",
  onPrimary: "#FFFFFF",
  primaryContainer: "#D9E2FF",
  onPrimaryContainer: "#001945",
  secondary: "#8A6D00",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFDF9C",
  onSecondaryContainer: "#2A1F00",
  tertiary: "#3F6375",
  onTertiary: "#FFFFFF",
  background: "#FBFAF8",
  onBackground: "#1B1B1B",
  surface: "#FFFFFF",
  surfaceVariant: "#F0F0F4",
  onSurfaceVariant: "#44464A",
  outline: "#74777F",
  error: "#B3261E",
  onError: "#FFFFFF",
  errorContainer: "#F9DEDC",
  onErrorContainer: "#410E0B",
} as const;

export const darkTokens = {
  primary: "#B0C6FF",
  onPrimary: "#00296B",
  primaryContainer: "#153F8F",
  onPrimaryContainer: "#D9E2FF",
  secondary: "#EDC148",
  onSecondary: "#3A2E00",
  secondaryContainer: "#584400",
  onSecondaryContainer: "#FFDF9C",
  tertiary: "#B7CBDD",
  onTertiary: "#123548",
  background: "#121212",
  onBackground: "#E4E2E0",
  surface: "#1B1B1B",
  surfaceVariant: "#44464A",
  onSurfaceVariant: "#C5C6CE",
  outline: "#8E9099",
  error: "#F2B8B5",
  onError: "#601410",
  errorContainer: "#8C1D18",
  onErrorContainer: "#F9DEDC",
} as const;

/**
 * Кольори категорій статусу території. Колір НІКОЛИ не є єдиним носієм
 * сенсу в інтерфейсі — завжди супроводжується текстом та іконкою/патерном
 * (див. компонент StatusChip).
 */
export const statusColorTokens: Record<string, { light: string; dark: string }> = {
  "status-possible": { light: "#8A6D00", dark: "#EDC148" },
  "status-active": { light: "#B3261E", dark: "#F2B8B5" },
  "status-active-eresources": { light: "#9A3B00", dark: "#FFB68B" },
  "status-occupied": { light: "#5B2168", dark: "#DCB8E8" },
};
