// Fire-and-forget click events. They only show up in the server logs (see /api/track); nothing
// personal is sent, just which seller was picked and the fare.
export function trackEvent(event: Record<string, string | number | boolean>) {
  try {
    const body = new Blob([JSON.stringify(event)], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", body)) {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    // Tracking must never get in the way of booking.
  }
}
