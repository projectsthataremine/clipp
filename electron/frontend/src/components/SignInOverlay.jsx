import { useState } from "react";
import "./SignInOverlay.css";

export function SignInOverlay() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await window.electronAPI.startOAuth("google");
      // Sign in successful - the auth handler will notify the app
    } catch (err) {
      console.error("Google sign in failed:", err);
      setError("Sign in failed. Please try again.");
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSigningIn(true);
      setError(null);

      if (isSignUp) {
        await window.electronAPI.signUpWithEmail(email, password);
      } else {
        await window.electronAPI.signInWithEmail(email, password);
      }
      // Auth successful - handler will notify the app
    } catch (err) {
      console.error("Email auth failed:", err);
      setError(err.message || `${isSignUp ? "Sign up" : "Sign in"} failed. Please try again.`);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <div className="auth-content">
          <h1 className="auth-title">Welcome to Clipp</h1>
          <p className="auth-description">
            {isSignUp ? "Create your account to get started" : "Sign in to continue"}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="auth-button google-button"
          >
            <svg
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              style={{ marginRight: "12px" }}
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <div className="auth-divider-line"></div>
            <div className="auth-divider-text">OR</div>
            <div className="auth-divider-line"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSigningIn}
              className="auth-input"
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSigningIn}
              className="auth-input"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSigningIn}
                className="auth-input"
                autoComplete="new-password"
              />
            )}
            <button
              type="submit"
              disabled={isSigningIn}
              className="auth-button email-button"
            >
              {isSigningIn
                ? (isSignUp ? "Creating account..." : "Signing in...")
                : (isSignUp ? "Create account" : "Sign in with email")}
            </button>
          </form>

          <p className="auth-toggle">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setConfirmPassword("");
              }}
              disabled={isSigningIn}
              className="auth-toggle-button"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
