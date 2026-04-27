# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**linux-quest** is a gamified, interactive Linux command tutorial — a static webapp where users learn bash commands through hands-on terminal challenges. Inspired by [vim-hero.com](https://www.vim-hero.com); command set drawn from [Bash-Cheat-Sheet](https://github.com/RehanSaeed/Bash-Cheat-Sheet).

## Stack

- **HTML + Tailwind CSS** via CDN (`cdn.tailwindcss.com`) — no build step required
- **Vanilla JavaScript** — no framework
- **JSON** for lesson content (`data/lessons.json`) — add content without touching JS
- Game progress stored in `localStorage`

## File Structure

```
index.html          Landing page (vim-hero inspired design, green terminal palette)
lessons.html        Interactive lesson page
css/styles.css      Custom animations, terminal styles, font import
js/terminal.js      VirtualTerminal class — simulated filesystem + command execution
js/lessons.js       LessonEngine class — loads JSON, validates input, tracks progress
data/lessons.json   All lesson/challenge content
```

## Development

Requires a local HTTP server (cannot open HTML files directly due to `fetch` for JSON):

```bash
python -m http.server 8080
# then open http://localhost:8080
```

## Architecture

### Terminal simulation (`js/terminal.js`)

`VirtualTerminal` holds a virtual in-memory filesystem and current working directory. `execute(input)` parses the command, updates state (e.g. `cd` changes `this.cwd`), and returns `{ lines: string[], error?: bool, clear?: bool }` where lines are HTML strings with color spans.

Commands implemented: `pwd`, `ls` (with `-l`, `-a`, `-la`/`-al`), `ll` (alias for `ls -la`), `cd`, `clear`, `help`.

### Lesson engine (`js/lessons.js`)

`LessonEngine` loads `data/lessons.json`, renders the sidebar, and coordinates challenge progression. When the user submits a command:
1. It's executed in the terminal (output shown)
2. `_validate()` compares the input against `challenge.expected_commands[]` (normalized: trim, collapse spaces, strip trailing slashes, lowercase)
3. On success: mark done in localStorage, show feedback in feedback bar
4. On failure: increment `wrongAttempts`; show hint after 2 wrong tries

**Each challenge gets a fresh terminal.** `_renderChallenge()` resets `VirtualTerminal` to `challenge.initial_cwd` (falling back to `lesson.initial_cwd`, then `/home/user`) and clears the output. Use per-challenge `initial_cwd` in the JSON when a challenge logically continues from the previous one's end state.

Navigation: `◀ Prev` / `Next ▶` buttons in the challenge header allow free movement between challenges. `prevChallenge()` and `advanceChallenge()` also handle lesson boundaries.

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
      "concept": "string",       // shown as italic subtitle under lesson title
      "initial_cwd": "/home/user",  // default starting cwd for all challenges in this lesson
      "challenges": [{
        "initial_cwd": "/home/user/Documents",  // optional: overrides lesson-level cwd
        "explanation": "string",  // shown in the '📖 Learn' section (whitespace-pre-line)
        "instruction": "string",  // shown in the '💻 Try it' section
        "expected_commands": ["cmd1", "cmd2"],
        "hint": "string",         // shown after 2 wrong attempts
        "success_message": "string"
      }]
    }]
  }]
}
```

Set `"locked": true` and `"lessons": []` for placeholder sections.

## Adding new content

To add a new lesson section: add an entry to `data/lessons.json` with `"locked": false` and populate `lessons[]`. To add a new command to the terminal simulator: add a `case` in `VirtualTerminal.execute()` and implement a `_<command>()` method. Add files/dirs to `_buildFs()`.

## Design

Dark palette: `slate-950` background, `slate-800` borders, `green-400` accent (terminal green). Font: JetBrains Mono via Google Fonts (loaded in `styles.css`). Layout mirrors vim-hero.com structure.

---

## Planned (not yet implemented)

### Deploy — Netlify
Static site, no build step. Drop files, configure `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Database — Supabase
Replace `localStorage` with Supabase for cross-device progress. Add user auth (email/magic link). Schema: `users`, `progress(user_id, section_id, lesson_id, challenge_idx, completed_at)`.

### Payments — Stripe
Stripe Checkout for premium access to advanced sections (File Operations, Permissions, Shell Scripting, etc.). Gate locked sections server-side once backend exists.

### User model
`guest` (localStorage only) → `registered` (Supabase, free tier unlocked) → `premium` (Stripe, full access).
