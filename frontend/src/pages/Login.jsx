import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authApi.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Optional success banner if redirected from Register
  const justRegistered = useMemo(
    () => new URLSearchParams(location.search).get("registered") === "1",
    [location.search],
  );

  // Where to go after login (e.g., /favorites)
  const nextPath = useMemo(
    () => new URLSearchParams(location.search).get("next") || "/",
    [location.search],
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setLoading(true);
      await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // ✅ Success → go to `next` or home
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

      {justRegistered && (
        <div className="alert alert-success" role="alert">
          Registration successful! You can log in now.
        </div>
      )}

      {err && (
        <div className="alert alert-danger" role="alert">
          {err}
        </div>
      )}

      <form className="mt-3" onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="form-control"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <div className="input-group">
            <input
              id="password"
              className="form-control"
              type={showPwd ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="Your password"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary w-100"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="d-inline-flex align-items-center gap-2">
              <span>Signing in…</span>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <div className="text-center mt-3">
        <small className="text-muted">
          Don’t have an account? <Link to="/register">Register</Link>
        </small>
      </div>
    </>
  );
}
