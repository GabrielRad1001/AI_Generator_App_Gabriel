import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("otsai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  signup: (data) => api.post("/auth/signup", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  googleSession: (session_id) => api.post("/auth/google/session", { session_id }).then((r) => r.data),
};

export const projects = {
  list: () => api.get("/projects").then((r) => r.data),
  create: (data) => api.post("/projects", data).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, data) => api.patch(`/projects/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
};

export const generate = {
  models: () => api.get("/generate/models").then((r) => r.data),
  run: (data) => api.post("/generate", data).then((r) => r.data),
  list: (limit = 50) => api.get(`/generations?limit=${limit}`).then((r) => r.data),
};

export const credits = {
  me: () => api.get("/credits/me").then((r) => r.data),
};

export const admin = {
  stats: () => api.get("/admin/stats").then((r) => r.data),
  users: (q = "") => api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.data),
  user: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  adjust: (data) => api.post("/admin/credits/adjust", data).then((r) => r.data),
  audit: () => api.get("/admin/audit").then((r) => r.data),
  projects: () => api.get("/admin/projects").then((r) => r.data),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role?role=${role}`).then((r) => r.data),
};
