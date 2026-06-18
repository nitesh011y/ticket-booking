import { Link } from "react-router-dom";

const CATEGORY_ICONS = {
  music: "🎵",
  comedy: "😂",
  sports: "⚽",
  tech: "💻",
  theater: "🎭",
  other: "🎪",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function EventCard({ event }) {
  const {
    _id,
    name,
    date,
    venue,
    price,
    category,
    available,
    reserved,
    booked,
    totalSeats,
  } = event;
  const icon = CATEGORY_ICONS[category] || "🎪";
  const soldOut = available === 0;

  return (
    <Link
      to={`/events/${_id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article style={styles.card}>
        {/* Category badge + icon */}
        <div style={styles.topRow}>
          <span style={styles.categoryBadge}>
            {icon} {category}
          </span>
          {soldOut && <span className="badge badge-red">Sold out</span>}
        </div>

        {/* Event name */}
        <h2 style={styles.name}>{name}</h2>

        {/* Date + venue */}
        <div style={styles.meta}>
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>📅</span>
            <span>
              {formatDate(date)} · {formatTime(date)}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>📍</span>
            <span>{venue}</span>
          </div>
        </div>

        {/* Availability bar */}
        <div style={styles.availRow}>
          <div style={styles.availBar}>
            <div
              style={{
                ...styles.availFill,
                width: `${((booked / totalSeats) * 100).toFixed(0)}%`,
                background: soldOut ? "var(--error)" : "var(--accent)",
              }}
            />
          </div>
          <span style={styles.availLabel}>
            {soldOut
              ? "No seats available"
              : `${available} of ${totalSeats} seats available`}
          </span>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.price}>
            {price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}
          </span>
          <span
            style={{ ...styles.cta, ...(soldOut ? styles.ctaDisabled : {}) }}
          >
            {soldOut ? "Sold out" : "Select seats →"}
          </span>
        </div>
      </article>
    </Link>
  );
}

const styles = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    transition: "border-color 200ms, transform 200ms, box-shadow 200ms",
    cursor: "pointer",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--accent-text)",
    background: "var(--accent-glow)",
    padding: "3px 10px",
    borderRadius: 99,
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.3,
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  metaItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: "0.83rem",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  metaIcon: { flexShrink: 0, marginTop: 1 },
  availRow: { display: "flex", flexDirection: "column", gap: 5 },
  availBar: {
    height: 4,
    background: "var(--border)",
    borderRadius: 99,
    overflow: "hidden",
  },
  availFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  availLabel: { fontSize: "0.75rem", color: "var(--text-muted)" },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid var(--border)",
    paddingTop: 14,
    marginTop: 2,
  },
  price: {
    fontFamily: "var(--font-display)",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  cta: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--accent)",
    letterSpacing: "0.01em",
  },
  ctaDisabled: {
    color: "var(--text-muted)",
  },
};
