// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { fetchMe, logoutUser } from "../services/authApi.js";

// Theme helpers
import { getTheme, toggleTheme } from "../utils/theme.js";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [theme, setTheme] = useState(() => getTheme());

  useEffect(() => {
    let ignore = false;

    async function check() {
      try {
        const res = await fetchMe(); // { user }
        if (!ignore) setUser(res.user);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setChecking(false);
      }
    }
    check();

    function onLogin(e) {
      if (e?.detail?.user) setUser(e.detail.user);
    }
    function onLogout() {
      setUser(null);
    }

    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);

    // Sync theme if it changes in another tab
    function onStorage(e) {
      if (e.key === "newsapp_theme" && e.newValue) setTheme(e.newValue);
    }
    window.addEventListener("storage", onStorage);

    return () => {
      ignore = true;
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  async function onLogoutClick() {
    try {
      await logoutUser();
      window.dispatchEvent(new Event("auth:logout"));
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  function onToggleTheme() {
    const next = toggleTheme();
    setTheme(next);
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-dark-custom">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span className="brand-base">News</span>
          <b className="brand-accent">App</b>
        </Link>

        <button
          className="navbar-toggler"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-label="Toggle navigation"
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

            {!checking && user && (
              <>
                <li className="nav-item">
                  <NavLink to="/favorites" className="nav-link">
                    Favorites
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/profile" className="nav-link">
                    Profile
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav align-items-center gap-2">
            {/* Icon-only theme toggle (keeps an accessible label) */}
            <li className="nav-item">
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                <i
                  className={theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars-fill"}
                  aria-hidden="true"
                />
                <span className="visually-hidden">
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
              </button>
            </li>

            {checking ? null : user ? (
              <>
                <li className="nav-item d-flex align-items-center">
                  <span className="navbar-text me-2">Hi, {user.name}</span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={onLogoutClick}
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