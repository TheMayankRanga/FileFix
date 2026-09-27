import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="FileFix home">
          <span className="brand-mark" aria-hidden="true">f</span> FileFix
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/compress-image">Compress</Link>
          <Link href="/resize-image">Resize</Link>
          <Link href="/image-to-pdf">Image → PDF</Link>
          <Link href="/pdf-to-image">PDF → Image</Link>
        </nav>
        <ThemeToggle />
        <Link className="button button-small" href="/#tool">Make it fit <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
