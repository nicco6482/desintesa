const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.join(" | ") || data.message || "Error de API");
  }
  return data;
}

export const api = {
  getOrders: () => request("/orders"),
  createOrder: (payload) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateOrder: (id, payload) =>
    request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteOrder: (id) =>
    request(`/orders/${id}`, {
      method: "DELETE"
    }),
  getDashboard: (clientId) => request(`/dashboard/${clientId}`),
  getAgenda: () => request("/agenda"),
  getChemicals: () => request("/chemicals"),
  issueCertificate: (id) =>
    request(`/orders/${id}/issue-certificate`, {
      method: "POST"
    }),
  getCertificate: (id) => request(`/orders/${id}/certificate`)
};
