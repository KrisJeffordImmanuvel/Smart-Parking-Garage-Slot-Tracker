// api.js
// -----------------------------------------------------------------------------
// All communication with the Express backend is in this one file.
// Each function sends an HTTP request and returns the JSON answer.
// -----------------------------------------------------------------------------

async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const api = {
  getStatus: () => request('GET', '/api/status'),
  enter: () => request('POST', '/api/enter'),
  exit: () => request('POST', '/api/exit'),
  toggleSlot: (id) => request('POST', `/api/slot/${id}`),
  setSwitch: (values) => request('POST', '/api/switch', values), // e.g. { E: 1 }
  getHistory: () => request('GET', '/api/history'),
  getTruthTable: () => request('GET', '/api/truth-table'),
  reset: () => request('POST', '/api/reset'),

  // Hardware Design page
  getDesign: () => request('GET', '/api/design'),
  fsmStep: (values) => request('POST', '/api/fsm/step', values), // { state, V, A, S }
  getDebounceDemo: () => request('GET', '/api/debounce-demo'),
  getVerilog: () => request('GET', '/api/verilog'),
};
