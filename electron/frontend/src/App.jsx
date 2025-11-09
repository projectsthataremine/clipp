import { useEffect, useState } from "react";
import { Theme } from "@radix-ui/themes";
import { Tooltip } from "radix-ui";
import "@radix-ui/themes/styles.css";

import ClipboardItems from "./components/ClipboardItems";
import AccountSection from "./components/AccountSection";
import { SignInOverlay } from "./components/SignInOverlay";
import { TrialExpiredOverlay } from "./components/TrialExpiredOverlay";
import { UpdateRequiredScreen } from "./components/UpdateRequiredScreen";
import { useHasAccess } from "./hooks/useHasAccess";

import "./App.css";

function App() {
  const { hasAccess, trialExpired, hasValidLicense } = useHasAccess();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [activeView, setActiveView] = useState("clipboard"); // "clipboard" or "account"
  const [theme, setTheme] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    // Log environment for debugging
    if (window?.electronAPI?.getEnvironment) {
      const env = window.electronAPI.getEnvironment();
      console.log('🚀 [App] CLIPP_ENV:', env);
    }

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

    // Listen for update required (breaking changes)
    if (window?.electronAPI?.onUpdateRequired) {
      window.electronAPI.onUpdateRequired(({ required }) => {
        console.log("Update required:", required);
        setUpdateRequired(required);
      });
    }

    // Pull once on load
    window.electronAPI.getUpdateRequired().then((required) => {
      console.log("Checking if update required on load:", required);
      if (required) {
        setUpdateRequired(true);
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

    // Trial and license status are now handled by useHasAccess hook

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

  // Show update required screen first (highest priority - blocks everything)
  if (updateRequired) {
    return (
      <Theme appearance={theme} hasBackground={false}>
        <UpdateRequiredScreen />
      </Theme>
    );
  }

  // Show sign-in overlay if user needs to authenticate
  if (requiresAuth) {
    return (
      <Theme appearance={theme} hasBackground={false}>
        <SignInOverlay />
      </Theme>
    );
  }

  // Normal app flow
  return (
    <Theme appearance={theme} hasBackground={false}>
      <Tooltip.Provider skipDelayDuration={10}>
        <div style={{ width: "400px", height: "100vh", background: "var(--color-background)" }}>
          {activeView === "clipboard" && hasAccess && (
            <ClipboardItems onShowAccount={() => setActiveView("account")} />
          )}
          {(activeView === "account" || !hasAccess) && (
            <AccountSection
              onBack={() => setActiveView("clipboard")}
              trialExpired={trialExpired}
              hasAccess={hasAccess}
            />
          )}
        </div>
      </Tooltip.Provider>
    </Theme>
  );
}

export default App;
