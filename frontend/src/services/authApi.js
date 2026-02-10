// src/services/authApi.js
import axios from "axios";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true, // session cookie
});

export async function registerUser({ name, email, password }) {
  const { data } = await auth.post("/register", { name, email, password });
  return data; // { success, user }
}

export async function loginUser({ email, password }) {
  const { data } = await auth.post("/login", { email, password });
  return data; // { success, user }
}

export async function logoutUser() {
  await auth.post("/logout");
}

export async function fetchMe() {
  const { data } = await auth.get("/me");
  return data; // { user }
}