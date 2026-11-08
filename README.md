# Vietnamese Revival Church App

App for **Hội Thánh Phục Hưng Việt Nam** (Vietnamese Revival Church), Tempe, AZ.

- Address: 1565 E Warner Rd, Tempe, AZ 85284
- Sunday worship: 3:00–5:00pm
- Phone: (602) 597-0504 · Email: htph@vrcfamily.org

Tabs: Home / Events / Scripture / Youth. Language defaults to Vietnamese with an
English toggle.

## Tech stack

- **Frontend:** React 19 + Vite, Tailwind CSS 4
- **Backend:** Express 4 (see `server.ts` → `src/vrc-backend/app.ts`)
- **Database:** Postgres via Drizzle ORM
- **Auth / push:** Firebase (`firebase-admin`)
- **Bible text:** [apibible.wbem.org](https://apibible.wbem.org) — NIV (English) and
  Vietnamese 1925 only (see Rules)
- **AI features:** Google Gemini API
- **iOS app:** Capacitor (`org.vnrevivalchurch.app`)

## Project structure

```
server.ts                     Express entry point
src/
  App.tsx                     Tab switching (home / events / verse / youth), modals, footer
  index.css                   Global typography / base styles only
  db/
    schema.ts                 Drizzle schema — the single source of truth for tables
    index.ts                  Re-export of the vrc-db connection layer
    drizzle.config.ts         Drizzle Kit config (schema: ./src/db/schema.ts)
  vrc-db/
    index.ts                  Connection layer: dev + prod pools, `db` proxy (see Database)
    schema.ts                 Re-export of ../db/schema.ts
    drizzle.config.ts         Drizzle Kit config (schema: ./src/vrc-db/schema.ts)
  vrc-backend/
    app.ts                    Express app, middleware, route mounting
    middleware/               Error handler (AppError → status codes, no DB text leaks)
    routes/                   One file per area: verses, events, prayers, auth, ...
    services/                 devotionalService (Bible fetch), notificationService, ...
  vrc-frontend/
    common-component/         Shared UI — button, card, modal, calendar-buttons,
                              featured-star, ... Reuse these, never duplicate them.
    components/
      admin-portal/           Admin shell + one folder per tab under tabs/
      home-dashboard/         Home tab
      events-section/         Events tab
      daily-verse-card/       Scripture tab
      youth-section/          Youth tab
      nav-bar/ ios-tab-bar/   App shell
      *-modal/                App-wide modals
    context/
      LanguageContext.tsx     Language provider, `t()`, `translate()`
      translations.ts         ALL UI copy (VI + EN), typed keys — see Rules
    services/                 Frontend API clients (scriptureApi, notificationClient)
    utils/                    apiFetch, errors, dateFormatter, categoryTheme, ...
    hooks/ constants/ types/
ios/                          Capacitor iOS project (built web output under ios/App/App/public/)
```

## Database — dev and prod

There are **two databases**, and both are needed:

- `cloud_sql_development_database` (dev) and `cloud_sql_production_database` (prod)
- `src/vrc-db/index.ts` keeps a pool for each and exposes a `db` proxy that routes
  every query to the right database: request context first, otherwise `STARTUP_ENV`
  (production when running on the `ais-pre` service or `SQL_DB_NAME` is the prod DB).
- `src/db/schema.ts` is the one schema; `src/vrc-db/schema.ts` just re-exports it.

Do not "deduplicate" `src/db` and `src/vrc-db` — the split is the dev/prod setup.

## Getting started

```bash
npm install
npm run dev      # local dev server (tsx server.ts)
npm run build    # vite build + bundle server to dist/server.js
npm run start    # NODE_ENV=production node dist/server.js
npm run lint     # tsc --noEmit
npm run ios:sync # rebuild web + sync into the Capacitor iOS project
```

Environment variables (see `.env.example`): `SQL_HOST`, `SQL_DB_NAME`,
`SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`, `GEMINI_API_KEY`, `APP_URL`,
`VITE_API_BASE_URL` (only for iOS release builds).

## Deploying

Pushing to `main` does **not** deploy. Prod picks up `main` only after a
redeploy / restart of the prod server. Check the live app after deploying,
especially before Sunday service.

## Rules

These are house rules. Follow them in every change.

1. **Bible versions: NIV (English) + Vietnamese 1925 only.** No RVV11, BPT, ESV,
   or other versions. (Note: `vi/rvv11` on apibible is off by one chapter — never
   use it.)
2. **Reuse first.** Before building anything new, look for an existing common
   component, helper, service, or API endpoint and reuse it. Never duplicate
   something that already exists. If no shared one exists, suggest creating it
   first and wait for a go-ahead — do not create it on your own.
3. **Never use single-character variables.** No `s`, `e`, `t`, `v`, `p`, `i`, …
   Use full names (`eventsSectionStyles`, `event`, `verse`, `prayer`).
4. **No CSS in `.tsx` files.** All styling lives in the co-located `.styles.ts`
   file as Tailwind class strings. Only dynamic values (theme colors, computed
   sizes) stay inline in the component.
5. **Style naming.** Component-local style keys stay short (`cardTitle`,
   `input`) — the styles object is already component-prefixed
   (`eventsSectionStyles`). A style used by 2+ components moves to the shared
   styles file with a group-prefixed key (`adminFormInput`, `eventCardTitle`).
   In JSX use the full styles object name, never an alias.
6. **All UI copy in `context/translations.ts`.** Components call `t('key')`.
   Never write inline `language === 'vi' ? '...' : '...'` ternaries for UI text.
7. **Verses come only from Postgres, added by admins in AdminPortal.** No
   hardcoded seed verses. Keep only the 10 latest verses in the database —
   prune only when a save would make more than 10.
8. **Errors stay on screen until dismissed.** Only success messages auto-hide
   (after 4 seconds).
9. **AdminPortal is a shell + one folder per tab** (`admin-portal/tabs/`).
   Each tab owns its own state and its own `submitting` flag; all tabs stay
   mounted so half-typed forms survive tab switches.
10. **Push only when asked.** Never push to `main` without an explicit go-ahead.
11. **Dark mode: the standard palette converts automatically.** `src/index.css`
    remaps `bg-white`, `bg-stone-50/100`, `text-stone-950–500`,
    `border-stone-100/200/300`, `bg-amber-50/100`, `text-amber-950/900/800`,
    and form inputs to dark colors — a new screen built only from those classes
    needs no dark-mode work. Any color outside that list (rose, emerald,
    amber-600/700, `bg-stone-50/80`, gradients, arbitrary hex) needs an explicit
    `dark:` twin on the same class string. Dark mode and large font are toggled
    from the Navbar settings menu; the `index.html` boot script applies the saved
    theme before first paint.
