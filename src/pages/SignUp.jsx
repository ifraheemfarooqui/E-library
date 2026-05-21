import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [isAdmin, setIsAdmin]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8)  return setError("Password must be at least 8 characters.");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (signUpError) throw signUpError;

      // ✅ Set is_admin in profiles table if toggled
      if (data?.user && isAdmin) {
        await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", data.user.id);
      }

      setSuccess("Account created! You can now sign in.");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen font-[Outfit] bg-[#0e0c1a]">

      {/* Left panel */}
      <div className="hidden lg:flex w-[44%] bg-[#13102b] flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full bg-[#6c5ce7] -top-20 -left-20 blur-[80px] opacity-40 pointer-events-none"/>
        <div className="absolute w-48 h-48 rounded-full bg-[#a855f7] bottom-10 -right-10 blur-[60px] opacity-30 pointer-events-none"/>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#6c5ce7] rounded-lg flex items-center justify-center text-white text-lg">📚</div>
          <span className="font-[Cormorant_Garamond] text-2xl font-semibold text-white tracking-wide">Libraeum</span>
        </div>

        <div className="relative z-10">
          <h2 className="font-[Cormorant_Garamond] text-4xl font-semibold text-white leading-tight mb-4">
            Join thousands of<br /><em className="text-[#a78bfa]">passionate readers</em><br />today.
          </h2>
          <p className="text-sm text-[#9b8fc0] leading-relaxed">Free forever. No credit card. Just books.</p>
        </div>

        <div className="relative z-10 flex gap-1.5 items-end">
          {[
            ["18px","60px","#6c5ce7"],["14px","72px","#a855f7"],
            ["20px","50px","#1D9E75"],["12px","80px","#D85A30"],
            ["16px","65px","#D4537E"],["22px","55px","#378ADD"],
            ["14px","75px","#EF9F27"]
          ].map(([w,h,c],i) => (
            <div key={i} className="rounded-sm opacity-70" style={{width:w,height:h,background:c}}/>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit mb-8">
            <Link to="/login" className="px-5 py-1.5 text-[#9b8fc0] text-sm hover:text-white transition">
              Sign in
            </Link>
            <span className="px-5 py-1.5 bg-[#6c5ce7] text-white text-sm rounded-md">
              Sign up
            </span>
          </div>

          <h1 className="font-[Cormorant_Garamond] text-3xl font-semibold text-white mb-1">
            Join Libraeum
          </h1>
          <p className="text-sm text-[#9b8fc0] mb-6">Free forever — no credit card needed</p>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-xs text-[#f09595] mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 text-xs text-green-400 mb-4">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">
                Full name
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Jane Smith" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs text-[#9b8fc0] uppercase tracking-wide mb-1.5 block">
                Confirm password
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a4f7a] focus:outline-none focus:border-[#6c5ce7] transition"/>
            </div>

            {/* Admin toggle */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                    isAdmin ? "bg-[#6c5ce7]" : "bg-white/20"
                  }`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${
                    isAdmin ? "left-5" : "left-0.5"
                  }`}/>
                </div>
                <div>
                  <p className="text-sm text-white">Sign up as Admin</p>
                  <p className="text-xs text-[#9b8fc0]">Can upload and manage books</p>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button type="submit"
              className="w-full bg-[#6c5ce7] hover:bg-[#7c6cf0] text-white rounded-lg py-2.5 text-sm font-medium transition">
              {isAdmin ? "Create Admin Account" : "Create my account"}
            </button>
          </form>

          <p className="text-xs text-[#9b8fc0] text-center mt-5">
            Already a member?{" "}
            <Link to="/login" className="text-[#a78bfa] hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}