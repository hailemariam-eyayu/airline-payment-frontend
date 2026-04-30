import { useState } from 'react';
import { a2aService } from './services/api';

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value ?? '—'}</span>
    </div>
  );
}

function Steps({ current }) {
  const steps = ['Validate Accounts', 'Transfer Details', 'Result'];
  return (
    <div style={s.steps}>
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = num < current;
        const active = num === current;
        return (
          <div key={num} style={s.stepItem}>
            <div style={{
              ...s.stepCircle,
              background: done ? '#16a34a' : active ? '#0f766e' : '#e5e7eb',
              color:      done || active ? '#fff' : '#9ca3af',
            }}>
              {done ? '✓' : num}
            </div>
            <span style={{ ...s.stepLabel, color: active ? '#0f766e' : done ? '#16a34a' : '#9ca3af' }}>
              {label}
            </span>
            {i < steps.length - 1 && <div style={s.stepLine} />}
          </div>
        );
      })}
    </div>
  );
}

function AccountCard({ label, data }) {
  return (
    <div style={s.accountCard}>
      <div style={s.accountCardLabel}>{label}</div>
      <p style={s.accountName}>{data.name || '—'}</p>
      <p style={s.accountNo}>{data.acNo}</p>
      <span style={s.badge}>✓ Valid</span>
    </div>
  );
}

