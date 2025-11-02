import { Suspense } from "react";
import DownloadPageClient from "./DownloadPageClient";

export default function DownloadPage() {
  return (
    <Suspense fallback={<div></div>}>
      <DownloadPageClient />
    </Suspense>
  );
}
