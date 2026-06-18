const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Seat = require("../models/Seat");
const Reservation = require("../models/Reservation");
const Event = require("../models/Event");
const auth = require("../middleware/auth");

const router = express.Router();

const RESERVATION_MINUTES = 10;

// ── POST /api/reserve ─────────────────────────────────────────────────────────
//
// Double-booking prevention strategy (optimistic locking):
//
// We use updateMany with a compound filter { seatNumber: {$in: ...}, status: 'available' }.
// MongoDB guarantees document-level atomicity, so only ONE concurrent writer can
// succeed for any given seat document.  After the update we check modifiedCount:
//
//   modifiedCount === requested seats  →  all seats were available, reservation OK
//   modifiedCount < requested seats    →  at least one seat was already taken;
//                                         we rollback the seats we DID reserve.
//
// For a production system with a MongoDB replica set, wrap this in a session/
// transaction to get multi-document atomicity (see README). For standalone
// MongoDB (local dev) this optimistic approach is sufficient.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  auth,
  [
    body("eventId").notEmpty().withMessage("eventId is required"),
    body("seatNumbers")
      .isArray({ min: 1 })
      .withMessage("seatNumbers must be a non-empty array"),
    body("seatNumbers.*")
      .isString()
      .withMessage("Each seat number must be a string"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { eventId, seatNumbers } = req.body;
    const userId = req.userId;

    // De-duplicate seat numbers from the request
    const uniqueSeats = [...new Set(seatNumbers)];

    if (uniqueSeats.length > 10) {
      return res
        .status(400)
        .json({ message: "You can reserve a maximum of 10 seats at once." });
    }

    // Verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Release any globally expired reservations first
    const now = new Date();
    await Seat.updateMany(
      { eventId, status: "reserved", reservedUntil: { $lt: now } },
      { $set: { status: "available", reservedBy: null, reservedUntil: null } },
    );

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    // ── Atomic update: only touches seats that are currently 'available' ───────
    const updateResult = await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: uniqueSeats },
        status: "available",
      },
      {
        $set: {
          status: "reserved",
          reservedBy: userId,
          reservedUntil: expiresAt,
        },
      },
    );

    // ── Check all requested seats were successfully reserved ───────────────────
    if (updateResult.modifiedCount !== uniqueSeats.length) {
      // Partial update: rollback whatever seats we just reserved
      await Seat.updateMany(
        {
          eventId,
          seatNumber: { $in: uniqueSeats },
          status: "reserved",
          reservedBy: userId,
        },
        {
          $set: { status: "available", reservedBy: null, reservedUntil: null },
        },
      );

      // Find which seats are not available to provide a helpful error
      const unavailable = await Seat.find({
        eventId,
        seatNumber: { $in: uniqueSeats },
        status: { $ne: "available" },
      }).select("seatNumber status -_id");

      return res.status(409).json({
        message:
          "Some seats are no longer available. Please update your selection.",
        unavailableSeats: unavailable.map((s) => s.seatNumber),
      });
    }

    // ── Create reservation record ──────────────────────────────────────────────
    const reservation = await Reservation.create({
      userId,
      eventId,
      seatNumbers: uniqueSeats,
      expiresAt,
      status: "active",
    });

    res.status(201).json({
      message: `${uniqueSeats.length} seat(s) reserved. Complete your booking within ${RESERVATION_MINUTES} minutes.`,
      reservation: {
        id: reservation._id,
        seatNumbers: uniqueSeats,
        expiresAt,
      },
    });
  },
);

module.exports = router;
