"use client";

import "./privacy.scss";

export default function PrivacyPage() {
  return (
    <section className="legal-page">
      <h1>Privacy Policy</h1>

      <div className="legal-section">
        <h2>Last updated: June 1, 2025</h2>
        <p>
          This policy outlines what Clipp collects, how it’s used, and how we
          protect your privacy.
        </p>
      </div>

      <div className="legal-section">
        <h2>Clipboard Data</h2>
        <p>
          Clipp stores all clipboard content locally on your device. We persist
          clipboard history to disk so that it’s available even after you quit
          or restart the app.
        </p>
        <p>
          Your clipboard history is never uploaded, synced, or transmitted — it
          stays on your machine.
        </p>
      </div>

      <div className="legal-section">
        <h2>User Accounts</h2>
        <p>
          If you create an account, we store your email address and associate it
          with your devices for licensing and usage tracking. We do not collect
          names, passwords, or profile data.
        </p>
      </div>

      <div className="legal-section">
        <h2>Device Identifiers</h2>
        <p>
          Clipp assigns each installation a unique device ID. This ID is used to
          track how often the app is opened and to manage licensing limits. It
          is stored securely and is never shared or used for advertising.
        </p>
      </div>

      <div className="legal-section">
        <h2>Analytics</h2>
        <p>
          We use simple website analytics (e.g., Vercel Analytics) to track
          visits and download page views. Within the desktop app, we log basic
          anonymous usage data — such as device ID and how often the app is
          launched. No clipboard data or personally identifying behavior is
          tracked.
        </p>
      </div>

      <div className="legal-section">
        <h2>No Trackers or Ads</h2>
        <p>
          Clipp includes no ads, no third-party trackers, and no marketing
          pixels.
        </p>
      </div>

      <div className="legal-section">
        <h2>Your Data, Your Control</h2>
        <p>
          Clipboard history is fully under your control. You can delete entries
          at any time within the app. When you uninstall Clipp, all data is
          removed from your device.
        </p>
        <p>
          Quitting the app will not delete your history — it remains saved
          locally unless you choose to clear it.
        </p>
      </div>

      <div className="legal-section">
        <h2>Policy Updates</h2>
        <p>
          We may update this policy as the app evolves. All changes will be
          reflected here at <strong>clipp.app/privacy</strong>.
        </p>
      </div>

      <div className="legal-section">
        <h2>Contact</h2>
        <p>
          If you have questions or concerns, please visit our{" "}
          <a href="/help">Help page</a>.
        </p>
      </div>
    </section>
  );
}
