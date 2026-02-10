import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authApi.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
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
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // On success, redirect to Login (or auto-login later)
      navigate("/login?registered=1");
    } catch (error) {
      // Attempt to surface server message if any
      const message =
        error?.response?.data?.message ||
        "Registration failed. Please try again.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-7 col-lg-6 col-xl-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title mb-3">Create your account</h2>
            <p className="text-muted">
              Register to save favorites and personalize your news feed.
            </p>

            {err && (
              <div className="alert alert-danger" role="alert">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={onChange}
                  required
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    className="form-control"
                    value={form.password}
                    onChange={onChange}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
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

              <div className="mb-3">
                <label className="form-label" htmlFor="confirm">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type={showPwd ? "text" : "password"}
                  className="form-control"
                  value={form.confirm}
                  onChange={onChange}
                  required
                  minLength={8}
                  placeholder="Re-type your password"
                />
              </div>

              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <div className="text-center mt-3">
              <small className="text-muted">
                Already have an account? <Link to="/login">Log in</Link>
              </small>
            </div>
          </div>
        </div>

        <p className="text-muted small mt-3">
          By creating an account, you agree to our Terms and acknowledge the
          Privacy Policy.
        </p>
      </div>
    </div>
  );
}
