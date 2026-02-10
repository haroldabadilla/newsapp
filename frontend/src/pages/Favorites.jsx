import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner.jsx";

const auth = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

export default function Favorites() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        await auth.get("/me"); // OK → logged in
        if (!ignore) {
          setAllowed(true);
          setChecking(false);
        }
      } catch (e) {
        if (!ignore) {
          setAllowed(false);
          setChecking(false);
          // Redirect to login with `next` so we can return here after login
          navigate(`/login?next=/favorites`, { replace: true });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="my-5">
        <Spinner label="Checking your session…" size="lg" />
      </div>
    );
  }

  if (!allowed) return null; // we'll already be navigating to /login

  // --- Your real favorites UI will go here ---
  return (
    <>
      <h2>Favorites</h2>
      <p className="text-muted">Your saved articles will appear here.</p>
      {/* TODO: fetch & render /api/favorites once you’re ready */}
    </>
  );
}
