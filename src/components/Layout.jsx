import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import { useAdmin } from "../hooks/useAdmin";

const navItems = [
  { key: "home",    label: "Home",    icon: "🏠", path: "/home" },
  { key: "library", label: "Library", icon: "📚", path: "/library" },
  { key: "mybooks", label: "My Books",icon: "🔖", path: "/my-books" },
  { key: "profile", label: "Profile", icon: "👤", path: "/profile" },
];

export default function Layout({ children, title }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAdmin } = useAdmin();
  const [user, setUser] = useState(null);
  // ✅ closed by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
    // ✅ close sidebar on mobile when route changes
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleNav = (path) => {
    navigate(path);
    // close sidebar on mobile after nav
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const initials = user?.user_metadata?.full_name
    ?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-[#0e0c1a] font-[Outfit] text-white relative">

      {/* ── Backdrop overlay on mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}/>
      )}

      {/* ── Sidebar ── */}
<aside className={`
  fixed md:relative top-0 left-0 h-100% z-30
  ${sidebarOpen ? "w-56 px-3" : "w-0 px-0 overflow-hidden"}
  bg-[#13102b] border-r border-white/5
  flex flex-col py-6
  flex-shrink-0 transition-all duration-300
  rounded-r-2xl
`}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-base flex-shrink-0">📚</div>
          <span className="font-[Cormorant_Garamond] text-xl font-semibold whitespace-nowrap">Libraeum</span>
        </div>

        {/* Nav */}
        <p className="text-[10px] text-[#5a4f7a] uppercase tracking-widest px-3 mb-2 whitespace-nowrap">Menu</p>
        <nav className="flex flex-col gap-0.5 mb-4">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.key} onClick={() => handleNav(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition w-full text-left whitespace-nowrap ${
                  active ? "bg-[#6c5ce7] text-white" : "text-[#9b8fc0] hover:bg-white/5 hover:text-white"
                }`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <hr className="border-white/5 my-2"/>

        {isAdmin && (
          <button onClick={() => handleNav("/admin")}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition w-full text-left whitespace-nowrap mt-1 ${
              location.pathname === "/admin" ? "bg-[#6c5ce7] text-white" : "text-[#9b8fc0] hover:bg-white/5 hover:text-white"
            }`}>
            🛡️ Admin
          </button>
        )}

        {/* User */}
        <div className="mt-auto">
          <div onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition">
            <div className="w-8 h-8 rounded-full bg-[#a855f7] flex items-center justify-center text-xs font-medium flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-[#9b8fc0]">Sign out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 w-full">

        {/* Topbar */}
        <header className="flex items-center px-3 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex-shrink-0 relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#9b8fc0] hover:text-white hover:bg-white/10 transition flex-shrink-0 z-10">
            {sidebarOpen ? "←" : "☰"}
          </button>
          <h1 className="absolute left-0 right-0 text-center text-sm sm:text-base font-medium text-white pointer-events-none">
            {title}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-5 md:p-7 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}