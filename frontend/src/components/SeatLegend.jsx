const LEGEND = [
  {
    state: "available",
    label: "Available",
    bg: "var(--seat-available-bg)",
    border: "var(--seat-available)",
  },
  {
    state: "selected",
    label: "Selected",
    bg: "var(--seat-selected-bg)",
    border: "var(--seat-selected)",
  },
  {
    state: "mine",
    label: "Your hold",
    bg: "var(--seat-mine-bg)",
    border: "var(--seat-mine)",
  },
  {
    state: "reserved",
    label: "Reserved",
    bg: "var(--seat-reserved-bg)",
    border: "var(--seat-reserved)",
  },
  {
    state: "booked",
    label: "Sold",
    bg: "var(--seat-booked)",
    border: "var(--seat-booked)",
  },
];

export default function SeatLegend() {
  return (
    <div style={styles.wrap}>
      {LEGEND.map(({ state, label, bg, border }) => (
        <div key={state} style={styles.item}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: bg,
              border: `1px solid ${border}`,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 20px",
    justifyContent: "center",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: "0.77rem",
    color: "var(--text-secondary)",
  },
};
