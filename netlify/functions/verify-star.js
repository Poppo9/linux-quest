// POST /.netlify/functions/verify-star
// Headers: Authorization: Bearer <supabase_access_token>
// Body:    { github_token: string }
// Returns: { starred: bool }
//
// Checks whether the authenticated Supabase user has starred Poppo9/linux-quest on GitHub.
// On success, sets profiles.is_premium = true via service_role key.

const { createClient } = require('@supabase/supabase-js');

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

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);
  if (userError || !user) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    };
  }

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
    await adminClient
      .from('profiles')
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq('id', user.id);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starred }),
  };
};
