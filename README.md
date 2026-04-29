# linux-quest

A gamified, interactive Linux command tutorial — learn bash by doing, not by reading.

Each lesson explains a command in detail, then drops you into a simulated terminal to practice it. Progress is saved in your browser and synced to the cloud when signed in.

## Structure

- `index.html` — landing page
- `lessons.html` — interactive lessons with simulated terminal
- `css/styles.css` — animations, terminal styles, font imports
- `js/terminal.js` — `VirtualTerminal` class (simulated filesystem + 43 commands)
- `js/lessons.js` — `LessonEngine` class (lesson loading, validation, progress, sidebar)
- `js/auth.js` — Supabase auth, progress sync, tier gating
- `data/lessons.json` — all lesson/challenge content

---

## Roadmap

### In scope — linux-quest

| # | Section | Key commands | Status |
|---|---------|--------------|--------|
| 1 | **Navigating Directories** | `pwd`, `ls`, `ll`, `cd`, absolute/relative paths | ✅ 7 lessons |
| 2 | **File Operations** | `touch`, `mkdir`, `cp`, `mv`, `rm`, `rmdir` | ✅ 6 lessons |
| 3 | **Reading File Content** | `cat`, `echo`, `head`, `tail` | ✅ 4 lessons |
| 4 | **Search & Find** | `grep`, `grep -r`, `find`, `diff`, `locate` | ✅ 5 lessons |
| 5 | **Text Processing** | `sort`, `uniq`, `cut`, `wc` | ✅ 4 lessons |
| 6 | **Permissions & Ownership** | `chmod`, `chown`, `stat`, `file`, `du`, `df` | ✅ 6 lessons |
| 7 | **System Information** | `uname`, `hostname`, `date`, `ps`, `env` | ✅ 5 lessons |
| 8 | **Session & Navigation** | `history`, `which`, `man` | ✅ 3 lessons |
| 9 | **Pipes & Redirection** | `\|`, `>`, `>>`, `<`, `tee`, `xargs`, `sed`, `awk`, `tr` | 🔧 requires parser refactor (~10h) |

---

### Out of scope — progetti futuri separati

Questi topic richiedono architetture o UI troppo complesse per questa webapp.

| Progetto | Comandi / Concetti | Motivo |
|----------|--------------------|--------|
| **vim-quest** (o simile) | `vim`, `nano` | UI modale complessa — app dedicata (vedi vim-hero.com) |
| **shell-quest** | `if`, `for`, `while`, `case`, funzioni, `source`, variabili | Richiede un interprete di script |
| **git-quest** | `git init/add/commit/push/branch/merge/rebase` | Ricco abbastanza per un'app autonoma |
| **net-quest** | `ssh`, `curl`, `wget`, `ping`, `ifconfig`, `netstat` | Richiede backend o simulazione di rete |
| **sysadmin-quest** | `apt/brew/pip`, `systemctl`, `cron`, `sudo`, `jobs/bg/fg/kill` | Richiede simulazione di package index e process table persistente |

---

## Running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

A local server is required because lessons are loaded via `fetch('data/lessons.json')`.

## Sources of inspiration

- Gamification as a static webapp: https://www.vim-hero.com
- Command reference: https://github.com/RehanSaeed/Bash-Cheat-Sheet
