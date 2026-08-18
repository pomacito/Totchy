import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Статус території",
    template: "%s · Статус території",
  },
  description:
    "Інформаційно-аналітична система визначення офіційного правового статусу населених пунктів і територіальних громад України.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
