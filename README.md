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

## Topics

**Available:**
- Navigating Directories: `pwd`, `ls`, `ll`, `ls -l`, `ls -a`, `cd`, `cd ..`, `cd ~`, absolute paths

**Planned (locked):**
File Operations · Reading File Content · Permissions · Search & Find · Processes · Pipes & Redirection · Text Processing · Networking · Shell Scripting

## Running locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

A local server is required because lessons are loaded via `fetch('data/lessons.json')`.

## Sources of inspiration

- Gamification as a static webapp: https://www.vim-hero.com
- Command reference: https://github.com/RehanSaeed/Bash-Cheat-Sheet
