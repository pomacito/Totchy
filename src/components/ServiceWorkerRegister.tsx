"use client";

import { useEffect } from "react";

/** Реєструє service worker для PWA. Мовчазно не робить нічого, якщо API недоступне (наприклад, http на не-localhost). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Реєстрація може не вдатися (напр. незахищений origin, крім localhost) —
      // застосунок повністю функціональний і без SW, тому це не критична помилка.
    });
  }, []);

  return null;
}
