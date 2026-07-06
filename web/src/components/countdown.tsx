"use client";

import { useEffect, useState } from "react";

const target = new Date("2026-08-07T18:00:00-03:00").getTime();
const initialTime = {
  dias: "--",
  horas: "--",
  minutos: "--",
  segundos: "--",
};

function calculate() {
  const diff = Math.max(target - Date.now(), 0);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  return {
    dias: Math.floor(diff / day),
    horas: Math.floor((diff % day) / hour),
    minutos: Math.floor((diff % hour) / minute),
    segundos: Math.floor((diff % minute) / 1000),
  };
}

export function Countdown() {
  const [time, setTime] = useState<Record<keyof typeof initialTime, number | string>>(initialTime);

  useEffect(() => {
    setTime(calculate());
    const interval = window.setInterval(() => setTime(calculate()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(time).map(([label, value]) => (
        <div key={label} className="rounded-lg border border-white/20 bg-white/14 p-5 text-center text-white backdrop-blur-xl">
          <p className="font-display text-4xl font-semibold">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
