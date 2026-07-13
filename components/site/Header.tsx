import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="ul-header">
      <div className="ul-header-inner">
        <Link href="/" className="ul-wordmark">
          <span className="ul-wordmark-mark">upsc.labs</span>
          <Logo size={16} className="ul-wordmark-logo" />
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
