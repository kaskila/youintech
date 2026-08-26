import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font — see globals.css §Type. Two families, no third.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const siteDescription =
  "YouthInTech (Zambia Youths in Technology Network) — technology is for everyone, especially YOUth.";

export const metadata: Metadata = {
  title: {
    template: "%s | YouthInTech",
    default: "YouthInTech — Zambia Youths in Technology Network",
  },
  description: siteDescription,
  openGraph: {
    title: "YouthInTech — Zambia Youths in Technology Network",
    description: siteDescription,
    siteName: "YouthInTech",
    locale: "en_ZM",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
