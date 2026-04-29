# TODO — linux-quest

## Completato (storico recente)

- [x] Rinominati tutti i titoli delle lezioni in `data/lessons.json` (stile descrittivo, niente comandi tra parentesi)
- [x] Aggiunta sezione "What you'll learn" (`#course-overview`) in `index.html` con griglia 8 sezioni
- [x] Rimosso link "Lessons" dal footer di `index.html`
- [x] Bottone auth rinominato da "Sign out" a "Log out"
- [x] Header lezioni: titolo + concept allineati a sinistra, challenge-progress a destra
- [x] Bottoni navigazione: testi fissi "◀ Previous" / "Next ▶" (non più abbreviati o variabili)
- [x] Navbar lezioni: aggiunta icona casa SVG a sinistra del logo linux-quest
- [x] Creato comando `/update-memory` in `.claude/commands/update-memory.md`
- [x] Sostituito email+password auth con GitHub OAuth (via Supabase)
- [x] Eliminato tier `registered`; ora solo `guest` (sezioni 1-3) e `starred` (accesso completo)
- [x] Rimosso gate registrazione (section 1); unico gate dopo `file-content` (section 3)
- [x] Creata Netlify Function `verify-star.js`: verifica stella GitHub → aggiorna `is_premium` in DB
- [x] Modal auth aggiornato: rimosso form email/password, aggiunto pulsante "Continue with GitHub"
- [x] Modal premium aggiornato: sostituito placeholder Stripe con CTA stella GitHub + pulsante verifica
- [x] `netlify.toml` aggiornato con sezione `[functions]`

## Prossimo: GitHub Star setup (da fare nel browser)

- [ ] Creare GitHub OAuth App: github.com/settings/developers → New OAuth App
      - Homepage URL: URL del sito Netlify
      - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Abilitare GitHub OAuth in Supabase: Authentication → Providers → GitHub (incollare Client ID e Secret)
- [ ] Aggiungere redirect URLs in Supabase (Authentication → URL Configuration):
      - `https://<netlify-site>.netlify.app`
      - `http://localhost:8080`
- [ ] Aggiungere `SUPABASE_SERVICE_ROLE_KEY` come env var in Netlify (Functions → Environment)
- [ ] Rimuovere colonna `stripe_customer_id` da `profiles` in Supabase (SQL editor)
- [ ] Testare flusso completo: guest 3 sezioni → gate → OAuth GitHub → stella → accesso completo

## Deploy su Netlify

- [ ] Configurare dominio custom (opzionale)
- [ ] Aggiornare Site URL e Redirect URL in Supabase → Authentication → URL Configuration con URL produzione
- [ ] Verificare che il build command generi correttamente `js/config.js` da env vars
- [ ] Testare flusso auth (GitHub OAuth) in produzione

## Supabase (futuro)

- [ ] Aggiungere gestione sessione scaduta / refresh token
- [ ] Valutare se spostare `localStorage` a fonte secondaria e Supabase a primaria

## Pipes & Redirection (futuro, ~10h)

- [ ] Tokenizer per argomenti quoted (`"hello world"` → un token)
- [ ] Parser pipeline (`|`, `>`, `>>`, `<`)
- [ ] Parametro `stdin` per `grep`, `sort`, `uniq`, `cut`, `wc`, `head`, `tail`, `cat`
- [ ] Nuovi comandi: `tee`, `xargs`, `tr`, `sed` (base), `awk` (base)
- [ ] Scrivere lezioni sezione "Pipes & Redirection"
