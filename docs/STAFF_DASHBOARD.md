# Staff dashboard

The staff dashboard is a second front end in the same Vite project. It lives at `/staff/`
(in dev: http://localhost:5173/staff/). Code: `client/staff/index.html` and `client/src/staff/`.

## Signing in
Set these in `.env`:

```
STAFF_USERNAME=admin
STAFF_PASSWORD=your_password
STAFF_SESSION_HOURS=8
STAFF_SESSION_SECRET=optional_long_random_string
```

* `POST /api/admin/login` checks the username and password in constant time and returns a signed
  token that expires after `STAFF_SESSION_HOURS`. Nothing is stored in the database.
* The dashboard keeps the token in `sessionStorage` and sends it as `Authorization: Bearer ...`.
  Closing the tab signs the user out. An expired token sends them back to the sign-in page.
* Sign-in is rate limited (10 attempts per 15 minutes per IP).
* If `STAFF_SESSION_SECRET` is empty, a random secret is made at every start, so a server restart
  signs everyone out.
* The older shared `x-admin-token` header still works, so `/admin.html` keeps running.

## What staff can do
| Tab | Actions |
| --- | --- |
| Overview | Today's appointments, upcoming and cancelled counts, busiest departments and doctors, reminder queue |
| Appointments | Search by name, phone or reference. Filter by upcoming, past, status, doctor or date. **Create** a booking (phone or walk-in), **edit** patient details, **reschedule** to another time or doctor, **cancel**, **delete** |
| Doctors & hours | **Add**, **edit**, activate or deactivate, **delete** doctors. Set the **working days and hours** per weekday (start, end, slot length, daily patient limit). These hours become the slots patients can book |

## Rules worth knowing
* **Booking and rescheduling use the same checks as the chatbot** (open slot, lead time, booking window, one booking per phone per doctor per day) and run in a transaction, so two people cannot take the same slot.
* **Rescheduling keeps the reference code.** The old slot is released, a new confirmation text is queued, and unsent old reminders are skipped. If the new time is not available, nothing changes.
* **Cancelling keeps the record.** Deleting removes it for good. Use cancel unless it was entered by mistake.
* **A doctor with appointment records cannot be deleted.** Set them to inactive: they disappear from booking and the history stays correct.
* **Changing or removing a working day does not move appointments already booked on it.** The dashboard warns how many are affected so staff can reschedule them.
* The reschedule text reuses the "Booked!" confirmation wording. A dedicated "rescheduled" message would need a new notification type.

## Upgrade path (the sign-in is intentionally simple)
1. **Staff accounts table** with individual users instead of one shared login.
2. **Password hashing** with scrypt or argon2 (never plain text), plus a password change screen.
3. **Roles**: for example `admin` (doctors and hours), `front_desk` (appointments only), `viewer` (read only).
4. **httpOnly, SameSite cookies** instead of a token in `sessionStorage`, with CSRF protection.
5. **Lockout and alerts** after repeated failed sign-ins, and optional two-step sign-in.
6. **Audit log**: who changed or deleted which record and when.
7. **Single sign-on** with the hospital's identity provider.
