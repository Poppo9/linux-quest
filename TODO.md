# TODO — linux-quest

## Setup Supabase (manuale)

- [ ] Copiare `js/config.example.js` → `js/config.js` e inserire `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- [ ] Eseguire SQL in Supabase SQL Editor (tabelle `progress`, `profiles`, trigger, RLS)
- [ ] In Authentication > URL Configuration: impostare Site URL + redirect URL dominio Netlify
- [ ] Aggiungere `SUPABASE_URL` e `SUPABASE_ANON_KEY` come env vars in Netlify

## Auth & Tier

- [ ] Testare flusso magic link in locale
- [ ] Testare gate registration dopo `ls-flags`
- [ ] Testare sync progresso cross-device
- [ ] Testare merge localStorage → Supabase al login
- [ ] Spostare gate registration a fine sezione "Navigating Directories" (prod)

## Contenuto lezioni

- [ ] Scrivere lezioni sezione "File Operations" (`file-operations`)
- [ ] Scrivere lezioni sezione "Reading File Content" (`file-content`)
- [ ] Sbloccare sezioni man mano che il contenuto è pronto

## Stripe (futuro)

- [ ] Creare Netlify Function per webhook Stripe
- [ ] Aggiornare `profiles.is_premium = true` via service_role key
- [ ] Implementare Stripe Checkout per accesso premium
- [ ] Implementare premium gate UI (ora mostra solo "coming soon")

## Pipes & Redirection (futuro, ~10h)

- [ ] Tokenizer per argomenti quoted (`"hello world"` → un token)
- [ ] Parser pipeline (`|`, `>`, `>>`, `<`)
- [ ] Parametro `stdin` per `grep`, `sort`, `uniq`, `cut`, `wc`, `head`, `tail`, `cat`
- [ ] Nuovi comandi: `tee`, `xargs`, `tr`, `sed` (base), `awk` (base)
- [ ] Scrivere lezioni sezione "Pipes & Redirection"

## Supabase (futuro)

- [ ] Sostituire `localStorage` con Supabase come fonte primaria (ora è write-through cache)
- [ ] Aggiungere gestione sessione scaduta / refresh token
