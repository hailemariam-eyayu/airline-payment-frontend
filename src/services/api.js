const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const airlineService = {
  // POST /airline/validate  { orderid: "ABCDFE" }
  validateOrder: async (orderid) => {
    const response = await fetch(`${BASE_URL}/airline/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderid }),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: false, message: 'Invalid JSON response from server' };
    }
    return result;
  },

  // POST /airline/confirm  { orderid, beneficiaryAcno, amount, remark }
  confirmPayment: async ({ orderid, beneficiaryAcno, amount, remark }) => {
    const response = await fetch(`${BASE_URL}/airline/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderid, beneficiaryAcno, amount, remark }),
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
  // POST /ride/query  { phone }
  queryAccount: async (phone) => {
    const response = await fetch(`${BASE_URL}/ride/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      result = { status: 'Error', message: 'Invalid JSON response from server' };
    }
    return { ...result, httpStatus: response.status };
  },

  // POST /ride/pay  { phone, amount, drAcNo, drBranch, remark, billRefNo }
  pay: async ({ phone, amount, drAcNo, drBranch, remark, billRefNo }) => {
    const response = await fetch(`${BASE_URL}/ride/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount: Number(amount), drAcNo, drBranch, remark, billRefNo }),
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
