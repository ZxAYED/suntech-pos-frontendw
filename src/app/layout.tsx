import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SunTech POS",
  description: "Multi-tenant point of sale for SunTech retail operations.",
  applicationName: "SunTech POS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SunTech POS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0052FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${poppins.className} font-sans h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className={`min-h-full bg-background ${poppins.className} font-sans text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
