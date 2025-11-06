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
      });

      window.electronAPI.onAuthStateChanged?.(() => {
        window.electronAPI.getAuthStatus().then(({ user }) => {
          setUser(user);
        });
      });
    }
  }, []);

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
      {/* Version */}
      {updateAvailable ? (
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
              fontSize: "13px",
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
            background: "rgba(255, 255, 255, 0.1)",
            border: "2px solid white",
            color: "var(--gray-11)",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "white";
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
