// Requires: window.supabase (CDN), SUPABASE_URL, SUPABASE_ANON_KEY (js/config.js)
// Gracefully degrades to no-auth mode when config.js is missing

let _client = null;
try {
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('Supabase config missing — running in offline/no-auth mode');
}

let _currentUser = null;
let _isPremium   = false;

const LS_PROGRESS_KEY = LS_PROGRESS_KEY;

// Gate positions — update these constants to move the access gates
// Registration wall fires at the end of section 1 (navigating-directories)
// Premium wall fires at the end of section 3 (file-content)
const GATE_REGISTRATION = { sectionId: 'navigating-directories' };
const GATE_PREMIUM      = { sectionId: 'file-content' };

// ─── Session helpers ──────────────────────────────────────────────────────────

function getUser()    { return _currentUser; }
function isPremium()  { return _isPremium; }

// ─── Auth actions ─────────────────────────────────────────────────────────────

async function signUp(email, password) {
  if (!_client) return { error: { message: 'Auth not configured' } };
  return await _client.auth.signUp({ email, password });
}

async function signIn(email, password) {
  if (!_client) return { error: { message: 'Auth not configured' } };
  return await _client.auth.signInWithPassword({ email, password });
}

async function signOut() {
  _currentUser = null;
  _isPremium   = false;
  if (_client) await _client.auth.signOut();
  window.location.reload();
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

// Returns the gate type that blocks access to a section, or null if accessible.
// allSectionIds: ordered array of section IDs from lessons.json
function getGateForSection(sectionId, allSectionIds) {
  const signedIn = !!_currentUser;
  const premium  = _isPremium;

  const regIdx  = allSectionIds.indexOf(GATE_REGISTRATION.sectionId);
  const premIdx = allSectionIds.indexOf(GATE_PREMIUM.sectionId);
  const sIdx    = allSectionIds.indexOf(sectionId);

  if (premIdx !== -1 && sIdx > premIdx && !premium) return 'premium';
  if (regIdx  !== -1 && sIdx > regIdx  && !signedIn) return 'registration';
  return null;
}

function checkGate(sectionId, lessonId, isLastLessonInSection) {
  const signedIn = !!_currentUser;
  const premium  = _isPremium;

  // Registration wall: end of section 1
  if (!signedIn && sectionId === GATE_REGISTRATION.sectionId && isLastLessonInSection) {
    return 'registration';
  }
  // Premium wall: end of section 3 (only for registered non-premium users)
  if (signedIn && !premium && sectionId === GATE_PREMIUM.sectionId && isLastLessonInSection) {
    return 'premium';
  }
  return null;
}

function _openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('auth-email').focus();
}

function showGateModal(type) {
  if (type === 'registration') {
    _setAuthMode('signup');
    document.getElementById('auth-modal-title').textContent = '🔒 Create a free account to continue';
    document.getElementById('auth-modal-desc').textContent =
      "You've completed the first section! Sign up to unlock File Operations and beyond.";
    _openAuthModal();
  } else if (type === 'premium') {
    document.getElementById('premium-modal').classList.remove('hidden');
  }
}

// ─── Auth lifecycle ───────────────────────────────────────────────────────────

function initAuth(onAuthChange) {
  if (!_client) return;
  _client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      _currentUser = session.user;
      const local  = JSON.parse(localStorage.getItem(LS_PROGRESS_KEY) || '{}');
      const merged = await syncOnLogin(session.user.id, local);
      _updateNavUI(session.user);
      const modal = document.getElementById('auth-modal');
      if (modal) modal.classList.add('hidden');
      if (onAuthChange) onAuthChange('signed_in', session.user, merged);
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null;
      _isPremium   = false;
      _updateNavUI(null);
      if (onAuthChange) onAuthChange('signed_out', null, null);
    }
  });

  // Handle existing session on page load (covers magic link hash token too)
  _client.auth.getSession().then(async ({ data }) => {
    if (_currentUser) return; // already handled by onAuthStateChange
    if (data.session?.user) {
      _currentUser = data.session.user;
      const local = JSON.parse(localStorage.getItem(LS_PROGRESS_KEY) || '{}');
      await syncOnLogin(data.session.user.id, local);
      _updateNavUI(data.session.user);
    }
  });
}

// ─── Nav UI ───────────────────────────────────────────────────────────────────

function renderAuthUI() {
  const nav = document.getElementById('nav-auth');
  if (!nav) return;

  if (_currentUser) {
    nav.innerHTML = `
      <span id="nav-user-email" class="text-xs font-terminal text-slate-400 hidden sm:inline"></span>
      <button id="auth-signout-btn"
        class="text-xs font-terminal text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors">
        Sign out
      </button>`;
    document.getElementById('nav-user-email').textContent = _currentUser.email;
    document.getElementById('auth-signout-btn').addEventListener('click', () => signOut());
  } else {
    nav.innerHTML = `
      <button id="auth-signin-btn"
        class="text-xs font-terminal text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors">
        Sign in
      </button>`;
    document.getElementById('auth-signin-btn').addEventListener('click', () => {
      _setAuthMode('signin');
      _openAuthModal();
    });
  }

  _initModals();
}

