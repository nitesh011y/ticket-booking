import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { eventsAPI, reserveAPI, bookingsAPI } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import SeatGrid from "../components/SeatGrid.jsx";
import SeatLegend from "../components/SeatLegend.jsx";
import ReservationPanel from "../components/ReservationPanel.jsx";
import AuthModal from "../components/AuthModal.jsx";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const MAX_SEATS = 6;

export default function EventDetailPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ── Data state ────────────────────────────────────────────────────────────
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // seatNumbers chosen by user
  const [reservation, setReservation] = useState(null); // { id, seatNumbers, expiresAt }
  const [booking, setBooking] = useState(null); // confirmed booking data

  // ── UI state ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState("loading"); // see JSDoc above
  const [error, setError] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [unavailable, setUnavailable] = useState([]); // seats that were taken mid-flow

  // ── Fetch event + seats ───────────────────────────────────────────────────
  const fetchEvent = useCallback(async () => {
    try {
      const data = await eventsAPI.get(id);
      setEvent(data.event);
      setSeats(data.seats);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus((prev) => (prev === "loading" ? "idle" : prev));
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // ── Seat toggle ───────────────────────────────────────────────────────────
  function toggleSeat(seatNumber) {
    if (status !== "idle") return;

    setUnavailable([]); // clear stale warnings
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      if (prev.length >= MAX_SEATS) {
        toast.info(
          "Limit reached",
          `You can select up to ${MAX_SEATS} seats at once.`,
        );
        return prev;
      }
      return [...prev, seatNumber];
    });
  }

  // ── Reserve ───────────────────────────────────────────────────────────────
  async function handleReserve() {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    if (selectedSeats.length === 0) return;

    setStatus("reserving");
    setError(null);

    try {
      const data = await reserveAPI.create(token, id, selectedSeats);
      setReservation(data.reservation);
      setSelectedSeats([]);
      setStatus("reserved");

      // Refresh seats from server so grid reflects new statuses
      const refreshed = await eventsAPI.get(id);
      setSeats(refreshed.seats);

      toast.success(
        "Seats reserved!",
        `You have 10 minutes to confirm your booking.`,
      );
    } catch (err) {
      // If unavailable seats are returned, highlight them
      if (err.unavailableSeats) {
        setUnavailable(err.unavailableSeats);
      }
      setError(err.message);
      setStatus("error");
      toast.error("Reservation failed", err.message);

      // Refresh seat data so user sees the updated status
      fetchEvent();
    }
  }

  // ── Confirm booking ───────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!reservation) return;

    setStatus("booking");
    setError(null);

    try {
      const data = await bookingsAPI.confirm(token, reservation.id);
      setBooking(data.booking);
      setReservation(null);
      setStatus("booked");

      // Refresh seats to show 'booked' status
      const refreshed = await eventsAPI.get(id);
      setSeats(refreshed.seats);

      toast.success(
        "Booking confirmed!",
        "Check your email for the ticket details.",
      );
    } catch (err) {
      setError(err.message);
      setStatus("error");
      toast.error("Booking failed", err.message);

      // If the reservation expired, reset and let user re-pick
      if (err.message?.toLowerCase().includes("expired")) {
        setReservation(null);
        fetchEvent();
      }
    }
  }

  // ── Reset to seat selection ───────────────────────────────────────────────
  function handleReset() {
    setSelectedSeats([]);
    setReservation(null);
    setError(null);
    setUnavailable([]);
    setStatus("idle");
    fetchEvent(); // always refresh when going back to idle
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="page">
        <div className="container">
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page">
        <div className="container">
          <div className="state-box">
            <div className="state-icon">😕</div>
            <h3>Event not found</h3>
            <p>{error || "This event may have been removed."}</p>
            <Link
              to="/"
              className="btn btn-outline"
              style={{ marginTop: 20, display: "inline-flex" }}
            >
              ← Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (status === "booked" && booking) {
    return (
      <div className="page">
        <div
          className="container"
          style={{ maxWidth: 560, textAlign: "center", paddingTop: 40 }}
        >
          <div style={styles.successIcon}>🎉</div>
          <h1 style={styles.successTitle}>You're going!</h1>
          <p style={styles.successSub}>
            Your booking is confirmed. See you at the show.
          </p>

          <div style={styles.ticket}>
            <div style={styles.ticketRow}>
              <span style={styles.ticketLabel}>Event</span>
              <span style={styles.ticketValue}>{event.name}</span>
            </div>
            <div style={styles.ticketDivider} />
            <div style={styles.ticketRow}>
              <span style={styles.ticketLabel}>Date</span>
              <span style={styles.ticketValue}>
                {formatDate(event.date)} · {formatTime(event.date)}
              </span>
            </div>
            <div style={styles.ticketDivider} />
            <div style={styles.ticketRow}>
              <span style={styles.ticketLabel}>Venue</span>
              <span style={styles.ticketValue}>{event.venue}</span>
            </div>
            <div style={styles.ticketDivider} />
            <div style={styles.ticketRow}>
              <span style={styles.ticketLabel}>Seats</span>
              <span style={styles.ticketValue}>
                {booking.seatNumbers.join(", ")}
              </span>
            </div>
            {event.price > 0 && (
              <>
                <div style={styles.ticketDivider} />
                <div style={styles.ticketRow}>
                  <span style={styles.ticketLabel}>Total paid</span>
                  <span
                    style={{
                      ...styles.ticketValue,
                      color: "var(--success)",
                      fontWeight: 700,
                    }}
                  >
                    ₹
                    {(event.price * booking.seatNumbers.length).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          <Link
            to="/"
            className="btn btn-outline"
            style={{ marginTop: 24, display: "inline-flex" }}
          >
            ← Browse more events
          </Link>
        </div>
      </div>
    );
  }

  // ── Main booking UI ───────────────────────────────────────────────────────
  return (
    <>
      <div className="page" style={{ paddingBottom: 100 }}>
        <div className="container">
          {/* ── Back link ──────────────────────────────────────────────────── */}
          <Link to="/" style={styles.backLink}>
            ← All events
          </Link>

          {/* ── Event header ───────────────────────────────────────────────── */}
          <div style={styles.header}>
            <div style={styles.headerText}>
              <p className="section-label">{event.category}</p>
              <h1 className="page-title">{event.name}</h1>
              {event.description && (
                <p style={styles.description}>{event.description}</p>
              )}
              <div style={styles.metaRow}>
                <span style={styles.metaChip}>📅 {formatDate(event.date)}</span>
                <span style={styles.metaChip}>🕐 {formatTime(event.date)}</span>
                <span style={styles.metaChip}>📍 {event.venue}</span>
                {event.price > 0 && (
                  <span
                    style={{
                      ...styles.metaChip,
                      color: "var(--accent-text)",
                      borderColor: "var(--accent-dim)",
                    }}
                  >
                    ₹{event.price.toLocaleString("en-IN")} / seat
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Instructions ───────────────────────────────────────────────── */}
          <div style={styles.instructions}>
            {status === "idle" && (
              <p style={styles.hint}>
                {selectedSeats.length === 0
                  ? `Click any green seat to select it. Max ${MAX_SEATS} seats per booking.`
                  : `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected — hit Reserve to hold them for 10 minutes.`}
              </p>
            )}
            {status === "reserved" && (
              <p style={styles.hint}>
                ✅ Seats <strong>{reservation?.seatNumbers.join(", ")}</strong>{" "}
                are held for you. Confirm your booking before the timer runs
                out.
              </p>
            )}
            {unavailable.length > 0 && (
              <p style={{ ...styles.hint, color: "var(--error)" }}>
                ⚠️ Seats <strong>{unavailable.join(", ")}</strong> were taken by
                someone else. Please choose different seats.
              </p>
            )}
          </div>

          {/* ── Seat legend ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <SeatLegend />
          </div>

          {/* ── Seat grid ───────────────────────────────────────────────────── */}
          <div style={styles.gridWrapper}>
            <SeatGrid
              seats={seats}
              selectedSeats={selectedSeats}
              mySeatNumbers={reservation?.seatNumbers || []}
              onToggle={toggleSeat}
              disabled={status !== "idle"}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky booking panel ──────────────────────────────────────────── */}
      <ReservationPanel
        status={status}
        selectedSeats={selectedSeats}
        reservation={reservation}
        error={error}
        price={event.price}
        onReserve={handleReserve}
        onConfirm={handleConfirm}
        onReset={handleReset}
      />

      {/* ── Auth gate modal ───────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal initialTab="login" onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}

const styles = {
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.83rem",
    color: "var(--text-secondary)",
    marginBottom: 28,
    transition: "color 150ms",
  },
  header: {
    marginBottom: 28,
    paddingBottom: 28,
    borderBottom: "1px solid var(--border)",
  },
  headerText: { maxWidth: 680 },
  description: {
    color: "var(--text-secondary)",
    fontSize: "0.92rem",
    marginTop: 10,
    lineHeight: 1.65,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  metaChip: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 99,
    padding: "4px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  instructions: {
    minHeight: 32,
    marginBottom: 20,
  },
  hint: {
    fontSize: "0.88rem",
    color: "var(--text-secondary)",
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "10px 14px",
    display: "inline-block",
  },
  gridWrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "32px 24px",
    overflowX: "auto",
  },

  /* ── Success screen ────────── */
  successIcon: { fontSize: "4rem", marginBottom: 16 },
  successTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 5vw, 2.8rem)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    marginBottom: 10,
    background: "linear-gradient(135deg, var(--accent-text), var(--success))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  successSub: {
    color: "var(--text-secondary)",
    fontSize: "1rem",
    marginBottom: 32,
  },
  ticket: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "24px",
    textAlign: "left",
  },
  ticketRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "6px 0",
  },
  ticketLabel: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontWeight: 500,
    flexShrink: 0,
    paddingTop: 2,
  },
  ticketValue: {
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    fontWeight: 500,
    textAlign: "right",
  },
  ticketDivider: {
    height: 1,
    background: "var(--border)",
    margin: "2px 0",
  },
};
