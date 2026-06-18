import { useState } from "react";
import { authAPI } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function AuthModal({ initialTab = "login", onClose }) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const { toast } = useToast();

  function switchTab(t) {
    setTab(t);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data =
        tab === "login"
          ? await authAPI.login(email, password)
          : await authAPI.register(name, email, password);

      login({ token: data.token, user: data.user });
      toast.success(
        "Welcome!",
        tab === "login"
          ? `Good to see you, ${data.user.name}!`
          : "Account created successfully.",
      );
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={{ fontSize: "1.4rem" }}>🎟</span>
            <span style={styles.logoText}>BookIt</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                ...styles.tab,
                ...(tab === t ? styles.tabActive : {}),
              }}
            >
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={tab === "login"}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder={
                tab === "register" ? "At least 6 characters" : "••••••••"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading
              ? "Please wait…"
              : tab === "login"
                ? "Sign in"
                : "Create account"}
          </button>

          <p style={styles.switchNote}>
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchTab(tab === "login" ? "register" : "login")}
              style={styles.switchLink}
            >
              {tab === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px 0",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
    margin: "18px 0 0",
    padding: "0 24px",
    gap: 0,
  },
  tab: {
    padding: "10px 18px",
    fontSize: "0.88rem",
    fontWeight: 500,
    color: "var(--text-muted)",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
    transition: "all 150ms",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
  },
  tabActive: {
    color: "var(--accent)",
    borderBottom: "2px solid var(--accent)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "24px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    background: "var(--error-bg)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: "var(--radius)",
    fontSize: "0.85rem",
    color: "var(--error)",
  },
  switchNote: {
    textAlign: "center",
    fontSize: "0.83rem",
    color: "var(--text-secondary)",
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "var(--accent-text)",
    fontSize: "0.83rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
};
