# linux-quest

**Learn Linux commands interactively — a gamified bash tutorial for beginners and developers.**

linux-quest is an open-source, browser-based Linux terminal simulator.
Each lesson teaches a real bash command in depth, then drops you into a simulated terminal to practice it hands-on — no VM, no setup, no cost.

🔗 **Live demo:** [linux-quest.com](https://linux-quest.com/)

---

## What is linux-quest?

linux-quest is a gamified Linux command-line tutorial that teaches bash by doing, not by reading.
It covers essential Linux commands across 8 sections — from basic navigation to file permissions, text processing, and system information — all inside an in-browser simulated terminal.

**Who is it for?**
- Beginners with zero Linux experience
- Developers who want to sharpen their command-line skills
- Students preparing for Linux/Unix exams or DevOps roles

---

## Access & Pricing

| Tier | Details |
|------|---------|
| **Free** | Full access from day one — no payment required |
| **Support** | If linux-quest helped you, consider starring [Poppo9/linux-quest](https://github.com/Poppo9/linux-quest) on GitHub |

Progress is automatically saved in your browser's local cache.

---

## Project Structure

| File / Directory | Description |
|-----------------|-------------|
| `index.html` | Landing page — hero section, demo terminal, course overview ("What you'll learn"), call to action |
| `lessons.html` | Interactive lesson pages with simulated terminal |
| `css/styles.css` | Animations, terminal UI styles, font imports |
| `js/terminal.js` | `VirtualTerminal` class — simulated filesystem supporting 43 bash commands |
| `js/lessons.js` | `LessonEngine` class — lesson loading, answer validation, progress tracking, sidebar navigation |
| `js/auth.js` | GitHub OAuth via Supabase, star verification, progress sync, tier gating |
| `netlify/functions/verify-star.js` | Serverless function: verifies GitHub star → unlocks premium tier in database |
| `data/lessons.json` | All lesson and challenge content (lesson titles are descriptive; no command names in parentheses) |

---

## Curriculum & Roadmap

### ✅ In scope — linux-quest

| # | Section | Key Commands | Status |
|---|---------|--------------|--------|
| 1 | **Navigating Directories** | `pwd`, `ls`, `ll`, `cd`, absolute/relative paths | ✅ 7 lessons |
| 2 | **File Operations** | `touch`, `mkdir`, `cp`, `mv`, `rm`, `rmdir` | ✅ 6 lessons |
| 3 | **Reading File Content** | `cat`, `echo`, `head`, `tail` | ✅ 4 lessons |
| 4 | **Search & Find** | `grep`, `grep -r`, `find`, `diff`, `locate` | ✅ 5 lessons |
| 5 | **Text Processing** | `sort`, `uniq`, `cut`, `wc` | ✅ 4 lessons |
| 6 | **Permissions & Ownership** | `chmod`, `chown`, `stat`, `file`, `du`, `df` | ✅ 6 lessons |
| 7 | **System Information** | `uname`, `hostname`, `date`, `ps`, `env` | ✅ 5 lessons |
| 8 | **Session & Navigation** | `history`, `which`, `man` | ✅ 3 lessons |
| 9 | **Pipes & Redirection** | `\|`, `>`, `>>`, `<`, `tee`, `xargs`, `sed`, `awk`, `tr` | 🔧 Requires parser refactor (~10h) |

### 🗺️ Out of scope — planned as separate projects

These topics require architectures or UIs too complex for this webapp and are better suited as standalone tools.

| Project | Commands / Concepts | Reason |
|---------|--------------------|-----------------------------------------|
| **vim-quest** (or similar) | `vim`, `nano` | Complex modal UI — needs a dedicated app (see vim-hero.com) |
| **shell-quest** | `if`, `for`, `while`, `case`, functions, `source`, variables | Requires a full script interpreter |
| **git-quest** | `git init/add/commit/push/branch/merge/rebase` | Rich enough to be a standalone app |
| **net-quest** | `ssh`, `curl`, `wget`, `ping`, `ifconfig`, `netstat` | Requires backend or network simulation |
| **sysadmin-quest** | `apt/brew/pip`, `systemctl`, `cron`, `sudo`, `jobs/bg/fg/kill` | Requires persistent package index and process table simulation |

---

## Running Locally

A local server is required because lessons are fetched from `data/lessons.json` via the Fetch API.

```bash
python -m http.server 8080
# Then open http://localhost:8080 in your browser
```

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Auth & DB:** Supabase (GitHub OAuth, progress sync)
- **Serverless:** Netlify Functions (star verification)
- **Hosting:** Netlify

---

## Inspiration & References

- Gamified static webapp approach: [vim-hero.com](https://www.vim-hero.com)
- Bash command reference: [RehanSaeed/Bash-Cheat-Sheet](https://github.com/RehanSaeed/Bash-Cheat-Sheet)

---

## Keywords

`linux tutorial` · `bash commands` · `learn linux` · `interactive terminal` · `command line practice` · `bash for beginners` · `linux simulator` · `gamified learning` · `DevOps basics` · `open source linux course`
