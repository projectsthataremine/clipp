import { useState, useEffect } from "react";
import { Button, Flex, Text, ScrollArea, Badge, Code } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Copy, Plus, RefreshCw, Key } from "lucide-react";
import ClipboardFooter from "./ClipboardFooter";

const ProfileAvatar = ({ user }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const avatarUrl = user.user_metadata?.avatar_url;

  // Fallback avatar
  const fallbackAvatar = (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "20px",
      }}
    >
      {user.email?.[0]?.toUpperCase()}
    </div>
  );

  if (!avatarUrl || imageError) {
    return fallbackAvatar;
  }

  return (
    <>
      <img
        src={avatarUrl}
        alt="Profile"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          objectFit: "cover",
          display: imageLoaded ? "block" : "none",
        }}
      />
      {!imageLoaded && fallbackAvatar}
    </>
  );
};

const AccountSection = ({ onBack, trialExpired = false, hasAccess = true }) => {
  const [user, setUser] = useState(null);
  const [allLicenses, setAllLicenses] = useState([]); // All licenses (including expired/canceled)
  const [loading, setLoading] = useState(true);
  const [currentMachineId, setCurrentMachineId] = useState(null);
  const [activatingLicense, setActivatingLicense] = useState(null);
  const [revokingLicense, setRevokingLicense] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [hoveredLicense, setHoveredLicense] = useState(null);
  const [toast, setToast] = useState(null);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [pricing, setPricing] = useState({ monthly_price: 2, annual_price: 18 });
  const [trialStatus, setTrialStatus] = useState(null);

  // Toast notification function
  const showToast = (message) => {
    const id = Date.now();
    setToast({ message, id, exiting: false });

    // After 2.7 seconds, start the exit animation
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, exiting: true } : null);
    }, 2700);

    // After 3 seconds total (including exit animation), remove the toast
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadAccountData();
    // Fetch pricing config
    if (window.electronAPI?.getPricingConfig) {
      window.electronAPI.getPricingConfig().then((result) => {
        if (result.success && result.pricing) {
          setPricing(result.pricing);
        }
      });
    }
  }, []);

  const loadAccountData = async (showLoadingScreen = true) => {
    try {
      if (showLoadingScreen) {
        setLoading(true);
      }

      // Get current machine ID
      if (window.electronAPI?.getMachineId) {
        const result = await window.electronAPI.getMachineId();
        setCurrentMachineId(result.machineId);
      }

      // Get user
      if (window.electronAPI?.getAuthStatus) {
        const { user } = await window.electronAPI.getAuthStatus();
        setUser(user);

        // Get licenses and trial status
        if (user) {
          if (window.electronAPI?.getLicenses) {
            const licensesData = await window.electronAPI.getLicenses(user.id);
            setAllLicenses(licensesData || []);
          }

          // Get trial status
          if (window.electronAPI?.getTrialStatus) {
            const status = await window.electronAPI.getTrialStatus(user.id);
            setTrialStatus(status);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load account data:", error);
    } finally {
      if (showLoadingScreen) {
        setLoading(false);
      }
    }
  };

  const handleRefreshLicenses = async () => {
    setIsRefreshing(true);
    await loadAccountData(false);
    setIsRefreshing(false);
    showToast("Licenses refreshed");
  };

  const handleAddLicense = () => {
    setShowBillingDialog(true);
  };

  const handleSelectBillingInterval = async (billingInterval) => {
    setShowBillingDialog(false);
    try {
      const result = await window.electronAPI.createCheckoutSession(billingInterval);
      if (result.success) {
        showToast("Opening checkout in browser...");
        // Hide the settings window when checkout opens
        setTimeout(() => {
          window.electronAPI.hideWindowAnimated();
        }, 500);
      } else {
        showToast(`Failed to start checkout: ${result.error}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("Failed to start checkout");
    }
  };

  const handleCopyLicenseKey = async (key) => {
    try {
      await window.electronAPI.copyToClipboard(key);
      showToast("License key copied");
    } catch (error) {
      console.error("Copy error:", error);
      showToast("Failed to copy license key");
    }
  };

  const handleActivateLicense = async (licenseKey) => {
    try {
      setActivatingLicense(licenseKey);
      await window.electronAPI.activateLicense(licenseKey);
      await loadAccountData();
      showToast("License activated successfully!");
    } catch (error) {
      console.error("License activation failed:", error);
      showToast(`Failed to activate license: ${error.message}`);
    } finally {
      setActivatingLicense(null);
    }
  };

  const handleRevokeLicense = async (licenseKey) => {
    if (
      !confirm(
        "Are you sure you want to revoke this license from this machine? You can activate it on another machine afterwards."
      )
    ) {
      return;
    }

    try {
      setRevokingLicense(licenseKey);
      await window.electronAPI.revokeLicense(licenseKey);
      await loadAccountData();
      showToast("License revoked successfully!");
    } catch (error) {
      console.error("License revocation failed:", error);
      showToast(`Failed to revoke license: ${error.message}`);
    } finally {
      setRevokingLicense(null);
    }
  };

  const handleRenameMachine = async (licenseId, newName) => {
    try {
      await window.electronAPI.renameMachine(licenseId, newName);
      setAllLicenses(
        allLicenses.map((license) =>
          license.id === licenseId
            ? {
                ...license,
                machine_name: newName,
                metadata: { ...license.metadata, machine_name: newName }
              }
            : license
        )
      );
      showToast("Machine renamed successfully");
    } catch (error) {
      console.error("Machine rename failed:", error);
      showToast("Failed to rename machine");
    }
  };

  const handleManageSubscription = async (stripeCustomerId) => {
    try {
      console.log('[Account] Opening customer portal for:', stripeCustomerId);
      const result = await window.electronAPI.openCustomerPortal(stripeCustomerId);
      console.log('[Account] Customer portal result:', result);
      if (result.success) {
        showToast("Opening customer portal...");
        // Hide the settings window when portal opens
        setTimeout(() => {
          window.electronAPI.hideWindowAnimated();
        }, 300);
      } else {
        console.error('[Account] Customer portal failed:', result.error);
        showToast(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error("[Account] Customer portal error:", error);
      showToast(`Error: ${error.message || 'Failed to open customer portal'}`);
    }
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100vh", padding: "20px" }}>
        <Text>Loading...</Text>
      </Flex>
    );
  }

  if (!user) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: "100vh", padding: "20px" }}>
        <Text>Not signed in</Text>
      </Flex>
    );
  }

  // Filter licenses for display: Show active, pending, and valid canceled licenses
  const now = new Date();
  const displayLicenses = allLicenses.filter(license => {
    // Exclude revoked and expired licenses
    if (license.status === 'revoked' || license.status === 'expired') {
      return false;
    }

    // Keep active and pending licenses
    if (license.status === 'active' || license.status === 'pending') {
      return true;
    }

    // For canceled licenses, only show if not expired yet
    if (license.status === 'canceled' && license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      return expiresAt > now;
    }

    // Default: don't show
    return false;
  });

  // Check if user has EVER had any license (even if canceled/expired)
  const hasEverHadLicense = allLicenses.length > 0;

  // Check if user has any licenses to display
  const hasLicenses = displayLicenses.length > 0;

  // Check if user has any license activated on THIS machine
  const hasLicenseOnThisMachine = displayLicenses.some(license =>
    license.metadata?.machine_id === currentMachineId
  );

  // If showing billing dialog, render full-page overlay
  if (showBillingDialog) {
    return (
      <Flex direction="column" style={{ height: "100vh", width: "400px" }}>
        {/* Header */}
        <Flex align="center" gap="3" p="3">
          <Button variant="ghost" onClick={() => setShowBillingDialog(false)} style={{ cursor: "pointer" }}>
            <ArrowLeftIcon width="16" height="16" />
          </Button>
          <Text size="4" weight="bold">
            Choose Your Plan
          </Text>
        </Flex>

        {/* Content */}
        <Flex direction="column" style={{ flex: 1, padding: "20px" }}>
          <Text size="2" style={{ opacity: 0.7, marginBottom: "20px", display: "block" }}>
            Select a billing interval for your subscription
          </Text>

          <Flex direction="column" gap="3">
            {/* Monthly Option */}
            <button
              onClick={() => handleSelectBillingInterval("monthly")}
              style={{
                padding: "16px",
                background: "var(--gray-a2)",
                border: "2px solid var(--gray-a6)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--blue-9)";
                e.currentTarget.style.background = "var(--blue-a2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--gray-a6)";
                e.currentTarget.style.background = "var(--gray-a2)";
              }}
            >
              <Flex justify="between" align="center">
                <div>
                  <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                    Monthly
                  </Text>
                  <Text size="1" style={{ opacity: 0.7 }}>
                    ${pricing.monthly_price} per month • Cancel anytime
                  </Text>
                </div>
                <Text size="4" weight="bold" style={{ color: "var(--blue-11)" }}>
                  ${pricing.monthly_price}/mo
                </Text>
              </Flex>
            </button>

            {/* Annual Option */}
            <button
              onClick={() => handleSelectBillingInterval("annual")}
              style={{
                padding: "16px",
                background: "var(--gray-a2)",
                border: "2px solid var(--gray-a6)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--blue-9)";
                e.currentTarget.style.background = "var(--blue-a2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--gray-a6)";
                e.currentTarget.style.background = "var(--gray-a2)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "12px",
                  background: "#10b981",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                Save ${pricing.monthly_price * 12 - pricing.annual_price}/year
              </div>
              <Flex justify="between" align="center">
                <div>
                  <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                    Annual
                  </Text>
                  <Text size="1" style={{ opacity: 0.7 }}>
                    ${pricing.annual_price} per year • Just ${(pricing.annual_price / 12).toFixed(2)}/month
                  </Text>
                </div>
                <Text size="4" weight="bold" style={{ color: "var(--blue-11)" }}>
                  ${pricing.annual_price}/yr
                </Text>
              </Flex>
            </button>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  // Debug: Log back button state
  console.log('[AccountSection] Back button state:', {
    trialExpired,
    hasAccess,
    hasLicenses,
    hasLicenseOnThisMachine,
    currentMachineId,
    displayLicensesCount: displayLicenses.length,
    allLicensesCount: allLicenses.length,
  });

  return (
    <Flex direction="column" style={{ height: "100vh", width: "400px" }}>
      {/* Header */}
      <Flex align="center" gap="3" p="3">
        {hasAccess && (
          <Button variant="ghost" onClick={onBack} style={{ cursor: "pointer" }}>
            <ArrowLeftIcon width="16" height="16" />
          </Button>
        )}
        <Text size="4" weight="bold">
          Account
        </Text>
      </Flex>

      {/* Content */}
      <ScrollArea style={{ flex: 1 }}>
        <Flex direction="column" gap="4" p="4">
          {/* User Profile */}
          <Flex align="center" gap="3" p="3" style={{ background: "var(--gray-a2)", borderRadius: "8px" }}>
            <ProfileAvatar user={user} />
            <Flex direction="column">
              <Text size="3" weight="bold">
                {user.email}
              </Text>
              <Text size="1" style={{ opacity: 0.7 }}>
                Created {new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </Flex>
          </Flex>

          {/* Trial Expired Banner - Only show if trial expired AND user has never purchased */}
          {trialExpired && !hasEverHadLicense && (
            <Flex
              p="3"
              style={{
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
                border: "2px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
              }}
            >
              <Text size="3" weight="bold" style={{ color: "var(--red-11)" }}>
                Your trial has ended
              </Text>
            </Flex>
          )}

          {/* Licenses Section Header */}
          <Flex justify="between" align="center">
            <Text size="2" weight="bold" style={{ opacity: 0.7 }}>
              LICENSES
            </Text>
            <Flex gap="2">
              <Button
                size="1"
                variant="soft"
                style={{ cursor: "pointer", padding: "0 8px" }}
                onClick={handleAddLicense}
              >
                <Plus size={16} />
              </Button>
              <Button
                size="1"
                variant="soft"
                color="gray"
                style={{ cursor: "pointer", padding: "0 8px" }}
                onClick={handleRefreshLicenses}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </Button>
            </Flex>
          </Flex>

          {/* Licenses List */}
          {hasLicenses ? (
            <Flex direction="column" gap="3">
              {displayLicenses.map((license) => (
                <LicenseCard
                  key={license.id}
                  license={license}
                  currentMachineId={currentMachineId}
                  onCopyKey={handleCopyLicenseKey}
                  onActivate={handleActivateLicense}
                  onRevoke={handleRevokeLicense}
                  onRenameMachine={handleRenameMachine}
                  onManageSubscription={handleManageSubscription}
                  activating={activatingLicense === license.key}
                  revoking={revokingLicense === license.key}
                  editing={editingLicense === license.id}
                  setEditing={setEditingLicense}
                  editedName={editedName}
                  setEditedName={setEditedName}
                  hovered={hoveredLicense === license.id}
                  setHovered={setHoveredLicense}
                />
              ))}
            </Flex>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              p="6"
              style={{ background: "var(--gray-a2)", borderRadius: "8px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Key size={24} style={{ opacity: 0.5 }} />
              </div>
              <Text size="2" style={{ opacity: 0.7, textAlign: "center" }}>
                No licenses yet. Add a license to activate Clipp on this device.
              </Text>
              <Button size="2" onClick={handleAddLicense}>
                <Plus size={14} />
                Purchase License
              </Button>
            </Flex>
          )}
        </Flex>
      </ScrollArea>

      <ClipboardFooter onShowAccount={onBack} hideShowDevices={true} />

      {/* Toast notification */}
      {toast && (
        <>
          <style>
            {`
              @keyframes slideInFromRight {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }

              @keyframes slideOutToLeft {
                from {
                  transform: translateX(0);
                  opacity: 1;
                }
                to {
                  transform: translateX(-100%);
                  opacity: 0;
                }
              }

              .toast-enter {
                animation: slideInFromRight 0.3s ease-out forwards;
              }

              .toast-exit {
                animation: slideOutToLeft 0.3s ease-in forwards;
              }
            `}
          </style>
          <div
            key={toast.id}
            className={toast.exiting ? "toast-exit" : "toast-enter"}
            style={{
              position: "fixed",
              bottom: "70px",
              left: "20px",
              right: "20px",
              padding: "12px 16px",
              background: "var(--blue-3)",
              color: "var(--blue-11)",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "var(--radius-3)",
              border: "1px solid var(--blue-6)",
              boxShadow: "var(--shadow-4)",
              zIndex: 9999,
              textAlign: "center",
            }}
          >
            {toast.message}
          </div>
        </>
      )}
    </Flex>
  );
};

const LicenseCard = ({
  license,
  currentMachineId,
  onCopyKey,
  onActivate,
  onRevoke,
  onRenameMachine,
  onManageSubscription,
  activating,
  revoking,
  editing,
  setEditing,
  editedName,
  setEditedName,
  hovered,
  setHovered,
}) => {
  const machineId = license.metadata?.machine_id || license.machine_id;
  const machineName = license.metadata?.machine_name || license.machine_name;
  const isActiveOnThisMachine = currentMachineId && machineId && machineId === currentMachineId;

  const handleSave = () => {
    if (editedName.trim() && editedName !== machineName) {
      onRenameMachine(license.id, editedName.trim());
    }
    setEditing(null);
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "var(--gray-a2)",
        border: "1px solid var(--gray-a6)",
        borderRadius: "8px",
      }}
    >
      {/* License Key Row */}
      <Flex align="center" gap="2" mb="3">
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--blue-a3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Key size={16} style={{ color: "var(--blue-11)" }} />
        </div>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Text size="1" style={{ opacity: 0.7, marginBottom: "4px" }}>
            License Key
          </Text>
          <Text size="1" style={{ fontFamily: "monospace", fontSize: "11px", opacity: 0.9 }}>
            {license.key.slice(0, 20)}...
          </Text>
        </Flex>
        <button
          onClick={() => onCopyKey(license.key)}
          title="Copy license key"
          style={{
            padding: "6px",
            background: "var(--gray-a3)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--gray-11)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-a5)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gray-a3)")}
        >
          <Copy size={14} />
        </button>
      </Flex>

      {/* Status Badge */}
      <Flex align="center" gap="2" mb="3">
        <Badge
          color={
            license.status === "active" ? "green" :
            license.status === "canceled" ? "red" :
            "yellow"
          }
          size="1"
        >
          {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
        </Badge>
        {license.status === "canceled" && license.expires_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Expires {new Date(license.expires_at).toLocaleDateString()}
          </Text>
        )}
        {license.status === "active" && license.renews_at && (
          <Text size="1" style={{ opacity: 0.7 }}>
            Renews {new Date(license.renews_at).toLocaleDateString()}
          </Text>
        )}
      </Flex>

      {/* Machine Info */}
      {machineId && (
        <div
          onMouseEnter={() => {
            console.log("Mouse enter, setting hovered to:", license.id);
            setHovered(license.id);
          }}
          onMouseLeave={() => {
            console.log("Mouse leave, clearing hovered");
            setHovered(null);
          }}
          style={{ marginBottom: "12px" }}
        >
          <Text size="1" style={{ opacity: 0.7, marginBottom: "4px", display: "block" }}>
            Machine Name
          </Text>
          <Flex
            justify="between"
            align="center"
            gap="2"
            style={{
              background: editing ? "var(--blue-a3)" : "transparent",
              borderRadius: "6px",
              minHeight: "32px",
              padding: "4px 8px"
            }}
          >
            {editing ? (
              <>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    else if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "0",
                    background: "transparent",
                    border: "none",
                    color: "var(--gray-12)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <Button
                  onClick={handleSave}
                  size="1"
                  variant="ghost"
                  color="green"
                  style={{ cursor: "pointer", fontSize: "11px", padding: "4px 8px" }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Text size="2" weight="medium">
                  {machineName || "Unknown"}
                </Text>
                {hovered && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(license.id);
                      setEditedName(machineName || "");
                    }}
                    size="1"
                    variant="ghost"
                    color="blue"
                    style={{ cursor: "pointer", fontSize: "11px", padding: "4px 8px" }}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </Flex>
        </div>
      )}

      {/* Action Buttons */}
      <Flex gap="2" wrap="wrap">
        {/* Show "Use on this machine" for licenses without a machine */}
        {!machineId && (
          <Button
            onClick={() => onActivate(license.key)}
            disabled={activating}
            size="2"
            variant="soft"
            style={{ cursor: activating ? "not-allowed" : "pointer", flex: 1 }}
          >
            {activating ? "Activating..." : "Use on this machine"}
          </Button>
        )}

        {/* Show "Revoke" only for licenses active on this machine */}
        {isActiveOnThisMachine && (
          <Button
            onClick={() => onRevoke(license.key)}
            disabled={revoking}
            color="red"
            size="2"
            variant="soft"
            style={{ cursor: revoking ? "not-allowed" : "pointer", flex: 1 }}
          >
            {revoking ? "Revoking..." : "Revoke"}
          </Button>
        )}

        {/* Show "Reactivate" for canceled licenses, "Manage" for active */}
        {license.stripe_customer_id && (
          <Button
            onClick={() => onManageSubscription(license.stripe_customer_id)}
            size="2"
            variant="soft"
            color={license.status === "canceled" ? "green" : "gray"}
            style={{ cursor: "pointer", flex: 1 }}
          >
            {license.status === "canceled" ? "Reactivate" : "Manage"}
          </Button>
        )}
      </Flex>
    </div>
  );
};

export default AccountSection;
