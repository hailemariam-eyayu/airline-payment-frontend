import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import App2 from './App2.jsx'
import RidePayment from './RidePayment.jsx'

function Root() {
  // null = landing, 'validate' = App, 'direct' = App2, 'ride' = RidePayment
  const [view, setView] = useState(null);

  if (view === 'validate') return <App onBack={() => setView(null)} />;
  if (view === 'direct')   return <App2 onBack={() => setView(null)} />;
  if (view === 'ride')     return <RidePayment onBack={() => setView(null)} />;

  // ── Landing page ──────────────────────────────────────────────────────────
  return (
    <div style={landing.page}>
      <div style={landing.card}>
        <div style={landing.icon}>🏦</div>
        <h1 style={landing.title}>Enat Bank Payments</h1>
        <p style={landing.subtitle}>Select a payment service to continue</p>

        {/* ── Airline section ── */}
        <p style={landing.sectionLabel}>✈ Airline Ticket</p>
        <div style={landing.btnGroup}>
          <button style={landing.btnPrimary} onClick={() => setView('validate')}>
            <span style={landing.btnIcon}>✔</span>
            <span>
              <strong>Pay with Validate</strong>
              <small style={landing.btnHint}>Verify order details before paying</small>
            </span>
          </button>

          <button style={landing.btnOutline} onClick={() => setView('direct')}>
            <span style={landing.btnIcon}>⚡</span>
            <span>
              <strong>Pay without Validate</strong>
              <small style={landing.btnHint}>Skip validation, confirm directly</small>
            </span>
          </button>
        </div>

        {/* ── Ride section ── */}
        <p style={{ ...landing.sectionLabel, marginTop: '24px' }}>🛵 Ride ET</p>
        <div style={landing.btnGroup}>
          <button style={landing.btnRide} onClick={() => setView('ride')}>
            <span style={landing.btnIcon}>🛵</span>
            <span>
              <strong>Ride Payment</strong>
              <small style={landing.btnHint}>Top-up a Ride ET account</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const landing = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '26px',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    margin: '0 0 28px',
    fontSize: '14px',
    color: '#6b7280',
  },
  sectionLabel: {
    margin: '0 0 10px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9ca3af',
    textAlign: 'left',
  },
  btnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  btnOutline: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '10px',
    border: '2px solid #2563eb',
    background: '#fff',
    color: '#2563eb',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  btnRide: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#7c3aed',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  btnIcon: {
    fontSize: '22px',
    flexShrink: 0,
  },
  btnHint: {
    display: 'block',
    fontSize: '12px',
    opacity: 0.75,
    marginTop: '2px',
    fontWeight: 400,
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
