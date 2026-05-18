import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AppShell from "@/components/layout";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LeetScout | LeetCode Cheating Detector & Contest Replay",
    template: "%s | LeetScout"
  },
  description:
    "LeetScout is a LeetCode cheating detector and contest replay tool. Scout competitors, review contest history, and watch keystroke replays to spot suspicious patterns.",
  keywords: [
    "leetcode cheat detector",
    "leetcode cheater detector",
    "leetcode cheater list",
    "leetcode cheating",
    "leetcode scout",
    "contest replay",
    "keystroke replay"
  ],
  applicationName: "LeetScout",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "LeetScout | LeetCode Cheating Detector & Contest Replay",
    description:
      "Scout competitors, review contest history, and watch keystroke replays with LeetScout.",
    siteName: "LeetScout"
  },
  twitter: {
    card: "summary_large_image",
    title: "LeetScout | LeetCode Cheating Detector & Contest Replay",
    description:
      "Scout competitors, review contest history, and watch keystroke replays with LeetScout."
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
