const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ── Helper ────────────────────────────────────────────────────────────────────

async function request(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res
    .json()
    .catch(() => ({ message: "Unexpected server response." }));

  if (!res.ok) {
    // Attach the full response body to the error so callers can
    // access fields like `unavailableSeats` from 409 responses.
    const err = new Error(
      data.message || `Request failed with status ${res.status}`,
    );
    Object.assign(err, data);
    throw err;
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ── Events ────────────────────────────────────────────────────────────────────

export const eventsAPI = {
  list: () => request("/events"),

  get: (id) => request(`/events/${id}`),
};

// ── Reserve ───────────────────────────────────────────────────────────────────

export const reserveAPI = {
  create: (token, eventId, seatNumbers) =>
    request(
      "/reserve",
      {
        method: "POST",
        body: JSON.stringify({ eventId, seatNumbers }),
      },
      token,
    ),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const bookingsAPI = {
  confirm: (token, reservationId) =>
    request(
      "/bookings",
      {
        method: "POST",
        body: JSON.stringify({ reservationId }),
      },
      token,
    ),

  list: (token) => request("/bookings", {}, token),
};
