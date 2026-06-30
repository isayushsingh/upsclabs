import Link from "next/link";

export default function Header() {
  return (
    <header className="ul-header">
      <div className="ul-header-inner">
        <Link href="/" className="ul-wordmark">
          <span className="ul-wordmark-mark">upsc</span>.labs
        </Link>
        <nav className="ul-nav" aria-label="Primary">
          <Link href="/#featured">Tools</Link>
          <Link href="/#syllabus">Syllabus</Link>
          <Link href="/#newsletter">Newsletter</Link>
        </nav>
      </div>
    </header>
  );
}
