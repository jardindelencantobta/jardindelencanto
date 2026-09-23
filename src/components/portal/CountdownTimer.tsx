"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(eventDate: string, startTime: string): TimeLeft | null {
  const target = new Date(`${eventDate}T${startTime}`);
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-serif text-[2rem] sm:text-[3rem] md:text-[3.8rem] leading-none text-blanco tracking-[-0.04em]">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.55rem] sm:text-[0.6rem] tracking-[0.2em] sm:tracking-[0.25em] text-blanco/40 uppercase mt-1">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="font-serif text-[1.4rem] sm:text-[2rem] md:text-[2.5rem] text-dorado/50 leading-none pb-3 sm:pb-5 select-none">
      :
    </span>
  );
}

export function CountdownTimer({
  eventDate,
  startTime,
}: {
  eventDate: string;
  startTime: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    compute(eventDate, startTime)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(compute(eventDate, startTime));
    }, 1000);
    return () => clearInterval(id);
  }, [eventDate, startTime]);

  if (timeLeft === null) {
    return (
      <div className="text-center py-4">
        <p className="font-serif text-[1.6rem] text-dorado">
          ¡Hoy es el gran día!
        </p>
        <p className="text-blanco/50 text-sm mt-1">Jardín El Encanto</p>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-3 md:gap-5">
      <Unit value={timeLeft.days} label="días" />
      <Separator />
      <Unit value={timeLeft.hours} label="horas" />
      <Separator />
      <Unit value={timeLeft.minutes} label="min" />
      <Separator />
      <Unit value={timeLeft.seconds} label="seg" />
    </div>
  );
}
