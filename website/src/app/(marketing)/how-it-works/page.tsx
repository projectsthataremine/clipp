"use client";

import Image from "next/image";

export default function HowItWorks() {
  return (
    <section className="max-w-[1000px] w-full mx-auto px-5 py-12 font-sans">
      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Installing Clipp</h2>
        <p className="text-sm leading-relaxed mb-3 text-gray-800">
          Go to <strong>clipp.app/download</strong> — this will automatically
          start the download. Once it&apos;s finished, open the{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
            .dmg
          </code>{" "}
          file, drag Clipp into your <strong>Applications</strong> folder, and
          follow the prompts in <strong>Privacy &amp; Security</strong> to allow
          it.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Updating Clipp</h2>
        <p className="text-sm leading-relaxed text-gray-800">
          Clipp checks for updates automatically at launch. If a new version is
          available, the app won&apos;t run until you install it — this helps
          ensure everyone is on the latest build. Just download the new version
          and replace the old app in your Applications folder.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Uninstalling Clipp</h2>
        <p className="text-sm leading-relaxed text-gray-800">
          First, make sure Clipp is closed. Then, go to your{" "}
          <strong>Applications</strong> folder and drag Clipp to the Trash.
          That&apos;s it — nothing else is installed on your system.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Using Clipp</h2>
        <p className="text-sm leading-relaxed text-gray-800">
          When you launch Clipp, it will automatically open a sidebar — this is
          where your clipboard history appears. Each entry is labeled by type —
          text, image, file, or video — so you can easily tell them apart at a
          glance. Click any item to copy it back to your clipboard instantly.
        </p>
        <p className="text-sm leading-relaxed text-gray-800">
          You can also open this sidebar at any time using the global shortcut:{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
            Command + Shift + V
          </code>
          .
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Clipp&apos;s Tray Icon</h2>
        <p className="text-sm leading-relaxed text-gray-800">
          After launching, Clipp adds an icon to your macOS menu bar (top-right
          corner). Clicking this icon reveals a dropdown menu with options to{" "}
          <strong>Show</strong> or <strong>Quit</strong> the app.
        </p>
        <p className="text-sm leading-relaxed mb-4 text-gray-800">
          If the sidebar isn&apos;t visible, you can always bring it back by
          clicking the tray icon and selecting <strong>Show</strong>.
        </p>

        <div className="relative h-[100px] mx-auto rounded-xl overflow-hidden mt-4">
          <Image
            src="https://gmzwsqjmqakjijnnfxbf.supabase.co/storage/v1/object/public/images//clip-icon-tray.png"
            alt="Clipp Tray"
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-md font-semibold pb-1">Quitting Clipp</h2>
        <p className="text-sm leading-relaxed text-gray-800">
          To quit Clipp completely, use the tray icon in the menu bar. Click it
          and select <strong>Quit</strong>. This is currently the only way to
          fully close the app.
        </p>
      </div>
    </section>
  );
}
