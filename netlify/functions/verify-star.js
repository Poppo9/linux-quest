// POST /.netlify/functions/verify-star
// Headers: Authorization: Bearer <supabase_access_token>
// Body:    { github_token: string }
// Returns: { starred: bool }
//
// Uses only native fetch (Node 18+) — no npm dependencies required.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const jwt = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const { github_token } = body;

  if (!jwt || !github_token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing authorization token or github_token' }),
    };
  }

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify JWT via Supabase Auth REST API
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    };
  }

  const user = await userRes.json();

  // Check star status via GitHub API
  let starred = false;
  try {
    const ghRes = await fetch('https://api.github.com/user/starred/Poppo9/linux-quest', {
      headers: {
        Authorization: `Bearer ${github_token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'linux-quest-app',
      },
    });
    starred = ghRes.status === 204;
  } catch {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GitHub API unreachable' }),
    };
  }

  if (starred) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ is_premium: true, premium_since: new Date().toISOString() }),
    });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starred }),
  };
};
