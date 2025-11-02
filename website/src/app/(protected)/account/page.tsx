"use client";

import { useConfirmModal } from "./useConfirmModal";
import { useLatestDownload } from "../../hooks/useLatestDownload";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Copy, Plus, RefreshCw, Key } from "lucide-react";
import * as RadixUI from "@radix-ui/themes";
import DownloadInstructionsModal from "@/components/DownloadInstructionsModal";

import useUser from "@/app/hooks/useUser";

import supabase from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

interface License {
  id: string;
  key: string;
  status: string;
  machine_id?: string;
  machine_name?: string;
  metadata?: {
    machine_id?: string;
    machine_name?: string;
    machine_os?: string;
  };
  expires_at?: string;
  renews_at?: string;
  stripe_customer_id?: string;
  created_at: string;
}

export default function AccountPage() {
  const { confirm, Modal } = useConfirmModal();
  const { intelUrl, siliconUrl, version } = useLatestDownload();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [chipType, setChipType] = useState<"apple" | "intel" | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [lastCopyTime, setLastCopyTime] = useState<number>(0);
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [hoveredLicense, setHoveredLicense] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Toast notification function
  const showToast = (message: string) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("macintosh") || userAgent.includes("mac os")) {
      if (userAgent.includes("arm") || userAgent.includes("apple")) {
        setChipType("apple");
      } else if (userAgent.includes("intel") || userAgent.includes("x86")) {
        setChipType("intel");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  async function fetchLicenses() {
    if (!user) return;

    const { data: licensesData } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'expired')
      .order('created_at', { ascending: false });

    // Filter out licenses that have expired (past expires_at date)
    const now = new Date();
    const activeLicenses = (licensesData || []).filter(license => {
      if (!license.expires_at) return true; // No expiration date means it's active
      const expiresAt = new Date(license.expires_at);
      return expiresAt > now; // Only show if expires_at is in the future
    });

    setLicenses(activeLicenses);
  }

  async function handleRefreshLicenses() {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    if (timeSinceLastRefresh < 20000) {
      const remainingSeconds = Math.ceil((20000 - timeSinceLastRefresh) / 1000);
      showToast(`Wait ${remainingSeconds}s before refreshing again`);
      return;
    }

    setLastRefreshTime(now);
    setIsRefreshing(true);
    await fetchLicenses();
    setIsRefreshing(false);
  }

  async function copyLicenseKey(key: string) {
    const now = Date.now();
    const timeSinceLastCopy = now - lastCopyTime;

    if (timeSinceLastCopy < 1000) {
      return;
    }

    setLastCopyTime(now);
    await navigator.clipboard.writeText(key);
    showToast('License key copied');
  }

  async function handleRenameMachine(licenseId: string, newName: string) {
    try {
      console.log('Attempting to update license:', licenseId, 'with name:', newName);

      // First, get the current license to see its structure
      const { data: currentLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', licenseId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current license:', fetchError);
        showToast('Failed to fetch license data');
        return;
      }

      console.log('Current license data:', currentLicense);

      // Check if metadata exists and update accordingly
      const updateData: any = { machine_name: newName };

      if (currentLicense.metadata) {
        // If metadata exists, merge the new machine_name into it
        updateData.metadata = {
          ...currentLicense.metadata,
          machine_name: newName
        };
      }

      console.log('Updating with data:', updateData);

      const { data: updatedData, error } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('id', licenseId)
        .select();

      if (error) {
        console.error('Machine rename failed:', error);
        showToast('Failed to rename machine');
        return;
      }

      console.log('Update successful, response:', updatedData);

      // Update local state
      setLicenses(licenses.map(license => {
        if (license.id === licenseId) {
          return {
            ...license,
            machine_name: newName,
            metadata: {
              ...license.metadata,
              machine_name: newName
            }
          };
        }
        return license;
      }));

      showToast('Machine renamed successfully');
    } catch (error) {
      console.error('Machine rename error:', error);
      showToast('Failed to rename machine');
    }
  }

  const handleDeleteAccount = () => {
    confirm({
      title: "Delete your account?",
      message:
        "Are you sure you want to delete your account? This action cannot be undone and will remove all your data permanently.",
      confirmLabel: "Delete Account",
      onConfirm: async () => {
        await supabase.rpc("delete_user");
        router.push("/");
      },
    });
  };

  const handleDownload = (url?: string | null) => {
    if (!url) {
      console.error("Download URL is not available.");
      return;
    }
    // Start the download
    window.location.href = url;
    // Show instructions modal
    setShowInstructionsModal(true);
  };

  if (!user) return null;

  const hasLicenses = licenses.length > 0;

  return (
    <section className="min-h-screen bg-white">
      <RadixUI.Container size="3" className="py-12">
        {/* Header Card */}
        <RadixUI.Card size="3" className="mb-8">
          <RadixUI.Flex justify="between" align="center">
            <RadixUI.Flex gap="3" align="center">
              <RadixUI.Avatar
                src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                fallback={user.email?.charAt(0).toUpperCase() || "U"}
                size="3"
                radius="full"
              />
              <RadixUI.Text size="2" color="gray">{user.email}</RadixUI.Text>
            </RadixUI.Flex>
            <RadixUI.Button
              onClick={handleDeleteAccount}
              variant="outline"
              color="red"
              size="2"
            >
              Delete Account
            </RadixUI.Button>
          </RadixUI.Flex>
        </RadixUI.Card>

        {Modal}

        {/* Download Section */}
        <RadixUI.Card size="4" className="mb-8">
          <RadixUI.Flex direction="column" align="center" gap="4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-dodger-blue-500 to-dodger-blue-600 rounded-2xl shadow-lg shadow-dodger-blue-500/20">
              <DownloadIcon width={32} height={32} className="text-white" />
            </div>

            <RadixUI.Heading size="6" align="center">Download Clipp</RadixUI.Heading>
            <RadixUI.Heading size="8" align="center" className="text-dodger-blue-600">{version}</RadixUI.Heading>

            {chipType && (
              <RadixUI.Box className="bg-gray-50 rounded-lg px-4 py-3">
                <RadixUI.Text size="2" color="gray">
                  Detected: {chipType === "apple" ? "Mac with Apple Silicon" : "Mac with Intel chip"}
                </RadixUI.Text>
              </RadixUI.Box>
            )}

            <RadixUI.Flex gap="3" wrap="wrap" justify="center">
              <RadixUI.Button
                onClick={() =>
                  handleDownload(chipType === "apple" ? siliconUrl : intelUrl)
                }
                size="3"
                className="bg-gradient-to-r from-dodger-blue-500 to-dodger-blue-600 hover:from-dodger-blue-600 hover:to-dodger-blue-700"
              >
                Download for {chipType === "apple" ? "Apple Silicon" : "Intel Macs"}
              </RadixUI.Button>

              <RadixUI.Button
                onClick={() =>
                  handleDownload(chipType === "apple" ? intelUrl : siliconUrl)
                }
                variant="outline"
                size="3"
                color="blue"
              >
                Download for {chipType === "apple" ? "Intel Macs" : "Apple Silicon"}
              </RadixUI.Button>
            </RadixUI.Flex>
          </RadixUI.Flex>
        </RadixUI.Card>

        {/* License Management Section */}
        <RadixUI.Card size="3">
          <RadixUI.Flex justify="between" align="center" mb="6">
            <RadixUI.Heading size="6">Licenses</RadixUI.Heading>
            <RadixUI.Flex gap="2">
              <RadixUI.Tooltip content="Purchase a new license">
                <RadixUI.IconButton
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                      });
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        showToast(data.error || 'Failed to create checkout session');
                      }
                    } catch (error) {
                      console.error('Checkout error:', error);
                      showToast('Failed to start checkout');
                    }
                  }}
                  variant="soft"
                  color="blue"
                >
                  <Plus size={18} />
                </RadixUI.IconButton>
              </RadixUI.Tooltip>
              <RadixUI.Tooltip content="Refresh license list">
                <RadixUI.IconButton
                  onClick={handleRefreshLicenses}
                  disabled={isRefreshing}
                  variant="soft"
                  color="gray"
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                </RadixUI.IconButton>
              </RadixUI.Tooltip>
            </RadixUI.Flex>
          </RadixUI.Flex>

          {hasLicenses ? (
            <RadixUI.Flex direction="column" gap="4">
              {licenses.map((license) => {
                const machineId = license.metadata?.machine_id || license.machine_id;
                const machineName = license.metadata?.machine_name || license.machine_name;
                const machineOS = license.metadata?.machine_os;

                return (
                  <RadixUI.Card key={license.id} size="2" className="group hover:shadow-md transition-shadow">
                    {/* License Key */}
                    <RadixUI.Flex align="center" gap="3" mb="4">
                      <div className="flex-shrink-0 w-10 h-10 bg-dodger-blue-100 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-dodger-blue-600" />
                      </div>
                      <RadixUI.Box className="flex-1 min-w-0">
                        <RadixUI.Text size="1" color="gray" weight="medium" mb="1" as="p">License Key</RadixUI.Text>
                        <RadixUI.Flex align="center" gap="2">
                          <RadixUI.Code size="2" className="truncate flex-1">{license.key}</RadixUI.Code>
                          <button
                            onClick={() => copyLicenseKey(license.key)}
                            title="Copy license key"
                            className="flex-shrink-0 text-gray-500 hover:text-dodger-blue-600 transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </RadixUI.Flex>
                      </RadixUI.Box>
                    </RadixUI.Flex>

                    {/* Status & Machine Info */}
                    <RadixUI.Grid columns={{ initial: "1", md: "2" }} gap="4" mb="4">
                      {/* Status */}
                      <RadixUI.Box>
                        <RadixUI.Text size="1" color="gray" weight="medium" mb="2" as="p">Status</RadixUI.Text>
                        <RadixUI.Flex align="center" gap="2">
                          <RadixUI.Badge
                            color={
                              license.status === 'active' ? 'green' :
                              license.status === 'canceled' ? 'red' :
                              'yellow'
                            }
                            size="2"
                            variant="soft"
                          >
                            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                          </RadixUI.Badge>
                          <RadixUI.Tooltip
                            content={
                              license.status === 'pending' ? 'Not yet activated on a machine.' :
                              license.status === 'active' ? 'Currently active and bound to a machine.' :
                              'Subscription cancelled. Access will end on the expiration date.'
                            }
                          >
                            <button className="text-gray-400 hover:text-gray-600 cursor-help">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </RadixUI.Tooltip>
                        </RadixUI.Flex>
                      </RadixUI.Box>

                      {/* Machine Info */}
                      {machineId && (
                        <RadixUI.Box
                          onMouseEnter={() => setHoveredLicense(license.id)}
                          onMouseLeave={() => setHoveredLicense(null)}
                        >
                          <RadixUI.Text size="1" color="gray" weight="medium" mb="2" as="p">Machine</RadixUI.Text>
                          {editingLicense === license.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editedName.trim() && editedName !== machineName) {
                                    handleRenameMachine(license.id, editedName.trim());
                                  }
                                  setEditingLicense(null);
                                } else if (e.key === 'Escape') {
                                  setEditingLicense(null);
                                }
                              }}
                              onBlur={() => {
                                if (editedName.trim() && editedName !== machineName) {
                                  handleRenameMachine(license.id, editedName.trim());
                                }
                                setEditingLicense(null);
                              }}
                              autoFocus
                              className="w-full bg-dodger-blue-50 px-3 py-2 text-sm rounded-lg focus:outline-none focus:bg-dodger-blue-100"
                            />
                          ) : (
                            <RadixUI.Flex justify="between" align="center" gap="2" className="bg-gray-50 px-3 py-2 rounded-lg min-h-[36px]">
                              <RadixUI.Text size="2" weight="medium">
                                {machineName || 'Unknown'}
                                {machineOS && <RadixUI.Text color="gray" weight="regular" className="ml-1">• {machineOS}</RadixUI.Text>}
                              </RadixUI.Text>
                              {hoveredLicense === license.id && (
                                <RadixUI.Button
                                  onClick={() => {
                                    setEditingLicense(license.id);
                                    setEditedName(machineName || '');
                                  }}
                                  size="1"
                                  variant="ghost"
                                  color="blue"
                                >
                                  Edit
                                </RadixUI.Button>
                              )}
                            </RadixUI.Flex>
                          )}
                        </RadixUI.Box>
                      )}
                    </RadixUI.Grid>

                    {/* Expiration / Renewal / Manage Button */}
                    {(license.expires_at || license.renews_at || license.stripe_customer_id) && (
                      <RadixUI.Flex justify="between" align="center" pt="4" className="border-t border-gray-200">
                        {license.expires_at ? (
                          <RadixUI.Flex align="center" gap="2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <RadixUI.Text size="2" color="gray">Expires {new Date(license.expires_at).toLocaleDateString()}</RadixUI.Text>
                          </RadixUI.Flex>
                        ) : license.renews_at ? (
                          <RadixUI.Flex align="center" gap="2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <RadixUI.Text size="2" color="gray">Renews {new Date(license.renews_at).toLocaleDateString()}</RadixUI.Text>
                          </RadixUI.Flex>
                        ) : (
                          <span></span>
                        )}
                        {license.stripe_customer_id && (
                          <RadixUI.Button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/create-customer-portal', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ stripe_customer_id: license.stripe_customer_id }),
                                });
                                const data = await response.json();
                                if (data.url) {
                                  window.location.href = data.url;
                                } else {
                                  console.error('Portal error:', data);
                                  showToast(data.error || 'Failed to open customer portal');
                                }
                              } catch (error) {
                                console.error('Customer portal error:', error);
                                showToast('Failed to open customer portal');
                              }
                            }}
                            size="2"
                            variant="soft"
                            color={license.status === 'canceled' ? 'green' : 'red'}
                          >
                            {license.status === 'canceled' ? 'Reactivate' : 'Manage Subscription'}
                          </RadixUI.Button>
                        )}
                      </RadixUI.Flex>
                    )}
                  </RadixUI.Card>
                );
              })}
            </RadixUI.Flex>
          ) : (
            <RadixUI.Flex direction="column" align="center" py="9" gap="4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <RadixUI.Box className="text-center">
                <RadixUI.Heading size="4" mb="2">No active licenses</RadixUI.Heading>
                <RadixUI.Text size="2" color="gray">Get started by purchasing a license</RadixUI.Text>
              </RadixUI.Box>
              <RadixUI.Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      showToast(data.error || 'Failed to create checkout session');
                    }
                  } catch (error) {
                    console.error('Checkout error:', error);
                    showToast('Failed to start checkout');
                  }
                }}
                size="3"
                className="bg-gradient-to-r from-dodger-blue-500 to-dodger-blue-600 hover:from-dodger-blue-600 hover:to-dodger-blue-700"
              >
                Purchase License
              </RadixUI.Button>
            </RadixUI.Flex>
          )}
        </RadixUI.Card>
      </RadixUI.Container>

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-6 right-6 z-[9999] animate-slide-in-right"
          style={{ pointerEvents: 'none' }}
        >
          <RadixUI.Card size="2" className="shadow-2xl">
            <RadixUI.Flex align="center" gap="2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <RadixUI.Text size="2">{toast.message}</RadixUI.Text>
            </RadixUI.Flex>
          </RadixUI.Card>
        </div>
      )}

      {/* Download Instructions Modal */}
      <DownloadInstructionsModal
        open={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
    </section>
  );
}
