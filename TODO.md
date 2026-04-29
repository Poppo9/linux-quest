# TODO — linux-quest

## Prossimo: Stripe (pagamenti premium)

- [ ] Creare account Stripe e prodotto "linux-quest Premium"
- [ ] Implementare Stripe Checkout (link o hosted page) per acquisto premium
- [ ] Creare Netlify Function per webhook Stripe → aggiorna `profiles.is_premium = true` via service_role key
- [ ] Aggiungere `STRIPE_WEBHOOK_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` come env vars in Netlify
- [ ] Sostituire il modal "coming soon" con link reale a Stripe Checkout
- [ ] Testare flusso completo: acquisto → webhook → sblocco sezioni premium

## Deploy su Netlify

- [ ] Configurare dominio custom (opzionale)
- [ ] Aggiornare Site URL e Redirect URL in Supabase → Authentication → URL Configuration con URL produzione
- [ ] Verificare che il build command generi correttamente `js/config.js` da env vars
- [ ] Testare flusso auth (signup/signin) in produzione

## Supabase (futuro)

- [ ] Configurare custom SMTP (es. Resend, piano free: 3.000 email/mese) per superare il limite di 2 email/ora — necessario se si riabilita la conferma email in produzione
- [ ] Aggiungere gestione sessione scaduta / refresh token
- [ ] Valutare se spostare `localStorage` a fonte secondaria e Supabase a primaria

## Pipes & Redirection (futuro, ~10h)

- [ ] Tokenizer per argomenti quoted (`"hello world"` → un token)
- [ ] Parser pipeline (`|`, `>`, `>>`, `<`)
- [ ] Parametro `stdin` per `grep`, `sort`, `uniq`, `cut`, `wc`, `head`, `tail`, `cat`
- [ ] Nuovi comandi: `tee`, `xargs`, `tr`, `sed` (base), `awk` (base)
- [ ] Scrivere lezioni sezione "Pipes & Redirection"
