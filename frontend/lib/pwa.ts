/**
 * PWA utilities — push notification subscription + Web Share API helpers.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData, (c) => c.charCodeAt(0)));
}

/** Subscribe to Web Push and return the PushSubscription for sending to the backend. */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
  });
}

/** Trigger native share sheet (falls back to clipboard copy). */
export async function shareInviteLink(tripName: string, inviteUrl: string): Promise<void> {
  const text = `Join my group trip "${tripName}" on Trivo — plan together, no group chat chaos: ${inviteUrl}`;

  if (navigator.share) {
    await navigator.share({ title: `Join: ${tripName}`, text, url: inviteUrl });
  } else {
    await navigator.clipboard.writeText(text);
    // Caller should show a "Copied!" toast
  }
}
