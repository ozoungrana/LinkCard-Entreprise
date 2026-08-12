"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        online ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
      }`}
    >
      {online ? (
        <Wifi className="size-5 text-success" />
      ) : (
        <WifiOff className="size-5 text-warning" />
      )}
      <div className="flex-1">
        <div className="text-sm font-medium">
          {online ? "Vous êtes en ligne" : "Mode hors-ligne"}
        </div>
        <div className="text-xs text-muted-foreground">
          {online
            ? "Toutes les fonctionnalités sont disponibles"
            : "La dernière carte publique consultée reste disponible en cache"}
        </div>
      </div>
    </div>
  );
}
