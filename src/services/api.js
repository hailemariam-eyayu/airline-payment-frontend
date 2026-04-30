const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Channel identifies which frontend this request came from (IB, MB, USSD, etc.)
// Set VITE_CHANNEL in .env — never hardcode it here.
const CHANNEL  = import.meta.env.VITE_CHANNEL || "IB";

// Helper: add channel to any payload
const withChannel = (payload) => ({ ...payload, channel: CHANNEL });

export const airlineService = {
  // POST /airline/validate  { orderid, channel }
  validateOrder: async (orderid) => {
    const response = await fetch(`${BASE_URL}/airline/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ orderid })),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: false, message: 'Invalid JSON response from server' };
    }
    return result;
  },

  // POST /airline/confirm  { orderid, beneficiaryAcno, amount, remark, channel }
  confirmPayment: async ({ orderid, beneficiaryAcno, amount, remark }) => {
    const response = await fetch(`${BASE_URL}/airline/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ orderid, beneficiaryAcno, amount, remark })),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = { status: 'Error', message: 'Invalid JSON response from server' };
    }
    return result;
  },
};

export const rideService = {
  // POST /ride/query  { phone, channel }
  queryAccount: async (phone) => {
    const response = await fetch(`${BASE_URL}/ride/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ phone })),
    });
    let body;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    const message =
      body.message ??
      body.data?.message ??
      body.error ??
      (response.ok ? 'Success' : `HTTP ${response.status}`);

    return {
      ...body,
      message,
      httpStatus: response.status,
      status: body.status ?? (response.ok ? 'Success' : 'Error'),
    };
  },

  // POST /ride/pay  { auditId, phone, amount, drAcNo, remark, billRefNo, channel }
  pay: async ({ auditId, phone, amount, drAcNo, remark, billRefNo }) => {
    const response = await fetch(`${BASE_URL}/ride/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ auditId, phone, amount: Number(amount), drAcNo, remark, billRefNo })),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = { status: 'Error', message: 'Invalid JSON response from server' };
    }
    return { ...result, httpStatus: response.status };
  },
};

export const a2aService = {
  // POST /a2a/validate  { drAcNo, crAcNo, channel }
  validateAccounts: async ({ drAcNo, crAcNo }) => {
    const response = await fetch(`${BASE_URL}/a2a/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ drAcNo, crAcNo })),
    });
    let result;
    try { result = await response.json(); }
    catch { result = { status: 'Error', message: 'Invalid JSON response from server' }; }
    return { ...result, httpStatus: response.status };
  },

  // POST /a2a/transfer  { drAcNo, crAcNo, amount, narrative, channel }
  transfer: async ({ drAcNo, crAcNo, amount, narrative }) => {
    const response = await fetch(`${BASE_URL}/a2a/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withChannel({ drAcNo, crAcNo, amount: Number(amount), narrative })),
    });
    let result;
    try { result = await response.json(); }
    catch { result = { status: 'Error', message: 'Invalid JSON response from server' }; }
    return { ...result, httpStatus: response.status };
  },
};
