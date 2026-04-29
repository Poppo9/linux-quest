class VirtualTerminal {
  constructor() {
    this.home = '/home/user';
    this.cwd = '/home/user';
    this.fs = this._buildFs();
    this._history = [];
    this._commands = {
      // Navigation
      pwd:      { help: 'print working directory',                execute: (args) => this._pwd(args) },
      ls:       { help: 'list directory contents',                execute: (args) => this._ls(args) },
      ll:       { help: 'shortcut for ls -la',                    execute: (args) => this._ls(['-la', ...args]) },
      cd:       { help: 'change directory',                       execute: (args) => this._cd(args) },
      // File operations
      mv:       { help: 'move or rename files',                   execute: (args) => this._mv(args) },
      cp:       { help: 'copy files and directories',             execute: (args) => this._cp(args) },
      rm:       { help: 'remove files or directories',            execute: (args) => this._rm(args) },
      mkdir:    { help: 'make directories',                       execute: (args) => this._mkdir(args) },
      rmdir:    { help: 'remove empty directories',               execute: (args) => this._rmdir(args) },
      touch:    { help: 'create file or update timestamp',        execute: (args) => this._touch(args) },
      // File content
      cat:      { help: 'print file contents',                    execute: (args) => this._cat(args) },
      echo:     { help: 'print text to terminal',                 execute: (args) => this._echo(args) },
      head:     { help: 'output first lines of a file',           execute: (args) => this._head(args) },
      tail:     { help: 'output last lines of a file',            execute: (args) => this._tail(args) },
      // Text processing
      sort:     { help: 'sort lines of text files',               execute: (args) => this._sort(args) },
      uniq:     { help: 'filter adjacent duplicate lines',        execute: (args) => this._uniq(args) },
      cut:      { help: 'extract columns from text',              execute: (args) => this._cut(args) },
      wc:       { help: 'word, line, and byte count',             execute: (args) => this._wc(args) },
      grep:     { help: 'search for pattern in files',            execute: (args) => this._grep(args) },
      // Search
      find:     { help: 'search for files in a directory',        execute: (args) => this._find(args) },
      diff:     { help: 'compare files line by line',             execute: (args) => this._diff(args) },
      locate:   { help: 'find files by name',                     execute: (args) => this._locate(args) },
      // Permissions & ownership
      chmod:    { help: 'change file permissions',                execute: (args) => this._chmod(args) },
      chown:    { help: 'change file owner',                      execute: (args) => this._chown(args) },
      // File metadata
      stat:     { help: 'display file status',                    execute: (args) => this._stat(args) },
      file:     { help: 'determine file type',                    execute: (args) => this._file(args) },
      // Disk usage
      du:       { help: 'estimate file space usage',              execute: (args) => this._du(args) },
      df:       { help: 'report file system disk space usage',    execute: ()     => this._df() },
      // System info
      uname:    { help: 'print system information',               execute: (args) => this._uname(args) },
      hostname: { help: 'show system hostname',                   execute: ()     => ({ lines: ['linux-quest'] }) },
      id:       { help: 'print user and group information',       execute: ()     => ({ lines: ['uid=1000(user) gid=1000(user) groups=1000(user),4(adm),27(sudo)'] }) },
      whoami:   { help: 'print current user name',               execute: ()     => ({ lines: ['user'] }) },
      date:     { help: 'print current date and time',            execute: ()     => this._date() },
      // Processes
      ps:       { help: 'report running processes',               execute: (args) => this._ps(args) },
      // Environment
      env:      { help: 'print environment variables',            execute: ()     => this._env() },
      printenv: { help: 'print environment variables',            execute: ()     => this._env() },
      // Session
      history:  { help: 'show command history',                   execute: ()     => this._showHistory() },
      which:    { help: 'locate a command',                       execute: (args) => this._which(args) },
      man:      { help: 'display manual page for a command',      execute: (args) => this._man(args) },
      // Terminal
      clear:    { help: 'clear the terminal',                     execute: ()     => ({ lines: [], clear: true }) },
      help:     { help: 'show available commands',                execute: ()     => this._help() },
    };
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
                '.bashrc': {
                  type: 'file', size: 3771, perms: '-rw-r--r--', date: 'Jan 15 09:23',
                  content: [
                    '# ~/.bashrc',
                    'export PATH="$HOME/.local/bin:$PATH"',
                    'alias ll=\'ls -la\'',
                    'alias la=\'ls -A\'',
                    'export EDITOR=vim',
                    'PS1=\'\\u@\\h:\\w\\$ \'',
                  ]
                },
                '.bash_history': {
                  type: 'file', size: 1024, perms: '-rw-------', date: 'Jan 16 08:30',
                  content: ['ls', 'cd Documents', 'cat notes.txt', 'pwd', 'ls -la']
                },
                'notes.txt': {
                  type: 'file', size: 242, perms: '-rw-r--r--', date: 'Jan 15 14:30',
                  content: [
                    'Meeting notes - Jan 15',
                    '------------------------',
                    'TODO: follow up with team on project status',
                    'TODO: update documentation',
                    'Remember to check the server logs',
                    'Next meeting: Thursday 3pm',
                  ]
                },
                'todo.txt': {
                  type: 'file', size: 89, perms: '-rw-r--r--', date: 'Jan 16 09:05',
                  content: [
                    '[ ] Buy groceries',
                    '[ ] Call dentist',
                    '[x] Pay bills',
                    '[ ] Fix the leaky faucet',
                    '[ ] Read chapter 5',
                  ]
                },
                'notes_v2.txt': {
                  type: 'file', size: 248, perms: '-rw-r--r--', date: 'Jan 16 12:00',
                  content: [
                    'Meeting notes - Jan 15',
                    '------------------------',
                    'TODO: follow up with team on project status',
                    'TODO: update documentation',
                    'TODO: review pull requests',
                    'Next meeting: Friday 4pm',
                  ]
                },
                'temp.txt': {
                  type: 'file', size: 32, perms: '-rw-r--r--', date: 'Jan 16 10:00',
                  content: ['temporary file - safe to delete']
                },
                tmp: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 16 10:00',
                  children: {}
                },
                old: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 10 08:00',
                  children: {}
                },
                Documents: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 14 16:45',
                  children: {
                    'report.pdf': {
                      type: 'file', size: 48291, perms: '-rw-r--r--', date: 'Jan 14 16:45',
                      content: ['(binary PDF file, 48291 bytes)']
                    },
                    'letter.txt': {
                      type: 'file', size: 1203, perms: '-rw-r--r--', date: 'Jan 13 11:20',
                      content: [
                        'Dear Alice,',
                        '',
                        'I hope this message finds you well. I wanted to reach out about',
                        'the upcoming conference next month. Would you be available to',
                        'present the new findings?',
                        '',
                        'Please let me know your availability by Friday.',
                        '',
                        'Best regards,',
                        'Bob',
                      ]
                    },
                    'scores.csv': {
                      type: 'file', size: 128, perms: '-rw-r--r--', date: 'Jan 14 10:00',
                      content: [
                        'name,score,grade',
                        'Alice,95,A',
                        'Bob,82,B',
                        'Carol,78,C',
                        'Dave,91,A',
                        'Eve,88,B',
                      ]
                    },
                    'letter_v2.txt': {
                      type: 'file', size: 1240, perms: '-rw-r--r--', date: 'Jan 14 09:00',
                      content: [
                        'Dear Alice,',
                        '',
                        'I hope this message finds you well. I wanted to reach out about',
                        'the upcoming conference next month. Would you be available to',
                        'present the new findings and lead the Q&A session?',
                        '',
                        'Please let me know your availability by Wednesday.',
                        '',
                        'Best regards,',
                        'Bob',
                      ]
                    },
                    'duplicates.txt': {
                      type: 'file', size: 64, perms: '-rw-r--r--', date: 'Jan 14 11:00',
                      content: [
                        'apple',
                        'apple',
                        'banana',
                        'cherry',
                        'cherry',
                        'cherry',
                        'date',
                      ]
                    },
                    projects: {
                      type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 10 10:00',
                      children: {
                        'readme.md': {
                          type: 'file', size: 512, perms: '-rw-r--r--', date: 'Jan 10 10:00',
                          content: [
                            '# My Project',
                            '',
                            'A simple project to demonstrate bash commands.',
                            '',
                            '## Installation',
                            '',
                            '    pip install -r requirements.txt',
                            '',
                            '## Usage',
                            '',
                            '    python app.py',
                            '',
                            '## License',
                            '',
                            'MIT',
                          ]
                        },
                        'app.py': {
                          type: 'file', size: 2048, perms: '-rw-r--r--', date: 'Jan 11 14:22',
                          content: [
                            '#!/usr/bin/env python3',
                            '"""A simple demo application."""',
                            '',
                            'def greet(name):',
                            '    return f"Hello, {name}!"',
                            '',
                            'if __name__ == "__main__":',
                            '    print(greet("World"))',
                          ]
                        }
                      }
                    }
                  }
                },
                Downloads: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan 12 15:30',
                  children: {
                    'archive.zip': {
                      type: 'file', size: 1048576, perms: '-rw-r--r--', date: 'Jan 12 15:30',
                      content: ['(binary ZIP file, 1048576 bytes)']
                    },
                    'setup.sh': {
                      type: 'file', size: 1256, perms: '-rwxr-xr-x', date: 'Jan 13 09:15',
                      content: [
                        '#!/bin/bash',
                        'set -e',
                        'echo "Installing dependencies..."',
                        'apt-get update && apt-get install -y curl git',
                        'echo "Setup complete."',
                      ]
                    }
                  }
                },
                Pictures: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  8 20:15',
                  children: {
                    'vacation.jpg':   { type: 'file', size: 3145728, perms: '-rw-r--r--', date: 'Jan  8 20:15', content: ['(binary JPEG file, 3145728 bytes)'] },
                    'screenshot.png': { type: 'file', size: 512000,  perms: '-rw-r--r--', date: 'Jan 16 07:45', content: ['(binary PNG file, 512000 bytes)'] }
                  }
                },
                Music: {
                  type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  5 18:00',
                  children: {
                    'playlist.m3u': {
                      type: 'file', size: 1024, perms: '-rw-r--r--', date: 'Jan  5 18:00',
                      content: ['#EXTM3U', '#EXTINF:240,Song One', 'song1.mp3', '#EXTINF:195,Song Two', 'song2.mp3']
                    }
                  }
                }
              }
            }
          }
        },
        etc: {
          type: 'dir', perms: 'drwxr-xr-x', date: 'Jan  1 00:00',
          children: {
            hosts: {
              type: 'file', size: 221, perms: '-rw-r--r--', date: 'Jan  1 00:00',
              content: ['127.0.0.1   localhost', '127.0.1.1   linux-quest', '::1         localhost ip6-localhost']
            }
          }
        }
      }
    };
  }

  reset(cwd) {
    this.cwd = cwd || this.home;
    this.fs  = this._buildFs();
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
    this._history.push(trimmed);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const handler = this._commands[cmd];
    if (!handler) {
      return {
        lines: [`<span class="text-red-400">${this._esc(cmd)}: command not found</span>`],
        error: true
      };
    }
    return handler.execute(args);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

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
      const sizeW = Math.max(4, ...entries.map(([, n]) => String(n.size || 4096).length));
      lines.push(`total ${total}`);
      if (showHidden) {
        lines.push(`drwxr-xr-x  2 user user ${'4096'.padStart(sizeW)} Jan 16 09:05 <span class="text-blue-400 font-bold">.</span>`);
        lines.push(`drwxr-xr-x  3 user user ${'4096'.padStart(sizeW)} Jan 10 08:00 <span class="text-blue-400 font-bold">..</span>`);
      }
      for (const [name, info] of entries) {
        const perms = info.perms || (info.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
        const links = info.type === 'dir' ? ' 2' : ' 1';
        const size = String(info.size || 4096).padStart(sizeW);
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

  // ─── File operations ───────────────────────────────────────────────────────

  _mv(args) {
    if (args.length < 2) {
      const src = args[0] ? `'${this._esc(args[0])}'` : 'file operand';
      return { lines: [`<span class="text-red-400">mv: missing destination file operand after ${src}</span>`], error: true };
    }

    const srcPath = this._resolvePath(args[0]);
    const srcNode = this._getNode(srcPath);
    if (!srcNode) {
      return { lines: [`<span class="text-red-400">mv: cannot stat '${this._esc(args[0])}': No such file or directory</span>`], error: true };
    }

    let dstPath = this._resolvePath(args[1]);
    const dstNode = this._getNode(dstPath);
    const srcName = this._splitPath(srcPath).name;
    if (dstNode && dstNode.type === 'dir') {
      dstPath = dstPath === '/' ? '/' + srcName : dstPath + '/' + srcName;
    }

    if (srcNode.type === 'dir' && (dstPath === srcPath || dstPath.startsWith(srcPath + '/'))) {
      return { lines: [`<span class="text-red-400">mv: cannot move '${this._esc(args[0])}' to a subdirectory of itself</span>`], error: true };
    }

    const { parentPath: dstParentPath, name: dstName } = this._splitPath(dstPath);
    const dstParent = this._getNode(dstParentPath);
    if (!dstParent || dstParent.type !== 'dir') {
      return { lines: [`<span class="text-red-400">mv: cannot move '${this._esc(args[0])}' to '${this._esc(args[1])}': No such file or directory</span>`], error: true };
    }

    const srcParent = this._getNode(this._splitPath(srcPath).parentPath);
    dstParent.children[dstName] = srcParent.children[srcName];
    delete srcParent.children[srcName];
    return { lines: [] };
  }

  _cp(args) {
    let recursive = false;
    const paths = [];
    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r') || arg.includes('R')) recursive = true;
      } else {
        paths.push(arg);
      }
    }
    if (paths.length < 2) {
      return { lines: [`<span class="text-red-400">cp: missing destination file operand</span>`], error: true };
    }

    const srcPath = this._resolvePath(paths[0]);
    const srcNode = this._getNode(srcPath);
    if (!srcNode) {
      return { lines: [`<span class="text-red-400">cp: cannot stat '${this._esc(paths[0])}': No such file or directory</span>`], error: true };
    }
    if (srcNode.type === 'dir' && !recursive) {
      return { lines: [`<span class="text-red-400">cp: -r not specified; omitting directory '${this._esc(paths[0])}'</span>`], error: true };
    }

    let dstPath = this._resolvePath(paths[1]);
    const dstNode = this._getNode(dstPath);
    const srcName = this._splitPath(srcPath).name;
    if (dstNode && dstNode.type === 'dir') {
      dstPath = dstPath === '/' ? '/' + srcName : dstPath + '/' + srcName;
    }

    const { parentPath: dstParentPath, name: dstName } = this._splitPath(dstPath);
    const dstParent = this._getNode(dstParentPath);
    if (!dstParent || dstParent.type !== 'dir') {
      return { lines: [`<span class="text-red-400">cp: cannot create '${this._esc(paths[1])}': No such file or directory</span>`], error: true };
    }

    dstParent.children[dstName] = this._deepCopy(srcNode);
    return { lines: [] };
  }

  _rm(args) {
    let recursive = false;
    let force = false;
    const paths = [];
    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r') || arg.includes('R')) recursive = true;
        if (arg.includes('f')) force = true;
      } else {
        paths.push(arg);
      }
    }
    if (!paths.length) {
      return { lines: [`<span class="text-red-400">rm: missing operand</span>`], error: true };
    }

    for (const p of paths) {
      const fullPath = this._resolvePath(p);
      const node = this._getNode(fullPath);
      if (!node) {
        if (force) continue;
        return { lines: [`<span class="text-red-400">rm: cannot remove '${this._esc(p)}': No such file or directory</span>`], error: true };
      }
      if (node.type === 'dir' && !recursive) {
        return { lines: [`<span class="text-red-400">rm: cannot remove '${this._esc(p)}': Is a directory</span>`], error: true };
      }
      const { parentPath, name } = this._splitPath(fullPath);
      delete this._getNode(parentPath).children[name];
    }
    return { lines: [] };
  }

  _mkdir(args) {
    let makeParents = false;
    const paths = [];
    for (const arg of args) {
      if (arg === '-p') makeParents = true;
      else paths.push(arg);
    }
    if (!paths.length) {
      return { lines: [`<span class="text-red-400">mkdir: missing operand</span>`], error: true };
    }

    for (const p of paths) {
      const fullPath = this._resolvePath(p);
      if (this._getNode(fullPath)) {
        if (!makeParents) {
          return { lines: [`<span class="text-red-400">mkdir: cannot create directory '${this._esc(p)}': File exists</span>`], error: true };
        }
        continue;
      }
      const { parentPath, name } = this._splitPath(fullPath);
      const parent = this._getNode(parentPath);
      if (!parent || parent.type !== 'dir') {
        return { lines: [`<span class="text-red-400">mkdir: cannot create directory '${this._esc(p)}': No such file or directory</span>`], error: true };
      }
      parent.children[name] = { type: 'dir', perms: 'drwxr-xr-x', date: this._nowDate(), children: {} };
    }
    return { lines: [] };
  }

  _rmdir(args) {
    if (!args.length) {
      return { lines: [`<span class="text-red-400">rmdir: missing operand</span>`], error: true };
    }
    for (const p of args) {
      const fullPath = this._resolvePath(p);
      const node = this._getNode(fullPath);
      if (!node) {
        return { lines: [`<span class="text-red-400">rmdir: failed to remove '${this._esc(p)}': No such file or directory</span>`], error: true };
      }
      if (node.type !== 'dir') {
        return { lines: [`<span class="text-red-400">rmdir: failed to remove '${this._esc(p)}': Not a directory</span>`], error: true };
      }
      if (Object.keys(node.children || {}).length > 0) {
        return { lines: [`<span class="text-red-400">rmdir: failed to remove '${this._esc(p)}': Directory not empty</span>`], error: true };
      }
      const { parentPath, name } = this._splitPath(fullPath);
      delete this._getNode(parentPath).children[name];
    }
    return { lines: [] };
  }

  _touch(args) {
    if (!args.length) {
      return { lines: [`<span class="text-red-400">touch: missing file operand</span>`], error: true };
    }
    for (const p of args) {
      const fullPath = this._resolvePath(p);
      const node = this._getNode(fullPath);
      if (node) {
        node.date = this._nowDate();
        continue;
      }
      const { parentPath, name } = this._splitPath(fullPath);
      const parent = this._getNode(parentPath);
      if (!parent || parent.type !== 'dir') {
        return { lines: [`<span class="text-red-400">touch: cannot touch '${this._esc(p)}': No such file or directory</span>`], error: true };
      }
      parent.children[name] = { type: 'file', size: 0, perms: '-rw-r--r--', date: this._nowDate(), content: [] };
    }
    return { lines: [] };
  }

  // ─── File content ──────────────────────────────────────────────────────────

  _cat(args) {
    if (!args.length) {
      return { lines: [`<span class="text-red-400">cat: missing operand</span>`], error: true };
    }
    const lines = [];
    for (const p of args) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) {
        return { lines: [`<span class="text-red-400">cat: ${this._esc(p)}: No such file or directory</span>`], error: true };
      }
      if (node.type === 'dir') {
        return { lines: [`<span class="text-red-400">cat: ${this._esc(p)}: Is a directory</span>`], error: true };
      }
      for (const line of (node.content || [])) lines.push(this._esc(line));
    }
    return { lines };
  }

  _echo(args) {
    return { lines: [this._esc(args.join(' '))] };
  }

  _head(args) { return this._headTail(args, 'head'); }
  _tail(args) { return this._headTail(args, 'tail'); }

  _headTail(args, cmd) {
    let n = 10;
    const paths = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) {
        n = Math.abs(parseInt(args[++i])) || 10;
      } else if (/^-\d+$/.test(args[i])) {
        n = Math.abs(parseInt(args[i]));
      } else {
        paths.push(args[i]);
      }
    }
    if (!paths.length) {
      return { lines: [`<span class="text-red-400">${cmd}: missing operand</span>`], error: true };
    }

    const lines = [];
    for (const p of paths) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) {
        return { lines: [`<span class="text-red-400">${cmd}: ${this._esc(p)}: No such file or directory</span>`], error: true };
      }
      if (node.type === 'dir') {
        return { lines: [`<span class="text-red-400">${cmd}: ${this._esc(p)}: Is a directory</span>`], error: true };
      }
      if (paths.length > 1) lines.push(`==> ${this._esc(p)} <==`);
      const content = node.content || [];
      const slice = cmd === 'head' ? content.slice(0, n) : content.slice(-n);
      for (const line of slice) lines.push(this._esc(line));
    }
    return { lines };
  }

  // ─── Text processing ───────────────────────────────────────────────────────

  _sort(args) {
    let reverse = false;
    let numeric = false;
    let unique = false;
    const paths = [];
    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('r')) reverse = true;
        if (arg.includes('n')) numeric = true;
        if (arg.includes('u')) unique = true;
      } else {
        paths.push(arg);
      }
    }
    if (!paths.length) {
      return { lines: [`<span class="text-red-400">sort: missing operand</span>`], error: true };
    }

    const lines = [];
    for (const p of paths) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) return { lines: [`<span class="text-red-400">sort: ${this._esc(p)}: No such file or directory</span>`], error: true };
      if (node.type === 'dir') return { lines: [`<span class="text-red-400">sort: ${this._esc(p)}: Is a directory</span>`], error: true };
      lines.push(...(node.content || []));
    }

    let sorted = [...lines].sort((a, b) => numeric ? (parseFloat(a) || 0) - (parseFloat(b) || 0) : a.localeCompare(b));
    if (reverse) sorted.reverse();
    if (unique) sorted = sorted.filter((v, i, a) => i === 0 || v !== a[i - 1]);
    return { lines: sorted.map(l => this._esc(l)) };
  }

  _uniq(args) {
    let count = false;
    let onlyDuplicates = false;
    const paths = [];
    for (const arg of args) {
      if (arg === '-c') count = true;
      else if (arg === '-d') onlyDuplicates = true;
      else paths.push(arg);
    }
    if (!paths.length) {
      return { lines: [`<span class="text-red-400">uniq: missing operand</span>`], error: true };
    }

    const node = this._getNode(this._resolvePath(paths[0]));
    if (!node) return { lines: [`<span class="text-red-400">uniq: ${this._esc(paths[0])}: No such file or directory</span>`], error: true };
    if (node.type === 'dir') return { lines: [`<span class="text-red-400">uniq: ${this._esc(paths[0])}: Is a directory</span>`], error: true };

    const content = node.content || [];
    const groups = [];
    for (const line of content) {
      if (groups.length && groups[groups.length - 1].line === line) {
        groups[groups.length - 1].n++;
      } else {
        groups.push({ line, n: 1 });
      }
    }

    const result = groups
      .filter(g => !onlyDuplicates || g.n > 1)
      .map(g => count ? `${String(g.n).padStart(4)} ${this._esc(g.line)}` : this._esc(g.line));
    return { lines: result };
  }

  _cut(args) {
    let delimiter = '\t';
    let fields = null;
    let chars = null;
    const paths = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-d' && args[i + 1]) delimiter = args[++i];
      else if (args[i].startsWith('-d') && args[i].length > 2) delimiter = args[i].slice(2);
      else if (args[i] === '-f' && args[i + 1]) fields = args[++i];
      else if (args[i].startsWith('-f') && args[i].length > 2) fields = args[i].slice(2);
      else if (args[i] === '-c' && args[i + 1]) chars = args[++i];
      else if (args[i].startsWith('-c') && args[i].length > 2) chars = args[i].slice(2);
      else if (!args[i].startsWith('-')) paths.push(args[i]);
    }

    if (!paths.length) return { lines: [`<span class="text-red-400">cut: missing operand</span>`], error: true };
    if (!fields && !chars) return { lines: [`<span class="text-red-400">cut: you must specify a list of bytes, characters, or fields</span>`], error: true };

    const parseRange = (spec) => {
      const indices = new Set();
      for (const part of spec.split(',')) {
        if (part.includes('-')) {
          const [a, b] = part.split('-').map(Number);
          for (let i = (a || 1); i <= (b || 999); i++) indices.add(i - 1);
        } else {
          indices.add(Number(part) - 1);
        }
      }
      return [...indices].sort((a, b) => a - b);
    };

    const node = this._getNode(this._resolvePath(paths[0]));
    if (!node) return { lines: [`<span class="text-red-400">cut: ${this._esc(paths[0])}: No such file or directory</span>`], error: true };
    if (node.type === 'dir') return { lines: [`<span class="text-red-400">cut: ${this._esc(paths[0])}: Is a directory</span>`], error: true };

    const lines = (node.content || []).map(line => {
      if (chars) {
        const indices = parseRange(chars);
        return this._esc(indices.map(i => line[i] || '').join(''));
      }
      const parts = line.split(delimiter);
      const indices = parseRange(fields);
      return this._esc(indices.map(i => parts[i] !== undefined ? parts[i] : '').join(delimiter));
    });
    return { lines };
  }

  _wc(args) {
    let showLines = false, showWords = false, showBytes = false;
    const paths = [];
    for (const arg of args) {
      if (arg === '-l') showLines = true;
      else if (arg === '-w') showWords = true;
      else if (arg === '-c') showBytes = true;
      else paths.push(arg);
    }
    const showAll = !showLines && !showWords && !showBytes;

    if (!paths.length) {
      return { lines: [`<span class="text-red-400">wc: missing operand</span>`], error: true };
    }

    const lines = [];
    let totL = 0, totW = 0, totB = 0;
    for (const p of paths) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) return { lines: [`<span class="text-red-400">wc: ${this._esc(p)}: No such file or directory</span>`], error: true };
      if (node.type === 'dir') return { lines: [`<span class="text-red-400">wc: ${this._esc(p)}: Is a directory</span>`], error: true };
      const content = node.content || [];
      const l = content.length;
      const w = content.reduce((s, line) => s + line.trim().split(/\s+/).filter(Boolean).length, 0);
      const b = content.reduce((s, line) => s + line.length + 1, 0);
      totL += l; totW += w; totB += b;
      const row = [];
      if (showAll || showLines) row.push(String(l).padStart(4));
      if (showAll || showWords) row.push(String(w).padStart(4));
      if (showAll || showBytes) row.push(String(b).padStart(4));
      lines.push(`${row.join('')} ${this._esc(p)}`);
    }
    if (paths.length > 1) {
      const row = [];
      if (showAll || showLines) row.push(String(totL).padStart(4));
      if (showAll || showWords) row.push(String(totW).padStart(4));
      if (showAll || showBytes) row.push(String(totB).padStart(4));
      lines.push(`${row.join('')} total`);
    }
    return { lines };
  }

  _grep(args) {
    let ignoreCase = false;
    let showLineNumbers = false;
    let recursive = false;
    let pattern = null;
    const paths = [];

    for (const arg of args) {
      if (arg.startsWith('-') && arg.length > 1 && !arg.startsWith('--')) {
        for (const ch of arg.slice(1)) {
          if (ch === 'i') ignoreCase = true;
          else if (ch === 'n') showLineNumbers = true;
          else if (ch === 'r' || ch === 'R') recursive = true;
        }
      } else if (pattern === null) {
        pattern = arg;
      } else {
        paths.push(arg);
      }
    }

    if (pattern === null) return { lines: [`<span class="text-red-400">grep: missing pattern</span>`], error: true };
    if (!paths.length) return { lines: [`<span class="text-red-400">grep: missing file operand</span>`], error: true };

    let re;
    try {
      re = new RegExp(pattern, ignoreCase ? 'i' : '');
    } catch {
      return { lines: [`<span class="text-red-400">grep: invalid regex: ${this._esc(pattern)}</span>`], error: true };
    }

    const safePattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hiRe = new RegExp(safePattern, ignoreCase ? 'gi' : 'g');

    const _matchLine = (line, idx, fileLabel) => {
      if (!re.test(line)) return null;
      const prefix = fileLabel ? `<span class="text-purple-400">${this._esc(fileLabel)}:</span>` : '';
      const lineNum = showLineNumbers ? `<span class="text-green-400">${idx + 1}:</span>` : '';
      const highlighted = this._esc(line).replace(hiRe, m => `<span class="text-yellow-300 font-bold">${m}</span>`);
      return `${prefix}${lineNum}${highlighted}`;
    };

    const lines = [];

    if (recursive) {
      for (const p of paths) {
        const node = this._getNode(this._resolvePath(p));
        if (!node) return { lines: [`<span class="text-red-400">grep: ${this._esc(p)}: No such file or directory</span>`], error: true };
        this._grepDir(node, p, re, _matchLine, showLineNumbers, lines);
      }
    } else {
      const multiFile = paths.length > 1;
      for (const p of paths) {
        const node = this._getNode(this._resolvePath(p));
        if (!node) return { lines: [`<span class="text-red-400">grep: ${this._esc(p)}: No such file or directory</span>`], error: true };
        if (node.type === 'dir') { lines.push(`<span class="text-red-400">grep: ${this._esc(p)}: Is a directory</span>`); continue; }
        (node.content || []).forEach((line, idx) => {
          const result = _matchLine(line, idx, multiFile ? p : null);
          if (result) lines.push(result);
        });
      }
    }

    if (!lines.length) return { lines: [], error: true };
    return { lines };
  }

  _grepDir(node, displayPath, re, _matchLine, showLineNumbers, results) {
    if (node.type === 'file') {
      (node.content || []).forEach((line, idx) => {
        const result = _matchLine(line, idx, displayPath);
        if (result) results.push(result);
      });
    } else if (node.type === 'dir') {
      for (const [childName, childNode] of Object.entries(node.children || {})) {
        if (childName.startsWith('.')) continue;
        const childDisplay = displayPath === '.' ? `./${childName}` : `${displayPath}/${childName}`;
        this._grepDir(childNode, childDisplay, re, _matchLine, showLineNumbers, results);
      }
    }
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  _find(args) {
    let searchArg = '.';
    let namePattern = null;
    let typeFilter = null;
    let i = 0;

    if (args[0] && !args[0].startsWith('-')) { searchArg = args[0]; i = 1; }
    for (; i < args.length; i++) {
      if (args[i] === '-name' && args[i + 1]) namePattern = args[++i];
      else if (args[i] === '-type' && args[i + 1]) typeFilter = args[++i];
    }

    const searchPath = this._resolvePath(searchArg);
    const rootNode = this._getNode(searchPath);
    if (!rootNode) {
      return { lines: [`<span class="text-red-400">find: '${this._esc(searchArg)}': No such file or directory</span>`], error: true };
    }

    const results = [];
    this._findRecurse(rootNode, searchPath, searchArg, namePattern, typeFilter, results);
    return { lines: results.map(r => this._esc(r)) };
  }

  _findRecurse(node, absPath, displayPath, namePattern, typeFilter, results) {
    const name = absPath.split('/').pop() || '/';
    const matchesType = !typeFilter || (typeFilter === 'f' && node.type === 'file') || (typeFilter === 'd' && node.type === 'dir');
    const matchesName = !namePattern || this._globMatch(name, namePattern);
    if (matchesType && matchesName) results.push(displayPath);
    if (node.type === 'dir') {
      for (const [childName, childNode] of Object.entries(node.children || {})) {
        const childDisplay = displayPath === '.' ? `./${childName}` :
          displayPath.endsWith('/') ? displayPath + childName : displayPath + '/' + childName;
        this._findRecurse(childNode, absPath === '/' ? '/' + childName : absPath + '/' + childName, childDisplay, namePattern, typeFilter, results);
      }
    }
  }

  _diff(args) {
    if (args.length < 2) return { lines: [`<span class="text-red-400">diff: missing operand</span>`], error: true };
    const [p1, p2] = args;
    const n1 = this._getNode(this._resolvePath(p1));
    const n2 = this._getNode(this._resolvePath(p2));
    if (!n1) return { lines: [`<span class="text-red-400">diff: ${this._esc(p1)}: No such file or directory</span>`], error: true };
    if (!n2) return { lines: [`<span class="text-red-400">diff: ${this._esc(p2)}: No such file or directory</span>`], error: true };
    if (n1.type === 'dir') return { lines: [`<span class="text-red-400">diff: ${this._esc(p1)}: Is a directory</span>`], error: true };
    if (n2.type === 'dir') return { lines: [`<span class="text-red-400">diff: ${this._esc(p2)}: Is a directory</span>`], error: true };

    const a = n1.content || [], b = n2.content || [];
    if (a.join('\n') === b.join('\n')) return { lines: [] };

    // LCS via bottom-up DP
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);

    // Build edit ops
    const ops = [];
    let i = 0, j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && a[i] === b[j]) { ops.push('='); i++; j++; }
      else if (j < n && (i >= m || dp[i][j+1] >= dp[i+1][j])) { ops.push('+'); j++; }
      else { ops.push('-'); i++; }
    }

    // Format hunks in traditional diff style
    const out = [];
    i = 0; j = 0;
    let k = 0;
    while (k < ops.length) {
      if (ops[k] === '=') { i++; j++; k++; continue; }
      const aS = i + 1, bS = j + 1;
      const dels = [], ins = [];
      while (k < ops.length && ops[k] !== '=') {
        if (ops[k] === '-') { dels.push(a[i++]); }
        else               { ins.push(b[j++]); }
        k++;
      }
      const aE = i, bE = j;
      let hdr;
      if (dels.length && ins.length) {
        hdr = `${dels.length > 1 ? aS+','+aE : aS}c${ins.length > 1 ? bS+','+bE : bS}`;
      } else if (dels.length) {
        hdr = `${dels.length > 1 ? aS+','+aE : aS}d${bS - 1}`;
      } else {
        hdr = `${aS - 1}a${ins.length > 1 ? bS+','+bE : bS}`;
      }
      out.push(`<span class="text-slate-400">${hdr}</span>`);
      for (const l of dels) out.push(`<span class="text-red-400">&lt; ${this._esc(l)}</span>`);
      if (dels.length && ins.length) out.push(`<span class="text-slate-500">---</span>`);
      for (const l of ins)  out.push(`<span class="text-green-400">&gt; ${this._esc(l)}</span>`);
    }
    return { lines: out, error: true };
  }

  _locate(args) {
    if (!args.length) return { lines: [`<span class="text-red-400">locate: missing argument</span>`], error: true };
    const pattern = args[0].toLowerCase();
    const results = [];
    const walk = (node, path) => {
      for (const [name, child] of Object.entries(node.children || {})) {
        const fullPath = `${path}/${name}`;
        if (name.toLowerCase().includes(pattern)) results.push(fullPath);
        if (child.type === 'dir') walk(child, fullPath);
      }
    };
    walk(this.fs, '');
    if (!results.length) return { lines: [], error: true };
    return { lines: results.map(r => this._esc(r)) };
  }

  // ─── Permissions & ownership ───────────────────────────────────────────────

  _chmod(args) {
    if (args.length < 2) return { lines: [`<span class="text-red-400">chmod: missing operand</span>`], error: true };
    const modeStr = args[0];
    for (const p of args.slice(1)) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) return { lines: [`<span class="text-red-400">chmod: cannot access '${this._esc(p)}': No such file or directory</span>`], error: true };
      const current = node.perms || (node.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
      node.perms = this._applyChmod(current, modeStr);
    }
    return { lines: [] };
  }

  _applyChmod(current, mode) {
    if (/^\d+$/.test(mode)) {
      const oct = mode.padStart(3, '0').slice(-3);
      const toRwx = (n) => (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      return current[0] + toRwx(parseInt(oct[0])) + toRwx(parseInt(oct[1])) + toRwx(parseInt(oct[2]));
    }
    const m = mode.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
    if (!m) return current;
    const [, who, op, what] = m;
    const perms = current.split('');
    const targets = (who === '' || who === 'a') ? [1, 2, 3] : [...who].map(c => ({ u: 1, g: 2, o: 3 }[c])).filter(Boolean);
    for (const t of targets) {
      const base = (t - 1) * 3 + 1;
      if (op === '=') { perms[base] = '-'; perms[base + 1] = '-'; perms[base + 2] = '-'; }
      for (const c of what) {
        const off = { r: 0, w: 1, x: 2 }[c];
        perms[base + off] = op === '-' ? '-' : c;
      }
    }
    return perms.join('');
  }

  _chown(args) {
    if (args.length < 2) return { lines: [`<span class="text-red-400">chown: missing operand</span>`], error: true };
    const owner = args[0];
    for (const p of args.slice(1)) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) return { lines: [`<span class="text-red-400">chown: cannot access '${this._esc(p)}': No such file or directory</span>`], error: true };
      node.owner = owner.split(':')[0];
      node.group = owner.includes(':') ? owner.split(':')[1] : node.owner;
    }
    return { lines: [] };
  }

  // ─── File metadata ─────────────────────────────────────────────────────────

  _stat(args) {
    if (!args.length) return { lines: [`<span class="text-red-400">stat: missing operand</span>`], error: true };
    const lines = [];
    for (const p of args) {
      const fullPath = this._resolvePath(p);
      const node = this._getNode(fullPath);
      if (!node) return { lines: [`<span class="text-red-400">stat: cannot stat '${this._esc(p)}': No such file or directory</span>`], error: true };
      const size = node.type === 'dir' ? 4096 : (node.size || 0);
      const blocks = Math.ceil(size / 512);
      const perms = node.perms || (node.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
      const owner = node.owner || 'user';
      const group = node.group || 'user';
      const typeLabel = node.type === 'dir' ? 'directory' : 'regular file';
      lines.push(
        `  File: ${this._esc(p)}`,
        `  Size: ${size}       Blocks: ${blocks}          IO Block: 4096   ${typeLabel}`,
        `Device: fd00h/64768d    Inode: ${Math.floor(Math.random() * 900000) + 100000}    Links: 1`,
        `Access: (${this._permsToOctal(perms)}/${perms})  Uid: (1000/${owner})   Gid: (1000/${group})`,
        `Modify: ${node.date || 'Jan  1 00:00'}`,
      );
    }
    return { lines };
  }

  _permsToOctal(perms) {
    const rwx = (str) => ((str[0] !== '-' ? 4 : 0) + (str[1] !== '-' ? 2 : 0) + (str[2] !== '-' ? 1 : 0));
    return '0' + rwx(perms.slice(1, 4)) + rwx(perms.slice(4, 7)) + rwx(perms.slice(7, 10));
  }

  _file(args) {
    if (!args.length) return { lines: [`<span class="text-red-400">file: missing operand</span>`], error: true };
    const typeMap = {
      '.txt': 'ASCII text', '.md': 'ASCII text (Markdown)',
      '.py': 'Python script, ASCII text executable',
      '.sh': 'Bourne-Again shell script, ASCII text executable',
      '.csv': 'ASCII text (CSV)',
      '.json': 'ASCII text (JSON)',
      '.pdf': 'PDF document',
      '.zip': 'Zip archive data',
      '.jpg': 'JPEG image data',
      '.jpeg': 'JPEG image data',
      '.png': 'PNG image data',
      '.m3u': 'ASCII text (M3U playlist)',
    };
    const lines = [];
    for (const p of args) {
      const node = this._getNode(this._resolvePath(p));
      if (!node) { lines.push(`${this._esc(p)}: cannot open (No such file or directory)`); continue; }
      if (node.type === 'dir') { lines.push(`${this._esc(p)}: directory`); continue; }
      const ext = p.slice(p.lastIndexOf('.')).toLowerCase();
      const desc = typeMap[ext] || 'data';
      lines.push(`${this._esc(p)}: ${desc}`);
    }
    return { lines };
  }

  // ─── Disk usage ────────────────────────────────────────────────────────────

  _du(args) {
    let human = false;
    let summary = false;
    const paths = [];
    for (const arg of args) {
      if (arg.startsWith('-') && /^-[hs]+$/.test(arg)) {
        if (arg.includes('h')) human = true;
        if (arg.includes('s')) summary = true;
      } else paths.push(arg);
    }
    const target = paths[0] || '.';
    const fullPath = this._resolvePath(target);
    const node = this._getNode(fullPath);
    if (!node) return { lines: [`<span class="text-red-400">du: cannot access '${this._esc(target)}': No such file or directory</span>`], error: true };

    const fmt = (bytes) => {
      if (!human) return String(Math.ceil(bytes / 1024)).padStart(4);
      if (bytes < 1024) return bytes + 'B';
      if (bytes < 1048576) return Math.ceil(bytes / 1024) + 'K';
      if (bytes < 1073741824) return Math.ceil(bytes / 1048576) + 'M';
      return (bytes / 1073741824).toFixed(1) + 'G';
    };

    const lines = [];
    const walk = (n, p, disp) => {
      let total = n.type === 'file' ? (n.size || 0) : 4096;
      if (n.type === 'dir') {
        for (const [cname, cnode] of Object.entries(n.children || {})) {
          total += walk(cnode, p + '/' + cname, disp + '/' + cname);
        }
        if (!summary) lines.push(`${fmt(total)}\t${this._esc(disp)}`);
      } else {
        if (!summary) lines.push(`${fmt(total)}\t${this._esc(disp)}`);
      }
      return total;
    };
    const total = walk(node, fullPath, target);
    if (summary) lines.push(`${fmt(total)}\t${this._esc(target)}`);
    return { lines };
  }

  _df() {
    return {
      lines: [
        'Filesystem      Size  Used Avail Use% Mounted on',
        '/dev/sda1        20G  4.2G   15G  22% /',
        'tmpfs           2.0G     0  2.0G   0% /dev/shm',
      ]
    };
  }

  // ─── System info ───────────────────────────────────────────────────────────

  _uname(args) {
    const all = args.includes('-a') || !args.length;
    if (all) {
      return { lines: ['Linux linux-quest 5.15.0-1 #1 SMP x86_64 GNU/Linux'] };
    }
    const parts = [];
    if (args.includes('-s')) parts.push('Linux');
    if (args.includes('-n')) parts.push('linux-quest');
    if (args.includes('-r')) parts.push('5.15.0-1');
    if (args.includes('-m')) parts.push('x86_64');
    if (args.includes('-o')) parts.push('GNU/Linux');
    return { lines: [parts.join(' ') || 'Linux'] };
  }

  // ─── Processes ─────────────────────────────────────────────────────────────

  _ps(args) {
    const wide = args.some(a => a.includes('a') || a.includes('u') || a.includes('x'));
    if (wide) {
      return {
        lines: [
          'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
          'user        1001  0.0  0.1  12456  5680 pts/0    Ss   09:05   0:00 bash',
          'user        1042  0.0  0.0   8932  2104 pts/0    R+   09:06   0:00 ps aux',
        ]
      };
    }
    return {
      lines: [
        '    PID TTY          TIME CMD',
        '   1001 pts/0    00:00:00 bash',
        '   1042 pts/0    00:00:00 ps',
      ]
    };
  }

  // ─── Environment ───────────────────────────────────────────────────────────

  _env() {
    return {
      lines: [
        'HOME=/home/user',
        'USER=user',
        'SHELL=/bin/bash',
        'PATH=/usr/local/bin:/usr/bin:/bin:/home/user/.local/bin',
        'EDITOR=vim',
        'LANG=en_US.UTF-8',
        'TERM=xterm-256color',
        'PWD=' + this.cwd,
      ]
    };
  }

  // ─── Session ───────────────────────────────────────────────────────────────

  _showHistory() {
    if (!this._history.length) return { lines: [] };
    return {
      lines: this._history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${this._esc(cmd)}`)
    };
  }

  _which(args) {
    if (!args.length) return { lines: [`<span class="text-red-400">which: missing argument</span>`], error: true };
    const lines = [];
    let anyMissing = false;
    for (const cmd of args) {
      if (this._commands[cmd]) {
        lines.push(`/usr/bin/${this._esc(cmd)}`);
      } else {
        lines.push(`<span class="text-red-400">which: no ${this._esc(cmd)} in (/usr/local/bin:/usr/bin:/bin)</span>`);
        anyMissing = true;
      }
    }
    return { lines, error: anyMissing };
  }

  _man(args) {
    if (!args.length) return { lines: ['What manual page do you want?'], error: true };
    const cmd = args[0];
    const handler = this._commands[cmd];
    if (!handler) {
      return { lines: [`No manual entry for ${this._esc(cmd)}`], error: true };
    }
    return {
      lines: [
        `<span class="text-green-400 font-bold">${this._esc(cmd).toUpperCase()}(1)</span>`,
        '',
        '<span class="text-yellow-300">NAME</span>',
        `    ${this._esc(cmd)} - ${handler.help}`,
        '',
        '<span class="text-yellow-300">SYNOPSIS</span>',
        `    ${this._esc(cmd)} [options] [arguments]`,
        '',
        '<span class="text-yellow-300">DESCRIPTION</span>',
        `    ${handler.help.charAt(0).toUpperCase() + handler.help.slice(1)}.`,
        `    Type '<span class="text-green-400">help</span>' to list all available commands.`,
      ]
    };
  }

  _date() {
    return { lines: [new Date().toString()] };
  }

  _help() {
    const lines = ['<span class="text-green-400">Available commands:</span>'];
    for (const [name, { help }] of Object.entries(this._commands)) {
      lines.push(`  ${name.padEnd(10)} ${help}`);
    }
    return { lines };
  }

  // ─── Tab completion ────────────────────────────────────────────────────────

  complete(input) {
    const trailingSpace = input !== input.trimEnd();
    const parts = input.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return { matches: [], type: 'none' };

    if (parts.length === 1 && !trailingSpace) {
      const commands = Object.keys(this._commands).sort();
      const partial = parts[0];
      const matches = commands.filter(c => c.startsWith(partial) && c !== partial);
      return { type: 'command', matches, partial };
    }

    const cmd = parts[0];
    const partialArg = trailingSpace ? '' : parts[parts.length - 1];

    if (partialArg.startsWith('-')) return { matches: [], type: 'none' };

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
        isDir: info.type === 'dir',
        display: this._fmtName(name, info.type)
      }));

    return { type: 'path', matches: entries, partial: partialArg, cmdParts: trailingSpace ? parts : parts.slice(0, -1) };
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

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

  _splitPath(path) {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const name = path.split('/').pop();
    return { parentPath, name };
  }

  _deepCopy(node) {
    if (node.type === 'file') return { ...node, content: node.content ? [...node.content] : [] };
    return {
      ...node,
      children: Object.fromEntries(
        Object.entries(node.children || {}).map(([k, v]) => [k, this._deepCopy(v)])
      )
    };
  }

  _globMatch(str, pattern) {
    const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return re.test(str);
  }

  _nowDate() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = String(now.getDate()).padStart(2, ' ');
    const h = String(now.getHours()).padStart(2, '0');
    const mn = String(now.getMinutes()).padStart(2, '0');
    return `${months[now.getMonth()]} ${d} ${h}:${mn}`;
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

function commonPrefix(strings) {
  if (!strings.length) return '';
  let prefix = strings[0];
  for (const s of strings.slice(1)) {
    while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) break;
  }
  return prefix;
}
