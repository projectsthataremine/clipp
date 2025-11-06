import { useEffect, useState } from "react";
import { Theme } from "@radix-ui/themes";
import { Tooltip } from "radix-ui";
import "@radix-ui/themes/styles.css";

import ClipboardItems from "./components/ClipboardItems";
import AccountSection from "./components/AccountSection";
import { SignInOverlay } from "./components/SignInOverlay";
import { TrialExpiredOverlay } from "./components/TrialExpiredOverlay";

import "./App.css";

function App() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [activeView, setActiveView] = useState("clipboard"); // "clipboard" or "account"
  const [theme, setTheme] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    // Listen for push from backend
    if (window?.electronAPI?.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(() => {
        console.log("Update available event received");
        setHasUpdate(true);
      });
    }

    // Pull once on load in case we missed the event
    window.electronAPI.getUpdateAvailable().then((isAvailable) => {
      console.log("Checking for update availability on load:", isAvailable);
      if (isAvailable) {
        setHasUpdate(true);
      }
    });
  }, []);

  useEffect(() => {
    // Listen for auth requirement
    if (window?.electronAPI?.onAuthRequired) {
      window.electronAPI.onAuthRequired(({ requiresAuth }) => {
        console.log("Auth required:", requiresAuth);
        setRequiresAuth(requiresAuth);
      });
    }

    // Listen for trial expiration
    if (window?.electronAPI?.onTrialExpired) {
      window.electronAPI.onTrialExpired(({ trialExpired }) => {
        console.log("Trial expired:", trialExpired);
        setTrialExpired(trialExpired);
      });
    }

    // Check initial auth status
    if (window?.electronAPI?.getAuthStatus) {
      window.electronAPI.getAuthStatus().then(({ user }) => {
        console.log("Initial auth status:", user);
        setRequiresAuth(!user);
      });
    }

    // Listen for auth state changes (after successful sign in)
    if (window?.electronAPI?.onAuthStateChanged) {
      window.electronAPI.onAuthStateChanged(() => {
        console.log("Auth state changed");
        // Re-check auth status
        window.electronAPI.getAuthStatus().then(({ user }) => {
          setRequiresAuth(!user);
          // If user just signed in, also check trial status
          if (user) {
            setTrialExpired(false);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        window.electronAPI.hideWindowAnimated();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for OS theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Show sign-in overlay if user needs to authenticate
  if (requiresAuth) {
    return (
      <Theme appearance={theme} hasBackground={false}>
        <SignInOverlay />
      </Theme>
    );
  }

  // Show trial expired overlay if trial has ended
  if (trialExpired) {
    return (
      <Theme appearance={theme} hasBackground={false}>
        <TrialExpiredOverlay />
      </Theme>
    );
  }

  // Normal app flow
  return (
    <Theme appearance={theme} hasBackground={false}>
      <Tooltip.Provider skipDelayDuration={10}>
        <div style={{ width: "400px", height: "100vh" }}>
          {activeView === "clipboard" && (
            <ClipboardItems onShowAccount={() => setActiveView("account")} />
          )}
          {activeView === "account" && (
            <AccountSection onBack={() => setActiveView("clipboard")} />
          )}
        </div>
      </Tooltip.Provider>
    </Theme>
  );
}

export default App;
