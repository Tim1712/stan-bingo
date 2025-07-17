// pages/reset.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ResetPage() {
  const router = useRouter();

  useEffect(() => {
    // Remove the stored card IDs so a fresh card will be generated
    localStorage.removeItem("stanBingoCardIds");
    localStorage.removeItem("hasSeenRules");
    // Redirect back to the homepage
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      🔄 Kaart wordt vernieuwd…
    </div>
  );
}
