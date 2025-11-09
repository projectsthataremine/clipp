import { useState, useEffect } from "react";
import { Flex, Tooltip, Button } from "@radix-ui/themes";
import AccountMenu from "./AccountMenu";

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClipboardFooter = ({ onShowAccount, hideShowDevices }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [version, setVersion] = useState("0.0.0");
  const [licenses, setLicenses] = useState([]);
  const [trialExpiration, setTrialExpiration] = useState(null);

  useEffect(() => {
    // Get app version
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((appVersion) => {
        setVersion(appVersion);
      });
    }

    // Check if update is available
    if (window.electronAPI?.getUpdateAvailable) {
      window.electronAPI.getUpdateAvailable().then((isAvailable) => {
        setUpdateAvailable(isAvailable);
      });

      window.electronAPI.onUpdateAvailable?.(() => {
        setUpdateAvailable(true);
      });
    }

    // Get current user
    if (window.electronAPI?.getAuthStatus) {
      window.electronAPI.getAuthStatus().then(({ user }) => {
        setUser(user);
        // Fetch licenses when user is available
        if (user && window.electronAPI?.getLicenses) {
          fetchLicenses(user.id);
        }
      });

      window.electronAPI.onAuthStateChanged?.(() => {
        window.electronAPI.getAuthStatus().then(({ user }) => {
          setUser(user);
          // Fetch licenses when user is available
          if (user && window.electronAPI?.getLicenses) {
            fetchLicenses(user.id);
          } else {
            setLicenses([]);
            setTrialExpiration(null);
          }
        });
      });
    }
  }, []);

  const fetchLicenses = async (userId) => {
    try {
      const userLicenses = await window.electronAPI.getLicenses(userId);
      setLicenses(userLicenses || []);

      // Get trial status (based on account creation date, not database license)
      if (window.electronAPI?.getTrialStatus) {
        const trialStatus = await window.electronAPI.getTrialStatus(userId);

        // Check if user has any active licenses (status = 'active' and not expired)
        const now = new Date();
        const hasActiveLicense = userLicenses?.some(license => {
          if (license.status !== 'active') return false;
          if (license.expires_at) {
            const expiresAt = new Date(license.expires_at);
            return now < expiresAt;
          }
          return true;
        });

        // Only show trial if user is in trial AND has no active licenses
        if (trialStatus.inTrial && trialStatus.trialEndDate && !hasActiveLicense) {
          const expirationDate = new Date(trialStatus.trialEndDate);
          setTrialExpiration(expirationDate);
        } else {
          setTrialExpiration(null);
        }
      }
    } catch (error) {
      console.error('[Footer] Failed to fetch licenses:', error);
      setLicenses([]);
      setTrialExpiration(null);
    }
  };

  const formatTrialDate = (date) => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const handleAvatarClick = () => {
    setShowMenu(!showMenu);
  };

  const handleManageAccount = () => {
    setShowMenu(false);
    onShowAccount();
  };

  const handleLogOut = async () => {
    setShowMenu(false);
    if (window.electronAPI?.signOut) {
      await window.electronAPI.signOut();
    }
  };

  const handleVersionClick = () => {
    if (updateAvailable) {
      window.electronAPI.openExternal("https://tryclipp.com/download");
    }
  };

  return (
    <Flex
      justify="between"
      align="center"
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        position: "relative",
        padding: "8px 10px",
      }}
    >
      {/* Version or Trial Info - Trial takes priority */}
      {trialExpiration ? (
        trialExpiration < new Date() ? (
          <Tooltip content="Your free trial has ended. Subscribe to continue using Clipp.">
            <div
              style={{
                fontSize: "12px",
                color: "#ef4444",
                fontWeight: 600,
              }}
            >
              Trial Expired
            </div>
          </Tooltip>
        ) : (
          <Tooltip content={`Your free trial expires on ${formatTrialDate(trialExpiration)}`}>
            <div
              style={{
                fontSize: "12px",
                color: "#3b82f6",
                fontWeight: 500,
              }}
            >
              Free trial expires {formatTrialDate(trialExpiration)}
            </div>
          </Tooltip>
        )
      ) : updateAvailable ? (
        <Button
          size="1"
          color="red"
          variant="soft"
          onClick={handleVersionClick}
          style={{ cursor: "pointer", fontSize: "12px" }}
        >
          Update Available
        </Button>
      ) : (
        <Tooltip content="Up to date">
          <div
            style={{
              fontSize: "11px",
              color: "var(--gray-11)",
              opacity: 0.5,
              fontFamily: "monospace",
            }}
          >
            Clipp v{version}
          </div>
        </Tooltip>
      )}

      {/* Avatar/User Icon */}
      <div style={{ position: "relative" }}>
        <div
          onClick={handleAvatarClick}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "rgba(59, 130, 246, 0.1)",
            border: "2px solid #3b82f6",
            color: "#3b82f6",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.color = "#3b82f6";
          }}
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <UserIcon />
          )}
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <AccountMenu
            onManageAccount={handleManageAccount}
            onLogOut={handleLogOut}
            onClose={() => setShowMenu(false)}
          />
        )}
      </div>
    </Flex>
  );
};

export default ClipboardFooter;
