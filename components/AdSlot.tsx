"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT_ID = "ca-pub-9709583671943250";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slotId = process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT_ID }: { slotId?: string }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !slotId || process.env.NODE_ENV === "development") return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense failed to initialize.", error);
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId || process.env.NODE_ENV === "development") {
    return <aside className="ad-slot" aria-label="Advertisement" />;
  }

  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "90px" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
