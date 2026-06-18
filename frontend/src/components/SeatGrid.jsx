import { useMemo } from "react";

function getSeatState(seat, selectedSeats, mySeatNumbers) {
  if (seat.status === "booked") return "booked";
  if (seat.status === "reserved") {
    return mySeatNumbers.includes(seat.seatNumber) ? "mine" : "reserved";
  }
  if (selectedSeats.includes(seat.seatNumber)) return "selected";
  return "available";
}

const STATE_STYLES = {
  available: {
    bg: "var(--seat-available-bg)",
    border: "var(--seat-available)",
    color: "var(--seat-available)",
    cursor: "pointer",
  },
  selected: {
    bg: "var(--seat-selected-bg)",
    border: "var(--seat-selected)",
    color: "var(--seat-selected)",
    cursor: "pointer",
  },
  mine: {
    bg: "var(--seat-mine-bg)",
    border: "var(--seat-mine)",
    color: "var(--seat-mine)",
    cursor: "default",
  },
  reserved: {
    bg: "var(--seat-reserved-bg)",
    border: "var(--seat-reserved)",
    color: "var(--seat-reserved)",
    cursor: "not-allowed",
  },
  booked: {
    bg: "var(--seat-booked)",
    border: "var(--seat-booked)",
    color: "var(--seat-booked-text)",
    cursor: "not-allowed",
  },
};

export default function SeatGrid({
  seats,
  selectedSeats,
  mySeatNumbers = [],
  onToggle,
  disabled,
}) {
  // Group seats by row letter
  const rows = useMemo(() => {
    const map = {};
    for (const seat of seats) {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    }
    // Sort each row by column number
    for (const row of Object.keys(map)) {
      map[row].sort((a, b) => a.col - b.col);
    }
    return map;
  }, [seats]);

  const rowLetters = Object.keys(rows).sort();

  return (
    <div style={styles.wrapper}>
      {/* Stage indicator */}
      <div style={styles.stage}>
        <div style={styles.stageLine} />
        <span style={styles.stageLabel}>STAGE</span>
        <div style={styles.stageLine} />
      </div>

      {/* Seat grid */}
      <div style={styles.grid}>
        {rowLetters.map((rowLetter) => (
          <div key={rowLetter} style={styles.row}>
            <span style={styles.rowLabel}>{rowLetter}</span>

            <div style={styles.seatsRow}>
              {rows[rowLetter].map((seat) => {
                const state = getSeatState(seat, selectedSeats, mySeatNumbers);
                const s = STATE_STYLES[state];
                const isClickable =
                  (state === "available" || state === "selected") && !disabled;

                return (
                  <button
                    key={seat._id}
                    title={`${seat.seatNumber} — ${state}`}
                    aria-label={`Seat ${seat.seatNumber}, ${state}`}
                    disabled={!isClickable}
                    onClick={() => isClickable && onToggle(seat.seatNumber)}
                    style={{
                      ...styles.seat,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      color: s.color,
                      cursor: disabled ? "not-allowed" : s.cursor,
                      opacity: disabled && state === "available" ? 0.5 : 1,
                      transform:
                        state === "selected" ? "scale(1.12)" : "scale(1)",
                    }}
                  >
                    <span style={styles.seatNum}>{seat.col}</span>
                  </button>
                );
              })}
            </div>

            <span style={styles.rowLabel}>{rowLetter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    overflowX: "auto",
    paddingBottom: 8,
  },
  stage: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
    padding: "0 8px",
  },
  stageLine: {
    flex: 1,
    height: 2,
    borderRadius: 99,
    background:
      "linear-gradient(90deg, transparent, var(--accent), transparent)",
    opacity: 0.5,
  },
  stageLabel: {
    fontFamily: "var(--font-display)",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    color: "var(--accent-text)",
    padding: "4px 14px",
    border: "1px solid var(--accent-dim)",
    borderRadius: 99,
    background: "var(--accent-glow)",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
    minWidth: "max-content",
    margin: "0 auto",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    width: 20,
    textAlign: "center",
    fontFamily: "var(--font-display)",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  seatsRow: {
    display: "flex",
    gap: 5,
    flexWrap: "nowrap",
  },
  seat: {
    width: 34,
    height: 34,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms",
    flexShrink: 0,
    position: "relative",
  },
  seatNum: {
    fontSize: "0.65rem",
    fontWeight: 600,
    userSelect: "none",
    lineHeight: 1,
  },
};
