const express = require('express');
const hospital = require('../config/hospital');
const { leadDays, windowDays, reminderHours } = require('../config/env');
const scheduling = require('../services/scheduling');
const limit = require('../middleware/limit');
const { AppError } = require('../services/errors');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const slug = (v) => (typeof v === 'string' && /^[a-z0-9-]{1,40}$/.test(v) ? v : null);

// Everything the chatbot needs to build its menus. The bot has no hardcoded departments.
router.get('/config', wrap(async (req, res) => {
  res.json({
    hospital,
    departments: await scheduling.getCatalog(),
    booking: { leadDays, windowDays, reminderHours }
  });
}));

router.get('/doctors', wrap(async (req, res) => {
  const department = slug(req.query.department);
  if (!department) throw new AppError(400, 'BAD_DEPARTMENT', 'Department is required.');
  res.json({ doctors: await scheduling.listDoctors({ department, clinic: slug(req.query.clinic) }) });
}));

router.get('/doctors/:id/availability', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError(400, 'BAD_DOCTOR', 'Invalid doctor.');
  res.json({ dates: await scheduling.availability(id) });
}));

router.get('/availability/next', wrap(async (req, res) => {
  const department = slug(req.query.department);
  if (!department) throw new AppError(400, 'BAD_DEPARTMENT', 'Department is required.');
  const limitN = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 10);
  res.json({ options: await scheduling.nextAvailable({ department, clinic: slug(req.query.clinic), limit: limitN }) });
}));

router.post('/appointments', limit({ max: parseInt(process.env.BOOKING_RATE_LIMIT, 10) || 20, windowMs: 60 * 60 * 1000, message: 'Too many bookings from this device. Please try again later.' }), wrap(async (req, res) => {
  res.status(201).json(await scheduling.book(req.body || {}));
}));

const lookupLimit = limit({ max: 30, windowMs: 15 * 60 * 1000 });

router.get('/appointments/:ref', lookupLimit, wrap(async (req, res) => {
  res.json(await scheduling.lookup(req.params.ref, req.query.phone));
}));

router.post('/appointments/:ref/cancel', lookupLimit, wrap(async (req, res) => {
  res.json(await scheduling.cancel(req.params.ref, (req.body || {}).phone));
}));

module.exports = router;
