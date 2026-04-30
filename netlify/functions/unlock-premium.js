// Honor-system premium unlock: verifies Supabase JWT then sets is_premium = true.
// Uses service role to bypass RLS — no GitHub verification performed.
exports.handler = async (event) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const jwt = (event.headers.authorization || '').replace('Bearer ', '').trim();
  if (!jwt) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: SERVICE_KEY }
  });
  if (!userRes.ok) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
  const { id: userId } = await userRes.json();

  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ is_premium: true })
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return { statusCode: 500, body: JSON.stringify({ error: err }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
