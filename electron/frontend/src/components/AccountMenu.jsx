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
    borderBottom: "1px solid var(--gray-a6)",
    transition: "background 0.2s",
  };

  const handleItemHover = (e, isEnter) => {
    e.currentTarget.style.background = isEnter
      ? "var(--gray-a3)"
      : "transparent";
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: "var(--color-panel-solid)",
        border: "1px solid var(--gray-a6)",
        borderRadius: "8px",
        minWidth: "180px",
        boxShadow: "var(--shadow-5)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <div
        onClick={onManageAccount}
        style={menuItemStyle}
        onMouseEnter={(e) => handleItemHover(e, true)}
        onMouseLeave={(e) => handleItemHover(e, false)}
      >
        Manage Account
      </div>
      <div
        onClick={onLogOut}
        style={{
          ...menuItemStyle,
          borderBottom: "none",
          color: "var(--red-11)",
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
