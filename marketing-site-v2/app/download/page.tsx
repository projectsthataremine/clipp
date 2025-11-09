'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function DownloadPage() {
  const [showUpdateInstructions, setShowUpdateInstructions] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch latest release from GitHub
    fetch('https://api.github.com/repos/projectsthataremine/clipp/releases/latest')
      .then(res => res.json())
      .then(data => {
        // Find the DMG file in the assets
        const dmgAsset = data.assets?.find((asset: any) =>
          asset.name.endsWith('.dmg') && asset.name.includes('arm64')
        );
        if (dmgAsset) {
          setDownloadUrl(dmgAsset.browser_download_url);
        }
      })
      .catch(err => {
        console.error('Failed to fetch latest release:', err);
      });
  }, []);

  useEffect(() => {
    // Auto-trigger download after 1 second when URL is available
    if (!downloadUrl) return;

    const timer = setTimeout(() => {
      console.log('Triggering download...');
      window.location.href = downloadUrl;
    }, 1000);

    return () => clearTimeout(timer);
  }, [downloadUrl]);

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
              Thanks for downloading!
              <br />
              Just a few steps left.
            </h1>
            <p className="text-lg text-gray-600 mb-3">
              Your download will begin automatically. If it didn't,{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (downloadUrl) {
                    console.log('Manual download triggered');
                    window.location.href = downloadUrl;
                  }
                }}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                download Clipp manually
              </a>
              .
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Manage your account and subscriptions directly in the app after installation.
            </p>
          </motion.div>

          {/* Update Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto mb-16 mt-8"
          >
            <div className="text-center mb-4">
              <button
                onClick={() => setShowUpdateInstructions(!showUpdateInstructions)}
                className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm font-medium">Updating from a previous version?</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showUpdateInstructions ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showUpdateInstructions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Before installing the new version:
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-medium">1.</span>
                    <div>
                      <strong className="text-gray-900">Quit the existing Clipp app</strong> if it's currently running (right-click the menu bar icon and select "Quit")
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-medium">2.</span>
                    <div>
                      <strong className="text-gray-900">Delete the old version</strong> from your Applications folder (Finder → Applications → Drag Clipp.app to Trash)
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-400 font-medium">3.</span>
                    <div>
                      <strong className="text-gray-900">Install the new version</strong> by following the steps below
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> Your clipboard history and settings are safely stored and will be available after updating.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Step 1: Open */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Open</h2>
              </div>

              <div className="bg-gradient-to-br from-teal-700 to-teal-800 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                {/* Downloads folder illustration */}
                <div className="relative">
                  <div className="bg-gray-300/80 px-6 py-2 rounded-lg mb-8">
                    <span className="text-gray-800 font-medium">Downloads</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-lg"></div>
                    <div className="w-16 h-16 bg-red-100 rounded-lg"></div>
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl ring-4 ring-orange-400 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/30 rounded"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Open the <span className="font-semibold">Clipp.dmg</span> file from your{' '}
                <span className="font-semibold">Downloads</span> folder
              </p>
            </motion.div>

            {/* Step 2: Install */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Install</h2>
              </div>

              <div className="bg-gray-200 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative">
                {/* Drag to Applications illustration */}
                <div className="flex items-center justify-center gap-6">
                  <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded"></div>
                  </div>
                  <div className="text-gray-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded"></div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Drag the <span className="font-semibold">Clipp icon</span> into your{' '}
                <span className="font-semibold">Applications</span> folder
              </p>
            </motion.div>

            {/* Step 3: Launch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Launch</h2>
              </div>

              <div className="bg-gray-200 rounded-2xl p-8 mb-6 aspect-[4/3] flex items-center justify-center relative">
                {/* Applications list illustration */}
                <div className="w-full max-w-xs bg-white rounded-xl p-4 space-y-2">
                  <div className="text-left font-medium text-gray-900 mb-3">Applications</div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-gray-600 text-sm">Superhuman.app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-600">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-white text-sm font-medium">Clipp.app</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
                    <span className="text-gray-600 text-sm">Notion.app</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700">
                Open the <span className="font-semibold">Clipp</span> app from your{' '}
                <span className="font-semibold">Applications</span> folder
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
