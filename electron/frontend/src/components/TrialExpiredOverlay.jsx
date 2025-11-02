import "./TrialExpiredOverlay.css";

export function TrialExpiredOverlay() {
  const openAccountPage = () => {
    // Open the account page in the user's browser
    window.electronAPI.openExternal("https://clipp.app/account");
  };

  return (
    <div className="trial-overlay">
      <div className="trial-container">
        <div className="trial-content">
          <div className="trial-icon">⏰</div>
          <h1 className="trial-title">Your Trial Has Ended</h1>
          <p className="trial-description">
            Your 7-day free trial of Clipp has expired.
            <br />
            Subscribe to continue using all features.
          </p>

          <button onClick={openAccountPage} className="trial-button-primary">
            Subscribe Now
          </button>

          <button onClick={openAccountPage} className="trial-button-secondary">
            View Account Details
          </button>

          <p className="trial-footnote">
            $5/month • Cancel anytime • No commitments
          </p>
        </div>
      </div>
    </div>
  );
}
