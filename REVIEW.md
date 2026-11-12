# Code Review

Review every change as a **senior software engineer** would — not just
"does it follow the house rules" but "is this correct, maintainable,
and safe to ship to a real congregation." The house rules from
`README.md` (cited as `R1`–`R11`) are the floor. This file is the
ceiling: the judgment on top of them.

Go through it against the actual diff, not from memory. If a check
does not apply, say so — do not skip it silently. If something is
wrong, say what is wrong and what the fix is. Do not approve a change
you would not want to own in production.

## How to review

1. **Read the diff first, code second.** Understand what the change is
   trying to do before judging how it does it.
2. **Check the behavior, not just the code.** Run `tsc` and the build.
   Where it matters, verify live (real Bible API, real admin save,
   real database) — a green build is not proof it works.
3. **Ask "what breaks if…".** Empty data, a failed request, a second
   admin saving at the same time, a user on a slow phone. If the
   answer is "it crashes" or "it silently does the wrong thing", it
   is not ready.
4. **Judge the tradeoff, not just the rule.** A senior engineer knows
   when a small duplication is better than a bad abstraction, and
   when a shared component is worth the indirection. Say which one
   applies and why.
5. **Keep the change small and honest.** One concern per commit. If a
   commit mixes a feature, a refactor, and a fix, ask for it to be
   split. If the commit message does not match the diff, say so.

## 1. Correctness

- [ ] **It does what it claims.** The code matches the commit message
  and the request. No hidden behavior changes smuggled in.
- [ ] **Edge cases are handled.** Empty lists, missing data, invalid
  input, a failed request, a user with no network. The app shows an
  empty state or a clear error — it never crashes and never shows a
  blank screen.
- [ ] **Async work is safe.** Loading states exist where data is
  fetched. A slow or failed request does not leave stale data on
  screen. No race where a late response overwrites a newer one.
- [ ] **State is consistent.** No stale closures, no lost updates, no
  two sources of truth for the same value. An admin editing a form
  does not lose half-typed input when switching tabs (R9).
- [ ] **Lists use stable keys.** No array index as a key for a list
  that can change order or have items added/removed.
- [ ] **Dates, times, and money are handled in the right timezone and
  format.** Vietnamese dates are dd-mm-yyyy, English are mm-dd-yyyy
  (`formatDateLocale`). No guessed weekdays — verified with `date`.

## 2. Architecture and reuse (R2)

- [ ] **Checked for an existing common/shared piece before building.**
  Looked in `common-component/`, shared helpers/utils, hooks,
  services, and backend API endpoints first.
- [ ] **Reused it instead of duplicating.** No second copy of a
  component, helper, style, or endpoint that already exists.
- [ ] **No new shared component/helper created on my own.** If none
  existed, I suggested creating one and waited for a go-ahead —
  unless the task itself directly asked for it.
- [ ] **The abstraction is at the right level.** A shared piece
  earns its place when 2+ screens genuinely need the same behavior.
  A one-off wrapped in a shared component just to "be reusable" is
  over-abstraction — say so and keep it local.
- [ ] **Separation is clean.** UI renders, helpers compute, services
  talk to the API, routes talk to the database. A component does not
  fetch and parse and render and validate all in one place.
- [ ] **No new one-off copy where a shared one fits.** A style,
  button, modal, or list used by 2+ places lives in the shared
  place, not copied into each screen.
- [ ] **Backend routes follow the existing shape.** One file per area,
  admin-only writes behind `requireAdmin`, errors through
  `AppError` (no raw database text leaked to the client).

## 3. Maintainability and readability

- [ ] **A stranger can read it.** Names say what things are. No
  clever tricks, no unexplained magic numbers, no comment that
  restates the code instead of explaining why.
- [ ] **No single-character variables (R3).** No `s`, `e`, `t`, `v`,
  `p`, `i`, … Use full names (`event`, `verse`, `prayer`,
  `videosSectionStyles`).
  - Exception, grandfathered: the `s` styles alias (`import { …Styles
    as s }`) exists in older files. New files use the full styles
    object name, never an alias (R5).
