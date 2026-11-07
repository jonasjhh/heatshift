import { useEffect } from "react";

// Keeps the screen on while in a lobby: a sleeping phone drops its
// connection and misses the start of a round. Re-acquired whenever the page
// becomes visible again, since the browser releases it on hide.
export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let active = true;

    const acquire = async () => {
      if (document.visibilityState !== "visible" || lock) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (!active) {
          void sentinel.release();
          return;
        }
        lock = sentinel;
        sentinel.addEventListener("release", () => {
          if (lock === sentinel) lock = null;
        });
      } catch {
        // Denied (e.g. battery saver); the app still works.
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, []);
}
