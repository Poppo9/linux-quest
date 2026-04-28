class VirtualTerminal {
  constructor() {
    this.home = '/home/user';
    this.cwd = '/home/user';
    this.fs = this._buildFs();
  }

  _buildFs() {
    return {
      type: 'dir',
      children: {
        home: {
          type: 'dir',
          children: {
            user: {
              type: 'dir',
              perms: 'drwxr-xr-x', date: 'Jan 16 09:05',
              children: {
                '.bashrc':       { type: 'file', size: 3771,    perms: '-rw-r--r--', date: 'Jan 15 09:23' },
                '.bash_history': { type: 'file', size: 1024,    perms: '-rw-------', date: 'Jan 16 08:30' },
                'notes.txt':     { type: 'file', size: 242,     perms: '-rw-r--r--', date: 'Jan 15 14:30' },
                'todo.txt':      { type: 'file', size: 89,      perms: '-rw-r--r--', date: 'Jan 16 09:05' },
                Documents: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 14 16:45',
                  children: {
                    'report.pdf':  { type: 'file', size: 48291,  perms: '-rw-r--r--', date: 'Jan 14 16:45' },
                    'letter.txt':  { type: 'file', size: 1203,   perms: '-rw-r--r--', date: 'Jan 13 11:20' },
                    projects: {
                      type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 10 10:00',
                      children: {
                        'readme.md': { type: 'file', size: 512,  perms: '-rw-r--r--', date: 'Jan 10 10:00' },
                        'app.py':    { type: 'file', size: 2048, perms: '-rw-r--r--', date: 'Jan 11 14:22' }
                      }
                    }
                  }
                },
                Downloads: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 12 15:30',
                  children: {
                    'archive.zip': { type: 'file', size: 1048576, perms: '-rw-r--r--', date: 'Jan 12 15:30' },
                    'setup.sh':    { type: 'file', size: 1256,    perms: '-rwxr-xr-x', date: 'Jan 13 09:15' }
                  }
                },
                Pictures: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  8 20:15',
                  children: {
                    'vacation.jpg':   { type: 'file', size: 3145728, perms: '-rw-r--r--', date: 'Jan  8 20:15' },
                    'screenshot.png': { type: 'file', size: 512000,  perms: '-rw-r--r--', date: 'Jan 16 07:45' }
                  }
                },
                Music: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  5 18:00',
                  children: {
                    'playlist.m3u': { type: 'file', size: 1024, perms: '-rw-r--r--', date: 'Jan  5 18:00' }
                  }
                }
              }
            }
          }
        },
        etc: {
          type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  1 00:00',
          children: {
            hosts: { type: 'file', size: 221, perms: '-rw-r--r--', date: 'Jan  1 00:00' }
          }
        }
      }
    };
  }

  reset(cwd) {
    this.cwd = cwd || this.home;
  }

  getPrompt() {
    let displayPath = this.cwd;
    if (displayPath === this.home) {
      displayPath = '~';
    } else if (displayPath.startsWith(this.home + '/')) {
      displayPath = '~' + displayPath.slice(this.home.length);
    }
    return `<span class="text-green-400 font-bold">user@linux-quest</span>:<span class="text-blue-400">${displayPath}</span>$&nbsp;`;
  }

  execute(input) {
    const trimmed = input.trim();
    if (!trimmed) return { lines: [] };

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'pwd':   return this._pwd();
      case 'ls':    return this._ls(args);
      case 'll':    return this._ls(['-la']);
      case 'cd':    return this._cd(args);
      case 'clear': return { lines: [], clear: true };
      case 'help':  return this._help();
      default:
        return {
          lines: [`<span class="text-red-400">${this._esc(cmd)}: command not found</span>`],
          error: true
        };
    }
  }

  _pwd() {
    return { lines: [this.cwd] };
  }

  _ls(args) {
    let showHidden = false;
    let longFormat = false;
    let targetPath = null;

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('a')) showHidden = true;
        if (arg.includes('l')) longFormat = true;
      } else {
        targetPath = arg;
      }
    }

    const resolvedPath = targetPath ? this._resolvePath(targetPath) : this.cwd;
    const node = this._getNode(resolvedPath);

    if (!node) {
      return {
        lines: [`<span class="text-red-400">ls: cannot access '${this._esc(targetPath)}': No such file or directory</span>`],
        error: true
      };
    }
    if (node.type !== 'dir') {
      return { lines: [this._esc(targetPath || '')] };
    }

    const children = node.children || {};
    let entries = Object.entries(children);
    if (!showHidden) {
      entries = entries.filter(([name]) => !name.startsWith('.'));
    }
    entries.sort(([a], [b]) => {
      const aH = a.startsWith('.');
      const bH = b.startsWith('.');
      if (aH !== bH) return aH ? -1 : 1;
      return a.localeCompare(b);
    });

    if (longFormat) {
      const lines = [];
      const total = entries.reduce((s, [, n]) => s + (n.type === 'dir' ? 8 : Math.ceil((n.size || 0) / 512)), showHidden ? 16 : 0);
      lines.push(`total ${total}`);
      if (showHidden) {
        lines.push(`drwxr-xr-x  2 user user  4096 Jan 16 09:05 <span class="text-blue-400 font-bold">.</span>`);
        lines.push(`drwxr-xr-x  3 user user  4096 Jan 10 08:00 <span class="text-blue-400 font-bold">..</span>`);
      }
      for (const [name, info] of entries) {
        const perms = info.perms || (info.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
        const links = info.type === 'dir' ? ' 2' : ' 1';
        const size = String(info.size || 4096).padStart(6);
        const date = info.date || 'Jan  1 00:00';
        lines.push(`${perms} ${links} user user ${size} ${date} ${this._fmtName(name, info.type)}`);
      }
      return { lines };
    } else {
      const parts = [];
      if (showHidden) {
        parts.push('<span class="text-blue-400 font-bold">.</span>');
        parts.push('<span class="text-blue-400 font-bold">..</span>');
      }
      for (const [name, info] of entries) {
        parts.push(this._fmtName(name, info.type));
      }
      return { lines: [parts.join('  ')] };
    }
  }

  _cd(args) {
    const target = args[0];
    let newPath;

    if (!target || target === '~') {
      newPath = this.home;
    } else {
      newPath = this._resolvePath(target);
    }

    const node = this._getNode(newPath);
    if (!node) {
      return {
        lines: [`<span class="text-red-400">bash: cd: ${this._esc(target)}: No such file or directory</span>`],
        error: true
      };
    }
    if (node.type !== 'dir') {
      return {
        lines: [`<span class="text-red-400">bash: cd: ${this._esc(target)}: Not a directory</span>`],
        error: true
      };
    }

    this.cwd = newPath;
    return { lines: [] };
  }

  _help() {
    return {
      lines: [
        '<span class="text-green-400">Available commands in this lesson:</span>',
        '  pwd              Print working directory',
        '  ls [opts] [path] List directory contents',
        '  ll               Shortcut for ls -la',
        '  cd [path]        Change directory',
        '  clear            Clear the terminal',
      ]
    };
  }

  // ─── Tab completion ───────────────────────────────────────────────────────

  complete(input) {
    const trailingSpace = input !== input.trimEnd();
    const parts = input.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return { matches: [], type: 'none' };

    // Complete command name: single word, no trailing space
    if (parts.length === 1 && !trailingSpace) {
      const commands = ['cd', 'clear', 'help', 'll', 'ls', 'pwd'];
      const partial = parts[0];
      const matches = commands.filter(c => c.startsWith(partial) && c !== partial);
      return { type: 'command', matches, partial };
    }

    // Complete path argument
    const cmd = parts[0];
    const partialArg = trailingSpace ? '' : parts[parts.length - 1];

    if (partialArg.startsWith('-')) return { matches: [], type: 'none' };

    // Split partialArg into directory prefix and name prefix
    const lastSlash = partialArg.lastIndexOf('/');
    let dirPath, namePrefix, argPrefix;

    if (lastSlash === -1) {
      dirPath = this.cwd;
      namePrefix = partialArg;
      argPrefix = '';
    } else if (lastSlash === 0) {
      dirPath = '/';
      namePrefix = partialArg.slice(1);
      argPrefix = '/';
    } else {
      const dirPart = partialArg.slice(0, lastSlash);
      argPrefix = partialArg.slice(0, lastSlash + 1);
      dirPath = this._resolvePath(dirPart);
      namePrefix = partialArg.slice(lastSlash + 1);
    }

    const node = this._getNode(dirPath);
    if (!node || node.type !== 'dir') return { matches: [], type: 'none' };

    const dirsOnly = cmd === 'cd';
    const entries = Object.entries(node.children || {})
      .filter(([name, info]) =>
        name.startsWith(namePrefix) &&
        !name.startsWith('.') &&
        (!dirsOnly || info.type === 'dir')
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, info]) => ({
        name,
        fullArg: argPrefix + name,
        isDir: info.type === 'dir'
      }));

    return { type: 'path', matches: entries, partial: partialArg, cmdParts: trailingSpace ? parts : parts.slice(0, -1) };
  }

  _resolvePath(path) {
    const cleaned = path.replace(/\/+$/, '');
    if (cleaned === '~' || cleaned === '') return this.home;
    if (cleaned.startsWith('~/')) return this._normalize(this.home + '/' + cleaned.slice(2));
    if (cleaned.startsWith('/')) return this._normalize(cleaned);
    return this._normalize(this.cwd + '/' + cleaned);
  }

  _normalize(path) {
    const parts = path.split('/').filter(p => p !== '' && p !== '.');
    const result = [];
    for (const part of parts) {
      if (part === '..') result.pop();
      else result.push(part);
    }
    return '/' + result.join('/');
  }

  _getNode(path) {
    if (path === '/') return this.fs;
    const parts = path.split('/').filter(Boolean);
    let node = this.fs;
    for (const part of parts) {
      if (!node.children || !(part in node.children)) return null;
      node = node.children[part];
    }
    return node;
  }

  _fmtName(name, type) {
    const escaped = this._esc(name);
    if (type === 'dir') return `<span class="text-blue-400 font-bold">${escaped}</span>`;
    if (name.endsWith('.sh') || name.endsWith('.py')) return `<span class="text-green-300">${escaped}</span>`;
    if (name.startsWith('.')) return `<span class="text-slate-400">${escaped}</span>`;
    return escaped;
  }

  _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
