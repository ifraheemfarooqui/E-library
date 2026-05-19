import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authed | unauthed
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check token on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("authed");
      } else {
        setStatus("unauthed");
        navigate("/login", { replace: true });
      }
    });

    // 2. Listen for token changes (logout, expiry, new login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setStatus("unauthed");
          navigate("/login", { replace: true });
        } else {
          setStatus("authed");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking token
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#0e0c1a] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"/>
        <p className="text-[#9b8fc0] text-sm">Checking session...</p>
      </div>
    );
  }

  // Token missing — render nothing (redirect already fired)
  if (status === "unauthed") return null;

  // Token valid — show the page
  return children;
}