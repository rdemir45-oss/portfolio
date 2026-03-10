"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbVideo, TbX } from "react-icons/tb";

interface LiveStream {
  id: number;
  title: string;
  stream_at: string;
  description?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function useCountdown(targetISO: string) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const ms = new Date(targetISO).getTime() - Date.now();
      setDiff(ms > 0 ? ms : 0);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  if (diff === null) return null;

  const totalSec = Math.floor(diff / 1000);
  return {
    days:    Math.floor(totalSec / 86400),
    hours:   Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    isLive:  diff === 0,
  };
}

export default function LiveStreamBanner() {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("live_banner_dismissed")) {
      setDismissed(true);
      return;
    }
    fetch("/api/live-stream")
      .then((r) => r.json())
      .then((d) => { if (d.stream) setStream(d.stream); })
      .catch(() => {});
  }, []);

  const countdown = useCountdown(stream?.stream_at ?? new Date(0).toISOString());

  if (!stream || dismissed || !countdown) return null;

  const dateLabel = new Date(stream.stream_at).toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  function dismiss() {
    sessionStorage.setItem("live_banner_dismissed", "1");
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="relative bg-gradient-to-r from-rose-950/70 via-pink-950/50 to-rose-950/70 border-b border-rose-800/50 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 flex-wrap">
          {/* İkon / Canlı göstergesi */}
          <div className="shrink-0">
            {countdown.isLive ? (
              <span className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                CANLI
              </span>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400">
                <TbVideo size={15} />
                <span className="text-xs font-semibold hidden sm:inline">Canlı Yayın</span>
              </div>
            )}
          </div>

          {/* Başlık + tarih */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white mr-2 truncate">{stream.title}</span>
            <span className="text-xs text-rose-300/60 hidden sm:inline">{dateLabel}</span>
          </div>

          {/* Geri sayım */}
          {!countdown.isLive && (
            <div className="flex items-center gap-1.5 shrink-0">
              {countdown.days > 0 && (
                <>
                  <Unit value={countdown.days} label="Gün" />
                  <Sep />
                </>
              )}
              {(countdown.days > 0 || countdown.hours > 0) && (
                <>
                  <Unit value={countdown.hours} label="Sa" />
                  <Sep />
                </>
              )}
              <Unit value={countdown.minutes} label="Dk" />
              <Sep />
              <Unit value={countdown.seconds} label="Sn" />
            </div>
          )}

          {/* Kapat */}
          <button
            onClick={dismiss}
            className="p-1 text-rose-700 hover:text-rose-400 transition-colors shrink-0"
          >
            <TbX size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center min-w-[24px]">
      <p className="text-sm font-black text-white leading-none">{pad(value)}</p>
      <p className="text-[9px] text-rose-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Sep() {
  return <span className="text-rose-700 font-black text-sm leading-none pb-2.5">:</span>;
}
