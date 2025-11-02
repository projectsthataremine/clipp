import { useState, useEffect } from "react";
import { Button, Flex, Text, ScrollArea } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import ClipboardFooter from "./ClipboardFooter";

const AccountSection = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMachineId, setCurrentMachineId] = useState(null);
  const [activatingLicense, setActivatingLicense] = useState(null);
  const [revokingLicense, setRevokingLicense] = useState(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [toast, setToast] = useState(null);

  // Debug state for testing different scenarios
  const [debugMode, setDebugMode] = useState(null);
  const showDebugButtons = false; // Set to true to show debug buttons

  // Toast notification function
  const showToast = (message) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => setToast(null), 6000);
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);

      // Get current machine ID
      if (window.electronAPI?.getMachineId) {
        const result = await window.electronAPI.getMachineId();
        setCurrentMachineId(result.machineId);
      }

      // Get user
      if (window.electronAPI?.getAuthStatus) {
        const { user } = await window.electronAPI.getAuthStatus();
        setUser(user);

        // Get licenses
        if (user && window.electronAPI?.getLicenses) {
          const licensesData = await window.electronAPI.getLicenses(user.id);
          setLicenses(licensesData || []);
        }
      }
    } catch (error) {
      console.error("Failed to load account data:", error);
    } finally {
      setLoading(false);
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
      showToast("License revoked successfully! You can now use it on another machine.");
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
      // Update local state - update both metadata and direct field
      setLicenses(
        licenses.map((license) =>
          license.id === licenseId
            ? {
                ...license,
                machine_name: newName,
                metadata: license.metadata ? { ...license.metadata, machine_name: newName } : license.metadata
              }
            : license
        )
      );
      showToast("Machine renamed successfully");
    } catch (error) {
      console.error("Machine rename failed:", error);
      showToast("Failed to rename machine. Please try again.");
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

  // Debug mode mock data
  const getMockData = () => {
    const mockMachineId = "mock-machine-123";

    switch(debugMode) {
      case 'trial-no-devices':
        return {
          licenses: [],
          trialExpired: false,
          currentMachineId: mockMachineId
        };

      case 'trial-with-devices':
        return {
          licenses: [
            {
              id: 'trial-1',
              key: 'TRIAL-XXXX-XXXX-XXXX',
              status: 'pending',
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          trialExpired: false,
          currentMachineId: mockMachineId
        };

      case 'devices-no-trial':
        return {
          licenses: [
            {
              id: 'active-1',
              key: 'ACTIVE-XXXX-XXXX-XXXX',
              status: 'active',
              machine_id: mockMachineId,
              machine_name: 'My MacBook Pro',
              renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          trialExpired: false,
          currentMachineId: mockMachineId
        };

      case 'no-devices-expired':
        return {
          licenses: [],
          trialExpired: true,
          currentMachineId: mockMachineId
        };

      default:
        return {
          licenses,
          trialExpired,
          currentMachineId
        };
    }
  };

  const mockData = getMockData();
  const displayLicenses = mockData.licenses;
  const displayTrialExpired = mockData.trialExpired;
  const displayMachineId = mockData.currentMachineId;

  return (
    <Flex direction="column" style={{ height: "100vh", width: "400px" }}>
      {/* Header */}
      <Flex align="center" gap="3" p="3" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Button variant="ghost" onClick={onBack} style={{ cursor: "pointer" }}>
          <ArrowLeftIcon width="16" height="16" />
        </Button>
        <Text size="4" weight="bold">
          Account
        </Text>
      </Flex>

      {/* Content */}
      <ScrollArea style={{ flex: 1 }}>
        <Flex direction="column" gap="4" p="4">
          {/* User Profile */}
          <Flex align="center" gap="3" p="3" style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
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
                <Text size="5">{user.email?.[0]?.toUpperCase()}</Text>
              </div>
            )}
            <Flex direction="column">
              <Text size="3" weight="bold">
                {user.email}
              </Text>
              <Text size="1" style={{ opacity: 0.7 }}>
                Google Account
              </Text>
            </Flex>
          </Flex>

          {/* Trial/License Status Banner */}
          {(() => {
            const hasLicenses = displayLicenses.length > 0;
            const hasActiveOnThisMachine = displayLicenses.some(
              (l) => {
                const machineId = l.metadata?.machine_id || l.machine_id;
                return machineId && machineId === displayMachineId;
              }
            );
            const availableLicenseCount = displayLicenses.filter((l) => {
              const machineId = l.metadata?.machine_id || l.machine_id;
              return !machineId;
            }).length;

            // Find trial license (status: 'pending' with expires_at)
            const trialLicense = displayLicenses.find((l) => l.status === 'pending' && l.expires_at);
            const trialExpiresAt = trialLicense?.expires_at;
            const trialExpiresDate = trialExpiresAt ? new Date(trialExpiresAt).toLocaleDateString() : null;

            // If has license on this machine, show success state
            if (hasActiveOnThisMachine) {
              return (
                <Flex
                  direction="column"
                  gap="2"
                  p="3"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <Text size="2" weight="bold" style={{ color: "#10b981" }}>
                    ✓ License Active
                  </Text>
                  <Text size="1" style={{ opacity: 0.9 }}>
                    Clipp is activated on this device.
                  </Text>
                </Flex>
              );
            }

            // If has available licenses (not assigned to any machine)
            if (hasLicenses && availableLicenseCount > 0) {
              return (
                <Flex
                  direction="column"
                  gap="2"
                  p="3"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <Text size="2" weight="bold" style={{ color: "#3b82f6" }}>
                    Available License{availableLicenseCount > 1 ? "s" : ""}
                  </Text>
                  <Text size="1" style={{ opacity: 0.9 }}>
                    You have {availableLicenseCount} available license{availableLicenseCount > 1 ? "s" : ""}.
                    {displayTrialExpired ? " Activate one below to continue using Clipp." : " Use the button below to activate it on this device."}
                  </Text>
                  {trialExpiresDate && !displayTrialExpired && (
                    <Text size="1" style={{ opacity: 0.7, marginTop: "4px" }}>
                      Trial ends: {trialExpiresDate}
                    </Text>
                  )}
                </Flex>
              );
            }

            // If trial expired and no licenses
            if (displayTrialExpired) {
              return (
                <Flex
                  direction="column"
                  gap="2"
                  p="3"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <Text size="2" weight="bold" style={{ color: "#ef4444" }}>
                    Trial Expired
                  </Text>
                  <Text size="1" style={{ opacity: 0.9 }}>
                    Your trial has ended. Purchase a license to continue using Clipp.
                  </Text>
                  <Button
                    size="2"
                    color="red"
                    style={{ cursor: "pointer", alignSelf: "flex-start", marginTop: "4px" }}
                    onClick={() => window.electronAPI.openExternal("https://tryclipp.com")}
                  >
                    Purchase License
                  </Button>
                </Flex>
              );
            }

            // Default: Trial active, no licenses
            return (
              <Flex
                direction="column"
                gap="2"
                p="3"
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "8px",
                }}
              >
                <Text size="2" weight="bold" style={{ color: "#3b82f6" }}>
                  Trial Period
                </Text>
                <Text size="1" style={{ opacity: 0.9 }}>
                  You're currently on a free trial. Purchase a license to continue using Clipp after your trial ends.
                </Text>
                {trialExpiresDate && (
                  <Text size="1" style={{ opacity: 0.7, marginTop: "4px" }}>
                    Trial ends: {trialExpiresDate}
                  </Text>
                )}
                <Button
                  size="2"
                  style={{ cursor: "pointer", alignSelf: "flex-start", marginTop: "4px" }}
                  onClick={() => window.electronAPI.openExternal("https://tryclipp.com")}
                >
                  Purchase License
                </Button>
              </Flex>
            );
          })()}

          {/* Licenses Section */}
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" weight="bold" style={{ opacity: 0.7 }}>
                DEVICES
              </Text>
              <Button
                size="1"
                variant="ghost"
                style={{ cursor: "pointer" }}
                onClick={() => window.electronAPI.openExternal("https://tryclipp.com")}
              >
                Add License
              </Button>
            </Flex>

            {displayLicenses.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="2"
                p="5"
                style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px" }}
              >
                <Text size="2" style={{ opacity: 0.7, textAlign: "center" }}>
                  No licenses yet. Add a license to activate Clipp on this device.
                </Text>
              </Flex>
            ) : (
              displayLicenses.map((license) => (
                <LicenseItem
                  key={license.id}
                  license={license}
                  currentMachineId={displayMachineId}
                  onActivate={handleActivateLicense}
                  onRevoke={handleRevokeLicense}
                  onRenameMachine={handleRenameMachine}
                  activating={activatingLicense === license.key}
                  revoking={revokingLicense === license.key}
                />
              ))
            )}
          </Flex>

          {/* Debug Buttons */}
          {showDebugButtons && (
            <Flex direction="column" gap="2" p="3" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Text size="1" weight="bold" style={{ opacity: 0.5, marginBottom: "4px" }}>
                DEBUG MODE
              </Text>
              <Flex gap="2" wrap="wrap">
                <Button
                  size="1"
                  variant={debugMode === null ? "solid" : "soft"}
                  onClick={() => setDebugMode(null)}
                  style={{ cursor: "pointer", fontSize: "11px" }}
                >
                  Real Data
                </Button>
                <Button
                  size="1"
                  variant={debugMode === 'trial-no-devices' ? "solid" : "soft"}
                  onClick={() => setDebugMode('trial-no-devices')}
                  style={{ cursor: "pointer", fontSize: "11px" }}
                >
                  Trial, No Devices
                </Button>
                <Button
                  size="1"
                  variant={debugMode === 'trial-with-devices' ? "solid" : "soft"}
                  onClick={() => setDebugMode('trial-with-devices')}
                  style={{ cursor: "pointer", fontSize: "11px" }}
                >
                  Trial, With Device
                </Button>
                <Button
                  size="1"
                  variant={debugMode === 'devices-no-trial' ? "solid" : "soft"}
                  onClick={() => setDebugMode('devices-no-trial')}
                  style={{ cursor: "pointer", fontSize: "11px" }}
                >
                  Device, No Trial
                </Button>
                <Button
                  size="1"
                  variant={debugMode === 'no-devices-expired' ? "solid" : "soft"}
                  onClick={() => setDebugMode('no-devices-expired')}
                  style={{ cursor: "pointer", fontSize: "11px" }}
                >
                  Trial Expired
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </ScrollArea>
      <ClipboardFooter onShowAccount={onBack} hideShowDevices={true} />

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          style={{
            position: "fixed",
            bottom: "70px",
            right: "20px",
            padding: "12px 16px",
            background: "rgba(0, 0, 0, 0.9)",
            color: "#fff",
            fontSize: "13px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}
    </Flex>
  );
};

const LicenseItem = ({ license, currentMachineId, onActivate, onRevoke, onRenameMachine, activating, revoking }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Check both metadata and direct fields for machine info
  const machineId = license.metadata?.machine_id || license.machine_id;
  const machineName = license.metadata?.machine_name || license.machine_name;

  const [editedName, setEditedName] = useState(machineName || "");

  const isActiveOnThisMachine =
    currentMachineId && machineId && machineId === currentMachineId;

  const handleSave = () => {
    if (editedName.trim() && editedName !== machineName) {
      onRenameMachine(license.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(machineName || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
      }}
    >
      {/* License Key */}
      <Text
        size="1"
        style={{
          fontFamily: "monospace",
          opacity: 0.7,
          marginBottom: "8px",
          display: "block",
        }}
      >
        {license.key}
      </Text>

      {/* Machine Name or Status */}
      {machineName ? (
        <Flex align="center" gap="2" style={{ marginBottom: "8px" }}>
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              autoFocus
              style={{
                fontSize: "14px",
                padding: "4px 8px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(0, 0, 0, 0.3)",
                color: "var(--gray-12)",
                outline: "none",
                fontFamily: "monospace",
                borderRadius: "4px",
              }}
            />
          ) : (
            <>
              <Text size="2" weight="medium">
                {machineName}
              </Text>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gray-11)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ✎
              </button>
            </>
          )}
        </Flex>
      ) : (
        <Text size="2" style={{ opacity: 0.7, marginBottom: "8px", display: "block" }}>
          Not activated on any machine
        </Text>
      )}

      {/* Status Badge */}
      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          background: license.status === "active" ? "#10b981" : "#6b7280",
          color: "#fff",
          fontSize: "11px",
          fontWeight: "500",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      >
        {license.status === "active" ? "Active" : "Inactive"}
      </div>

      {/* Billing Info */}
      {license.renews_at && (
        <Text size="1" style={{ opacity: 0.7, display: "block", marginBottom: "12px" }}>
          Next billing: {new Date(license.renews_at).toLocaleDateString()}
        </Text>
      )}

      {/* Action Buttons */}
      <Flex gap="2" wrap="wrap">
        {/* Use on this machine */}
        {!machineId && (
          <Button
            onClick={() => onActivate(license.key)}
            disabled={activating}
            size="2"
            style={{ cursor: activating ? "not-allowed" : "pointer" }}
          >
            {activating ? "Activating..." : "Use on this machine"}
          </Button>
        )}

        {/* Revoke from this machine */}
        {isActiveOnThisMachine && (
          <Button
            onClick={() => onRevoke(license.key)}
            disabled={revoking}
            color="red"
            size="2"
            style={{ cursor: revoking ? "not-allowed" : "pointer" }}
          >
            {revoking ? "Revoking..." : "Revoke from this machine"}
          </Button>
        )}
      </Flex>
    </div>
  );
};

export default AccountSection;
