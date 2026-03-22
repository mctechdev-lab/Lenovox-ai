// guard.js

import { getSession, clearSession } from "./session.js";

export async function protectApp() {
  const session = await getSession();

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  if (Date.now() > session.expiresAt) {
    await clearSession();
    window.location.replace("login.html");
    return;
  }
}
