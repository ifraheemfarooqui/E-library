import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export function useAdmin() {
  const [isAdmin, setIsAdmin]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.is_admin || false);
      setLoading(false);
    });
  }, []);

  return { isAdmin, loading };
}