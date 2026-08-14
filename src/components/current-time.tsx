"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function CurrentTime({ initial }: { initial: string }) {
  const [time, setTime] = useState(initial);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span className="tabular-nums">{time}</span>;
}
