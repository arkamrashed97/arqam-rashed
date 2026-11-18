const ALLOWED_ORIGIN_RE = /^https:\/\/(?:(?:www\.)?arqamrashed\.com|[a-z0-9-]+\.arqam-rashed\.pages\.dev)$|^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_POSTS = 5;
const postHitsByIp = new Map();

function buildHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGIN_RE.test(origin) ? origin : 'https://arqamrashed.com';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  };
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (postHitsByIp.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_POSTS) {
    postHitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  postHitsByIp.set(ip, recent);
  return false;
}

function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[<>"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 22);
}

async function readTableScores(sbUrl, sbKey) {
  if (!sbUrl || !sbKey) return [];
  try {
    const res = await fetch(
      `${sbUrl}/rest/v1/fishing_leaderboard?select=name,score,caught,created_at&order=score.desc&limit=25`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function mergeTopScores(...lists) {
  const byName = new Map();
  for (const list of lists) {
    for (const item of list) {
      if (!item || typeof item.name !== 'string') continue;
      const name = cleanName(item.name);
      const score = Math.max(0, Math.min(999999, parseInt(item.score, 10) || 0));
      const caught = Math.max(0, Math.min(99999, parseInt(item.caught, 10) || 0));
      if (!name || score <= 0) continue;
      const key = name.toLowerCase();
      const prev = byName.get(key);
      if (!prev || score > prev.score) {
        byName.set(key, {
          name,
          score,
          caught,
          created_at: item.created_at || new Date().toISOString()
        });
      }
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.score - a.score);
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = buildHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Gate active leaderboard writes unless explicitly enabled in Cloudflare environment
  const enabled = env.ENABLE_LEADERBOARD === 'true';
  const sbUrl = env.SUPABASE_URL || '';
  const sbSvc = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const sbPub = env.SUPABASE_PUBLISHABLE_KEY || '';
  const authKey = sbSvc || sbPub;

  if (request.method === 'GET') {
    if (!enabled || !sbUrl || !authKey) {
      return new Response(JSON.stringify({ ok: true, scores: [] }), { status: 200, headers });
    }
    const tableScores = await readTableScores(sbUrl, authKey);
    const merged = mergeTopScores(tableScores).slice(0, 10);
    return new Response(JSON.stringify({ ok: true, scores: merged }), { status: 200, headers });
  }

  if (request.method === 'POST') {
    if (!enabled) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Leaderboard submissions are currently disabled' }),
        { status: 403, headers }
      );
    }

    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED_ORIGIN_RE.test(origin)) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden origin' }), { status: 403, headers });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ ok: false, error: 'Too many submissions' }), { status: 429, headers });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400, headers });
    }

    const name = cleanName(body.name);
    const score = Math.max(0, Math.min(999999, parseInt(body.score, 10) || 0));
    const caught = Math.max(0, Math.min(99999, parseInt(body.caught, 10) || 0));

    if (!name || score <= 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Name and positive score required' }),
        { status: 400, headers }
      );
    }

    const entry = {
      name,
      score,
      caught,
      created_at: new Date().toISOString()
    };

    if (sbUrl && sbSvc) {
      await fetch(`${sbUrl}/rest/v1/fishing_leaderboard`, {
        method: 'POST',
        headers: {
          apikey: sbSvc,
          Authorization: `Bearer ${sbSvc}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(entry)
      }).catch(() => {});
    }

    const latest = sbUrl && authKey ? await readTableScores(sbUrl, authKey) : [entry];
    return new Response(
      JSON.stringify({ ok: true, scores: mergeTopScores(latest, [entry]).slice(0, 10) }),
      { status: 200, headers }
    );
  }

  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers });
}
