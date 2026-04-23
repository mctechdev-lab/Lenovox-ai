// guard.js — Fixed: uses clean URLs (no .html extension)
import { getSession, clearSession } from "./session.js";

export async function protectApp() {
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
