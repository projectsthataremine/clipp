"use client";

import { Flex } from "@radix-ui/themes";
import Image from "next/image";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import "./download.scss";

export default function DownloadPageClient() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  useEffect(() => {
    if (url) {
      // window.location.href = url;
    }
  }, [url]);

  return (
    <Flex direction="column">
      <section className="download">
        <h1 className="download-title">Thanks for downloading Clipp!</h1>
        <p className="download-subtext">
          Your download should start automatically.
        </p>
        {url ? (
          <p className="download-subtext">
            If it doesn&apos;t,{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              click here to download manually
            </a>
            .
          </p>
        ) : (
          <p className="download-subtext">Missing download URL...</p>
        )}
        <p className="download-instructions">
          Once downloaded, open the <code>.dmg</code> file and drag Clipp into
          your <strong>Applications</strong> folder.
        </p>
      </section>

      <section className="download-note">
        <div className="download-note-content">
          <hr />
          <h2 className="download-note-title">
            If updating, make sure Clipp is closed
          </h2>

          <div className="download-note-scroll">
            <div className="download-note-option">
              <p>
                <strong>Option 1:</strong>
              </p>
              <p>
                Click the Clipp tray icon in the top-right of your screen to
                open its dropdown menu. From the menu, select <em>Quit</em>.
              </p>
              <p>
                If you don&apos;t see the tray icon, hold <code>Command</code>{" "}
                and drag other icons around — it should reveal hidden tray
                items.
              </p>
            </div>

            <div className="download-note-option">
              <p>
                <strong>Option 2:</strong>
              </p>
              <p>
                Open <em>Activity Monitor</em>, search for <code>Clipp</code>,
                double-click it, then click <strong>Quit</strong> and confirm
                with <strong>Force Quit</strong>.
              </p>
            </div>

            <hr />

            <div className="download-note-option">
              <h2 className="download-note-title">
                When launching Clipp for the first time, macOS may block it with
                a warning:
              </h2>
              <Image
                src="https://gmzwsqjmqakjijnnfxbf.supabase.co/storage/v1/object/public/images//could-not-verify.png"
                alt="macOS could not verify warning"
                className="download-note-image"
                fill
              />
              <p>
                Click <strong>Done</strong> (not <em>Move to Trash</em>), then
                open <em>System Settings → Privacy & Security</em>.
              </p>
              <p>
                Scroll down and you&apos;ll see a message that says{" "}
                <em>&quot;Clipp was blocked&quot;</em>. Click{" "}
                <strong>Open Anyway</strong>:
              </p>
              <Image
                src="https://gmzwsqjmqakjijnnfxbf.supabase.co/storage/v1/object/public/images//unlock.png"
                alt="System Settings Open Anyway"
                className="download-note-image"
                fill
              />
              <p>
                After clicking <strong>Open Anyway</strong>, you&apos;ll see one
                more prompt asking you to confirm. Click <strong>Open</strong>{" "}
                on that prompt. The app should then launch automatically. If it
                doesn&apos;t, open Clipp from your <strong>Applications</strong>{" "}
                folder. Make sure you launch it from Applications — not from the{" "}
                <code>.dmg</code> file or the Downloads folder.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Flex>
  );
}
