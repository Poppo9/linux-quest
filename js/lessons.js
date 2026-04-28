class LessonEngine {
  constructor(terminal) {
    this.terminal = terminal;
    this.sections = [];
    this.sectionIdx = 0;
    this.lessonIdx = 0;
    this.challengeIdx = 0;
    this.wrongAttempts = 0;
    this.challengeSolved = false;
    this.panelLocked = false;
    this.progress = this._loadProgress();
  }

  async init() {
    try {
      const res = await fetch('data/lessons.json?v=' + Date.now());
      const data = await res.json();
      this.sections = data.sections;
      this._resumeProgress();
      this._renderSidebar();
      this._loadLesson();
      document.getElementById('terminal-input').focus();
    } catch (e) {
      console.error('Failed to load lessons:', e);
    }
  }

  // ─── Progress ─────────────────────────────────────────────────────────────

  _loadProgress() {
    try {
      return JSON.parse(localStorage.getItem('lq-progress') || '{}');
    } catch {
      return {};
    }
  }

  _saveProgress() {
    localStorage.setItem('lq-progress', JSON.stringify(this.progress));
  }

  _resumeProgress() {
    for (let si = 0; si < this.sections.length; si++) {
      const section = this.sections[si];
      if (section.locked) continue;
      for (let li = 0; li < section.lessons.length; li++) {
        const lesson = section.lessons[li];
        for (let ci = 0; ci < lesson.challenges.length; ci++) {
          if (!this.progress[section.id]?.[lesson.id]?.[ci]) {
            this.sectionIdx = si;
            this.lessonIdx = li;
            this.challengeIdx = ci;
            return;
          }
        }
      }
    }
  }

  _markDone(sectionId, lessonId, idx) {
    if (!this.progress[sectionId]) this.progress[sectionId] = {};
    if (!this.progress[sectionId][lessonId]) this.progress[sectionId][lessonId] = {};
    this.progress[sectionId][lessonId][idx] = true;
    this._saveProgress();
  }

  _isLessonComplete(sectionId, lessonId, total) {
    const p = this.progress[sectionId]?.[lessonId] || {};
    return Object.keys(p).length >= total;
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  _renderSidebar() {
    const el = document.getElementById('sidebar-sections');
    el.innerHTML = '';

    this.sections.forEach((section, si) => {
      const wrap = document.createElement('div');
      wrap.className = 'mb-1 pt-1 border-t border-slate-800/60';

      const header = document.createElement('div');
      header.className = `flex items-center gap-2 px-3 py-2 rounded ${section.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`;
      header.innerHTML = `
        <span class="text-base leading-none">${section.icon || '📄'}</span>
        <span class="text-sm font-semibold ${section.locked ? 'text-slate-500' : 'text-white'} flex-1 leading-tight">${section.title}</span>
        ${section.locked ? '<span class="text-slate-400 text-xs">🔒</span>' : ''}
      `;
      wrap.appendChild(header);

      if (!section.locked && section.lessons.length) {
        const list = document.createElement('div');
        list.className = 'ml-3 mt-0.5 space-y-px';

        section.lessons.forEach((lesson, li) => {
          const done = this._isLessonComplete(section.id, lesson.id, lesson.challenges.length);
          const current = si === this.sectionIdx && li === this.lessonIdx;

          const item = document.createElement('div');
          item.className = [
            'flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm transition-colors',
            current
              ? 'bg-green-400/10 text-green-400 border-l-2 border-green-400'
              : done
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-200 hover:bg-slate-800'
          ].join(' ');

          item.innerHTML = `
            <span class="w-4 text-center text-xs flex-shrink-0">${done ? '✓' : current ? '▶' : '○'}</span>
            <span class="leading-tight">${lesson.title}</span>
          `;
          item.addEventListener('click', () => {
            this.sectionIdx = si;
            this.lessonIdx = li;
            this.challengeIdx = 0;
            this.wrongAttempts = 0;
            this._loadLesson();
            this._renderSidebar();
          });
          list.appendChild(item);
        });

        wrap.appendChild(list);
      }

      el.appendChild(wrap);
    });
  }

  // ─── Lesson loading ───────────────────────────────────────────────────────

  _loadLesson() {
    const section = this.sections[this.sectionIdx];
    const lesson = section?.lessons?.[this.lessonIdx];
    if (!lesson) return;

    document.getElementById('section-title').textContent = section.title;
    document.getElementById('lesson-title').textContent = lesson.title;
    document.getElementById('lesson-concept').textContent = lesson.concept || '';

    this._renderChallenge();
  }

  _renderChallenge() {
    const section = this.sections[this.sectionIdx];
    const lesson = section.lessons[this.lessonIdx];
    const challenge = lesson.challenges[this.challengeIdx];
    const total = lesson.challenges.length;

    // Fresh terminal for every challenge
    const cwd = challenge.initial_cwd || lesson.initial_cwd || '/home/user';
    this.terminal.reset(cwd);
    document.getElementById('terminal-output').innerHTML = '';
    this._updatePrompt();

    // Challenge content
    document.getElementById('challenge-progress').textContent = `${this.challengeIdx + 1} / ${total}`;
    document.getElementById('challenge-explanation').textContent = challenge.explanation || '';
    document.getElementById('challenge-instruction').textContent = challenge.instruction;
    document.getElementById('challenge-summary-text').textContent = challenge.instruction;

    const panel = document.getElementById('challenge-panel');
    panel.classList.remove('collapsed');
    this.panelLocked = false;
    const lockBtn = document.getElementById('panel-lock-btn');
    if (lockBtn) { lockBtn.textContent = 'auto-collapse: on'; lockBtn.className = 'font-terminal text-xs text-green-500 hover:text-green-400 px-1.5 py-0.5 rounded transition-colors'; }

    const tip = document.getElementById('challenge-tip');
    if (challenge.tip) {
      tip.textContent = challenge.tip;
      tip.className = 'mt-2 text-xs font-terminal text-slate-400';
    } else {
      tip.textContent = '';
      tip.className = 'hidden';
    }

    // Clear feedback
    const fb = document.getElementById('feedback');
    fb.textContent = '';
    fb.className = 'hidden text-sm';
    const hint = document.getElementById('hint-text');
    hint.textContent = '';
    hint.className = 'hidden text-xs';
    const enterHint = document.getElementById('enter-hint');
    enterHint.textContent = '';
    enterHint.className = 'hidden';

    // Prev button: disabled on very first challenge of first lesson
    const prevBtn = document.getElementById('prev-btn');
    const isFirst = this.challengeIdx === 0 && this.lessonIdx === 0;
    prevBtn.disabled = isFirst;

    // Next button: text changes at lesson boundary
    const nextBtn = document.getElementById('next-btn');
    const isLastChallenge = this.challengeIdx >= total - 1;
    const isLastLesson = this.lessonIdx >= section.lessons.length - 1;

    nextBtn.className = 'font-terminal text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300 flex-shrink-0';

    if (isLastChallenge && isLastLesson) {
      nextBtn.textContent = 'Section complete ✓';
      nextBtn.disabled = true;
    } else if (isLastChallenge) {
      nextBtn.textContent = 'Next Lesson →';
      nextBtn.disabled = false;
    } else {
      nextBtn.textContent = 'Next ▶';
      nextBtn.disabled = false;
    }

    this.wrongAttempts = 0;
    this.challengeSolved = false;
    this._scrollDown();
  }

  // ─── Input handling ───────────────────────────────────────────────────────

  handleInput(raw) {
    const input = raw.trim();

    this._appendLine(this.terminal.getPrompt() + this._esc(raw));

    if (!input) {
      this._updatePrompt();
      this._scrollDown();
      return;
    }

    const result = this.terminal.execute(input);

    if (result.clear) {
      document.getElementById('terminal-output').innerHTML = '';
    } else {
      for (const line of result.lines) {
        this._appendLine(line);
      }
    }

    this._updatePrompt();
    this._scrollDown();

    const section = this.sections[this.sectionIdx];
    const lesson = section.lessons[this.lessonIdx];
    const challenge = lesson.challenges[this.challengeIdx];

    if (this._validate(input, challenge.expected_commands)) {
      this._onSuccess(challenge, lesson);
    } else if (!result.error) {
      this._onWrong(challenge);
    }
  }

  _validate(input, expected) {
    const norm = s => s.trim().replace(/\s+/g, ' ').replace(/\/(\s|$)/g, '$1').toLowerCase();
    const n = norm(input);
    return expected.some(e => norm(e) === n);
  }

  _onSuccess(challenge, lesson) {
    const section = this.sections[this.sectionIdx];
    this._markDone(section.id, lesson.id, this.challengeIdx);
    this.challengeSolved = true;

    const fb = document.getElementById('feedback');
    fb.textContent = challenge.success_message || '✓ Correct!';
    fb.className = 'text-sm text-green-400 animate-fade-in';

    const nextBtn = document.getElementById('next-btn');
    if (!nextBtn.disabled) {
      nextBtn.className = 'font-terminal text-xs text-green-400 border border-green-400/50 bg-green-400/10 hover:bg-green-400/20 px-3 py-1.5 rounded transition-colors flex-shrink-0';
      const enterHint = document.getElementById('enter-hint');
      enterHint.textContent = '(Press Enter to continue)';
      enterHint.className = 'text-xs font-terminal text-slate-500';
    }

    this._renderSidebar();
  }

  _onWrong(challenge) {
    this.wrongAttempts++;
    const fb = document.getElementById('feedback');
    fb.innerHTML = '✗ Not quite, try again.';
    fb.className = 'text-sm text-red-400 animate-shake';
    setTimeout(() => fb.classList.remove('animate-shake'), 400);

    if (this.wrongAttempts >= 2 && challenge.hint) {
      const hint = document.getElementById('hint-text');
      hint.textContent = `💡 Hint: ${challenge.hint}`;
      hint.className = 'text-xs text-yellow-400 mt-1';
    }
  }

  collapsePanel() {
    if (this.panelLocked) return;
    document.getElementById('challenge-panel').classList.add('collapsed');
  }

  expandPanel() {
    document.getElementById('challenge-panel').classList.remove('collapsed');
    document.getElementById('terminal-input').focus();
  }

  togglePanelLock() {
    this.panelLocked = !this.panelLocked;
    const btn = document.getElementById('panel-lock-btn');
    if (this.panelLocked) {
      btn.textContent = 'auto-collapse: off';
      btn.className = 'font-terminal text-xs text-amber-500 hover:text-amber-400 px-1.5 py-0.5 rounded transition-colors';
      this.expandPanel();
    } else {
      btn.textContent = 'auto-collapse: on';
      btn.className = 'font-terminal text-xs text-green-500 hover:text-green-400 px-1.5 py-0.5 rounded transition-colors';
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  prevChallenge() {
    if (this.challengeIdx > 0) {
      this.challengeIdx--;
    } else if (this.lessonIdx > 0) {
      this.lessonIdx--;
      const lesson = this.sections[this.sectionIdx].lessons[this.lessonIdx];
      this.challengeIdx = lesson.challenges.length - 1;
      document.getElementById('lesson-title').textContent = lesson.title;
      document.getElementById('lesson-concept').textContent = lesson.concept || '';
    } else {
      return;
    }
    this.wrongAttempts = 0;
    this._renderChallenge();
    this._renderSidebar();
    document.getElementById('terminal-input').focus();
  }

  advanceChallenge() {
    const section = this.sections[this.sectionIdx];
    const lesson = section.lessons[this.lessonIdx];
    const isLastChallenge = this.challengeIdx >= lesson.challenges.length - 1;
    const isLastLesson = this.lessonIdx >= section.lessons.length - 1;

    if (isLastChallenge && isLastLesson) return;

    if (isLastChallenge) {
      this.lessonIdx++;
      this.challengeIdx = 0;
      this._loadLesson();
      this._renderSidebar();
    } else {
      this.challengeIdx++;
      this._renderChallenge();
    }

    this.wrongAttempts = 0;
    document.getElementById('terminal-input').focus();
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────────

  _appendLine(html) {
    const out = document.getElementById('terminal-output');
    const div = document.createElement('div');
    div.className = 'font-terminal text-sm leading-relaxed';
    div.innerHTML = html;
    out.appendChild(div);
  }

  _updatePrompt() {
    document.getElementById('terminal-prompt').innerHTML = this.terminal.getPrompt();
  }

  _scrollDown() {
    const body = document.getElementById('terminal-body');
    body.scrollTop = body.scrollHeight;
  }

  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
