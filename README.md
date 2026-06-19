# Event Ticket Booking System

## Setup

```bash
cd backend
npm install

# create your env file and fill in MONGO_URI + JWT_SECRET
touch .env

# seeds the DB with 4 sample events
npm run seed

# start the server
npm run dev      # dev (nodemon)
npm start        # prod
```

API runs on **http://localhost:5000**

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173**. Vite proxies `/api/*` to `http://localhost:5000`, so you don't need to deal with CORS in dev.

## Assumptions

1. A user can only have one active reservation going at a time. This is enforced on the frontend rather than the backend — the API itself doesn't stop you from firing off multiple reservation requests, but the UI flow doesn't give you a way to do that.

2. Seats are named `{Row}{Col}` — `A1`, `B4`, etc. The seed script just lays out a plain rectangular grid per event. A real venue with curved rows or sections would need a less rigid seat schema.

## Design Decisions

### Avoiding double bookings

This was the main thing to get right. Two people shouldn't be able to grab the same seat at the same time.

I went with optimistic locking instead of full transactions — basically, the `status: 'available'` filter does the heavy lifting:

```js
const result = await Seat.updateMany(
  { eventId, seatNumber: { $in: requestedSeats }, status: "available" },
  {
    $set: { status: "reserved", reservedBy: userId, reservedUntil: expiresAt },
  },
);
```

MongoDB updates a single document atomically, so if two reserve requests land on seat `A1` at the same instant, only one of them actually flips the status. The other one just... doesn't match the filter anymore, so it updates nothing.

After the update I compare `result.modifiedCount` against how many seats were requested. If they don't line up, it means someone beat us to at least one seat — so I roll back whatever did get reserved and send back a 409 with the names of the seats that were unavailable.

It's not bulletproof in the strictest sense — if you've got a replica set, wrapping this in a proper `mongoose.startSession()` transaction would be the more "correct" way to do it. For this assignment, the optimistic approach is simpler and works fine on a standalone Mongo instance.

### Cleaning up expired reservations

Reservations die after 10 minutes, and there are two things keeping that honest:

- Every time `GET /api/events/:id` is called, the server first runs an `updateMany` to release any seat where `reservedUntil` has already passed. So you never see stale "reserved" seats just by loading the page — no cron job needed.

- There's also a TTL index on `Reservation.expiresAt`, so Mongo quietly deletes the reservation document itself once it's expired. That one's just for keeping the collection tidy — it doesn't touch seat status, the lazy cleanup above handles that.

The frontend gets the `expiresAt` value and runs its own countdown off it (see `useCountdown`), so the timer ticks down smoothly without hammering the API every second.
