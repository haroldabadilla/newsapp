// src/pages/Register.jsx
import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authApi.js";
import {
  validateEmail,
  validatePassword,
  validateName,
  checkPasswordStrength,
} from "../utils/validation.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });

  const validation = useMemo(() => {
    const nameCheck = validateName(form.name);
    const emailCheck = validateEmail(form.email);
    const passwordCheck = validatePassword(form.password);
    const confirmMatch = form.password === form.confirm;
    return {
      name: nameCheck,
      email: emailCheck,
      password: passwordCheck,
      confirm: {
        valid: confirmMatch && form.confirm.length > 0,
        message: confirmMatch || !form.confirm ? "" : "Passwords do not match",
      },
    };
  }, [form]);

  const passwordStrength = useMemo(() => checkPasswordStrength(form.password), [form.password]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (err) setErr(null);
  }
  function onBlur(field) { setTouched((t) => ({ ...t, [field]: true })); }

  function validate() {
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!validation.name.valid) return validation.name.message;
    if (!validation.email.valid) return validation.email.message;
    if (!validation.password.valid) return validation.password.message;
    if (!validation.confirm.valid) return validation.confirm.message;
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    const msg = validate();
    if (msg) { setErr(msg); return; }
    try {
      setLoading(true);
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login?registered=1");
    } catch (error) {
      const message = error?.response?.data?.message || "Registration failed. Please try again.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-7 col-lg-6 col-xl-5">
        <div className="card card-surface shadow-sm">
          <div className="card-body">
            <h2 className="card-title mb-3">Create your account</h2>
            <p className="text-muted">Register to save favorites and personalize your news feed.</p>

            {err && <div className="alert alert-danger" role="alert">{err}</div>}

            <form onSubmit={onSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="name">Full name</label>
                <input
                  id="name" name="name" className={`form-control ${touched.name ? (validation.name.valid ? "is-valid" : "is-invalid") : ""}`}
                  value={form.name} onChange={onChange} onBlur={() => onBlur("name")} required placeholder="e.g. Alex Johnson"
                />
                {touched.name && !validation.name.valid && (
                  <div className="invalid-feedback d-block">{validation.name.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  className={`form-control ${touched.email ? (validation.email.valid ? "is-valid" : "is-invalid") : ""}`}
                  value={form.email} onChange={onChange} onBlur={() => onBlur("email")} required placeholder="you@example.com"
                />
                {touched.email && !validation.email.valid && (
                  <div className="invalid-feedback d-block">{validation.email.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-group">
                  <input
                    id="password" name="password" type={showPwd ? "text" : "password"}
                    className={`form-control ${touched.password ? (validation.password.valid ? "is-valid" : "is-invalid") : ""}`}
                    value={form.password} onChange={onChange} onBlur={() => onBlur("password")} required placeholder="Create a strong password"
                  />
                  <button type="button" className="btn btn-outline-light" onClick={() => setShowPwd((s) => !s)} aria-label={showPwd ? "Hide password" : "Show password"}>
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>

                {form.password && (
                  <div className="mt-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <small className="text-muted">Strength:</small>
                      <span className={`badge bg-${passwordStrength.color}`}>{passwordStrength.strength}</span>
                    </div>
                    <div className="progress" style={{ height: "4px" }}>
                      <div className={`progress-bar bg-${passwordStrength.color}`} role="progressbar" style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="small text-muted mt-1">
                        <ul className="mb-0 ps-3">
                          {passwordStrength.feedback.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {touched.password && !validation.password.valid && (
                  <div className="text-danger small mt-1">{validation.password.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm" name="confirm" type={showPwd ? "text" : "password"}
                  className={`form-control ${touched.confirm ? (validation.confirm.valid ? "is-valid" : "is-invalid") : ""}`}
                  value={form.confirm} onChange={onChange} onBlur={() => onBlur("confirm")} required placeholder="Re-type your password"
                />
                {touched.confirm && !validation.confirm.valid && (
                  <div className="invalid-feedback d-block">{validation.confirm.message}</div>
                )}
              </div>

              <button className="btn btn-accent w-100" disabled={loading}>
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
          By creating an account, you agree to our Terms and acknowledge the Privacy Policy.
        </p>
      </div>
    </div>
  );
}