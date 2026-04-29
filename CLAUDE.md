# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**linux-quest** is a gamified, interactive Linux command tutorial: a static webapp where users learn bash commands through hands-on terminal challenges. Inspired by [vim-hero.com](https://www.vim-hero.com); command set drawn from [Bash-Cheat-Sheet](https://github.com/RehanSaeed/Bash-Cheat-Sheet).

## Stack

- **HTML + Tailwind CSS** via CDN (`cdn.tailwindcss.com`) — build step only for config generation
- **Vanilla JavaScript** — no framework
- **JSON** for lesson content (`data/lessons.json`) — add content without touching JS
- **Supabase** — auth (email + password) + progress sync + user profiles
- Game progress stored in `localStorage` (write-through cache) and synced to Supabase when logged in
- **Netlify** — static hosting, build command generates `js/config.js` from env vars

## File Structure

```
index.html              Landing page (vim-hero inspired design, green terminal palette)
lessons.html            Interactive lesson page
css/styles.css          Custom animations, terminal styles, font imports, global scale
js/terminal.js          VirtualTerminal class — simulated filesystem + command execution
js/lessons.js           LessonEngine class — loads JSON, validates input, tracks progress
js/auth.js              Supabase client, auth (email+password), progress sync, gate logic, nav UI
js/config.js            Supabase credentials — gitignored, generated at build time (see netlify.toml)
js/config.example.js    Template for local dev — copy to config.js and fill in values
data/lessons.json       All lesson/challenge content
netlify.toml            Build command + SPA redirect rule
TODO.md                 Backlog locale
```

## Development

Requires a local HTTP server (cannot open HTML files directly due to `fetch` for JSON):

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Before starting, create `js/config.js` from the example file and fill in Supabase credentials:

```bash
cp js/config.example.js js/config.js
# edit js/config.js with SUPABASE_URL and SUPABASE_ANON_KEY from Supabase Dashboard > Project Settings > API
```

## Architecture

### Terminal simulation (`js/terminal.js`)

`VirtualTerminal` holds a virtual in-memory filesystem and current working directory. `execute(input)` parses the command, updates state (e.g. `cd` changes `this.cwd`), and returns `{ lines: string[], error?: bool, clear?: bool }` where lines are HTML strings with color spans.

Commands implemented (43 total, registered in `this._commands` registry):
- **Navigation**: `pwd`, `ls` (with `-l`, `-a`, `-la`/`-al`), `ll`, `cd`
- **File operations**: `mv`, `cp`, `rm`, `mkdir`, `rmdir`, `touch`
- **File content**: `cat`, `echo`, `head`, `tail`
- **Text processing**: `sort`, `uniq`, `cut`, `wc`, `grep` (with `-i`, `-n`, `-r`/`-R`, combined flags)
- **Search**: `find` (with `-name`, `-type`), `diff`, `locate`
- **Permissions/ownership**: `chmod` (octal + symbolic), `chown`
- **File metadata**: `stat`, `file`
- **Disk**: `du`, `df`
- **System info**: `uname`, `hostname`, `id`, `whoami`, `date`, `ps`, `env`, `printenv`
- **Session**: `history`, `which`, `man`
- **Terminal**: `clear`, `help`

`getPrompt()` returns an HTML string ending with `$&nbsp;` (non-breaking space) so the trailing space is never collapsed by the browser when injected via `innerHTML`.

### Lesson engine (`js/lessons.js`)

`LessonEngine` loads `data/lessons.json`, renders the sidebar, and coordinates challenge progression. When the user submits a command:
1. It's executed in the terminal (output shown)
2. `_validate()` compares the input against `challenge.expected_commands[]` (normalized: trim, collapse spaces, strip trailing slashes, lowercase)
3. On success: mark done in localStorage (and sync to Supabase if logged in), show feedback + `(Press Enter to continue)` hint, turn Next button green, set `challengeSolved = true`
4. On failure: increment `wrongAttempts`; show hint after 2 wrong tries

**Input row alignment.** The `#input-row` div uses the same `font-terminal text-sm leading-relaxed` classes as lines appended by `_appendLine`, plus `flex items-baseline` so prompt and input share the same text baseline. The `<input>` element has `font-feature-settings: 'liga' 0, 'calt' 0` to disable font ligatures (prevents JetBrains Mono from visually combining `...` into `…`). The `input` event handler also normalizes any OS-level smart punctuation (`…→...`, `"→"`, `'→'`, `—→--`, `–→-`) before the value is processed.

**Each challenge gets a fresh terminal.** `_renderChallenge()` resets `VirtualTerminal` to `challenge.initial_cwd` (falling back to `lesson.initial_cwd`, then `/home/user`) and clears the output. Use per-challenge `initial_cwd` in the JSON when a challenge logically continues from the previous one's end state.

