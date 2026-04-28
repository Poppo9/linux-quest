# linux-quest

A gamified, interactive Linux command tutorial — learn bash by doing, not by reading.

Each lesson explains a command in detail, then drops you into a simulated terminal to practice it. Progress is saved in your browser.

## Structure

- `index.html` — landing page
- `lessons.html` — interactive lessons with simulated terminal
- `css/styles.css` — animations, terminal styles, font imports
- `js/terminal.js` — `VirtualTerminal` class (simulated filesystem + commands)
- `js/lessons.js` — `LessonEngine` class (lesson loading, validation, progress)
- `data/lessons.json` — all lesson/challenge content

---

## Roadmap

### In scope — linux-quest

Lezioni da implementare in `data/lessons.json`. I comandi sono già tutti simulati in `terminal.js`.

| # | Sezione | Comandi | Stato |
|---|---------|---------|-------|
| 1 | **Navigating Directories** | `pwd`, `ls`, `ls -l`, `ls -a`, `ll`, `cd`, `cd ..`, `cd ~`, path assoluti/relativi | ✅ disponibile |
| 2 | **File Operations** | `touch`, `mkdir`, `rmdir`, `cp`, `mv`, `rm`, `rm -r` | 🔒 da scrivere |
| 3 | **Reading File Content** | `cat`, `head`, `tail`, `wc`, `wc -l` | 🔒 da scrivere |
| 4 | **Search & Find** | `find`, `find -name`, `find -type`, `grep`, `grep -i`, `grep -n` | 🔒 da scrivere |
| 5 | **Text Processing** | `sort`, `sort -r`, `uniq`, `uniq -c`, `cut -d -f` | 🔒 da scrivere |
| 6 | **Permissions & Ownership** | `chmod` (ottale + simbolico), `chown`, `stat`, `file` | 🔒 da scrivere |
| 7 | **System Information** | `uname`, `hostname`, `id`, `whoami`, `date`, `df`, `du`, `ps`, `env` | 🔒 da scrivere |
| 8 | **Session & Navigation** | `history`, `which`, `man`, `echo`, `clear` | 🔒 da scrivere |
| 9 | **Pipes & Redirection** | `\|`, `>`, `>>`, `<`, `tee`, `xargs`, `sed`, `awk`, `tr` | 🔧 richiede refactor parser (~10h) |

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
