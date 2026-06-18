import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthModal from './AuthModal.jsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  function handleLogout() {
    logout();
    toast.info('Signed out', 'See you next time!');
    navigate('/');
  }

  return (
    <>
      <header style={styles.header}>
        <div className="container" style={styles.inner}>
          {/* Logo */}
          <Link to="/" style={styles.logo}>
            <span style={styles.logoIcon}>🎟</span>
            <span style={styles.logoText}>BookIt</span>
          </Link>

          {/* Actions */}
          <div style={styles.actions}>
            {isAuthenticated ? (
              <>
                <span style={styles.greeting}>
                  <span style={styles.dot} />
                  {user?.name}
                </span>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setShowAuth('login')}>
                  Sign in
                </button>
                <button className="btn btn-primary" onClick={() => setShowAuth('register')}>
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          initialTab={showAuth}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(13, 17, 23, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  },
  logoIcon: { fontSize: '1.35rem' },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginRight: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--success)',
    boxShadow: '0 0 0 3px rgba(74, 222, 128, 0.2)',
  },
};
