"use client";

import { useEffect, useState } from "react";

export default function ShiftClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="rounded-ops border border-ops-line px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ops-muted"
      aria-label={`Shift clock ${time}`}
    >
      {time || "—:—"}
    </span>
  );
}
