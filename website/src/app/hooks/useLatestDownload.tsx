"use client";

import { useEffect, useState } from "react";

export function useLatestDownload() {
  const [version, setVersion] = useState<string | null>(null);
  const [intelUrl, setIntelUrl] = useState<string | null>(null);
  const [siliconUrl, setSiliconUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/joshmarnold/clipp/releases/latest"
        );
        const data = await res.json();

        const assets = data.assets || [];
        const intelAsset = assets.find(
          (a: any) =>
            !a.name.toLowerCase().includes("x64") && a.name.endsWith(".dmg")
        );
        const siliconAsset = assets.find(
          (a: any) =>
            a.name.toLowerCase().includes("arm64") && a.name.endsWith(".dmg")
        );

        setVersion(data.tag_name || null);
        setIntelUrl(intelAsset?.browser_download_url || null);
        setSiliconUrl(siliconAsset?.browser_download_url || null);
      } catch (err) {
        console.error("Failed to fetch latest release:", err);
      }
    }

    fetchLatestRelease();
  }, []);

  return { version, intelUrl, siliconUrl };
}
