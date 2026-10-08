// SMS sender. The default provider only prints to the server log, so the project runs
// with no account and no cost. To send real texts, replace send() with a call to an SMS
// provider (for example Semaphore or Twilio) and keep the same input and output.
const outbox = []; // last 100 messages, handy for tests and the staff dashboard

async function send({ to, message }) {
  outbox.push({ to, message, at: new Date().toISOString() });
  if (outbox.length > 100) outbox.shift();
  if (process.env.NODE_ENV !== 'test') console.log(`[SMS to ${to}] ${message}`);
  return { ok: true };
}

module.exports = { send, outbox };
