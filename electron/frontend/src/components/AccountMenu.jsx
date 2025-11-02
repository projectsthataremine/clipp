import { useEffect, useRef } from "react";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

const AccountMenu = ({ onShowDevices, onManageAccount, onLogOut, onClose, hideShowDevices }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const menuItemStyle = {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--gray-12)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "background 0.2s",
  };

  const handleItemHover = (e, isEnter) => {
    e.currentTarget.style.background = isEnter
      ? "rgba(255, 255, 255, 0.1)"
      : "transparent";
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: "var(--color-panel)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        minWidth: "180px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {!hideShowDevices && (
        <div
          onClick={onShowDevices}
          style={menuItemStyle}
          onMouseEnter={(e) => handleItemHover(e, true)}
          onMouseLeave={(e) => handleItemHover(e, false)}
        >
          Show Devices
        </div>
      )}
      <div
        onClick={onManageAccount}
        style={{
          ...menuItemStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onMouseEnter={(e) => handleItemHover(e, true)}
        onMouseLeave={(e) => handleItemHover(e, false)}
      >
        <span>Manage Account</span>
        <ExternalLinkIcon width="14" height="14" style={{ opacity: 0.7 }} />
      </div>
      <div
        onClick={onLogOut}
        style={{
          ...menuItemStyle,
          borderBottom: "none",
          color: "#ef4444",
        }}
        onMouseEnter={(e) => handleItemHover(e, true)}
        onMouseLeave={(e) => handleItemHover(e, false)}
      >
        Log Out
      </div>
    </div>
  );
};

export default AccountMenu;
