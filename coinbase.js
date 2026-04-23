// ================================================================
// coinbase.js — Lenovox LNX Coin System (Firestore-based)
// All balances live in Firestore — synced across devices
// Replaces old localStorage version completely
// ================================================================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, addDoc,
  collection, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./auth.js";

// Re-use existing Firebase app
function getDB() {
  return getFirestore();
}

/**
 * Get a user's current LNX balance from Firestore
 */
export async function importBalance(userId) {
  if (!userId) return 0;
  try {
    const snap = await getDoc(doc(getDB(), "wallets", userId));
    return snap.exists() ? (snap.data().balance || 0) : 0;
  } catch {
    // Fallback to localStorage if Firestore unavailable
    const accounts = JSON.parse(localStorage.getItem("lenovox_accounts") || "{}");
    return accounts[userId]?.balance || 0;
  }
}

/**
 * Add or update user account in Firestore
 */
export async function addOrUpdateAccount({ id, name, balance }) {
  if (!id) return null;
  try {
    const db = getDB();
    const walletRef = doc(db, "wallets", id);
    const snap = await getDoc(walletRef);
    if (!snap.exists()) {
      await updateDoc(walletRef, { balance: balance || 0, totalEarned: 0, totalSpent: 0 }).catch(() => {});
    } else if (balance !== undefined) {
      await updateDoc(walletRef, { balance });
    }
    return { id, name, balance: balance || 0 };
  } catch {
    return null;
  }
}

/**
 * Add a transaction — credits or debits LNX
 * Amount positive = credit, negative = debit
 */
export async function addTransaction(userId, type, amount) {
  if (!userId || !amount) return null;
  try {
    const db = getDB();
    // Update wallet balance
    await updateDoc(doc(db, "wallets", userId), {
      balance: increment(amount),
      ...(amount > 0 ? { totalEarned: increment(amount) } : { totalSpent: increment(Math.abs(amount)) })
    });
    // Update user lnxBalance
    await updateDoc(doc(db, "users", userId), {
      lnxBalance: increment(amount)
    }).catch(() => {});
    // Log transaction
    const tx = await addDoc(collection(db, "wallets", userId, "transactions"), {
      id: "TX" + Date.now(),
      type,
      amount,
      date: new Date().toLocaleString(),
      timestamp: serverTimestamp()
    });
    // Dispatch update event for dashboard
    window.dispatchEvent(new CustomEvent("coinbaseUpdate", {
      detail: { userId, amount, type }
    }));
    return { id: tx.id, type, amount };
  } catch (e) {
    console.error("addTransaction error:", e);
    // Fallback — update localStorage as backup
    try {
      const accounts = JSON.parse(localStorage.getItem("lenovox_accounts") || "{}");
      if (!accounts[userId]) accounts[userId] = { balance: 0 };
      accounts[userId].balance += amount;
      localStorage.setItem("lenovox_accounts", JSON.stringify(accounts));
      window.dispatchEvent(new CustomEvent("coinbaseUpdate", { detail: { userId, amount, type } }));
    } catch {}
    return null;
  }
}

/**
 * Get recent transactions for a user
 */
export async function importTransactions(userId) {
  if (!userId) return [];
  try {
    const db = getDB();
    const { getDocs, query, orderBy, limit } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const snap = await getDocs(
      query(collection(db, "wallets", userId, "transactions"), orderBy("timestamp", "desc"), limit(50))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return JSON.parse(localStorage.getItem("lenovox_transactions") || "{}")[userId] || [];
  }
}

/**
 * Check if user has enough LNX balance
 */
export async function hasBalance(userId, required) {
  const bal = await importBalance(userId);
  return bal >= required;
}

/**
 * Deduct LNX — returns false if insufficient balance
 */
export async function deductLNX(userId, amount, reason) {
  const bal = await importBalance(userId);
  if (bal < amount) return false;
  await addTransaction(userId, reason || "Deduction", -amount);
  return true;
}
