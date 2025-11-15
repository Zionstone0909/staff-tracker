// components/DynamicClock.tsx
"use client";

import { useEffect, useState } from "react";

export default function DynamicClock() {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 text-lg font-medium">
      Current Time: {new Date(time).toLocaleTimeString()}
    </div>
  );
}