- [ ] **No dead code.** No unused imports, styles, components, files,
  or translation keys. Deleted files are actually deleted, not left
  orphaned.
- [ ] **It follows the existing patterns.** Same folder layout, same
  naming, same style-object convention as the code around it. A new
  screen does not invent its own structure.
- [ ] **Small and focused.** One concern per change. A feature, a
  refactor, and a fix do not ride in the same commit.
- [ ] **Comments explain why, not what.** A comment is there because
  the reason is not obvious from the code (a quirk, a tradeoff, a
  "do not change this" warning). No comment that just repeats the
  next line.

## 4. Performance

- [ ] **No work done on every read that belongs on write.** (Past
  example: pruning the verses list on every `GET` instead of only
  when a save would exceed 10.)
- [ ] **No fetching in a loop, no N+1 queries.** One request gets
  what the screen needs; a list does not fire a request per item.
- [ ] **No unnecessary re-renders or re-fetches.** Data loads once on
  mount and refreshes on a real change — not on every render, not
  on a timer that does nothing.
- [ ] **No heavy import for a small job.** A new dependency or a large
  library is justified by what it does, not added for one helper
  that could be ten lines.
- [ ] **Images and assets are right-sized.** No unoptimized multi-MB
  PNG where a smaller file would do; no new binary committed to the
  repo (images go to GitHub from the phone).

## 5. Security

- [ ] **Write endpoints require admin.** Every `POST` / `PUT` /
  `DELETE` that changes data is behind `requireAdmin` — including
  maintenance endpoints (past miss: the cleanup-expired endpoint
  was open to anyone).
- [ ] **No secrets in code.** No passwords, API keys, tokens, or
  credentials in the repo, in logs, or in a commit message.
- [ ] **Input is validated on the server, not just the client.** A
  bad URL, a missing field, or an out-of-range value is rejected
  by the backend with a clear 400 — the frontend check alone is
  not enough.
- [ ] **No raw errors leaked.** Database errors and stack traces do
  not reach the client. Errors go through `AppError` with a status
  and a code the frontend can map to a bilingual message.
- [ ] **No new way to pick the database from the client** without a
  reason. (Known open item: the client can pick dev/prod via
  `X-App-Env` / `?env=` — do not extend it.)

## 6. Error handling and user feedback (R8)

- [ ] **Errors stay on screen until dismissed.** Only success
  messages auto-hide (after 4 seconds).
- [ ] **Errors are bilingual (VI + EN) and accurate.** They say what
  actually failed, not a generic message. A failed Bible fetch
  says the fetch failed; it does not pretend it worked.
- [ ] **Failures degrade gracefully.** A failed load shows an empty
  state or an error — not a crash, not a spinner forever, not
  silently wrong data.
- [ ] **No silent failures.** A failed save, a rejected request, or
  a dropped write is visible to the user (or logged where an admin
  will see it).

## 7. Data and Bible text (R1, R7)

- [ ] **Bible versions: NIV + Vietnamese 1925 only.** No RVV11, BPT,
  ESV, or other versions. Never use `vi/rvv11` (off by one chapter).
- [ ] **Verses come only from Postgres, added by admins in
  AdminPortal.** No hardcoded seed verses.
- [ ] **Only the 10 latest verses are kept** — prune only when a save
  would make more than 10. Same for notifications (10 latest).
- [ ] **No new table/column without the SQL.** Schema changes ship
  with the `CREATE TABLE` / `ALTER TABLE` SQL the prod database
  needs, because no migration runs at startup. The `drizzle/`
  folder is empty by design — do not assume a migration will run.
- [ ] **No unbounded growth.** A table that grows forever has a prune
  rule or a stated reason it does not need one.
- [ ] **No duplicate table or column.** A schema change is checked
  against the live schema first — a table that already exists is
  not added a second time. (Past failure: a duplicate `sermons`
  table broke the build with `TS2451`.)

## 8. Styling, dark mode, and accessibility (R4, R11)

- [ ] **No CSS in `.tsx` files (R4).** All styling is in the
  co-located `.styles.ts` file as Tailwind class strings. Only
  dynamic values (theme colors, computed sizes) stay inline.
