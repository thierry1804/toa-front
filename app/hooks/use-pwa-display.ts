import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");

  media.addEventListener("change", onStoreChange);
  window.addEventListener("resize", onStoreChange);

  return () => {
    media.removeEventListener("change", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

function getSnapshot() {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)");
  const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)");
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return (
    standaloneMedia.matches ||
    fullscreenMedia.matches ||
    iosStandalone
  );
}

function getServerSnapshot() {
  return false;
}

/** True when the app runs as an installed PWA (standalone / fullscreen). */
export function usePwaDisplay() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
