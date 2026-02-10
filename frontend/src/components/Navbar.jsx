// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchMe, logoutUser } from "../services/authApi.js";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchMe(); // { user: {...} }
        if (!ignore) setUser(res.user);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setChecking(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function onLogout() {
    try {
      await logoutUser();
      setUser(null);
      // After logout, ensure UI hides Favorites and shows Login/Register
      navigate("/", { replace: true });
    } catch (e) {
      // Optional: surface an error toast/alert
      console.error("Logout failed", e);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">
        <Link to="/" className="navbar-brand">
          News<b>App</b>
        </Link>

        <button
          className="navbar-toggler"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/search" className="nav-link">
                Search
              </NavLink>
            </li>

            {/* Show Favorites only when logged in */}
            {!checking && user && (
              <li className="nav-item">
                <NavLink to="/favorites" className="nav-link">
                  Favorites
                </NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav">
            {/* While checking session, avoid flicker (optional: show a subtle placeholder) */}
            {checking ? null : user ? (
              <>
                <li className="nav-item d-flex align-items-center">
                  <span className="navbar-text me-2">Hi, {user.name}</span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
