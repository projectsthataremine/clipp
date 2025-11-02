"use client";

import { useConfirmModal } from "./useConfirmModal";
import { useLatestDownload } from "../../hooks/useLatestDownload";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Copy, Plus, RefreshCw } from "lucide-react";

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
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

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

    setLicenses(licensesData || []);
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
      const { error } = await supabase
        .from('licenses')
        .update({ machine_name: newName })
        .eq('id', licenseId);

      if (error) {
        console.error('Machine rename failed:', error);
        showToast('Failed to rename machine');
        return;
      }

      setLicenses(licenses.map(license =>
        license.id === licenseId
          ? { ...license, machine_name: newName }
          : license
      ));

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
    router.push(`/download?url=${encodeURIComponent(url)}`);
  };

  if (!user) return null;

  const hasLicenses = licenses.length > 0;

  return (
    <section className="max-w-[1000px] w-full px-5 mt-12 mx-auto">
      <div className="mb-12 flex justify-between items-center text-sm">
        <div className="flex gap-1">
          <p className="font-semibold">Account:</p>
          <p>{user.email}</p>
        </div>

        <button
          onClick={handleDeleteAccount}
          className="cursor-pointer px-4 py-2 text-xs text-red-600 font-semibold rounded-full border border-red-200 hover:bg-red-100 transition"
        >
          Delete Account
        </button>
      </div>

      {Modal}

      <div className="p-10 max-w-xxl mx-auto text-center">
        <div className="text-dodger-blue-500 mb-4 flex justify-center">
          <DownloadIcon width={48} height={48} />
        </div>

        <p className="font-semibold">{version}</p>

        {chipType && (
          <p className="text-gray-500 text-sm py-4">
            We detected you&apos;re using a{" "}
            {chipType === "apple"
              ? "Mac with Apple Silicon"
              : "Mac with an Intel chip"}
            .
          </p>
        )}

        <div className="flex justify-center flex-wrap gap-2">
          <button
            onClick={() =>
              handleDownload(chipType === "apple" ? siliconUrl : intelUrl)
            }
            className="cursor-pointer px-6 py-3 text-sm text-white font-semibold bg-dodger-blue-500 rounded-full hover:bg-dodger-blue-600 transition active:bg-dodger-blue-700 active:scale-98"
          >
            Download for {chipType === "apple" ? "Apple Silicon" : "Intel Macs"}
          </button>

          <button
            onClick={() =>
              handleDownload(chipType === "apple" ? intelUrl : siliconUrl)
            }
            className="cursor-pointer px-6 py-3 text-sm text-dodger-blue-500 font-semibold bg-white border border-dodger-blue-500 rounded-full hover:bg-dodger-blue-50 transition active:bg-dodger-blue-100 active:scale-98"
          >
            Download for {chipType === "apple" ? "Intel Macs" : "Apple Silicon"}
          </button>
        </div>

        {/* License Management Section */}
        <hr className="border-t border-gray-300 m-8" />

        <div className="space-y-6 max-w-3xl mx-auto text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Licenses</h3>
            <div className="flex items-center gap-2">
              <button
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
                className="p-2 text-dodger-blue-500 hover:bg-dodger-blue-50 rounded transition"
                title="Add license"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={handleRefreshLicenses}
                disabled={isRefreshing}
                className="p-2 text-dodger-blue-500 hover:bg-dodger-blue-50 rounded transition disabled:opacity-30"
                title="Refresh licenses"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {hasLicenses ? (
            <div className="space-y-4">
              {licenses.map((license) => {
                const machineId = license.metadata?.machine_id || license.machine_id;
                const machineName = license.metadata?.machine_name || license.machine_name;
                const machineOS = license.metadata?.machine_os;

                return (
                  <div key={license.id} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white shadow-sm">
                    {/* License Key */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 flex-1 min-w-0">
                        <span className="text-gray-500 text-sm whitespace-nowrap">License key:</span>
                        <span className="font-mono text-sm break-all text-gray-800">{license.key}</span>
                      </div>
                      <button
                        onClick={() => copyLicenseKey(license.key)}
                        className="p-2 text-gray-500 hover:text-dodger-blue-500 transition flex-shrink-0"
                        title="Copy license key"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    {/* Status */}
                    <div className="flex items-baseline gap-2 relative">
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span
                        className={`text-sm font-medium cursor-help border-b border-dotted border-current ${
                          license.status === 'active' ? 'text-green-600' :
                          license.status === 'canceled' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}
                        onMouseEnter={() => setHoveredStatus(`${license.id}-status`)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      >
                        {license.status}
                      </span>
                      {hoveredStatus === `${license.id}-status` && (
                        <div className="absolute left-0 top-6 z-50 bg-white border border-gray-300 px-3 py-2 text-xs shadow-lg w-[220px] rounded">
                          {license.status === 'pending' && (
                            <p>Not yet activated on a machine.</p>
                          )}
                          {license.status === 'active' && (
                            <p>Currently active and bound to a machine.</p>
                          )}
                          {license.status === 'canceled' && (
                            <p>Subscription cancelled. Access will end on the expiration date.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Machine Name/OS if bound */}
                    {machineId && (
                      <div
                        className="flex items-baseline gap-2"
                        onMouseEnter={() => setHoveredLicense(license.id)}
                        onMouseLeave={() => setHoveredLicense(null)}
                      >
                        <span className="text-gray-500 text-sm">Machine:</span>
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
                            className="flex-1 bg-white border border-dodger-blue-500 px-2 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-dodger-blue-300"
                          />
                        ) : (
                          <>
                            <span className="text-sm text-gray-800">
                              {machineName || 'Unknown'}
                              {machineOS && ` • ${machineOS}`}
                            </span>
                            {hoveredLicense === license.id && (
                              <button
                                onClick={() => {
                                  setEditingLicense(license.id);
                                  setEditedName(machineName || '');
                                }}
                                className="text-xs text-dodger-blue-500 hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Expiration / Renewal / Cancel Button */}
                    {(license.expires_at || license.renews_at || license.stripe_customer_id) && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        {license.expires_at ? (
                          <span className="text-gray-500">
                            Expires on: {new Date(license.expires_at).toLocaleDateString()}
                          </span>
                        ) : license.renews_at ? (
                          <span className="text-gray-500">
                            Renews on: {new Date(license.renews_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span></span>
                        )}
                        {license.stripe_customer_id && (
                          <button
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
                            className={`px-3 py-1 text-xs font-medium border rounded transition ${
                              license.status === 'canceled'
                                ? 'text-green-600 border-green-300 hover:bg-green-50'
                                : 'text-red-600 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            {license.status === 'canceled' ? 'Reactivate' : 'Manage Subscription'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 text-center py-8">
              <p className="text-gray-500 text-sm">No active licenses. Click the + button above to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-8 right-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-slide-in-right z-50"
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}
