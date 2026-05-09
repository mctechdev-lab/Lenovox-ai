// ============================================================
// guest-mode.js — Guest Mode UI Components & Utilities
// ============================================================

import { isGuestMode, getGuestUser, exitGuestMode } from "./guard.js";

// Initialize guest mode UI on page load
export function initGuestMode() {
  if (!isGuestMode()) return;

  // Add guest banner to body
  addGuestBanner();
  
  // Add CSS for guest mode elements
  addGuestStyles();
}

// Add banner at top of page indicating guest mode
function addGuestBanner() {
  const banner = document.createElement('div');
  banner.id = 'guestBanner';
  banner.innerHTML = `
    <div class="guest-banner-content">
      <div class="guest-info">
        <i class="fas fa-eye"></i>
        <span>Guest Mode - Limited Features</span>
      </div>
      <div class="guest-actions">
        <button class="guest-signup-btn" onclick="window.location.href='signup'">
          <i class="fas fa-user-plus"></i>
          Sign Up Free
        </button>
      </div>
    </div>
  `;
  document.body.prepend(banner);
}

// Add CSS styles for guest mode
function addGuestStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #guestBanner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, rgba(157, 80, 187, 0.95), rgba(0, 210, 255, 0.85));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 10px 20px;
      z-index: 999999;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.4s ease;
    }
    
    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    
    .guest-banner-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    .guest-info {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
    }
    
    .guest-info i {
      font-size: 1.1rem;
    }
    
    .guest-actions {
      display: flex;
      gap: 8px;
    }
    
    .guest-signup-btn {
      background: #fff;
      color: #6d28d9;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .guest-signup-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    }
    
    .guest-signup-btn i {
      font-size: 0.9rem;
    }
    
    /* Push content down to account for banner */
    body.has-guest-banner {
      padding-top: 50px !important;
    }
    
    /* Guest locked feature overlay */
    .guest-locked-overlay {
      position: absolute;
      inset: 0;
      background: rgba(3, 3, 11, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      border-radius: 16px;
      z-index: 10;
      padding: 24px;
      text-align: center;
    }
    
    .guest-locked-icon {
      font-size: 3rem;
      color: #ffcc33;
      animation: lockShake 0.5s ease;
    }
    
    @keyframes lockShake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }
    
    .guest-locked-title {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      font-family: 'Orbitron', monospace;
    }
    
    .guest-locked-desc {
      color: #8892a4;
      font-size: 0.9rem;
      max-width: 320px;
    }
    
    .guest-unlock-btn {
      background: linear-gradient(135deg, #00d2ff, #3a7bd5);
      color: #fff;
      border: none;
      padding: 12px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      box-shadow: 0 8px 24px rgba(0, 210, 255, 0.3);
      transition: all 0.3s;
    }
    
    .guest-unlock-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(0, 210, 255, 0.4);
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add('has-guest-banner');
}

// Show locked feature modal
export function showGuestLocked(featureName) {
  const modal = document.createElement('div');
  modal.className = 'guest-locked-overlay';
  modal.innerHTML = `
    <i class="fas fa-lock guest-locked-icon"></i>
    <div class="guest-locked-title">${featureName} Locked</div>
    <div class="guest-locked-desc">
      Create a free account to unlock ${featureName} and earn LNX coins!
    </div>
    <button class="guest-unlock-btn" onclick="window.location.href='signup'">
      <i class="fas fa-user-plus"></i>
      Create Free Account
    </button>
  `;
  return modal;
}

// Check if a feature is available in guest mode
export function isFeatureAvailable(featureName) {
  if (!isGuestMode()) return true;
  
  // Features available to guests (read-only)
  const allowedFeatures = [
    'view-feed',
    'view-reels',
    'browse-explore',
    'view-ai-chat',
    'view-classroom',
    'view-plans'
  ];
  
  return allowedFeatures.includes(featureName);
}

// Prevent action if in guest mode
export function preventGuestAction(callback, featureName = 'This Feature') {
  if (isGuestMode()) {
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'guest-toast';
    toast.innerHTML = `
      <i class="fas fa-lock"></i>
      <span>Sign up to use ${featureName}</span>
      <button onclick="window.location.href='signup'">Sign Up</button>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 4000);
    return;
  }
  
  // If not guest, execute the callback
  callback();
}

// Get current user (guest or real)
export function getCurrentUser() {
  if (isGuestMode()) {
    return getGuestUser();
  }
  
  // Get real user from session/Firebase
  // This would integrate with your existing auth system
  return null;
}

// Export utilities
export { isGuestMode, exitGuestMode };
