# Changelog

## [Unreleased] - Staff dashboard

A second front end for hospital staff, with a simple sign-in, at `/staff/`. See `docs/STAFF_DASHBOARD.md`.

### Added
- Staff sign-in: `POST /api/admin/login` with `STAFF_USERNAME` / `STAFF_PASSWORD`, signed expiring session tokens, rate limited. The legacy `x-admin-token` header still works.
- Staff CRUD API (`routes/staff.js`): doctors, weekly working hours per doctor, and appointments (search, create, edit details, reschedule, cancel, delete).
- `reschedule`, `updateDetails` and `cancelById` in `services/scheduling.js`. Reschedule runs in a transaction with the same availability rules as booking, keeps the reference code and refreshes queued messages.
- React staff app (`client/staff`, `client/src/staff`): sign-in, overview, appointments, doctors and working hours, with light and dark mode. Built as a second page of the existing Vite project, so there are no new dependencies.
- Integration tests for sign-in and every staff operation (`test/api.test.js`).
- `docs/STAFF_DASHBOARD.md` with the rules and the upgrade path for sign-in.

### Changed
- Patient cancellation and staff cancellation now share one `performCancel` helper.
- Landing page "Staff" links point to `/staff/`. The original `/admin.html` is kept.
- `.env.example`, `docker-compose.yml`, CI and docs updated for the new settings.

### Known follow-ups
- Staff sign-in is a single shared login from `.env` (upgrade path in the docs).
- The staff UI and the new transactional queries have not been run against a real MySQL in the authoring environment. The CI integration tests cover them.

## [Unreleased] - 2026-10-09: Frontend modernization

Replaces the legacy Bootstrap + vanilla JS front end (`public/index.html`, `bot.js`, `style.css`)
with a React 19 + Vite + Tailwind CSS 3 client in `client/`. The backend API is unchanged.

### Added
- Landing page conversion funnel written for seniors, veterans and their families: new hero copy, Problem, How it works, Features, Audience (families and caregivers) and Final call to action sections. Every call to action opens the same chat.
- `docs/CASE_STUDY.md`: portfolio write-up template (fill in role, links, screenshots and measured outcomes).
- Light and dark mode across every landing section, with a navbar toggle (`useTheme`, `ThemeToggle`).
  Follows the OS setting until the visitor chooses; the choice is saved in `localStorage` and applied
  before first paint to avoid a flash.
- Mobile navigation menu in the navbar.
- Animated hero-to-chat transition (CSS grid `[1fr_0fr]` to `[1fr_1.1fr]`, `cubic-bezier(0.16, 1, 0.3, 1)`).
  The chat stays mounted so the conversation survives closing and reopening.
- Services section now shows department photos, doctor counts and expandable clinic lists, with
  loading and retry states.
- Accessible, animated FAQ accordion (`aria-expanded`, `aria-controls`, regions).
- Chat widget: placeholders and keypad type that match the current step, translated UI strings,
  `role="log"` live region, monospace display for the booking reference code.
- Root scripts: `client:install`, `client:dev`, `client:build`, `build`.
- CI job that builds the client and checks that `admin.html` survives the build.
- Two-stage Dockerfile that builds the client before the server image.

### Changed
- Automation section is now "Under the hood" (technical view for engineers and recruiters). Section order is hero, problem, how it works, features, audience, services, under the hood, about, FAQ, final call to action.
- Chat open state lives in `App` so any call to action can open and start the chat.
- `useTrooperChat` rewritten against the real API contract (`/api/config`, `/doctors`,
  `/doctors/:id/availability`, `/availability/next`, `/appointments`, `/appointments/:ref`, `/cancel`):
  - Conversation starts when the chat is first opened (Start no longer skips language selection).
  - Used option buttons are removed; actions are ignored while the bot is busy, so double clicks cannot
    send two booking requests. Reset stops any flow still in progress.
  - Server error codes handled: `SLOT_UNAVAILABLE`, `ALREADY_BOOKED`, `NO_DOCTOR`, `RATE_LIMIT`,
    `ALREADY_CANCELLED`, `PAST`, `NOT_FOUND`, `BAD_PHONE`, network and 5xx failures.
  - After `SLOT_UNAVAILABLE`, times refresh the way the patient got there (chosen doctor or earliest slots).
  - Config failure is retried instead of silently producing an empty department menu.
  - Phone, name and reference validation mirrors `services/scheduling.js`.
  - Remaining English-only labels translated for Filipino mode.
- Services reads `/api/config` (shared with the chatbot) instead of the non-existent `/api/services`.
- Vite config: removed the `/admin` dev proxy that would have intercepted `/admin.html`.
- `public/` is now build output and is git-ignored.
- Service photos moved to `client/src/assets/services` and imported through Vite.
- FAQ reminder wording no longer hardcodes "the day before" (it is configurable via `REMINDER_HOURS`).
- Docs: README setup and structure, DEPLOYMENT build command (`npm ci && npm run build`).

### Fixed
- Tailwind v4-only classes (`shadow-xs`, `shadow-2xs`, `rounded-*-xs`) that did nothing on the pinned Tailwind 3.4.
- FAQ rendered a literal `\'` in "beneficiary's".
- `vite build` with `emptyOutDir` would have deleted the staff dashboard; its files now live in `client/public/`.
- `.env.example` had a byte-order mark that could break dotenv; restored the original.
- Hero layout could exceed the viewport height; chat height is now capped to the viewport.

### Removed
- Legacy front end: `public/index.html`, `public/assets/js/bot.js`, `public/assets/css/style.css`
  (still available in the original repository history).

### Known follow-ups
- `client/` has no ESLint config, so `npm run lint` fails.
- `axios` is unused; removing it needs a lockfile update.
- Template leftovers in `client/src/assets` (`react.svg`, `vite.svg`, `hero.png`).
- The client build and UI were not run in the authoring environment (no network); verify with
  `npm run client:build` and a browser check.
