import Link from "next/link";

export default function Header() {
  return (
    <header className="ul-header">
      <div className="ul-header-inner">
        <Link href="/" className="ul-wordmark">
          <span className="ul-wordmark-mark">UPSC</span>&nbsp;Labs
        </Link>
        <nav className="ul-nav" aria-label="Primary">
          <Link href="/#tools">Tools</Link>
          <Link href="/gs1">GS1</Link>
          <Link href="/#newsletter">Newsletter</Link>
        </nav>
      </div>
    </header>
  );
}
