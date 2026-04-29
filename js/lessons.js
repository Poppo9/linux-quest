const BTN_NEXT_DEFAULT = 'font-terminal text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-300 flex-shrink-0';
const BTN_NEXT_SUCCESS = 'font-terminal text-xs text-green-400 border border-green-400/50 bg-green-400/10 hover:bg-green-400/20 px-3 py-1.5 rounded transition-colors flex-shrink-0';
const BTN_LOCK_ON  = 'font-terminal text-xs text-green-500 hover:text-green-400 px-1.5 py-0.5 rounded transition-colors';
const BTN_LOCK_OFF = 'font-terminal text-xs text-amber-500 hover:text-amber-400 px-1.5 py-0.5 rounded transition-colors';

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
    this._expandedSectionId = undefined; // undefined = not yet initialised

    this.$out      = document.getElementById('terminal-output');
    this.$prompt   = document.getElementById('terminal-prompt');
    this.$body     = document.getElementById('terminal-body');
    this.$input    = document.getElementById('terminal-input');
    this.$feedback = document.getElementById('feedback');
    this.$hint     = document.getElementById('hint-text');
    this.$enter    = document.getElementById('enter-hint');
    this.$nextBtn  = document.getElementById('next-btn');
    this.$prevBtn  = document.getElementById('prev-btn');
    this.$panel    = document.getElementById('challenge-panel');
    this.$lockBtn  = document.getElementById('panel-lock-btn');
    this.$sidebar  = document.getElementById('sidebar-sections');
    this.$secTitle = document.getElementById('section-title');
    this.$lesTitle = document.getElementById('lesson-title');
    this.$concept  = document.getElementById('lesson-concept');
    this.$progress = document.getElementById('challenge-progress');
    this.$explain  = document.getElementById('challenge-explanation');
    this.$instr    = document.getElementById('challenge-instruction');
    this.$summary  = document.getElementById('challenge-summary-text');
    this.$tip      = document.getElementById('challenge-tip');
  }

  async init() {
    try {
      const res = await fetch('data/lessons.json?v=' + Date.now());
      const data = await res.json();
      this.sections = data.sections;
      this._resumeProgress();
      this._renderSidebar();
      this._loadLesson();
      this.$input.focus();
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
    const user = getUser();
    if (user) {
      pushProgressRow(user.id, sectionId, lessonId, idx)
        .catch(err => console.warn('Progress sync failed:', err));
    }
  }

  replaceProgress(newProgress) {
    this.progress = newProgress;
    this._resumeProgress();
    this._renderSidebar();
  }

  _isLessonComplete(sectionId, lessonId, total) {
    const p = this.progress[sectionId]?.[lessonId] || {};
    return Object.keys(p).length >= total;
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  _renderSidebar() {
    // Initialise expanded section on first render
    if (this._expandedSectionId === undefined) {
      this._expandedSectionId = this.sections[this.sectionIdx]?.id ?? null;
    }

    const sectionIds = this.sections.map(s => s.id);
    this.$sidebar.innerHTML = '';

    this.sections.forEach((section, si) => {
      // A section is auth-locked when the user lacks the required tier
      const authGate = (typeof getGateForSection === 'function')
        ? getGateForSection(section.id, sectionIds)
        : null;
      const isLocked  = section.locked || authGate !== null;
      const isExpanded = !isLocked && this._expandedSectionId === section.id;

      const wrap = document.createElement('div');
      wrap.className = 'mb-1 pt-1 border-t border-slate-800/60';

      const header = document.createElement('div');
      header.className = `flex items-center gap-2 px-3 py-2 rounded ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}`;
      const badge = isLocked
        ? '<span class="text-slate-400 text-xs">🔒</span>'
        : `<span class="text-slate-500 text-xs select-none">${isExpanded ? '▾' : '▸'}</span>`;
      header.innerHTML = `
        <span class="text-base leading-none">${section.icon || '📄'}</span>
        <span class="text-sm font-semibold ${isLocked ? 'text-slate-500' : 'text-white'} flex-1 leading-tight">${section.title}</span>
        ${badge}
      `;

      if (!isLocked) {
        header.addEventListener('click', () => {
          // Accordion: open this section (or close if already open)
          this._expandedSectionId = (this._expandedSectionId === section.id) ? null : section.id;
          this._renderSidebar();
        });
      }

      wrap.appendChild(header);

      if (!isLocked && isExpanded && section.lessons.length) {
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
            <span class="w-4 text-center text-xs flex-shrink-0">${done ? '●' : current ? '▶' : '○'}</span>
            <span class="leading-tight">${lesson.title}</span>
          `;
          item.addEventListener('click', () => {
            this._expandedSectionId = section.id;
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

      this.$sidebar.appendChild(wrap);
    });
  }

  // ─── Lesson loading ───────────────────────────────────────────────────────

  _loadLesson() {
    const section = this.sections[this.sectionIdx];
    const lesson = section?.lessons?.[this.lessonIdx];
    if (!lesson) return;

    this.$secTitle.textContent = section.title;
    this.$lesTitle.textContent = lesson.title;
    this.$concept.textContent = lesson.concept || '';

    this._renderChallenge();
  }

  _renderChallenge() {
    const section = this.sections[this.sectionIdx];
    const lesson = section.lessons[this.lessonIdx];
    const challenge = lesson.challenges[this.challengeIdx];
    const total = lesson.challenges.length;

    // Reset filesystem state so validation is deterministic regardless of what the user ran previously
    const cwd = challenge.initial_cwd || lesson.initial_cwd || '/home/user';
    this.terminal.reset(cwd);
    this.$out.innerHTML = '';
    this._updatePrompt();

    // Challenge content
    this.$progress.textContent = `${this.challengeIdx + 1} / ${total}`;
    this.$explain.textContent = challenge.explanation || '';
    this.$instr.textContent = challenge.instruction;
    this.$summary.textContent = challenge.instruction;

    this.$panel.classList.remove('collapsed');
    this.panelLocked = false;
    this.$lockBtn.textContent = 'auto-collapse: on';
    this.$lockBtn.className = BTN_LOCK_ON;

    if (challenge.tip) {
      this.$tip.textContent = challenge.tip;
      this.$tip.className = 'mt-2 text-xs font-terminal text-slate-400';
    } else {
      this.$tip.textContent = '';
      this.$tip.className = 'hidden';
    }

    // Clear feedback
    this.$feedback.textContent = '';
    this.$feedback.className = 'hidden text-sm';
    this.$hint.textContent = '';
    this.$hint.className = 'hidden text-xs';
    this.$enter.textContent = '';
    this.$enter.className = 'hidden';

    // Prev button: disabled on very first challenge of first lesson
    const isFirst = this.challengeIdx === 0 && this.lessonIdx === 0;
    this.$prevBtn.disabled = isFirst;

    // Next button: text changes at lesson boundary
    const isLastChallenge = this.challengeIdx >= total - 1;
    const isLastLesson = this.lessonIdx >= section.lessons.length - 1;

    this.$nextBtn.className = BTN_NEXT_DEFAULT;

    if (isLastChallenge && isLastLesson) {
      const isLastSection = this.sectionIdx >= this.sections.length - 1;
      this.$nextBtn.textContent = isLastSection ? 'Course complete ✓' : 'Next Section →';
      this.$nextBtn.disabled = isLastSection;
    } else if (isLastChallenge) {
      this.$nextBtn.textContent = 'Next Lesson →';
      this.$nextBtn.disabled = false;
    } else {
      this.$nextBtn.textContent = 'Next ▶';
      this.$nextBtn.disabled = false;
    }

    this.wrongAttempts = 0;
    this.challengeSolved = false;
    this._scrollDown();
  }

  // ─── Input handling ───────────────────────────────────────────────────────

  handleInput(raw) {
    const input = raw.trim();

    this._appendLine(this.terminal.getPrompt() + this.terminal._esc(raw));

    if (!input) {
      this._updatePrompt();
      this._scrollDown();
      return;
    }

    const result = this.terminal.execute(input);

    if (result.clear) {
      this.$out.innerHTML = '';
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

    this.$feedback.textContent = challenge.success_message || '✓ Correct!';
    this.$feedback.className = 'text-sm text-green-400 animate-fade-in';

    if (!this.$nextBtn.disabled) {
      this.$nextBtn.className = BTN_NEXT_SUCCESS;
      this.$enter.textContent = '(Press Enter to continue)';
      this.$enter.className = 'text-xs font-terminal text-slate-500';
    }

    this._renderSidebar();
  }

  _onWrong(challenge) {
    this.wrongAttempts++;
    this.$feedback.innerHTML = '✗ Not quite, try again.';
    this.$feedback.className = 'text-sm text-red-400 animate-shake';
    setTimeout(() => this.$feedback.classList.remove('animate-shake'), 400);

    if (this.wrongAttempts >= 2 && challenge.hint) {
      this.$hint.textContent = `💡 Hint: ${challenge.hint}`;
      this.$hint.className = 'text-xs text-yellow-400 mt-1';
    }
  }

  collapsePanel() {
    if (this.panelLocked) return;
    this.$panel.classList.add('collapsed');
  }

  expandPanel() {
    this.$panel.classList.remove('collapsed');
    this.$input.focus();
  }

  togglePanelLock() {
    this.panelLocked = !this.panelLocked;
    if (this.panelLocked) {
      this.$lockBtn.textContent = 'auto-collapse: off';
      this.$lockBtn.className = BTN_LOCK_OFF;
      this.expandPanel();
    } else {
      this.$lockBtn.textContent = 'auto-collapse: on';
      this.$lockBtn.className = BTN_LOCK_ON;
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
      this.$lesTitle.textContent = lesson.title;
      this.$concept.textContent = lesson.concept || '';
    } else {
      return;
    }
    this.wrongAttempts = 0;
    this._renderChallenge();
    this._renderSidebar();
    this.$input.focus();
  }

  advanceChallenge() {
    const section = this.sections[this.sectionIdx];
    const lesson = section.lessons[this.lessonIdx];
    const isLastChallenge = this.challengeIdx >= lesson.challenges.length - 1;
    const isLastLesson    = this.lessonIdx >= section.lessons.length - 1;
    const isLastSection   = this.sectionIdx >= this.sections.length - 1;

    // End of entire course
    if (isLastChallenge && isLastLesson && isLastSection) return;

    if (isLastChallenge && isLastLesson) {
      // Cross-section transition: check gate
      const gate = checkGate(section.id, lesson.id, true);
      if (gate === 'registration') { showGateModal('registration'); return; }
      if (gate === 'premium')      { showGateModal('premium');      return; }

      this.sectionIdx++;
      this._expandedSectionId = this.sections[this.sectionIdx]?.id;
      this.lessonIdx = 0;
      this.challengeIdx = 0;
      this._loadLesson();
      this._renderSidebar();
    } else if (isLastChallenge) {
      // Within-section lesson transition
      const gate = checkGate(section.id, lesson.id, isLastLesson);
      if (gate === 'registration') { showGateModal('registration'); return; }
      if (gate === 'premium')      { showGateModal('premium');      return; }

      this.lessonIdx++;
      this.challengeIdx = 0;
      this._loadLesson();
      this._renderSidebar();
    } else {
      this.challengeIdx++;
      this._renderChallenge();
    }

    this.$input.focus();
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────────

  _appendLine(html) {
    const div = document.createElement('div');
    div.className = 'font-terminal text-sm leading-relaxed whitespace-pre-wrap';
    div.innerHTML = html;
    this.$out.appendChild(div);
  }

  _updatePrompt() {
    this.$prompt.innerHTML = this.terminal.getPrompt();
  }

  _scrollDown() {
    this.$body.scrollTop = this.$body.scrollHeight;
  }

  printCompletions(html) {
    this._appendLine(html);
    this._scrollDown();
  }
}
