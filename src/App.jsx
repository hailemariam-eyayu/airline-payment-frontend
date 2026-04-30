import { useState } from 'react';
import { airlineService } from './services/api';
import etLogo from './assets/ethiopian-airlines.svg';

// ── Stepper bar ──────────────────────────────────────────────────────────────
const STEPS = ['Verify Order ID', 'Order Details', 'Result'];

function Stepper({ current }) {
  return (
    <div style={s.stepper}>
      {STEPS.map((label, i) => {
        const num      = i + 1;
        const active   = num === current;
        const done     = num < current;
        return (
          <div key={num} style={s.stepItem}>
            {/* connector line before (skip first) */}
            {i > 0 && <div style={{ ...s.line, background: done || active ? '#1a56db' : '#e5e7eb' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                ...s.circle,
                background: active ? '#1a56db' : done ? '#16a34a' : '#e5e7eb',
                color:      active || done ? '#fff' : '#9ca3af',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                ...s.stepLabel,
                color:      active ? '#1a56db' : done ? '#16a34a' : '#9ca3af',
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
export default function App({ onBack }) {
  const [step, setStep]                     = useState(1);
  const [loading, setLoading]               = useState(false);
  const [orderId, setOrderId]               = useState('');
  const [validateResult, setValidateResult] = useState(null);
  const [acno, setAcno]                     = useState('');
  const [remark, setRemark]                 = useState('');
  const [confirmResult, setConfirmResult]   = useState(null);

  // Step 1 — validate
  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidateResult(null);
    try {
      const data = await airlineService.validateOrder(orderId.trim());
      setValidateResult(data);
      if (data.success === true) setStep(2);
    } catch (err) {
      setValidateResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — confirm
  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const raw    = validateResult?.rawResponse ?? {};
      const result = await airlineService.confirmPayment({
        orderid:         orderId.trim(),
        beneficiaryAcno: acno.trim(),
        amount:          String(raw.amount ?? ''),
        remark:          remark.trim(),
      });
      setConfirmResult(result);
      setStep(3);
    } catch (err) {
      setConfirmResult({ status: 'Error', message: err.message || 'Network error' });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1); setOrderId(''); setValidateResult(null);
    setAcno(''); setRemark(''); setConfirmResult(null);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* back + title */}
        <button style={s.backLink} onClick={onBack}>← Back</button>
        <h1 style={s.title}>
          <img src={etLogo} alt="Ethiopian Airlines" style={s.etLogo} />
          Airline Payment
        </h1>

        {/* stepper */}
        <Stepper current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <p style={s.hint}>
              Enter the Order ID to verify the booking details before payment.
            </p>
            <form onSubmit={handleValidate} style={s.form}>
              <label style={s.label}>Order ID</label>
              <input
                required
                style={s.input}
                placeholder="e.g. ABCDFE"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button style={s.btnPrimary} type="submit" disabled={loading}>
                {loading ? 'Validating…' : 'Verify Order'}
              </button>
            </form>

            {validateResult && !validateResult.success && (
              <div style={s.errorBox}>
                <p style={s.errorTitle}>Validation Failed</p>
                <p><strong>Message:</strong> {validateResult.message}</p>
                {validateResult.rawResponse?.message && (
                  <p><strong>Detail:</strong> {validateResult.rawResponse.message}</p>
                )}
                {validateResult.rawResponse?.statusCodeResponseDescription && (
                  <p><strong>Status:</strong> {validateResult.rawResponse.statusCodeResponseDescription}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <p style={s.hint}>Review the order details and enter payment information.</p>

            {/* order details card */}
            <div style={s.detailCard}>
              <InfoRow label="Customer Name" value={validateResult?.rawResponse?.customerName} />
              <InfoRow label="Order ID"      value={validateResult?.rawResponse?.orderId} />
              <InfoRow label="Expire Date"   value={validateResult?.rawResponse?.expireDate} />
              <InfoRow label="Trace Number"  value={validateResult?.rawResponse?.traceNumber} />
              <InfoRow
                label="Amount"
                value={
                  validateResult?.rawResponse?.amount != null
                    ? `${validateResult.rawResponse.amount} ETB`
                    : null
                }
              />
            </div>

            <form onSubmit={handleConfirm} style={s.form}>
              <label style={s.label}>Debit Account No.</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 0011230708313001"
                value={acno}
                onChange={(e) => setAcno(e.target.value)}
              />

              <label style={s.label}>Remark</label>
              <textarea
                required
                style={{ ...s.input, resize: 'vertical', minHeight: '72px' }}
                placeholder="e.g. Airline Test Pay"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div style={s.btnRow}>
                <button type="button" style={s.btnSecondary} onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button style={s.btnPrimary} type="submit" disabled={loading}>
                  {loading ? 'Processing…' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && confirmResult && (
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
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 28px',
    width: '100%',
    maxWidth: '460px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#1a56db',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  etLogo: {
    height: '32px',
    width: 'auto',
    objectFit: 'contain',
  },
  // stepper
  stepper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: '28px',
    position: 'relative',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
  },
  line: {
    height: '2px',
    width: '60px',
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
  // content
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
    padding: '11px 13px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#111827',
    background: '#fafafa',
  },
  btnPrimary: {
    padding: '13px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#1a56db',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
  },
  btnSecondary: {
    padding: '13px 20px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
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
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  infoLabel: { color: '#6b7280', fontWeight: 500 },
  infoValue: { color: '#111827', fontWeight: 600 },
  errorBox: {
    marginTop: '16px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#991b1b',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  errorTitle: { fontWeight: 700, fontSize: '15px', margin: '0 0 8px' },
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
