import useCountdown from "../hooks/useCountdown.js";

export default function ReservationPanel({
  status,
  selectedSeats,
  reservation,
  error,
  price,
  onReserve,
  onConfirm,
  onReset,
}) {
  const { minutes, seconds, isExpired, progress } = useCountdown(
    reservation?.expiresAt,
    10 * 60 * 1000,
  );

  const timerColor =
    progress > 0.4
      ? "var(--success)"
      : progress > 0.15
        ? "var(--warning)"
        : "var(--error)";

  if (status === "booked") return null; // Success screen handles itself

  const hasSelection = selectedSeats.length > 0;
  const totalPrice =
    price * (reservation?.seatNumbers.length || selectedSeats.length);

  return (
    <div style={styles.panel}>
      <div className="container">
        <div style={styles.inner}>
          {/* ── Idle: seats selected, waiting to reserve ─────────────────── */}
          {status === "idle" && (
            <>
              <div style={styles.info}>
                <span style={styles.count}>
                  {hasSelection
                    ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""} selected`
                    : "No seats selected"}
                </span>
                {hasSelection && price > 0 && (
                  <span style={styles.total}>
                    ₹{totalPrice.toLocaleString("en-IN")} total
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary btn-lg"
                disabled={!hasSelection}
                onClick={onReserve}
              >
                Reserve seats →
              </button>
            </>
          )}

          {/* ── Reserving: API call in flight ────────────────────────────── */}
          {status === "reserving" && (
            <div style={styles.centered}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Securing your seats…</span>
            </div>
          )}

          {/* ── Reserved: countdown timer + confirm button ────────────────── */}
          {status === "reserved" && (
            <>
              <div style={styles.timerBlock}>
                {/* Circular progress ring */}
                <svg width="52" height="52" style={styles.ring}>
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke={timerColor}
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                    style={{
                      transition: "stroke-dashoffset 0.5s linear, stroke 0.5s",
                    }}
                  />
                  <text
                    x="26"
                    y="30"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={timerColor}
                    fontFamily="var(--font-display)"
                  >
                    {String(minutes).padStart(2, "0")}:
                    {String(seconds).padStart(2, "0")}
                  </text>
                </svg>

                <div>
                  <div style={styles.reservedLabel}>Seats held for you</div>
                  <div style={styles.seatList}>
                    {reservation.seatNumbers.join(", ")}
                  </div>
                  {isExpired && (
                    <div style={styles.expiredMsg}>
                      Reservation expired — please select again.
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.actionGroup}>
                {price > 0 && (
                  <span style={styles.total}>
                    ₹
                    {(price * reservation.seatNumbers.length).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={onReset}
                  style={{ fontSize: "0.82rem" }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success btn-lg"
                  disabled={isExpired}
                  onClick={onConfirm}
                ></button>
              </div>
            </>
          )}

          {/* ── Booking in flight ────────────────────────────────────────── */}
          {status === "booking" && (
            <div style={styles.centered}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Confirming your booking…</span>
            </div>
          )}

          {/* ── Error state ───────────────────────────────────────────────── */}
          {status === "error" && (
            <>
              <div style={styles.errorMsg}>
                <span>eror</span>
                <span>
                  {error || "Something went wrong. Please try again."}
                </span>
              </div>
              <button className="btn btn-outline" onClick={onReset}>
                Start over
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: "sticky",
    bottom: 0,
    zIndex: 50,
    background: "rgba(13, 17, 23, 0.95)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid var(--border)",
    padding: "14px 0",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  info: { display: "flex", flexDirection: "column", gap: 2 },
  count: {
    fontFamily: "var(--font-display)",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  total: {
    fontFamily: "var(--font-display)",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "var(--accent-text)",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "center",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    fontStyle: "italic",
  },
  timerBlock: { display: "flex", alignItems: "center", gap: 14 },
  ring: { flexShrink: 0 },
  reservedLabel: {
    fontFamily: "var(--font-display)",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  seatList: { fontSize: "0.8rem", color: "var(--accent-text)", marginTop: 2 },
  expiredMsg: { fontSize: "0.78rem", color: "var(--error)", marginTop: 4 },
  actionGroup: { display: "flex", alignItems: "center", gap: 10 },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.88rem",
    color: "var(--error)",
    flex: 1,
  },
};
