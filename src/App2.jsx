import { useState } from 'react';
import { airlineService } from './services/api';

// ── Stepper bar ──────────────────────────────────────────────────────────────
const STEPS = ['Payment Details', 'Result'];

function Stepper({ current }) {
  return (
    <div style={s.stepper}>
      {STEPS.map((label, i) => {
        const num    = i + 1;
        const active = num === current;
        const done   = num < current;
        return (
          <div key={num} style={s.stepItem}>
            {i > 0 && (
              <div style={{ ...s.line, background: done || active ? '#7c3aed' : '#d1d5db' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                ...s.circle,
                background: active || done ? '#7c3aed' : '#e5e7eb',
                color:      active || done ? '#fff'    : '#9ca3af',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                ...s.stepLabel,
                color:      active ? '#7c3aed' : done ? '#7c3aed' : '#9ca3af',
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value ?? '—'}</span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App2({ onBack }) {
  const [step, setStep]                   = useState(1);
  const [loading, setLoading]             = useState(false);
  const [orderId, setOrderId]             = useState('');
  const [acno, setAcno]                   = useState('');
  const [amount, setAmount]               = useState('');
  const [remark, setRemark]               = useState('');
  const [confirmResult, setConfirmResult] = useState(null);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await airlineService.confirmPayment({
        orderid:         orderId.trim(),
        beneficiaryAcno: acno.trim(),
        amount:          amount.trim(),
        remark:          remark.trim(),
      });
      setConfirmResult(result);
      setStep(2);
    } catch (err) {
      setConfirmResult({ status: 'Error', message: err.message || 'Network error' });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1); setOrderId(''); setAcno('');
    setAmount(''); setRemark(''); setConfirmResult(null);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* back + title */}
        <button style={s.backLink} onClick={onBack}>← Back</button>
        <h1 style={s.title}>✈ Airline Payment</h1>

        {/* stepper */}
        <Stepper current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <p style={s.hint}>
              Enter the payment details to confirm the airline booking directly.
            </p>
            <form onSubmit={handleConfirm} style={s.form}>
              <label style={s.label}>Order ID</label>
              <input
                required
                style={s.input}
                placeholder="e.g. ABCDFE"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />

              <label style={s.label}>Debit Account No.</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 0011230708313001"
                value={acno}
                onChange={(e) => setAcno(e.target.value)}
              />

              <label style={s.label}>Amount (ETB)</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <label style={s.label}>Remark</label>
              <textarea
                required
                style={{ ...s.input, resize: 'vertical', minHeight: '72px' }}
                placeholder="e.g. Airline Test Pay"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <button style={s.btnPrimary} type="submit" disabled={loading}>
                {loading ? 'Processing…' : 'Confirm Payment'}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && confirmResult && (
          <div style={s.resultBox}>
            {confirmResult.status === 'Success' ? (
              <>
                <div style={s.iconSuccess}>✓</div>
                <h2 style={{ color: '#16a34a', margin: '0 0 8px' }}>Payment Successful</h2>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>{confirmResult.message}</p>
                {confirmResult.rawData && (
                  <div style={s.detailCard}>
                    <InfoRow label="Trace Number"    value={confirmResult.rawData.traceNumber} />
                    <InfoRow label="Transaction No." value={confirmResult.rawData.enatTransactionNo} />
                    <InfoRow
                      label="Amount"
                      value={confirmResult.rawData.amount != null ? `${confirmResult.rawData.amount} ETB` : null}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={s.iconError}>✗</div>
                <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>Payment Failed</h2>
                <p><strong>Status:</strong> {confirmResult.status}</p>
                <p><strong>Message:</strong> {confirmResult.message}</p>
                {confirmResult.rawData?.message && (
                  <p><strong>Detail:</strong> {confirmResult.rawData.message}</p>
                )}
                {confirmResult.rawData?.statusCodeResponseDescription && (
                  <p><strong>Status Description:</strong> {confirmResult.rawData.statusCodeResponseDescription}</p>
                )}
              </>
            )}
            <div style={{ ...s.btnRow, marginTop: 24 }}>
              <button style={s.btnSecondary} onClick={onBack}>← Home</button>
              <button style={s.btnPrimary} onClick={handleReset}>New Payment</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: '#f5f3ff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 32px rgba(124,58,237,0.08)',
    padding: '32px 32px 36px',
    width: '100%',
    maxWidth: '520px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '4px',
    display: 'block',
    fontWeight: 500,
  },
  title: {
    margin: '0 0 24px',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  },
  stepper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
  },
  line: {
    height: '2px',
    width: '80px',
    marginBottom: '22px',
  },
  circle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  hint: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 20px',
    lineHeight: 1.6,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#111827',
    background: '#f9fafb',
  },
  btnPrimary: {
    padding: '13px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
  },
  btnSecondary: {
    padding: '13px 20px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    flex: 1,
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
  },
  detailCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  infoLabel: { color: '#6b7280', fontWeight: 500 },
  infoValue: { color: '#111827', fontWeight: 600 },
  resultBox: { textAlign: 'center', padding: '8px 0' },
  iconSuccess: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: '#dcfce7', color: '#16a34a', fontSize: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px',
  },
  iconError: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: '#fee2e2', color: '#dc2626', fontSize: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px',
  },
};
