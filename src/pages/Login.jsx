import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/library");
    }
  };

  return (
    <div className="flex min-h-screen font-[Outfit] bg-[#0e0c1a]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[44%] bg-[#13102b] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full bg-[#6c5ce7] -top-20 -left-20 blur-[80px] opacity-40 pointer-events-none"/>
        <div className="absolute w-48 h-48 rounded-full bg-[#a855f7] bottom-10 -right-10 blur-[60px] opacity-30 pointer-events-none"/>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-white text-lg">📚</div>
          <span className="font-[Cormorant_Garamond] text-2xl font-semibold text-white tracking-wide">Libraeum</span>
        </div>
        <div className="relative z-10">
          <h2 className="font-[Cormorant_Garamond] text-4xl font-semibold text-white leading-tight mb-4">
            Your world of<br /><em className="text-[#a78bfa]">infinite stories</em><br />awaits.
          </h2>
          <p className="text-sm text-[#9b8fc0] leading-relaxed">Thousands of books, PDFs, and journals — all in one beautifully crafted reading space.</p>
          <div className="flex gap-4 mt-6">
            {[["12k+","Books"],["340+","Categories"],["Free","Forever"]].map(([n,l])=>(
              <div key={l} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <div className="text-white font-medium text-lg">{n}</div>
                <div className="text-[#9b8fc0] text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex gap-1.5 items-end">
          {[["18px","60px","#6c5ce7"],["14px","72px","#a855f7"],["20px","50px","#1D9E75"],["12px","80px","#D85A30"],["16px","65px","#D4537E"],["22px","55px","#378ADD"],["14px","75px","#EF9F27"]].map(([w,h,c],i)=>(
            <div key={i} className="rounded-sm opacity-70" style={{width:w,height:h,background:c}}/>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit mb-8">
            <span className="px-5 py-1.5 bg-[#6c5ce7] text-white text-sm rounded-md">Sign in</span>
            <Link to="/signup" className="px-5 py-1.5 text-[#9b8fc0] text-sm hover:text-white transition">Sign up</Link>
          </div>
          <h1 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-[#9b8fc0] mb-6">Sign in to continue reading</p>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-[#f09595] mb-4">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] focus:bg-[#6c5ce7]/10 transition"/>
            </div>
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] focus:bg-[#6c5ce7]/10 transition"/>
            </div>
            <button type="submit"
              className="w-full bg-[#6c5ce7] hover:bg-[#7c6cf0] text-white rounded-lg py-2.5 text-sm font-medium transition mt-2">
              Sign in to library
            </button>
          </form>
          <p className="text-xs text-[#9b8fc0] text-center mt-5">
            No account? <Link to="/signup" className="text-[#a78bfa] hover:underline">Create one free →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}