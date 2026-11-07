const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

const STORAGE_OBJECT_PATH = 'storage/v1/object/fishing-leaderboard/scores.json';
const STORAGE_PUBLIC_PATH = 'storage/v1/object/public/fishing-leaderboard/scores.json';

function cleanName(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[<>"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 22);
}

async function readStorageScores(sbUrl, sbKey) {
  try {
    const res = await fetch(`${sbUrl}/${STORAGE_PUBLIC_PATH}?t=${Date.now()}`, {
      headers: sbKey ? { apikey: sbKey, Authorization: `Bearer ${sbKey}` } : {}
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

async function readTableScores(sbUrl, sbKey) {
  if (!sbKey) return [];
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

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const sbUrl = env.SUPABASE_URL || 'https://qsbuqfkkevrbdxrebsln.supabase.co';
  const sbSvc = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const sbPub = env.SUPABASE_PUBLISHABLE_KEY || '';
  const authKey = sbSvc || sbPub;

  if (request.method === 'GET') {
    const [storageScores, tableScores] = await Promise.all([
      readStorageScores(sbUrl, authKey),
      readTableScores(sbUrl, authKey)
    ]);
    const merged = mergeTopScores(storageScores, tableScores).slice(0, 10);
    return new Response(JSON.stringify({ ok: true, scores: merged }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  if (request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const name = cleanName(body.name);
    const score = Math.max(0, Math.min(999999, parseInt(body.score, 10) || 0));
    const caught = Math.max(0, Math.min(99999, parseInt(body.caught, 10) || 0));

    if (!name || score <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Name and positive score required' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const entry = {
      name,
      score,
      caught,
      created_at: new Date().toISOString()
    };

    const existing = await readStorageScores(sbUrl, authKey);
    const updated = mergeTopScores(existing, [entry]).slice(0, 100);

    if (sbSvc) {
      await fetch(`${sbUrl}/${STORAGE_OBJECT_PATH}`, {
        method: 'POST',
        headers: {
          apikey: sbSvc,
          Authorization: `Bearer ${sbSvc}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: JSON.stringify(updated)
      }).catch(() => {});

      // Also insert into Postgres table fishing_leaderboard if it exists
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

    return new Response(JSON.stringify({ ok: true, scores: updated.slice(0, 10) }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
    status: 405,
    headers: CORS_HEADERS
  });
}