- [ ] **Style keys are short and component-local (R5)** (`cardTitle`,
  `input`) — the styles object is already component-prefixed. A
  style used by 2+ components moves to shared styles with a
  group-prefixed key (`adminFormInput`, `eventCardTitle`).
- [ ] **Dark mode works (R11).** Built only from the auto-converting
  palette (`bg-white`, `bg-stone-50/100`, `text-stone-950–500`,
  `border-stone-100/200/300`, `bg-amber-50/100`,
  `text-amber-950/900/800`, form inputs) — or, for any color outside
  that list (rose, emerald, amber-600/700, gradients, arbitrary
  hex), an explicit `dark:` twin is on the same class string.
- [ ] **Large-font mode still works.** No fixed pixel sizes that
  break when the root font grows; smallest labels use the
  `text-caption` / `text-label` / `text-meta` sizes from
  `index.css`.
- [ ] **Touch targets are big enough on mobile.** Buttons and tappable
  rows are at least ~44px. Text is readable without zooming.

## 9. Copy and language (R6)

- [ ] **All UI copy in `context/translations.ts` (R6).** Components
  call `t('key')`. No inline `language === 'vi' ? '…' : '…'`
  ternaries for UI text.
- [ ] **New copy is bilingual** (VI + EN) and the key is typed
  (`TranslationKey` rejects a typo at compile time).
- [ ] **No hardcoded user-facing strings** left in `.tsx` / `.ts`
  files.

## 10. AdminPortal structure (R9)

- [ ] **AdminPortal stays a shell + one folder per tab**
  (`admin-portal/tabs/`). Each tab owns its own state and its own
  `submitting` flag.
- [ ] **All tabs stay mounted** so half-typed forms survive tab
  switches. No tab unmounts another tab's form.
- [ ] **Admin actions use the shared buttons** (`AdminAddButton`,
  `AdminActionButtons`, `ConfirmModal`) — not a hand-built copy.

## 11. Desktop and mobile

- [ ] **Checked both views.** Mobile (bottom tab bar, full-screen
  panels) and desktop (nav switcher, popups) both considered.
- [ ] **Mobile overlays join the iOS tab bar** — no floating close
  button or gap that makes a panel look detached; the tab bar stays
  reachable and tappable.
- [ ] **The same control behaves the same on every screen.** If a
  button/label changed on one screen, every screen that shares it
  was checked and matched.
- [ ] **The modal has padding.** The shared Modal body has none, so
  the content must supply it (`p-6`, same as DirectionsModal) —
  otherwise text and icons run to the edges and get clipped by the
  rounded corner.

## 12. Build and verify

- [ ] **`npx tsc --noEmit` passes.** No type errors.
- [ ] **`npm run build` passes.** No build errors.
- [ ] **Verified against the real thing where it matters.** Bible
  text checked live against apibible; admin save flow tested;
  UI checked in the app (not just in a preview).
- [ ] **No dead code left behind.** No unused imports, styles,
  components, or files. Deleted files are actually deleted (not
  left orphaned).
- [ ] **No binaries in the change.** Images go to GitHub from the
  phone (GitHub web UI), never through a code push. `public/` image
  binaries are never pushed.

## 13. Push (R10)

- [ ] **Push only when asked.** Nothing is pushed to `main` without
  an explicit go-ahead. Changes stay local (committed) until then.
- [ ] **Push only what was approved.** When a push is approved, push
  only the files for that item — not the whole local backlog — and
  say what remains local.
- [ ] **Never force-push, never push a diverged history.** Local and
  GitHub SHAs differ by design (snapshot pushes); trees must match
  for synced text paths.

## Red flags — block the change

Any one of these stops a commit until it is fixed. Do not approve
around them.

- A build or typecheck failure, or a change that was never built.
- A duplicated component, helper, style, or table that already
  exists (including a second copy of a database table).
- A write endpoint without admin auth.
- A secret, password, or API key in code, logs, or a commit message.
- A hardcoded Bible verse, a Bible version other than NIV / 1925,
  or verses that do not come from Postgres.
- An error that disappears on its own, or a failure the user never
  sees.
- A new shared component/helper created without a go-ahead.
- A push to `main` without an explicit go-ahead.
