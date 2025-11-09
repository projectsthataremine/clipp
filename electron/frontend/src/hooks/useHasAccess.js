import { useState, useEffect } from 'react';

/**
 * Centralized hook to determine if user has access to the app
 *
 * This hook connects to the backend's global access status which is
 * calculated based on:
 * 1. Trial is NOT expired, OR
 * 2. Trial IS expired but they have a valid license on THIS machine
 *
 * @returns {Object} { hasAccess: boolean, trialExpired: boolean }
 */
export function useHasAccess() {
  const [hasAccess, setHasAccess] = useState(true); // Default to true until we check
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    // Get initial access status from backend
    if (window?.electronAPI?.getAccessStatus) {
      window.electronAPI.getAccessStatus().then((status) => {
        console.log('[useHasAccess] Initial access status:', status);
        setHasAccess(status.hasValidAccess);
        setTrialExpired(status.trialExpired);
      });
    }

    // Listen for access status changes (from license activation/revocation)
    if (window?.electronAPI?.onAccessStatusChanged) {
      window.electronAPI.onAccessStatusChanged((status) => {
        console.log('[useHasAccess] Access status changed:', status);
        setHasAccess(status.hasValidAccess);
        setTrialExpired(status.trialExpired);
      });
    }
  }, []);

  console.log('[useHasAccess] Current status:', {
    hasAccess,
    trialExpired
  });

  return {
    hasAccess,
    trialExpired,
    hasValidLicense: hasAccess && trialExpired // Backwards compat: if has access but trial expired, must have license
  };
}
