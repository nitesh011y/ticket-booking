/**
 * seed.js — Populates the database with sample events and seats.
 * Run with:  npm run seed
 */

const mongoose = require("mongoose");
const Event = require("./models/Event");
const Seat = require("./models/Seat");
require("dotenv").config();

const EVENTS = [
  {
    name: "Rock Night Live",
    description:
      "An electrifying night of rock featuring top indie and classic rock bands performing back-to-back sets.",
    date: new Date("2025-08-15T20:00:00+05:30"),
    venue: "MMRDA Grounds, Bandra Kurla Complex, Mumbai",
    totalSeats: 50,
    price: 999,
    category: "music",
    rows: ["A", "B", "C", "D", "E"],
    cols: 10,
  },
  {
    name: "The Comedy Club: Monsoon Special",
    description:
      "Stand-up comedy night with Mumbai's best comedians. Includes surprise celebrity guests.",
    date: new Date("2025-08-22T19:00:00+05:30"),
    venue: "Dome, NSCI SVP Stadium, Worli, Mumbai",
    totalSeats: 40,
    price: 599,
    category: "comedy",
    rows: ["A", "B", "C", "D"],
    cols: 10,
  },
  {
    name: "Tech Summit Mumbai 2025",
    description:
      "A full-day technology conference covering AI, Web3, and the future of Indian startups.",
    date: new Date("2025-09-05T09:00:00+05:30"),
    venue: "Jio World Convention Centre, BKC, Mumbai",
    totalSeats: 60,
    price: 1499,
    category: "tech",
    rows: ["A", "B", "C", "D", "E", "F"],
    cols: 10,
  },
  {
    name: "Bollywood Remix Night",
    description:
      "Live DJ sets blending classic Bollywood hits with modern remixes. Dance floor included.",
    date: new Date("2025-09-20T21:00:00+05:30"),
    venue: "The Dome at NESCO, Goregaon, Mumbai",
    totalSeats: 48,
    price: 799,
    category: "music",
    rows: ["A", "B", "C", "D"],
    cols: 12,
  },
];

async function seed() {
  const MONGO_URI = process.env.MONGO_URL;

  try {
    await mongoose.connect(MONGO_URI);
    console.log(" Connected to MongoDB\n");

    // Clean existing data
    await Promise.all([Event.deleteMany({}), Seat.deleteMany({})]);
    console.log(" Cleared existing events and seats\n");

    for (const eventData of EVENTS) {
      const { rows, cols, ...eventFields } = eventData;

      const event = await Event.create(eventFields);
      console.log(
        `Created event: "${event.name}" (${rows.length * cols} seats)`,
      );

      // Build seat documents for this event
      const seats = [];
      for (const row of rows) {
        for (let col = 1; col <= cols; col++) {
          seats.push({
            eventId: event._id,
            seatNumber: `${row}${col}`,
            row,
            col,
            status: "available",
          });
        }
      }

      await Seat.insertMany(seats);
      console.log(`Inserted ${seats.length} seats\n`);
    }

    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
