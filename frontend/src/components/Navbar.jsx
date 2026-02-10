// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchMe, logoutUser } from "../services/authApi.js";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Initial session check on mount
  useEffect(() => {
    let ignore = false;

    async function check() {
      try {
        const res = await fetchMe(); // { user }
        if (!ignore) setUser(res.user);
      } catch {
        if (!ignore) setUser(null); // silently logged out
      } finally {
        if (!ignore) setChecking(false);
      }
    }

    check();

    // Auth event listeners
    function onLogin(e) {
      // Optimistic UI update
      if (e?.detail?.user) setUser(e.detail.user);
      // Optionally confirm by calling /me (uncomment if you want)
      // check();
    }

    function onLogout() {
      setUser(null);
    }

    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);

    return () => {
      ignore = true;
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
    };
  }, []);

  async function onLogoutClick() {
    try {
      await logoutUser();
      // 🔔 tell the app we logged out
      window.dispatchEvent(new Event("auth:logout"));
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">
        <Link to="/" className="navbar-brand">News<b>App</b></Link>

        <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon" />
        </button>

        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink to="/" end className="nav-link">Home</NavLink></li>
            <li className="nav-item"><NavLink to="/search" className="nav-link">Search</NavLink></li>
            {/* Show Favorites only when logged in */}
            {!checking && user && (
              <li className="nav-item"><NavLink to="/favorites" className="nav-link">Favorites</NavLink></li>
            )}
          </ul>

          <ul className="navbar-nav">
            {checking ? null : user ? (
              <>
                <li className="nav-item d-flex align-items-center">
                  <span className="navbar-text me-2">Hi, {user.name}</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-secondary btn-sm" onClick={onLogoutClick}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink to="/login" className="nav-link">Login</NavLink></li>
                <li className="nav-item"><NavLink to="/register" className="nav-link">Register</NavLink></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}