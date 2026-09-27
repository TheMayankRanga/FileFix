import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://filefix.app"),
  title: "FileFix — Make your file fit any upload requirement",
  description: "Resize, compress and convert files in seconds. Set your exact upload requirements and make your image fit.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if (localStorage.getItem("filefix-theme") === "light") document.documentElement.dataset.theme = "light"; } catch (_) {}`,
          }}
        />
      </head>
      <body>
        <SiteHeader />
        {children}
        <Analytics />
        <footer className="site-footer">
          <div className="footer-inner">
            <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">f</span> FileFix</Link>
            <p>Small files. Right dimensions. Ready to upload.</p>
            <span>© {new Date().getFullYear()} FileFix</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
