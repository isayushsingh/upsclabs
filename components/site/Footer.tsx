import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ul-footer">
      <div className="ul-footer-panel">
        <div className="ul-footer-top">
          <div className="ul-footer-brand">
            <Link href="/" className="ul-wordmark">
              <span className="ul-wordmark-mark">upsc.labs</span>
              <Logo size={20} className="ul-wordmark-logo" />
            </Link>
            <p className="ul-footer-blurb">
              Interactive tools for every General Studies paper — built to
              help you actually recall the syllabus, not just re-read it.
            </p>
          </div>

          <nav className="ul-footer-col" aria-label="Pages">
            <span className="ul-footer-col-h">Pages</span>
            <Link href="/">Home</Link>
            <Link href="/#featured">Tools</Link>
            <Link href="/#syllabus">Syllabus</Link>
            <Link href="/#newsletter">Newsletter</Link>
          </nav>

          <nav className="ul-footer-col" aria-label="Papers">
            <span className="ul-footer-col-h">Papers</span>
            <Link href="/gs1">GS1</Link>
            <span className="ul-footer-col-off" aria-disabled="true">GS2</span>
            <Link href="/gs3">GS3</Link>
            <span className="ul-footer-col-off" aria-disabled="true">GS4</span>
          </nav>
        </div>

        <div className="ul-footer-rule" />

        <div className="ul-footer-bottom">
          <span>Built for UPSC aspirants.</span>
          <span>© {year} upsc.labs. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
