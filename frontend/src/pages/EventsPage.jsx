import { useState, useEffect } from 'react';
import { eventsAPI } from '../api/index.js';
import EventCard from '../components/EventCard.jsx';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    eventsAPI.list()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(events.map((e) => e.category))];

  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div className="page">
      <div className="container">
        {/* Hero header */}
        <div style={styles.hero}>
          <p className="section-label">Upcoming Events</p>
          <h1 className="page-title">Find your next<br />unforgettable night.</h1>
          <p className="page-subtitle" style={{ marginTop: 10 }}>
            Book seats for live events in Mumbai — music, comedy, tech and more.
          </p>
        </div>

        {/* Category filter pills */}
        {!loading && !error && events.length > 0 && (
          <div style={styles.pills}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  ...styles.pill,
                  ...(filter === cat ? styles.pillActive : {}),
                }}
              >
                {cat === 'all' ? 'All events' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="state-box">
            <div className="state-icon">😕</div>
            <h3>Could not load events</h3>
            <p>{error}</p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && filtered.length === 0 && (
          <div className="state-box">
            <div className="state-icon">🎪</div>
            <h3>No events found</h3>
            <p>Check back soon — more events are on the way.</p>
          </div>
        )}

        {/* Event grid */}
        {!loading && !error && filtered.length > 0 && (
          <div style={styles.grid}>
            {filtered.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  hero: {
    padding: '8px 0 36px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 28,
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  pill: {
    padding: '6px 16px',
    borderRadius: 99,
    fontSize: '0.82rem',
    fontWeight: 500,
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    background: 'transparent',
    cursor: 'pointer',
    textTransform: 'capitalize',
    transition: 'all 150ms',
    fontFamily: 'var(--font-display)',
  },
  pillActive: {
    background: 'var(--accent-glow)',
    borderColor: 'var(--accent)',
    color: 'var(--accent-text)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
};
