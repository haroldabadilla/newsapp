// src/pages/Login.jsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authApi.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get("next") || "/",
    [location.search]
  );

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    const msg = validate();
    if (msg) return setErr(msg);

    try {
      setLoading(true);
      const res = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      // 🔔 tell the app we are logged in
      window.dispatchEvent(new CustomEvent("auth:login", { detail: { user: res?.user } }));
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Invalid email or password.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Login</h2>
      {err && <div className="alert alert-danger">{err}</div>}

      <form className="mt-3" onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" className="form-control" type="email" name="email"
                 value={form.email} onChange={onChange} placeholder="you@example.com" required />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-group">
            <input id="password" className="form-control" type={showPwd ? "text" : "password"}
                   name="password" value={form.password} onChange={onChange} required minLength={8} />
            <button type="button" className="btn btn-outline-secondary"
                    onClick={() => setShowPwd((s) => !s)}>
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <div className="text-center mt-3">
        <small className="text-muted">Don’t have an account? <Link to="/register">Register</Link></small>
      </div>
    </>
  );
}