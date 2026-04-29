import { useState } from 'react';
import { rideService } from './services/api';

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value ?? '—'}</span>
    </div>
  );
}

// ── Stepper — matches screenshot layout ──────────────────────────────────────
const STEPS = ['Verify Phone', 'Payment Details', 'Result'];

function Stepper({ current }) {
  return (
    <div style={s.stepper}>
      {STEPS.map((label, i) => {
        const num    = i + 1;
        const active = num === current;
        const done   = num < current;
        return (
          <div key={num} style={s.stepItem}>
            {/* connector line before (skip first) */}
            {i > 0 && (
              <div style={{
                ...s.line,
                background: done || active ? '#7c3aed' : '#d1d5db',
              }} />
            )}
            <div style={s.stepCol}>
              <div style={{
                ...s.circle,
                background: active ? '#7c3aed' : done ? '#7c3aed' : '#e5e7eb',
                color:      active || done ? '#fff' : '#9ca3af',
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

// ── extract a readable message from any response shape ───────────────────────
function extractMessage(res) {
  if (!res) return 'Unknown error';
  // top-level message field
  if (res.message && typeof res.message === 'string') return res.message;
  // nested data.message
  if (res.data?.message) return res.data.message;
  // nested error field
  if (res.error)  return res.error;
  if (res.errors) return Array.isArray(res.errors) ? res.errors.join(', ') : String(res.errors);
  return `HTTP ${res.httpStatus ?? 'Error'}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RidePayment({ onBack }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  // step 1 — phone split into prefix + local
  const [localPhone, setLocalPhone] = useState('');   // user types: 911259134
  const [queryResult, setQueryResult] = useState(null);
  const fullPhone = `251${localPhone}`;               // sent to API: 251911259134

  // step 2
  const [drAcNo, setDrAcNo] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');


  // step 3
  const [payResult, setPayResult] = useState(null);

  // ── Step 1: query phone ───────────────────────────────────────────────────
  const handleQuery = async (e) => {
    e.preventDefault();
    // Validate: local part must start with 9 or 7 and be exactly 9 digits
    if (!/^[79]\d{8}$/.test(localPhone)) {
      setQueryResult({ status: 'Error', message: 'Phone must start with 9 or 7 and be 9 digits (e.g. 911259134)', httpStatus: 0 });
      return;
    }
    setLoading(true);
    setQueryResult(null);
    try {
      const res = await rideService.queryAccount(fullPhone);
      setQueryResult(res);
      if (res.status === 'Success') setStep(2);
    } catch (err) {
      setQueryResult({ status: 'Error', message: err.message || 'Network error', httpStatus: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: pay ───────────────────────────────────────────────────────────
  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await rideService.pay({
        auditId:   queryResult?.auditId,
        phone:     fullPhone,
        amount:    amount.trim(),
        drAcNo:    drAcNo.trim(),
        remark:    remark.trim() || undefined,
      });
      setPayResult(res);
      setStep(3);
    } catch (err) {
      setPayResult({ status: 'Error', message: err.message || 'Network error' });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setLocalPhone(''); setQueryResult(null);
    setDrAcNo(''); setAmount(''); setRemark('');
    setPayResult(null);
  };

  const isSuccess = payResult?.status === 'Success';

  // ── error title based on HTTP status ─────────────────────────────────────
  const errorTitle = (httpStatus) => {
    if (httpStatus === 404) return '📵 Phone Not Found';
    if (httpStatus === 422) return '⚠️ Account Inactive';
    if (httpStatus === 401) return '🔒 Unauthorized';
    return '❌ Verification Failed';
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* header */}
        <button style={s.backLink} onClick={onBack}>← Back</button>
        <h1 style={s.title}>🛵 Ride Payment</h1>

        <Stepper current={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <p style={s.hint}>
              Enter the customer's Ride-registered phone number to verify their account.
            </p>
            <form onSubmit={handleQuery} style={s.form}>
              <label style={s.label}>Phone Number</label>
              <div style={s.phoneRow}>
                <span style={s.phonePrefix}>251</span>
                <input
                  required
                  style={s.phoneInput}
                  placeholder="911259134"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  type="tel"
                  maxLength={9}
                />
              </div>
              <button style={s.btnPurple} type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify Account'}
              </button>
            </form>

            {/* show error — success auto-advances */}
            {queryResult && queryResult.status !== 'Success' && (
              <div style={s.errorBox}>
                <p style={s.errorTitle}>{errorTitle(queryResult.httpStatus)}</p>
                <p style={s.errorMsg}>{extractMessage(queryResult)}</p>
                {queryResult.data?.request_id && (
                  <p style={s.errorCode}>Request ID: {queryResult.data.request_id}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            {/* verified account card */}
            {queryResult?.data && (
              <div style={s.accountCard}>
                <div style={s.accountIcon}>🛵</div>
                <div>
                  <p style={s.accountName}>{queryResult.data.full_name}</p>
                  <p style={s.accountPhone}>{queryResult.data.phone}</p>
                  <span style={s.badge}>✓ Active</span>
                </div>
              </div>
            )}

            <form onSubmit={handlePay} style={s.form}>
              <label style={s.label}>Amount (ETB)</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                step="0.01"
              />

              <label style={s.label}>Debit Account No.</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 0011230708313001"
                value={drAcNo}
                onChange={(e) => setDrAcNo(e.target.value)}
              />

              <label style={s.label}>
                Remark <span style={s.optional}>(optional)</span>
              </label>
              <input
                style={s.input}
                placeholder="e.g. Ride top-up"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div style={s.btnRow}>
                <button type="button" style={s.btnGhost} onClick={() => setStep(1)}>
                  ← Change Phone
                </button>
                <button style={s.btnPurple} type="submit" disabled={loading}>
                  {loading ? 'Processing…' : 'Pay Now'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div style={s.resultBox}>
            {isSuccess ? (
              <>
                <div style={s.iconSuccess}>✅</div>
                <p style={s.successTitle}>Payment Successful</p>
                <div style={s.infoCard}>
                  <InfoRow label="Phone"           value={phone} />
                  <InfoRow label="Amount"          value={`ETB ${Number(amount).toLocaleString()}`} />
                  <InfoRow label="Acknowledgement" value={payResult.acknowledgementId} />
                  <InfoRow label="CBS Reference"   value={payResult.cbsRefNo} />
                  <InfoRow label="Bill Ref"        value={payResult.billRefNo} />
                </div>
              </>
            ) : (
              <>
                <div style={s.iconError}>❌</div>
                <p style={s.failTitle}>Payment Failed</p>
                <div style={s.errorBox}>
                  <p style={s.errorMsg}>{extractMessage(payResult)}</p>
                  {payResult?.errorCode && (
                    <p style={s.errorCode}>Error Code: {payResult.errorCode}</p>
                  )}
                  {payResult?.httpStatus && (
                    <p style={s.errorCode}>HTTP Status: {payResult.httpStatus}</p>
                  )}
                </div>
              </>
            )}
            <div style={s.btnRow}>
              <button style={s.btnGhost} onClick={onBack}>← Home</button>
              <button style={isSuccess ? s.btnPrimary : s.btnPurple} onClick={handleReset}>
                {isSuccess ? 'New Payment' : 'Try Again'}
              </button>
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
    boxShadow: '0 4px 32px rgba(124,58,237,0.10)',
    padding: '32px 28px 36px',
    width: '100%',
    maxWidth: '480px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '0 0 4px',
    display: 'block',
  },
  title: {
    margin: '0 0 24px',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  },
  // ── stepper ──
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
    width: '52px',
    marginBottom: '22px',   // vertically aligns with circle center
    flexShrink: 0,
  },
  stepCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  circle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  // ── content ──
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
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '-4px',
  },
  optional: {
    fontWeight: 400,
    color: '#9ca3af',
    fontSize: '12px',
  },
  input: {
    padding: '11px 13px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    color: '#0f172a',
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  phoneRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#fafafa',
  },
  phonePrefix: {
    padding: '11px 13px',
    background: '#f3f4f6',
    color: '#374151',
    fontWeight: 700,
    fontSize: '14px',
    borderRight: '1.5px solid #e5e7eb',
    userSelect: 'none',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  phoneInput: {
    flex: 1,
    padding: '11px 13px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
    background: 'transparent',
    minWidth: 0,
  },
  btnPurple: {
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    background: '#7c3aed',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
    width: '100%',
  },
  btnPrimary: {
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
  },
  btnGhost: {
    padding: '13px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    cursor: 'pointer',
    flex: 1,
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  // ── account card ──
  accountCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#f5f3ff',
    border: '1.5px solid #ddd6fe',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '20px',
  },
  accountIcon: { fontSize: '32px', flexShrink: 0 },
  accountName: { margin: '0 0 2px', fontWeight: 700, fontSize: '15px', color: '#0f172a' },
  accountPhone: { margin: '0 0 6px', fontSize: '13px', color: '#6b7280' },
  badge: {
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '20px',
  },
  // ── result ──
  resultBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    textAlign: 'center',
  },
  iconSuccess: { fontSize: '52px' },
  iconError:   { fontSize: '52px' },
  successTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#16a34a' },
  failTitle:    { margin: 0, fontSize: '20px', fontWeight: 700, color: '#dc2626' },
  infoCard: {
    width: '100%',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '12px 16px',
    textAlign: 'left',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
  },
  infoLabel: { color: '#6b7280', fontWeight: 500 },
  infoValue:  { color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
  // ── error ──
  errorBox: {
    width: '100%',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '14px 16px',
    textAlign: 'left',
    marginTop: '16px',
    boxSizing: 'border-box',
  },
  errorTitle: { margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#dc2626' },
  errorMsg:   { margin: 0, fontSize: '14px', color: '#b91c1c', lineHeight: 1.5 },
  errorDetail: { margin: '4px 0 0', fontSize: '13px', color: '#b91c1c' },
  errorCode:  { margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' },
};
