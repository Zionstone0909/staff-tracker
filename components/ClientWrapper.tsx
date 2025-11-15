// components/ClientWrapper.tsx
"use client"; // Must be first line

import { useEffect, useState, ReactNode } from "react";

interface ClientWrapperProps {
  children?: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensure code only runs on the client
  }, []);

  if (!mounted) return null; // Prevent SSR content mismatch

  return <>{children}</>;
}
