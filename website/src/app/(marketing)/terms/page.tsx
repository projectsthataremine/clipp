"use client";

import "./terms.scss";

export default function TermsPage() {
  return (
    <section className="legal-page">
      <h1>Terms of Use</h1>

      <div className="legal-section">
        <h2>Last updated: June 1, 2025</h2>
        <p>
          These terms outline how you may use Clipp, what you can expect from
          the app, and what we expect from you in return.
        </p>
      </div>

      <div className="legal-section">
        <h2>Purpose</h2>
        <p>
          Clipp is a clipboard history tool designed to help you manage and
          access your previously copied content. That’s it. No extra features,
          no background syncing — just simple, local clipboard access.
        </p>
      </div>

      <div className="legal-section">
        <h2>License</h2>
        <p>
          Clipp is proprietary software. You may use it, but you may not reverse
          engineer, modify, redistribute, or republish it in any form. All
          rights are reserved.
        </p>
      </div>

      <div className="legal-section">
        <h2>Availability</h2>
        <p>
          We reserve the right to change, suspend, or discontinue Clipp at any
          time — with or without notice. This includes revoking access or
          disabling the app if needed.
        </p>
      </div>

      <div className="legal-section">
        <h2>Changes to These Terms</h2>
        <p>
          These terms may change as the app evolves. Updated terms will always
          be posted here at <strong>clipp.app/terms</strong>. By continuing to
          use the app, you agree to the most recent version of these terms.
        </p>
      </div>

      <div className="legal-section">
        <h2>Contact</h2>
        <p>
          If you have questions about Clipp or its terms, visit the{" "}
          <a href="/help">Help page</a>.
        </p>
      </div>
    </section>
  );
}
