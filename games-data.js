// ================================================================
// games-data.js — Lenovox AI Games Data File
// All game metadata, images (Unsplash), configs in one place
// ================================================================

export const GAMES = [
  {
    id: 'subway',
    name: 'Subway Run',
    desc: 'Swipe left/right to dodge trains and collect coins!',
    icon: 'fa-person-running',
    color: '#f97316',
    gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
    shadow: 'rgba(249,115,22,.4)',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=220&fit=crop&auto=format',
    reward: 25,
    label: 'Up to 25 LNX',
    badge: 'HOT',
    badgeColor: '#ef4444',
    category: 'action'
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    desc: 'Beat the AI in this classic strategy game',
    icon: 'fa-hashtag',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg,#6366f1,#4338ca)',
    shadow: 'rgba(99,102,241,.4)',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=220&fit=crop&auto=format',
    reward: 15,
    label: 'Up to 15 LNX',
    badge: 'STRATEGY',
    badgeColor: '#6366f1',
    category: 'strategy'
  },
  {
    id: 'flappy',
    name: 'Flappy Bird',
    desc: 'Tap to fly through the gaps — beat your high score!',
    icon: 'fa-dove',
    color: '#facc15',
    gradient: 'linear-gradient(135deg,#eab308,#ca8a04)',
    shadow: 'rgba(234,179,8,.4)',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=220&fit=crop&auto=format',
    reward: 20,
    label: 'Up to 20 LNX',
    badge: 'POPULAR',
    badgeColor: '#10b981',
    category: 'action'
  },
  {
    id: 'math',
    name: 'Math Blitz',
    desc: 'Answer 10 maths questions as fast as you can',
    icon: 'fa-calculator',
    color: '#00d2ff',
    gradient: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
    shadow: 'rgba(0,210,255,.4)',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=220&fit=crop&auto=format',
    reward: 10,
    label: 'Up to 10 LNX',
    badge: 'EDU',
    badgeColor: '#00d2ff',
    category: 'educational'
  },
  {
    id: 'memory',
    name: 'Memory Match',
    desc: 'Find all matching emoji pairs on the board',
    icon: 'fa-brain',
    color: '#c084fc',
    gradient: 'linear-gradient(135deg,#9d50bb,#6e3592)',
    shadow: 'rgba(157,80,187,.4)',
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=220&fit=crop&auto=format',
    reward: 15,
    label: 'Up to 15 LNX',
    badge: 'BRAIN',
    badgeColor: '#9d50bb',
    category: 'puzzle'
  },
  {
    id: 'word',
    name: 'Word Scramble',
    desc: 'Unscramble 10 educational words before time runs out',
    icon: 'fa-spell-check',
    color: '#10b981',
    gradient: 'linear-gradient(135deg,#10b981,#059669)',
    shadow: 'rgba(16,185,129,.4)',
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=220&fit=crop&auto=format',
    reward: 10,
    label: 'Up to 10 LNX',
    badge: 'WORDS',
    badgeColor: '#10b981',
    category: 'educational'
  },
  {
    id: 'reaction',
    name: 'Reaction Test',
    desc: 'Tap when the screen turns green — how fast are you?',
    icon: 'fa-bolt',
    color: '#ff3d70',
    gradient: 'linear-gradient(135deg,#ff3d70,#c82333)',
    shadow: 'rgba(255,61,112,.4)',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=220&fit=crop&auto=format',
    reward: 8,
    label: 'Up to 8 LNX',
    badge: 'SPEED',
    badgeColor: '#ff3d70',
    category: 'action'
  },
  {
    id: 'typing',
    name: 'Speed Typing',
    desc: 'Type the sentence as fast as possible — WPM counts!',
    icon: 'fa-keyboard',
    color: '#f97316',
    gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
    shadow: 'rgba(249,115,22,.4)',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=220&fit=crop&auto=format',
    reward: 12,
    label: 'Up to 12 LNX',
    badge: 'SKILL',
    badgeColor: '#f97316',
    category: 'skill'
  },
  {
    id: 'truefalse',
    name: 'True or False',
    desc: 'Science & general knowledge facts — are they true?',
    icon: 'fa-check-double',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg,#6366f1,#4338ca)',
    shadow: 'rgba(99,102,241,.4)',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=220&fit=crop&auto=format',
    reward: 10,
    label: 'Up to 10 LNX',
    badge: 'EDU',
    badgeColor: '#818cf8',
    category: 'educational'
  }
];

export const GAME_CONFIG = {
  DAILY_CAP: 200,        // Max LNX per day from games
  SESSION_CAP: 50,       // Max LNX per game session
  AD_REWARD: 30,         // LNX for watching a full rewarded ad
  AD_COOLDOWN_MINS: 30,  // Minutes between ad rewards
  AD_CLIENT: 'ca-pub-6229569177818177',
  AD_SLOT_REWARDED: '8456789012', // Your rewarded ad slot ID
};

export const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: 'fa-gamepad' },
  { id: 'action', label: 'Action', icon: 'fa-person-running' },
  { id: 'strategy', label: 'Strategy', icon: 'fa-chess' },
  { id: 'educational', label: 'Edu', icon: 'fa-graduation-cap' },
  { id: 'puzzle', label: 'Puzzle', icon: 'fa-puzzle-piece' },
  { id: 'skill', label: 'Skill', icon: 'fa-star' },
];
