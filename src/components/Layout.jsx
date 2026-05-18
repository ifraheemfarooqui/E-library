import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import { useAdmin } from "../hooks/useAdmin";

const navItems = [
  { key: "home",    label: "Home",     icon: "🏠", path: "/home" },
  { key: "library", label: "Library",  icon: "📚", path: "/library" },
  { key: "mybooks", label: "My Books", icon: "🔖", path: "/my-books" },
  { key: "profile", label: "Profile",  icon: "👤", path: "/profile" },
];

export default function Layout({ children, title }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user, setUser] = useState(null);
  const { isAdmin } = useAdmin();


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initials = user?.user_metadata?.full_name
    ?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-[#0e0c1a] font-[Outfit] text-white">

      {/* Sidebar */}
      <aside className="w-56 bg-[#13102b] border-r border-white/5 flex flex-col py-6 px-3 flex-shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-base flex-shrink-0">📚</div>
          <span className="font-[Cormorant_Garamond] text-xl font-semibold">Libraeum</span>
        </div>

        {/* Nav links */}
        <p className="text-[10px] text-[#5a4f7a] uppercase tracking-widest px-3 mb-2">Menu</p>
        <nav className="flex flex-col gap-0.5 mb-4">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.key} onClick={() => navigate(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition w-full text-left ${
                  active ? "bg-[#6c5ce7] text-white" : "text-[#9b8fc0] hover:bg-white/5 hover:text-white"
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <hr className="border-white/5 my-2"/>

        <p className="text-[10px] text-[#5a4f7a] uppercase tracking-widest px-3 mb-2">Settings</p>
        <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9b8fc0] hover:bg-white/5 hover:text-white transition w-full text-left">
          ⚙️ Preferences
        </button>
        <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9b8fc0] hover:bg-white/5 hover:text-white transition w-full text-left">
          ❓ Help
        </button>
        {isAdmin && (
  <button onClick={() => navigate("/admin")}
    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9b8fc0] hover:bg-white/5 hover:text-white transition w-full text-left">
    ⚙️ Admin
  </button>
)}

        {/* User */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition"
            onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-[#a855f7] flex items-center justify-center text-xs font-medium flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-[#9b8fc0]">Sign out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-7 py-4 border-b border-white/5">
          <h1 className="text-base font-medium text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-[#9b8fc0] text-sm">🔍</span>
              <input placeholder="Search books..."
                className="bg-transparent outline-none text-white text-sm w-40 placeholder-[#5a4f7a]"/>
            </div>
            <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer text-[#9b8fc0] hover:text-white transition relative">
              🔔
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6c5ce7] rounded-full"/>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-7 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}