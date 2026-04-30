// Requires: window.supabase (CDN), SUPABASE_URL, SUPABASE_ANON_KEY (js/config.js)
// Gracefully degrades to no-auth mode when config.js is missing

let _client = null;
try {
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('Supabase config missing — running in offline/no-auth mode');
}

let _currentUser  = null;
let _isPremium    = false;
let _onAuthChange = null;

const LS_PROGRESS_KEY = 'lq-progress';

// Pre-populate _currentUser synchronously from Supabase's localStorage entry so
// renderAuthUI() shows the correct state immediately on page load, without waiting
// for the async INITIAL_SESSION event (which would cause a "Sign in" flash).
// onAuthStateChange remains authoritative and overwrites this if the session is stale.
;(function () {
  try {
    const ref = (typeof SUPABASE_URL !== 'undefined') &&
                SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1];
    if (!ref) return;
    const raw = localStorage.getItem('sb-' + ref + '-auth-token');
    const stored = raw && JSON.parse(raw);
    if (stored?.user) _currentUser = stored.user;
  } catch (_) { /* ignore parse errors */ }
})();

// Sections 1-3 are free. Section 4+ require a GitHub star on Poppo9/linux-quest.
const GATE_STAR = { sectionId: 'file-content' };

// ─── Session helpers ──────────────────────────────────────────────────────────

function getUser()   { return _currentUser; }
function isPremium() { return _isPremium; }

// ─── Auth actions ─────────────────────────────────────────────────────────────

async function signInWithGitHub() {
  if (!_client) return;
  await _client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.href },
  });
}

async function signOut() {
  _currentUser   = null;
  _isPremium     = false;
  _providerToken = null;
  if (_client) await _client.auth.signOut();
  window.location.reload();
}

// ─── Star verification ────────────────────────────────────────────────────────

// Calls the Netlify Function to verify the GitHub star and unlock premium.
// Reloads the page on success so the sidebar re-renders with all sections unlocked.
async function verifyGithubStar(githubToken) {
  if (!_client) return false;

  const btn = document.getElementById('premium-verify-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Verifying…'; }

  try {
    const { data: { session } } = await _client.auth.getSession();
    const token = githubToken || session?.provider_token;

    if (!token) {
      // No provider_token available — re-trigger OAuth to get a fresh one.
      // SIGNED_IN will fire again with provider_token and auto-verify.
      if (btn) btn.textContent = 'Redirecting to GitHub…';
      await signInWithGitHub();
      return false;
    }

    const res = await fetch('/.netlify/functions/verify-star', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ github_token: token }),
    });

    const json = await res.json();

    if (json.starred) {
      _isPremium = true;
      if (btn) { btn.textContent = '✓ Verified! Reloading…'; }
      window.location.reload();
      return true;
    }

    if (btn) {
      btn.disabled    = false;
      btn.textContent = 'Not starred yet — try again';
      setTimeout(() => {
        if (btn) btn.textContent = "I've starred it — verify ✓";
      }, 3000);
    }
    return false;
  } catch (err) {
    console.error('Star verification error:', err);
    if (btn) { btn.disabled = false; btn.textContent = "I've starred it — verify ✓"; }
    return false;
  }
}

// ─── Progress sync ────────────────────────────────────────────────────────────

async function loadRemoteProgress(userId) {
  if (!_client) return {};
  const { data, error } = await _client
    .from('progress')
    .select('section_id, lesson_id, challenge_idx')
    .eq('user_id', userId);

  if (error || !data) return {};

  return data.reduce((acc, row) => {
    if (!acc[row.section_id]) acc[row.section_id] = {};
    if (!acc[row.section_id][row.lesson_id]) acc[row.section_id][row.lesson_id] = {};
    acc[row.section_id][row.lesson_id][row.challenge_idx] = true;
    return acc;
  }, {});
}

async function pushProgressRow(userId, sectionId, lessonId, challengeIdx) {
  if (!_client) return;
  return await _client.from('progress').upsert(
    { user_id: userId, section_id: sectionId, lesson_id: lessonId, challenge_idx: challengeIdx },
    { onConflict: 'user_id,section_id,lesson_id,challenge_idx' }
  );
}

function _deepUnion(a, b) {
  const result = structuredClone(a);
  for (const sId of Object.keys(b)) {
    if (!result[sId]) result[sId] = {};
    for (const lId of Object.keys(b[sId])) {
      if (!result[sId][lId]) result[sId][lId] = {};
      for (const idx of Object.keys(b[sId][lId])) {
        result[sId][lId][idx] = true;
      }
    }
  }
  return result;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function loadProfile(userId) {
  if (!_client) return false;
  const { data } = await _client
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();
  _isPremium = data?.is_premium ?? false;
  return _isPremium;
}

async function syncOnLogin(userId, localProgress) {
  await loadProfile(userId);
  const remote = await loadRemoteProgress(userId);
  const merged = _deepUnion(localProgress, remote);
  localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(merged));

  const pushes = [];
  for (const sId of Object.keys(merged)) {
    for (const lId of Object.keys(merged[sId])) {
      for (const idx of Object.keys(merged[sId][lId])) {
        if (!remote[sId]?.[lId]?.[idx]) {
          pushes.push(pushProgressRow(userId, sId, lId, Number(idx)));
        }
      }
    }
  }
  await Promise.allSettled(pushes);
  return merged;
}

// ─── Gate logic ───────────────────────────────────────────────────────────────

