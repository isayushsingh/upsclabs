import Link from "next/link";

export default function Footer() {
  return (
    <footer className="ul-footer">
      <div className="ul-footer-inner">
        <div className="ul-footer-brand">
          <span className="ul-wordmark-mark">UPSC</span> Labs
          <span className="ul-footer-tag">Interactive tools for civil services preparation</span>
        </div>
        <nav className="ul-footer-nav" aria-label="Footer">
          <Link href="/#tools">Tools</Link>
          <Link href="/gs1">GS1</Link>
          <Link href="/#newsletter">Newsletter</Link>
        </nav>
        <span className="ul-footer-meta">© {new Date().getFullYear()} · Built for aspirants</span>
      </div>
    </footer>
  );
}