**Resume on load.** `_resumeProgress()` runs at init and sets `sectionIdx/lessonIdx/challengeIdx` to the first incomplete challenge, so returning users land where they left off.

**Enter to advance.** When `challengeSolved` is true and the input field is empty, pressing Enter calls `advanceChallenge()`.

Navigation: `◀ Prev` / `Next ▶` buttons in the challenge header allow free movement between challenges. `prevChallenge()` and `advanceChallenge()` also handle lesson boundaries.

`advanceChallenge()` checks `checkGate()` (from `auth.js`) at every lesson boundary before advancing. If the user's tier doesn't permit access, it shows the appropriate gate modal instead.

`replaceProgress(newProgress)` is a public method called after login to hot-swap the engine's progress object with the Supabase-merged version, re-running resume logic and re-rendering the sidebar.

### Collapsible challenge panel

The `#challenge-panel` wraps the "📖 Learn" and "💻 Try it" sections. It collapses automatically when the user starts typing (first `input` event with non-empty value), unless `panelLocked` is true.

- **Summary strip** (`#challenge-panel-summary`): shown when collapsed; click to expand.
- **"click to collapse"** button: force-closes the panel without touching lock state.
- **"auto-collapse: on/off"** toggle: green when on (default), amber when off (locked). When locked, `collapsePanel()` is a no-op.
- CSS transitions: collapse at `0.55s`, expand at `0.2s`.
- Panel resets to open + unlocked on every new challenge.

### Lesson data schema (`data/lessons.json`)

```json
{
  "sections": [{
    "id": "string",
    "title": "string",
    "icon": "emoji",
    "locked": false,
    "lessons": [{
      "id": "string",
      "title": "string",
      "concept": "string",       // italic subtitle in the header row
      "initial_cwd": "/home/user",
      "challenges": [{
        "initial_cwd": "/home/user/Documents",  // optional: overrides lesson-level cwd
        "explanation": "string",  // shown in '📖 Learn' (whitespace-pre-line)
        "instruction": "string",  // shown in '💻 Try it'
        "tip": "string",          // optional: shown below instruction in slate-400
        "expected_commands": ["cmd1", "cmd2"],
        "hint": "string",         // shown after 2 wrong attempts
        "success_message": "string"
      }]
    }]
  }]
}
```

Set `"locked": true` and `"lessons": []` for placeholder sections.

The `lessons.json` fetch includes a `?v=<timestamp>` cache-buster to avoid stale browser cache.

### Auth & tier gating (`js/auth.js`)

Supabase email magic link auth. The module exposes global functions used by both HTML pages and `lessons.js`:

- `getUser()` / `isPremium()` — sync accessors for current session state
- `signUp(email, password)` / `signIn(email, password)` / `signOut()` — auth actions; `signOut()` triggers `window.location.reload()`
- `initAuth(onAuthChange)` — registers `onAuthStateChange` listener; call once per page. On `SIGNED_IN` runs `syncOnLogin` (merge local + remote progress, load profile) and fires `onAuthChange('signed_in', user, mergedProgress)`.
- `renderAuthUI()` — injects "Sign in" or "email + Sign out" into `#nav-auth`; wires modals on first call (idempotent via `data-wired` flag).
- `checkGate(sectionId, lessonId, isLastLessonInSection)` — returns `null`, `'registration'`, or `'premium'`
- `showGateModal(type)` — shows auth modal (with gate-specific copy) or premium modal
- `pushProgressRow(userId, sId, lId, idx)` — upserts a single row in Supabase `progress` table

**Gate positions** are hardcoded as constants at the top of `auth.js`:
```js
const GATE_REGISTRATION = { sectionId: 'navigating-directories' };
const GATE_PREMIUM      = { sectionId: 'file-content' };
```
Change only these constants to move the gates. `getGateForSection(sectionId, allSectionIds)` computes the required tier for sidebar rendering by comparing section indices against the gate boundaries.

**Tiers:**
- `guest` — localStorage only; blocked after end of `navigating-directories`
- `registered` (free) — Supabase email + password; blocked after end of `file-content` section
- `premium` — Stripe (not yet implemented); full access

**Supabase tables:**
- `progress(user_id, section_id, lesson_id, challenge_idx, completed_at)` — RLS: users own their rows
- `profiles(id, is_premium, premium_since, stripe_customer_id)` — `is_premium` is updated only by service_role (future Stripe webhook); users can SELECT/INSERT their own row but not UPDATE

A trigger `on_auth_user_created` auto-creates the `profiles` row on signup.

