import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, updateProfile } from "../services/authApi.js";
import {
  validateEmail,
  validatePassword,
  validateName,
  checkPasswordStrength,
} from "../utils/validation.js";

export default function Profile() {
  const navigate = useNavigate();

  // User data
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // UI states
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info or password
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Real-time validation
  const validation = useMemo(() => {
    const nameCheck = validateName(name);
    const emailCheck = validateEmail(email);
    const passwordCheck = newPassword
      ? validatePassword(newPassword)
      : { valid: true, message: "" };
    const confirmMatch = newPassword === confirmPassword;

    return {
      name: nameCheck,
      email: emailCheck,
      password: passwordCheck,
      confirm: {
        valid: confirmMatch || !confirmPassword,
        message:
          confirmMatch || !confirmPassword ? "" : "Passwords do not match",
      },
    };
  }, [name, email, newPassword, confirmPassword]);

  const passwordStrength = useMemo(
    () => checkPasswordStrength(newPassword),
    [newPassword],
  );

  // ✅ Only show "Member since" if this resolves to a valid date string
  const joinedDate = useMemo(() => {
    if (!user?.createdAt) return null;
    const d = new Date(user.createdAt);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
  }, [user]);

  // Fetch current user data
  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const res = await fetchMe();
        if (!ignore) {
          setUser(res.user);
          setName(res.user.name);
          setEmail(res.user.email);
        }
      } catch (e) {
        if (!ignore) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  async function handleUpdateInfo(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validation.name.valid) {
      setError(validation.name.message);
      setTouched((t) => ({ ...t, name: true }));
      return;
    }
    if (!validation.email.valid) {
      setError(validation.email.message);
      setTouched((t) => ({ ...t, email: true }));
      return;
    }

    try {
      setUpdating(true);
      const data = await updateProfile({
        name: name.trim(),
        email: email.trim(),
      });
      setUser(data.user);
      setSuccess("Profile updated successfully!");
      window.dispatchEvent(
        new CustomEvent("auth:login", { detail: { user: data.user } }),
      );
    } catch (e) {
      const msg =
        e.response?.data?.error?.message || "Failed to update profile";
      setError(msg);
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setTouched((t) => ({ ...t, newPassword: true, confirmPassword: true }));

    if (!currentPassword) return setError("Current password is required");
    if (!newPassword) return setError("New password is required");
    if (!validation.password.valid) return setError(validation.password.message);
    if (!validation.confirm.valid) return setError(validation.confirm.message);
    if (currentPassword === newPassword) {
      return setError("New password must be different from current password");
    }

    try {
      setUpdating(true);
      await updateProfile({ currentPassword, newPassword });
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPwd(false);
      setTouched({ ...touched, newPassword: false, confirmPassword: false });
    } catch (e) {
      const msg =
        e.response?.data?.error?.message || "Failed to update password";
      setError(msg);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <h2 className="mb-4">My Profile</h2>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            />
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess(null)}
            />
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "info" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("info");
                setError(null);
                setSuccess(null);
              }}
            >
              Personal Info
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "password" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("password");
                setError(null);
                setSuccess(null);
              }}
            >
              Change Password
            </button>
          </li>
        </ul>

        {/* Personal Info Tab */}
        {activeTab === "info" && (
          <div className="card card-surface">
            <div className="card-body">
              <form onSubmit={handleUpdateInfo}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`form-control ${
                      touched.name
                        ? validation.name.valid
                          ? "is-valid"
                          : "is-invalid"
                        : ""
                    }`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    required
                  />
                  {touched.name && !validation.name.valid && (
                    <div className="invalid-feedback d-block">
                      {validation.name.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${
                      touched.email
                        ? validation.email.valid
                          ? "is-valid"
                          : "is-invalid"
                        : ""
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                  />
                  {touched.email && !validation.email.valid && (
                    <div className="invalid-feedback d-block">
                      {validation.email.message}
                    </div>
                  )}
                  <small className="text-muted">
                    Changing your email will require verification
                  </small>
                </div>

                {/* ✅ Only render if we have a valid date */}
                {joinedDate && (
                  <div className="mb-3">
                    <small className="text-muted">
                      Member since: {joinedDate}
                    </small>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    updating ||
                    !validation.name.valid ||
                    !validation.email.valid
                  }
                >
                  {updating ? "Updating..." : "Update Info"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="card card-surface">
            <div className="card-body">
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <div className="input-group">
                    <input
                      id="currentPassword"
                      type={showPwd ? "text" : "password"}
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => setShowPwd((s) => !s)}
                    >
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type={showPwd ? "text" : "password"}
                    className={`form-control ${
                      touched.newPassword
                        ? validation.password.valid
                          ? "is-valid"
                          : "is-invalid"
                        : ""
                    }`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, newPassword: true }))
                    }
                    required
                  />

                  {newPassword && (
                    <div className="mt-2">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <small className="text-muted">Strength:</small>
                        <span className={`badge bg-${passwordStrength.color}`}>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      <div className="progress" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar bg-${passwordStrength.color}`}
                          role="progressbar"
                          style={{
                            width: `${(passwordStrength.score / 4) * 100}%`,
                          }}
                        />
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="small text-muted mt-1">
                          <ul className="mb-0 ps-3">
                            {passwordStrength.feedback.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {touched.newPassword && !validation.password.valid && (
                    <div className="text-danger small mt-1">
                      {validation.password.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPwd ? "text" : "password"}
                    className={`form-control ${
                      touched.confirmPassword
                        ? validation.confirm.valid
                          ? "is-valid"
                          : "is-invalid"
                        : ""
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, confirmPassword: true }))
                    }
                    required
                  />
                  {touched.confirmPassword && !validation.confirm.valid && (
                    <div className="invalid-feedback d-block">
                      {validation.confirm.message}
                    </div>
                  )}
                </div>

                <div className="alert alert-info small">
                  <strong>Security tip:</strong> Use a strong, unique password.
                  Consider using a password manager.
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    updating ||
                    !currentPassword ||
                    !validation.password.valid ||
                    !validation.confirm.valid
                  }
                >
                  {updating ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}