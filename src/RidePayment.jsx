import { useState } from 'react';
import { rideService } from './services/api';

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value ?? '—'}</span>
    </div>
  );
}

// ── step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Verify Phone', 'Payment Details', 'Result'];
  return (
    <div style={s.steps}>
      {steps.map((label, i) => {
        const num   = i + 1;
        const done  = num < current;
        const active = num === current;
        return (
          <div key={num} style={s.stepItem}>
            <div style={{
              ...s.stepCircle,
              background: done ? '#16a34a' : active ? '#7c3aed' : '#e5e7eb',
              color:      done || active ? '#fff' : '#9ca3af',
            }}>
              {done ? '✓' : num}
            </div>
            <span style={{ ...s.stepLabel, color: active ? '#7c3aed' : done ? '#16a34a' : '#9ca3af' }}>
              {label}
            </span>
            {i < steps.length - 1 && <div style={s.stepLine} />}
          </div>
        );
      })}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function RidePayment({ onBack }) {
  // step 1 = phone query, step 2 = payment form, step 3 = result
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  // step 1
  const [phone, setPhone]           = useState('');
  const [queryResult, setQueryResult] = useState(null); // { full_name, phone, status }

  // step 2
  const [drAcNo, setDrAcNo]     = useState('');
  const [drBranch, setDrBranch] = useState('');
  const [amount, setAmount]     = useState('');
  const [remark, setRemark]     = useState('');

  // step 3
  const [payResult, setPayResult] = useState(null);

  // ── Step 1: query phone ───────────────────────────────────────────────────
  const handleQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setQueryResult(null);
    try {
      const res = await rideService.queryAccount(phone.trim());
      setQueryResult(res);
      if (res.status === 'Success') setStep(2);
    } catch (err) {
      setQueryResult({ status: 'Error', message: err.message || 'Network error' });
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
        phone:    phone.trim(),
        amount:   amount.trim(),
        drAcNo:   drAcNo.trim(),
        drBranch: drBranch.trim() || undefined,
        remark:   remark.trim()   || undefined,
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
    setPhone('');
    setQueryResult(null);
    setDrAcNo('');
    setDrBranch('');
    setAmount('');
    setRemark('');
    setPayResult(null);
  };

  const isSuccess = payResult?.status === 'Success';

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* header */}
        <div style={s.header}>
          <button style={s.backLink} onClick={onBack}>← Back</button>
          <h1 style={s.title}>🛵 Ride Payment</h1>
        </div>

        <Steps current={step} />

        {/* ── STEP 1: enter phone ── */}
        {step === 1 && (
          <>
            <p style={s.hint}>Enter the customer's Ride-registered phone number to verify their account.</p>
            <form onSubmit={handleQuery} style={s.form}>
              <label style={s.label}>Phone Number</label>
              <input
                required
                style={s.input}
                placeholder="e.g. 251911259134"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />
              <button style={s.btnPrimary} type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify Account'}
              </button>
            </form>

            {/* error only — success auto-advances */}
            {queryResult && queryResult.status !== 'Success' && (
              <div style={s.errorBox}>
                <p style={s.errorTitle}>
                  {queryResult.httpStatus === 422 ? '⚠️ Account Inactive' :
                   queryResult.httpStatus === 404 ? '📵 Phone Not Found' :
                   queryResult.httpStatus === 401 ? '🔒 Auth Error' :
                   '❌ Verification Failed'}
                </p>
                {/* show the actual server message — never hide it behind a hardcoded label */}
                <p style={s.errorMsg}>{queryResult.message}</p>
                {/* if Ride returned its own message field inside the response body, show it too */}
                {queryResult.data?.message && queryResult.data.message !== queryResult.message && (
                  <p style={s.errorDetail}>Ride: {queryResult.data.message}</p>
                )}
                {/* raw Ride request_id for debugging */}
                {queryResult.data?.request_id && (
                  <p style={s.errorCode}>Request ID: {queryResult.data.request_id}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: payment form ── */}
        {step === 2 && queryResult?.data && (
          <>
            {/* verified account card */}
            <div style={s.accountCard}>
              <div style={s.accountIcon}>🛵</div>
              <div>
                <p style={s.accountName}>{queryResult.data.full_name}</p>
                <p style={s.accountPhone}>{queryResult.data.phone}</p>
                <span style={s.badge}>✓ Active</span>
              </div>
            </div>

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

              <label style={s.label}>Branch Code <span style={s.optional}>(optional)</span></label>
              <input
                style={s.input}
                placeholder="e.g. 001"
                value={drBranch}
                onChange={(e) => setDrBranch(e.target.value)}
              />

              <label style={s.label}>Remark <span style={s.optional}>(optional)</span></label>
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

        {/* ── STEP 3: result ── */}
        {step === 3 && (
          <div style={s.resultBox}>
            {isSuccess ? (
              <>
                <div style={s.successIcon}>✅</div>
                <p style={s.successTitle}>Payment Successful</p>
                <div style={s.infoCard}>
                  <InfoRow label="Phone"            value={phone} />
                  <InfoRow label="Amount"           value={`ETB ${Number(amount).toLocaleString()}`} />
                  <InfoRow label="Acknowledgement"  value={payResult.acknowledgementId} />
                  <InfoRow label="CBS Reference"    value={payResult.cbsRefNo} />
                  <InfoRow label="Trace Number"     value={payResult.traceNumber} />
                  <InfoRow label="Bill Ref"         value={payResult.billRefNo} />
                </div>
              </>
            ) : (
              <>
                <div style={s.errorIcon}>❌</div>
                <p style={s.errorTitle}>Payment Failed</p>
                <div style={s.errorBox}>
                  <p style={s.errorMsg}>{payResult?.message || 'Unknown error'}</p>
                  {payResult?.errorCode && (
                    <p style={s.errorCode}>Error Code: {payResult.errorCode}</p>
                  )}
                </div>
              </>
            )}
            <button style={isSuccess ? s.btnPrimary : s.btnPurple} onClick={handleReset}>
              {isSuccess ? 'New Payment' : 'Try Again'}
            </button>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
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
  header: {
    marginBottom: '20px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 0 8px',
    display: 'block',
  },
  title: {
    margin: '0',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
  },
  hint: {
    margin: '0 0 20px',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  // steps
  steps: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '28px',
    gap: '0',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
    zIndex: 1,
  },
  stepLabel: {
    fontSize: '11px',
    fontWeight: 500,
    marginLeft: '6px',
    whiteSpace: 'nowrap',
  },
  stepLine: {
    flex: 1,
    height: '2px',
    background: '#e5e7eb',
    margin: '0 6px',
  },
  // form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '-8px',
  },
  optional: {
    fontWeight: 400,
    color: '#9ca3af',
    fontSize: '12px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    color: '#0f172a',
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  btnPrimary: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: '4px',
  },
  btnPurple: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#7c3aed',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    cursor: 'pointer',
  },
  // account card
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
  accountIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  accountName: {
    margin: '0 0 2px',
    fontWeight: 700,
    fontSize: '15px',
    color: '#0f172a',
  },
  accountPhone: {
    margin: '0 0 6px',
    fontSize: '13px',
    color: '#6b7280',
  },
  badge: {
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '20px',
  },
  // result
  resultBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  successIcon: { fontSize: '48px' },
  errorIcon:   { fontSize: '48px' },
  successTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#16a34a',
  },
  errorTitle: {
    margin: '0 0 6px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#dc2626',
  },
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
  errorBox: {
    width: '100%',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    textAlign: 'left',
  },
  errorMsg:  { margin: 0, fontSize: '14px', color: '#dc2626' },
  errorDetail: { margin: '4px 0 0', fontSize: '13px', color: '#b91c1c' },
  errorCode: { margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' },
};