**Script load order** (both pages):
```
1. cdn.tailwindcss.com
2. @supabase/supabase-js CDN   → window.supabase
3. js/config.js                → SUPABASE_URL, SUPABASE_ANON_KEY
4. js/auth.js                  → global auth functions
5. js/terminal.js              (lessons.html only)
6. js/lessons.js               (lessons.html only)
7. inline <script> (part 1)    → new VirtualTerminal, new LessonEngine (before modals)
8. modal HTML                  → #auth-modal, #premium-modal (must precede init calls)
9. inline <script> (part 2)    → renderAuthUI, initAuth, engine.init() (after modals)
```

The split is intentional: `renderAuthUI()` calls `_initModals()` which does `getElementById` on the modal elements, so they must exist in the DOM first.

**Pitfall — modal element removal causes silent crash.** `_initModals()` wires event listeners on modal child elements (`auth-cancel`, `auth-close-x`, `auth-submit`, `auth-toggle`, `premium-close`, `premium-close-x`). If any of these elements is removed from the HTML without a matching update in `auth.js`, `getElementById` returns `null` and the `.addEventListener` call throws a `TypeError`. Because `renderAuthUI()` is called before `engine.init()` in the inline script, the crash prevents `engine.init()` from running and the sidebar never renders (all lessons disappear). Always use optional chaining (`?.addEventListener`) in `_initModals()` for non-critical elements, and update `auth.js` whenever modal HTML changes.

## Adding new content

To add a new lesson section: add an entry to `data/lessons.json` with `"locked": false` and populate `lessons[]`.

To add a new command to the terminal simulator: add one entry to `this._commands` in the constructor, then implement `_<command>(args)`. No other changes needed — `execute()`, `help`, and tab completion all auto-discover from the registry. Add files/dirs to `_buildFs()` if the command needs test data; include a `content: [...]` array for commands like `cat`, `grep`, `sort` to work on them.

## Design

Dark palette: `slate-950` background, `slate-800` borders, `green-400` accent (terminal green).

**Fonts**: Geist (body/UI text) + JetBrains Mono (terminal, code, `font-terminal` class), both from Google Fonts with `display=swap`. `lessons.html` includes `<link rel="preconnect">` hints for `fonts.googleapis.com` and `fonts.gstatic.com` to reduce FOUT. Global `font-size: 120%` on `html` for proportional scaling of all rem-based Tailwind classes.

**Layout (lessons.html)**: single combined header row with `◀ Prev` | lesson title + concept + progress | `Next ▶`. Sidebar section headers use `text-white font-semibold` with a top border separator between sections.

## Lesson content summary

All 8 sections are implemented and unlocked. 40 lessons, 84 challenges total.

| Section | Lessons | Challenges |
|---|---|---|
| Navigating Directories | 7 | 14 |
| File Operations | 6 | 12 |
| Reading File Content | 4 | 8 |
| Search & Find | 5 | 14 |
| Text Processing | 4 | 8 |
| Permissions & Ownership | 6 | 12 |
| System Information | 5 | 10 |
| Session & Navigation | 3 | 6 |

Virtual filesystem notable files (used by lessons):
- `/home/user/notes.txt`, `notes_v2.txt` — for grep, diff
- `/home/user/todo.txt`, `temp.txt` — for rm, wc, sort
- `/home/user/Documents/letter.txt`, `letter_v2.txt` — for cat, diff
- `/home/user/Documents/scores.csv` — for cut, grep -n
- `/home/user/Documents/duplicates.txt` — for uniq
- `/home/user/Documents/projects/app.py`, `readme.md` — for grep -r, find
- `/home/user/Downloads/setup.sh`, `archive.zip` — for chmod, file, rm

---

## Planned (not yet implemented)

### Pipes & Redirection (~10h)

Richiede due interventi prima di poter scrivere le lezioni:

1. **Tokenizer per argomenti quoted** — sostituire `input.split(/\s+/)` in `execute()` con un tokenizer che rispetti le virgolette (`"hello world"` → un token solo). Prerequisito anche per filenames con spazi.

2. **Parser pipeline** — prima del dispatch, dividere l'input su `|`, `>`, `>>`, `<`. Eseguire ogni stage passando l'output del precedente come stdin al successivo. I comandi `grep`, `sort`, `uniq`, `cut`, `wc`, `head`, `tail`, `cat` devono accettare un parametro opzionale `stdin: string[]` quando non viene passato un file.

Comandi da aggiungere al registry dopo il refactor: `tee`, `xargs`, `tr`, `sed` (base), `awk` (base).

Stima effort: ~10h totali (3h tokenizer + parser, 2h stdin nei comandi esistenti, 2h `>` / `>>` / `<`, 3h testing).

### Payments: Stripe
Netlify Function per webhook Stripe → aggiorna `profiles.is_premium = true` via service_role key. Stripe Checkout per accesso premium alle sezioni avanzate. Il campo DB è già predisposto.
