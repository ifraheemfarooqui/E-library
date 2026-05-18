import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser]         = useState(null);
  const navigate                = useNavigate();

  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        setChecking(false);
      }
    });

    // Listen for auth changes (logout, token expiry etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Show nothing while checking
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center">
        <div className="text-[#9b8fc0] text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return children;
}