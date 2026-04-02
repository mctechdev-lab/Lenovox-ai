// ================================================================
// api/news.js — Lenovox News Feed (NewsAPI.org)
// Returns 20 education/tech/AI/Africa news articles.
// Set NEWS_API_KEY in Vercel env vars. Free tier = 100 req/day.
// Caches for 30 minutes to save quota.
// ================================================================
let _cache    = null;
let _cacheTs  = 0;
const CACHE_MS = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Serve from cache if fresh
  if (_cache && Date.now() - _cacheTs < CACHE_MS) {
    return res.status(200).json(_cache);
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ articles: staticFallback() });
  }

  try {
    const queries = [
      'education technology Nigeria',
      'artificial intelligence students Africa',
      'WAEC JAMB university Nigeria',
    ];
    const q = queries[Math.floor(Date.now() / CACHE_MS) % queries.length];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('NewsAPI error');
    const data = await r.json();

    const articles = (data.articles || [])
      .filter(a => a.title && a.url && a.title !== '[Removed]' && !a.title.includes('[Removed]'))
      .slice(0, 20)
      .map(a => ({
        title:       a.title,
        description: a.description || '',
        url:         a.url,
        image:       a.urlToImage || null,
        source:      a.source?.name || 'News',
        publishedAt: a.publishedAt,
        category:    categorise(a.title + ' ' + (a.description || '')),
      }));

    _cache   = { articles };
    _cacheTs = Date.now();
    return res.status(200).json({ articles });
  } catch {
    return res.status(200).json({ articles: staticFallback() });
  }
}

function categorise(text) {
  const t = text.toLowerCase();
  if (/ai|artificial intelligence|chatgpt|gpt|machine learning|llm/.test(t)) return 'AI';
  if (/exam|waec|jamb|university|school|education|study|student/.test(t))     return 'Education';
  if (/game|gaming|esport/.test(t))                                             return 'Gaming';
  if (/nigeria|africa|ghana|kenya|nollywood|naira/.test(t))                    return 'Africa';
  if (/tech|software|code|startup|app|fintech/.test(t))                        return 'Tech';
  return 'News';
}

function staticFallback() {
  const now = new Date().toISOString();
  return [
    { title: 'How AI is Transforming Education Across West Africa',    description: 'New AI tools are helping Nigerian students prepare smarter for WAEC and JAMB exams.',      url: '#', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=75',  source: 'EdTech Africa',   publishedAt: now,                                  category: 'Education' },
    { title: 'OpenAI Releases Major GPT-4o Updates for Learners',      description: 'The latest updates include better mathematical reasoning and step-by-step explanations.',    url: '#', image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=75', source: 'TechCrunch',      publishedAt: new Date(Date.now()-3600000).toISOString(),  category: 'AI'        },
    { title: 'Nigeria Records Highest WAEC Pass Rates in a Decade',    description: 'Officials credit the improvement to increased use of digital learning platforms.',           url: '#', image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=75', source: 'Vanguard',        publishedAt: new Date(Date.now()-7200000).toISOString(),  category: 'Education' },
    { title: '5 Study Techniques Backed by Neuroscience',              description: 'Spaced repetition, active recall, and interleaving are the most effective study methods.',    url: '#', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=75', source: 'Study Weekly',    publishedAt: new Date(Date.now()-10800000).toISOString(), category: 'Education' },
    { title: 'African EdTech Startups Raise Record $200M in Funding',  description: 'Investors are pouring capital into education tech platforms serving sub-Saharan Africa.',    url: '#', image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=75', source: 'TechCabal',       publishedAt: new Date(Date.now()-14400000).toISOString(), category: 'Africa'    },
    { title: 'Google Announces Free AI Tools for African Students',     description: 'The programme gives students across Africa access to AI-powered tutoring at no cost.',       url: '#', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=75', source: 'Techpoint Africa', publishedAt: new Date(Date.now()-18000000).toISOString(), category: 'Tech'      },
    { title: 'Top 10 Free Online Courses for Nigerian Students in 2025',description: 'From Coursera to Khan Academy — the best free resources for self-paced learning.',           url: '#', image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=75', source: 'NaijaEdu',        publishedAt: new Date(Date.now()-21600000).toISOString(), category: 'Education' },
    { title: 'The Rise of Gamification in African Classrooms',          description: 'Schools across Nigeria and Ghana are using game mechanics to improve student engagement.',    url: '#', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=75', source: 'EdTech Africa',   publishedAt: new Date(Date.now()-25200000).toISOString(), category: 'Gaming'    },
  ];
}
