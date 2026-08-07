"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="ul-header">
      <div className="ul-header-inner">
        <Link href="/" className="ul-wordmark">
          <span className="ul-wordmark-mark">upsc.labs</span>
          <Logo size={22} className="ul-wordmark-logo" />
        </Link>
        <nav className="ul-nav" aria-label="Primary">
          <Link
            href="/"
            className={isHome ? "ul-nav-pill-on" : ""}
            aria-current={isHome ? "page" : undefined}
          >
            Home
          </Link>
          <Link href="/#featured">Tools</Link>
          <Link href="/#syllabus">Syllabus</Link>
          <Link href="/#newsletter">Newsletter</Link>
        </nav>
        <Link href="/#featured" className="ul-nav-cta">
          Explore Tools <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
