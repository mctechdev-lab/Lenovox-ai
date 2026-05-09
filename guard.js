// guard.js — Fixed: uses clean URLs (no .html extension) + Guest Mode Support
import { getSession, clearSession } from "./session.js";

export async function protectApp() {
  // Check for guest mode first
  const isGuest = localStorage.getItem('guestMode') === 'true';
  const guestUser = localStorage.getItem('guestUser');
  
  if (isGuest && guestUser) {
    // Guest mode is active, allow access
    return;
  }
  
  // Check regular session
  const session = await getSession();

  if (!session) {
    window.location.replace("login");
    return;
  }

  if (Date.now() > session.expiresAt) {
    await clearSession();
    window.location.replace("login");
    return;
  }
}

// Helper to check if current user is guest
export function isGuestMode() {
  return localStorage.getItem('guestMode') === 'true';
}

// Helper to get guest user data
export function getGuestUser() {
  const data = localStorage.getItem('guestUser');
  return data ? JSON.parse(data) : null;
}

// Helper to exit guest mode
export function exitGuestMode() {
  localStorage.removeItem('guestMode');
  localStorage.removeItem('guestUser');
  window.location.replace("login");
}
