import { useState } from 'react';
import { airlineService } from './services/api';

// ── small reusable card ──────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value ?? '—'}</span>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function App() {
  // step 1 = validate, step 2 = confirm, step 3 = result
  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);

  // step-1 inputs
  const [orderId, setOrderId]         = useState('');

  // step-1 response
  const [validateResult, setValidateResult] = useState(null);

  // step-2 inputs
  const [acno, setAcno]               = useState('');
  const [remark, setRemark]           = useState('');

  // step-3 result
  const [confirmResult, setConfirmResult] = useState(null);

  // ── Step 1: validate ───────────────────────────────────────────────────────
  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidateResult(null);
    try {
      const data = await airlineService.validateOrder(orderId.trim());
      setValidateResult(data);
      // only advance to step 2 when success === true
      if (data.success === true) {
        setStep(2);
      }
    } catch (err) {
      setValidateResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: confirm ────────────────────────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const raw = validateResult?.rawResponse ?? {};
      const result = await airlineService.confirmPayment({
        orderid:        orderId.trim(),
        beneficiaryAcno: acno.trim(),
        amount:         String(raw.amount ?? ''),
        remark:         remark.trim(),
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

  // ── reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setOrderId('');
    setValidateResult(null);
    setAcno('');
    setRemark('');
    setConfirmResult(null);
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>✈ Airline Payment</h1>

        {/* ── STEP 1: enter order ID ── */}
        {step === 1 && (
          <>
            <form onSubmit={handleValidate} style={styles.form}>
              <label style={styles.label}>Order ID</label>
              <input
                required
                style={styles.input}
                placeholder="e.g. ABCDFE"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button style={styles.btnPrimary} type="submit" disabled={loading}>
                {loading ? 'Validating…' : 'Validate Order'}
              </button>
            </form>

            {/* show validation response (failure only — success auto-advances) */}
            {validateResult && validateResult.success === false && (
              <div style={styles.errorBox}>
                <p style={styles.errorTitle}>Validation Failed</p>
                <p><strong>Message:</strong> {validateResult.message}</p>
                {validateResult.rawResponse?.message && (
                  <p><strong>Error Detail:</strong> {validateResult.rawResponse.message}</p>
                )}
                {validateResult.rawResponse?.statusCodeResponseDescription && (
                  <p>
                    <strong>Status:</strong>{' '}
                    {validateResult.rawResponse.statusCodeResponseDescription}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: show details + confirm form ── */}
        {step === 2 && validateResult?.rawResponse && (
          <>
            <div style={styles.successBox}>
              <p style={styles.successTitle}>Order Validated ✓</p>
              <InfoRow label="Customer Name" value={validateResult.rawResponse.customerName} />
              <InfoRow label="Order ID"      value={validateResult.rawResponse.orderId} />
              <InfoRow label="Expire Date"   value={validateResult.rawResponse.expireDate} />
              <InfoRow label="Trace Number"  value={validateResult.rawResponse.traceNumber} />
              <InfoRow
                label="Amount"
                value={
                  validateResult.rawResponse.amount != null
                    ? `${validateResult.rawResponse.amount} ETB`
                    : null
                }
              />
            </div>

            <form onSubmit={handleConfirm} style={styles.form}>
              <label style={styles.label}>Debit Account No.</label>
              <input
                required
                style={styles.input}
                placeholder="e.g. 0011230708313001"
                value={acno}
                onChange={(e) => setAcno(e.target.value)}
              />

              <label style={styles.label}>Remark</label>
              <textarea
                required
                style={{ ...styles.input, resize: 'vertical', minHeight: '72px' }}
                placeholder="e.g. Airline Test Pay"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div style={styles.btnRow}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={handleReset}
                >
                  ← Back
                </button>
                <button style={styles.btnPrimary} type="submit" disabled={loading}>
                  {loading ? 'Processing…' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: confirm result ── */}
        {step === 3 && confirmResult && (
          <div style={styles.resultBox}>
            {confirmResult.status === 'Success' ? (
              <>
                <div style={styles.resultIconSuccess}>✓</div>
                <h2 style={{ color: '#16a34a' }}>Payment Successful</h2>
                <p>{confirmResult.message}</p>
                {confirmResult.rawData && (
                  <div style={styles.successBox}>
                    <InfoRow label="Trace Number"    value={confirmResult.rawData.traceNumber} />
                    <InfoRow label="Transaction No." value={confirmResult.rawData.enatTransactionNo} />
                    <InfoRow label="Amount"
                      value={
                        confirmResult.rawData.amount != null
                          ? `${confirmResult.rawData.amount} ETB`
                          : null
                      }
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={styles.resultIconError}>✗</div>
                <h2 style={{ color: '#dc2626' }}>Payment Failed</h2>
                <p><strong>Status:</strong> {confirmResult.status}</p>
                <p><strong>Message:</strong> {confirmResult.message}</p>
                {confirmResult.rawData?.message && (
                  <p><strong>Detail:</strong> {confirmResult.rawData.message}</p>
                )}
                {confirmResult.rawData?.statusCodeResponseDescription && (
                  <p>
                    <strong>Status Description:</strong>{' '}
                    {confirmResult.rawData.statusCodeResponseDescription}
                  </p>
                )}
              </>
            )}
            <button style={{ ...styles.btnPrimary, marginTop: '20px' }} onClick={handleReset}>
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    margin: '0 0 24px',
    fontSize: '24px',
    fontWeight: 600,
    color: '#0f172a',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '2px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#111827',
  },
  btnPrimary: {
    padding: '11px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
  btnSecondary: {
    padding: '11px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  errorBox: {
    marginTop: '16px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '14px 16px',
    color: '#991b1b',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  errorTitle: {
    fontWeight: 700,
    fontSize: '15px',
    marginBottom: '6px',
    margin: '0 0 8px',
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  successTitle: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#15803d',
    margin: '0 0 10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #dcfce7',
  },
  infoLabel: {
    color: '#374151',
    fontWeight: 500,
  },
  infoValue: {
    color: '#111827',
    fontWeight: 600,
  },
  resultBox: {
    textAlign: 'center',
    padding: '8px 0',
  },
  resultIconSuccess: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  resultIconError: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
};
