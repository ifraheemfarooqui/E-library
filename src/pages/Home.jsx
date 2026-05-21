import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Layout from "../components/Layout";

export default function Home() {
  const [stats, setStats]   = useState({ total: 0, reading: 0, finished: 0, hours: 0 });
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_books").select("progress, last_page")
      .eq("user_id", user.id);
    if (data) {
      setStats({
        total:    data.length,
        reading:  data.filter(b => b.progress > 0 && b.progress < 100).length,
        finished: data.filter(b => b.progress === 100).length,
        hours:    Math.round(data.reduce((s, b) => s + (b.last_page || 0), 0) / 30),
      });
    }
    const { data: books } = await supabase
      .from("user_books").select("*, books(*)")
      .eq("user_id", user.id)
      .order("last_read", { ascending: false })
      .limit(4);
    setRecent(books || []);
  };

  return (
    <Layout title="Home">
      <h2 className="font-[Cormorant_Garamond] text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-1">
        Good evening 👋
      </h2>
      <p className="text-[#9b8fc0] text-xs sm:text-sm mb-4 sm:mb-6">
        Here's what's happening in your library
      </p>

      {/* Stats — 2 cols always */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[
          ["📚", "Total Books",  stats.total,    "in your list"],
          ["🔖", "Reading",      stats.reading,  "in progress"],
          ["✅", "Finished",     stats.finished, "completed"],
          ["⏱️", "Hours Read",   stats.hours,    "this month"],
        ].map(([icon, label, val, sub]) => (
          <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-[#9b8fc0] mb-1">{icon} {label}</p>
            <p className="text-xl sm:text-2xl font-medium text-white">{val}</p>
            <p className="text-[10px] sm:text-xs text-[#6c5ce7] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Continue reading */}
      {recent.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm text-[#9b8fc0] font-medium">Continue reading</p>
            <button onClick={() => navigate("/my-books")}
              className="text-xs text-[#6c5ce7] hover:text-[#a78bfa] transition">
              See all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {recent.filter(b => b.progress < 100).slice(0, 4).map((item) => {
              const book = item.books;
              if (!book) return null;
              return (
                <div key={item.id}
                  onClick={() => navigate(`/reader/${book.id}`)}
                  className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3 cursor-pointer hover:border-[#6c5ce7]/40 transition">
                  <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex-shrink-0 overflow-hidden bg-[#2D1B69] flex items-center justify-center text-lg">
                    {book.cover_url
                      ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover"/>
                      : "📖"
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{book.title}</p>
                    <p className="text-[11px] sm:text-xs text-[#9b8fc0] mb-2 truncate">{book.author}</p>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6c5ce7] rounded-full"
                        style={{ width: `${item.progress || 0}%` }}/>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[#9b8fc0] mt-1">{item.progress || 0}% complete</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recent.length === 0 && (
        <div className="text-center py-12 text-[#9b8fc0]">
          <div className="text-4xl mb-3 opacity-30">📚</div>
          <p className="text-sm mb-3">You haven't read anything yet</p>
          <button onClick={() => navigate("/library")}
            className="bg-[#6c5ce7] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#7c6cf0] transition">
            Browse Library
          </button>
        </div>
      )}
    </Layout>
  );
}