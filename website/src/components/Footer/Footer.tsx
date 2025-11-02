"use client";

import Link from "next/link";

import "./Footer.scss";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <Image
          src="/logo-gray.png"
          alt="Clipp logo"
          width={32}
          height={32}
          className="footer-logo"
        />

        <div className="footer-section">
          <h4>Clipp</h4>
          <div className="footer-links">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/updates">Updates</Link>
            {/* <Link href="/pricing">Pricing</Link> */}
          </div>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <div className="footer-links">
            <Link href="/help">Help</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>

        <div className="footer-section">
          <h4>More</h4>
          <div className="footer-links">
            <Link href="/help">Contact</Link>
            <Link href="/help">Suggest a feature</Link>
          </div>
        </div>

        <div className="footer-section">
          <h4>Clipp on 🤘</h4>
        </div>
      </div>
    </footer>
  );
}
