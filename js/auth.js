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

// Gate positions — update these constants to move the access gates
// Registration wall fires at the end of section 1 (navigating-directories)
// Premium wall fires at the end of section 3 (file-content)
const GATE_REGISTRATION = { sectionId: 'navigating-directories' };
const GATE_PREMIUM      = { sectionId: 'file-content' };

// ─── Session helpers ──────────────────────────────────────────────────────────

function getUser()    { return _currentUser; }
function isPremium()  { return _isPremium; }

// ─── Auth actions ─────────────────────────────────────────────────────────────

async function sendMagicLink(email) {
  if (!_client) return { error: { message: 'Auth not configured' } };
  return await _client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
}

async function signOut() {
  _currentUser = null;
  _isPremium   = false;
  if (_client) await _client.auth.signOut();
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

// Returns the gate type that blocks access to a section, or null if accessible.
// allSectionIds: ordered array of section IDs from lessons.json
function getGateForSection(sectionId, allSectionIds) {
  const signedIn = document.getElementById('dbg-signed-in')?.checked || !!_currentUser;
  const premium  = document.getElementById('dbg-premium')?.checked  || _isPremium;

  const regIdx  = allSectionIds.indexOf(GATE_REGISTRATION.sectionId);
  const premIdx = allSectionIds.indexOf(GATE_PREMIUM.sectionId);
  const sIdx    = allSectionIds.indexOf(sectionId);

  if (premIdx !== -1 && sIdx > premIdx && !premium) return 'premium';
  if (regIdx  !== -1 && sIdx > regIdx  && !signedIn) return 'registration';
  return null;
}

function checkGate(sectionId, lessonId, isLastLessonInSection) {
  const signedIn = document.getElementById('dbg-signed-in')?.checked || !!_currentUser;
  const premium  = document.getElementById('dbg-premium')?.checked  || _isPremium;

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

function showGateModal(type) {
  if (type === 'registration') {
    document.getElementById('auth-modal-title').textContent = '🔒 Sign in to continue';
    document.getElementById('auth-modal-desc').textContent =
      'You\'ve completed the first section! Create a free account to unlock File Operations and all sections beyond. [PLACEHOLDER — registration not yet wired]';
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('auth-email').focus();
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

    const closeAuthModal = () => {
      authModal.classList.add('hidden');
      document.getElementById('auth-message').className = 'hidden';
    };

    authModal.addEventListener('click', e => {
      if (e.target === authModal) closeAuthModal();
    });

    document.getElementById('auth-cancel').addEventListener('click', closeAuthModal);
    document.getElementById('auth-close-x').addEventListener('click', closeAuthModal);

    document.getElementById('auth-submit').addEventListener('click', _handleMagicLinkSubmit);

    document.getElementById('auth-email').addEventListener('keydown', e => {
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
