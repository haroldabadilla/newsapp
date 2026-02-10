import axios from "axios";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true, // ← needed for session cookies
});

export async function registerUser({ name, email, password }) {
  const { data } = await auth.post("/register", { name, email, password });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await auth.post("/login", { email, password });
  return data;
}

export async function logoutUser() {
  await auth.post("/logout");
}

export async function fetchMe() {
  const { data } = await auth.get("/me");
  return data;
}
