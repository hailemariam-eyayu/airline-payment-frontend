import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RidePayment from './RidePayment.jsx'
import A2ATransfer from './A2ATransfer.jsx'
import enatLogo from './assets/Enat_Bank.png'
import etLogo from './assets/ethiopian-airlines.svg'

function Root() {
  // null = landing, 'airline' = App, 'ride' = RidePayment, 'a2a' = A2ATransfer
  const [view, setView] = useState(null);

  if (view === 'airline') return <App onBack={() => setView(null)} />;
  if (view === 'ride')    return <RidePayment onBack={() => setView(null)} />;
  if (view === 'a2a')     return <A2ATransfer onBack={() => setView(null)} />;

  // ── Landing page ──────────────────────────────────────────────────────────
  return (
    <div style={landing.page}>
      <div style={landing.card}>
        {/* Enat Bank logo */}
        <img src={enatLogo} alt="Enat Bank" style={landing.enatLogo} />
        <h1 style={landing.title}>Enat Bank Payments</h1>
        <p style={landing.subtitle}>Select a payment service to continue</p>

        {/* ── Airline section ── */}
        <p style={landing.sectionLabel}>
          <img src={etLogo} alt="" style={landing.sectionIcon} /> Airline Ticket
        </p>
        <div style={landing.btnGroup}>
          <button style={landing.btnPrimary} onClick={() => setView('airline')}>
            <img src={etLogo} alt="Ethiopian Airlines" style={landing.btnLogo} />
            <span>
              <strong>Airline Ticket Payment</strong>
              <small style={landing.btnHint}>Verify order and pay</small>
            </span>
          </button>
        </div>

        {/* ── Ride section ── */}
        <p style={{ ...landing.sectionLabel, marginTop: '24px' }}>🛵 Ride ET</p>
        <div style={landing.btnGroup}>
          <button style={landing.btnPrimary} onClick={() => setView('ride')}>
            <span style={landing.btnIcon}>🛵</span>
            <span>
              <strong>Ride Payment</strong>
              <small style={landing.btnHint}>Top-up a Ride ET account</small>
            </span>
          </button>
        </div>

        {/* ── A2A section ── */}
        <p style={{ ...landing.sectionLabel, marginTop: '24px' }}>🔄 Account Transfer</p>
        <div style={landing.btnGroup}>
          <button style={landing.btnPrimary} onClick={() => setView('a2a')}>
            <span style={landing.btnIcon}>🔄</span>
            <span>
              <strong>Account to Account</strong>
              <small style={landing.btnHint}>Transfer between accounts</small>
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
    maxWidth: '460px',
    textAlign: 'center',
  },
  enatLogo: {
    width: '100px',
    height: 'auto',
    marginBottom: '12px',
    display: 'block',
    margin: '0 auto 12px',
  },
  sectionIcon: {
    height: '14px',
    width: 'auto',
    verticalAlign: 'middle',
    marginRight: '4px',
    objectFit: 'contain',
  },
  btnLogo: {
    height: '28px',
    width: 'auto',
    flexShrink: 0,
    objectFit: 'contain',
    background: '#fff',
    borderRadius: '4px',
    padding: '2px 4px',
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
    background: '#1a56db',
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
