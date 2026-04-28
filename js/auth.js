// Requires: window.supabase (CDN), SUPABASE_URL, SUPABASE_ANON_KEY (js/config.js)

const _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let _currentUser = null;
let _isPremium   = false;

// Gate positions — update these constants to move the access gates
const GATE_REGISTRATION = { sectionId: 'navigating-directories', lessonId: 'ls-flags' };
const GATE_PREMIUM      = { sectionId: 'file-content' };

// ─── Session helpers ──────────────────────────────────────────────────────────

function getUser()    { return _currentUser; }
function isPremium()  { return _isPremium; }

// ─── Auth actions ─────────────────────────────────────────────────────────────

async function sendMagicLink(email) {
  return await _client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
}

async function signOut() {
  _currentUser = null;
  _isPremium   = false;
  await _client.auth.signOut();
}

// ─── Progress sync ────────────────────────────────────────────────────────────

async function loadRemoteProgress(userId) {
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
  return await _client.from('progress').upsert(
    { user_id: userId, section_id: sectionId, lesson_id: lessonId, challenge_idx: challengeIdx },
    { onConflict: 'user_id,section_id,lesson_id,challenge_idx' }
  );
}

function _deepUnion(a, b) {
  const result = JSON.parse(JSON.stringify(a));
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
  localStorage.setItem('lq-progress', JSON.stringify(merged));

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

function checkGate(sectionId, lessonId, isLastLessonInSection) {
  if (!_currentUser
      && sectionId === GATE_REGISTRATION.sectionId
      && lessonId  === GATE_REGISTRATION.lessonId) {
    return 'registration';
  }
  if (_currentUser && !_isPremium
      && sectionId === GATE_PREMIUM.sectionId
      && isLastLessonInSection) {
    return 'premium';
  }
  return null;
}

function showGateModal(type) {
  if (type === 'registration') {
    document.getElementById('auth-modal-title').textContent = 'Create a free account to continue';
    document.getElementById('auth-modal-desc').textContent =
      'Sign up to unlock the rest of Navigating Directories — and more sections for free.';
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('auth-email').focus();
  } else if (type === 'premium') {
    document.getElementById('premium-modal').classList.remove('hidden');
  }
}

// ─── Auth lifecycle ───────────────────────────────────────────────────────────

function initAuth(onAuthChange) {
  _client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      _currentUser = session.user;
      const local  = JSON.parse(localStorage.getItem('lq-progress') || '{}');
      const merged = await syncOnLogin(session.user.id, local);
      _updateNavUI(session.user);
      // Close auth modal on successful login
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
  _client.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      _currentUser = data.session.user;
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
      <span class="text-xs font-terminal text-slate-400 hidden sm:inline truncate max-w-[160px]">${_currentUser.email}</span>
      <button id="auth-signout-btn"
        class="text-xs font-terminal text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors">
        Sign out
      </button>`;
    document.getElementById('auth-signout-btn').addEventListener('click', () => signOut());
  } else {
    nav.innerHTML = `
      <button id="auth-signin-btn"
        class="text-xs font-terminal text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors">
        Sign in
      </button>`;
    document.getElementById('auth-signin-btn').addEventListener('click', () => {
      document.getElementById('auth-modal-title').textContent = 'Sign in to linux-quest';
      document.getElementById('auth-modal-desc').textContent = "We'll send a magic link to your email.";
      document.getElementById('auth-modal').classList.remove('hidden');
      document.getElementById('auth-email').focus();
    });
  }

  _initModals();
}

function _updateNavUI(user) {
  _currentUser = user;
  renderAuthUI();
}

function _initModals() {
  // Wire modals only once using a data attribute flag
  const authModal = document.getElementById('auth-modal');
  if (authModal && !authModal.dataset.wired) {
    authModal.dataset.wired = '1';

    authModal.addEventListener('click', e => {
      if (e.target === authModal) authModal.classList.add('hidden');
    });

    document.getElementById('auth-cancel').addEventListener('click', () => {
      authModal.classList.add('hidden');
      document.getElementById('auth-message').className = 'hidden';
    });

    document.getElementById('auth-submit').addEventListener('click', _handleMagicLinkSubmit);

    document.getElementById('auth-email').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('auth-submit').click();
    });
  }

  const premiumModal = document.getElementById('premium-modal');
  if (premiumModal && !premiumModal.dataset.wired) {
    premiumModal.dataset.wired = '1';

    premiumModal.addEventListener('click', e => {
      if (e.target === premiumModal) premiumModal.classList.add('hidden');
    });

    document.getElementById('premium-close').addEventListener('click', () => {
      premiumModal.classList.add('hidden');
    });
  }
}

async function _handleMagicLinkSubmit() {
  const emailEl = document.getElementById('auth-email');
  const submit  = document.getElementById('auth-submit');
  const msg     = document.getElementById('auth-message');

  const email = emailEl.value.trim();
  if (!email) return;

  submit.disabled    = true;
  submit.textContent = 'Sending…';

  const { error } = await sendMagicLink(email);

  submit.disabled    = false;
  submit.textContent = 'Send magic link';

  if (error) {
    msg.textContent = 'Error: ' + error.message;
    msg.className   = 'mt-4 text-sm text-center font-terminal text-red-400';
  } else {
    msg.textContent = 'Check your email for the magic link!';
    msg.className   = 'mt-4 text-sm text-center font-terminal text-green-400';
  }
  msg.classList.remove('hidden');
}
