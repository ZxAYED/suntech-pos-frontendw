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
  title: "Suntech POS",
  description: "Multi-tenant point of sale for SunTech retail operations.",
  applicationName: "Suntech POS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Suntech POS",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0052FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poppins.className} font-sans h-full antialiased`}
    >
      <body className={`min-h-full bg-background ${poppins.className} font-sans text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
