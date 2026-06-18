const express = require('express');
const Event   = require('../models/Event');
const Seat    = require('../models/Seat');

const router = express.Router();

/**
 * Releases seats whose reservation timer has expired.
 * Called before returning seat data so the frontend always sees fresh state.
 */
async function releaseExpiredReservations(eventId) {
  const now = new Date();
  const result = await Seat.updateMany(
    { eventId, status: 'reserved', reservedUntil: { $lt: now } },
    { $set: { status: 'available', reservedBy: null, reservedUntil: null } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Released ${result.modifiedCount} expired reserved seats for event ${eventId}`);
  }
}

// ── GET /api/events ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();

    // Attach live available/reserved/booked counts
    const enriched = await Promise.all(
      events.map(async (event) => {
        // Clean expired reservations per event
        await releaseExpiredReservations(event._id);

        const [available, reserved, booked] = await Promise.all([
          Seat.countDocuments({ eventId: event._id, status: 'available' }),
          Seat.countDocuments({ eventId: event._id, status: 'reserved' }),
          Seat.countDocuments({ eventId: event._id, status: 'booked' }),
        ]);

        return { ...event, available, reserved, booked };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Release expired reservations before returning seats
    await releaseExpiredReservations(req.params.id);

    const seats = await Seat.find({ eventId: req.params.id })
      .sort({ row: 1, col: 1 })
      .lean();

    res.json({ event, seats });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }
    console.error('GET /events/:id error:', err);
    res.status(500).json({ message: 'Failed to fetch event details.' });
  }
});

module.exports = router;
