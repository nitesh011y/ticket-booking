const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
    },
    col: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
    },
    // Tracks who holds this seat for the purpose of rollback / ownership checks
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Reservation expiry stored on the seat for fast cleanup queries
    reservedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Unique seat per event
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

// Fast lookup for expired reservations
seatSchema.index({ status: 1, reservedUntil: 1 });

module.exports = mongoose.model('Seat', seatSchema);
