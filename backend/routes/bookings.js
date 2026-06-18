const express = require("express");
const { body, validationResult } = require("express-validator");
const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");
const auth = require("../middleware/auth");

const router = express.Router();

// ── POST /api/bookings ────────────────────────────────────────────────────────
//
// Converts an active, non-expired reservation into a confirmed booking.
// Seats move from 'reserved' → 'booked'.  Expired reservations are rejected
// and the held seats are released back to 'available'.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  auth,
  [body("reservationId").notEmpty().withMessage("reservationId is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { reservationId } = req.body;
    const userId = req.userId;

    // Find the reservation — must belong to this user and be active
    const reservation = await Reservation.findOne({
      _id: reservationId,
      userId,
      status: "active",
    });

    if (!reservation) {
      return res.status(404).json({
        message:
          "Reservation not found. It may have already been used or cancelled.",
      });
    }

    // ── Expiry check ───────────────────────────────────────────────────────────
    if (new Date() > reservation.expiresAt) {
      // Mark reservation expired and release seats
      await Promise.all([
        Reservation.findByIdAndUpdate(reservationId, { status: "expired" }),
        Seat.updateMany(
          {
            eventId: reservation.eventId,
            seatNumber: { $in: reservation.seatNumbers },
            reservedBy: userId,
            status: "reserved",
          },
          {
            $set: {
              status: "available",
              reservedBy: null,
              reservedUntil: null,
            },
          },
        ),
      ]);

      return res.status(410).json({
        message:
          "Your reservation has expired. Please select seats and reserve again.",
      });
    }

    // ── Atomically mark seats as booked ───────────────────────────────────────
    // Filter: only update seats that are STILL reserved by THIS user.
    // This guards against any edge case where seats were released between
    // reserve and confirm.
    const updateResult = await Seat.updateMany(
      {
        eventId: reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: "reserved",
        reservedBy: userId,
      },
      {
        $set: { status: "booked", reservedUntil: null },
      },
    );

    if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
      // Partial failure — some seats are no longer in a reserved state
      await Reservation.findByIdAndUpdate(reservationId, { status: "expired" });
      return res.status(409).json({
        message:
          "Booking failed. One or more reserved seats are no longer available.",
      });
    }

    // ── Mark reservation as completed ─────────────────────────────────────────
    await Reservation.findByIdAndUpdate(reservationId, { status: "completed" });

    res.status(201).json({
      message: "Booking confirmed! Enjoy the event 🎉",
      booking: {
        reservationId,
        eventId: reservation.eventId,
        seatNumbers: reservation.seatNumbers,
        bookedAt: new Date(),
      },
    });
  },
);

// ── GET /api/bookings ─────────────────────────────────────────────────────────
// Returns the authenticated user's confirmed bookings
router.get("/", auth, async (req, res) => {
  try {
    const bookings = await Reservation.find({
      userId: req.userId,
      status: "completed",
    })
      .populate("eventId", "name date venue price")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(bookings);
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

module.exports = router;