function _updateNavUI(user) {
  renderAuthUI();
}

function _initModals() {
  // Wire modals only once using a data attribute flag
  const authModal = document.getElementById('auth-modal');
  if (authModal && !authModal.dataset.wired) {
    authModal.dataset.wired = '1';

    const closeAuthModal = () => {
      authModal.classList.add('hidden');
      document.getElementById('auth-message').className = 'hidden';
    };

    authModal.addEventListener('click', e => {
      if (e.target === authModal) closeAuthModal();
    });

    document.getElementById('auth-cancel')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-close-x').addEventListener('click', closeAuthModal);

    document.getElementById('auth-submit').addEventListener('click', _handleAuthSubmit);

    document.getElementById('auth-toggle').addEventListener('click', () => {
      const current = document.getElementById('auth-modal').dataset.mode || 'signin';
      _setAuthMode(current === 'signin' ? 'signup' : 'signin');
    });

    document.getElementById('auth-email').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('auth-password').focus();
    });

    document.getElementById('auth-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('auth-submit').click();
    });
  }

  const premiumModal = document.getElementById('premium-modal');
  if (premiumModal && !premiumModal.dataset.wired) {
    premiumModal.dataset.wired = '1';

    const closePremiumModal = () => premiumModal.classList.add('hidden');

    premiumModal.addEventListener('click', e => {
      if (e.target === premiumModal) closePremiumModal();
    });

    document.getElementById('premium-close').addEventListener('click', closePremiumModal);
    document.getElementById('premium-close-x').addEventListener('click', closePremiumModal);
  }

  // Escape closes whichever modal is open
  if (!document.body.dataset.escWired) {
    document.body.dataset.escWired = '1';
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      document.getElementById('auth-modal')?.classList.add('hidden');
      document.getElementById('premium-modal')?.classList.add('hidden');
      document.getElementById('auth-message') && (document.getElementById('auth-message').className = 'hidden');
    });
  }
}

function _setAuthMode(mode) {
  const modal      = document.getElementById('auth-modal');
  const title      = document.getElementById('auth-modal-title');
  const desc       = document.getElementById('auth-modal-desc');
  const submit     = document.getElementById('auth-submit');
  const toggleText = document.getElementById('auth-toggle-text');
  const toggleBtn  = document.getElementById('auth-toggle');
  const msg        = document.getElementById('auth-message');
  if (!modal) return;

  modal.dataset.mode = mode;
  if (msg) msg.className = 'hidden';

  if (mode === 'signup') {
    title.textContent      = 'Create your account';
    desc.textContent       = 'Free forever for the first two sections.';
    submit.textContent     = 'Create account';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent  = 'Sign in';
    document.getElementById('auth-password').autocomplete = 'new-password';
  } else {
    title.textContent      = 'Sign in to linux-quest';
    desc.textContent       = 'Welcome back.';
    submit.textContent     = 'Sign in';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent  = 'Create one';
    document.getElementById('auth-password').autocomplete = 'current-password';
  }
}

async function _handleAuthSubmit() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const submit   = document.getElementById('auth-submit');
  const msg      = document.getElementById('auth-message');
  const mode     = document.getElementById('auth-modal').dataset.mode || 'signin';

  if (!email || !password) return;

  submit.disabled    = true;
  submit.textContent = mode === 'signup' ? 'Creating…' : 'Signing in…';

  if (mode === 'signup' && password.length < 8) {
    msg.textContent = 'Password must be at least 8 characters.';
    msg.className   = 'mt-4 text-sm text-center font-terminal text-red-400';
    msg.classList.remove('hidden');
    setTimeout(() => { submit.disabled = false; submit.textContent = 'Create account'; }, 1000);
    return;
  }

  const { data, error } = mode === 'signup'
    ? await signUp(email, password)
    : await signIn(email, password);

  if (error) {
    msg.textContent = error.message;
    msg.className   = 'mt-4 text-sm text-center font-terminal text-red-400';
    msg.classList.remove('hidden');
    setTimeout(() => { submit.disabled = false; submit.textContent = mode === 'signup' ? 'Create account' : 'Sign in'; }, 3000);
    return;
  }

  submit.disabled    = false;
  submit.textContent = mode === 'signup' ? 'Create account' : 'Sign in';

  if (mode === 'signup' && data?.user && !data?.session) {
    msg.textContent = 'Check your email to confirm your account.';
    msg.className   = 'mt-4 text-sm text-center font-terminal text-green-400';
    msg.classList.remove('hidden');
  }
  // If session exists (email confirmation off), SIGNED_IN fires automatically
}
