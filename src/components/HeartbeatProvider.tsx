"use client";
import { useEffect } from "react";

export default function HeartbeatProvider() {
  useEffect(() => {
    async function ping() {
      try {
        await fetch("/api/user/heartbeat", { method: "POST" });
      } catch {
        // sessizce geç
      }
    }
    ping();
    const timer = setInterval(ping, 60_000);
    return () => clearInterval(timer);
  }, []);
  return null;
}
