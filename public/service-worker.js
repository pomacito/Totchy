/**
 * Мінімальний, свідомо обережний service worker.
 *
 * Принцип: НІКОЛИ не кешувати відповіді, що містять правовий статус
 * (API-запити, серверно-рендерені сторінки) — система завжди показує дату
 * актуальності поруч із висновком, і мовчазний кеш зробив би цю гарантію
 * хибною (ризик показати застарілий статус без відповідної позначки,
 * якого явно вимагає уникати ТЗ, розділ 13). Тому цей SW кешує лише
 * статичну "оболонку" застосунку (іконки, маніфест, шрифти) та підміняє
 * мережеву помилку офлайн-заглушкою для навігацій — не більше.
 */

const SHELL_CACHE = "status-terytorii-shell-v1";
const OFFLINE_URL = "/offline.html";

// Примітка: шрифти в public/fonts/ використовуються лише сервером (для
// кирилізації PDF-звітів через @react-pdf/renderer) і ніколи не
// завантажуються браузером — тому їх немає сенсу кешувати тут.
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isShellAsset(url) {
  return url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest";
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // POST/PUT тощо завжди йдуть напряму в мережу

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // сторонні запити не перехоплюємо

  // Статична оболонка: cache-first, безпечно (не містить правових даних).
  if (isShellAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Навігація (HTML-сторінки): завжди йти в мережу; лише за повної
  // відсутності з'єднання показати офлайн-заглушку замість системної
  // помилки браузера. Жодного кешу сторінок з даними про статус.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Усе інше (API, JS/CSS-бандли Next.js тощо) — без втручання SW,
  // звичайна поведінка мережі/HTTP-кешу браузера.
});