// Returns the gate type blocking access to a section, or null if accessible.
// allSectionIds: ordered array of section IDs from lessons.json
function getGateForSection(sectionId, allSectionIds) {
  const starIdx = allSectionIds.indexOf(GATE_STAR.sectionId);
  const sIdx    = allSectionIds.indexOf(sectionId);
  if (starIdx !== -1 && sIdx > starIdx && !_isPremium) return 'premium';
  return null;
}

// Called at lesson boundaries. Returns 'premium' if the star gate is hit, null otherwise.
function checkGate(sectionId, lessonId, isLastLessonInSection) {
  if (!_isPremium && sectionId === GATE_STAR.sectionId && isLastLessonInSection) {
    return 'premium';
  }
  return null;
}

function _openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
}

// type is always 'premium' now — kept for API compatibility with lessons.js
function showGateModal(type) {
  document.getElementById('premium-modal').classList.remove('hidden');
}

// ─── Auth lifecycle ───────────────────────────────────────────────────────────

async function unlockPremium() {
  _isPremium = true;
  document.getElementById('premium-modal')?.classList.add('hidden');
  if (_client && _currentUser) {
    const { data } = await _client.auth.getSession();
    const jwt = data.session?.access_token;
    if (jwt) {
      fetch('/.netlify/functions/unlock-premium', {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` }
      }).catch(() => {});
    }
  }
  if (_onAuthChange) _onAuthChange('premium_unlocked', _currentUser, null);
}

function initAuth(onAuthChange) {
  _onAuthChange = onAuthChange;
  if (!_client) return;
  _client.auth.onAuthStateChange(async (event, session) => {
    // INITIAL_SESSION fires on page load when a session already exists (Supabase v2)
    // SIGNED_IN fires after a fresh login or OAuth redirect
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
      _currentUser   = session.user;
      _providerToken = session.provider_token || null;

      const local  = JSON.parse(localStorage.getItem(LS_PROGRESS_KEY) || '{}');
      const merged = await syncOnLogin(session.user.id, local);
      _updateNavUI(session.user);

      document.getElementById('auth-modal')?.classList.add('hidden');

      // Auto-verify star on fresh OAuth login when provider_token is available
      if (_providerToken && !_isPremium) {
        verifyGithubStar(_providerToken);
      }

      if (onAuthChange) onAuthChange('signed_in', session.user, merged);
    } else if (event === 'SIGNED_OUT') {
      _currentUser   = null;
      _isPremium     = false;
      _providerToken = null;
      _updateNavUI(null);
      if (onAuthChange) onAuthChange('signed_out', null, null);
    }
  });
}

// ─── Nav UI ───────────────────────────────────────────────────────────────────

function renderAuthUI() {
  const nav = document.getElementById('nav-auth');
  if (!nav) return;

  if (_currentUser) {
    const displayName = _currentUser.user_metadata?.user_name || _currentUser.email || '';
    nav.innerHTML = `
      <span id="nav-user-email" class="text-xs font-terminal text-slate-500 dark:text-slate-400 hidden sm:inline"></span>
      <button id="auth-signout-btn"
        class="text-xs font-terminal px-3 py-1.5 rounded transition-colors cursor-pointer
               text-slate-600 dark:text-slate-400
               hover:text-slate-900 dark:hover:text-white
               border border-slate-300 dark:border-slate-700
               hover:border-slate-400 dark:hover:border-slate-500">
        Log out
      </button>`;
    document.getElementById('nav-user-email').textContent = displayName;
    document.getElementById('auth-signout-btn').addEventListener('click', () => signOut());
  } else {
    nav.innerHTML = `
      <button id="auth-signin-btn"
        class="text-xs font-terminal px-3 py-1.5 rounded transition-colors cursor-pointer
               text-slate-600 dark:text-slate-300
               hover:text-slate-900 dark:hover:text-white
               border border-slate-300 dark:border-slate-700
               hover:border-slate-400 dark:hover:border-slate-500">
        Sign in
      </button>`;
    document.getElementById('auth-signin-btn').addEventListener('click', () => _openAuthModal());
  }

  _initModals();
}

function _updateNavUI(user) {
  renderAuthUI();
}

function _initModals() {
  const authModal = document.getElementById('auth-modal');
  if (authModal && !authModal.dataset.wired) {
    authModal.dataset.wired = '1';

    const closeAuthModal = () => authModal.classList.add('hidden');

    authModal.addEventListener('click', e => {
      if (e.target === authModal) closeAuthModal();
    });

    document.getElementById('auth-close-x')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-github-btn')?.addEventListener('click', () => signInWithGitHub());
  }

  const premiumModal = document.getElementById('premium-modal');
  if (premiumModal && !premiumModal.dataset.wired) {
    premiumModal.dataset.wired = '1';

    const closePremiumModal = () => premiumModal.classList.add('hidden');

    premiumModal.addEventListener('click', e => {
      if (e.target === premiumModal) closePremiumModal();
    });

    document.getElementById('premium-close')?.addEventListener('click', closePremiumModal);
    document.getElementById('premium-close-x')?.addEventListener('click', closePremiumModal);
    document.getElementById('premium-verify-btn')?.addEventListener('click', unlockPremium);
  }

  if (!document.body.dataset.escWired) {
    document.body.dataset.escWired = '1';
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      document.getElementById('auth-modal')?.classList.add('hidden');
      document.getElementById('premium-modal')?.classList.add('hidden');
    });
  }
}
