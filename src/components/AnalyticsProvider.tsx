"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    async function ping() {
      try {
        await fetch("/api/analytics/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: pathname }),
        });
      } catch {}
    }
    ping();
    const timer = setInterval(ping, 60_000);
    return () => clearInterval(timer);
  }, [pathname]);

  return null;
}