export default function A2ATransfer({ onBack }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  // step 1
  const [drAcNo, setDrAcNo] = useState('');
  const [crAcNo, setCrAcNo] = useState('');
  const [validateResult, setValidateResult] = useState(null);

  // step 2
  const [amount, setAmount]     = useState('');
  const [narrative, setNarrative] = useState('');

  // step 3
  const [transferResult, setTransferResult] = useState(null);

  // ── Step 1: validate accounts ─────────────────────────────────────────────
  const handleValidate = async (e) => {
    e.preventDefault();
    if (drAcNo.trim() === crAcNo.trim()) {
      setValidateResult({ status: 'Error', message: 'Debit and credit accounts must be different' });
      return;
    }
    setLoading(true);
    setValidateResult(null);
    try {
      const res = await a2aService.validateAccounts({ drAcNo: drAcNo.trim(), crAcNo: crAcNo.trim() });
      setValidateResult(res);
      if (res.status === 'Success') setStep(2);
    } catch (err) {
      setValidateResult({ status: 'Error', message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: transfer ──────────────────────────────────────────────────────
  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await a2aService.transfer({
        drAcNo:    drAcNo.trim(),
        crAcNo:    crAcNo.trim(),
        amount:    amount.trim(),
        narrative: narrative.trim() || undefined,
      });
      setTransferResult(res);
      setStep(3);
    } catch (err) {
      setTransferResult({ status: 'Error', message: err.message || 'Network error' });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setDrAcNo(''); setCrAcNo('');
    setValidateResult(null);
    setAmount(''); setNarrative('');
    setTransferResult(null);
  };

  const isSuccess = transferResult?.status === 'Success';

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.backLink} onClick={onBack}>← Back</button>
        <h1 style={s.title}>🔄 Account Transfer</h1>

        <Steps current={step} />

        {/* ── STEP 1: validate accounts ── */}
        {step === 1 && (
          <>
            <p style={s.hint}>Enter both account numbers to verify them before transferring.</p>
            <form onSubmit={handleValidate} style={s.form}>
              <label style={s.label}>Debit Account No. <span style={s.sub}>(from)</span></label>
              <input
                required style={s.input}
                placeholder="e.g. 0011230708313001"
                value={drAcNo}
                onChange={(e) => setDrAcNo(e.target.value)}
              />
              <label style={s.label}>Credit Account No. <span style={s.sub}>(to)</span></label>
              <input
                required style={s.input}
                placeholder="e.g. 0461112216017001"
                value={crAcNo}
                onChange={(e) => setCrAcNo(e.target.value)}
              />
              <button style={s.btnTeal} type="submit" disabled={loading}>
                {loading ? 'Validating…' : 'Validate Accounts'}
              </button>
            </form>

            {validateResult && validateResult.status !== 'Success' && (
              <div style={s.errorBox}>
                <p style={s.errorTitle}>❌ Validation Failed</p>
                <p style={s.errorMsg}>{validateResult.message}</p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: amount + narrative ── */}
        {step === 2 && validateResult?.status === 'Success' && (
          <>
            {/* account summary */}
            <div style={s.accountRow}>
              <AccountCard label="From" data={validateResult.dr} />
              <div style={s.arrow}>→</div>
              <AccountCard label="To"   data={validateResult.cr} />
            </div>

            <form onSubmit={handleTransfer} style={s.form}>
              <label style={s.label}>Amount (ETB)</label>
              <input
                required style={s.input}
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number" min="1" step="0.01"
              />
              <label style={s.label}>Narrative <span style={s.sub}>(optional)</span></label>
              <input
                style={s.input}
                placeholder="e.g. Loan repayment"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />
              <div style={s.btnRow}>
                <button type="button" style={s.btnGhost} onClick={() => setStep(1)}>
                  ← Change Accounts
                </button>
                <button style={s.btnTeal} type="submit" disabled={loading}>
                  {loading ? 'Transferring…' : 'Transfer'}
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
                <p style={s.successTitle}>Transfer Successful</p>
                <div style={s.infoCard}>
                  <InfoRow label="From"        value={`${transferResult.dr?.name} (${transferResult.dr?.acNo})`} />
                  <InfoRow label="To"          value={`${transferResult.cr?.name} (${transferResult.cr?.acNo})`} />
                  <InfoRow label="Amount"      value={`ETB ${Number(transferResult.amount).toLocaleString()}`} />
                  <InfoRow label="CBS Reference" value={transferResult.cbsRefNo} />
                </div>
              </>
            ) : (
              <>
                <div style={s.errorIcon}>❌</div>
                <p style={s.errorTitle2}>Transfer Failed</p>
                <div style={s.errorBox}>
                  <p style={s.errorMsg}>{transferResult?.message || 'Unknown error'}</p>
                  {transferResult?.errorCode && (
                    <p style={s.errorCode}>Error Code: {transferResult.errorCode}</p>
                  )}
                  {transferResult?.autoReversed && (
                    <p style={s.reversedNote}>⚠️ CBS transaction was auto-reversed</p>
                  )}
                </div>
              </>
            )}
            <button style={isSuccess ? s.btnPrimary : s.btnTeal} onClick={handleReset}>
              {isSuccess ? 'New Transfer' : 'Try Again'}
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
    background: '#f0fdfa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 28px',
    width: '100%', maxWidth: '480px',
  },
  backLink: {
    background: 'none', border: 'none', color: '#0f766e',
    fontSize: '14px', cursor: 'pointer', padding: '0 0 8px', display: 'block',
  },
  title: { margin: '0 0 20px', fontSize: '22px', fontWeight: 700, color: '#0f172a' },
  hint:  { margin: '0 0 20px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 },
  sub:   { fontWeight: 400, color: '#9ca3af', fontSize: '12px' },
  // steps
  steps: { display: 'flex', alignItems: 'center', marginBottom: '28px' },
  stepItem: { display: 'flex', alignItems: 'center', flex: 1 },
  stepCircle: {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, flexShrink: 0,
  },
  stepLabel: { fontSize: '11px', fontWeight: 500, marginLeft: '6px', whiteSpace: 'nowrap' },
  stepLine:  { flex: 1, height: '2px', background: '#e5e7eb', margin: '0 6px' },
  // form
  form:  { display: 'flex', flexDirection: 'column', gap: '14px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '-8px' },
  input: {
    padding: '11px 13px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
    fontSize: '14px', outline: 'none', color: '#0f172a', background: '#fafafa',
    width: '100%', boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: '10px', marginTop: '4px' },
  btnTeal: {
    flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
    background: '#0f766e', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    width: '100%',
  },
  btnPrimary: {
    padding: '12px', borderRadius: '8px', border: 'none',
    background: '#2563eb', color: '#fff', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', width: '100%',
  },
  btnGhost: {
    flex: 1, padding: '12px', borderRadius: '8px',
    border: '1.5px solid #e5e7eb', background: '#fff',
    color: '#374151', fontSize: '14px', cursor: 'pointer',
  },
  // account cards
  accountRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  accountCard: {
    flex: 1, background: '#f0fdfa', border: '1.5px solid #99f6e4',
    borderRadius: '10px', padding: '12px 14px',
  },
  accountCardLabel: { fontSize: '11px', fontWeight: 700, color: '#0f766e', marginBottom: '4px', textTransform: 'uppercase' },
  accountName: { margin: '0 0 2px', fontWeight: 700, fontSize: '13px', color: '#0f172a' },
  accountNo:   { margin: '0 0 6px', fontSize: '11px', color: '#6b7280', wordBreak: 'break-all' },
  badge: {
    background: '#dcfce7', color: '#16a34a',
    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
  },
  arrow: { fontSize: '20px', color: '#0f766e', flexShrink: 0 },
  // result
  resultBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
  successIcon: { fontSize: '48px' },
  errorIcon:   { fontSize: '48px' },
  successTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#16a34a' },
  errorTitle:   { margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#dc2626' },
  errorTitle2:  { margin: 0, fontSize: '20px', fontWeight: 700, color: '#dc2626' },
  infoCard: {
    width: '100%', background: '#f8fafc', borderRadius: '10px',
    border: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'left',
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px',
  },
  infoLabel: { color: '#6b7280', fontWeight: 500 },
  infoValue:  { color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
  errorBox: {
    width: '100%', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '8px', padding: '12px 16px', textAlign: 'left',
  },
  errorMsg:     { margin: 0, fontSize: '14px', color: '#dc2626' },
  errorCode:    { margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' },
  reversedNote: { margin: '6px 0 0', fontSize: '12px', color: '#d97706', fontWeight: 600 },
};
