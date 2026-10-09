# Trooper: case study

> Portfolio write-up. Items marked **[FILL IN]** need your own facts (role, dates, screenshots, links).
> Everything else describes what the code in this repository really does.

**Role:** [FILL IN: solo developer / team member]  **Timeline:** [FILL IN]
**Stack:** React 19, Vite, Tailwind CSS, Node.js, Express 5, MySQL, Docker, GitHub Actions
**Links:** [FILL IN: live demo] | [FILL IN: repository]

## The problem
Booking a hospital appointment usually means a phone call, a queue and a form. That is hardest for the people who use hospitals most: seniors and veterans, and the family members who help them. Staff lose time on the phone, and patients miss visits they forgot about.

## The idea
Trooper is a chatbot that behaves like a patient guide. It asks one simple question at a time, shows only the times that are really open, and handles confirmation, reminders and cancellation without staff involvement. It started as MedSched, a proposed scheduling system for the Veterans Memorial Medical Center, and was rebuilt around a MySQL database.

## Who it is for
- **Patients:** seniors and veterans who want a calm, unhurried way to book.
- **Families and caregivers:** can book for someone else and manage the booking with the reference code.
- **Hospital staff:** a live dashboard replaces manual lists.

## Design decisions
| Decision | Why |
|---|---|
| One question per screen, tap-first answers | Fewer errors and less typing for older users |
| Large bubbles and buttons (`text-base` to `text-lg`) | Readability |
| English and Filipino, chosen at the start | The language carries through the chat and the reminder texts |
| Light and dark mode with a saved preference | Comfort and accessibility; follows the OS until the visitor chooses |
| Landing page as a funnel: hero, problem, how it works, features, audience, services, FAQ, final call to action | Every section answers the next question a visitor would ask, and every call to action opens the same chat |

## Engineering highlights
1. **No double booking.** Each booking runs in a transaction that locks the doctor row (`SELECT ... FOR UPDATE`), re-checks availability, then inserts. Ten people tapping the last slot at once cannot all get it (covered by the test suite).
2. **Slots are generated, not stored.** Availability is computed from each doctor's schedule rows, so changing a schedule changes what patients see immediately.
3. **Earliest-slot matching.** First-time patients are offered the soonest open times across every doctor in a clinic.
4. **Automation queue.** Booking and cancelling write rows to a `notification` table; a background job sends the due ones and retries failures.
5. **A chat state machine in a React hook.** `useTrooperChat` runs one flow at a time, consumes option buttons once used, cancels stale flows on restart, and maps every server error code to a message in the patient's language.
6. **Front end migration.** A monolithic HTML + vanilla JS page became a Vite + React + Tailwind client, with the staff dashboard preserved through the build.

## Problems I solved
- **Language switch showing the wrong menu.** React state updates are asynchronous, so the menu rendered in the old language. Fixed with a ref that mirrors the language for code that runs after an `await`.
- **Duplicate bookings from double clicks.** Fixed by removing used buttons and ignoring actions while a flow is running; verified by a test that fires the confirm button twice and expects one request.
- **Build deleting the staff dashboard.** `vite build` empties its output folder, so the dashboard's files moved into `client/public/` where Vite copies them.
- **Styles that silently did nothing.** Components used Tailwind v4 class names on a Tailwind 3.4 project. Found by auditing against the pinned version.

## Outcomes
[FILL IN with real results only, for example: tests passing, number of departments and doctors in the demo, Lighthouse scores you measured, feedback from real users.]
Do not add usage or time-saved numbers unless you measured them.

## What I would do next
- Connect a real SMS provider (the demo writes texts to the server log).
- Add text-size controls and voice input for accessibility.
- Run usability sessions with real seniors and refine the wording.
- Replace the in-memory rate limiter with a shared store for multi-server hosting.

## Screenshots
[FILL IN: hero light and dark, chat mid-booking, confirmation code, Services, staff dashboard, mobile view]
