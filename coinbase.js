// coinbase.js - Global System for managing balances and transactions
// This file acts as the single source of truth for all coin-related activities

let accounts = JSON.parse(localStorage.getItem('lenovox_accounts')) || {};
let transactions = JSON.parse(localStorage.getItem('lenovox_transactions')) || {};

function persistData() {
    localStorage.setItem('lenovox_accounts', JSON.stringify(accounts));
    localStorage.setItem('lenovox_transactions', JSON.stringify(transactions));
}

/**
 * Add or update a user account
 */
export async function addOrUpdateAccount({ id, name, balance }) {
    if (!accounts[id]) {
        accounts[id] = { name, balance: balance || 0 };
        transactions[id] = [];
    } else {
        accounts[id].name = name;
        if (balance !== undefined) accounts[id].balance = balance;
    }
    persistData();
    return accounts[id];
}

/**
 * Add a new transaction (Game win, study reward, etc.)
 * This will automatically update the balance shown on the dashboard
 */
export async function addTransaction(userId, type, amount) {
    if (!transactions[userId]) transactions[userId] = [];
    
    const newTx = {
        id: 'TX' + Date.now(),
        type, // e.g., 'Game Reward', 'Study Bonus'
        amount,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
    };
    
    transactions[userId].push(newTx);
    
    if (accounts[userId]) {
        accounts[userId].balance += amount;
    }
    
    persistData();
    
    // Dispatch a global event so the dashboard can update instantly
    window.dispatchEvent(new CustomEvent('coinbaseUpdate', { detail: { userId, balance: accounts[userId].balance } }));
    
    return newTx;
}

export async function importBalance(userId) {
    return accounts[userId] ? accounts[userId].balance : 0;
}

export async function importTransactions(userId) {
    return transactions[userId] || [];
}
