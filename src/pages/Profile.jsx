import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Layout from "../components/Layout";

export default function Profile() {
  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState({ total: 0, finished: 0, hours: 0 });
  const [name, setName]       = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setName(data.user.user_metadata?.full_name || "");
        fetchStats(data.user.id);
      }
    });
  }, []);

  const fetchProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  setUser(user);
  setName(profile?.full_name || "");
};

  const fetchStats = async (userId) => {
    const { data } = await supabase
      .from("user_books")
      .select("progress, last_page")
      .eq("user_id", userId);

    if (data) {
      setStats({
        total:    data.length,
        finished: data.filter(b => b.progress === 100).length,
        hours:    Math.round(data.reduce((sum, b) => sum + (b.last_page || 0), 0) / 30),
      });
    }
  };

const handleSave = async () => {
  setSaving(true);
  await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
  await supabase.auth.updateUser({ data: { full_name: name } });
  setSaving(false);
  setEditing(false);
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <Layout title="Profile">
      <h2 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">
        Profile
      </h2>
      <p className="text-[#9b8fc0] text-sm mb-8">Your account and reading stats</p>

      {/* Profile card */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#6c5ce7] flex items-center justify-center text-2xl font-medium flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          {editing ? (
            <input value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#6c5ce7] transition w-64 mb-1"/>
          ) : (
            <p className="text-lg font-medium text-white mb-0.5">{name || "User"}</p>
          )}
          <p className="text-sm text-[#9b8fc0]">{user?.email}</p>
          {msg && <p className="text-xs text-[#5DCAA5] mt-1">{msg}</p>}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-[#9b8fc0] hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 bg-[#6c5ce7] hover:bg-[#7c6cf0] rounded-lg text-sm text-white transition disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="px-4 py-1.5 bg-[#6c5ce7] hover:bg-[#7c6cf0] rounded-lg text-sm text-white transition">
              Edit profile
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["📚", "Books in library", stats.total],
          ["✅", "Books finished",   stats.finished],
          ["⏱️", "Hours reading",    stats.hours],
        ].map(([icon, label, val]) => (
          <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-5 text-center">
            <p className="text-3xl font-medium text-white mb-1">{val}</p>
            <p className="text-xs text-[#9b8fc0]">{icon} {label}</p>
          </div>
        ))}
      </div>

      {/* Account details */}
      <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden mb-6">
        <p className="text-xs text-[#9b8fc0] uppercase tracking-widest px-5 py-3 border-b border-white/5">
          Account details
        </p>
        {[
          ["Full name",     name || "—"],
          ["Email",         user?.email || "—"],
          ["Member since",  user?.created_at
            ? new Date(user.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})
            : "—"],
          ["Role",          "Reader"],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-b-0">
            <span className="text-sm text-[#9b8fc0]">{label}</span>
            <span className="text-sm text-white">{val}</span>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
        <p className="text-xs text-[#9b8fc0] uppercase tracking-widest px-5 py-3 border-b border-white/5">
          Account actions
        </p>
        <button onClick={handleLogout}
          className="flex items-center justify-between w-full px-5 py-3.5 text-sm text-[#f09595] hover:bg-red-500/5 transition text-left">
          Sign out of Libraeum
          <span className="text-lg">→</span>
        </button>
      </div>
    </Layout>
  );
}