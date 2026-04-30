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
    <div style={s.stepper}>
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = num < current;
        const active = num === current;
        return (
          <div key={num} style={s.stepItem}>
            {i > 0 && <div style={{ ...s.line, background: done || active ? '#1a56db' : '#e5e7eb' }} />}
            <div style={s.stepCol}>
              <div style={{
                ...s.circle,
                background: active ? '#1a56db' : done ? '#16a34a' : '#e5e7eb',
                color:      active || done ? '#fff' : '#9ca3af',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{ ...s.stepLabel, color: active ? '#1a56db' : done ? '#16a34a' : '#9ca3af', fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </div>
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

  const [drAcNo, setDrAcNo] = useState('');
  const [crAcNo, setCrAcNo] = useState('');
  const [validateResult, setValidateResult] = useState(null);

  const [amount, setAmount]       = useState('');
  const [narrative, setNarrative] = useState('');

  const [transferResult, setTransferResult] = useState(null);

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

        {step === 1 && (
          <>
            <p style={s.hint}>Enter both account numbers to verify them before transferring.</p>
            <form onSubmit={handleValidate} style={s.form}>
              <label style={s.label}>Debit Account No. <span style={s.sub}>(from)</span></label>
              <input required style={s.input} placeholder="e.g. 0011230708313001"
                value={drAcNo} onChange={(e) => setDrAcNo(e.target.value)} />
              <label style={s.label}>Credit Account No. <span style={s.sub}>(to)</span></label>
              <input required style={s.input} placeholder="e.g. 0461112216017001"
                value={crAcNo} onChange={(e) => setCrAcNo(e.target.value)} />
              <button style={s.btnPrimary} type="submit" disabled={loading}>
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

        {step === 2 && validateResult?.status === 'Success' && (
          <>
            <div style={s.accountRow}>
              <AccountCard label="From" data={validateResult.dr} />
              <div style={s.arrow}>→</div>
              <AccountCard label="To"   data={validateResult.cr} />
            </div>
            <form onSubmit={handleTransfer} style={s.form}>
              <label style={s.label}>Amount (ETB)</label>
              <input required style={s.input} placeholder="e.g. 500"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                type="number" min="1" step="0.01" />
              <label style={s.label}>Narrative <span style={s.sub}>(optional)</span></label>
              <input style={s.input} placeholder="e.g. Loan repayment"
                value={narrative} onChange={(e) => setNarrative(e.target.value)} />
              <div style={s.btnRow}>
                <button type="button" style={s.btnGhost} onClick={() => setStep(1)}>← Change Accounts</button>
                <button style={s.btnPrimary} type="submit" disabled={loading}>
                  {loading ? 'Transferring…' : 'Transfer'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <div style={s.resultBox}>
            {isSuccess ? (
              <>
                <div style={s.iconSuccess}>✓</div>
                <h2 style={{ color: '#16a34a', margin: '0 0 8px' }}>Transfer Successful</h2>
                <div style={s.infoCard}>
                  <InfoRow label="From"          value={`${transferResult.dr?.name} (${transferResult.dr?.acNo})`} />
                  <InfoRow label="To"            value={`${transferResult.cr?.name} (${transferResult.cr?.acNo})`} />
                  <InfoRow label="Amount"        value={`ETB ${Number(transferResult.amount).toLocaleString()}`} />
                  <InfoRow label="CBS Reference" value={transferResult.cbsRefNo} />
                </div>
              </>
            ) : (
              <>
                <div style={s.iconError}>✗</div>
                <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>Transfer Failed</h2>
                <div style={s.errorBox}>
                  <p style={s.errorMsg}>{transferResult?.message || 'Unknown error'}</p>
                  {transferResult?.errorCode && <p style={s.errorCode}>Error Code: {transferResult.errorCode}</p>}
                  {transferResult?.autoReversed && <p style={s.reversedNote}>⚠️ CBS transaction was auto-reversed</p>}
                </div>
              </>
            )}
            <div style={s.btnRow}>
              <button style={s.btnGhost} onClick={onBack}>← Home</button>
              <button style={isSuccess ? s.btnPrimary : s.btnDanger} onClick={handleReset}>
                {isSuccess ? 'New Transfer' : 'Try Again'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '32px 28px', width: '100%', maxWidth: '460px' },
  backLink: { background: 'none', border: 'none', color: '#1a56db', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '0 0 4px', display: 'block' },
  title: { margin: '0 0 24px', fontSize: '22px', fontWeight: 700, color: '#0f172a', textAlign: 'center' },
  hint:  { textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 },
  sub:   { fontWeight: 400, color: '#9ca3af', fontSize: '12px' },
  stepper: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '28px' },
  stepItem: { display: 'flex', alignItems: 'center' },
  line: { height: '2px', width: '52px', marginBottom: '22px', flexShrink: 0 },
  stepCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  circle: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 },
  stepLabel: { fontSize: '11px', whiteSpace: 'nowrap' },
  form:  { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '-4px' },
  input: { padding: '11px 13px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', color: '#0f172a', background: '#fafafa', width: '100%', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '4px' },
  btnPrimary: { flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: '#1a56db', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%' },
  btnDanger:  { flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' },
  btnGhost:   { flex: 1, padding: '13px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' },
  accountRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  accountCard: { flex: 1, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' },
  accountCardLabel: { fontSize: '11px', fontWeight: 700, color: '#1a56db', marginBottom: '4px', textTransform: 'uppercase' },
  accountName: { margin: '0 0 2px', fontWeight: 700, fontSize: '13px', color: '#0f172a' },
  accountNo:   { margin: '0 0 6px', fontSize: '11px', color: '#6b7280', wordBreak: 'break-all' },
  badge: { background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' },
  arrow: { fontSize: '20px', color: '#1a56db', flexShrink: 0 },
  resultBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' },
  iconSuccess: { width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' },
  iconError:   { width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' },
  infoCard: { width: '100%', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '12px 16px', textAlign: 'left' },
  infoRow:  { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' },
  infoLabel: { color: '#6b7280', fontWeight: 500 },
  infoValue:  { color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
  errorBox: { width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', textAlign: 'left', boxSizing: 'border-box' },
  errorTitle: { margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#dc2626' },
  errorMsg:   { margin: 0, fontSize: '14px', color: '#b91c1c', lineHeight: 1.5 },
  errorCode:  { margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' },
  reversedNote: { margin: '6px 0 0', fontSize: '12px', color: '#d97706', fontWeight: 600 },
};
