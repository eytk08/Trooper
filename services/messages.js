// SMS text in English and Filipino. Keep each message under 160 characters when possible.
const { dateLabel, timeLabel } = require('./time');

const T = {
  en: {
    confirmation: (a) => `Trooper: Booked! ${a.doctor}, ${dateLabel(a.date)} at ${timeLabel(a.start)}. Ref ${a.ref}. Please arrive 15 minutes early.`,
    reminder: (a) => `Trooper reminder: appointment with ${a.doctor} on ${dateLabel(a.date)} at ${timeLabel(a.start)}. Ref ${a.ref}. Reply to the hospital if you need to change it.`,
    cancellation: (a) => `Trooper: Your appointment ${a.ref} on ${dateLabel(a.date)} has been cancelled and the slot was released.`
  },
  fil: {
    confirmation: (a) => `Trooper: Naka-book na! ${a.doctor}, ${dateLabel(a.date)} ng ${timeLabel(a.start)}. Ref ${a.ref}. Pumunta nang 15 minuto bago ang oras.`,
    reminder: (a) => `Paalala mula sa Trooper: appointment kay ${a.doctor} sa ${dateLabel(a.date)} ng ${timeLabel(a.start)}. Ref ${a.ref}.`,
    cancellation: (a) => `Trooper: Kanselado na ang appointment ${a.ref} sa ${dateLabel(a.date)}. Nabitawan na ang slot.`
  }
};

module.exports = (language, type, appt) => (T[language] || T.en)[type](appt);
